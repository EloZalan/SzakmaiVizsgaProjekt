<?php

use App\Models\MenuCategory;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('ensureUnavailableCategory létrehozza a hiányzó rendszerkategóriát', function () {
    $category = MenuCategory::ensureUnavailableCategory();

    expect($category->name)->toBe(MenuCategory::UNAVAILABLE_CATEGORY_NAME)
        ->and($category->name_hu)->toBe(MenuCategory::UNAVAILABLE_CATEGORY_NAME)
        ->and($category->name_en)->toBe(MenuCategory::UNAVAILABLE_CATEGORY_NAME);
});

test('ensureUnavailableCategory nem hoz létre duplikált kategóriát', function () {
    $first = MenuCategory::ensureUnavailableCategory();
    $second = MenuCategory::ensureUnavailableCategory();

    expect($second->id)->toBe($first->id)
        ->and(MenuCategory::where('name', MenuCategory::UNAVAILABLE_CATEGORY_NAME)->count())->toBe(1);
});

test('hasPendingInvite igaz aktív, még nem elfogadott pincér meghívásnál', function () {
    $user = User::create([
        'name' => 'Meghívott Pincér',
        'email' => 'pending-invite@test.com',
        'password' => Hash::make('password'),
        'role' => 'waiter',
        'invite_token' => 'invite-token',
        'invite_expires_at' => now()->addDay(),
        'email_verified_at' => null,
    ]);

    expect($user->hasPendingInvite())->toBeTrue();
});

test('hasPendingInvite hamis lejárt meghívásnál', function () {
    $user = User::create([
        'name' => 'Lejárt Meghívás',
        'email' => 'expired-invite@test.com',
        'password' => Hash::make('password'),
        'role' => 'waiter',
        'invite_token' => 'expired-token',
        'invite_expires_at' => now()->subMinute(),
        'email_verified_at' => null,
    ]);

    expect($user->hasPendingInvite())->toBeFalse();
});

test('hasPendingInvite hamis ha a felhasználó már hitelesítve van', function () {
    $user = User::create([
        'name' => 'Már Aktivált',
        'email' => 'verified-invite@test.com',
        'password' => Hash::make('password'),
        'role' => 'waiter',
        'invite_token' => 'verified-token',
        'invite_expires_at' => now()->addDay(),
        'email_verified_at' => now(),
    ]);

    expect($user->hasPendingInvite())->toBeFalse();
});

test('hasPendingInvite hamis nem pincér szerepkörnél', function () {
    $user = User::create([
        'name' => 'Nem Pincér',
        'email' => 'not-waiter@test.com',
        'password' => Hash::make('password'),
        'role' => 'admin',
        'invite_token' => 'admin-token',
        'invite_expires_at' => now()->addDay(),
        'email_verified_at' => null,
    ]);

    expect($user->hasPendingInvite())->toBeFalse();
});
