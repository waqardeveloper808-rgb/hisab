<?php

namespace Tests\Feature;

use App\Models\AccountingPeriod;
use App\Models\Company;
use App\Models\Document;
use App\Models\JournalEntry;
use App\Models\TaxCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesTaxInvoiceFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_invoice_payment_and_ledger_flow_works_end_to_end(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $companyResponse = $this->postJson('/api/companies', [
            'legal_name' => 'Gulf Hisab Trading LLC',
            'trade_name' => 'Gulf Hisab Trading',
            'tax_number' => '300000000000003',
        ]);

        $companyResponse->assertCreated();
        $companyId = $companyResponse->json('data.id');
        $company = Company::findOrFail($companyId);

        $contactResponse = $this->postJson("/api/companies/{$companyId}/contacts", [
            'type' => 'customer',
            'display_name' => 'Saudi Customer Co',
            'tax_number' => '300000000000010',
        ]);

        $contactResponse->assertCreated();
        $contactId = $contactResponse->json('data.id');

        $taxCategoryId = TaxCategory::query()
            ->where('company_id', $companyId)
            ->where('code', 'VAT15')
            ->value('id');
        $incomeAccountId = $company->accounts()->where('code', '4000')->value('id');

        $itemResponse = $this->postJson("/api/companies/{$companyId}/items", [
            'type' => 'service',
            'name' => 'Monthly bookkeeping',
            'tax_category_id' => $taxCategoryId,
            'income_account_id' => $incomeAccountId,
            'default_sale_price' => 100,
        ]);

        $itemResponse->assertCreated();
        $itemId = $itemResponse->json('data.id');

        $draftResponse = $this->postJson("/api/companies/{$companyId}/sales-documents", [
            'type' => 'tax_invoice',
            'contact_id' => $contactId,
            'issue_date' => '2026-04-13',
            'due_date' => '2026-04-20',
            'lines' => [
                [
                    'item_id' => $itemId,
                    'quantity' => 2,
                    'unit_price' => 100,
                    'tax_category_id' => $taxCategoryId,
                    'ledger_account_id' => $incomeAccountId,
                ],
            ],
        ]);

        $draftResponse->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.taxable_total', '200.00')
            ->assertJsonPath('data.tax_total', '30.00')
            ->assertJsonPath('data.grand_total', '230.00')
            ->assertJsonPath('data.balance_due', '230.00');

        $documentId = $draftResponse->json('data.id');

        $finalizeResponse = $this->postJson("/api/companies/{$companyId}/sales-documents/{$documentId}/finalize");

        $finalizeResponse->assertOk()
            ->assertJsonPath('data.status', 'finalized')
            ->assertJsonPath('data.document_number', 'TINV-00001');

        $this->assertDatabaseHas('journal_entries', [
            'company_id' => $companyId,
            'source_type' => 'document',
            'source_id' => $documentId,
        ]);

        $this->assertSame(3, JournalEntry::query()->first()->lines()->count());

        $paymentOne = $this->postJson("/api/companies/{$companyId}/sales-documents/{$documentId}/payments", [
            'amount' => 100,
            'payment_date' => '2026-04-14',
            'method' => 'bank_transfer',
            'reference' => 'TRX-100',
        ]);

        $paymentOne->assertCreated();

        $documentAfterPartial = Document::findOrFail($documentId);
        $this->assertSame('partially_paid', $documentAfterPartial->status);
        $this->assertSame('130.00', $documentAfterPartial->balance_due);

        $paymentTwo = $this->postJson("/api/companies/{$companyId}/sales-documents/{$documentId}/payments", [
            'amount' => 130,
            'payment_date' => '2026-04-15',
            'method' => 'bank_transfer',
            'reference' => 'TRX-130',
        ]);

        $paymentTwo->assertCreated();

        $documentAfterFull = Document::findOrFail($documentId);
        $this->assertSame('paid', $documentAfterFull->status);
        $this->assertSame('0.00', $documentAfterFull->balance_due);

        $invoiceRegister = $this->getJson("/api/companies/{$companyId}/reports/invoice-register");
        $invoiceRegister->assertOk()->assertJsonCount(1, 'data');

        $statement = $this->getJson("/api/companies/{$companyId}/reports/customer-statements/{$contactId}");
        $statement->assertOk()
            ->assertJsonCount(1, 'data.documents')
            ->assertJsonCount(2, 'data.payments');

        $trialBalance = $this->getJson("/api/companies/{$companyId}/reports/trial-balance");
        $trialBalance->assertOk();
    }

    public function test_finalized_documents_cannot_be_modified(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $companyResponse = $this->postJson('/api/companies', [
            'legal_name' => 'Immutable Docs Co',
        ]);
        $companyId = $companyResponse->json('data.id');

        $contactId = $this->postJson("/api/companies/{$companyId}/contacts", [
            'type' => 'customer',
            'display_name' => 'Locked Customer',
        ])->json('data.id');

        $taxCategoryId = TaxCategory::query()->where('company_id', $companyId)->where('code', 'VAT15')->value('id');
        $incomeAccountId = Company::findOrFail($companyId)->accounts()->where('code', '4000')->value('id');

        $documentId = $this->postJson("/api/companies/{$companyId}/sales-documents", [
            'type' => 'tax_invoice',
            'contact_id' => $contactId,
            'lines' => [[
                'description' => 'Retainer',
                'quantity' => 1,
                'unit_price' => 100,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $incomeAccountId,
            ]],
        ])->json('data.id');

        $this->postJson("/api/companies/{$companyId}/sales-documents/{$documentId}/finalize")->assertOk();

        $this->putJson("/api/companies/{$companyId}/sales-documents/{$documentId}", [
            'contact_id' => $contactId,
            'lines' => [[
                'description' => 'Changed',
                'quantity' => 1,
                'unit_price' => 99,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $incomeAccountId,
            ]],
        ])->assertStatus(422);
    }

    public function test_multi_invoice_allocation_with_overpayment_creates_customer_credit(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $context = $this->createCompanyContext('Allocation Co');

        $invoiceOne = $this->createFinalizedInvoice(
            $context['company_id'],
            $context['contact_id'],
            $context['item_id'],
            $context['tax_category_id'],
            $context['income_account_id'],
            2,
            100,
            '2026-04-13',
            '2026-04-20',
        );

        $invoiceTwo = $this->createFinalizedInvoice(
            $context['company_id'],
            $context['contact_id'],
            $context['item_id'],
            $context['tax_category_id'],
            $context['income_account_id'],
            1,
            100,
            '2026-04-14',
            '2026-04-21',
        );

        $paymentResponse = $this->postJson("/api/companies/{$context['company_id']}/payments", [
            'contact_id' => $context['contact_id'],
            'amount' => 400,
            'payment_date' => '2026-04-15',
            'allocations' => [
                ['document_id' => $invoiceOne['document_id'], 'amount' => 230],
                ['document_id' => $invoiceTwo['document_id'], 'amount' => 115],
            ],
        ]);

        $paymentResponse->assertCreated()
            ->assertJsonPath('data.allocated_total', '345.00')
            ->assertJsonPath('data.unallocated_amount', '55.00');

        $this->assertSame('paid', Document::findOrFail($invoiceOne['document_id'])->status);
        $this->assertSame('paid', Document::findOrFail($invoiceTwo['document_id'])->status);

        $latestPaymentEntry = JournalEntry::query()->where('source_type', 'payment')->latest('id')->first();
        $this->assertNotNull($latestPaymentEntry);
        $this->assertSame(3, $latestPaymentEntry->lines()->count());

        $trialBalance = $this->getJson("/api/companies/{$context['company_id']}/reports/trial-balance");
        $trialBalance->assertOk();

        $advanceRow = collect($trialBalance->json('data'))->firstWhere('code', '2300');
        $this->assertNotNull($advanceRow);
        $this->assertSame('55.00', number_format((float) $advanceRow['credit_total'], 2, '.', ''));
    }

    public function test_partial_credit_note_reverses_vat_and_reduces_open_receivable(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $context = $this->createCompanyContext('Credit Co');
        $invoice = $this->createFinalizedInvoice(
            $context['company_id'],
            $context['contact_id'],
            $context['item_id'],
            $context['tax_category_id'],
            $context['income_account_id'],
            2,
            100,
        );

        $creditResponse = $this->postJson("/api/companies/{$context['company_id']}/sales-documents/{$invoice['document_id']}/credit-notes", [
            'issue_date' => '2026-04-16',
            'lines' => [[
                'source_line_id' => $invoice['line_id'],
                'quantity' => 1,
            ]],
        ]);

        $creditResponse->assertCreated()
            ->assertJsonPath('data.type', 'credit_note')
            ->assertJsonPath('data.grand_total', '115.00');

        $sourceInvoice = Document::findOrFail($invoice['document_id']);
        $this->assertSame('partially_credited', $sourceInvoice->status);
        $this->assertSame('115.00', $sourceInvoice->balance_due);

        $vatSummary = $this->getJson("/api/companies/{$context['company_id']}/reports/vat-summary");
        $vatSummary->assertOk();

        $vatRow = collect($vatSummary->json('data'))->firstWhere('code', 'VAT15');
        $this->assertNotNull($vatRow);
        $this->assertSame('100.00', number_format((float) $vatRow['taxable_amount'], 2, '.', ''));
        $this->assertSame('15.00', number_format((float) $vatRow['tax_amount'], 2, '.', ''));
    }

    public function test_locked_period_blocks_document_finalization(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $context = $this->createCompanyContext('Locked Period Co');

        $draftResponse = $this->postJson("/api/companies/{$context['company_id']}/sales-documents", [
            'type' => 'tax_invoice',
            'contact_id' => $context['contact_id'],
            'issue_date' => '2026-04-13',
            'lines' => [[
                'item_id' => $context['item_id'],
                'quantity' => 1,
                'unit_price' => 100,
                'tax_category_id' => $context['tax_category_id'],
                'ledger_account_id' => $context['income_account_id'],
            ]],
        ]);

        $documentId = $draftResponse->json('data.id');

        AccountingPeriod::query()
            ->where('company_id', $context['company_id'])
            ->update(['status' => 'locked', 'locked_at' => now(), 'locked_by' => $user->id]);

        $this->postJson("/api/companies/{$context['company_id']}/sales-documents/{$documentId}/finalize")
            ->assertStatus(422);
    }

    public function test_cross_company_document_access_is_blocked(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();

        $this->actingAs($owner);
        $ownerContext = $this->createCompanyContext('Owner Co');
        $invoice = $this->createFinalizedInvoice(
            $ownerContext['company_id'],
            $ownerContext['contact_id'],
            $ownerContext['item_id'],
            $ownerContext['tax_category_id'],
            $ownerContext['income_account_id'],
            1,
            100,
        );

        $this->actingAs($intruder);
        $intruderContext = $this->createCompanyContext('Intruder Co');

        $this->getJson("/api/companies/{$intruderContext['company_id']}/sales-documents/{$invoice['document_id']}")
            ->assertStatus(403);
    }

    public function test_same_invoice_line_cannot_be_over_credited_across_multiple_credit_notes(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $context = $this->createCompanyContext('Over Credit Co');
        $invoice = $this->createFinalizedInvoice(
            $context['company_id'],
            $context['contact_id'],
            $context['item_id'],
            $context['tax_category_id'],
            $context['income_account_id'],
            1,
            100,
        );

        $this->postJson("/api/companies/{$context['company_id']}/sales-documents/{$invoice['document_id']}/credit-notes", [
            'issue_date' => '2026-04-16',
            'lines' => [[
                'source_line_id' => $invoice['line_id'],
                'quantity' => 1,
            ]],
        ])->assertCreated();

        $this->postJson("/api/companies/{$context['company_id']}/sales-documents/{$invoice['document_id']}/credit-notes", [
            'issue_date' => '2026-04-17',
            'lines' => [[
                'source_line_id' => $invoice['line_id'],
                'quantity' => 0.5,
            ]],
        ])->assertStatus(422);
    }

    public function test_customer_advance_can_be_applied_to_a_new_invoice(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $context = $this->createCompanyContext('Advance Application Co');

        $firstInvoice = $this->createFinalizedInvoice(
            $context['company_id'],
            $context['contact_id'],
            $context['item_id'],
            $context['tax_category_id'],
            $context['income_account_id'],
            2,
            100,
        );

        $this->postJson("/api/companies/{$context['company_id']}/payments", [
            'contact_id' => $context['contact_id'],
            'amount' => 300,
            'payment_date' => '2026-04-15',
            'allocations' => [
                ['document_id' => $firstInvoice['document_id'], 'amount' => 230],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.unallocated_amount', '70.00');

        $secondInvoice = $this->createFinalizedInvoice(
            $context['company_id'],
            $context['contact_id'],
            $context['item_id'],
            $context['tax_category_id'],
            $context['income_account_id'],
            1,
            100,
            '2026-04-16',
            '2026-04-23',
        );

        $applyAdvance = $this->postJson("/api/companies/{$context['company_id']}/sales-documents/{$secondInvoice['document_id']}/apply-advance", [
            'amount' => 70,
            'application_date' => '2026-04-17',
        ]);

        $applyAdvance->assertOk()
            ->assertJsonPath('data.status', 'partially_paid')
            ->assertJsonPath('data.paid_total', '70.00')
            ->assertJsonPath('data.balance_due', '45.00');

        $trialBalance = $this->getJson("/api/companies/{$context['company_id']}/reports/trial-balance");
        $trialBalance->assertOk();

        $advanceRow = collect($trialBalance->json('data'))->firstWhere('code', '2300');
        $this->assertNotNull($advanceRow);
        $this->assertSame('70.00', number_format((float) $advanceRow['debit_total'], 2, '.', ''));
        $this->assertSame('70.00', number_format((float) $advanceRow['credit_total'], 2, '.', ''));
    }

    public function test_journal_entry_numbers_remain_unique_across_companies(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $firstCompany = $this->createCompanyContext('Entry One Co');
        $secondCompany = $this->createCompanyContext('Entry Two Co');

        $this->createFinalizedInvoice(
            $firstCompany['company_id'],
            $firstCompany['contact_id'],
            $firstCompany['item_id'],
            $firstCompany['tax_category_id'],
            $firstCompany['income_account_id'],
            1,
            100,
        );

        $this->createFinalizedInvoice(
            $secondCompany['company_id'],
            $secondCompany['contact_id'],
            $secondCompany['item_id'],
            $secondCompany['tax_category_id'],
            $secondCompany['income_account_id'],
            1,
            100,
            '2026-04-14',
            '2026-04-21',
        );

        $entryNumbers = JournalEntry::query()->orderBy('id')->pluck('entry_number')->all();

        $this->assertCount(2, $entryNumbers);
        $this->assertCount(2, array_unique($entryNumbers));
    }

    public function test_purchase_invoice_supplier_payment_and_payables_flow_works_end_to_end(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $context = $this->createSupplierContext('Payables Co');
        $purchase = $this->createFinalizedPurchaseDocument(
            $context['company_id'],
            $context['contact_id'],
            $context['item_id'],
            $context['tax_category_id'],
            $context['expense_account_id'],
            2,
            100,
        );

        $this->postJson("/api/companies/{$context['company_id']}/purchase-documents/{$purchase['document_id']}/payments", [
            'amount' => 100,
            'payment_date' => '2026-04-14',
        ])->assertCreated();

        $purchaseAfterPartial = Document::findOrFail($purchase['document_id']);
        $this->assertSame('partially_paid', $purchaseAfterPartial->status);
        $this->assertSame('130.00', $purchaseAfterPartial->balance_due);

        $this->postJson("/api/companies/{$context['company_id']}/supplier-payments", [
            'contact_id' => $context['contact_id'],
            'amount' => 130,
            'payment_date' => '2026-04-15',
            'allocations' => [
                ['document_id' => $purchase['document_id'], 'amount' => 130],
            ],
        ])->assertCreated();

        $purchaseAfterFull = Document::findOrFail($purchase['document_id']);
        $this->assertSame('paid', $purchaseAfterFull->status);
        $this->assertSame('0.00', $purchaseAfterFull->balance_due);

        $payablesAging = $this->getJson("/api/companies/{$context['company_id']}/reports/payables-aging");
        $payablesAging->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_supplier_advance_can_be_applied_to_a_new_purchase_invoice(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $context = $this->createSupplierContext('Supplier Advance Co');

        $firstBill = $this->createFinalizedPurchaseDocument(
            $context['company_id'],
            $context['contact_id'],
            $context['item_id'],
            $context['tax_category_id'],
            $context['expense_account_id'],
            2,
            100,
        );

        $this->postJson("/api/companies/{$context['company_id']}/supplier-payments", [
            'contact_id' => $context['contact_id'],
            'amount' => 300,
            'payment_date' => '2026-04-15',
            'allocations' => [
                ['document_id' => $firstBill['document_id'], 'amount' => 230],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.unallocated_amount', '70.00');

        $secondBill = $this->createFinalizedPurchaseDocument(
            $context['company_id'],
            $context['contact_id'],
            $context['item_id'],
            $context['tax_category_id'],
            $context['expense_account_id'],
            1,
            100,
            'vendor_bill',
            '2026-04-16',
            '2026-04-23',
        );

        $applyAdvance = $this->postJson("/api/companies/{$context['company_id']}/purchase-documents/{$secondBill['document_id']}/apply-advance", [
            'amount' => 70,
            'application_date' => '2026-04-17',
        ]);

        $applyAdvance->assertOk()
            ->assertJsonPath('data.status', 'partially_paid')
            ->assertJsonPath('data.paid_total', '70.00')
            ->assertJsonPath('data.balance_due', '45.00');
    }

    public function test_supplier_refund_after_overpayment_clears_supplier_advance(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $context = $this->createSupplierContext('Supplier Refund Co');
        $bill = $this->createFinalizedPurchaseDocument(
            $context['company_id'],
            $context['contact_id'],
            $context['item_id'],
            $context['tax_category_id'],
            $context['expense_account_id'],
            2,
            100,
        );

        $this->postJson("/api/companies/{$context['company_id']}/supplier-payments", [
            'contact_id' => $context['contact_id'],
            'amount' => 300,
            'payment_date' => '2026-04-15',
            'allocations' => [
                ['document_id' => $bill['document_id'], 'amount' => 230],
            ],
        ])->assertCreated();

        $refund = $this->postJson("/api/companies/{$context['company_id']}/contacts/{$context['contact_id']}/supplier-advance-refunds", [
            'amount' => 70,
            'payment_date' => '2026-04-16',
        ]);

        $refund->assertCreated()->assertJsonPath('data.direction', 'incoming');

        $trialBalance = $this->getJson("/api/companies/{$context['company_id']}/reports/trial-balance");
        $trialBalance->assertOk();

        $supplierAdvanceRow = collect($trialBalance->json('data'))->firstWhere('code', '1410');
        $this->assertNotNull($supplierAdvanceRow);
        $this->assertSame('70.00', number_format((float) $supplierAdvanceRow['debit_total'], 2, '.', ''));
        $this->assertSame('70.00', number_format((float) $supplierAdvanceRow['credit_total'], 2, '.', ''));
    }

    public function test_customer_advance_refund_cannot_be_processed_twice(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $context = $this->createCompanyContext('Refund Control Co');
        $invoice = $this->createFinalizedInvoice(
            $context['company_id'],
            $context['contact_id'],
            $context['item_id'],
            $context['tax_category_id'],
            $context['income_account_id'],
            2,
            100,
        );

        $this->postJson("/api/companies/{$context['company_id']}/payments", [
            'contact_id' => $context['contact_id'],
            'amount' => 300,
            'payment_date' => '2026-04-15',
            'allocations' => [
                ['document_id' => $invoice['document_id'], 'amount' => 230],
            ],
        ])->assertCreated();

        $this->postJson("/api/companies/{$context['company_id']}/contacts/{$context['contact_id']}/customer-advance-refunds", [
            'amount' => 70,
            'payment_date' => '2026-04-16',
        ])->assertCreated();

        $this->postJson("/api/companies/{$context['company_id']}/contacts/{$context['contact_id']}/customer-advance-refunds", [
            'amount' => 1,
            'payment_date' => '2026-04-17',
        ])->assertStatus(422);
    }

    public function test_financial_reports_include_purchase_sales_and_vat_positions(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $salesContext = $this->createCompanyContext('Financial Reports Co');
        $this->createFinalizedInvoice(
            $salesContext['company_id'],
            $salesContext['contact_id'],
            $salesContext['item_id'],
            $salesContext['tax_category_id'],
            $salesContext['income_account_id'],
            2,
            100,
        );

        $supplierContext = $this->createSupplierContext('Financial Reports Co', $salesContext['company_id']);
        $this->createFinalizedPurchaseDocument(
            $supplierContext['company_id'],
            $supplierContext['contact_id'],
            $supplierContext['item_id'],
            $supplierContext['tax_category_id'],
            $supplierContext['expense_account_id'],
            1,
            50,
        );

        $profitLoss = $this->getJson("/api/companies/{$salesContext['company_id']}/reports/profit-loss");
        $profitLoss->assertOk()->assertJsonPath('data.net_profit', '150.00');

        $balanceSheet = $this->getJson("/api/companies/{$salesContext['company_id']}/reports/balance-sheet");
        $balanceSheet->assertOk()->assertJsonPath('data.equity_total', '150.00');

        $vatDetail = $this->getJson("/api/companies/{$salesContext['company_id']}/reports/vat-detail");
        $vatDetail->assertOk();

        $vatRow = collect($vatDetail->json('data'))->firstWhere('code', 'VAT15');
        $this->assertNotNull($vatRow);
        $this->assertSame('200.00', number_format((float) $vatRow['output_taxable_amount'], 2, '.', ''));
        $this->assertSame('50.00', number_format((float) $vatRow['input_taxable_amount'], 2, '.', ''));
    }

    public function test_voiding_unpaid_sales_invoice_creates_reversal_and_clears_ledger_effect(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $context = $this->createCompanyContext('Void Sales Co');
        $invoice = $this->createFinalizedInvoice(
            $context['company_id'],
            $context['contact_id'],
            $context['item_id'],
            $context['tax_category_id'],
            $context['income_account_id'],
            1,
            100,
        );

        $this->postJson("/api/companies/{$context['company_id']}/sales-documents/{$invoice['document_id']}/void", [
            'reason' => 'Entered in error',
        ])->assertOk()
            ->assertJsonPath('data.status', 'voided')
            ->assertJsonPath('data.balance_due', '0.00');

        $trialBalance = $this->getJson("/api/companies/{$context['company_id']}/reports/trial-balance");
        $trialBalance->assertOk();

        $receivableRow = collect($trialBalance->json('data'))->firstWhere('code', '1100');
        $revenueRow = collect($trialBalance->json('data'))->firstWhere('code', '4000');
        $vatRow = collect($trialBalance->json('data'))->firstWhere('code', '2200');

        $this->assertSame('0.00', number_format((float) $receivableRow['balance'], 2, '.', ''));
        $this->assertSame('0.00', number_format((float) $revenueRow['balance'], 2, '.', ''));
        $this->assertSame('0.00', number_format((float) $vatRow['balance'], 2, '.', ''));

        $documentEntries = JournalEntry::query()->where('source_id', $invoice['document_id'])->count();
        $this->assertSame(2, $documentEntries);
    }

    public function test_voiding_supplier_payment_restores_open_bill(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $context = $this->createSupplierContext('Void Payment Co');
        $bill = $this->createFinalizedPurchaseDocument(
            $context['company_id'],
            $context['contact_id'],
            $context['item_id'],
            $context['tax_category_id'],
            $context['expense_account_id'],
            2,
            100,
        );

        $payment = $this->postJson("/api/companies/{$context['company_id']}/purchase-documents/{$bill['document_id']}/payments", [
            'amount' => 230,
            'payment_date' => '2026-04-14',
        ]);

        $payment->assertCreated();
        $paymentId = $payment->json('data.id');

        $this->postJson("/api/companies/{$context['company_id']}/payments/{$paymentId}/void", [
            'reason' => 'Bank transfer was rejected',
        ])->assertOk()
            ->assertJsonPath('data.status', 'voided');

        $billAfterVoid = Document::findOrFail($bill['document_id']);
        $this->assertSame('finalized', $billAfterVoid->status);
        $this->assertSame('230.00', $billAfterVoid->balance_due);
        $this->assertSame('0.00', $billAfterVoid->paid_total);
    }

    public function test_invoice_credit_note_then_customer_refund_is_fully_traceable(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $context = $this->createCompanyContext('Credit Refund Co');
        $invoice = $this->createFinalizedInvoice(
            $context['company_id'],
            $context['contact_id'],
            $context['item_id'],
            $context['tax_category_id'],
            $context['income_account_id'],
            1,
            100,
        );

        $this->postJson("/api/companies/{$context['company_id']}/sales-documents/{$invoice['document_id']}/payments", [
            'amount' => 115,
            'payment_date' => '2026-04-14',
        ])->assertCreated();

        $this->postJson("/api/companies/{$context['company_id']}/sales-documents/{$invoice['document_id']}/credit-notes", [
            'issue_date' => '2026-04-15',
            'lines' => [[
                'source_line_id' => $invoice['line_id'],
                'quantity' => 1,
            ]],
        ])->assertCreated();

        $this->postJson("/api/companies/{$context['company_id']}/contacts/{$context['contact_id']}/customer-advance-refunds", [
            'amount' => 115,
            'payment_date' => '2026-04-16',
        ])->assertCreated();

        $auditTrail = $this->getJson("/api/companies/{$context['company_id']}/reports/audit-trail");
        $auditTrail->assertOk();

        $events = collect($auditTrail->json('data'))->pluck('event');
        $this->assertTrue($events->contains('document.finalized'));
        $this->assertTrue($events->contains('document.credit_note_issued'));
    }

    public function test_purchase_credit_note_then_supplier_refund_restores_supplier_position(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $context = $this->createSupplierContext('Purchase Credit Refund Co');
        $bill = $this->createFinalizedPurchaseDocument(
            $context['company_id'],
            $context['contact_id'],
            $context['item_id'],
            $context['tax_category_id'],
            $context['expense_account_id'],
            1,
            100,
        );

        $this->postJson("/api/companies/{$context['company_id']}/purchase-documents/{$bill['document_id']}/payments", [
            'amount' => 115,
            'payment_date' => '2026-04-14',
        ])->assertCreated();

        $this->postJson("/api/companies/{$context['company_id']}/purchase-documents/{$bill['document_id']}/credit-notes", [
            'issue_date' => '2026-04-15',
            'lines' => [[
                'source_line_id' => $bill['line_id'],
                'quantity' => 1,
            ]],
        ])->assertCreated();

        $this->postJson("/api/companies/{$context['company_id']}/contacts/{$context['contact_id']}/supplier-advance-refunds", [
            'amount' => 115,
            'payment_date' => '2026-04-16',
        ])->assertCreated();

        $trialBalance = $this->getJson("/api/companies/{$context['company_id']}/reports/trial-balance");
        $trialBalance->assertOk();

        $supplierAdvanceRow = collect($trialBalance->json('data'))->firstWhere('code', '1410');
        $this->assertSame('0.00', number_format((float) $supplierAdvanceRow['balance'], 2, '.', ''));
    }

    private function createCompanyContext(string $legalName): array
    {
        $companyResponse = $this->postJson('/api/companies', [
            'legal_name' => $legalName,
        ]);

        $companyResponse->assertCreated();
        $companyId = $companyResponse->json('data.id');
        $company = Company::findOrFail($companyId);

        $contactId = $this->postJson("/api/companies/{$companyId}/contacts", [
            'type' => 'customer',
            'display_name' => $legalName.' Customer',
        ])->json('data.id');

        $taxCategoryId = TaxCategory::query()
            ->where('company_id', $companyId)
            ->where('code', 'VAT15')
            ->value('id');
        $incomeAccountId = $company->accounts()->where('code', '4000')->value('id');

        $itemId = $this->postJson("/api/companies/{$companyId}/items", [
            'type' => 'service',
            'name' => $legalName.' Service',
            'tax_category_id' => $taxCategoryId,
            'income_account_id' => $incomeAccountId,
            'default_sale_price' => 100,
        ])->json('data.id');

        return [
            'company_id' => $companyId,
            'contact_id' => $contactId,
            'tax_category_id' => $taxCategoryId,
            'income_account_id' => $incomeAccountId,
            'item_id' => $itemId,
        ];
    }

    private function createSupplierContext(string $legalName, ?int $companyId = null): array
    {
        if (! $companyId) {
            $companyResponse = $this->postJson('/api/companies', [
                'legal_name' => $legalName,
            ]);

            $companyResponse->assertCreated();
            $companyId = $companyResponse->json('data.id');
        }

        $company = Company::findOrFail($companyId);

        $contactId = $this->postJson("/api/companies/{$companyId}/contacts", [
            'type' => 'supplier',
            'display_name' => $legalName.' Supplier',
        ])->json('data.id');

        $taxCategoryId = TaxCategory::query()
            ->where('company_id', $companyId)
            ->where('code', 'VAT15')
            ->value('id');
        $expenseAccountId = $company->accounts()->where('code', '5100')->value('id');

        $itemId = $this->postJson("/api/companies/{$companyId}/items", [
            'type' => 'service',
            'name' => $legalName.' Expense Service',
            'tax_category_id' => $taxCategoryId,
            'expense_account_id' => $expenseAccountId,
            'default_purchase_price' => 100,
        ])->json('data.id');

        return [
            'company_id' => $companyId,
            'contact_id' => $contactId,
            'tax_category_id' => $taxCategoryId,
            'expense_account_id' => $expenseAccountId,
            'item_id' => $itemId,
        ];
    }

    private function createFinalizedInvoice(
        int $companyId,
        int $contactId,
        int $itemId,
        int $taxCategoryId,
        int $incomeAccountId,
        int $quantity,
        int $unitPrice,
        string $issueDate = '2026-04-13',
        string $dueDate = '2026-04-20',
    ): array {
        $draftResponse = $this->postJson("/api/companies/{$companyId}/sales-documents", [
            'type' => 'tax_invoice',
            'contact_id' => $contactId,
            'issue_date' => $issueDate,
            'due_date' => $dueDate,
            'lines' => [[
                'item_id' => $itemId,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $incomeAccountId,
            ]],
        ]);

        $draftResponse->assertCreated();
        $documentId = $draftResponse->json('data.id');
        $lineId = $draftResponse->json('data.lines.0.id');

        $this->postJson("/api/companies/{$companyId}/sales-documents/{$documentId}/finalize")->assertOk();

        return [
            'document_id' => $documentId,
            'line_id' => $lineId,
        ];
    }

    private function createFinalizedPurchaseDocument(
        int $companyId,
        int $contactId,
        int $itemId,
        int $taxCategoryId,
        int $expenseAccountId,
        int $quantity,
        int $unitPrice,
        string $type = 'vendor_bill',
        string $issueDate = '2026-04-13',
        string $dueDate = '2026-04-20',
    ): array {
        $draftResponse = $this->postJson("/api/companies/{$companyId}/purchase-documents", [
            'type' => $type,
            'contact_id' => $contactId,
            'issue_date' => $issueDate,
            'due_date' => $dueDate,
            'lines' => [[
                'item_id' => $itemId,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $expenseAccountId,
            ]],
        ]);

        $draftResponse->assertCreated();
        $documentId = $draftResponse->json('data.id');
        $lineId = $draftResponse->json('data.lines.0.id');

        $this->postJson("/api/companies/{$companyId}/purchase-documents/{$documentId}/finalize")->assertOk();

        return [
            'document_id' => $documentId,
            'line_id' => $lineId,
        ];
    }
}