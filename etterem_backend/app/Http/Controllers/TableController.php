<?php

namespace App\Http\Controllers;

use App\Models\Table;
use Illuminate\Http\Request;

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
        if ($response = $this->ensureTableIsAvailable($table)) {
            return $response;
        }

        $request->validate([
            'capacity' => 'required|integer|min:1',
        ]);

        $table->update([
            'capacity' => $request->capacity,
        ]);

        return response()->json($table);
    }

    public function destroy(Table $table) {
        if ($response = $this->ensureTableIsAvailable($table)) {
            return $response;
        }

        $table->delete();

        return response()->json('', 204);
    }

    private function ensureTableIsAvailable(Table $table)
    {
        if (!in_array($table->status, ['available', 'free'], true)) {
            return response()->json([
                'message' => 'Csak szabad asztal modosithato vagy torolheto.',
            ], 409);
        }

        return null;
    }
}
