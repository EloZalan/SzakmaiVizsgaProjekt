<?php

namespace App\Http\Controllers;

use App\Events\MenuChanged;
use App\Models\MenuCategory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MenuCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(
            MenuCategory::where('name', '!=', MenuCategory::UNAVAILABLE_CATEGORY_NAME)
                ->orderBy('name')
                ->get()
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:menu_categories,name|not_in:' . MenuCategory::UNAVAILABLE_CATEGORY_NAME,
        ]);

        $category = MenuCategory::create([
            'name' => $request->name,
        ]);

        event(new MenuChanged('category', 'created', $category->id));

        return response()->json($category, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(MenuCategory $menu_category)
    {
        return response()->json($menu_category);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MenuCategory $menu_category)
    {
        $request->validate([
            'name' => [
                'required',
                'string',
                'not_in:' . MenuCategory::UNAVAILABLE_CATEGORY_NAME,
                Rule::unique('menu_categories', 'name')->ignore($menu_category->id),
            ],
        ]);

        $menu_category->update([
            'name' => $request->name,
        ]);

        event(new MenuChanged('category', 'updated', $menu_category->id));

        return response()->json($menu_category, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MenuCategory $menu_category)
    {
        $categoryId = $menu_category->id;
        $menu_category->delete();

        event(new MenuChanged('category', 'deleted', $categoryId));

        return response()->json("", 204);
    }
}
