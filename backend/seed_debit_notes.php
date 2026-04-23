<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Company;
use App\Models\Document;
use App\Models\User;
use App\Services\SalesDocumentService;

// Find company with most finalized tax invoices
$row = \Illuminate\Support\Facades\DB::selectOne(
    "SELECT company_id, COUNT(*) as doc_count FROM documents WHERE type='tax_invoice' AND status IN ('finalized','partially_paid','paid','partially_credited','credit_owed','reported','issued') GROUP BY company_id ORDER BY doc_count DESC LIMIT 1"
);

if (!$row) {
    echo "No company with finalized invoices found.\n";
    exit(1);
}

$company = Company::find($row->company_id);

echo "Company: {$company->name} (ID {$company->id})\n";

$user = User::query()
    ->whereHas('companies', fn($q) => $q->where('companies.id', $company->id))
    ->first();

if (!$user) {
    $user = User::query()->first();
}

echo "User: {$user->email}\n";

// Get finalized tax invoices for this company
$invoices = Document::query()
    ->where('company_id', $company->id)
    ->where('type', 'tax_invoice')
    ->whereIn('status', ['finalized', 'partially_paid', 'paid', 'partially_credited', 'credit_owed', 'reported', 'issued', 'overdue'])
    ->with('lines')
    ->latest('issue_date')
    ->take(5)
    ->get();

echo "Found {$invoices->count()} eligible invoices.\n";

if ($invoices->count() < 1) {
    echo "No eligible invoices found.\n";
    exit(1);
}

// Use available invoices, cycling if fewer than 3
$inv0 = $invoices[0];
$inv1 = $invoices->count() > 1 ? $invoices[1] : $invoices[0];
$inv2 = $invoices->count() > 2 ? $invoices[2] : $invoices[0];

$service = app(SalesDocumentService::class);

$definitions = [
    ['title' => 'Retail Support Debit Note', 'invoice' => $inv0, 'issue_date' => '2026-04-03', 'quantity' => '0.25', 'notes' => 'Late delivery surcharge.'],
    ['title' => 'POS Deployment Debit Note', 'invoice' => $inv1, 'issue_date' => '2026-04-09', 'quantity' => '0.10', 'notes' => 'Additional installation fee.'],
    ['title' => 'Printer Refresh Debit Note', 'invoice' => $inv2, 'issue_date' => '2026-04-11', 'quantity' => '0.50', 'notes' => 'Extended warranty charge.'],
];

foreach ($definitions as $def) {
    if (Document::query()->where('company_id', $company->id)->where('type', 'debit_note')->where('title', $def['title'])->exists()) {
        echo "Skipping existing: {$def['title']}\n";
        continue;
    }

    $source = $def['invoice']->fresh()->load('lines');
    $sourceLine = $source->lines->first();
    if (!$sourceLine) {
        echo "No lines on invoice {$source->id}, skipping.\n";
        continue;
    }

    try {
        $debitNote = $service->issueDebitNote($company, $source, $user, [
            'issue_date' => $def['issue_date'],
            'notes' => $def['notes'],
            'lines' => [[
                'source_line_id' => $sourceLine->id,
                'quantity' => $def['quantity'],
                'description' => $def['title'],
            ]],
        ]);
        $debitNote->update(['title' => $def['title']]);
        echo "Created debit note: {$def['title']} (#{$debitNote->document_number})\n";
    } catch (Exception $e) {
        echo "Failed to create {$def['title']}: " . $e->getMessage() . "\n";
    }
}

echo "Done. Total debit notes: " . Document::query()->where('company_id', $company->id)->where('type', 'debit_note')->count() . "\n";
