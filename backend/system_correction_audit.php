<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\CompanySetting;

$companyId = (int) (getenv('COMPANY_ID') ?: 2);

$settings = CompanySetting::query()->where('company_id', $companyId)->first();
$receivableCode = $settings->default_receivable_account_code ?? '1100';
$revenueCode = $settings->default_revenue_account_code ?? '4000';
$vatPayableCode = $settings->default_vat_payable_account_code ?? '2200';

$journalLinked = static function ($query): void {
    $query->where(function ($q): void {
        $q->whereColumn('journals.reference', 'documents.document_number')
            ->orWhere(function ($nested): void {
                $nested->where('journals.source_type', '=', 'document')
                    ->whereColumn('journals.source_id', 'documents.id');
            });
    });
};

$imbalancedJournals = DB::table('journal_entry_lines as lines')
    ->join('journal_entries as journals', 'journals.id', '=', 'lines.journal_entry_id')
    ->where('journals.company_id', $companyId)
    ->groupBy('lines.journal_entry_id')
    ->selectRaw('lines.journal_entry_id as journal_id, ROUND(SUM(lines.debit), 2) as debit_total, ROUND(SUM(lines.credit), 2) as credit_total')
    ->havingRaw('ABS(ROUND(SUM(lines.debit), 2) - ROUND(SUM(lines.credit), 2)) > 0.01')
    ->limit(25)
    ->get();

$invoiceDocuments = DB::table('documents')
    ->where('company_id', $companyId)
    ->where('type', 'tax_invoice')
    ->where('status', 'finalized');

$invoiceCount = (clone $invoiceDocuments)->count();

$invoicesWithoutJournal = DB::table('documents')
    ->where('company_id', $companyId)
    ->where('type', 'tax_invoice')
    ->where('status', 'finalized')
    ->whereNotExists(function ($query) use ($journalLinked): void {
        $query->select(DB::raw(1))
            ->from('journal_entries as journals')
            ->whereColumn('journals.company_id', 'documents.company_id');
        $journalLinked($query);
    })
    ->select('documents.id', 'documents.document_number')
    ->limit(25)
    ->get();

$invoiceMissingReceivable = DB::table('documents as documents')
    ->where('documents.company_id', $companyId)
    ->where('documents.type', 'tax_invoice')
    ->where('documents.status', 'finalized')
    ->whereNotExists(function ($query) use ($journalLinked, $receivableCode): void {
        $query->select(DB::raw(1))
            ->from('journal_entries as journals')
            ->join('journal_entry_lines as lines', 'lines.journal_entry_id', '=', 'journals.id')
            ->join('accounts', 'accounts.id', '=', 'lines.account_id')
            ->whereColumn('journals.company_id', 'documents.company_id');
        $journalLinked($query);
        $query->where('accounts.code', $receivableCode);
    })
    ->select('documents.id', 'documents.document_number')
    ->limit(25)
    ->get();

$invoiceMissingRevenue = DB::table('documents as documents')
    ->where('documents.company_id', $companyId)
    ->where('documents.type', 'tax_invoice')
    ->where('documents.status', 'finalized')
    ->whereNotExists(function ($query) use ($journalLinked, $revenueCode): void {
        $query->select(DB::raw(1))
            ->from('journal_entries as journals')
            ->join('journal_entry_lines as lines', 'lines.journal_entry_id', '=', 'journals.id')
            ->join('accounts', 'accounts.id', '=', 'lines.account_id')
            ->whereColumn('journals.company_id', 'documents.company_id');
        $journalLinked($query);
        $query->where('accounts.code', $revenueCode);
    })
    ->select('documents.id', 'documents.document_number')
    ->limit(25)
    ->get();

$invoiceMissingVat = DB::table('documents as documents')
    ->where('documents.company_id', $companyId)
    ->where('documents.type', 'tax_invoice')
    ->where('documents.status', 'finalized')
    ->where('documents.tax_total', '>', 0)
    ->whereNotExists(function ($query) use ($journalLinked, $vatPayableCode): void {
        $query->select(DB::raw(1))
            ->from('journal_entries as journals')
            ->join('journal_entry_lines as lines', 'lines.journal_entry_id', '=', 'journals.id')
            ->join('accounts', 'accounts.id', '=', 'lines.account_id')
            ->whereColumn('journals.company_id', 'documents.company_id');
        $journalLinked($query);
        $query->where('accounts.code', $vatPayableCode);
    })
    ->select('documents.id', 'documents.document_number', 'documents.tax_total')
    ->limit(25)
    ->get();

$inventoryTransactionCount = DB::table('inventory_transactions')
    ->where('company_id', $companyId)
    ->count();

$inventoryMissingJournal = DB::table('inventory_transactions as transactions')
    ->leftJoin('journal_entries as journals', 'journals.id', '=', 'transactions.journal_entry_id')
    ->where('transactions.company_id', $companyId)
    ->whereNotNull('transactions.journal_entry_id')
    ->whereNull('journals.id')
    ->select('transactions.id', 'transactions.reference', 'transactions.journal_entry_id')
    ->limit(25)
    ->get();

$negativeInventory = DB::table('inventory_transactions')
    ->leftJoin('inventory_items', 'inventory_items.id', '=', 'inventory_transactions.inventory_item_id')
    ->where('inventory_transactions.company_id', $companyId)
    ->groupBy('inventory_transactions.inventory_item_id', 'inventory_items.code', 'inventory_items.product_name')
    ->selectRaw('inventory_transactions.inventory_item_id, inventory_items.code as inventory_code, inventory_items.product_name, ROUND(SUM(quantity_delta), 2) as balance')
    ->havingRaw('ROUND(SUM(quantity_delta), 2) < 0')
    ->limit(25)
    ->get();

$vatDocuments = DB::table('documents')
    ->where('company_id', $companyId)
    ->where('status', 'finalized')
    ->where('tax_total', '>', 0)
    ->count();

echo json_encode([
    'generated_at' => now()->toIso8601String(),
    'company_id' => $companyId,
    'accounting' => [
        'invoice_count' => $invoiceCount,
        'imbalanced_journals' => $imbalancedJournals,
        'invoices_without_journal' => $invoicesWithoutJournal,
        'invoices_missing_receivable' => $invoiceMissingReceivable,
        'invoices_missing_revenue' => $invoiceMissingRevenue,
        'invoices_missing_vat' => $invoiceMissingVat,
    ],
    'inventory' => [
        'transaction_count' => $inventoryTransactionCount,
        'inventory_missing_journal' => $inventoryMissingJournal,
        'negative_inventory_balances' => $negativeInventory,
    ],
    'vat' => [
        'vat_document_count' => $vatDocuments,
        'documents_missing_output_vat_line' => $invoiceMissingVat,
    ],
], JSON_PRETTY_PRINT) . PHP_EOL;