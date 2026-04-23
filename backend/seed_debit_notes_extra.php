<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Company;
use App\Models\Document;
use App\Models\User;
use App\Services\SalesDocumentService;

$company = Company::find(2);
if (!$company) { echo "Company 2 not found\n"; exit(1); }
echo "Company: {$company->legal_name} (ID {$company->id})\n";

$user = User::query()->whereHas('companies', fn($q) => $q->where('companies.id', $company->id))->first()
       ?? User::query()->first();
echo "User: {$user->email}\n";

$invoices = Document::query()
    ->where('company_id', $company->id)
    ->where('type', 'tax_invoice')
    ->whereIn('status', ['finalized','partially_paid','paid','partially_credited','credit_owed','reported','issued','overdue'])
    ->with('lines')
    ->latest('issue_date')
    ->take(5)
    ->get();

echo "Found {$invoices->count()} eligible invoices\n";

if ($invoices->count() < 1) { echo "No eligible invoices\n"; exit(1); }

$inv0 = $invoices[0];
$inv1 = $invoices->count() > 1 ? $invoices[1] : $invoices[0];

$service = app(SalesDocumentService::class);

$definitions = [
    ['title' => 'Logistics Fee Debit Note', 'invoice' => $inv0, 'issue_date' => '2026-04-14', 'quantity' => '0.15', 'notes' => 'Additional logistics and handling charge.'],
    ['title' => 'Service Extension Debit Note', 'invoice' => $inv1, 'issue_date' => '2026-04-16', 'quantity' => '0.20', 'notes' => 'Extended service period surcharge.'],
];

foreach ($definitions as $def) {
    if (Document::query()->where('company_id', $company->id)->where('type', 'debit_note')->where('title', $def['title'])->exists()) {
        echo "Skipping existing: {$def['title']}\n";
        continue;
    }

    $source = $def['invoice']->fresh()->load('lines');
    $sourceLine = $source->lines->first();
    if (!$sourceLine) {
        echo "No lines on invoice {$source->id}, skipping\n";
        continue;
    }

    try {
        $dn = $service->issueDebitNote($company, $source, $user, [
            'issue_date' => $def['issue_date'],
            'notes' => $def['notes'],
            'lines' => [[
                'source_line_id' => $sourceLine->id,
                'quantity' => $def['quantity'],
                'description' => $def['title'],
            ]],
        ]);
        $dn->update(['title' => $def['title']]);
        echo "Created: {$def['title']} (#{$dn->document_number})\n";
    } catch (Exception $e) {
        echo "FAILED {$def['title']}: " . $e->getMessage() . "\n";
    }
}

$total = Document::query()->where('company_id', $company->id)->where('type', 'debit_note')->count();
echo "Total debit notes for company 2: {$total}\n";
