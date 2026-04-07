<?php

return [
    'meta' => [
        'description' => 'Reservation request payloads used by feature tests.',
        'locale' => 'hu',
    ],
    'store_valid' => [
        'guest_name' => 'Fixture Vendeg',
        'phone_number' => '+36305550123',
        'guest_count' => 2,
        'start_time' => now()->addDays(3)->toIso8601String(),
        'note' => 'Fixture alapu foglalas',
    ],
    'store_large_party' => [
        'guest_name' => 'Nagy Tarsasag',
        'phone_number' => '+36305550124',
        'guest_count' => 6,
        'start_time' => now()->addDays(4)->toIso8601String(),
        'note' => 'Nagyobb asztalt igenyel',
    ],
    'store_invalid_phone' => [
        'guest_name' => 'Hibas Telefonszam',
        'phone_number' => '12345',
        'guest_count' => 2,
        'start_time' => now()->addDays(3)->toIso8601String(),
        'note' => 'Validacios hibahoz hasznalhato',
    ],
    'store_missing_guest_name' => [
        'phone_number' => '+36305550125',
        'guest_count' => 2,
        'start_time' => now()->addDays(5)->toIso8601String(),
    ],
    'walk_in_valid' => [
        'guest_count' => 4,
    ],
    'update_note' => [
        'note' => 'Fixture frissitett megjegyzes',
    ],
];
