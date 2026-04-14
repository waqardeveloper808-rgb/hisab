<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Agent;
use App\Models\AgentReferral;
use App\Models\Company;
use App\Models\Contact;
use App\Models\CostCenter;
use App\Models\Document;
use App\Models\Item;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Payment;
use App\Models\PaymentTerm;
use App\Models\ProductSetting;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\TaxCategory;
use App\Models\User;
use App\Services\CompanyProvisioningService;
use App\Services\PaymentService;
use App\Services\PurchaseDocumentService;
use App\Services\SalesDocumentService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SandboxSeeder extends Seeder
{
    private Company $sandboxCompany;

    public function run(): void
    {
        $plans = $this->seedPlans();
        $this->seedProductSettings();
        $actors = $this->seedActors();
        $this->sandboxCompany = $this->seedSandboxCompany($actors, $plans['zatca-monthly']);

        [$customers, $suppliers, $items, $costCenters] = $this->seedCompanyDirectory($this->sandboxCompany);

        $this->seedSalesDocuments($actors['user'], $customers, $items, $costCenters);
        $this->seedPurchaseDocuments($actors['user'], $suppliers, $items, $costCenters);
        $this->seedManualJournals($customers, $costCenters);
        $this->seedPlatformCustomerCompanies($actors['agent'], $plans);
    }

    private function seedPlans(): array
    {
        $plans = [
            'free' => [
                'name' => 'Free',
                'description' => 'Starter plan for very light monthly invoicing.',
                'monthly_price_sar' => 0,
                'annual_price_sar' => 0,
                'trial_days' => 0,
                'invoice_limit' => 1,
                'customer_limit' => 25,
                'accountant_seat_limit' => 1,
                'feature_flags' => [
                    'document_templates' => false,
                    'custom_fields' => false,
                    'custom_fields_limit' => 2,
                    'cost_centers' => false,
                    'purchase_intelligence' => false,
                    'business_intelligence' => false,
                    'support_center' => true,
                    'api_invoicing' => false,
                ],
                'marketing_points' => ['1 invoice per month', 'Basic VAT visibility', 'Workspace help access'],
                'is_visible' => true,
                'is_free' => true,
                'is_paid' => false,
                'is_active' => true,
                'sort_order' => 10,
            ],
            'trial' => [
                'name' => '45-Day Trial',
                'description' => 'Full guided invoicing and reporting for evaluation.',
                'monthly_price_sar' => 0,
                'annual_price_sar' => 0,
                'trial_days' => 45,
                'invoice_limit' => null,
                'customer_limit' => null,
                'accountant_seat_limit' => 3,
                'feature_flags' => [
                    'document_templates' => true,
                    'custom_fields' => true,
                    'custom_fields_limit' => 12,
                    'cost_centers' => true,
                    'purchase_intelligence' => true,
                    'business_intelligence' => true,
                    'support_center' => true,
                    'api_invoicing' => false,
                ],
                'marketing_points' => ['45 days of full access', 'Reports and VAT review', 'Guided onboarding and support'],
                'is_visible' => true,
                'is_free' => true,
                'is_paid' => false,
                'is_active' => true,
                'sort_order' => 20,
            ],
            'zatca-monthly' => [
                'name' => 'ZATCA Monthly',
                'description' => 'Commercial plan for active Saudi businesses that invoice regularly.',
                'monthly_price_sar' => 40,
                'annual_price_sar' => 400,
                'trial_days' => 45,
                'invoice_limit' => null,
                'customer_limit' => null,
                'accountant_seat_limit' => 10,
                'feature_flags' => [
                    'document_templates' => true,
                    'custom_fields' => true,
                    'custom_fields_limit' => 24,
                    'cost_centers' => true,
                    'purchase_intelligence' => true,
                    'business_intelligence' => true,
                    'support_center' => true,
                    'api_invoicing' => true,
                ],
                'marketing_points' => ['Unlimited invoicing', 'Business intelligence and cost centers', 'Support and referral tooling'],
                'is_visible' => true,
                'is_free' => false,
                'is_paid' => true,
                'is_active' => true,
                'sort_order' => 30,
            ],
        ];

        $resolved = [];

        foreach ($plans as $code => $attributes) {
            $resolved[$code] = SubscriptionPlan::query()->updateOrCreate(
                ['code' => $code],
                $attributes,
            );
        }

        return $resolved;
    }

    private function seedProductSettings(): void
    {
        ProductSetting::current()->update([
            'support_display_name' => 'Gulf Hisab Support',
            'support_whatsapp_number' => '966551234567',
            'support_email' => 'support@gulfhisab.sa',
            'free_trial_days' => 45,
            'free_invoice_limit' => 1,
            'paid_plan_monthly_price_sar' => 40,
            'default_agent_commission_rate' => 20,
        ]);
    }

    private function seedActors(): array
    {
        $actors = [
            'user' => $this->upsertUser('Noura Al Harbi', 'sandbox.owner@gulfhisab.sa'),
            'admin' => $this->upsertUser('Omar Al Qahtani', 'sandbox.admin@gulfhisab.sa', [
                'platform_role' => 'super_admin',
                'is_platform_active' => true,
            ]),
            'assistant' => $this->upsertUser('Huda Al Mutairi', 'sandbox.assistant@gulfhisab.sa', [
                'platform_role' => 'support',
                'is_platform_active' => true,
            ]),
            'agent' => $this->upsertUser('Khalid Al Suwailem', 'sandbox.agent@gulfhisab.sa'),
        ];

        Agent::query()->updateOrCreate(
            ['user_id' => $actors['agent']->id],
            [
                'referral_code' => 'KHALID-SBX01',
                'commission_rate' => 20,
                'is_active' => true,
            ],
        );

        return $actors;
    }

    private function seedSandboxCompany(array $actors, SubscriptionPlan $plan): Company
    {
        $company = Company::query()->where('legal_name', 'Al Rimal Retail & Services Co.')->first();

        if (! $company) {
            $company = app(CompanyProvisioningService::class)->provision($actors['user'], [
                'legal_name' => 'Al Rimal Retail & Services Co.',
                'trade_name' => 'Al Rimal Retail',
                'tax_number' => '310175397600003',
                'registration_number' => '1010987654',
                'base_currency' => 'SAR',
                'locale' => 'en',
                'timezone' => 'Asia/Riyadh',
                'branch_name' => 'Riyadh Head Office',
                'branch_city' => 'Riyadh',
            ]);
        }

        $company->update([
            'trade_name' => 'Al Rimal Retail',
            'tax_number' => '310175397600003',
            'registration_number' => '1010987654',
            'base_currency' => 'SAR',
            'locale' => 'en',
            'timezone' => 'Asia/Riyadh',
            'is_active' => true,
        ]);

        $this->ensureMembership($company, $actors['admin'], 'admin');
        $this->ensureMembership($company, $actors['assistant'], 'admin');
        $this->ensureMembership($company, $actors['agent'], 'admin');

        Subscription::query()->updateOrCreate(
            ['company_id' => $company->id, 'user_id' => $actors['user']->id],
            [
                'plan_id' => $plan->id,
                'plan_code' => $plan->code,
                'plan_name' => $plan->name,
                'status' => 'active',
                'monthly_price_sar' => $plan->monthly_price_sar,
                'trial_days' => $plan->trial_days,
                'free_invoice_limit' => $plan->invoice_limit ?? 0,
                'started_at' => Carbon::now()->subMonths(3),
                'trial_ends_at' => Carbon::now()->subMonths(2),
                'activated_at' => Carbon::now()->subMonths(2),
            ],
        );

        return $company->fresh(['settings', 'accounts', 'paymentTerms', 'taxCategories']);
    }

    private function seedCompanyDirectory(Company $company): array
    {
        $paymentTerm = PaymentTerm::query()->where('company_id', $company->id)->where('days_due', 30)->firstOrFail();
        $vatCategory = TaxCategory::query()->where('company_id', $company->id)->where('code', 'VAT15')->firstOrFail();
        $unitEach = DB::table('units')->where('company_id', $company->id)->where('code', 'EA')->first();
        $unitService = DB::table('units')->where('company_id', $company->id)->where('code', 'SRV')->first();
        $salesAccount = Account::query()->where('company_id', $company->id)->where('code', '4000')->firstOrFail();
        $costAccount = Account::query()->where('company_id', $company->id)->where('code', '5000')->firstOrFail();
        $expenseAccount = Account::query()->where('company_id', $company->id)->where('code', '5100')->firstOrFail();

        $customers = collect([
            ['display_name' => 'Red Sea Projects', 'legal_name' => 'Red Sea Projects Contracting Co.', 'tax_number' => '311245678900003', 'email' => 'finance@redseaprojects.sa', 'phone' => '+966550101201', 'city' => 'Jeddah'],
            ['display_name' => 'Noor Medical Group', 'legal_name' => 'Noor Medical Group LLC', 'tax_number' => '311245678900010', 'email' => 'ap@noormedical.sa', 'phone' => '+966550101202', 'city' => 'Riyadh'],
            ['display_name' => 'Eastern Logistics Hub', 'legal_name' => 'Eastern Logistics Hub Ltd.', 'tax_number' => '311245678900027', 'email' => 'accounts@easternlogistics.sa', 'phone' => '+966550101203', 'city' => 'Dammam'],
        ])->map(fn (array $payload) => Contact::query()->updateOrCreate(
            ['company_id' => $company->id, 'email' => $payload['email']],
            [
                'uuid' => Contact::query()
                    ->where('company_id', $company->id)
                    ->where('email', $payload['email'])
                    ->value('uuid') ?? (string) Str::uuid(),
                'type' => 'customer',
                'display_name' => $payload['display_name'],
                'legal_name' => $payload['legal_name'],
                'tax_number' => $payload['tax_number'],
                'phone' => $payload['phone'],
                'billing_address' => ['city' => $payload['city'], 'country' => 'Saudi Arabia'],
                'currency_code' => 'SAR',
                'payment_term_id' => $paymentTerm->id,
                'is_active' => true,
            ],
        ));

        $suppliers = collect([
            ['display_name' => 'Najd Office Supply', 'legal_name' => 'Najd Office Supply Est.', 'tax_number' => '312345678900003', 'email' => 'orders@najdoffice.sa', 'phone' => '+966550202301', 'city' => 'Riyadh'],
            ['display_name' => 'Gulf Facility Services', 'legal_name' => 'Gulf Facility Services Co.', 'tax_number' => '312345678900010', 'email' => 'billing@gfs.sa', 'phone' => '+966550202302', 'city' => 'Khobar'],
            ['display_name' => 'Makkah Travel Network', 'legal_name' => 'Makkah Travel Network LLC', 'tax_number' => '312345678900027', 'email' => 'finance@mtn.sa', 'phone' => '+966550202303', 'city' => 'Jeddah'],
        ])->map(fn (array $payload) => Contact::query()->updateOrCreate(
            ['company_id' => $company->id, 'email' => $payload['email']],
            [
                'uuid' => Contact::query()
                    ->where('company_id', $company->id)
                    ->where('email', $payload['email'])
                    ->value('uuid') ?? (string) Str::uuid(),
                'type' => 'supplier',
                'display_name' => $payload['display_name'],
                'legal_name' => $payload['legal_name'],
                'tax_number' => $payload['tax_number'],
                'phone' => $payload['phone'],
                'billing_address' => ['city' => $payload['city'], 'country' => 'Saudi Arabia'],
                'currency_code' => 'SAR',
                'payment_term_id' => $paymentTerm->id,
                'is_active' => true,
            ],
        ));

        $items = collect([
            ['sku' => 'SRV-BOOK-001', 'type' => 'service', 'name' => 'Monthly Bookkeeping Retainer', 'description' => 'Ongoing bookkeeping and VAT support', 'unit_id' => $unitService?->id, 'default_sale_price' => 4200, 'default_purchase_price' => 2600, 'income_account_id' => $salesAccount->id, 'expense_account_id' => $expenseAccount->id],
            ['sku' => 'SRV-POS-015', 'type' => 'service', 'name' => 'POS Rollout Service', 'description' => 'Point-of-sale setup and branch onboarding', 'unit_id' => $unitService?->id, 'default_sale_price' => 7800, 'default_purchase_price' => 5100, 'income_account_id' => $salesAccount->id, 'expense_account_id' => $expenseAccount->id],
            ['sku' => 'PRD-THERM-220', 'type' => 'product', 'name' => 'Thermal Receipt Printer', 'description' => 'Compact printer bundle for branch counters', 'unit_id' => $unitEach?->id, 'default_sale_price' => 1350, 'default_purchase_price' => 860, 'income_account_id' => $salesAccount->id, 'expense_account_id' => $costAccount->id],
        ])->map(fn (array $payload) => Item::query()->updateOrCreate(
            ['company_id' => $company->id, 'sku' => $payload['sku']],
            $payload + [
                'uuid' => Item::query()
                    ->where('company_id', $company->id)
                    ->where('sku', $payload['sku'])
                    ->value('uuid') ?? (string) Str::uuid(),
                'tax_category_id' => $vatCategory->id,
                'is_active' => true,
            ],
        ));

        $costCenters = collect([
            ['code' => 'RETAIL', 'name' => 'Retail Operations', 'description' => 'Core branch retail activity'],
            ['code' => 'PROJECT', 'name' => 'Project Delivery', 'description' => 'Implementation and rollout work'],
            ['code' => 'OPS', 'name' => 'Shared Operations', 'description' => 'Finance, admin, and support activity'],
        ])->map(fn (array $payload) => CostCenter::query()->updateOrCreate(
            ['company_id' => $company->id, 'code' => $payload['code']],
            $payload + ['is_active' => true],
        ));

        return [$customers->values(), $suppliers->values(), $items->values(), $costCenters->values()];
    }

    private function seedSalesDocuments(User $user, $customers, $items, $costCenters): void
    {
        $salesService = app(SalesDocumentService::class);
        $paymentService = app(PaymentService::class);

        $quotations = [
            ['title' => 'Mall Fit-Out Quotation', 'type' => 'quotation', 'contact' => $customers[0], 'item' => $items[1], 'cost_center' => $costCenters[1], 'issue_date' => '2026-03-02', 'due_date' => '2026-03-17', 'quantity' => 1, 'unit_price' => 24500, 'finalize' => true],
            ['title' => 'Clinic Support Quotation', 'type' => 'quotation', 'contact' => $customers[1], 'item' => $items[0], 'cost_center' => $costCenters[2], 'issue_date' => '2026-03-06', 'due_date' => '2026-03-21', 'quantity' => 2, 'unit_price' => 4200, 'finalize' => true],
            ['title' => 'Warehouse Device Quotation', 'type' => 'quotation', 'contact' => $customers[2], 'item' => $items[2], 'cost_center' => $costCenters[0], 'issue_date' => '2026-03-10', 'due_date' => '2026-03-25', 'quantity' => 6, 'unit_price' => 1280, 'finalize' => false],
        ];

        foreach ($quotations as $definition) {
            $this->seedSalesDocument($salesService, $user, $definition);
        }

        $proformas = [
            ['title' => 'Branch Launch Proforma', 'type' => 'proforma_invoice', 'contact' => $customers[0], 'item' => $items[2], 'cost_center' => $costCenters[0], 'issue_date' => '2026-03-12', 'due_date' => '2026-03-20', 'quantity' => 4, 'unit_price' => 1325, 'finalize' => true],
            ['title' => 'VAT Advisory Proforma', 'type' => 'proforma_invoice', 'contact' => $customers[1], 'item' => $items[0], 'cost_center' => $costCenters[2], 'issue_date' => '2026-03-15', 'due_date' => '2026-03-22', 'quantity' => 1, 'unit_price' => 6200, 'finalize' => false],
            ['title' => 'Logistics Rollout Proforma', 'type' => 'proforma_invoice', 'contact' => $customers[2], 'item' => $items[1], 'cost_center' => $costCenters[1], 'issue_date' => '2026-03-18', 'due_date' => '2026-03-26', 'quantity' => 1, 'unit_price' => 16800, 'finalize' => true],
        ];

        foreach ($proformas as $definition) {
            $this->seedSalesDocument($salesService, $user, $definition);
        }

        $invoiceDefinitions = [
            ['title' => 'March Retail Support Invoice', 'type' => 'tax_invoice', 'contact' => $customers[0], 'item' => $items[0], 'cost_center' => $costCenters[0], 'issue_date' => '2026-03-25', 'due_date' => '2026-04-10', 'quantity' => 2, 'unit_price' => 4200, 'finalize' => true, 'payment' => ['amount' => 9660, 'date' => '2026-03-29', 'reference' => 'RCPT-SBX-1001']],
            ['title' => 'POS Deployment Invoice', 'type' => 'tax_invoice', 'contact' => $customers[1], 'item' => $items[1], 'cost_center' => $costCenters[1], 'issue_date' => '2026-04-01', 'due_date' => '2026-04-16', 'quantity' => 1, 'unit_price' => 17800, 'finalize' => true, 'payment' => ['amount' => 9200, 'date' => '2026-04-05', 'reference' => 'RCPT-SBX-1002']],
            ['title' => 'Printer Refresh Invoice', 'type' => 'tax_invoice', 'contact' => $customers[2], 'item' => $items[2], 'cost_center' => $costCenters[0], 'issue_date' => '2026-04-05', 'due_date' => '2026-04-20', 'quantity' => 8, 'unit_price' => 1350, 'finalize' => true],
        ];

        $invoices = collect();

        foreach ($invoiceDefinitions as $definition) {
            $invoice = $this->seedSalesDocument($salesService, $user, $definition);
            $invoices->push($invoice);

            if (! empty($definition['payment'])) {
                $this->seedIncomingPayment(
                    $paymentService,
                    $user,
                    $invoice,
                    $definition['payment']['amount'],
                    $definition['payment']['date'],
                    $definition['payment']['reference'],
                );
            }
        }

        foreach ([
            ['title' => 'Retail Support Credit Note', 'source' => $invoices[0], 'issue_date' => '2026-04-02', 'quantity' => '0.50', 'notes' => 'Scope adjustment after branch launch.'],
            ['title' => 'POS Deployment Credit Note', 'source' => $invoices[1], 'issue_date' => '2026-04-07', 'quantity' => '0.20', 'notes' => 'Discount granted after rollout sign-off.'],
            ['title' => 'Printer Refresh Credit Note', 'source' => $invoices[2], 'issue_date' => '2026-04-08', 'quantity' => '1.00', 'notes' => 'Damaged unit returned by customer.'],
        ] as $creditDefinition) {
            $this->seedSalesCreditNote($salesService, $user, $creditDefinition);
        }
    }

    private function seedPurchaseDocuments(User $user, $suppliers, $items, $costCenters): void
    {
        $purchaseService = app(PurchaseDocumentService::class);
        $paymentService = app(PaymentService::class);

        foreach ([
            ['title' => 'Office Supplies Bill', 'type' => 'vendor_bill', 'contact' => $suppliers[0], 'item' => $items[2], 'cost_center' => $costCenters[2], 'issue_date' => '2026-03-18', 'due_date' => '2026-04-02', 'quantity' => 5, 'unit_price' => 860, 'finalize' => true, 'payment' => ['amount' => 2472.50, 'date' => '2026-03-22', 'reference' => 'SUP-SBX-2001']],
            ['title' => 'Facility Services Bill', 'type' => 'vendor_bill', 'contact' => $suppliers[1], 'item' => $items[0], 'cost_center' => $costCenters[2], 'issue_date' => '2026-03-26', 'due_date' => '2026-04-09', 'quantity' => 1, 'unit_price' => 2600, 'finalize' => true],
            ['title' => 'Travel Network Bill', 'type' => 'vendor_bill', 'contact' => $suppliers[2], 'item' => $items[1], 'cost_center' => $costCenters[1], 'issue_date' => '2026-04-04', 'due_date' => '2026-04-19', 'quantity' => 1, 'unit_price' => 5100, 'finalize' => false],
        ] as $definition) {
            $document = $this->seedPurchaseDocument($purchaseService, $user, $definition);

            if (! empty($definition['payment']) && $document->status !== 'draft') {
                $this->seedOutgoingPayment(
                    $paymentService,
                    $user,
                    $document,
                    $definition['payment']['amount'],
                    $definition['payment']['date'],
                    $definition['payment']['reference'],
                );
            }
        }

        foreach ([
            ['title' => 'Retail Fit-Out Expense Pack', 'type' => 'purchase_invoice', 'contact' => $suppliers[1], 'item' => $items[1], 'cost_center' => $costCenters[1], 'issue_date' => '2026-03-20', 'due_date' => '2026-04-04', 'quantity' => 1, 'unit_price' => 6400, 'finalize' => true],
            ['title' => 'Operations Expense Pack', 'type' => 'purchase_invoice', 'contact' => $suppliers[0], 'item' => $items[0], 'cost_center' => $costCenters[2], 'issue_date' => '2026-04-02', 'due_date' => '2026-04-17', 'quantity' => 1, 'unit_price' => 3100, 'finalize' => true],
            ['title' => 'Branch Hardware Expense Pack', 'type' => 'purchase_invoice', 'contact' => $suppliers[2], 'item' => $items[2], 'cost_center' => $costCenters[0], 'issue_date' => '2026-04-09', 'due_date' => '2026-04-24', 'quantity' => 3, 'unit_price' => 860, 'finalize' => false],
        ] as $definition) {
            $this->seedPurchaseDocument($purchaseService, $user, $definition);
        }

        foreach ([
            ['contact' => $suppliers[0], 'amount' => 420, 'date' => '2026-04-03', 'reference' => 'PETTY-3001'],
            ['contact' => $suppliers[1], 'amount' => 365, 'date' => '2026-04-06', 'reference' => 'PETTY-3002'],
            ['contact' => $suppliers[2], 'amount' => 510, 'date' => '2026-04-11', 'reference' => 'PETTY-3003'],
        ] as $pettyCash) {
            if (Payment::query()->where('company_id', $this->sandboxCompany->id)->where('reference', $pettyCash['reference'])->exists()) {
                continue;
            }

            $paymentService->recordOutgoingPaymentForAllocations($this->sandboxCompany, $user, [
                'contact_id' => $pettyCash['contact']->id,
                'payment_date' => $pettyCash['date'],
                'method' => 'cash',
                'reference' => $pettyCash['reference'],
                'notes' => 'Petty cash settlement in sandbox mode.',
                'amount' => $pettyCash['amount'],
                'allocations' => [],
            ]);
        }
    }

    private function seedManualJournals($customers, $costCenters): void
    {
        $expenseAccount = Account::query()->where('company_id', $this->sandboxCompany->id)->where('code', '5100')->firstOrFail();
        $cashAccount = Account::query()->where('company_id', $this->sandboxCompany->id)->where('code', '1210')->firstOrFail();

        foreach ([
            ['entry_number' => 'SBX-JE-1001', 'entry_date' => '2026-04-01', 'description' => 'Payroll placeholder accrual', 'amount' => 4200, 'contact_id' => $customers[1]->id, 'cost_center_id' => $costCenters[2]->id],
            ['entry_number' => 'SBX-JE-1002', 'entry_date' => '2026-04-07', 'description' => 'Utilities reclassification', 'amount' => 1850, 'contact_id' => $customers[0]->id, 'cost_center_id' => $costCenters[2]->id],
            ['entry_number' => 'SBX-JE-1003', 'entry_date' => '2026-04-10', 'description' => 'Marketing spend true-up', 'amount' => 1325, 'contact_id' => $customers[2]->id, 'cost_center_id' => $costCenters[1]->id],
        ] as $journal) {
            $entry = JournalEntry::query()->firstOrCreate(
                ['entry_number' => $journal['entry_number']],
                [
                    'uuid' => (string) Str::uuid(),
                    'company_id' => $this->sandboxCompany->id,
                    'status' => 'posted',
                    'entry_date' => $journal['entry_date'],
                    'source_type' => 'manual_adjustment',
                    'source_id' => null,
                    'description' => $journal['description'],
                    'posted_at' => Carbon::parse($journal['entry_date'])->endOfDay(),
                ],
            );

            if ($entry->lines()->exists()) {
                continue;
            }

            JournalEntryLine::query()->create([
                'journal_entry_id' => $entry->id,
                'account_id' => $expenseAccount->id,
                'contact_id' => $journal['contact_id'],
                'cost_center_id' => $journal['cost_center_id'],
                'description' => $journal['description'],
                'debit' => $journal['amount'],
                'credit' => '0.00',
            ]);

            JournalEntryLine::query()->create([
                'journal_entry_id' => $entry->id,
                'account_id' => $cashAccount->id,
                'contact_id' => $journal['contact_id'],
                'cost_center_id' => $journal['cost_center_id'],
                'description' => $journal['description'],
                'debit' => '0.00',
                'credit' => $journal['amount'],
            ]);
        }
    }

    private function seedPlatformCustomerCompanies(User $agentUser, array $plans): void
    {
        $agent = Agent::query()->where('user_id', $agentUser->id)->firstOrFail();
        $companies = [
            ['owner_name' => 'Saeed Al Otaibi', 'owner_email' => 'riyadh.retail.owner@gulfhisab.sa', 'legal_name' => 'Riyadh Retail Group', 'trade_name' => 'Riyadh Retail', 'tax_number' => '312998877600003', 'registration_number' => '1012233445', 'city' => 'Riyadh', 'plan' => $plans['zatca-monthly'], 'status' => 'active', 'commission_amount' => 96, 'commission_status' => 'earned'],
            ['owner_name' => 'Lina Al Zahrani', 'owner_email' => 'blue.dunes.owner@gulfhisab.sa', 'legal_name' => 'Blue Dunes Foods Co.', 'trade_name' => 'Blue Dunes Foods', 'tax_number' => '312998877600010', 'registration_number' => '4033344556', 'city' => 'Jeddah', 'plan' => $plans['trial'], 'status' => 'trialing', 'commission_amount' => 64, 'commission_status' => 'pending'],
            ['owner_name' => 'Majed Al Ghamdi', 'owner_email' => 'najd.facility.owner@gulfhisab.sa', 'legal_name' => 'Najd Facility Services Ltd.', 'trade_name' => 'Najd Facility', 'tax_number' => '312998877600027', 'registration_number' => '2055566778', 'city' => 'Dammam', 'plan' => $plans['free'], 'status' => 'active', 'commission_amount' => 28, 'commission_status' => 'earned'],
        ];

        foreach ($companies as $index => $definition) {
            $owner = $this->upsertUser($definition['owner_name'], $definition['owner_email']);
            $company = Company::query()->where('legal_name', $definition['legal_name'])->first();

            if (! $company) {
                $company = app(CompanyProvisioningService::class)->provision($owner, [
                    'legal_name' => $definition['legal_name'],
                    'trade_name' => $definition['trade_name'],
                    'tax_number' => $definition['tax_number'],
                    'registration_number' => $definition['registration_number'],
                    'base_currency' => 'SAR',
                    'locale' => 'en',
                    'timezone' => 'Asia/Riyadh',
                    'branch_name' => $definition['city'].' Branch',
                    'branch_city' => $definition['city'],
                ]);
            }

            $company->update([
                'trade_name' => $definition['trade_name'],
                'tax_number' => $definition['tax_number'],
                'registration_number' => $definition['registration_number'],
                'is_active' => true,
            ]);

            $subscription = Subscription::query()->updateOrCreate(
                ['company_id' => $company->id, 'user_id' => $owner->id],
                [
                    'plan_id' => $definition['plan']->id,
                    'plan_code' => $definition['plan']->code,
                    'plan_name' => $definition['plan']->name,
                    'status' => $definition['status'],
                    'monthly_price_sar' => $definition['plan']->monthly_price_sar,
                    'trial_days' => $definition['plan']->trial_days,
                    'free_invoice_limit' => $definition['plan']->invoice_limit ?? 0,
                    'started_at' => Carbon::now()->subDays(35 - ($index * 5)),
                    'trial_ends_at' => $definition['status'] === 'trialing' ? Carbon::now()->addDays(10) : Carbon::now()->subDays(10),
                    'activated_at' => $definition['status'] === 'active' ? Carbon::now()->subDays(20 - ($index * 3)) : null,
                ],
            );

            AgentReferral::query()->updateOrCreate(
                ['agent_id' => $agent->id, 'referred_user_id' => $owner->id],
                [
                    'subscription_id' => $subscription->id,
                    'referral_code' => $agent->referral_code,
                    'commission_rate' => $agent->commission_rate,
                    'commission_amount' => $definition['commission_amount'],
                    'commission_status' => $definition['commission_status'],
                    'signed_up_at' => Carbon::now()->subDays(30 - ($index * 4)),
                    'subscribed_at' => Carbon::now()->subDays(28 - ($index * 4)),
                ],
            );
        }
    }

    private function seedSalesDocument(SalesDocumentService $service, User $user, array $definition): Document
    {
        $document = Document::query()
            ->where('company_id', $this->sandboxCompany->id)
            ->where('type', $definition['type'])
            ->where('title', $definition['title'])
            ->first();

        if (! $document) {
            $document = $service->createDraft($this->sandboxCompany, $user, [
                'type' => $definition['type'],
                'title' => $definition['title'],
                'contact_id' => $definition['contact']->id,
                'cost_center_id' => $definition['cost_center']->id,
                'issue_date' => $definition['issue_date'],
                'due_date' => $definition['due_date'],
                'language_code' => 'en',
                'notes' => 'Sandbox seeded sales document.',
                'lines' => [[
                    'item_id' => $definition['item']->id,
                    'description' => $definition['item']->name,
                    'quantity' => $definition['quantity'],
                    'unit_price' => $definition['unit_price'],
                    'cost_center_id' => $definition['cost_center']->id,
                ]],
            ]);
        }

        if (($definition['finalize'] ?? false) && $document->status === 'draft') {
            $document = $service->finalize($this->sandboxCompany, $document, $user);
        }

        return $document->fresh()->load('lines');
    }

    private function seedSalesCreditNote(SalesDocumentService $service, User $user, array $definition): void
    {
        if (Document::query()->where('company_id', $this->sandboxCompany->id)->where('type', 'credit_note')->where('title', $definition['title'])->exists()) {
            return;
        }

        $source = $definition['source']->fresh()->load('lines');
        $sourceLine = $source->lines->first();

        if (! $sourceLine) {
            return;
        }

        $service->issueCreditNote($this->sandboxCompany, $source, $user, [
            'issue_date' => $definition['issue_date'],
            'notes' => $definition['notes'],
            'lines' => [[
                'source_line_id' => $sourceLine->id,
                'quantity' => $definition['quantity'],
                'description' => $definition['title'],
            ]],
        ])->update(['title' => $definition['title']]);
    }

    private function seedPurchaseDocument(PurchaseDocumentService $service, User $user, array $definition): Document
    {
        $document = Document::query()
            ->where('company_id', $this->sandboxCompany->id)
            ->where('type', $definition['type'])
            ->where('title', $definition['title'])
            ->first();

        if (! $document) {
            $document = $service->createDraft($this->sandboxCompany, $user, [
                'type' => $definition['type'],
                'title' => $definition['title'],
                'contact_id' => $definition['contact']->id,
                'cost_center_id' => $definition['cost_center']->id,
                'issue_date' => $definition['issue_date'],
                'due_date' => $definition['due_date'],
                'language_code' => 'en',
                'notes' => 'Sandbox seeded purchase document.',
                'purchase_context' => [
                    'type' => $definition['type'] === 'purchase_invoice' ? 'expense' : 'supplier_bill',
                    'purpose' => 'Sandbox seeded purchase activity',
                    'category' => $definition['cost_center']->name,
                ],
                'lines' => [[
                    'item_id' => $definition['item']->id,
                    'description' => $definition['item']->name,
                    'quantity' => $definition['quantity'],
                    'unit_price' => $definition['unit_price'],
                    'cost_center_id' => $definition['cost_center']->id,
                ]],
            ]);
        }

        if (($definition['finalize'] ?? false) && $document->status === 'draft') {
            $document = $service->finalize($this->sandboxCompany, $document, $user);
        }

        return $document->fresh()->load('lines');
    }

    private function seedIncomingPayment(PaymentService $service, User $user, Document $document, float $amount, string $date, string $reference): void
    {
        if (Payment::query()->where('company_id', $this->sandboxCompany->id)->where('reference', $reference)->exists()) {
            return;
        }

        $service->recordIncomingPayment($this->sandboxCompany, $document, $user, [
            'amount' => $amount,
            'payment_date' => $date,
            'method' => 'bank_transfer',
            'reference' => $reference,
        ]);
    }

    private function seedOutgoingPayment(PaymentService $service, User $user, Document $document, float $amount, string $date, string $reference): void
    {
        if (Payment::query()->where('company_id', $this->sandboxCompany->id)->where('reference', $reference)->exists()) {
            return;
        }

        $service->recordOutgoingPayment($this->sandboxCompany, $document, $user, [
            'amount' => $amount,
            'payment_date' => $date,
            'method' => 'bank_transfer',
            'reference' => $reference,
        ]);
    }

    private function ensureMembership(Company $company, User $user, string $role): void
    {
        DB::table('company_user')->updateOrInsert(
            [
                'company_id' => $company->id,
                'user_id' => $user->id,
            ],
            [
                'role' => $role,
                'permissions' => null,
                'is_active' => true,
                'joined_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }

    private function upsertUser(string $name, string $email, array $attributes = []): User
    {
        return User::query()->updateOrCreate(
            ['email' => strtolower($email)],
            array_merge([
                'name' => $name,
                'password' => 'SandboxPass123!',
                'platform_role' => 'customer',
                'support_permissions' => null,
                'is_platform_active' => true,
            ], $attributes),
        );
    }
}