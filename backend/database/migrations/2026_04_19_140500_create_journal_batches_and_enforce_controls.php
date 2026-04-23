<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        Schema::create('journal_batches', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('source_type');
            $table->uuid('source_id');
            $table->string('status', 20)->default('draft');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['source_type', 'source_id']);
        });

        Schema::table('journal_entries', function (Blueprint $table): void {
            $table->foreignId('batch_id')->nullable()->after('company_id')->constrained('journal_batches')->restrictOnDelete();
        });

        if ($driver !== 'sqlite') {
            DB::statement('ALTER TABLE journal_entry_lines ALTER COLUMN account_id SET NOT NULL');
            DB::statement('ALTER TABLE journal_entry_lines ADD CONSTRAINT journal_entry_lines_debit_check CHECK (debit >= 0)');
            DB::statement('ALTER TABLE journal_entry_lines ADD CONSTRAINT journal_entry_lines_credit_check CHECK (credit >= 0)');
        }
    }

    public function down(): void
    {
        try {
            DB::statement('ALTER TABLE journal_entry_lines DROP CONSTRAINT journal_entry_lines_debit_check');
        } catch (\Throwable) {
        }

        try {
            DB::statement('ALTER TABLE journal_entry_lines DROP CONSTRAINT journal_entry_lines_credit_check');
        } catch (\Throwable) {
        }

        Schema::table('journal_entries', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('batch_id');
        });

        Schema::dropIfExists('journal_batches');
    }
};