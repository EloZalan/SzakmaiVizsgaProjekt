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
        $hasBlockingReservation = $this->reservations()
            ->get()
            ->first(function ($reservation) use ($now) {
                $blockStart = $reservation->start_time->copy()->subHours(2);
                $blockEnd = $reservation->end_time;

                return $now->between($blockStart, $blockEnd);
            });
        return $hasBlockingReservation ? 'reserved' : 'available';
    }

}
