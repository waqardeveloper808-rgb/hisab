<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\JournalEntry;
use App\Models\InventoryItem;
use App\Models\Document;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

$companyId = 2;

echo "=== SESSION B SEEDED DATA CLEANUP ===\n";

// Find records created by Session B Seeder (user with email ending in sessionb.seed@gulfhisab.local)
$seedUser = DB::table('users')->where('email', 'sessionb.seed@gulfhisab.local')->first();
if (!$seedUser) {
    echo "Session B seeder user not found. Aborting cleanup.\n";
    exit(1);
}

echo "Found Session B seeder user: {$seedUser->email} (ID: {$seedUser->id})\n";

// Count records to be deleted
$journalCount = JournalEntry::where('company_id', $companyId)
    ->whereIn('source_type', ['inventory_sale', 'inventory_receipt', 'document', 'payment'])
    ->where(function($q) use ($seedUser) {
        $q->where('created_by', $seedUser->id)
          ->orWhereHas('lines', function($l) use ($seedUser) {
              $l->where('created_by', $seedUser->id);
          });
    })
    ->count();

$documentCount = Document::where('company_id', $companyId)
    ->where('document_number', 'like', 'SBH%')
    ->count();

$paymentCount = Payment::where('company_id', $companyId)
    ->where('payment_number', 'like', 'SBH%')
    ->count();

$inventoryCount = InventoryItem::where('company_id', $companyId)
    ->where('product_name', 'like', 'SessionB Product%')
    ->count();

echo "\nRecords to be deleted:\n";
echo "- Journal entries: $journalCount\n";
echo "- Documents (SBH*): $documentCount\n";
echo "- Payments (SBH*): $paymentCount\n";
echo "- Inventory items: $inventoryCount\n";
echo "\nProceeding with cleanup...\n\n";

// Delete in order of dependencies
echo "Deleting payments...\n";
Payment::where('company_id', $companyId)
    ->where('payment_number', 'like', 'SBH%')
    ->delete();

echo "Deleting documents...\n";
Document::where('company_id', $companyId)
    ->where('document_number', 'like', 'SBH%')
    ->delete();

echo "Deleting inventory items...\n";
InventoryItem::where('company_id', $companyId)
    ->where('product_name', 'like', 'SessionB Product%')
    ->delete();

echo "Deleting journal entries...\n";
JournalEntry::where('company_id', $companyId)
    ->whereIn('source_type', ['inventory_sale', 'inventory_receipt', 'document', 'payment'])
    ->where(function($q) use ($seedUser) {
        $q->where('created_by', $seedUser->id)
          ->orWhereHas('lines', function($l) use ($seedUser) {
              $l->where('created_by', $seedUser->id);
          });
    })
    ->delete();

echo "\n=== CLEANUP COMPLETE ===\n";
echo "Session B seeded data has been removed.\n";
echo "Ready to re-seed with fixed account mappings.\n";
