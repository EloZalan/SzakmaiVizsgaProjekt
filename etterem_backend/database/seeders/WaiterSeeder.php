<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class WaiterSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Seeder Waiter',
            'email' => 'seeder@waiter.com',
            'password' => Hash::make('password123'),
            'role' => 'waiter',
        ]);

        User::create([
            'name' => 'Teszt Elek',
            'email' => 'tesztelek@waiter.com',
            'password' => Hash::make('password123'),
            'role' => 'waiter',
        ]);
    }
}
