<?php

namespace App\Services;

use Database\Seeders\ComprehensiveChartOfAccountsSeeder;
use App\Models\Account;
use App\Models\AccountingPeriod;
use App\Models\Branch;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\CommunicationTemplate;
use App\Models\DocumentTemplate;
use App\Models\DocumentSequence;
use App\Models\PaymentTerm;
use App\Models\TaxCategory;
use App\Models\User;
use App\Models\Subscription;
use App\Support\Validation\KsaBusinessValidation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CompanyProvisioningService
{
    public function provision(User $owner, array $data): Company
    {
        return DB::transaction(function () use ($owner, $data): Company {
            $normalizedTaxNumber = KsaBusinessValidation::normalizeVatNumber($data['tax_number'] ?? null);

            $company = Company::create([
                'uuid' => (string) Str::uuid(),
                'legal_name' => $data['legal_name'],
                'trade_name' => $data['trade_name'] ?? null,
                'tax_number' => $normalizedTaxNumber,
                'registration_number' => $data['registration_number'] ?? null,
                'country_code' => 'SA',
                'base_currency' => $data['base_currency'] ?? 'SAR',
                'locale' => $data['locale'] ?? 'en',
                'timezone' => $data['timezone'] ?? 'Asia/Riyadh',
                'created_by' => $owner->id,
            ]);

            $branch = Branch::create([
                'uuid' => (string) Str::uuid(),
                'company_id' => $company->id,
                'code' => 'HQ',
                'name' => $data['branch_name'] ?? 'Head Office',
                'city' => $data['branch_city'] ?? null,
                'is_primary' => true,
            ]);

            $company->users()->attach($owner->id, [
                'role' => 'owner',
                'permissions' => json_encode(['*']),
                'is_active' => true,
                'joined_at' => now(),
            ]);

            CompanySetting::create([
                'company_id' => $company->id,
                'default_branch_id' => $branch->id,
                'default_language' => $company->locale,
                'default_receivable_account_code' => '1100',
                'default_payable_account_code' => '2000',
                'default_revenue_account_code' => '4000',
                'default_expense_account_code' => '6900',
                'default_discount_account_code' => '4500',
                'default_cash_account_code' => '1200',
                'default_customer_advance_account_code' => '2300',
                'default_supplier_advance_account_code' => '1410',
                'default_vat_payable_account_code' => '2200',
                'default_vat_receivable_account_code' => '1300',
                'numbering_rules' => [
                    'quotation' => ['padding' => 5],
                    'proforma_invoice' => ['padding' => 5],
                    'delivery_note' => ['padding' => 5],
                    'tax_invoice' => ['padding' => 5],
                    'credit_note' => ['padding' => 5],
                    'vendor_bill' => ['padding' => 5],
                    'purchase_invoice' => ['padding' => 5],
                    'purchase_credit_note' => ['padding' => 5],
                    'payment' => ['padding' => 5],
                ],
            ]);

            foreach ([
                ['document_type' => 'quotation', 'prefix' => 'QUO'],
                ['document_type' => 'proforma_invoice', 'prefix' => 'PRO'],
                ['document_type' => 'delivery_note', 'prefix' => 'DN'],
                ['document_type' => 'tax_invoice', 'prefix' => 'TINV'],
                ['document_type' => 'recurring_invoice', 'prefix' => 'RINV'],
                ['document_type' => 'cash_invoice', 'prefix' => 'CINV'],
                ['document_type' => 'api_invoice', 'prefix' => 'AINV'],
                ['document_type' => 'credit_note', 'prefix' => 'CRN'],
                ['document_type' => 'vendor_bill', 'prefix' => 'BILL'],
                ['document_type' => 'purchase_invoice', 'prefix' => 'PINV'],
                ['document_type' => 'purchase_order', 'prefix' => 'PO'],
                ['document_type' => 'debit_note', 'prefix' => 'DBN'],
                ['document_type' => 'purchase_credit_note', 'prefix' => 'PCRN'],
                ['document_type' => 'payment', 'prefix' => 'PAY'],
            ] as $sequence) {
                DocumentSequence::create([
                    'company_id' => $company->id,
                    'branch_id' => $branch->id,
                    'document_type' => $sequence['document_type'],
                    'prefix' => $sequence['prefix'],
                    'next_number' => 1,
                    'padding' => 5,
                ]);
            }

            foreach ([
                ['code' => 'VAT15', 'name' => 'Standard VAT 15%', 'scope' => 'taxable', 'rate' => 15, 'zatca_code' => 'S', 'is_default_sales' => true, 'is_default_purchase' => true],
                ['code' => 'VAT0', 'name' => 'Zero Rated', 'scope' => 'zero_rated', 'rate' => 0, 'zatca_code' => 'Z'],
                ['code' => 'EXEMPT', 'name' => 'Exempt', 'scope' => 'exempt', 'rate' => 0, 'zatca_code' => 'E'],
                ['code' => 'OUT', 'name' => 'Out of Scope', 'scope' => 'out_of_scope', 'rate' => 0, 'zatca_code' => 'O'],
                ['code' => 'RCM', 'name' => 'Reverse Charge', 'scope' => 'reverse_charge', 'rate' => 15, 'zatca_code' => 'AE'],
            ] as $tax) {
                TaxCategory::create(array_merge($tax, ['company_id' => $company->id]));
            }

            foreach ([
                [
                    'name' => 'Classic Corporate',
                    'accent_color' => '#1f7a53',
                            'uuid' => (string) Str::uuid(),
                    'is_default' => true,
                    'settings' => [
                        'layout' => 'classic_corporate',
                        'default_note' => 'Formal layout for accountants, general business invoicing, and compliance review.',
                        'show_vat_section' => true,
                        'show_totals' => true,
                        'section_grid_columns' => 2,
                        'section_gap' => 8,
                        'spacing_scale' => 0.9,
                        'canvas_padding' => 14,
                        'top_bar_height' => 3,
                    ],
                ],
                [
                    'name' => 'Modern Carded',
                    'accent_color' => '#0f766e',
                    'is_default' => false,
                    'settings' => [
                        'layout' => 'modern_carded',
                        'default_note' => 'Card-based layout with stronger separation between seller, buyer, lines, and totals.',
                        'show_vat_section' => true,
                        'show_totals' => true,
                        'section_grid_columns' => 2,
                        'section_gap' => 14,
                        'spacing_scale' => 1.04,
                        'canvas_padding' => 20,
                        'top_bar_height' => 5,
                    ],
                ],
                [
                    'name' => 'Industrial / Supply Chain',
                    'accent_color' => '#1f4f63',
                    'is_default' => false,
                    'settings' => [
                        'layout' => 'industrial_supply',
                        'default_note' => 'Operational layout for delivery, warehouse, project, and batch-oriented documents.',
                        'show_vat_section' => true,
                        'show_totals' => true,
                        'section_grid_columns' => 3,
                        'section_gap' => 10,
                        'spacing_scale' => 0.9,
                        'canvas_padding' => 16,
                        'top_bar_height' => 4,
                    ],
                ],
            ] as $template) {
                DocumentTemplate::query()->create([
                    'company_id' => $company->id,
                    'name' => $template['name'],
                    'layout' => $template['settings']['layout'],
                    'sections' => ['header', 'title', 'document-info', 'delivery', 'customer', 'items', 'totals', 'notes', 'footer'],
                    'fields' => ['document_number', 'issue_date', 'due_date', 'contact', 'lines', 'subtotal', 'tax_total', 'grand_total', 'notes', 'logo_asset_id', 'accent_color', 'watermark_text'],
                    'document_types' => ['quotation', 'proforma_invoice', 'tax_invoice', 'credit_note', 'debit_note', 'cash_invoice', 'api_invoice', 'vendor_bill', 'purchase_invoice', 'purchase_order', 'purchase_credit_note', 'delivery_note'],
                    'locale_mode' => 'bilingual',
                    'accent_color' => $template['accent_color'],
                    'settings' => $template['settings'],
                    'is_default' => $template['is_default'],
                    'is_active' => true,
                ]);
            }

            foreach ([
                [
                    'code' => 'document-email-default',
                    'name' => 'Document Email Default',
                    'channel' => 'email',
                    'source_type' => 'document',
                    'subject_template' => '{{document_number}} from {{company_name}}',
                    'body_html_template' => '<p>Dear {{contact_name}},</p><p>Please find {{document_type}} <strong>{{document_number}}</strong> from {{company_name}}.</p><p>Total: {{grand_total}}</p>',
                    'body_text_template' => 'Dear {{contact_name}}, please find {{document_type}} {{document_number}} from {{company_name}}. Total: {{grand_total}}.',
                    'variables' => ['company_name', 'document_number', 'document_type', 'contact_name', 'grand_total'],
                    'is_default' => true,
                ],
                [
                    'code' => 'document-in-app-event',
                    'name' => 'Document In-App Event',
                    'channel' => 'in_app',
                    'source_type' => 'document',
                    'subject_template' => 'Document communication logged',
                    'body_text_template' => '{{document_number}} communication recorded for {{contact_name}}.',
                    'variables' => ['document_number', 'contact_name'],
                    'is_default' => true,
                ],
            ] as $template) {
                CommunicationTemplate::query()->create(array_merge($template, [
                    'uuid' => (string) Str::uuid(),
                    'company_id' => $company->id,
                    'is_system' => true,
                    'is_active' => true,
                ]));
            }

            DB::table('units')->insert([
                ['company_id' => $company->id, 'code' => 'EA', 'name' => 'Each', 'created_at' => now(), 'updated_at' => now()],
                ['company_id' => $company->id, 'code' => 'HR', 'name' => 'Hour', 'created_at' => now(), 'updated_at' => now()],
                ['company_id' => $company->id, 'code' => 'SRV', 'name' => 'Service', 'created_at' => now(), 'updated_at' => now()],
            ]);

            foreach ([
                ['name' => 'Due on receipt', 'days_due' => 0],
                ['name' => '15 days', 'days_due' => 15],
                ['name' => '30 days', 'days_due' => 30],
            ] as $term) {
                PaymentTerm::create(array_merge($term, ['company_id' => $company->id]));
            }

            foreach (ComprehensiveChartOfAccountsSeeder::accounts() as $account) {
                Account::create(array_merge($account, [
                    'company_id' => $company->id,
                ]));
            }

            AccountingPeriod::create([
                'company_id' => $company->id,
                'name' => now()->format('Y'),
                'start_date' => now()->startOfYear()->toDateString(),
                'end_date' => now()->endOfYear()->toDateString(),
                'status' => 'open',
            ]);

            Subscription::query()
                ->where('user_id', $owner->id)
                ->whereNull('company_id')
                ->latest('id')
                ->limit(1)
                ->update(['company_id' => $company->id]);

            return $company->load(['settings', 'branches', 'taxCategories', 'paymentTerms', 'accounts']);
        });
    }
}