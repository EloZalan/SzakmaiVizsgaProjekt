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
        Schema::table('menu_items', function (Blueprint $table) {
            $table->text('description_hu')->nullable()->after('description');
            $table->text('description_en')->nullable()->after('description_hu');
        });

        DB::table('menu_items')
            ->whereNull('description_hu')
            ->update(['description_hu' => DB::raw('description')]);

        DB::table('menu_items')
            ->whereNull('description_en')
            ->update(['description_en' => DB::raw('description')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn(['description_hu', 'description_en']);
        });
    }
};
