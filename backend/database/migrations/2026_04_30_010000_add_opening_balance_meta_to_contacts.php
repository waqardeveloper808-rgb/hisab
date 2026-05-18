<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->string('opening_balance_type', 32)->nullable()->after('opening_balance');
            $table->date('opening_balance_as_of')->nullable()->after('opening_balance_type');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn(['opening_balance_type', 'opening_balance_as_of']);
        });
    }
};
