<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class MenuItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        MenuItem::create([
            'name' => 'Rib-eye',
            'name_hu' => 'Rib-eye steak',
            'name_en' => 'Rib-eye steak',
            'description' => 'Szaftos marha steak (200g)',
            'price' => 8500,
            'category_id' => 1,
            'image_path' => $this->seedImage('rib-eye.jpg'),
        ]);

        MenuItem::create([
            'name' => 'Coca Cola',
            'name_hu' => 'Coca Cola',
            'name_en' => 'Coca Cola',
            'description' => 'Az igazi (250ml)',
            'price' => 550,
            'category_id' => 4,
            'image_path' => $this->seedImage('coca-cola.jpg'),
        ]);

        MenuItem::create([
            'name' => 'Saláta',
            'name_hu' => 'Saláta',
            'name_en' => 'Salad',
            'description' => '(100g)',
            'price' => 890,
            'category_id' => 2,
            'image_path' => $this->seedImage('salata.jpg'),
        ]);

        MenuItem::create([
            'name' => 'Tiramisu',
            'name_hu' => 'Tiramisu',
            'name_en' => 'Tiramisu',
            'description' => 'Olasz módra (150g)',
            'price' => 2190,
            'category_id' => 3,
            'image_path' => $this->seedImage('tiramisu.jpg'),
        ]);
    }

    /**
     * Copies a seed image from database/seeders/images/ to storage/app/public/menu-items/
     * and returns the stored relative path, or null if the source file doesn't exist.
     */
    private function seedImage(string $filename): ?string
    {
        $source = database_path('seeders/images/' . $filename);

        if (! file_exists($source)) {
            return null;
        }

        $destination = 'menu-items/' . $filename;

        Storage::disk('public')->put($destination, file_get_contents($source));

        return $destination;
    }
}
