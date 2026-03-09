<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MenuItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // return all items with their category relationship
        $items = MenuItem::with('menuCategory')->get();

        return response()->json(['items' => $items]);
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
            'category_id' => 'required|exists:menu_categories,id',
        ]);

        $item = MenuItem::create($request->only([
            'name',
            'description',
            'price',
            'category_id',
        ]));

        return response()->json(['item' => $item], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(MenuItem $menu_item)
    {
        $menu_item->load('menuCategory');
        return response()->json(['item' => $menu_item]);
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
            'category_id' => 'required|exists:menu_categories,id',
        ]);

        $menu_item->update($request->only([
            'name',
            'description',
            'price',
            'category_id',
        ]));

        return response()->json(['item' => $menu_item]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MenuItem $menu_item)
    {
        $menu_item->delete();

        return response()->json([], 204);
    }
}
