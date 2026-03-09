<?php

namespace App\Http\Controllers;

use App\Models\Table;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TableController extends Controller
{
    public function index() {
        return response()->json(['tables' => Table::all()]);
    }

    public function store(Request $request) {
        $request->validate([
            'capacity' => 'required|integer|min:1',
        ]);

        $table = Table::create([
            'capacity' => $request->capacity,
        ]);

        return response()->json(['table' => $table], 201);
    }

    public function show(Table $table) {
        return response()->json(['table' => $table]);
    }

    public function update(Request $request, Table $table) {
        $request->validate([
            'capacity' => 'required|integer|min:1',
        ]);

        $table->update([
            'capacity' => $request->capacity,
        ]);

        return response()->json(['table' => $table]);
    }

    public function destroy(Table $table) {
        $table->delete();

        return response()->json([], 204);
    }
}
