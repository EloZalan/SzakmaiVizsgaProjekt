<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $fillable = [
        'table_id',
        'guest_name',
        'phone_number',
        'start_time',
        'guest_count',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'guest_count' => 'integer',
    ];

    public function table() {
        return $this->belongsTo(Table::class);
    }
}
