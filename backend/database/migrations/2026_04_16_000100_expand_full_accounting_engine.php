<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Expand accounts table ──────────────────────────────────
        Schema::table('accounts', function (Blueprint $table) {
            $table->string('name_ar')->nullable()->after('name');
            $table->string('account_class', 30)->default('asset')->after('type');
            $table->string('group', 50)->nullable()->after('subtype');
            $table->string('normal_balance', 10)->default('debit')->after('group');
            $table->boolean('is_active')->default(true)->after('allows_posting');
            $table->string('currency', 3)->nullable()->after('is_system');
            $table->text('notes')->nullable()->after('currency');
        });

        // ── Expand journal_entries table ───────────────────────────
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->date('posting_date')->nullable()->after('entry_date');
            $table->string('reference', 80)->nullable()->after('source_id');
            $table->text('memo')->nullable()->after('description');
            $table->foreignId('created_by')->nullable()->after('posted_at')->constrained('users')->nullOnDelete();
            $table->foreignId('posted_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            $table->foreignId('reversed_from_id')->nullable()->after('posted_by')->constrained('journal_entries')->nullOnDelete();
            $table->foreignId('period_id')->nullable()->after('reversed_from_id')->constrained('accounting_periods')->nullOnDelete();
        });

        // ── Expand journal_entry_lines ────────────────────────────
        Schema::table('journal_entry_lines', function (Blueprint $table) {
            $table->unsignedInteger('line_no')->default(1)->after('id');
            $table->foreignId('inventory_item_id')->nullable()->after('document_id')->constrained('items')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->after('cost_center_id')->constrained('branches')->nullOnDelete();
            $table->string('tax_code', 30)->nullable()->after('credit');
        });

        // ── Bank statement lines ──────────────────────────────────
        Schema::create('bank_statement_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bank_account_id')->constrained('accounts')->restrictOnDelete();
            $table->date('transaction_date');
            $table->date('value_date')->nullable();
            $table->string('reference', 120)->nullable();
            $table->text('description')->nullable();
            $table->decimal('debit', 14, 2)->default(0);
            $table->decimal('credit', 14, 2)->default(0);
            $table->decimal('running_balance', 14, 2)->default(0);
            $table->string('status', 20)->default('unmatched'); // unmatched, matched, reconciled
            $table->foreignId('matched_journal_line_id')->nullable()->constrained('journal_entry_lines')->nullOnDelete();
            $table->date('reconciled_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'bank_account_id', 'transaction_date']);
            $table->index(['company_id', 'status']);
        });

        // ── Attachments (polymorphic) ─────────────────────────────
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('related_type', 60);
            $table->unsignedBigInteger('related_id');
            $table->string('file_path');
            $table->string('file_name');
            $table->string('mime_type', 80)->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->string('document_tag', 40)->default('other');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['related_type', 'related_id']);
            $table->index(['company_id', 'document_tag']);
        });

        // ── Update company_settings for new default codes ─────────
        Schema::table('company_settings', function (Blueprint $table) {
            $table->string('default_cogs_account_code', 20)->default('5010')->after('default_expense_account_code');
            $table->string('default_inventory_account_code', 20)->default('1150')->after('default_cogs_account_code');
            $table->string('default_discount_account_code', 20)->default('4500')->after('default_inventory_account_code');
            $table->string('default_bank_account_code', 20)->default('1210')->after('default_inventory_account_code');
            $table->string('default_retained_earnings_account_code', 20)->default('3200')->after('default_bank_account_code');
            $table->string('debit_note_prefix', 20)->default('DBN')->after('credit_note_prefix');
            $table->string('journal_prefix', 20)->default('JV')->after('debit_note_prefix');
        });
    }

    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn([
                'default_cogs_account_code',
                'default_inventory_account_code',
                'default_discount_account_code',
                'default_bank_account_code',
                'default_retained_earnings_account_code',
                'debit_note_prefix',
                'journal_prefix',
            ]);
        });

        Schema::dropIfExists('attachments');
        Schema::dropIfExists('bank_statement_lines');

        Schema::table('journal_entry_lines', function (Blueprint $table) {
            $table->dropColumn(['line_no', 'tax_code']);
            $table->dropConstrainedForeignId('inventory_item_id');
            $table->dropConstrainedForeignId('branch_id');
        });

        Schema::table('journal_entries', function (Blueprint $table) {
            $table->dropColumn(['posting_date', 'reference', 'memo']);
            $table->dropConstrainedForeignId('created_by');
            $table->dropConstrainedForeignId('posted_by');
            $table->dropConstrainedForeignId('reversed_from_id');
            $table->dropConstrainedForeignId('period_id');
        });

        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn(['name_ar', 'account_class', 'group', 'normal_balance', 'is_active', 'currency', 'notes']);
        });
    }
};
