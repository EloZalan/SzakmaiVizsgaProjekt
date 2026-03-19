<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WaiterStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $waiterId,
        public ?bool $onShift,
        public string $action = 'updated',
    ) {
    }

    public function broadcastOn(): array
    {
        return [new Channel('waiters')];
    }

    public function broadcastAs(): string
    {
        return 'waiter.status.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'waiter_id' => $this->waiterId,
            'on_shift' => $this->onShift,
            'action' => $this->action,
            'emitted_at' => now()->toIso8601String(),
        ];
    }
}
