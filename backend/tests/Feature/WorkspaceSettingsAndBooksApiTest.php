<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\TaxCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkspaceSettingsAndBooksApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_settings_can_be_read_and_updated(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $companyId = $this->postJson('/api/companies', [
            'legal_name' => 'Settings Co',
        ])->json('data.id');

        $this->getJson("/api/companies/{$companyId}/settings")
            ->assertOk()
            ->assertJsonPath('data.company.legal_name', 'Settings Co');

        $this->putJson("/api/companies/{$companyId}/settings", [
            'company' => [
                'legal_name' => 'Settings Co Updated',
                'trade_name' => 'Settings Trade',
                'tax_number' => '300000000000111',
                'registration_number' => 'REG-111',
                'base_currency' => 'SAR',
                'locale' => 'en',
                'timezone' => 'Asia/Riyadh',
            ],
            'settings' => [
                'default_language' => 'en',
                'invoice_prefix' => 'INV',
                'credit_note_prefix' => 'CRN',
                'payment_prefix' => 'PAY',
                'vendor_bill_prefix' => 'BILL',
                'purchase_invoice_prefix' => 'PINV',
                'purchase_credit_note_prefix' => 'PCRN',
                'default_receivable_account_code' => '1100',
                'default_payable_account_code' => '2000',
                'default_revenue_account_code' => '4000',
                'default_expense_account_code' => '6900',
                'default_cash_account_code' => '1200',
                'default_customer_advance_account_code' => '2300',
                'default_supplier_advance_account_code' => '1410',
                'default_vat_payable_account_code' => '2200',
                'default_vat_receivable_account_code' => '1300',
                'zatca_environment' => 'production',
                'numbering_rules' => [
                    'invoice_footer' => 'Thank you',
                ],
            ],
        ])->assertOk()
            ->assertJsonPath('data.company.legal_name', 'Settings Co Updated')
            ->assertJsonPath('data.settings.zatca_environment', 'production')
            ->assertJsonPath('data.settings.numbering_rules.invoice_footer', 'Thank you');
    }

    public function test_general_ledger_returns_posted_lines(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $companyId = $this->postJson('/api/companies', [
            'legal_name' => 'Ledger Co',
        ])->json('data.id');

        $company = Company::findOrFail($companyId);

        $contactId = $this->postJson("/api/companies/{$companyId}/contacts", [
            'type' => 'customer',
            'display_name' => 'Ledger Customer',
        ])->json('data.id');

        $taxCategoryId = TaxCategory::query()->where('company_id', $companyId)->where('code', 'VAT15')->value('id');
        $incomeAccountId = $company->accounts()->where('code', '4000')->value('id');

        $itemId = $this->postJson("/api/companies/{$companyId}/items", [
            'type' => 'service',
            'name' => 'Ledger Service',
            'tax_category_id' => $taxCategoryId,
            'income_account_id' => $incomeAccountId,
            'default_sale_price' => 100,
        ])->json('data.id');

        $documentId = $this->postJson("/api/companies/{$companyId}/sales-documents", [
            'type' => 'tax_invoice',
            'contact_id' => $contactId,
            'issue_date' => '2026-04-13',
            'due_date' => '2026-04-20',
            'lines' => [[
                'item_id' => $itemId,
                'quantity' => 1,
                'unit_price' => 100,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $incomeAccountId,
            ]],
        ])->json('data.id');

        $this->postJson("/api/companies/{$companyId}/sales-documents/{$documentId}/finalize")
            ->assertOk();

        $this->getJson("/api/companies/{$companyId}/reports/general-ledger")
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }
}