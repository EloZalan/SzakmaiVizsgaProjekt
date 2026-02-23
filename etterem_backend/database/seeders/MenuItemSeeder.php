<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MenuItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        MenuItem::create([
            'name' => 'Rib-eye',
            'description' => 'Szaftos marha steak (200g)',
            'price' => 8500,
            'category_id' => 1,
        ]);

        MenuItem::create([
            'name' => 'Coca Cola',
            'description' => 'Az igazi (250ml)',
            'price' => 550,
            'category_id' => 4,
        ]);

        MenuItem::create([
            'name' => 'Saláta',
            'description' => '(100g)',
            'price' => 890,
            'category_id' => 2,
        ]);

        MenuItem::create([
            'name' => 'Tiramisu',
            'description' => 'Olasz módra (150g)',
            'price' => 2190,
            'category_id' => 3,
        ]);
    }
}
