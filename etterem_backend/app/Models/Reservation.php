<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Propaganistas\LaravelPhone\Casts\E164PhoneNumberCast;

class Reservation extends Model
{
    protected $fillable = [
        'table_id',
        'guest_name',
        'phone_number',
        'start_time',
        'end_time',
        'guest_count',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'guest_count' => 'integer',
        'phone_number' => E164PhoneNumberCast::class . ':HU',
    ];

    public function table() {
        return $this->belongsTo(Table::class);
    }
}
