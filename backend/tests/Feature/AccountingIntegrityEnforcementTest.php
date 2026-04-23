<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Company;
use App\Models\Document;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Payment;
use App\Services\LedgerService;
use App\Models\TaxCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Mockery;
use Tests\TestCase;

class AccountingIntegrityEnforcementTest extends TestCase
{
    use RefreshDatabase;

    public function test_runtime_integrity_validation_records_successful_invoice_workflow(): void
    {
        [$user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId] = $this->bootstrapSalesContext();

        $this->seedInventory($user, $companyId, $itemId, 'AIT-INV-001', 10);

        $invoiceId = $this->actingAs($user)->postJson("/api/companies/{$companyId}/sales-documents", [
            'type' => 'tax_invoice',
            'contact_id' => $contactId,
            'issue_date' => '2026-04-17',
            'due_date' => '2026-04-24',
            'lines' => [[
                'item_id' => $itemId,
                'quantity' => 2,
                'unit_price' => 100,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $incomeAccountId,
            ]],
        ])->assertCreated()->json('data.id');

        $this->actingAs($user)
            ->postJson("/api/companies/{$companyId}/sales-documents/{$invoiceId}/finalize")
            ->assertOk();

        $this->actingAs($user)
            ->postJson("/api/companies/{$companyId}/sales-documents/{$invoiceId}/payments", [
                'amount' => 230,
                'payment_date' => '2026-04-18',
                'method' => 'bank_transfer',
                'reference' => 'AIT-PAY-001',
            ])
            ->assertCreated();

        $invoice = Document::findOrFail($invoiceId);
        $events = AuditLog::query()
            ->where('company_id', $companyId)
            ->whereIn('event', [
                'accounting_integrity.sales_document_validated',
                'accounting_integrity.payment_validated',
            ])
            ->pluck('event')
            ->all();

        $this->assertContains('accounting_integrity.sales_document_validated', $events);
        $this->assertContains('accounting_integrity.payment_validated', $events);
        $this->assertNotEmpty($invoice->custom_fields['inventory_journal_entry_ids'] ?? []);
        $this->assertSame('paid', $invoice->status);
        $this->assertSame('0.00', (string) $invoice->balance_due);
    }

    public function test_multi_invoice_payment_succeeds_with_invoice_level_traceability(): void
    {
        [$user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId] = $this->bootstrapSalesContext();

        $this->seedInventory($user, $companyId, $itemId, 'AIT-INV-002', 20);

        $firstInvoiceId = $this->createAndFinalizeInvoice($user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId, '2026-04-17');
        $secondInvoiceId = $this->createAndFinalizeInvoice($user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId, '2026-04-18');

        $paymentResponse = $this->actingAs($user)->postJson("/api/companies/{$companyId}/payments", [
            'contact_id' => $contactId,
            'amount' => 460,
            'payment_date' => '2026-04-19',
            'method' => 'bank_transfer',
            'reference' => 'AIT-PAY-BLOCKED',
            'allocations' => [
                ['document_id' => $firstInvoiceId, 'amount' => 230],
                ['document_id' => $secondInvoiceId, 'amount' => 230],
            ],
        ])->assertCreated();

        $paymentId = $paymentResponse->json('data.id');
        $payment = Payment::query()->with('allocations')->findOrFail($paymentId);
        $paymentJournal = JournalEntry::query()
            ->where('company_id', $companyId)
            ->where('source_type', 'payment')
            ->where('source_id', $paymentId)
            ->with(['lines.account', 'lines.document'])
            ->firstOrFail();
        $firstInvoice = Document::findOrFail($firstInvoiceId);
        $secondInvoice = Document::findOrFail($secondInvoiceId);

        $firstLedgerRows = $this->getJson("/api/companies/{$companyId}/reports/general-ledger?document_number={$firstInvoice->document_number}&from=2026-04-17&to=2026-04-19")
            ->assertOk()
            ->json('data');
        $secondLedgerRows = $this->getJson("/api/companies/{$companyId}/reports/general-ledger?document_number={$secondInvoice->document_number}&from=2026-04-17&to=2026-04-19")
            ->assertOk()
            ->json('data');
        $firstJournalSearch = $this->getJson("/api/companies/{$companyId}/journals?source_type=payment&document_number={$firstInvoice->document_number}")
            ->assertOk()
            ->json('data');
        $secondJournalSearch = $this->getJson("/api/companies/{$companyId}/journals?source_type=payment&document_number={$secondInvoice->document_number}")
            ->assertOk()
            ->json('data');

        $this->assertCount(2, $payment->allocations);
        $this->assertSame('paid', $firstInvoice->status);
        $this->assertSame('paid', $secondInvoice->status);
        $this->assertSame('0.00', (string) $firstInvoice->balance_due);
        $this->assertSame('0.00', (string) $secondInvoice->balance_due);
        $this->assertContains($firstInvoice->document_number, $paymentJournal->lines->pluck('document.document_number')->filter()->unique()->all());
        $this->assertContains($secondInvoice->document_number, $paymentJournal->lines->pluck('document.document_number')->filter()->unique()->all());
        $this->assertTrue($paymentJournal->lines->contains(fn (JournalEntryLine $line) => $line->account?->code === '1100' && $line->document_id === $firstInvoiceId && (float) $line->credit === 230.0));
        $this->assertTrue($paymentJournal->lines->contains(fn (JournalEntryLine $line) => $line->account?->code === '1100' && $line->document_id === $secondInvoiceId && (float) $line->credit === 230.0));
        $this->assertTrue(collect($firstLedgerRows)->contains(fn (array $row) => $row['source_type'] === 'payment' && $row['document_number'] === $firstInvoice->document_number && (float) $row['credit'] === 230.0));
        $this->assertTrue(collect($secondLedgerRows)->contains(fn (array $row) => $row['source_type'] === 'payment' && $row['document_number'] === $secondInvoice->document_number && (float) $row['credit'] === 230.0));
        $this->assertNotEmpty($firstJournalSearch);
        $this->assertNotEmpty($secondJournalSearch);
        $this->assertContains($firstInvoice->document_number, $firstJournalSearch[0]['document_numbers']);
        $this->assertContains($secondInvoice->document_number, $secondJournalSearch[0]['document_numbers']);
    }

    public function test_multi_invoice_payment_is_blocked_when_ar_credit_loses_invoice_traceability(): void
    {
        [$user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId] = $this->bootstrapSalesContext();

        $this->seedInventory($user, $companyId, $itemId, 'AIT-INV-003', 20);

        $firstInvoiceId = $this->createAndFinalizeInvoice($user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId, '2026-04-17');
        $secondInvoiceId = $this->createAndFinalizeInvoice($user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId, '2026-04-18');

        $realLedgerService = $this->app->make(LedgerService::class);

        $this->app->instance(LedgerService::class, new class($realLedgerService) extends LedgerService {
            public function __construct(private readonly LedgerService $inner)
            {
            }

            public function postIncomingPayment(Payment $payment, int $contactId, string $allocatedTotal, string $unallocatedAmount, string $discountAllowedAmount = '0.00', array $allocations = []): JournalEntry
            {
                $journal = $this->inner->postIncomingPayment($payment, $contactId, $allocatedTotal, $unallocatedAmount, $discountAllowedAmount, $allocations);

                $receivableLine = $journal->lines()->whereHas('account', fn ($query) => $query->where('code', '1100'))->orderBy('id')->first();
                $receivableLine?->update(['document_id' => null]);

                return $journal->fresh('lines.account');
            }
        });

        $response = $this->actingAs($user)->postJson("/api/companies/{$companyId}/payments", [
            'contact_id' => $contactId,
            'amount' => 460,
            'payment_date' => '2026-04-19',
            'method' => 'bank_transfer',
            'reference' => 'AIT-PAY-BROKEN',
            'allocations' => [
                ['document_id' => $firstInvoiceId, 'amount' => 230],
                ['document_id' => $secondInvoiceId, 'amount' => 230],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['accounting_integrity']);

        $this->assertSame(0, Payment::query()->count());
        $this->assertSame('finalized', Document::findOrFail($firstInvoiceId)->status);
        $this->assertSame('finalized', Document::findOrFail($secondInvoiceId)->status);
    }

    private function bootstrapSalesContext(): array
    {
        $user = User::factory()->create();
        $companyId = $this->actingAs($user)->postJson('/api/companies', [
            'legal_name' => 'Accounting Integrity Co',
        ])->assertCreated()->json('data.id');

        $company = Company::findOrFail($companyId);
        $contactId = $this->actingAs($user)->postJson("/api/companies/{$companyId}/contacts", [
            'type' => 'customer',
            'display_name' => 'Integrity Customer',
            'tax_number' => '300000000001111',
        ])->assertCreated()->json('data.id');

        $taxCategoryId = TaxCategory::query()->where('company_id', $companyId)->where('code', 'VAT15')->value('id');
        $incomeAccountId = $company->accounts()->where('code', '4000')->value('id');
        $expenseAccountId = $company->accounts()->where('code', '6900')->value('id');

        $itemId = $this->actingAs($user)->postJson("/api/companies/{$companyId}/items", [
            'type' => 'product',
            'name' => 'Integrity Product',
            'tax_category_id' => $taxCategoryId,
            'income_account_id' => $incomeAccountId,
            'expense_account_id' => $expenseAccountId,
            'default_sale_price' => 100,
            'default_purchase_price' => 50,
        ])->assertCreated()->json('data.id');

        return [$user, $companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId];
    }

    private function seedInventory(User $user, int $companyId, int $itemId, string $code, int $quantity): void
    {
        $this->actingAs($user)->postJson("/api/companies/{$companyId}/inventory/stock", [
            'item_id' => $itemId,
            'product_name' => 'Integrity Product',
            'material' => 'Finished good',
            'inventory_type' => 'finished_good',
            'size' => 'Unit',
            'source' => 'purchase',
            'code' => $code,
            'quantity_on_hand' => $quantity,
            'unit_cost' => 50,
            'offset_account_code' => '2000',
            'reference' => 'PO-'.$code,
            'transaction_date' => '2026-04-17',
        ], [
            'X-Gulf-Hisab-Actor-Id' => (string) $user->id,
        ])->assertCreated();
    }

    private function createAndFinalizeInvoice(User $user, int $companyId, int $contactId, int $itemId, int $taxCategoryId, int $incomeAccountId, string $issueDate): int
    {
        $invoiceId = $this->actingAs($user)->postJson("/api/companies/{$companyId}/sales-documents", [
            'type' => 'tax_invoice',
            'contact_id' => $contactId,
            'issue_date' => $issueDate,
            'due_date' => '2026-04-25',
            'lines' => [[
                'item_id' => $itemId,
                'quantity' => 2,
                'unit_price' => 100,
                'tax_category_id' => $taxCategoryId,
                'ledger_account_id' => $incomeAccountId,
            ]],
        ])->assertCreated()->json('data.id');

        $this->actingAs($user)
            ->postJson("/api/companies/{$companyId}/sales-documents/{$invoiceId}/finalize")
            ->assertOk();

        return $invoiceId;
    }
}