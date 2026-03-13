<?php

namespace App\Http\Controllers;

use App\Models\Table;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TableController extends Controller
{
    public function index() {
        $now = now();
        $bufferStart = $now->copy()->subHours(2);
        $bufferEnd = $now->copy()->addHours(2);

        $tables = Table::all()->map(fn($table) => $this->buildTableResponse($table, $bufferStart, $bufferEnd));

        return response()->json($tables);
    }

    public function store(Request $request) {
        $request->validate([
            'capacity' => 'required|integer|min:1',
        ]);

        $table = Table::create([
            'capacity' => $request->capacity,
        ]);

        return response()->json($table, 201);
    }

    public function show(Table $table) {
        $now = now();
        $bufferStart = $now->copy()->subHours(2);
        $bufferEnd = $now->copy()->addHours(2);

        return response()->json($this->buildTableResponse($table, $bufferStart, $bufferEnd));
    }

    private function buildTableResponse(Table $table, $bufferStart, $bufferEnd): array {
        $data = $table->toArray();

        $openOrder = $table->orders()
            ->with('waiter:id,name')
            ->whereIn('status', ['in_progress', 'ready_to_pay', 'pay'])
            ->latest('created_at')
            ->first();

        if ($openOrder) {
            $data['waiter_name'] = $openOrder->waiter?->name;

            if ($openOrder->reservation_id) {
                $data['reservation'] = $table->reservations()
                    ->whereKey($openOrder->reservation_id)
                    ->first();
            }
        }

        if (!isset($data['reservation']) && $table->status === 'reserved') {
            $data['reservation'] = $table->reservations()
                ->whereDoesntHave('order', fn($q) => $q->where('status', 'done'))
                ->where('start_time', '<=', $bufferEnd)
                ->where('end_time', '>=', $bufferStart)
                ->first();
        }

        return $data;
    }

    public function update(Request $request, Table $table) {
        $request->validate([
            'capacity' => 'required|integer|min:1',
        ]);

        $table->update([
            'capacity' => $request->capacity,
        ]);

        return response()->json($table);
    }

    public function destroy(Table $table) {
        $table->delete();

        return response()->json('', 204);
    }
}
