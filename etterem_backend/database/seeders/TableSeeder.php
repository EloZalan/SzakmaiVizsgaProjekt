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
                'table_number' => $i,
                'capacity' => $i < 7 ? 4 : 2,
            ]);
        }

        Table::create([
            'table_number' => 11,
            'capacity' => 6,
        ]);
        Table::create([
            'table_number' => 12,
            'capacity' => 5,
        ]);
    }
}
