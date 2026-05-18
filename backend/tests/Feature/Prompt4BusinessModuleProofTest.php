<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Document;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\TaxCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Automated proof bundle for Prompt 4: linked dummy postings, VAT line reconciliation,
 * trial balance integrity, ledger-linked registers, inventory seed, purchases (VAT Paid),
 * and positive bank after opening funding.
 */
class Prompt4BusinessModuleProofTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, string> */
    private function workspaceHeaders(User $user, Company $company): array
    {
        return [
            'X-Gulf-Hisab-Workspace-Token' => (string) config('workspace.api_token'),
            'X-Gulf-Hisab-Actor-Id' => (string) $user->id,
            'X-Gulf-Hisab-Active-Company-Id' => (string) $company->id,
        ];
    }

    /**
     * @return array{0: User, 1: int, 2: int, 3: int, 4: int, 5: int, 6: int, 7: Company}
     */
    private function bootstrapContext(): array
    {
        $user = User::factory()->create();
        $companyId = $this->actingAs($user)->postJson('/api/companies', [
            'legal_name' => 'Prompt 4 Proof Co',
        ])->assertCreated()->json('data.id');

        $company = Company::findOrFail($companyId);

        $contactId = $this->actingAs($user)->postJson("/api/companies/{$companyId}/contacts", array_merge([
            'type' => 'customer',
            'display_name' => 'Prompt 4 Customer',
            'tax_number' => $this->uniqueKsaVatNumber('p4-customer'),
            'origin' => 'inside_ksa',
            'country_code' => 'SA',
            'vat_status' => 'taxable',
            'customer_type' => 'business',
        ], $this->ksaContactExtras()))->assertCreated()->json('data.id');

        $taxCategoryId = TaxCategory::query()->where('company_id', $companyId)->where('code', 'VAT15')->value('id');
        $incomeAccountId = $company->accounts()->where('code', '4000')->value('id');
        $expenseAccountId = $company->accounts()->where('code', '6900')->value('id');

        $itemId = $this->actingAs($user)->postJson("/api/companies/{$companyId}/items", [
            'type' => 'product',
            'name' => 'Prompt 4 Widget',
            'tax_category_id' => $taxCategoryId,
            'income_account_id' => $incomeAccountId,
            'expense_account_id' => $expenseAccountId,
            'default_sale_price' => 100,
            'default_purchase_price' => 40,
        ])->assertCreated()->json('data.id');

        return [$user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId, $expenseAccountId, $company];
    }

    public function test_prompt4_accounting_vat_inventory_and_reports_reconcile(): void
    {
        /** @var User $user */
        /** @var Company $company */
        [$user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId, $expenseAccountId, $company] = $this->bootstrapContext();

        $cashId = $company->accounts()->where('code', '1200')->value('id');
        $openingEquityId = $company->accounts()->where('code', '3900')->value('id');
        $this->assertNotNull($cashId);
        $this->assertNotNull($openingEquityId);

        $fundingUuid = (string) Str::uuid();
        $this->actingAs($user)->postJson('/api/journal/post', [
            'company_id' => $company->id,
            'source_type' => 'capital',
            'source_id' => $fundingUuid,
            'entry_date' => '2026-04-01',
            'description' => 'Prompt 4 opening cash funding (opening balance equity)',
            'entries' => [
                ['account_id' => $cashId, 'debit' => 500_000.0, 'credit' => 0, 'description' => 'Cash opening'],
                ['account_id' => $openingEquityId, 'debit' => 0, 'credit' => 500_000.0, 'description' => 'Opening balance equity'],
            ],
        ], $this->workspaceHeaders($user, $company))->assertCreated()->assertJsonPath('data.status', 'posted');

        $this->actingAs($user)->postJson("/api/companies/{$companyId}/inventory/stock", [
            'item_id' => $itemId,
            'product_name' => 'Prompt 4 Widget',
            'material' => 'Finished good',
            'inventory_type' => 'finished_good',
            'size' => 'Std',
            'source' => 'production',
            'code' => 'P4-STK-001',
            'quantity_on_hand' => 400,
            'unit_cost' => 40,
            'offset_account_code' => '1153',
            'reference' => 'P4-STOCK',
            'transaction_date' => '2026-04-02',
        ], [
            'X-Gulf-Hisab-Actor-Id' => (string) $user->id,
        ])->assertCreated();

        $invoiceIds = [];
        for ($i = 1; $i <= 8; $i++) {
            $day = str_pad((string) $i, 2, '0', STR_PAD_LEFT);
            $draft = $this->actingAs($user)->postJson("/api/companies/{$companyId}/sales-documents", [
                'type' => 'tax_invoice',
                'contact_id' => $contactId,
                'issue_date' => '2026-04-'.$day,
                'due_date' => '2026-05-'.$day,
                'lines' => [[
                    'item_id' => $itemId,
                    'quantity' => 10,
                    'unit_price' => 100,
                    'tax_category_id' => $taxCategoryId,
                    'ledger_account_id' => $incomeAccountId,
                ]],
            ])->assertCreated();

            $docId = $draft->json('data.id');
            $invoiceIds[] = $docId;
            $this->actingAs($user)->postJson("/api/companies/{$companyId}/sales-documents/{$docId}/finalize")->assertOk();
            $this->assertDatabaseHas('journal_entries', [
                'company_id' => $companyId,
                'source_type' => 'document',
                'source_id' => $docId,
            ]);
        }

        $supplierId = $this->actingAs($user)->postJson("/api/companies/{$companyId}/contacts", array_merge([
            'type' => 'supplier',
            'display_name' => 'Prompt 4 Supplier',
            'tax_number' => $this->uniqueKsaVatNumber('p4-supplier'),
        ], $this->ksaContactExtras()))->assertCreated()->json('data.id');

        $purchaseDraft = $this->actingAs($user)->postJson("/api/companies/{$companyId}/purchase-documents", [
            'type' => 'purchase_invoice',
            'contact_id' => $supplierId,
            'issue_date' => '2026-04-10',
            'due_date' => '2026-04-20',
            'lines' => [[
                'item_id' => $itemId,
                'quantity' => 4,
                'unit_price' => 250,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $expenseAccountId,
            ]],
        ])->assertCreated();

        $purchaseId = $purchaseDraft->json('data.id');
        $this->actingAs($user)->postJson("/api/companies/{$companyId}/purchase-documents/{$purchaseId}/finalize")->assertOk();

        // --- VAT document-level received: eight tax invoices ---
        $received = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/vat-received-details")->assertOk()->json('data');
        $taxInvoiceRows = array_values(array_filter($received, fn ($r) => ($r['document_type'] ?? '') === 'tax_invoice'));
        $this->assertGreaterThanOrEqual(8, count($taxInvoiceRows));
        foreach ($invoiceIds as $pid) {
            $doc = Document::findOrFail($pid);
            $this->assertTrue(in_array($doc->document_number, array_column($received, 'document_number'), true), 'Invoice register must list each seeded tax invoice.');
        }

        // --- Line-level VAT received: ≥ 8 rows ---
        $lineDetails = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/vat-received-line-details")->assertOk()->json('data');
        $this->assertGreaterThanOrEqual(8, count($lineDetails));

        $lineVatSum = array_sum(array_map(fn ($row) => (float) ($row['vat_amount'] ?? 0), $lineDetails));

        // --- VAT summary meta reconciliation ---
        $vatSummaryEnvelope = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/vat-summary")->assertOk()->json();

        /** @phpstan-ignore-next-line */
        $meta = $vatSummaryEnvelope['meta'] ?? [];
        $vatReceivedLedger = (float) str_replace(',', '', (string) ($meta['vat_received'] ?? '0'));
        $vatPaidLedger = (float) str_replace(',', '', (string) ($meta['vat_paid'] ?? '0'));
        $vatPayableMeta = (float) str_replace(',', '', (string) ($meta['vat_payable'] ?? '0'));

        $this->assertEqualsWithDelta(
            $vatReceivedLedger - $vatPaidLedger,
            $vatPayableMeta,
            0.03,
            'vat_payable must equal vat_received - vat_paid from ledger'
        );

        $expectedDocVatSum = collect($received)->reduce(function ($sum, $row) {
            return $sum + (float) str_replace(',', '', (string) ($row['vat_amount'] ?? '0'));
        }, 0);
        $this->assertEqualsWithDelta($expectedDocVatSum, $lineVatSum, 1.50, 'Line-level VAT totals must reconcile to document-level VAT received');

        // --- VAT paid taxable column present ---
        $paid = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/vat-paid-details")->assertOk()->json('data');
        $this->assertNotEmpty($paid);
        foreach ($paid as $prow) {
            $this->assertArrayHasKey('taxable_amount', $prow);
        }

        // --- Posted journal integrity: Σ debit = Σ credit company-wide ---
        $totals = DB::table('journal_entry_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->where('journal_entries.company_id', $companyId)
            ->where('journal_entries.status', 'posted')
            ->selectRaw('COALESCE(SUM(journal_entry_lines.debit), 0) as d, COALESCE(SUM(journal_entry_lines.credit), 0) as c')
            ->first();
        $this->assertEqualsWithDelta((float) $totals->d, (float) $totals->c, 0.02);

        // --- Trial balance ---
        $tb = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/trial-balance")->assertOk()->json('data');
        $trialDebit = collect($tb)->sum(fn (array $row) => (float) ($row['debit_total'] ?? 0));
        $trialCredit = collect($tb)->sum(fn (array $row) => (float) ($row['credit_total'] ?? 0));
        $this->assertEqualsWithDelta($trialDebit, $trialCredit, 0.03, 'Trial balance aggregates must tie');

        // --- Bank account (cash) closing — not silently negative ---
        $cashRow = collect($tb)->firstWhere('code', '1200');
        $this->assertNotNull($cashRow, 'Treasury cash account 1200 must appear on TB');
        $this->assertGreaterThanOrEqual(0, (float) ($cashRow['balance'] ?? 0));

        // --- Register / linkage proof ---
        $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/journal-register")->assertOk();
        foreach ($invoiceIds as $pid) {
            $this->assertGreaterThanOrEqual(1, JournalEntry::query()
                ->where('company_id', $companyId)
                ->where('source_type', 'document')
                ->where('source_id', $pid)
                ->count());
        }

        // --- Core financial reports ---
        $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/profit-loss")->assertOk();
        $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/balance-sheet")->assertOk();
        $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/general-ledger")->assertOk();

        $intel = $this->actingAs($user)->getJson("/api/companies/{$companyId}/intelligence/overview")->assertOk()->json('data');
        $this->assertIsArray($intel);
        $this->assertArrayHasKey('metrics', $intel);

        // --- Inventory / COGS: posted inventory relief linked to taxed sales ---
        $this->assertGreaterThanOrEqual(
            1,
            JournalEntry::query()
                ->where('company_id', $companyId)
                ->where('source_type', 'document_inventory')
                ->whereIn('source_id', $invoiceIds)
                ->count(),
            'Fulfillment-linked inventory postings must exist for seeded stock-backed tax invoices.'
        );

        // --- Inventory readback ---
        $stock = $this->actingAs($user)->getJson("/api/companies/{$companyId}/inventory/stock")->assertOk()->json('data');
        $codes = collect($stock)->pluck('code')->filter()->values()->all();
        $this->assertContains('P4-STK-001', $codes);
    }

    public function test_prompt4_overdue_tax_invoice_is_included_in_vat_received_details(): void
    {
        /** @var User $user */
        /** @var Company $company */
        [$user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId, $expenseAccountId, $company] = $this->bootstrapContext();

        $cashId = $company->accounts()->where('code', '1200')->value('id');
        $openingEquityId = $company->accounts()->where('code', '3900')->value('id');
        $this->assertNotNull($cashId);
        $this->assertNotNull($openingEquityId);

        $fundingUuid = (string) Str::uuid();
        $this->actingAs($user)->postJson('/api/journal/post', [
            'company_id' => $company->id,
            'source_type' => 'capital',
            'source_id' => $fundingUuid,
            'entry_date' => '2026-04-01',
            'description' => 'Prompt 4C opening cash',
            'entries' => [
                ['account_id' => $cashId, 'debit' => 800_000.0, 'credit' => 0, 'description' => 'Cash opening'],
                ['account_id' => $openingEquityId, 'debit' => 0, 'credit' => 800_000.0, 'description' => 'Opening equity'],
            ],
        ], $this->workspaceHeaders($user, $company))->assertCreated()->assertJsonPath('data.status', 'posted');

        $this->actingAs($user)->postJson("/api/companies/{$companyId}/inventory/stock", [
            'item_id' => $itemId,
            'product_name' => 'Prompt 4C Widget',
            'material' => 'Finished good',
            'inventory_type' => 'finished_good',
            'size' => 'Std',
            'source' => 'production',
            'code' => 'P4C-STK-OVD',
            'quantity_on_hand' => 100,
            'unit_cost' => 40,
            'offset_account_code' => '1153',
            'reference' => 'P4C-STOCK',
            'transaction_date' => '2026-04-02',
        ], [
            'X-Gulf-Hisab-Actor-Id' => (string) $user->id,
        ])->assertCreated();

        $draft = $this->actingAs($user)->postJson("/api/companies/{$companyId}/sales-documents", [
            'type' => 'tax_invoice',
            'contact_id' => $contactId,
            'issue_date' => '2026-04-03',
            'due_date' => '2026-04-03',
            'lines' => [[
                'item_id' => $itemId,
                'quantity' => 10,
                'unit_price' => 100,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $incomeAccountId,
            ]],
        ])->assertCreated();

        $invId = (int) $draft->json('data.id');
        $this->actingAs($user)->postJson("/api/companies/{$companyId}/sales-documents/{$invId}/finalize")->assertOk();

        Document::query()->where('id', $invId)->where('company_id', $companyId)->update([
            'status' => 'overdue',
            'due_date' => '2020-03-01',
        ]);

        $received = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/vat-received-details")->assertOk()->json('data');
        $needle = collect($received)->firstWhere('id', $invId);
        $this->assertNotNull($needle);
        $this->assertSame('overdue', $needle['status'] ?? '');
        $this->assertSame('tax_invoice', $needle['document_type'] ?? '');
        $this->assertGreaterThan(0.0, (float) ($needle['vat_amount'] ?? 0));

        $docVat = (float) ($needle['vat_amount'] ?? 0);
        $vatSummaryEnvelope = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/vat-summary")->assertOk()->json();
        /** @phpstan-ignore-next-line */
        $vatReceivedLedger = (float) str_replace(',', '', (string) (($vatSummaryEnvelope['meta']['vat_received'] ?? '0')));

        $sumReceivedDetails = collect($received)->reduce(function ($sum, $row) {
            return $sum + (float) str_replace(',', '', (string) ($row['vat_amount'] ?? '0'));
        }, 0.0);
        $this->assertGreaterThanOrEqual(round($docVat, 2) - 0.02, round($sumReceivedDetails, 2));
        $this->assertGreaterThan(0.0, $vatReceivedLedger);
    }

    public function test_prompt4_inventory_cogs_journal_lines_are_reconciled(): void
    {
        /** @var User $user */
        /** @var Company $company */
        [$user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId, $expenseAccountId, $company] = $this->bootstrapContext();

        $cashId = $company->accounts()->where('code', '1200')->value('id');
        $openingEquityId = $company->accounts()->where('code', '3900')->value('id');
        $this->assertNotNull($cashId);
        $this->assertNotNull($openingEquityId);

        $this->actingAs($user)->postJson('/api/journal/post', [
            'company_id' => $company->id,
            'source_type' => 'capital',
            'source_id' => (string) Str::uuid(),
            'entry_date' => '2026-04-01',
            'description' => 'Prompt 4C COGS proof funding',
            'entries' => [
                ['account_id' => $cashId, 'debit' => 500_000.0, 'credit' => 0, 'description' => 'Cash'],
                ['account_id' => $openingEquityId, 'debit' => 0, 'credit' => 500_000.0, 'description' => 'Equity'],
            ],
        ], $this->workspaceHeaders($user, $company))->assertCreated();

        $this->actingAs($user)->postJson("/api/companies/{$companyId}/inventory/stock", [
            'item_id' => $itemId,
            'product_name' => 'Prompt 4C Widget',
            'material' => 'Finished good',
            'inventory_type' => 'finished_good',
            'size' => 'Std',
            'source' => 'production',
            'code' => 'P4C-COGS',
            'quantity_on_hand' => 200,
            'unit_cost' => 40,
            'offset_account_code' => '1153',
            'reference' => 'P4C-COGS-STK',
            'transaction_date' => '2026-04-02',
        ], [
            'X-Gulf-Hisab-Actor-Id' => (string) $user->id,
        ])->assertCreated();

        $draft = $this->actingAs($user)->postJson("/api/companies/{$companyId}/sales-documents", [
            'type' => 'tax_invoice',
            'contact_id' => $contactId,
            'issue_date' => '2026-04-05',
            'due_date' => '2026-05-05',
            'lines' => [[
                'item_id' => $itemId,
                'quantity' => 5,
                'unit_price' => 120,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $incomeAccountId,
            ]],
        ])->assertCreated();

        $invId = (int) $draft->json('data.id');
        $this->actingAs($user)->postJson("/api/companies/{$companyId}/sales-documents/{$invId}/finalize")->assertOk();

        $invJe = JournalEntry::query()
            ->where('company_id', $companyId)
            ->where('source_type', 'document_inventory')
            ->where('source_id', $invId)
            ->first();
        $this->assertNotNull($invJe, 'Expected document_inventory posting for fulfilled stock-backed invoice.');

        $lines = JournalEntryLine::query()
            ->where('journal_entry_id', $invJe->id)
            ->with('account')
            ->get();

        $debitSum = round((float) $lines->sum('debit'), 2);
        $creditSum = round((float) $lines->sum('credit'), 2);
        $this->assertEqualsWithDelta($debitSum, $creditSum, 0.02, 'Inventory relief journal debits equal credits.');
        $this->assertTrue(
            $lines->contains(fn ($l) => isset($l->account->code) && $l->account->code === '5000' && (float) $l->debit > 0),
            'COGS debit on account 5000 expected for inventory-backed sale.'
        );
        $this->assertTrue(
            $lines->contains(fn ($l) =>
                isset($l->account->account_class)
                && $l->account->account_class === 'asset'
                && (float) $l->credit > 0
                && strtolower((string) ($l->account->group ?? '')) !== 'bank'
                && strtolower((string) ($l->account->group ?? '')) !== 'cash'),
            'Posted inventory relief should credit a non-treasury asset.'
        );

        /** @phpstan-ignore-next-line */
        $this->assertNotEmpty($invJe->source_id);
    }

    public function test_prompt4_bank_accounts_return_debit_credit_and_negative_status(): void
    {
        $user = User::factory()->create();
        $companyId = $this->actingAs($user)->postJson('/api/companies', [
            'legal_name' => 'Prompt 4C Treasury Edge Co',
        ])->assertCreated()->json('data.id');

        $company = Company::findOrFail($companyId);

        $cashId = $company->accounts()->where('code', '1200')->value('id');
        $openingEquityId = $company->accounts()->where('code', '3900')->value('id');
        $expenseAccountId = $company->accounts()->where('code', '6900')->value('id');
        $this->assertNotNull($cashId);
        $this->assertNotNull($openingEquityId);
        $this->assertNotNull($expenseAccountId);

        $this->actingAs($user)->postJson('/api/journal/post', [
            'company_id' => $companyId,
            'source_type' => 'capital',
            'source_id' => (string) Str::uuid(),
            'entry_date' => '2026-03-01',
            'description' => 'Thin funding shell',
            'entries' => [
                ['account_id' => $cashId, 'debit' => 5_000.0, 'credit' => 0, 'description' => 'Funding'],
                ['account_id' => $openingEquityId, 'debit' => 0, 'credit' => 5_000.0, 'description' => 'Equity'],
            ],
        ], $this->workspaceHeaders($user, $company))->assertCreated();

        $lineAgg = DB::table('journal_entry_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->where('journal_entries.company_id', $companyId)
            ->where('journal_entries.status', 'posted')
            ->where('journal_entry_lines.account_id', $cashId)
            ->selectRaw('COALESCE(SUM(journal_entry_lines.debit), 0) as d, COALESCE(SUM(journal_entry_lines.credit), 0) as c')
            ->first();
        $this->assertGreaterThan(0, (float) $lineAgg->d + (float) $lineAgg->c);
        $this->assertEqualsWithDelta(0.0, (float) $lineAgg->c, 0.02, 'Thin funding should debit cash without crediting treasury.');

        $accounts = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reconciliation/bank-accounts", $this->workspaceHeaders($user, $company))->assertOk()->json('data');
        $cashRow = collect($accounts)->first(fn ($row) => (int) ($row['id'] ?? 0) === (int) $cashId);
        $this->assertNotNull($cashRow);
        $this->assertArrayHasKey('debit_total', $cashRow);
        $this->assertArrayHasKey('credit_total', $cashRow);
        $this->assertArrayHasKey('balance', $cashRow);
        $this->assertArrayHasKey('balance_status', $cashRow);
        $this->assertEqualsWithDelta((float) $lineAgg->d, (float) $cashRow['debit_total'], 0.02, 'API debit_total must mirror posted journal lines.');
        $this->assertEqualsWithDelta((float) $lineAgg->c, (float) $cashRow['credit_total'], 0.02, 'API credit_total must mirror posted journal lines.');
        $this->assertSame('positive', $cashRow['balance_status']);
        $this->assertGreaterThan(0.0, (float) ($cashRow['balance'] ?? 0));

        $this->actingAs($user)->postJson('/api/journal/post', [
            'company_id' => $companyId,
            'source_type' => 'operating_payment',
            'source_id' => (string) Str::uuid(),
            'entry_date' => '2026-03-15',
            'description' => 'Expense paid from treasury (drops cash)',
            'entries' => [
                ['account_id' => $expenseAccountId, 'debit' => 120_000.0, 'credit' => 0, 'description' => 'Expense'],
                ['account_id' => $cashId, 'debit' => 0, 'credit' => 120_000.0, 'description' => 'Cash paid'],
            ],
        ], $this->workspaceHeaders($user, $company))->assertCreated();

        $accountsAfter = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reconciliation/bank-accounts", $this->workspaceHeaders($user, $company))->assertOk()->json('data');
        $afterCash = collect($accountsAfter)->firstWhere('id', $cashId);
        $this->assertNotNull($afterCash);
        $this->assertSame('negative', $afterCash['balance_status']);
        $expl = trim((string) ($afterCash['balance_explanation'] ?? ''));
        $this->assertNotSame('', $expl);
        $this->assertStringContainsString('Bank asset is negative because credits exceed debits.', $expl);
    }

    public function test_prompt4_reports_routes_return_real_data(): void
    {
        /** @var User $user */
        /** @var Company $company */
        [$user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId, $expenseAccountId, $company] = $this->bootstrapContext();

        $cashId = $company->accounts()->where('code', '1200')->value('id');
        $openingEquityId = $company->accounts()->where('code', '3900')->value('id');
        $this->actingAs($user)->postJson('/api/journal/post', [
            'company_id' => $companyId,
            'source_type' => 'capital',
            'source_id' => (string) Str::uuid(),
            'entry_date' => '2026-03-05',
            'description' => 'Routes proof funding',
            'entries' => [
                ['account_id' => $cashId, 'debit' => 50_000.0, 'credit' => 0, 'description' => 'Funding'],
                ['account_id' => $openingEquityId, 'debit' => 0, 'credit' => 50_000.0, 'description' => 'Equity'],
            ],
        ], $this->workspaceHeaders($user, $company))->assertCreated();

        $this->actingAs($user)->postJson("/api/companies/{$companyId}/inventory/stock", [
            'item_id' => $itemId,
            'product_name' => 'Prompt 4 Widget',
            'material' => 'Finished good',
            'inventory_type' => 'finished_good',
            'size' => 'Std',
            'source' => 'production',
            'code' => 'P4-RTE-STK',
            'quantity_on_hand' => 100,
            'unit_cost' => 40,
            'offset_account_code' => '1153',
            'reference' => 'P4-RTE-STOCK',
            'transaction_date' => '2026-03-06',
        ], [
            'X-Gulf-Hisab-Actor-Id' => (string) $user->id,
        ])->assertCreated();

        $draft = $this->actingAs($user)->postJson("/api/companies/{$companyId}/sales-documents", [
            'type' => 'tax_invoice',
            'contact_id' => $contactId,
            'issue_date' => '2026-03-10',
            'due_date' => '2026-04-01',
            'lines' => [[
                'item_id' => $itemId,
                'quantity' => 1,
                'unit_price' => 250,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $incomeAccountId,
            ]],
        ])->assertCreated();
        $docId = $draft->json('data.id');
        $this->actingAs($user)->postJson("/api/companies/{$companyId}/sales-documents/{$docId}/finalize")->assertOk();

        $supplierId = $this->actingAs($user)->postJson("/api/companies/{$companyId}/contacts", array_merge([
            'type' => 'supplier',
            'display_name' => 'Routes Proof Supplier',
            'tax_number' => $this->uniqueKsaVatNumber('p4c-routes-supplier'),
        ], $this->ksaContactExtras()))->assertCreated()->json('data.id');

        $purchaseDraft = $this->actingAs($user)->postJson("/api/companies/{$companyId}/purchase-documents", [
            'type' => 'purchase_invoice',
            'contact_id' => $supplierId,
            'issue_date' => '2026-03-12',
            'due_date' => '2026-04-12',
            'lines' => [[
                'item_id' => $itemId,
                'quantity' => 1,
                'unit_price' => 180,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $expenseAccountId,
            ]],
        ])->assertCreated();
        $purchaseId = $purchaseDraft->json('data.id');
        $this->actingAs($user)->postJson("/api/companies/{$companyId}/purchase-documents/{$purchaseId}/finalize")->assertOk();

        $pl = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/profit-loss")->assertOk()->json('data');
        $bs = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/balance-sheet")->assertOk()->json('data');
        $tb = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/trial-balance")->assertOk()->json('data');
        $cf = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/cash-flow")->assertOk()->json('data');
        $vat = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/vat-summary")->assertOk()->json();
        $vatRec = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/vat-received-details")->assertOk()->json('data');
        $vatPaid = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/vat-paid-details")->assertOk()->json('data');
        $journalReg = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/journal-register")->assertOk()->json('data');

        $this->assertNotEmpty($pl['lines'] ?? []);
        $this->assertNotEmpty($bs['assets'] ?? []);
        $this->assertNotEmpty($tb);
        $this->assertIsArray($cf);
        $this->assertArrayHasKey('operating', $cf);
        $this->assertTrue(((is_countable($cf['operating']) ? count($cf['operating']) : 0) + count($cf['financing'] ?? []) + count($cf['investing'] ?? [])) >= 1, 'Treasury classifications should include at least one movement after funding/posting.');
        $this->assertNotEmpty($vat['data']);
        $this->assertNotEmpty($vatRec);
        $this->assertNotEmpty($vatPaid);
        $this->assertNotEmpty($journalReg);
    }
}
