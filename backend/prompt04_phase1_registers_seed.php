<?php

/**
 * Phase-1 register coverage: quotations, proforma, purchase orders, paired credit notes (sales + purchase).
 *
 * Depends on Prompt02 VAT seed (`prompt02_ui_vat_proof_seed.php`) for shared company, invoice, vendor bill lines.
 *
 * Usage:
 *   php prompt04_phase1_registers_seed.php [companyId]
 *   COMPANY_ID fallback = 2
 *
 * Idempotent: skips if a quotation mentions "Prompt04 phase1 registers".
 */

declare(strict_types=1);

require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use App\Models\CostCenter;
use App\Models\Document;
use App\Models\DocumentTemplate;
use App\Models\TaxCategory;
use App\Models\User;
use App\Services\PurchaseDocumentService;
use App\Services\SalesDocumentService;

$companyId = (int) ($argv[1] ?: getenv('COMPANY_ID') ?: 2);
$company = Company::query()->with('settings')->findOrFail($companyId);

$actorId = (int) (getenv('WORKSPACE_API_USER_ID') ?: 0);

$actor = $actorId > 0
    ? User::query()->findOrFail($actorId)
    : $company->users()->wherePivot('is_active', true)->orderBy('company_user.id')->firstOrFail();

if (! $company->users()->where('users.id', $actor->id)->wherePivot('is_active', true)->exists()) {
    throw new RuntimeException("Actor {$actor->id} is not an active member of company {$companyId}.");
}

if (Document::query()
    ->where('company_id', $company->id)
    ->where('type', 'quotation')
    ->where('notes', 'like', '%Prompt04 phase1 registers%')
    ->exists()) {
    fwrite(STDOUT, "prompt04_phase1_registers_seed: already present; skipping.\n");
    exit(0);
}

$templateId = DocumentTemplate::query()
    ->where('company_id', $company->id)
    ->where('is_active', true)
    ->orderByDesc('is_default')
    ->value('id');

$vatCategoryId = TaxCategory::query()->where('company_id', $company->id)->where('code', 'VAT15')->value('id');
$costCenterId = CostCenter::query()->where('company_id', $company->id)->orderBy('code')->value('id');

$salesInvoice = Document::query()
    ->where('company_id', $company->id)
    ->where('type', 'tax_invoice')
    ->where('notes', 'like', '%Prompt02 UI VAT proof%')
    ->orderByDesc('id')
    ->first();

$purchaseBill = Document::query()
    ->where('company_id', $company->id)
    ->where('type', 'vendor_bill')
    ->where('notes', 'like', '%Prompt02 UI VAT proof%')
    ->orderByDesc('id')
    ->first();

if (! $salesInvoice || ! $purchaseBill || ! $templateId || ! $vatCategoryId || ! $costCenterId) {
    throw new RuntimeException('prompt04_phase1_registers_seed: run prompt02_ui_vat_proof_seed first (missing invoice, bill, template, VAT15, or cost center).');
}

$salesInvoice = $salesInvoice->loadMissing('lines.item');
$purchaseBill = $purchaseBill->loadMissing('lines.item');

$itemId = $salesInvoice->lines->first()?->item_id;
$revenueAccountId = $salesInvoice->lines->first()?->ledger_account_id;
$expenseAccountId = $purchaseBill->lines->first()?->ledger_account_id;

if (! $itemId || ! $revenueAccountId || ! $expenseAccountId) {
    throw new RuntimeException('prompt04_phase1_registers_seed: cannot resolve line-derived accounts.');
}

$issueDate = (string) ($salesInvoice->issue_date ?? '2026-04-29');
$sales = app(SalesDocumentService::class);
$purchase = app(PurchaseDocumentService::class);

$sales->createDraft($company, $actor, [
    'type' => 'quotation',
    'contact_id' => $salesInvoice->contact_id,
    'issue_date' => $issueDate,
    'due_date' => $issueDate,
    'template_id' => $templateId,
    'cost_center_id' => $costCenterId,
    'notes' => 'Prompt04 phase1 registers — quotation',
    'lines' => [[
        'item_id' => $itemId,
        'quantity' => 1,
        'unit_price' => 175,
        'tax_category_id' => $vatCategoryId,
        'ledger_account_id' => $revenueAccountId,
    ]],
]);

$proformaDraft = $sales->createDraft($company, $actor, [
    'type' => 'proforma_invoice',
    'contact_id' => $salesInvoice->contact_id,
    'issue_date' => $issueDate,
    'due_date' => $issueDate,
    'template_id' => $templateId,
    'cost_center_id' => $costCenterId,
    'notes' => 'Prompt04 phase1 registers — proforma',
    'lines' => [[
        'item_id' => $itemId,
        'quantity' => 1,
        'unit_price' => 215,
        'tax_category_id' => $vatCategoryId,
        'ledger_account_id' => $revenueAccountId,
    ]],
]);

$sales->finalize($company, $proformaDraft, $actor);

$poDraft = $purchase->createDraft($company, $actor, [
    'type' => 'purchase_order',
    'contact_id' => $purchaseBill->contact_id,
    'issue_date' => $issueDate,
    'due_date' => $issueDate,
    'template_id' => $templateId,
    'cost_center_id' => $costCenterId,
    'notes' => 'Prompt04 phase1 registers — purchase_order',
    'lines' => [[
        'item_id' => $itemId,
        'quantity' => 10,
        'unit_price' => 42,
        'tax_category_id' => $vatCategoryId,
        'ledger_account_id' => $expenseAccountId,
    ]],
]);

$purchase->finalize($company, $poDraft, $actor);

$srcLineInvoice = $salesInvoice->lines->firstOrFail();
$sales->issueCreditNote($company, $salesInvoice->fresh(['lines']), $actor, [
    'issue_date' => $issueDate,
    'supply_date' => $issueDate,
    'notes' => 'Prompt04 phase1 registers — sales_credit_note',
    'lines' => [[
        'source_line_id' => $srcLineInvoice->id,
        'quantity' => 1,
        'description' => 'Linked credit line',
        'unit_price' => 50,
        'discount_amount' => 0,
    ]],
]);

$srcLineBill = $purchaseBill->lines->firstOrFail();
$purchase->issueCreditNote($company, $purchaseBill->fresh(['lines']), $actor, [
    'issue_date' => $issueDate,
    'supply_date' => $issueDate,
    'notes' => 'Prompt04 phase1 registers — purchase_credit_note',
    'lines' => [[
        'source_line_id' => $srcLineBill->id,
        'quantity' => 1,
        'description' => 'Linked supplier credit line',
        'unit_price' => 25,
        'discount_amount' => 0,
    ]],
]);

fwrite(STDOUT, "prompt04_phase1_registers_seed: OK for company {$companyId}\n");
