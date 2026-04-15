<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WaiterStatusChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $waiterId,
        public ?bool $onShift,
        public string $action = 'updated',
    ) {
    }
}
