<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MenuCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        MenuCategory::create([
            'name' => 'Főétel',
            'name_hu' => 'Főétel',
            'name_en' => 'Main dish',
        ]);
        MenuCategory::create([
            'name' => 'Köret',
            'name_hu' => 'Köret',
            'name_en' => 'Side dish',
        ]);
        MenuCategory::create([
            'name' => 'Desszert',
            'name_hu' => 'Desszert',
            'name_en' => 'Dessert',
        ]);
        MenuCategory::create([
            'name' => 'Ital',
            'name_hu' => 'Ital',
            'name_en' => 'Drink',
        ]);
    }
}
