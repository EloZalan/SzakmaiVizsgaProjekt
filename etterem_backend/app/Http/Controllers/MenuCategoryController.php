<?php

namespace App\Http\Controllers;

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
        return response()->json(['categories' => MenuCategory::all()]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // not used in API context
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:menu_categories,name',
        ]);

        $category = MenuCategory::create([
            'name' => $request->name,
        ]);

        return response()->json(['category' => $category], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(MenuCategory $menu_category)
    {
        return response()->json(['category' => $menu_category]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(MenuCategory $menu_category)
    {
        // not used in API context
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
                Rule::unique('menu_categories', 'name')->ignore($menu_category->id),
            ],
        ]);

        $menu_category->update([
            'name' => $request->name,
        ]);

        return response()->json(['category' => $menu_category]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MenuCategory $menu_category)
    {
        $menu_category->delete();

        return response()->json([], 204);
    }
}
