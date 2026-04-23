<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->string('origin_country_code', 8)->nullable()->after('currency_code');
        });

        Schema::table('documents', function (Blueprint $table): void {
            $table->string('supply_location', 80)->nullable()->after('supply_date');
            $table->string('vat_applicability', 20)->nullable()->after('supply_location');
        });

        Schema::table('document_lines', function (Blueprint $table): void {
            $table->string('vat_type', 20)->default('standard')->after('tax_rate');
        });
    }

    public function down(): void
    {
        Schema::table('document_lines', function (Blueprint $table): void {
            $table->dropColumn('vat_type');
        });

        Schema::table('documents', function (Blueprint $table): void {
            $table->dropColumn(['supply_location', 'vat_applicability']);
        });

        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn('origin_country_code');
        });
    }
};
