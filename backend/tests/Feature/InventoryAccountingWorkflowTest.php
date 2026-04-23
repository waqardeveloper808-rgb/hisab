<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Document;
use App\Models\JournalEntry;
use App\Models\TaxCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryAccountingWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_receipt_is_persisted_and_posts_real_journal_lines(): void
    {
        [$user, $companyId] = $this->createCompanyContext('Inventory Receipt Co');
        $itemId = $this->createProductItem($companyId, 'Thermal Paper Roll');

        $receipt = $this->actingAs($user)->postJson("/api/companies/{$companyId}/inventory/stock", [
            'item_id' => $itemId,
            'product_name' => 'Thermal Paper Roll',
            'material' => 'Thermal paper',
            'inventory_type' => 'raw_material',
            'size' => '80mm',
            'source' => 'purchase',
            'code' => 'TPR-RAW-80',
            'quantity_on_hand' => 120,
            'unit_cost' => 4.50,
            'offset_account_code' => '2000',
            'reference' => 'PO-0001',
            'transaction_date' => '2026-04-17',
        ], [
            'X-Gulf-Hisab-Actor-Id' => (string) $user->id,
        ])->assertCreated();

        $inventoryId = $receipt->json('data.id');
        $this->getJson("/api/companies/{$companyId}/inventory/stock")
            ->assertOk()
            ->assertJsonPath('data.0.id', $inventoryId)
            ->assertJsonPath('data.0.code', 'TPR-RAW-80');

        $journal = JournalEntry::query()
            ->where('company_id', $companyId)
            ->where('source_type', 'inventory_receipt')
            ->where('source_id', $inventoryId)
            ->with('lines.account')
            ->firstOrFail();

        $accountCodes = $journal->lines->map(fn ($line) => $line->account->code)->all();

        $this->assertSame(['1151', '2000'], $accountCodes);
        $this->assertSame('posted', $journal->status);
    }

    public function test_inventory_adjustment_and_sale_update_stock_and_accounting_and_store_document_links(): void
    {
        [$user, $companyId] = $this->createCompanyContext('Inventory Sale Co');
        $itemId = $this->createProductItem($companyId, 'Steel Panel');

        $receipt = $this->actingAs($user)->postJson("/api/companies/{$companyId}/inventory/stock", [
            'item_id' => $itemId,
            'product_name' => 'Steel Panel',
            'material' => 'Steel',
            'inventory_type' => 'finished_good',
            'size' => 'Large',
            'source' => 'production',
            'code' => 'STL-FG-LG',
            'quantity_on_hand' => 24,
            'unit_cost' => 55,
            'offset_account_code' => '1153',
            'reference' => 'PROD-0001',
            'transaction_date' => '2026-04-17',
        ], [
            'X-Gulf-Hisab-Actor-Id' => (string) $user->id,
        ])->assertCreated();

        $inventoryId = $receipt->json('data.id');

        $this->actingAs($user)->postJson("/api/companies/{$companyId}/inventory/adjustments", [
            'inventory_item_id' => $inventoryId,
            'quantity_delta' => -4,
            'unit_cost' => 55,
            'reason' => 'Damaged stock write-off',
            'reference' => 'ADJ-0001',
            'transaction_date' => '2026-04-17',
        ], [
            'X-Gulf-Hisab-Actor-Id' => (string) $user->id,
        ])->assertCreated();

        $adjustmentJournal = JournalEntry::query()
            ->where('company_id', $companyId)
            ->where('source_type', 'inventory_adjustment')
            ->with('lines.account')
            ->latest('id')
            ->firstOrFail();

        $this->assertSame(['5050', '1152'], $adjustmentJournal->lines->map(fn ($line) => $line->account->code)->all());

        [$proforma, $taxInvoice] = $this->createSalesDocuments($user, $companyId, $itemId);

        $sale = $this->actingAs($user)->postJson("/api/companies/{$companyId}/inventory/sales", [
            'inventory_item_id' => $inventoryId,
            'quantity' => 2,
            'unit_price' => 110,
            'unit_cost' => 55,
            'tax_rate' => 15,
            'cash_account_code' => '1210',
            'reference' => 'SAL-0001',
            'transaction_date' => '2026-04-17',
            'proforma_invoice' => $proforma->document_number,
            'tax_invoice' => $taxInvoice->document_number,
            'delivery_note' => 'DN-2026-0001',
            'document_links' => [
                ['documentId' => $proforma->id, 'documentNumber' => $proforma->document_number, 'documentType' => $proforma->type, 'status' => $proforma->status],
                ['documentId' => $taxInvoice->id, 'documentNumber' => $taxInvoice->document_number, 'documentType' => $taxInvoice->type, 'status' => $taxInvoice->status],
                ['documentId' => null, 'documentNumber' => 'DN-2026-0001', 'documentType' => 'delivery_note', 'status' => 'linked'],
            ],
        ], [
            'X-Gulf-Hisab-Actor-Id' => (string) $user->id,
        ])->assertCreated();

        $this->assertCount(3, $sale->json('data.document_links'));

        $stock = $this->getJson("/api/companies/{$companyId}/inventory/stock")
            ->assertOk()
            ->json('data.0');

        $this->assertSame(16.0, (float) $stock['quantity_on_hand']);

        $saleJournal = JournalEntry::query()
            ->where('company_id', $companyId)
            ->where('source_type', 'inventory_sale')
            ->with('lines.account')
            ->latest('id')
            ->firstOrFail();

        $this->assertSame(['1210', '4000', '2200', '5000', '1152'], $saleJournal->lines->map(fn ($line) => $line->account->code)->all());
    }

    public function test_manual_journal_sale_intelligence_metadata_is_stored(): void
    {
        [$user, $companyId] = $this->createCompanyContext('Journal Intelligence Co');
        $company = Company::findOrFail($companyId);
        $cashId = $company->accounts()->where('code', '1210')->value('id');
        $revenueId = $company->accounts()->where('code', '4000')->value('id');

        $response = $this->actingAs($user)->postJson("/api/companies/{$companyId}/journals", [
            'entry_date' => '2026-04-17',
            'posting_date' => '2026-04-17',
            'reference' => 'JV-SALE-01',
            'memo' => 'Sale / outgoing goods',
            'metadata' => [
                'sale_intelligence' => [
                    'proforma_invoice' => 'PRO-00001',
                    'tax_invoice' => 'TINV-00001',
                    'delivery_note' => 'DN-00001',
                ],
            ],
            'status' => 'posted',
            'lines' => [
                ['account_id' => $cashId, 'debit' => 230, 'credit' => 0, 'description' => 'Cash received'],
                ['account_id' => $revenueId, 'debit' => 0, 'credit' => 230, 'description' => 'Revenue'],
            ],
        ], [
            'X-Gulf-Hisab-Actor-Id' => (string) $user->id,
        ])->assertCreated();

        $journalId = $response->json('data.id');

        $this->getJson("/api/companies/{$companyId}/journals/{$journalId}")
            ->assertOk()
            ->assertJsonPath('data.metadata.sale_intelligence.proforma_invoice', 'PRO-00001')
            ->assertJsonPath('data.metadata.sale_intelligence.tax_invoice', 'TINV-00001')
            ->assertJsonPath('data.metadata.sale_intelligence.delivery_note', 'DN-00001');
    }

    private function createCompanyContext(string $legalName): array
    {
        $user = User::factory()->create();
        $companyId = $this->actingAs($user)->postJson('/api/companies', [
            'legal_name' => $legalName,
        ])->json('data.id');

        return [$user, $companyId];
    }

    private function createProductItem(int $companyId, string $name): int
    {
        $company = Company::findOrFail($companyId);
        $taxCategoryId = TaxCategory::query()->where('company_id', $companyId)->where('code', 'VAT15')->value('id');
        $incomeAccountId = $company->accounts()->where('code', '4000')->value('id');
        $expenseAccountId = $company->accounts()->where('code', '6900')->value('id');

        return $this->postJson("/api/companies/{$companyId}/items", [
            'type' => 'product',
            'name' => $name,
            'tax_category_id' => $taxCategoryId,
            'income_account_id' => $incomeAccountId,
            'expense_account_id' => $expenseAccountId,
            'default_sale_price' => 110,
            'default_purchase_price' => 55,
        ])->json('data.id');
    }

    private function createSalesDocuments(User $user, int $companyId, int $itemId): array
    {
        $this->actingAs($user);
        $company = Company::findOrFail($companyId);
        $contactId = $this->postJson("/api/companies/{$companyId}/contacts", [
            'type' => 'customer',
            'display_name' => 'Inventory Customer',
        ])->json('data.id');

        $taxCategoryId = TaxCategory::query()->where('company_id', $companyId)->where('code', 'VAT15')->value('id');
        $incomeAccountId = $company->accounts()->where('code', '4000')->value('id');

        $proformaId = $this->postJson("/api/companies/{$companyId}/sales-documents", [
            'type' => 'proforma_invoice',
            'contact_id' => $contactId,
            'issue_date' => '2026-04-17',
            'due_date' => '2026-04-18',
            'lines' => [[
                'item_id' => $itemId,
                'quantity' => 2,
                'unit_price' => 110,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $incomeAccountId,
            ]],
        ])->json('data.id');

        $taxInvoiceId = $this->postJson("/api/companies/{$companyId}/sales-documents", [
            'type' => 'tax_invoice',
            'contact_id' => $contactId,
            'issue_date' => '2026-04-17',
            'due_date' => '2026-04-18',
            'lines' => [[
                'item_id' => $itemId,
                'quantity' => 2,
                'unit_price' => 110,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $incomeAccountId,
            ]],
        ])->json('data.id');

        $this->postJson("/api/companies/{$companyId}/sales-documents/{$taxInvoiceId}/finalize")->assertOk();

        return [Document::findOrFail($proformaId), Document::findOrFail($taxInvoiceId)];
    }
}