<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    protected $fillable = [
        'name',
        'name_hu',
        'name_en',
        'description',
        'price',
        'category_id',
        'image_path',
    ];

    protected $casts = [
        'price' => 'integer',
        'category_id' => 'integer',
    ];

    public function menuCategory() {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function orderItems() {
        return $this->hasMany(OrderItem::class);
    }

}
