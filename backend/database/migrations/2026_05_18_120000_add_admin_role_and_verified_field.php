<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite doesn't support ALTER COLUMN for enums, so we add a check
        // For SQLite we just allow any string value; for MySQL the enum would apply.
        // Since the existing column is already there, we add is_verified to artisans.

        Schema::table('artisans', function (Blueprint $table) {
            $table->boolean('is_verified')->default(false)->after('average_rating');
        });
    }

    public function down(): void
    {
        Schema::table('artisans', function (Blueprint $table) {
            $table->dropColumn('is_verified');
        });
    }
};
