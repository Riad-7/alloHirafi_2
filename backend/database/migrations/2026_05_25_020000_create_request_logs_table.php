<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('request_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('method', 10);
            $table->string('path', 1024)->nullable();
            $table->unsignedSmallInteger('status_code');
            $table->unsignedInteger('duration_ms');
            $table->string('ip_address', 64)->nullable();
            $table->string('user_agent', 1024)->nullable();
            $table->timestamps();

            $table->index(['created_at', 'status_code']);
            $table->index('path');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_logs');
    }
};
