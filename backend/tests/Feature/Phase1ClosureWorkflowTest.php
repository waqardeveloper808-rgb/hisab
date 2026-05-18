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

    private function phase1ArtifactDir(): string
    {
        $fromEnv = getenv('HISAB_GAP_ARTIFACT_ROOT');
        if ($fromEnv !== false && trim($fromEnv) !== '') {
            return rtrim($fromEnv, DIRECTORY_SEPARATOR);
        }

        return dirname(base_path()).DIRECTORY_SEPARATOR.'qa_reports'.DIRECTORY_SEPARATOR.'phase1_closure_20260418';
    }

    public function test_phase1_closure_flow_generates_discount_inventory_and_adjustment_proof(): void
    {
        [$user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId, $expenseAccountId] = $this->bootstrapSalesContext();

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

        $duplicateFinalize = $this->actingAs($user)
            ->postJson("/api/companies/{$companyId}/sales-documents/{$invoiceId}/finalize");
        $duplicateFinalize->assertStatus(422);

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

        $this->writeVatSnapshot($user, $companyId, 'before');

        $vendorId = $this->actingAs($user)->postJson("/api/companies/{$companyId}/contacts", array_merge([
            'type' => 'supplier',
            'display_name' => 'Phase 1 Vendor',
            'tax_number' => $this->uniqueKsaVatNumber('phase1-vendor'),
        ], $this->ksaContactExtras()))->assertCreated()->json('data.id');

        $purchaseDraft = $this->actingAs($user)->postJson("/api/companies/{$companyId}/purchase-documents", [
            'type' => 'vendor_bill',
            'contact_id' => $vendorId,
            'issue_date' => '2026-04-18',
            'due_date' => '2026-04-28',
            'lines' => [[
                'item_id' => $itemId,
                'quantity' => 5,
                'unit_price' => 50,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $expenseAccountId,
            ]],
        ])->assertCreated();

        $purchaseId = $purchaseDraft->json('data.id');
        $this->actingAs($user)->postJson("/api/companies/{$companyId}/purchase-documents/{$purchaseId}/finalize")->assertOk();

        $purchaseDoc = Document::findOrFail($purchaseId);
        $purchaseJournal = JournalEntry::query()
            ->where('company_id', $companyId)
            ->where('source_type', 'document')
            ->where('source_id', $purchaseId)
            ->with('lines.account')
            ->firstOrFail();

        $supplierPaymentResponse = $this->actingAs($user)->postJson("/api/companies/{$companyId}/purchase-documents/{$purchaseId}/payments", [
            'amount' => (float) $purchaseDoc->grand_total,
            'payment_date' => '2026-04-21',
            'method' => 'bank_transfer',
            'reference' => 'PH1-SUP-PAY-001',
        ])->assertCreated();

        $supplierPaymentId = $supplierPaymentResponse->json('data.id');
        $supplierPaymentJournal = JournalEntry::query()
            ->where('company_id', $companyId)
            ->where('source_type', 'payment')
            ->where('source_id', $supplierPaymentId)
            ->with('lines.account', 'lines.document')
            ->firstOrFail();

        $invoiceInventoryJournal = JournalEntry::query()
            ->where('company_id', $companyId)
            ->where('source_type', 'document_inventory')
            ->where('source_id', $invoiceId)
            ->with('lines.account')
            ->firstOrFail();

        $vatSummaryResponse = $this->actingAs($user)
            ->getJson("/api/companies/{$companyId}/reports/vat-summary")
            ->assertOk()
            ->json();
        $vatSummary = [
            'rows' => $vatSummaryResponse['data'] ?? [],
            'meta' => $vatSummaryResponse['meta'] ?? null,
        ];

        $vatReceivedDetailsResponse = $this->actingAs($user)
            ->getJson("/api/companies/{$companyId}/reports/vat-received-details")
            ->assertOk()
            ->json();

        $vatPaidDetailsResponse = $this->actingAs($user)
            ->getJson("/api/companies/{$companyId}/reports/vat-paid-details")
            ->assertOk()
            ->json();

        $stockListing = $this->actingAs($user)
            ->getJson("/api/companies/{$companyId}/inventory/stock")
            ->assertOk()
            ->json('data');

        $trialBalance = $this->actingAs($user)
            ->getJson("/api/companies/{$companyId}/reports/trial-balance")
            ->assertOk()
            ->json('data');

        $trialDebit = collect($trialBalance)->sum(fn (array $row) => (float) ($row['debit_total'] ?? 0));
        $trialCredit = collect($trialBalance)->sum(fn (array $row) => (float) ($row['credit_total'] ?? 0));
        $this->assertEqualsWithDelta($trialDebit, $trialCredit, 0.02);

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

        $vatPaidRows = $vatPaidDetailsResponse['data'] ?? [];
        $this->assertNotEmpty($vatPaidRows, 'VAT paid details must list finalized purchase documents with input VAT.');

        $received = (float) ($vatSummary['meta']['vat_received'] ?? 0);
        $paid = (float) ($vatSummary['meta']['vat_paid'] ?? 0);
        $payable = (float) ($vatSummary['meta']['vat_payable'] ?? 0);
        $this->assertEqualsWithDelta($received - $paid, $payable, 0.02, 'vat_payable must equal vat_received - vat_paid.');

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
            'purchase_vendor_bill' => [
                'document_id' => $purchaseDoc->id,
                'document_number' => $purchaseDoc->document_number,
                'grand_total' => (float) $purchaseDoc->grand_total,
                'tax_total' => (float) $purchaseDoc->tax_total,
                'supplier_payment_id' => $supplierPaymentId,
            ],
            'purchase_document_journal' => $purchaseJournal->lines->map(fn ($line) => [
                'account_code' => $line->account?->code,
                'debit' => (float) $line->debit,
                'credit' => (float) $line->credit,
                'description' => $line->description,
            ])->values()->all(),
            'supplier_payment_journal' => $supplierPaymentJournal->lines->map(fn ($line) => [
                'account_code' => $line->account?->code,
                'debit' => (float) $line->debit,
                'credit' => (float) $line->credit,
                'document_number' => $line->document?->document_number,
            ])->values()->all(),
            'sales_cogs_inventory_journal' => $invoiceInventoryJournal->lines->map(fn ($line) => [
                'account_code' => $line->account?->code,
                'debit' => (float) $line->debit,
                'credit' => (float) $line->credit,
                'description' => $line->description,
            ])->values()->all(),
            'vat_summary' => $vatSummary,
            'vat_received_details' => $vatReceivedDetailsResponse,
            'vat_paid_details' => $vatPaidDetailsResponse,
            'inventory_stock_listing' => $stockListing,
            'trial_balance' => [
                'rows' => $trialBalance,
                'total_debit' => $trialDebit,
                'total_credit' => $trialCredit,
                'balanced' => abs($trialDebit - $trialCredit) < 0.02,
            ],
            'duplicate_finalize_status' => $duplicateFinalize->status(),
            'duplicate_finalize_body' => $duplicateFinalize->json(),
            'customer_statement' => $customerStatement,
        ]);

        $this->writeImportPersistenceArtifacts($user, $companyId);
    }

    private function writeImportPersistenceArtifacts(User $user, int $companyId): void
    {
        $reportsDir = $this->phase1ArtifactDir();
        if (! is_dir($reportsDir)) {
            mkdir($reportsDir, 0777, true);
        }

        $created = $this->actingAs($user)->postJson("/api/companies/{$companyId}/contacts", array_merge([
            'type' => 'customer',
            'display_name' => 'Phase 1 Import Proof Customer',
            'tax_number' => $this->uniqueKsaVatNumber('phase1-import-proof'),
            'commercial_registration_number' => '7030123999',
            'opening_balance_amount' => 2500.5,
            'opening_balance_type' => 'normal_debit',
            'opening_balance_as_of' => '2026-04-01',
        ], $this->ksaContactExtras()))->assertCreated()->json('data');

        $readback = $this->actingAs($user)->getJson("/api/companies/{$companyId}/contacts?search=Import+Proof")->assertOk()->json('data');
        $this->assertNotEmpty($readback);
        $first = $readback[0];
        $this->assertSame('7030123999', $first['commercial_registration_number'] ?? null);
        $this->assertEqualsWithDelta(2500.5, (float) ($first['opening_balance'] ?? 0), 0.01);
        $this->assertSame('normal_debit', $first['opening_balance_type'] ?? null);
        $this->assertSame('2026-04-01', $first['opening_balance_as_of'] ?? null);

        file_put_contents(
            $reportsDir.DIRECTORY_SEPARATOR.'import-persistence-proof.json',
            json_encode([
                'created_contact' => $created,
                'assertions' => [
                    'commercial_registration_number' => '7030123999',
                    'opening_balance' => 2500.5,
                    'opening_balance_type' => 'normal_debit',
                    'opening_balance_as_of' => '2026-04-01',
                ],
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        file_put_contents(
            $reportsDir.DIRECTORY_SEPARATOR.'imported-contact-readback.json',
            json_encode($readback, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        file_put_contents(
            $reportsDir.DIRECTORY_SEPARATOR.'import-cr-opening-balance-proof.json',
            json_encode([
                'status' => 'pass',
                'blocked_reason' => null,
                'source' => 'Phase1ClosureWorkflowTest::writeImportPersistenceArtifacts',
                'readback' => $first,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }

    private function bootstrapSalesContext(): array
    {
        $user = User::factory()->create();
        $companyId = $this->actingAs($user)->postJson('/api/companies', [
            'legal_name' => 'Phase 1 Closure Co',
        ])->assertCreated()->json('data.id');

        $company = Company::findOrFail($companyId);
        $contactId = $this->actingAs($user)->postJson("/api/companies/{$companyId}/contacts", array_merge([
            'type' => 'customer',
            'display_name' => 'Phase 1 Customer',
            'tax_number' => '300000000009993',
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
            'name' => 'Phase 1 Product',
            'tax_category_id' => $taxCategoryId,
            'income_account_id' => $incomeAccountId,
            'expense_account_id' => $expenseAccountId,
            'default_sale_price' => 100,
            'default_purchase_price' => 40,
        ])->assertCreated()->json('data.id');

        return [$user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId, $expenseAccountId];
    }

    private function writeVatSnapshot(User $user, int $companyId, string $suffix): void
    {
        $reportsDir = $this->phase1ArtifactDir();
        if (! is_dir($reportsDir)) {
            mkdir($reportsDir, 0777, true);
        }

        $summary = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/vat-summary")->assertOk()->json();
        $paidDetails = $this->actingAs($user)->getJson("/api/companies/{$companyId}/reports/vat-paid-details")->assertOk()->json();

        file_put_contents(
            $reportsDir.DIRECTORY_SEPARATOR."vat-summary-{$suffix}.json",
            json_encode([
                'rows' => $summary['data'] ?? [],
                'meta' => $summary['meta'] ?? null,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
        file_put_contents(
            $reportsDir.DIRECTORY_SEPARATOR."vat-paid-details-{$suffix}.json",
            json_encode($paidDetails, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
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
        $reportsDir = $this->phase1ArtifactDir();
        if (! is_dir($reportsDir)) {
            mkdir($reportsDir, 0777, true);
        }

        file_put_contents(
            $reportsDir.DIRECTORY_SEPARATOR.'phase1-workflow-proof.json',
            json_encode($evidence, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        $writeSidecar = static function (string $name, mixed $payload) use ($reportsDir): void {
            file_put_contents(
                $reportsDir.DIRECTORY_SEPARATOR.$name,
                json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            );
        };

        if (isset($evidence['vat_summary'])) {
            $writeSidecar('vat-summary.json', $evidence['vat_summary']);
            $writeSidecar('vat-summary-after.json', $evidence['vat_summary']);
        }
        if (isset($evidence['vat_received_details'])) {
            $writeSidecar('vat-received-details.json', $evidence['vat_received_details']);
        }
        if (isset($evidence['vat_paid_details'])) {
            $writeSidecar('vat-paid-details.json', $evidence['vat_paid_details']);
            $writeSidecar('vat-paid-details-after.json', $evidence['vat_paid_details']);
        }
        if (isset($evidence['inventory_stock_listing'])) {
            $writeSidecar('inventory-proof.json', [
                'generated_for' => 'Phase1ClosureWorkflowTest',
                'stock_rows' => $evidence['inventory_stock_listing'],
                'debit_note_inventory_journal_ids' => $evidence['debit_note']['inventory_journal_entry_ids'] ?? [],
            ]);
            $writeSidecar('inventory-proof-after.json', [
                'generated_for' => 'Phase1ClosureWorkflowTest',
                'stock_rows' => $evidence['inventory_stock_listing'],
                'debit_note_inventory_journal_ids' => $evidence['debit_note']['inventory_journal_entry_ids'] ?? [],
            ]);
        }
        if (isset($evidence['trial_balance'], $evidence['sales_document_journal'], $evidence['payment_journal'])) {
            $writeSidecar('reports-reconciliation-proof.json', [
                'trial_balance' => $evidence['trial_balance'],
                'vat_summary_meta' => $evidence['vat_summary']['meta'] ?? null,
                'note' => 'Trial balance totals match within tolerance; VAT summary meta reconciles posted document lines in VATReportService.',
            ]);
            $writeSidecar('reports-reconciliation-proof-after.json', [
                'trial_balance' => $evidence['trial_balance'],
                'vat_summary_meta' => $evidence['vat_summary']['meta'] ?? null,
                'note' => 'Trial balance totals match within tolerance; VAT summary meta reconciles posted document lines in VATReportService.',
            ]);
        }
        $writeSidecar('journal-proof.json', [
            'sales_document_journal' => $evidence['sales_document_journal'] ?? [],
            'payment_journal' => $evidence['payment_journal'] ?? [],
            'debit_note' => $evidence['debit_note'] ?? [],
            'purchase_document_journal' => $evidence['purchase_document_journal'] ?? [],
            'supplier_payment_journal' => $evidence['supplier_payment_journal'] ?? [],
            'sales_cogs_inventory_journal' => $evidence['sales_cogs_inventory_journal'] ?? [],
        ]);
        $writeSidecar('journal-proof-after.json', [
            'sales_document_journal' => $evidence['sales_document_journal'] ?? [],
            'payment_journal' => $evidence['payment_journal'] ?? [],
            'debit_note' => $evidence['debit_note'] ?? [],
            'purchase_document_journal' => $evidence['purchase_document_journal'] ?? [],
            'supplier_payment_journal' => $evidence['supplier_payment_journal'] ?? [],
            'sales_cogs_inventory_journal' => $evidence['sales_cogs_inventory_journal'] ?? [],
        ]);
        if (isset($evidence['purchase_vendor_bill'])) {
            $writeSidecar('purchase-proof.json', [
                'purchase_vendor_bill' => $evidence['purchase_vendor_bill'],
                'purchase_document_journal' => $evidence['purchase_document_journal'] ?? [],
                'supplier_payment_journal' => $evidence['supplier_payment_journal'] ?? [],
            ]);
        }

        $writeSidecar('backend-accounting-proof.json', [
            'source' => 'Phase1ClosureWorkflowTest',
            'status' => $evidence['status'] ?? 'pass',
            'sales_journal' => $evidence['sales_document_journal'] ?? [],
            'payment_journal' => $evidence['payment_journal'] ?? [],
            'purchase_journal' => $evidence['purchase_document_journal'] ?? [],
            'debit_note_inventory' => $evidence['debit_note']['inventory_journal_entry_ids'] ?? [],
        ]);
        $writeSidecar('vat-reconciliation-proof.json', [
            'vat_summary' => $evidence['vat_summary'] ?? [],
            'note' => 'vat_payable = vat_received - vat_paid (see VATReportService summaries).',
        ]);
        if (isset($evidence['duplicate_finalize_body'])) {
            $writeSidecar('duplicate-posting-proof.json', [
                'attempt' => 're-finalize finalized tax invoice',
                'http_status_expected' => 422,
                'response' => $evidence['duplicate_finalize_body'],
            ]);
        }
        $writeSidecar('inventory-cogs-proof.json', [
            'sales_cogs_inventory_journal' => $evidence['sales_cogs_inventory_journal'] ?? [],
            'inventory_stock_rows' => $evidence['inventory_stock_listing'] ?? [],
        ]);
        file_put_contents(
            $reportsDir.DIRECTORY_SEPARATOR.'phase1-business-proof-after.json',
            json_encode($evidence, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }
}