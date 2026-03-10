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
        return response()->json(MenuItem::all());
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

        return response()->json($item, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(MenuItem $menu_item)
    {
        $item = MenuItem::findOrFail($menu_item->id);
        return response()->json($item, 200);
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

        return response()->json($menu_item, 200);
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
