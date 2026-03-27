<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('menu_categories', function (Blueprint $table) {
            $table->string('name_hu')->nullable()->after('name');
            $table->string('name_en')->nullable()->after('name_hu');
        });

        Schema::table('menu_items', function (Blueprint $table) {
            $table->string('name_hu')->nullable()->after('name');
            $table->string('name_en')->nullable()->after('name_hu');
        });

        DB::table('menu_categories')->update([
            'name_hu' => DB::raw('name'),
            'name_en' => DB::raw('name'),
        ]);

        DB::table('menu_items')->update([
            'name_hu' => DB::raw('name'),
            'name_en' => DB::raw('name'),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn(['name_hu', 'name_en']);
        });

        Schema::table('menu_categories', function (Blueprint $table) {
            $table->dropColumn(['name_hu', 'name_en']);
        });
    }
};
