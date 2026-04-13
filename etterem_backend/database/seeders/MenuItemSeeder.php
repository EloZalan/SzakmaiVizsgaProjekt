<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class MenuItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            // Category 1: Főétel
            ['name_hu' => 'Rib-eye steak', 'name_en' => 'Rib-eye steak', 'description_hu' => 'Szaftos marha steak (200g)', 'description_en' => 'Juicy beef steak (200g)', 'price' => 8500, 'category_id' => 1, 'image_filename' => 'rib-eye.jpg'],
            ['name_hu' => 'Csirkemell', 'name_en' => 'Chicken breast', 'description_hu' => 'Grillezett csirkemell (180g)', 'description_en' => 'Grilled chicken breast (180g)', 'price' => 4900, 'category_id' => 1, 'image_filename' => 'chicken_breast.jpg'],
            ['name_hu' => 'Sertésszűz', 'name_en' => 'Pork tenderloin', 'description_hu' => 'Fokhagymás sertésszűz (200g)', 'description_en' => 'Garlic pork tenderloin (200g)', 'price' => 5200, 'category_id' => 1, 'image_filename' => 'pork.jpg'],
            ['name_hu' => 'Lazacfilé', 'name_en' => 'Salmon fillet', 'description_hu' => 'Citromos lazacfilé (180g)', 'description_en' => 'Lemon salmon fillet (180g)', 'price' => 6900, 'category_id' => 1, 'image_filename' => 'salmon_fillet.jpg'],
            ['name_hu' => 'Marhaburger', 'name_en' => 'Beef burger', 'description_hu' => 'Szaftos marhaburger kézműves buciban', 'description_en' => 'Juicy beef burger in artisan bun', 'price' => 3900, 'category_id' => 1, 'image_filename' => 'beef_burger.jpg'],

            // Category 2: Köret
            ['name_hu' => 'Sült krumpli', 'name_en' => 'French fries', 'description_hu' => '(150g)', 'description_en' => '(150g)', 'price' => 890, 'category_id' => 2, 'image_filename' => 'french_fries.jpg'],
            ['name_hu' => 'Édesburgonya', 'name_en' => 'Sweet potato fries', 'description_hu' => 'Ropogós édesburgonya hasábok (150g)', 'description_en' => 'Crispy sweet potato fries (150g)', 'price' => 1290, 'category_id' => 2, 'image_filename' => 'sweet_potato.jpg'],
            ['name_hu' => 'Grillezett zöldség', 'name_en' => 'Grilled vegetables', 'description_hu' => 'Szezonális zöldségek grillen (160g)', 'description_en' => 'Seasonal grilled vegetables (160g)', 'price' => 1490, 'category_id' => 2, 'image_filename' => 'fried_vegetables.jpg'],
            ['name_hu' => 'Jázmin rizs', 'name_en' => 'Jasmine rice', 'description_hu' => 'Párolt jázmin rizs (180g)', 'description_en' => 'Steamed jasmine rice (180g)', 'price' => 790, 'category_id' => 2, 'image_filename' => 'rice.jpg'],
            ['name_hu' => 'Steak burgonya', 'name_en' => 'Steak potatoes', 'description_hu' => 'Fűszeres steak burgonya (170g)', 'description_en' => 'Seasoned steak potatoes (170g)', 'price' => 1090, 'category_id' => 2, 'image_filename' => 'steak_potatoes.jpg'],

            // Category 3: Desszert
            ['name_hu' => 'Tiramisu', 'name_en' => 'Tiramisu', 'description_hu' => 'Olasz módra (150g)', 'description_en' => 'Italian style (150g)', 'price' => 2190, 'category_id' => 3, 'image_filename' => 'tiramisu.jpg'],
            ['name_hu' => 'Sajttorta', 'name_en' => 'Cheesecake', 'description_hu' => 'Krémes sajttorta gyümölcsraguval', 'description_en' => 'Creamy cheesecake with fruit coulis', 'price' => 1990, 'category_id' => 3, 'image_filename' => 'cheesecake.jpg'],
            ['name_hu' => 'Brownie', 'name_en' => 'Brownie', 'description_hu' => 'Csokoládés brownie vaníliafagyival', 'description_en' => 'Chocolate brownie with vanilla ice cream', 'price' => 1890, 'category_id' => 3, 'image_filename' => 'brownie.jpg'],
            ['name_hu' => 'Almás pite', 'name_en' => 'Apple pie', 'description_hu' => 'Házi almás pite fahéjjal', 'description_en' => 'Homemade apple pie with cinnamon', 'price' => 1690, 'category_id' => 3, 'image_filename' => 'apple_pie.jpg'],
            ['name_hu' => 'Somlói galuska', 'name_en' => 'Hungarian trifle', 'description_hu' => 'Klasszikus somlói galuska', 'description_en' => 'Classic Hungarian trifle', 'price' => 1790, 'category_id' => 3, 'image_filename' => 'somloi.jpg'],

            // Category 4: Ital
            ['name_hu' => 'Coca Cola', 'name_en' => 'Coca Cola', 'description_hu' => 'Az igazi (250ml)', 'description_en' => 'The real one (250ml)', 'price' => 550, 'category_id' => 4, 'image_filename' => 'coca-cola.jpg'],
            ['name_hu' => 'Ásványvíz', 'name_en' => 'Mineral water', 'description_hu' => '(500ml)', 'description_en' => '(500ml)', 'price' => 390, 'category_id' => 4, 'image_filename' => 'water.jpg'],
            ['name_hu' => 'Limonádé', 'name_en' => 'Lemonade', 'description_hu' => 'Friss citromos limonádé (400ml)', 'description_en' => 'Fresh lemonade (400ml)', 'price' => 990, 'category_id' => 4, 'image_filename' => 'lemonade.jpg'],
            ['name_hu' => 'Narancslé', 'name_en' => 'Orange juice', 'description_hu' => '100% narancslé (300ml)', 'description_en' => '100% orange juice (300ml)', 'price' => 890, 'category_id' => 4, 'image_filename' => 'orange_juice.jpg'],
            ['name_hu' => 'Jeges tea', 'name_en' => 'Iced tea', 'description_hu' => 'Barackos jeges tea (400ml)', 'description_en' => 'Peach iced tea (400ml)', 'price' => 790, 'category_id' => 4, 'image_filename' => 'ice_tea.jpg'],
        ];

        foreach ($items as $item) {
            MenuItem::create([
                'name' => $item['name_hu'],
                'name_hu' => $item['name_hu'],
                'name_en' => $item['name_en'],
                'description' => $item['description_hu'],
                'description_hu' => $item['description_hu'],
                'description_en' => $item['description_en'],
                'price' => $item['price'],
                'category_id' => $item['category_id'],
                'image_path' => isset($item['image_filename']) ? $this->seedImage($item['image_filename']) : null,
            ]);
        }
    }

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
