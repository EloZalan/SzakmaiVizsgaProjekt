<?php

namespace App\Models;

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

        $activeOrderStatus = $this->orders()
            ->whereIn('status', ['in_progress', 'ready_to_pay', 'pay'])
            ->latest('updated_at')
            ->value('status');

        if ($activeOrderStatus === 'ready_to_pay' || $activeOrderStatus === 'pay') {
            return 'needs_payment';
        }

        if ($activeOrderStatus !== null) {
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
