<?php

/**
 * Seeds the Phase1ClosureWorkflowTest-equivalent VAT chain into an existing company
 * so the Next workspace UI (same company id as .env) can show non-zero VAT totals.
 *
 * Usage:
 *   php prompt02_ui_vat_proof_seed.php new
 *     Creates (or reuses) company "Prompt02 VAT UI Proof Co" via CompanyProvisioningService, then seeds VAT chain.
 *   php prompt02_ui_vat_proof_seed.php [companyId]
 *     companyId defaults to getenv('COMPANY_ID') ?: 2
 *     Re-opens closed accounting periods for that company (overlapping quarters in sandbox DBs).
 *
 * Idempotent: skips if a tax_invoice with notes containing "Prompt02 UI VAT proof" exists.
 */

declare(strict_types=1);

require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Account;
use App\Models\Company;
use App\Models\Contact;
use App\Models\CostCenter;
use App\Models\Document;
use App\Models\DocumentTemplate;
use App\Models\Item;
use App\Models\PaymentTerm;
use App\Models\TaxCategory;
use App\Models\User;
use App\Services\CompanyProvisioningService;
use App\Services\InventoryService;
use App\Services\PaymentService;
use App\Services\PurchaseDocumentService;
use App\Services\Reports\VATReportService;
use App\Services\SalesDocumentService;
use Illuminate\Support\Str;

$arg1 = $argv[1] ?? null;
$createIsolated = ($arg1 === 'new');
$actorId = (int) (getenv('WORKSPACE_API_USER_ID') ?: getenv('PROMPT02_ACTOR_USER_ID') ?: 0);

if ($createIsolated) {
    $actor = User::query()->findOrFail($actorId > 0 ? $actorId : 2);
    $company = Company::query()->where('legal_name', 'Prompt02 VAT UI Proof Co')->with('settings')->first();
    if (! $company) {
        $company = app(CompanyProvisioningService::class)->provision($actor, [
            'legal_name' => 'Prompt02 VAT UI Proof Co',
            'tax_number' => '300000000009999',
        ]);
    }
    $companyId = $company->id;
} else {
    $companyId = (int) ($arg1 ?: getenv('COMPANY_ID') ?: 2);
    $company = Company::query()->with('settings')->findOrFail($companyId);
    // Sandbox DBs may have overlapping quarter rows; ensureDateOpen uses first() without ordering.
    \App\Models\AccountingPeriod::query()
        ->where('company_id', $company->id)
        ->where('status', 'closed')
        ->update(['status' => 'open']);
}

if (Document::query()
    ->where('company_id', $company->id)
    ->where('type', 'tax_invoice')
    ->where('notes', 'like', '%Prompt02 UI VAT proof%')
    ->exists()) {
    fwrite(STDOUT, "prompt02_ui_vat_proof_seed: already present for company {$companyId}; skipping.\n");
    exit(0);
}

$actor = $actorId > 0
    ? User::query()->findOrFail($actorId)
    : $company->users()->wherePivot('is_active', true)->orderBy('company_user.id')->first();

if (! $actor) {
    throw new RuntimeException("No active company user for company {$companyId}; set WORKSPACE_API_USER_ID.");
}

if (! $company->users()->where('users.id', $actor->id)->wherePivot('is_active', true)->exists()) {
    $company->users()->syncWithoutDetaching([
        $actor->id => [
            'role' => 'owner',
            'permissions' => json_encode(['*']),
            'is_active' => true,
            'joined_at' => now(),
        ],
    ]);
}

$templateId = DocumentTemplate::query()
    ->where('company_id', $company->id)
    ->where('is_active', true)
    ->orderByDesc('is_default')
    ->value('id');

$paymentTermId = PaymentTerm::query()->where('company_id', $company->id)->orderBy('days_due')->value('id');
$vatCategoryId = TaxCategory::query()->where('company_id', $company->id)->where('code', 'VAT15')->value('id');
$revenueAccountId = Account::query()->where('company_id', $company->id)->where('code', '4000')->value('id');
$expenseAccountId = Account::query()->where('company_id', $company->id)->where('code', '6900')->value('id');

if (! $templateId || ! $paymentTermId || ! $vatCategoryId || ! $revenueAccountId || ! $expenseAccountId) {
    throw new RuntimeException('prompt02_ui_vat_proof_seed: missing template, payment term, VAT15, or accounts 4000/6900.');
}

$costCenter = CostCenter::query()->updateOrCreate(
    ['company_id' => $company->id, 'code' => 'P02-VAT'],
    ['name' => 'Prompt02 VAT Proof', 'description' => 'Prompt02 VAT UI seed', 'is_active' => true],
);

$billing = [
    'building_number' => '7421',
    'street_name' => 'King Fahd Road',
    'district' => 'Al Olaya',
    'city' => 'Riyadh',
    'postal_code' => '12214',
    'secondary_number' => '3184',
    'country' => 'SA',
];

$customer = Contact::query()->firstOrCreate(
    ['company_id' => $company->id, 'display_name' => 'Prompt02 Phase1 Customer'],
    [
        'uuid' => (string) Str::uuid(),
        'type' => 'customer',
        'tax_number' => '300000000009993',
        'billing_address' => $billing,
        'currency_code' => 'SAR',
        'origin_country_code' => 'KSA',
        'payment_term_id' => $paymentTermId,
        'is_active' => true,
    ],
);

$supplier = Contact::query()->firstOrCreate(
    ['company_id' => $company->id, 'display_name' => 'Prompt02 Phase1 Vendor'],
    [
        'uuid' => (string) Str::uuid(),
        'type' => 'supplier',
        'tax_number' => '300000000088883',
        'billing_address' => $billing,
        'currency_code' => 'SAR',
        'origin_country_code' => 'KSA',
        'payment_term_id' => $paymentTermId,
        'is_active' => true,
    ],
);

$item = Item::query()->firstOrCreate(
    ['company_id' => $company->id, 'sku' => 'P02-PH1-PRODUCT'],
    [
        'uuid' => (string) Str::uuid(),
        'type' => 'product',
        'name' => 'Prompt02 Phase1 Product',
        'tax_category_id' => $vatCategoryId,
        'income_account_id' => $revenueAccountId,
        'expense_account_id' => $expenseAccountId,
        'inventory_classification' => 'finished_good',
        'default_sale_price' => 100,
        'default_purchase_price' => 40,
        'is_active' => true,
    ],
);

$salesService = app(SalesDocumentService::class);
$purchaseService = app(PurchaseDocumentService::class);
$paymentService = app(PaymentService::class);
$inventoryService = app(InventoryService::class);

/**
 * Dates after reopening closed overlaps; aligns with prompt evidence window when periods allow.
 */
$issueDate = '2026-04-29';

$inventoryService->createReceipt($company, $actor, [
    'item_id' => $item->id,
    'product_name' => $item->name,
    'material' => 'Finished good',
    'inventory_type' => 'finished_good',
    'size' => 'Standard',
    'source' => 'production',
    'code' => 'P02-PH1-INV-001',
    'quantity_on_hand' => 8,
    'unit_cost' => 40,
    'offset_account_code' => '1153',
    'reference' => 'P02-SEED-STOCK',
    'transaction_date' => $issueDate,
]);

$invoice = $salesService->createDraft($company, $actor, [
    'type' => 'tax_invoice',
    'contact_id' => $customer->id,
    'issue_date' => $issueDate,
    'due_date' => $issueDate,
    'template_id' => $templateId,
    'cost_center_id' => $costCenter->id,
    'notes' => 'Prompt02 UI VAT proof — tax_invoice',
    'lines' => [[
        'item_id' => $item->id,
        'quantity' => 2,
        'unit_price' => 100,
        'tax_category_id' => $vatCategoryId,
        'ledger_account_id' => $revenueAccountId,
        'discount_amount' => 10,
    ]],
]);

$invoice = $salesService->finalize($company, $invoice, $actor);

$paymentService->recordIncomingPayment($company, $invoice, $actor, [
    'amount' => 208,
    'discount_allowed_amount' => 10.5,
    'payment_date' => $issueDate,
    'method' => 'bank_transfer',
    'reference' => 'P02-PH1-PAY-001',
]);

$invoice = $invoice->fresh(['lines']);
$sourceLineId = $invoice->lines->firstOrFail()->id;

$salesService->issueDebitNote($company, $invoice, $actor, [
    'issue_date' => $issueDate,
    'notes' => 'Prompt02 UI VAT proof — debit note',
    'status_reason' => 'Additional supplied quantity',
    'lines' => [[
        'source_line_id' => $sourceLineId,
        'quantity' => 1,
        'unit_price' => 100,
    ]],
]);

$purchase = $purchaseService->createDraft($company, $actor, [
    'type' => 'vendor_bill',
    'contact_id' => $supplier->id,
    'issue_date' => $issueDate,
    'due_date' => $issueDate,
    'template_id' => $templateId,
    'cost_center_id' => $costCenter->id,
    'notes' => 'Prompt02 UI VAT proof — vendor_bill',
    'lines' => [[
        'item_id' => $item->id,
        'quantity' => 5,
        'unit_price' => 50,
        'tax_category_id' => $vatCategoryId,
        'ledger_account_id' => $expenseAccountId,
    ]],
]);

$purchase = $purchaseService->finalize($company, $purchase, $actor);
$purchase = $purchase->fresh();

$paymentService->recordOutgoingPayment($company, $purchase, $actor, [
    'amount' => (float) $purchase->grand_total,
    'payment_date' => $issueDate,
    'method' => 'bank_transfer',
    'reference' => 'P02-PH1-SUP-PAY-001',
]);

$vat = app(VATReportService::class)->summary($company);
fwrite(STDOUT, json_encode([
    'company_id' => $companyId,
    'actor_user_id' => $actor->id,
    'vat_summary_meta' => $vat['meta'] ?? null,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n");
