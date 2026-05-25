<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('error_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('method', 10)->nullable();
            $table->string('path', 1024)->nullable();
            $table->unsignedSmallInteger('status_code')->default(500);
            $table->string('exception_class', 512);
            $table->text('message')->nullable();
            $table->string('file', 1024)->nullable();
            $table->unsignedInteger('line')->nullable();
            $table->string('ip_address', 64)->nullable();
            $table->string('user_agent', 1024)->nullable();
            $table->longText('trace')->nullable();
            $table->timestamps();

            $table->index(['created_at', 'status_code']);
            $table->index('exception_class');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('error_logs');
    }
};
