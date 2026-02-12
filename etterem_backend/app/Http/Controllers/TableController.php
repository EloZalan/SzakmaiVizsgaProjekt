<?php

namespace App\Http\Controllers;

use App\Models\Table;
use Illuminate\Http\Request;

class TableController extends Controller
{
    public function getAllTable(Request $request) {
        return response()->json(['tables' => Table::all()]);
    }
}
