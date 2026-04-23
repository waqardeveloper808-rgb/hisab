<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\JournalEntry;
use App\Models\InventoryItem;
use Illuminate\Support\Facades\DB;

echo "=== INVENTORY SOURCE ENTRIES WITH VAT ACCOUNT POSTINGS ===\n";
$entries = JournalEntry::query()
    ->where('company_id', 2)
    ->whereIn('source_type', ['inventory_sale', 'inventory_receipt'])
    ->orderBy('entry_number')
    ->get();

foreach ($entries as $entry) {
    $vatLines = $entry->lines()
        ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
        ->whereIn('accounts.code', ['2200', '1300'])
        ->get(['journal_entry_lines.*', 'accounts.code as account_code', 'accounts.name as account_name']);
    
    if ($vatLines->count() > 0) {
        echo "Entry {$entry->entry_number} ({$entry->source_type} #{$entry->source_id} on {$entry->entry_date}): ";
        foreach ($vatLines as $line) {
            $direction = $line->debit > 0 ? "Dr: {$line->debit}" : "Cr: {$line->credit}";
            echo "{$line->account_code} ({$direction}) ";
        }
        echo "\n";
    }
}

echo "\n=== INVENTORY ITEMS: ACCOUNT MAPPINGS ===\n";
$items = InventoryItem::query()
    ->where('company_id', 2)
    ->orderBy('id')
    ->get(['id', 'item_id', 'inventory_account_id', 'revenue_account_id', 'cogs_account_id']);

foreach ($items as $item) {
    echo "Item {$item->id}: inventory_acct={$item->inventory_account_id}, revenue={$item->revenue_account_id}, cogs={$item->cogs_account_id}\n";
}

echo "\n=== ACCOUNT LOOKUP ===\n";
$accounts = DB::table('accounts')
    ->whereIn('id', [87, 80, 82])
    ->get(['id', 'code', 'name']);

foreach ($accounts as $acct) {
    echo "Account {$acct->id}: {$acct->code} - {$acct->name}\n";
}

echo "\n=== JOURNAL ENTRIES WITH ACCOUNT 87 POSTINGS ===\n";
$lines = DB::table('journal_entry_lines')
    ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
    ->where('journal_entries.company_id', 2)
    ->where('journal_entry_lines.account_id', 87)
    ->orderBy('journal_entries.entry_number')
    ->get(['journal_entries.entry_number', 'journal_entries.source_type', 'journal_entry_lines.debit', 'journal_entry_lines.credit', 'journal_entry_lines.description']);

foreach ($lines as $line) {
    $direction = $line->debit > 0 ? "Dr: {$line->debit}" : "Cr: {$line->credit}";
    echo "{$line->entry_number} ({$line->source_type}): {$direction} - {$line->description}\n";
}
