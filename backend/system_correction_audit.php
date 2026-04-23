<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$companyId = (int) (getenv('COMPANY_ID') ?: 2);

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
    ->where('type', 'tax_invoice');

$invoiceCount = (clone $invoiceDocuments)->count();

$invoicesWithoutJournal = DB::table('documents as documents')
    ->leftJoin('journal_entries as journals', function ($join) {
        $join->on('journals.company_id', '=', 'documents.company_id')
            ->on('journals.reference', '=', 'documents.document_number');
    })
    ->where('documents.company_id', $companyId)
    ->where('documents.type', 'tax_invoice')
    ->whereNull('journals.id')
    ->select('documents.id', 'documents.document_number')
    ->limit(25)
    ->get();

$invoiceMissingReceivable = DB::table('documents as documents')
    ->where('documents.company_id', $companyId)
    ->where('documents.type', 'tax_invoice')
    ->whereNotExists(function ($query) {
        $query->select(DB::raw(1))
            ->from('journal_entries as journals')
            ->join('journal_entry_lines as lines', 'lines.journal_entry_id', '=', 'journals.id')
            ->join('accounts', 'accounts.id', '=', 'lines.account_id')
            ->whereColumn('journals.company_id', 'documents.company_id')
            ->whereColumn('journals.reference', 'documents.document_number')
            ->where('accounts.code', '1100');
    })
    ->select('documents.id', 'documents.document_number')
    ->limit(25)
    ->get();

$invoiceMissingRevenue = DB::table('documents as documents')
    ->where('documents.company_id', $companyId)
    ->where('documents.type', 'tax_invoice')
    ->whereNotExists(function ($query) {
        $query->select(DB::raw(1))
            ->from('journal_entries as journals')
            ->join('journal_entry_lines as lines', 'lines.journal_entry_id', '=', 'journals.id')
            ->join('accounts', 'accounts.id', '=', 'lines.account_id')
            ->whereColumn('journals.company_id', 'documents.company_id')
            ->whereColumn('journals.reference', 'documents.document_number')
            ->where('accounts.code', '4000');
    })
    ->select('documents.id', 'documents.document_number')
    ->limit(25)
    ->get();

$invoiceMissingVat = DB::table('documents as documents')
    ->where('documents.company_id', $companyId)
    ->where('documents.type', 'tax_invoice')
    ->where('documents.tax_total', '>', 0)
    ->whereNotExists(function ($query) {
        $query->select(DB::raw(1))
            ->from('journal_entries as journals')
            ->join('journal_entry_lines as lines', 'lines.journal_entry_id', '=', 'journals.id')
            ->join('accounts', 'accounts.id', '=', 'lines.account_id')
            ->whereColumn('journals.company_id', 'documents.company_id')
            ->whereColumn('journals.reference', 'documents.document_number')
            ->where('accounts.code', '2200');
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