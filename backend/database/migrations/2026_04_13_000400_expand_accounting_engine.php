<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->string('vendor_bill_prefix', 20)->default('BILL')->after('payment_prefix');
            $table->string('purchase_invoice_prefix', 20)->default('PINV')->after('vendor_bill_prefix');
            $table->string('purchase_credit_note_prefix', 20)->default('PCRN')->after('purchase_invoice_prefix');
            $table->string('default_payable_account_code', 20)->default('2000')->after('default_receivable_account_code');
            $table->string('default_expense_account_code', 20)->default('6900')->after('default_revenue_account_code');
            $table->string('default_supplier_advance_account_code', 20)->default('1410')->after('default_customer_advance_account_code');
        });
    }

    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn([
                'vendor_bill_prefix',
                'purchase_invoice_prefix',
                'purchase_credit_note_prefix',
                'default_payable_account_code',
                'default_expense_account_code',
                'default_supplier_advance_account_code',
            ]);
        });
    }
};