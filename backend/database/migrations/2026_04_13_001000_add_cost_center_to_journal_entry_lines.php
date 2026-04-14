<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('journal_entry_lines', function (Blueprint $table): void {
            $table->foreignId('cost_center_id')->nullable()->after('document_id')->constrained('cost_centers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('journal_entry_lines', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('cost_center_id');
        });
    }
};