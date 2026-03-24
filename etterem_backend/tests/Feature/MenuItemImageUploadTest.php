<?php

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('admin can create a menu item with an image', function () {
    Storage::fake('public');

    $admin = User::factory()->create([
        'role' => 'admin',
    ]);
    $category = MenuCategory::create([
        'name' => 'Levesek',
    ]);

    Sanctum::actingAs($admin);

    $response = $this->postJson('/api/admin/menu-items', [
        'name' => 'Paradicsomleves',
        'description' => 'Friss bazsalikommal',
        'price' => 1490,
        'category_id' => $category->id,
        'image' => fakeMenuItemImageUpload('soup.png'),
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('name', 'Paradicsomleves')
        ->assertJsonPath('category_id', $category->id);

    $item = MenuItem::firstOrFail();

    expect($item->image_path)->not->toBeNull();

    Storage::disk('public')->assertExists($item->image_path);
    expect($response->json('image_url'))->toContain('/storage/menu-items/');
});

test('admin can remove an existing menu item image', function () {
    Storage::fake('public');

    $admin = User::factory()->create([
        'role' => 'admin',
    ]);
    $category = MenuCategory::create([
        'name' => 'Főételek',
    ]);

    $imagePath = fakeMenuItemImageUpload('steak.png')->store('menu-items', 'public');

    $item = MenuItem::create([
        'name' => 'Steak',
        'description' => 'Körettel',
        'price' => 5990,
        'category_id' => $category->id,
        'image_path' => $imagePath,
    ]);

    Sanctum::actingAs($admin);

    $response = $this->putJson("/api/admin/menu-items/{$item->id}", [
        'name' => 'Steak',
        'description' => 'Körettel',
        'price' => 5990,
        'category_id' => $category->id,
        'remove_image' => true,
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('image_url', null);

    expect($item->fresh()->image_path)->toBeNull();
    Storage::disk('public')->assertMissing($imagePath);
});

function fakeMenuItemImageUpload(string $filename = 'menu-item.png'): UploadedFile
{
    $pngBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn0nS8AAAAASUVORK5CYII=');

    $tempPath = tempnam(sys_get_temp_dir(), 'menu-item-image-');

    if ($tempPath === false) {
        throw new RuntimeException('Nem sikerült ideiglenes képfájlt létrehozni a teszthez.');
    }

    file_put_contents($tempPath, $pngBinary);

    return new UploadedFile($tempPath, $filename, 'image/png', null, true);
}