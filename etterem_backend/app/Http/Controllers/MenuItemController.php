<?php

namespace App\Http\Controllers;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Http\Request;
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
        ]);

        $item = MenuItem::create([
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'price' => $request->input('price'),
            'category_id' => $this->resolveCategoryId($request->input('category_id')),
        ]);

        $item->load('menuCategory');

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
        ]);

        $menu_item->update([
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'price' => $request->input('price'),
            'category_id' => $this->resolveCategoryId($request->input('category_id')),
        ]);

        $menu_item->load('menuCategory');

        return response()->json($this->serializeMenuItem($menu_item), 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MenuItem $menu_item)
    {
        $menu_item->delete();

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
        ];
    }
}
