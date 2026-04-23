<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name', 50);
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status', 20)->default('open');
            $table->timestamp('locked_at')->nullable();
            $table->foreignId('locked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['company_id', 'start_date', 'end_date']);
            $table->index(['company_id', 'status']);
        });

        Schema::table('company_settings', function (Blueprint $table) {
            $table->string('default_customer_advance_account_code', 20)
                ->default('2300')
                ->after('default_cash_account_code');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->decimal('credited_total', 14, 2)->default(0)->after('paid_total');
            $table->timestamp('sent_at')->nullable()->after('finalized_at');
            $table->text('status_reason')->nullable()->after('cancelled_at');
            $table->timestamp('locked_at')->nullable()->after('status_reason');
            $table->foreignId('reversal_of_document_id')->nullable()->after('source_document_id')->constrained('documents')->nullOnDelete();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('allocated_total', 14, 2)->default(0)->after('amount');
            $table->decimal('unallocated_amount', 14, 2)->default(0)->after('allocated_total');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['allocated_total', 'unallocated_amount']);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reversal_of_document_id');
            $table->dropColumn(['credited_total', 'sent_at', 'status_reason', 'locked_at']);
        });

        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn('default_customer_advance_account_code');
        });

        Schema::dropIfExists('accounting_periods');
    }
};