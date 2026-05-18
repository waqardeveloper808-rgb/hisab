<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->string('commercial_registration_number', 64)->nullable()->after('tax_number');
            $table->decimal('opening_balance', 14, 2)->default(0)->after('commercial_registration_number');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn(['commercial_registration_number', 'opening_balance']);
        });
    }
};
