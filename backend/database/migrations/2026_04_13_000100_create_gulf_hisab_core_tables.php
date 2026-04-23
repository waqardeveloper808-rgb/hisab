<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('legal_name');
            $table->string('trade_name')->nullable();
            $table->string('tax_number', 32)->nullable();
            $table->string('registration_number', 64)->nullable();
            $table->string('country_code', 2)->default('SA');
            $table->string('base_currency', 3)->default('SAR');
            $table->string('locale', 10)->default('en');
            $table->string('timezone')->default('Asia/Riyadh');
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('code', 20);
            $table->string('name');
            $table->string('city')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->unique(['company_id', 'code']);
        });

        Schema::create('company_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 40);
            $table->json('permissions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'user_id']);
        });

        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('default_branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->string('default_language', 10)->default('en');
            $table->string('invoice_prefix', 20)->default('TINV');
            $table->string('quotation_prefix', 20)->default('QUO');
            $table->string('proforma_prefix', 20)->default('PRO');
            $table->string('credit_note_prefix', 20)->default('CRN');
            $table->string('payment_prefix', 20)->default('PAY');
            $table->string('default_receivable_account_code', 20)->default('1100');
            $table->string('default_revenue_account_code', 20)->default('4000');
            $table->string('default_cash_account_code', 20)->default('1210');
            $table->string('default_vat_payable_account_code', 20)->default('2200');
            $table->string('default_vat_receivable_account_code', 20)->default('2210');
            $table->string('zatca_environment', 20)->default('sandbox');
            $table->json('numbering_rules')->nullable();
            $table->timestamps();

            $table->unique('company_id');
        });

        Schema::create('tax_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('code', 30);
            $table->string('name');
            $table->string('scope', 30)->default('taxable');
            $table->decimal('rate', 5, 2)->default(0);
            $table->string('zatca_code', 30)->nullable();
            $table->boolean('is_default_sales')->default(false);
            $table->boolean('is_default_purchase')->default(false);
            $table->timestamps();

            $table->unique(['company_id', 'code']);
        });

        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('code', 20);
            $table->string('name');
            $table->timestamps();

            $table->unique(['company_id', 'code']);
        });

        Schema::create('payment_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('days_due')->default(0);
            $table->timestamps();
        });

        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('code', 20);
            $table->string('name');
            $table->string('type', 20);
            $table->string('subtype', 50)->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->boolean('allows_posting')->default(true);
            $table->boolean('is_system')->default(false);
            $table->timestamps();

            $table->unique(['company_id', 'code']);
        });

        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20);
            $table->string('display_name');
            $table->string('legal_name')->nullable();
            $table->string('tax_number', 32)->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 40)->nullable();
            $table->json('billing_address')->nullable();
            $table->string('currency_code', 3)->nullable();
            $table->foreignId('payment_term_id')->nullable()->constrained('payment_terms')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20)->default('product');
            $table->string('sku', 64)->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->foreignId('tax_category_id')->nullable()->constrained('tax_categories')->nullOnDelete();
            $table->foreignId('income_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignId('expense_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->decimal('default_sale_price', 14, 2)->default(0);
            $table->decimal('default_purchase_price', 14, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('document_sequences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->string('document_type', 30);
            $table->string('prefix', 20);
            $table->unsignedBigInteger('next_number')->default(1);
            $table->unsignedSmallInteger('padding')->default(5);
            $table->string('reset_frequency', 20)->default('never');
            $table->timestamps();

            $table->unique(['company_id', 'branch_id', 'document_type']);
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->foreignId('source_document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->string('type', 30);
            $table->string('status', 30)->default('draft');
            $table->unsignedBigInteger('sequence_number')->nullable();
            $table->string('document_number', 40)->nullable();
            $table->string('currency_code', 3)->default('SAR');
            $table->decimal('exchange_rate', 14, 6)->default(1);
            $table->date('issue_date')->nullable();
            $table->date('supply_date')->nullable();
            $table->date('due_date')->nullable();
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('discount_total', 14, 2)->default(0);
            $table->decimal('taxable_total', 14, 2)->default(0);
            $table->decimal('tax_total', 14, 2)->default(0);
            $table->decimal('grand_total', 14, 2)->default(0);
            $table->decimal('paid_total', 14, 2)->default(0);
            $table->decimal('balance_due', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->string('compliance_uuid', 64)->nullable();
            $table->string('compliance_status', 30)->nullable();
            $table->json('compliance_metadata')->nullable();
            $table->timestamp('finalized_at')->nullable();
            $table->foreignId('finalized_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('cancelled_at')->nullable();
            $table->unsignedBigInteger('posted_journal_entry_id')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();

            $table->unique(['company_id', 'document_number']);
            $table->index(['company_id', 'type', 'status']);
            $table->index(['company_id', 'issue_date']);
        });

        Schema::create('document_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->unsignedInteger('line_number');
            $table->foreignId('item_id')->nullable()->constrained('items')->nullOnDelete();
            $table->foreignId('tax_category_id')->nullable()->constrained('tax_categories')->nullOnDelete();
            $table->foreignId('ledger_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->text('description');
            $table->decimal('quantity', 14, 4)->default(0);
            $table->decimal('unit_price', 14, 4)->default(0);
            $table->decimal('discount_amount', 14, 2)->default(0);
            $table->decimal('net_amount', 14, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('tax_amount', 14, 2)->default(0);
            $table->decimal('gross_amount', 14, 2)->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('entry_number', 40)->unique();
            $table->string('status', 20)->default('posted');
            $table->date('entry_date');
            $table->string('source_type', 40)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->text('description')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'entry_date']);
        });

        Schema::create('journal_entry_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_entry_id')->constrained('journal_entries')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('accounts')->restrictOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->foreignId('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->text('description')->nullable();
            $table->decimal('debit', 14, 2)->default(0);
            $table->decimal('credit', 14, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('received_into_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->string('direction', 20)->default('incoming');
            $table->string('status', 20)->default('posted');
            $table->string('payment_number', 40)->nullable();
            $table->string('method', 30)->default('bank_transfer');
            $table->string('reference', 80)->nullable();
            $table->date('payment_date');
            $table->string('currency_code', 3)->default('SAR');
            $table->decimal('amount', 14, 2);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->foreignId('document_id')->constrained('documents')->restrictOnDelete();
            $table->decimal('amount', 14, 2);
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event', 60);
            $table->string('auditable_type', 120);
            $table->unsignedBigInteger('auditable_id');
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->json('context')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['auditable_type', 'auditable_id']);
            $table->index(['company_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('payment_allocations');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('journal_entry_lines');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('document_lines');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('document_sequences');
        Schema::dropIfExists('items');
        Schema::dropIfExists('contacts');
        Schema::dropIfExists('accounts');
        Schema::dropIfExists('payment_terms');
        Schema::dropIfExists('units');
        Schema::dropIfExists('tax_categories');
        Schema::dropIfExists('company_settings');
        Schema::dropIfExists('company_user');
        Schema::dropIfExists('branches');
        Schema::dropIfExists('companies');
    }
};