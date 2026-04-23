<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('journal_entries', function (Blueprint $table): void {
            $table->json('metadata')->nullable()->after('memo');
        });

        Schema::table('items', function (Blueprint $table): void {
            $table->string('inventory_classification', 30)->nullable()->after('type');
            $table->foreignId('inventory_account_id')->nullable()->after('expense_account_id')->constrained('accounts')->nullOnDelete();
            $table->foreignId('cogs_account_id')->nullable()->after('inventory_account_id')->constrained('accounts')->nullOnDelete();
        });

        Schema::create('inventory_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->nullable()->constrained('items')->nullOnDelete();
            $table->foreignId('inventory_account_id')->constrained('accounts')->restrictOnDelete();
            $table->foreignId('revenue_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignId('cogs_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignId('last_journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->string('product_name');
            $table->string('material')->nullable();
            $table->string('inventory_type', 30)->default('raw_material');
            $table->string('size', 60)->nullable();
            $table->string('source', 20)->default('purchase');
            $table->string('code', 80);
            $table->decimal('quantity_on_hand', 14, 2)->default(0);
            $table->decimal('committed_quantity', 14, 2)->default(0);
            $table->decimal('reorder_level', 14, 2)->default(0);
            $table->string('batch_number', 80)->nullable();
            $table->date('production_date')->nullable();
            $table->decimal('average_unit_cost', 14, 2)->default(0);
            $table->json('attachments')->nullable();
            $table->json('document_links')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['company_id', 'code']);
            $table->index(['company_id', 'inventory_type']);
        });

        Schema::create('inventory_transactions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->string('transaction_type', 30);
            $table->string('reference', 80);
            $table->date('transaction_date');
            $table->decimal('quantity_delta', 14, 2);
            $table->decimal('unit_cost', 14, 2)->default(0);
            $table->decimal('unit_price', 14, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('tax_amount', 14, 2)->default(0);
            $table->string('reason', 120)->nullable();
            $table->string('status', 20)->default('posted');
            $table->json('attachments')->nullable();
            $table->json('document_links')->nullable();
            $table->json('metadata')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['company_id', 'transaction_type', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
        Schema::dropIfExists('inventory_items');

        Schema::table('items', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('cogs_account_id');
            $table->dropConstrainedForeignId('inventory_account_id');
            $table->dropColumn('inventory_classification');
        });

        Schema::table('journal_entries', function (Blueprint $table): void {
            $table->dropColumn('metadata');
        });
    }
};