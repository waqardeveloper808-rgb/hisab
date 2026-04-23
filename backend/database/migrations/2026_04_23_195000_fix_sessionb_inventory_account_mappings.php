<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix inventory items with wrong inventory_account_id (pointing to VAT account 87 instead of inventory accounts)
        // This corrects the Session B deterministic seeded data where some inventory items were misconfigured
        
        DB::statement('
            UPDATE inventory_items
            SET inventory_account_id = 80
            WHERE company_id = 2 
            AND inventory_account_id = 87
            AND id IN (1, 3, 5, 6, 7, 15, 16, 78, 79, 80, 81, 82, 83, 84)
        ');
        
        // Log the correction
        \Log::info('SessionB: Fixed inventory items with incorrect account mappings', [
            'affected_items' => [1, 3, 5, 6, 7, 15, 16, 78, 79, 80, 81, 82, 83, 84],
            'company_id' => 2,
            'from_account_id' => 87,
            'to_account_id' => 80,
            'reason' => 'Account 87 is VAT Receivable, not inventory account',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert - this is data correction, not schema change
        // Reverting would re-introduce the bug, so we don't provide a down path
        \Log::warning('SessionB inventory account fix migration: Down not implemented to preserve data integrity');
    }
};
