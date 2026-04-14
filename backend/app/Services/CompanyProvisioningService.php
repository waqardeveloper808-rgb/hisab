<?php

namespace App\Services;

use App\Models\Account;
use App\Models\AccountingPeriod;
use App\Models\Branch;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\DocumentTemplate;
use App\Models\DocumentSequence;
use App\Models\PaymentTerm;
use App\Models\TaxCategory;
use App\Models\User;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CompanyProvisioningService
{
    public function provision(User $owner, array $data): Company
    {
        return DB::transaction(function () use ($owner, $data): Company {
            $company = Company::create([
                'uuid' => (string) Str::uuid(),
                'legal_name' => $data['legal_name'],
                'trade_name' => $data['trade_name'] ?? null,
                'tax_number' => $data['tax_number'] ?? null,
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
                'numbering_rules' => [
                    'quotation' => ['padding' => 5],
                    'proforma_invoice' => ['padding' => 5],
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

            DocumentTemplate::query()->create([
                'company_id' => $company->id,
                'name' => 'Standard bilingual',
                'document_types' => ['quotation', 'proforma_invoice', 'tax_invoice', 'cash_invoice', 'api_invoice', 'vendor_bill', 'purchase_invoice', 'purchase_order', 'debit_note'],
                'locale_mode' => 'bilingual',
                'accent_color' => '#1f7a53',
                'settings' => ['default_note' => 'Generated by Gulf Hisab'],
                'is_default' => true,
                'is_active' => true,
            ]);

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

            foreach ([
                ['code' => '1100', 'name' => 'Accounts Receivable', 'type' => 'asset', 'subtype' => 'receivable'],
                ['code' => '1210', 'name' => 'Bank Account', 'type' => 'asset', 'subtype' => 'cash'],
                ['code' => '1300', 'name' => 'Inventory', 'type' => 'asset', 'subtype' => 'inventory'],
                ['code' => '1410', 'name' => 'Supplier Advances', 'type' => 'asset', 'subtype' => 'supplier_advance'],
                ['code' => '2100', 'name' => 'Accounts Payable', 'type' => 'liability', 'subtype' => 'payable'],
                ['code' => '2300', 'name' => 'Customer Advances', 'type' => 'liability', 'subtype' => 'customer_credit'],
                ['code' => '2200', 'name' => 'VAT Payable', 'type' => 'liability', 'subtype' => 'tax'],
                ['code' => '2210', 'name' => 'VAT Receivable', 'type' => 'asset', 'subtype' => 'tax'],
                ['code' => '4000', 'name' => 'Sales Revenue', 'type' => 'revenue', 'subtype' => 'sales'],
                ['code' => '5000', 'name' => 'Cost of Sales', 'type' => 'expense', 'subtype' => 'cogs'],
                ['code' => '5100', 'name' => 'Operating Expenses', 'type' => 'expense', 'subtype' => 'operating_expense'],
            ] as $account) {
                Account::create(array_merge($account, [
                    'company_id' => $company->id,
                    'allows_posting' => true,
                    'is_system' => true,
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