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
        $waiters = [
            ['name' => 'Kovács Bence', 'email' => 'kovacs.bence@waiter.com'],
            ['name' => 'Nagy Dóra', 'email' => 'nagy.dora@waiter.com'],
            ['name' => 'Tóth Márk', 'email' => 'toth.mark@waiter.com'],
            ['name' => 'Varga Lilla', 'email' => 'varga.lilla@waiter.com'],
            ['name' => 'Szabó Gergő', 'email' => 'szabo.gergo@waiter.com'],
        ];

        foreach ($waiters as $waiter) {
            User::create([
                'name' => $waiter['name'],
                'email' => $waiter['email'],
                'password' => Hash::make('password123'),
                'role' => 'waiter',
                'email_verified_at' => now(),
            ]);
        }
    }
}
