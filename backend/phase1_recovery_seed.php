<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Account;
use App\Models\Company;
use App\Models\Contact;
use App\Models\CostCenter;
use App\Models\Document;
use App\Models\DocumentTemplate;
use App\Models\InventoryItem;
use App\Models\Item;
use App\Models\PaymentTerm;
use App\Models\TaxCategory;
use App\Models\User;
use App\Services\InventoryService;
use App\Services\PaymentService;
use App\Services\PurchaseDocumentService;
use App\Services\SalesDocumentService;
use Illuminate\Support\Str;

$companyId = (int) ($_SERVER['argv'][1] ?? getenv('COMPANY_ID') ?: 2);
$actorId = (int) (getenv('WORKSPACE_API_USER_ID') ?: 2);

$company = Company::query()->with('settings')->findOrFail($companyId);
$actor = User::query()->findOrFail($actorId);
$actor->update([
    'password' => getenv('RECOVERY_USER_PASSWORD') ?: 'RecoveryPass123!',
]);

$salesService = app(SalesDocumentService::class);
$purchaseService = app(PurchaseDocumentService::class);
$paymentService = app(PaymentService::class);
$inventoryService = app(InventoryService::class);

$templateId = DocumentTemplate::query()->where('company_id', $company->id)->where('is_active', true)->orderByDesc('is_default')->value('id');
$paymentTermId = PaymentTerm::query()->where('company_id', $company->id)->orderBy('days_due')->value('id');
$vatCategoryId = TaxCategory::query()->where('company_id', $company->id)->where('code', 'VAT15')->value('id');
$revenueAccountId = Account::query()->where('company_id', $company->id)->where('code', '4000')->value('id');
$expenseAccountId = Account::query()->where('company_id', $company->id)->where('code', '6900')->value('id');
$costAccountId = Account::query()->where('company_id', $company->id)->where('code', '5000')->value('id');

if (! $templateId || ! $paymentTermId || ! $vatCategoryId || ! $revenueAccountId || ! $expenseAccountId || ! $costAccountId) {
    throw new RuntimeException('Recovery seeding prerequisites are missing for the target company.');
}

$costCenters = collect([
    ['code' => 'REC-SALES', 'name' => 'Recovery Sales'],
    ['code' => 'REC-PROC', 'name' => 'Recovery Procurement'],
    ['code' => 'REC-OPS', 'name' => 'Recovery Operations'],
])->map(fn (array $definition) => CostCenter::query()->updateOrCreate(
    ['company_id' => $company->id, 'code' => $definition['code']],
    ['name' => $definition['name'], 'description' => $definition['name'] . ' cost center', 'is_active' => true],
));

function upsertContact(Company $company, string $type, string $name, string $email, string $city, int $paymentTermId): Contact {
    return Contact::query()->updateOrCreate(
        ['company_id' => $company->id, 'email' => $email],
        [
            'uuid' => Contact::query()->where('company_id', $company->id)->where('email', $email)->value('uuid') ?? (string) Str::uuid(),
            'type' => $type,
            'display_name' => $name,
            'legal_name' => $name,
            'tax_number' => '31' . str_pad((string) abs(crc32($email)), 13, '0', STR_PAD_LEFT),
            'phone' => '+9665' . substr(str_pad((string) abs(crc32($name)), 8, '0', STR_PAD_LEFT), 0, 8),
            'billing_address' => ['city' => $city, 'country' => 'Saudi Arabia'],
            'currency_code' => 'SAR',
            'payment_term_id' => $paymentTermId,
            'is_active' => true,
        ],
    );
}

function upsertItem(Company $company, array $payload): Item {
    return Item::query()->updateOrCreate(
        ['company_id' => $company->id, 'sku' => $payload['sku']],
        $payload + [
            'uuid' => Item::query()->where('company_id', $company->id)->where('sku', $payload['sku'])->value('uuid') ?? (string) Str::uuid(),
            'is_active' => true,
        ],
    );
}

$customerCities = ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Abha', 'Taif', 'Tabuk', 'Najran', 'Jubail'];
$vendorCities = ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Yanbu', 'Qassim', 'Makkah', 'Hail', 'Jizan', 'Buraidah'];
$customers = collect(range(1, 10))->map(fn (int $index) => upsertContact($company, 'customer', "Recovery Customer {$index}", "recovery.customer{$index}@gulfhisab.sa", $customerCities[$index - 1], $paymentTermId));
$suppliers = collect(range(1, 10))->map(fn (int $index) => upsertContact($company, 'supplier', "Recovery Supplier {$index}", "recovery.supplier{$index}@gulfhisab.sa", $vendorCities[$index - 1], $paymentTermId));

$products = collect(range(1, 10))->map(function (int $index) use ($company, $vatCategoryId, $revenueAccountId, $costAccountId) {
    return upsertItem($company, [
        'type' => 'product',
        'sku' => sprintf('REC-PRD-%03d', $index),
        'name' => "Recovery Product {$index}",
        'description' => "Recovery inventory product {$index}",
        'inventory_classification' => 'finished_good',
        'default_sale_price' => 150 + ($index * 25),
        'default_purchase_price' => 90 + ($index * 10),
        'income_account_id' => $revenueAccountId,
        'expense_account_id' => $costAccountId,
        'tax_category_id' => $vatCategoryId,
    ]);
});

$services = collect(range(1, 5))->map(function (int $index) use ($company, $vatCategoryId, $revenueAccountId, $expenseAccountId) {
    return upsertItem($company, [
        'type' => 'service',
        'sku' => sprintf('REC-SRV-%03d', $index),
        'name' => "Recovery Service {$index}",
        'description' => "Recovery service {$index}",
        'default_sale_price' => 900 + ($index * 175),
        'default_purchase_price' => 450 + ($index * 100),
        'income_account_id' => $revenueAccountId,
        'expense_account_id' => $expenseAccountId,
        'tax_category_id' => $vatCategoryId,
    ]);
});

foreach ($products as $index => $product) {
    $inventoryExists = InventoryItem::query()->where('company_id', $company->id)->where('item_id', $product->id)->exists();
    if ($inventoryExists) {
        continue;
    }

    $inventoryService->createReceipt($company, $actor, [
        'item_id' => $product->id,
        'product_name' => $product->name,
        'inventory_type' => 'finished_good',
        'source' => 'purchase',
        'code' => sprintf('REC-STK-%03d', $index + 1),
        'quantity_on_hand' => 40,
        'unit_cost' => $product->default_purchase_price,
        'transaction_date' => now()->subDays(30 - $index)->toDateString(),
        'reference' => sprintf('REC-STOCK-%03d', $index + 1),
        'document_links' => [],
    ]);
}

function ensureSalesDocument(SalesDocumentService $service, Company $company, User $actor, Contact $contact, Item $item, CostCenter $costCenter, int $templateId, array $definition): Document {
    $document = $service->createDraft($company, $actor, [
        'type' => $definition['type'],
        'contact_id' => $contact->id,
        'issue_date' => $definition['issue_date'],
        'supply_date' => $definition['issue_date'],
        'due_date' => $definition['due_date'],
        'title' => $definition['title'],
        'notes' => $definition['title'] . ' generated by Phase 1 recovery seeding.',
        'template_id' => $templateId,
        'cost_center_id' => $costCenter->id,
        'language_code' => 'en',
        'lines' => [[
            'item_id' => $item->id,
            'description' => $item->name,
            'quantity' => $definition['quantity'],
            'unit_price' => $definition['unit_price'],
            'discount_amount' => 0,
            'tax_category_id' => $item->tax_category_id,
            'ledger_account_id' => $item->income_account_id,
        ]],
    ]);

    if (! empty($definition['finalize'])) {
        $document = $service->finalize($company, $document, $actor);
    }

    return $document;
}

function ensurePurchaseDocument(PurchaseDocumentService $service, Company $company, User $actor, Contact $supplier, Item $item, CostCenter $costCenter, int $templateId, array $definition): Document {
    $document = $service->createDraft($company, $actor, [
        'type' => $definition['type'],
        'contact_id' => $supplier->id,
        'issue_date' => $definition['issue_date'],
        'supply_date' => $definition['issue_date'],
        'due_date' => $definition['due_date'],
        'title' => $definition['title'],
        'notes' => $definition['title'] . ' generated by Phase 1 recovery seeding.',
        'template_id' => $templateId,
        'cost_center_id' => $costCenter->id,
        'language_code' => 'en',
        'lines' => [[
            'item_id' => $item->id,
            'description' => $item->name,
            'quantity' => $definition['quantity'],
            'unit_price' => $definition['unit_price'],
            'discount_amount' => 0,
            'tax_category_id' => $item->tax_category_id,
            'ledger_account_id' => $item->expense_account_id,
        ]],
    ]);

    if (! empty($definition['finalize'])) {
        $document = $service->finalize($company, $document, $actor);
    }

    return $document;
}

$created = [
    'quotations' => 0,
    'proforma' => 0,
    'bills' => 0,
    'credit_notes' => 0,
    'inventory_receipts' => 0,
    'incoming_payments' => 0,
    'outgoing_payments' => 0,
];

$currentQuotationCount = Document::query()->where('company_id', $company->id)->where('type', 'quotation')->count();
for ($index = $currentQuotationCount; $index < 10; $index += 1) {
    ensureSalesDocument($salesService, $company, $actor, $customers[$index % $customers->count()], $services[$index % $services->count()], $costCenters[$index % $costCenters->count()], $templateId, [
        'type' => 'quotation',
        'title' => sprintf('Recovery Quotation %02d', $index + 1),
        'issue_date' => now()->subDays(40 - $index)->toDateString(),
        'due_date' => now()->subDays(25 - $index)->toDateString(),
        'quantity' => 1,
        'unit_price' => 1200 + ($index * 100),
        'finalize' => true,
    ]);
    $created['quotations'] += 1;
}

$currentProformaCount = Document::query()->where('company_id', $company->id)->where('type', 'proforma_invoice')->count();
for ($index = $currentProformaCount; $index < 10; $index += 1) {
    ensureSalesDocument($salesService, $company, $actor, $customers[$index % $customers->count()], $services[$index % $services->count()], $costCenters[$index % $costCenters->count()], $templateId, [
        'type' => 'proforma_invoice',
        'title' => sprintf('Recovery Proforma %02d', $index + 1),
        'issue_date' => now()->subDays(30 - $index)->toDateString(),
        'due_date' => now()->subDays(15 - $index)->toDateString(),
        'quantity' => 1,
        'unit_price' => 1400 + ($index * 125),
        'finalize' => true,
    ]);
    $created['proforma'] += 1;
}

$currentBillsCount = Document::query()->where('company_id', $company->id)->whereIn('type', ['vendor_bill', 'purchase_invoice'])->count();
for ($index = $currentBillsCount; $index < 10; $index += 1) {
    $supplier = $suppliers[$index % $suppliers->count()];
    $product = $products[$index % $products->count()];
    $bill = ensurePurchaseDocument($purchaseService, $company, $actor, $supplier, $product, $costCenters[$index % $costCenters->count()], $templateId, [
        'type' => $index % 2 === 0 ? 'vendor_bill' : 'purchase_invoice',
        'title' => sprintf('Recovery Bill %02d', $index + 1),
        'issue_date' => now()->subDays(35 - $index)->toDateString(),
        'due_date' => now()->subDays(18 - $index)->toDateString(),
        'quantity' => 3 + ($index % 3),
        'unit_price' => 110 + ($index * 10),
        'finalize' => true,
    ]);

    $inventoryService->createReceipt($company, $actor, [
        'item_id' => $product->id,
        'product_name' => $product->name,
        'inventory_type' => 'finished_good',
        'source' => 'purchase',
        'code' => sprintf('REC-BILL-STK-%03d', $index + 1),
        'quantity_on_hand' => 6 + ($index % 4),
        'unit_cost' => $product->default_purchase_price,
        'transaction_date' => $bill->issue_date?->toDateString() ?? now()->toDateString(),
        'reference' => $bill->document_number ?: sprintf('REC-BILL-%03d', $index + 1),
        'document_links' => [[
            'documentId' => $bill->id,
            'documentNumber' => $bill->document_number,
            'documentType' => $bill->type,
            'status' => $bill->status,
        ]],
    ]);

    if ((float) $bill->balance_due > 0) {
        $amount = min((float) $bill->balance_due, max(100, ((float) $bill->grand_total / 2)));
        $paymentService->recordOutgoingPayment($company, $bill->fresh(), $actor, [
            'amount' => $amount,
            'payment_date' => now()->subDays(10 - ($index % 5))->toDateString(),
            'method' => 'bank_transfer',
            'reference' => sprintf('REC-SUPPAY-%03d', $index + 1),
        ]);
        $created['outgoing_payments'] += 1;
    }

    $created['bills'] += 1;
    $created['inventory_receipts'] += 1;
}

$finalizedInvoices = Document::query()
    ->where('company_id', $company->id)
    ->where('type', 'tax_invoice')
    ->whereIn('status', ['finalized', 'partially_paid', 'paid', 'partially_credited', 'credit_owed'])
    ->with('lines')
    ->orderBy('id')
    ->get();
$currentCreditNoteCount = Document::query()->where('company_id', $company->id)->where('type', 'credit_note')->count();
for ($index = $currentCreditNoteCount; $index < 5; $index += 1) {
    $source = $finalizedInvoices[$index % max(1, $finalizedInvoices->count())] ?? null;
    if (! $source || $source->lines->isEmpty()) {
        break;
    }

    $sourceLine = $source->lines->first();
    $salesService->issueCreditNote($company, $source, $actor, [
        'issue_date' => now()->subDays(8 - $index)->toDateString(),
        'supply_date' => now()->subDays(8 - $index)->toDateString(),
        'notes' => sprintf('Recovery credit note %02d', $index + 1),
        'lines' => [[
            'source_line_id' => $sourceLine->id,
            'quantity' => '0.25',
            'description' => 'Recovery credit adjustment',
            'unit_price' => $sourceLine->unit_price,
            'discount_amount' => 0,
        ]],
    ]);
    $created['credit_notes'] += 1;
}

$openInvoices = Document::query()
    ->where('company_id', $company->id)
    ->where('type', 'tax_invoice')
    ->whereIn('status', ['finalized', 'partially_paid'])
    ->where('balance_due', '>', 0)
    ->orderBy('id')
    ->get();
foreach ($openInvoices->take(3) as $index => $invoice) {
    $amount = min((float) $invoice->balance_due, max(100, ((float) $invoice->grand_total / 3)));
    $paymentService->recordIncomingPayment($company, $invoice->fresh(), $actor, [
        'amount' => $amount,
        'payment_date' => now()->subDays(6 - $index)->toDateString(),
        'method' => 'bank_transfer',
        'reference' => sprintf('REC-CUSPAY-%03d', $index + 1),
    ]);
    $created['incoming_payments'] += 1;
}

$result = [
    'company_id' => $company->id,
    'actor_id' => $actor->id,
    'actor_email' => $actor->email,
    'created' => $created,
    'counts' => [
        'customers' => Contact::query()->where('company_id', $company->id)->where('type', 'customer')->count(),
        'suppliers' => Contact::query()->where('company_id', $company->id)->whereIn('type', ['supplier', 'vendor'])->count(),
        'products' => Item::query()->where('company_id', $company->id)->where('type', 'product')->count(),
        'services' => Item::query()->where('company_id', $company->id)->where('type', 'service')->count(),
        'quotations' => Document::query()->where('company_id', $company->id)->where('type', 'quotation')->count(),
        'proforma' => Document::query()->where('company_id', $company->id)->where('type', 'proforma_invoice')->count(),
        'invoices' => Document::query()->where('company_id', $company->id)->where('type', 'tax_invoice')->count(),
        'credit_notes' => Document::query()->where('company_id', $company->id)->where('type', 'credit_note')->count(),
        'debit_notes' => Document::query()->where('company_id', $company->id)->where('type', 'debit_note')->count(),
        'bills' => Document::query()->where('company_id', $company->id)->whereIn('type', ['vendor_bill', 'purchase_invoice'])->count(),
        'journal_entries' => App\Models\JournalEntry::query()->where('company_id', $company->id)->count(),
        'inventory_transactions' => App\Models\InventoryTransaction::query()->where('company_id', $company->id)->count(),
        'payments' => App\Models\Payment::query()->where('company_id', $company->id)->count(),
    ],
];

echo json_encode($result, JSON_PRETTY_PRINT) . PHP_EOL;
