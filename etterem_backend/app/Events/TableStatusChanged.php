<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TableStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $tableId,
    ) {
    }

    public function broadcastOn(): array
    {
        return [new Channel('tables')];
    }

    public function broadcastAs(): string
    {
        return 'table.status.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'table_id' => $this->tableId,
            'emitted_at' => now()->toIso8601String(),
        ];
    }
}
