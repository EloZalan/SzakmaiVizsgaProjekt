<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MenuChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string $entity = 'menu',
        public string $action = 'updated',
        public ?int $entityId = null,
    ) {
    }
}
