<?php

namespace Tests;

use Database\Seeders\TestDatabaseSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Ha egy teszt a RefreshDatabase trait-et használja, automatikusan
     * lefut a TestDatabaseSeeder a migráció után — így minden teszt
     * egy tiszta, de adatokkal feltöltött adatbázist kap.
     */
    protected bool $seed = true;
    protected string $seeder = TestDatabaseSeeder::class;
}

