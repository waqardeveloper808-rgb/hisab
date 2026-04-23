<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$companyId = (int) (getenv('COMPANY_ID') ?: 2);
$reportPath = getenv('WORKFLOW_PROOF_OUTPUT') ?: (__DIR__ . '/../artifacts/workflow_proof.json');

$findDocument = static function (string $type) use ($companyId) {
    return DB::table('documents')
        ->where('company_id', $companyId)
        ->where('type', $type)
        ->orderByDesc('id')
        ->first();
};

$findJournalEntries = static function (?int $documentId) {
    if (! $documentId) {
        return collect();
    }

    return DB::table('journal_entries')
        ->where('source_type', 'document')
        ->where('source_id', $documentId)
        ->orderByDesc('id')
        ->get();
};

$findInventoryLinks = static function (?int $documentId, ?string $documentNumber) use ($companyId) {
    $transactions = DB::table('inventory_transactions')
        ->where('company_id', $companyId)
        ->orderByDesc('id')
        ->get();

    return $transactions->filter(function ($transaction) use ($documentId, $documentNumber) {
        $links = json_decode($transaction->document_links ?? '[]', true) ?: [];

        foreach ($links as $link) {
            if (($documentId && (int) ($link['documentId'] ?? 0) === $documentId) || ($documentNumber && ($link['documentNumber'] ?? null) === $documentNumber)) {
                return true;
            }
        }

        return false;
    })->values();
};

$invoice = $findDocument('tax_invoice');
$creditNote = $findDocument('credit_note');
$debitNote = $findDocument('debit_note');
$bill = DB::table('documents')
    ->where('company_id', $companyId)
    ->whereIn('type', ['vendor_bill', 'purchase_invoice'])
    ->orderByDesc('id')
    ->first();

$invoiceJournals = $findJournalEntries($invoice->id ?? null);
$creditJournals = $findJournalEntries($creditNote->id ?? null);
$debitJournals = $findJournalEntries($debitNote->id ?? null);
$billJournals = $findJournalEntries($bill->id ?? null);

$invoiceInventory = $findInventoryLinks($invoice->id ?? null, $invoice->document_number ?? null);
$billInventory = $findInventoryLinks($bill->id ?? null, $bill->document_number ?? null);

$proof = [
    'generated_at' => now()->toIso8601String(),
    'company_id' => $companyId,
    'invoice' => [
        'id' => $invoice->id ?? null,
        'document_number' => $invoice->document_number ?? null,
        'status' => $invoice->status ?? null,
        'journal_count' => $invoiceJournals->count(),
        'posted_journal_entry_id' => $invoice->posted_journal_entry_id ?? null,
        'inventory_link_count' => $invoiceInventory->count(),
    ],
    'credit_note' => [
        'id' => $creditNote->id ?? null,
        'document_number' => $creditNote->document_number ?? null,
        'source_document_id' => $creditNote->source_document_id ?? null,
        'journal_count' => $creditJournals->count(),
        'posted_journal_entry_id' => $creditNote->posted_journal_entry_id ?? null,
    ],
    'debit_note' => [
        'id' => $debitNote->id ?? null,
        'document_number' => $debitNote->document_number ?? null,
        'source_document_id' => $debitNote->source_document_id ?? null,
        'journal_count' => $debitJournals->count(),
        'posted_journal_entry_id' => $debitNote->posted_journal_entry_id ?? null,
    ],
    'bill' => [
        'id' => $bill->id ?? null,
        'document_number' => $bill->document_number ?? null,
        'status' => $bill->status ?? null,
        'journal_count' => $billJournals->count(),
        'posted_journal_entry_id' => $bill->posted_journal_entry_id ?? null,
        'inventory_link_count' => $billInventory->count(),
        'balance_due' => $bill->balance_due ?? null,
    ],
    'workflow_status' => [
        'invoice_to_journal' => $invoice && $invoiceJournals->count() > 0,
        'credit_note_to_invoice' => $creditNote && (int) ($creditNote->source_document_id ?? 0) > 0,
        'credit_note_to_journal' => $creditNote && $creditJournals->count() > 0,
        'debit_note_to_invoice' => $debitNote && (int) ($debitNote->source_document_id ?? 0) > 0,
        'debit_note_to_journal' => $debitNote && $debitJournals->count() > 0,
        'bill_to_journal' => $bill && $billJournals->count() > 0,
        'bill_to_inventory' => $bill && $billInventory->count() > 0,
    ],
];

$proof['workflow_status']['all_steps_pass'] = ! in_array(false, $proof['workflow_status'], true);
$proof['workflow_status']['verdict'] = $proof['workflow_status']['all_steps_pass'] ? 'PASS' : 'FAIL';

if (! is_dir(dirname($reportPath))) {
    mkdir(dirname($reportPath), 0777, true);
}

file_put_contents($reportPath, json_encode($proof, JSON_PRETTY_PRINT) . PHP_EOL);
echo json_encode($proof, JSON_PRETTY_PRINT) . PHP_EOL;
