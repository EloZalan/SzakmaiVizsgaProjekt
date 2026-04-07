<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('email_verified_at')->nullable()->after('email');
            $table->string('invite_token')->nullable()->unique()->after('remember_token');
            $table->timestamp('invite_expires_at')->nullable()->after('invite_token');
            $table->timestamp('invited_at')->nullable()->after('invite_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['email_verified_at', 'invite_token', 'invite_expires_at', 'invited_at']);
        });
    }
};
