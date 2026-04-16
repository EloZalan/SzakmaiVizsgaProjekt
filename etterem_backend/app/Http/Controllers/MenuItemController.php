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
        $request = request();

        return response()->json(
            MenuItem::with('menuCategory')
                ->orderBy('name')
                ->get()
                ->map(fn (MenuItem $item) => $this->serializeMenuItem($item, $request))
        );
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $request = request();

        return response()->json(
            MenuItem::with('menuCategory')
                ->whereHas('menuCategory', function ($query) {
                    $query->where('name', '!=', MenuCategory::UNAVAILABLE_CATEGORY_NAME);
                })
                ->orderBy('category_id')
                ->orderBy('name')
                ->get()
                ->map(fn (MenuItem $item) => $this->serializeMenuItem($item, $request))
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'sometimes|required|string',
            'name_hu'     => 'sometimes|required|string',
            'name_en'     => 'sometimes|required|string',
            'description' => 'nullable|string',
            'description_hu' => 'nullable|string',
            'description_en' => 'nullable|string',
            'price'       => 'required|integer|min:0',
            'category_id' => 'nullable|exists:menu_categories,id',
            'image' => 'nullable|image|max:5120',
            'remove_image' => 'nullable|boolean',
            'source_item_id' => 'nullable|exists:menu_items,id',
        ]);

        [$nameHu, $nameEn] = $this->resolveNames($request);
        [$descriptionHu, $descriptionEn] = $this->resolveDescriptions($request);

        if ($nameHu === '' || $nameEn === '') {
            return response()->json([
                'message' => $this->t([
                    'hu' => 'Kérlek adj meg legalább egy tétel nevet (HU vagy EN).',
                    'en' => 'Please provide at least one item name (HU or EN).',
                ], $request),
            ], 422);
        }

        $item = MenuItem::create([
            'name' => $nameHu,
            'name_hu' => $nameHu,
            'name_en' => $nameEn,
            'description' => $descriptionHu,
            'description_hu' => $descriptionHu,
            'description_en' => $descriptionEn,
            'price' => $request->input('price'),
            'category_id' => $this->resolveCategoryId($request->input('category_id')),
            'image_path' => $this->resolveImagePathForStore($request),
        ]);

        $item->load('menuCategory');

        event(new MenuChanged('item', 'created', $item->id));

        return response()->json($this->serializeMenuItem($item, $request), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(MenuItem $menu_item)
    {
        $item = MenuItem::with('menuCategory')->findOrFail($menu_item->id);
        $request = request();
        return response()->json($this->serializeMenuItem($item, $request), 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MenuItem $menu_item)
    {
        $request->validate([
            'name'        => 'sometimes|required|string',
            'name_hu'     => 'sometimes|required|string',
            'name_en'     => 'sometimes|required|string',
            'description' => 'nullable|string',
            'description_hu' => 'nullable|string',
            'description_en' => 'nullable|string',
            'price'       => 'required|integer|min:0',
            'category_id' => 'nullable|exists:menu_categories,id',
            'image' => 'nullable|image|max:5120',
            'remove_image' => 'nullable|boolean',
        ]);

        [$nameHu, $nameEn] = $this->resolveNames($request, $menu_item->name_hu ?? $menu_item->name, $menu_item->name_en ?? $menu_item->name);
        [$descriptionHu, $descriptionEn] = $this->resolveDescriptions(
            $request,
            $menu_item->description_hu ?? $menu_item->description,
            $menu_item->description_en ?? $menu_item->description
        );

        if ($nameHu === '' || $nameEn === '') {
            return response()->json([
                'message' => $this->t([
                    'hu' => 'A tétel magyar és angol neve nem lehet üres.',
                    'en' => 'Item Hungarian and English names cannot be empty.',
                ], $request),
            ], 422);
        }

        $imagePath = $menu_item->image_path;

        if ($request->boolean('remove_image') && $imagePath !== null) {
            $this->deleteStoredImage($imagePath);
            $imagePath = null;
        }

        if ($request->hasFile('image')) {
            $imagePath = $this->replaceStoredImage($request, $imagePath);
        }

        $menu_item->update([
            'name' => $nameHu,
            'name_hu' => $nameHu,
            'name_en' => $nameEn,
            'description' => $descriptionHu,
            'description_hu' => $descriptionHu,
            'description_en' => $descriptionEn,
            'price' => $request->input('price'),
            'category_id' => $this->resolveCategoryId($request->input('category_id')),
            'image_path' => $imagePath,
        ]);

        $menu_item->load('menuCategory');

        event(new MenuChanged('item', 'updated', $menu_item->id));

        return response()->json($this->serializeMenuItem($menu_item, $request), 200);
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

    private function serializeMenuItem(MenuItem $item, Request $request): array
    {
        $isUnavailable = $item->menuCategory?->name === MenuCategory::UNAVAILABLE_CATEGORY_NAME;
        $nameHu = $item->name_hu ?? $item->name;
        $nameEn = $item->name_en ?? $item->name;
        $descriptionHu = $item->description_hu ?? $item->description;
        $descriptionEn = $item->description_en ?? $item->description;

        return [
            'id' => $item->id,
            'name' => $this->localizedName($nameHu, $nameEn, $request),
            'name_hu' => $nameHu,
            'name_en' => $nameEn,
            'description' => $this->localizedName($descriptionHu ?? '', $descriptionEn ?? '', $request),
            'description_hu' => $descriptionHu,
            'description_en' => $descriptionEn,
            'price' => $item->price,
            'category_id' => $isUnavailable ? null : $item->category_id,
            'image_url' => $this->resolveImageUrl($item->image_path),
        ];
    }

    private function resolveNames(Request $request, string $fallbackHu = '', string $fallbackEn = ''): array
    {
        $name = trim((string) $request->input('name', ''));
        $nameHu = trim((string) $request->input('name_hu', $name !== '' ? $name : $fallbackHu));
        $nameEn = trim((string) $request->input('name_en', $name !== '' ? $name : $fallbackEn));

        if ($nameHu === '' && $nameEn !== '') {
            $nameHu = $nameEn;
        }

        if ($nameEn === '' && $nameHu !== '') {
            $nameEn = $nameHu;
        }

        return [$nameHu, $nameEn];
    }

    private function resolveDescriptions(Request $request, ?string $fallbackHu = null, ?string $fallbackEn = null): array
    {
        $baseDescription = $request->input('description');

        $descriptionHu = $request->input('description_hu', $baseDescription ?? $fallbackHu);
        $descriptionEn = $request->input('description_en', $baseDescription ?? $fallbackEn);

        $descriptionHu = is_string($descriptionHu) ? trim($descriptionHu) : null;
        $descriptionEn = is_string($descriptionEn) ? trim($descriptionEn) : null;

        if ($descriptionHu === '') {
            $descriptionHu = null;
        }

        if ($descriptionEn === '') {
            $descriptionEn = null;
        }

        if ($descriptionHu === null && $descriptionEn !== null) {
            $descriptionHu = $descriptionEn;
        }

        if ($descriptionEn === null && $descriptionHu !== null) {
            $descriptionEn = $descriptionHu;
        }

        return [$descriptionHu, $descriptionEn];
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

        return rtrim(request()->root(), '/') . '/storage/' . ltrim($imagePath, '/');
    }
}
