<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    protected $fillable = [
        'table_number',
        'capacity',
        'status'
    ];

    protected $casts = [
        'capacity' => 'integer',
        'table_number' => 'integer'
    ];

    protected $appends = ['status'];

    public function orders() {
        return $this->hasMany(Order::class);
    }

    public function reservations() {
        return $this->hasMany(Reservation::class);
    }

    public function getStatusAttribute() {
        $now = now();

        $hasActiveOrder = $this->orders()
            ->where('status', '!=', 'done')
            ->exists();

        if ($hasActiveOrder) {
            return 'reserved';
        }

        $hasUpcomingReservation = $this->reservations()
            ->whereBetween('start_time', [$now, $now->copy()->addHours(2)])
            ->exists();

        if ($hasUpcomingReservation) {
            return 'reserved';
        }

        return 'available';
    }


}
