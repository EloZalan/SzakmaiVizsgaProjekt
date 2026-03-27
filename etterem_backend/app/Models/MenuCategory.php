<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuCategory extends Model
{
    public const UNAVAILABLE_CATEGORY_NAME = '__UNAVAILABLE__';

    protected $fillable = [
        'name',
        'name_hu',
        'name_en',
    ];

    public static function ensureUnavailableCategory(): self
    {
        return static::firstOrCreate([
            'name' => self::UNAVAILABLE_CATEGORY_NAME,
        ], [
            'name_hu' => self::UNAVAILABLE_CATEGORY_NAME,
            'name_en' => self::UNAVAILABLE_CATEGORY_NAME,
        ]);
    }

    public function menuItems() {
        return $this->hasMany(MenuItem::class, 'category_id');
    }
}
