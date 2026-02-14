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

    public function orders() {
        return $this->hasMany(Order::class);
    }

    public function reservations() {
        return $this->hasMany(Reservation::class);
    }
}
