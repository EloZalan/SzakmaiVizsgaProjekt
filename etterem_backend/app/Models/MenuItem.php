<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'category_id',
    ];

    protected $casts = [
        'price' => 'integer'
    ];

    public function menuCategory() {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function orderItems() {
        return $this->hasMany(OrderItem::class);
    }

}
