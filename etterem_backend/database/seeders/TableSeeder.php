<?php

namespace Database\Seeders;

use App\Models\Table;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        for ($i=1; $i < 11; $i++) {
            Table::create([
                'capacity' => $i < 7 ? 4 : 2,
            ]);
        }

        Table::create([
            'capacity' => 6,
        ]);
        Table::create([
            'capacity' => 5,
        ]);
    }
}
