<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Document;
use App\Models\JournalEntry;
use App\Models\TaxCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Phase1ClosureWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_phase1_closure_flow_generates_discount_inventory_and_adjustment_proof(): void
    {
        [$user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId] = $this->bootstrapSalesContext();

        $this->seedInventory($user, $companyId, $itemId, 'PH1-INV-001', 8);

        $stockBlockDraft = $this->actingAs($user)->postJson("/api/companies/{$companyId}/sales-documents", [
            'type' => 'tax_invoice',
            'contact_id' => $contactId,
            'issue_date' => '2026-04-18',
            'due_date' => '2026-04-25',
            'lines' => [[
                'item_id' => $itemId,
                'quantity' => 99,
                'unit_price' => 100,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $incomeAccountId,
            ]],
        ])->assertCreated();

        $stockBlockId = $stockBlockDraft->json('data.id');
        $stockBlockFinalize = $this->actingAs($user)
            ->postJson("/api/companies/{$companyId}/sales-documents/{$stockBlockId}/finalize")
            ->assertStatus(422)
            ->json();

        $draft = $this->actingAs($user)->postJson("/api/companies/{$companyId}/sales-documents", [
            'type' => 'tax_invoice',
            'contact_id' => $contactId,
            'issue_date' => '2026-04-18',
            'due_date' => '2026-04-25',
            'lines' => [[
                'item_id' => $itemId,
                'quantity' => 2,
                'unit_price' => 100,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $incomeAccountId,
                'discount_amount' => 10,
            ]],
        ])->assertCreated();

        $invoiceId = $draft->json('data.id');
        $this->actingAs($user)->postJson("/api/companies/{$companyId}/sales-documents/{$invoiceId}/finalize")->assertOk();

        $invoice = Document::findOrFail($invoiceId);
        $salesJournal = JournalEntry::query()
            ->where('company_id', $companyId)
            ->where('source_type', 'document')
            ->where('source_id', $invoiceId)
            ->with('lines.account')
            ->latest('id')
            ->firstOrFail();

        $payment = $this->actingAs($user)->postJson("/api/companies/{$companyId}/sales-documents/{$invoiceId}/payments", [
            'amount' => 208,
            'discount_allowed_amount' => 10.5,
            'payment_date' => '2026-04-19',
            'method' => 'bank_transfer',
            'reference' => 'PH1-PAY-001',
        ])->assertCreated();

        $invoice->refresh();
        $paymentId = $payment->json('data.id');
        $paymentJournal = JournalEntry::query()
            ->where('company_id', $companyId)
            ->where('source_type', 'payment')
            ->where('source_id', $paymentId)
            ->with('lines.account', 'lines.document')
            ->firstOrFail();

        $debitNote = $this->actingAs($user)->postJson("/api/companies/{$companyId}/sales-documents/{$invoiceId}/debit-notes", [
            'issue_date' => '2026-04-20',
            'notes' => 'Additional delivered quantity',
            'status_reason' => 'Additional supplied quantity',
            'lines' => [[
                'source_line_id' => Document::findOrFail($invoiceId)->lines()->firstOrFail()->id,
                'quantity' => 1,
                'unit_price' => 100,
            ]],
        ])->assertCreated();

        $debitId = $debitNote->json('data.id');
        $debitDocument = Document::findOrFail($debitId);
        $debitInventoryJournals = $debitDocument->custom_fields['inventory_journal_entry_ids'] ?? [];

        $vatSummary = $this->actingAs($user)
            ->getJson("/api/companies/{$companyId}/reports/vat-summary")
            ->assertOk()
            ->json('data');

        $customerStatement = $this->actingAs($user)
            ->getJson("/api/companies/{$companyId}/reports/customer-statements/{$contactId}")
            ->assertOk()
            ->json('data');

        $this->assertTrue($salesJournal->lines->contains(fn ($line) => $line->account?->code === '4500' && (float) $line->debit === (float) $invoice->discount_total));
        $this->assertTrue($paymentJournal->lines->contains(fn ($line) => $line->account?->code === '4500' && (float) $line->debit === 10.5));
        $this->assertTrue($paymentJournal->lines->contains(fn ($line) => $line->account?->code === '1100' && (float) $line->credit === 218.5));
        $this->assertSame('paid', $invoice->status);
        $this->assertSame('0.00', (string) $invoice->balance_due);
        $this->assertNotEmpty($debitInventoryJournals);
        $this->assertContains('debit_note', array_column($customerStatement['documents'], 'type'));

        $this->writeEvidence([
            'status' => 'pass',
            'stock_block' => [
                'errors' => $stockBlockFinalize['errors'] ?? [],
                'message' => $stockBlockFinalize['message'] ?? null,
            ],
            'sales_document_journal' => $salesJournal->lines->map(fn ($line) => [
                'account_code' => $line->account?->code,
                'debit' => (float) $line->debit,
                'credit' => (float) $line->credit,
                'description' => $line->description,
            ])->values()->all(),
            'payment_journal' => $paymentJournal->lines->map(fn ($line) => [
                'account_code' => $line->account?->code,
                'debit' => (float) $line->debit,
                'credit' => (float) $line->credit,
                'document_number' => $line->document?->document_number,
            ])->values()->all(),
            'invoice' => [
                'document_number' => $invoice->document_number,
                'status' => $invoice->status,
                'discount_total' => (float) $invoice->discount_total,
                'balance_due' => (float) $invoice->balance_due,
            ],
            'debit_note' => [
                'document_number' => $debitDocument->document_number,
                'inventory_journal_entry_ids' => $debitInventoryJournals,
                'source_invoice_number' => $debitDocument->custom_fields['source_invoice_number'] ?? null,
            ],
            'vat_summary' => $vatSummary,
            'customer_statement' => $customerStatement,
        ]);
    }

    private function bootstrapSalesContext(): array
    {
        $user = User::factory()->create();
        $companyId = $this->actingAs($user)->postJson('/api/companies', [
            'legal_name' => 'Phase 1 Closure Co',
        ])->assertCreated()->json('data.id');

        $company = Company::findOrFail($companyId);
        $contactId = $this->actingAs($user)->postJson("/api/companies/{$companyId}/contacts", [
            'type' => 'customer',
            'display_name' => 'Phase 1 Customer',
            'tax_number' => '300000000009991',
            'origin' => 'inside_ksa',
            'country_code' => 'SA',
            'vat_status' => 'taxable',
            'customer_type' => 'business',
        ])->assertCreated()->json('data.id');

        $taxCategoryId = TaxCategory::query()->where('company_id', $companyId)->where('code', 'VAT15')->value('id');
        $incomeAccountId = $company->accounts()->where('code', '4000')->value('id');
        $expenseAccountId = $company->accounts()->where('code', '6900')->value('id');

        $itemId = $this->actingAs($user)->postJson("/api/companies/{$companyId}/items", [
            'type' => 'product',
            'name' => 'Phase 1 Product',
            'tax_category_id' => $taxCategoryId,
            'income_account_id' => $incomeAccountId,
            'expense_account_id' => $expenseAccountId,
            'default_sale_price' => 100,
            'default_purchase_price' => 40,
        ])->assertCreated()->json('data.id');

        return [$user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId];
    }

    private function seedInventory(User $user, int $companyId, int $itemId, string $code, int $quantity): void
    {
        $this->actingAs($user)->postJson("/api/companies/{$companyId}/inventory/stock", [
            'item_id' => $itemId,
            'product_name' => 'Phase 1 Product',
            'material' => 'Finished good',
            'inventory_type' => 'finished_good',
            'size' => 'Standard',
            'source' => 'production',
            'code' => $code,
            'quantity_on_hand' => $quantity,
            'unit_cost' => 40,
            'offset_account_code' => '1153',
            'reference' => 'SEED-'.$code,
            'transaction_date' => '2026-04-18',
        ], [
            'X-Gulf-Hisab-Actor-Id' => (string) $user->id,
        ])->assertCreated();
    }

    private function writeEvidence(array $evidence): void
    {
        $reportsDir = dirname(base_path()).DIRECTORY_SEPARATOR.'qa_reports'.DIRECTORY_SEPARATOR.'phase1_closure_20260418';
        if (! is_dir($reportsDir)) {
            mkdir($reportsDir, 0777, true);
        }

        file_put_contents(
            $reportsDir.DIRECTORY_SEPARATOR.'phase1-workflow-proof.json',
            json_encode($evidence, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }
}