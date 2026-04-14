<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cost_centers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code', 40);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['company_id', 'code']);
        });

        Schema::table('documents', function (Blueprint $table): void {
            $table->foreignId('cost_center_id')->nullable()->after('template_id')->constrained('cost_centers')->nullOnDelete();
        });

        Schema::table('document_lines', function (Blueprint $table): void {
            $table->foreignId('cost_center_id')->nullable()->after('ledger_account_id')->constrained('cost_centers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('document_lines', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('cost_center_id');
        });

        Schema::table('documents', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('cost_center_id');
        });

        Schema::dropIfExists('cost_centers');
    }
};