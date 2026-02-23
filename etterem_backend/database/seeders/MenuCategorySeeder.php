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
            'name' => 'main dish'
        ]);
        MenuCategory::create([
            'name' => 'side dish'
        ]);
        MenuCategory::create([
            'name' => 'dessert'
        ]);
        MenuCategory::create([
            'name' => 'drink'
        ]);
    }
}
