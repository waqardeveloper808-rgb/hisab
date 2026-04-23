<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$companyId = (int) (getenv('COMPANY_ID') ?: 2);

$counts = [
    'companies' => App\Models\Company::query()->count(),
    'customers' => App\Models\Contact::query()->where('company_id', $companyId)->where('type', 'customer')->count(),
    'vendors' => App\Models\Contact::query()->where('company_id', $companyId)->whereIn('type', ['supplier', 'vendor'])->count(),
    'products' => App\Models\Item::query()->where('company_id', $companyId)->where('type', 'product')->count(),
    'services' => App\Models\Item::query()->where('company_id', $companyId)->where('type', 'service')->count(),
    'invoices' => App\Models\Document::query()->where('company_id', $companyId)->where('type', 'tax_invoice')->count(),
    'quotations' => App\Models\Document::query()->where('company_id', $companyId)->where('type', 'quotation')->count(),
    'proforma' => App\Models\Document::query()->where('company_id', $companyId)->where('type', 'proforma_invoice')->count(),
    'credit_notes' => App\Models\Document::query()->where('company_id', $companyId)->where('type', 'credit_note')->count(),
    'debit_notes' => App\Models\Document::query()->where('company_id', $companyId)->where('type', 'debit_note')->count(),
    'journal_entries' => App\Models\JournalEntry::query()->where('company_id', $companyId)->count(),
    'journal_lines' => App\Models\JournalEntryLine::query()->whereHas('journalEntry', fn ($query) => $query->where('company_id', $companyId))->count(),
    'inventory_transactions' => App\Models\InventoryTransaction::query()->where('company_id', $companyId)->count(),
    'stock_adjustments' => App\Models\InventoryTransaction::query()->where('company_id', $companyId)->where('transaction_type', 'adjustment')->count(),
    'vat_related_records' => App\Models\Document::query()->where('company_id', $companyId)->where('tax_total', '>', 0)->count(),
    'payments' => App\Models\Payment::query()->where('company_id', $companyId)->count(),
];

echo json_encode([
    'generated_at' => now()->toIso8601String(),
    'company_id' => $companyId,
    'counts' => $counts,
], JSON_PRETTY_PRINT) . PHP_EOL;
