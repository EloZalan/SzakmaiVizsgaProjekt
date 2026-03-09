<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    protected $fillable = [
        'capacity',
    ];

    protected $casts = [
        'capacity' => 'integer',
    ];

    protected $appends = ['status'];

    public function orders() {
        return $this->hasMany(Order::class);
    }

    public function reservations() {
        return $this->hasMany(Reservation::class);
    }

    public function getStatusAttribute()
    {
        $now = now();

        $hasActiveOrder = $this->orders()
            ->where('status', '!=', 'done')
            ->exists();

        if ($hasActiveOrder) {
            return 'occupied';
        }

        $bufferStart = $now->copy()->subHours(2);
        $bufferEnd = $now->copy()->addHours(2);

        $hasReservedWindow = $this->reservations()
            ->whereDoesntHave('order', function ($q) {
                $q->where('status', 'done');
            })
            ->where('start_time', '<=', $bufferEnd)
            ->where('end_time', '>=', $bufferStart)
            ->exists();

        return $hasReservedWindow ? 'reserved' : 'available';
    }


}
