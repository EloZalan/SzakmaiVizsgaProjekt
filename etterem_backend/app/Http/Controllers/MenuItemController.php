<?php

namespace App\Http\Controllers;

use App\Events\MenuChanged;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MenuItemController extends Controller
{
    public function adminIndex()
    {
        return response()->json(
            MenuItem::with('menuCategory')
                ->orderBy('name')
                ->get()
                ->map(fn (MenuItem $item) => $this->serializeMenuItem($item))
        );
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(
            MenuItem::with('menuCategory')
                ->whereHas('menuCategory', function ($query) {
                    $query->where('name', '!=', MenuCategory::UNAVAILABLE_CATEGORY_NAME);
                })
                ->orderBy('category_id')
                ->orderBy('name')
                ->get()
                ->map(fn (MenuItem $item) => $this->serializeMenuItem($item))
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string',
            'description' => 'nullable|string',
            'price'       => 'required|integer|min:0',
            'category_id' => 'nullable|exists:menu_categories,id',
            'image' => 'nullable|image|max:5120',
            'remove_image' => 'nullable|boolean',
            'source_item_id' => 'nullable|exists:menu_items,id',
        ]);

        $item = MenuItem::create([
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'price' => $request->input('price'),
            'category_id' => $this->resolveCategoryId($request->input('category_id')),
            'image_path' => $this->resolveImagePathForStore($request),
        ]);

        $item->load('menuCategory');

        event(new MenuChanged('item', 'created', $item->id));

        return response()->json($this->serializeMenuItem($item), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(MenuItem $menu_item)
    {
        $item = MenuItem::with('menuCategory')->findOrFail($menu_item->id);
        return response()->json($this->serializeMenuItem($item), 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MenuItem $menu_item)
    {
        $request->validate([
            'name'        => 'required|string',
            'description' => 'nullable|string',
            'price'       => 'required|integer|min:0',
            'category_id' => 'nullable|exists:menu_categories,id',
            'image' => 'nullable|image|max:5120',
            'remove_image' => 'nullable|boolean',
        ]);

        $imagePath = $menu_item->image_path;

        if ($request->boolean('remove_image') && $imagePath !== null) {
            $this->deleteStoredImage($imagePath);
            $imagePath = null;
        }

        if ($request->hasFile('image')) {
            $imagePath = $this->replaceStoredImage($request, $imagePath);
        }

        $menu_item->update([
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'price' => $request->input('price'),
            'category_id' => $this->resolveCategoryId($request->input('category_id')),
            'image_path' => $imagePath,
        ]);

        $menu_item->load('menuCategory');

        event(new MenuChanged('item', 'updated', $menu_item->id));

        return response()->json($this->serializeMenuItem($menu_item), 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MenuItem $menu_item)
    {
        $itemId = $menu_item->id;

        if ($menu_item->image_path !== null) {
            $this->deleteStoredImage($menu_item->image_path);
        }

        $menu_item->delete();

        event(new MenuChanged('item', 'deleted', $itemId));

        return response()->json([], 204);
    }

    private function resolveCategoryId(mixed $categoryId): int
    {
        if ($categoryId === null || $categoryId === '') {
            return MenuCategory::ensureUnavailableCategory()->id;
        }

        return (int) $categoryId;
    }

    private function serializeMenuItem(MenuItem $item): array
    {
        $isUnavailable = $item->menuCategory?->name === MenuCategory::UNAVAILABLE_CATEGORY_NAME;

        return [
            'id' => $item->id,
            'name' => $item->name,
            'description' => $item->description,
            'price' => $item->price,
            'category_id' => $isUnavailable ? null : $item->category_id,
            'image_url' => $this->resolveImageUrl($item->image_path),
        ];
    }

    private function storeUploadedImage(Request $request): ?string
    {
        if (! $request->hasFile('image')) {
            return null;
        }

        return $request->file('image')->store('menu-items', 'public');
    }

    private function resolveImagePathForStore(Request $request): ?string
    {
        $uploadedImagePath = $this->storeUploadedImage($request);

        if ($uploadedImagePath !== null) {
            return $uploadedImagePath;
        }

        $sourceItemId = $request->input('source_item_id');

        if ($sourceItemId === null || $sourceItemId === '') {
            return null;
        }

        return $this->duplicateStoredImage((int) $sourceItemId);
    }

    private function replaceStoredImage(Request $request, ?string $currentImagePath): ?string
    {
        if ($currentImagePath !== null) {
            $this->deleteStoredImage($currentImagePath);
        }

        return $this->storeUploadedImage($request);
    }

    private function deleteStoredImage(string $imagePath): void
    {
        Storage::disk('public')->delete($imagePath);
    }

    private function duplicateStoredImage(int $sourceItemId): ?string
    {
        $sourceItem = MenuItem::find($sourceItemId);
        $sourcePath = $sourceItem?->image_path;

        if ($sourcePath === null || ! Storage::disk('public')->exists($sourcePath)) {
            return null;
        }

        $extension = pathinfo($sourcePath, PATHINFO_EXTENSION);
        $newPath = 'menu-items/' . Str::uuid() . ($extension !== '' ? '.' . $extension : '');

        Storage::disk('public')->copy($sourcePath, $newPath);

        return $newPath;
    }

    private function resolveImageUrl(?string $imagePath): ?string
    {
        if ($imagePath === null) {
            return null;
        }

        return request()->getSchemeAndHttpHost() . '/storage/' . ltrim($imagePath, '/');
    }
}
