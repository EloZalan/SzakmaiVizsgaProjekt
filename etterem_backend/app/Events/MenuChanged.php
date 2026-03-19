<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MenuChanged implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string $entity = 'menu',
        public string $action = 'updated',
        public ?int $entityId = null,
    ) {
    }

    public function broadcastOn(): array
    {
        return [new Channel('menu')];
    }

    public function broadcastAs(): string
    {
        return 'menu.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'entity' => $this->entity,
            'action' => $this->action,
            'entity_id' => $this->entityId,
            'emitted_at' => now()->toIso8601String(),
        ];
    }
}
