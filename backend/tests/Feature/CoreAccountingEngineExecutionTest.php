<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Document;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Models\TaxCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CoreAccountingEngineExecutionTest extends TestCase
{
    use RefreshDatabase;

    public function test_core_accounting_engine_executes_full_real_workflow(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $companyId = $this->postJson('/api/companies', [
            'legal_name' => 'Core Accounting Engine Co',
        ])->assertCreated()->json('data.id');

        $company = Company::findOrFail($companyId);
        $this->assertNotNull($company->accounts()->where('code', '1010')->value('id'));
        $this->assertNotNull($company->accounts()->where('code', '1200')->value('id'));
        $this->assertNotNull($company->accounts()->where('code', '1100')->value('id'));
        $this->assertNotNull($company->accounts()->where('code', '1152')->value('id'));
        $this->assertNotNull($company->accounts()->where('code', '2000')->value('id'));
        $this->assertNotNull($company->accounts()->where('code', '2200')->value('id'));
        $this->assertNotNull($company->accounts()->where('code', '3000')->value('id'));
        $this->assertNotNull($company->accounts()->where('code', '4000')->value('id'));
        $this->assertNotNull($company->accounts()->where('code', '5000')->value('id'));
        $this->assertNotNull($company->accounts()->where('code', '6900')->value('id'));

        $contactId = $this->postJson("/api/companies/{$companyId}/contacts", [
            'type' => 'customer',
            'display_name' => 'Core Customer',
            'tax_number' => '300000000009999',
        ])->assertCreated()->json('data.id');

        $taxCategoryId = TaxCategory::query()->where('company_id', $companyId)->where('code', 'VAT15')->value('id');
        $incomeAccountId = $company->accounts()->where('code', '4000')->value('id');
        $expenseAccountId = $company->accounts()->where('code', '6900')->value('id');

        $itemId = $this->postJson("/api/companies/{$companyId}/items", [
            'type' => 'product',
            'name' => 'Core Product',
            'tax_category_id' => $taxCategoryId,
            'income_account_id' => $incomeAccountId,
            'expense_account_id' => $expenseAccountId,
            'default_sale_price' => 100,
            'default_purchase_price' => 50,
        ])->assertCreated()->json('data.id');

        $inventory = $this->postJson("/api/companies/{$companyId}/inventory/stock", [
            'item_id' => $itemId,
            'product_name' => 'Core Product',
            'material' => 'Finished good',
            'inventory_type' => 'finished_good',
            'size' => 'Unit',
            'source' => 'purchase',
            'code' => 'CORE-PROD-001',
            'quantity_on_hand' => 10,
            'unit_cost' => 50,
            'offset_account_code' => '2000',
            'reference' => 'PO-CORE-001',
            'transaction_date' => '2026-04-17',
        ], [
            'X-Gulf-Hisab-Actor-Id' => (string) $user->id,
        ])->assertCreated()->json('data');

        $draftInvoiceId = $this->postJson("/api/companies/{$companyId}/sales-documents", [
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

        $this->postJson("/api/companies/{$companyId}/sales-documents/{$draftInvoiceId}/finalize")
            ->assertOk();

        $invoice = Document::query()->with('lines')->findOrFail($draftInvoiceId);

        $paymentId = $this->postJson("/api/companies/{$companyId}/sales-documents/{$draftInvoiceId}/payments", [
            'amount' => 230,
            'payment_date' => '2026-04-18',
            'method' => 'bank_transfer',
            'reference' => 'PAY-CORE-001',
        ])->assertCreated()->json('data.id');

        $invoice->refresh();
        $payment = Payment::findOrFail($paymentId);

        $invoiceRevenueJournal = JournalEntry::query()
            ->where('company_id', $companyId)
            ->where('source_type', 'document')
            ->where('source_id', $invoice->id)
            ->with('lines.account')
            ->firstOrFail();

        $invoiceInventoryJournal = JournalEntry::query()
            ->where('company_id', $companyId)
            ->where('source_type', 'document_inventory')
            ->where('source_id', $invoice->id)
            ->with('lines.account')
            ->firstOrFail();

        $paymentJournal = JournalEntry::query()
            ->where('company_id', $companyId)
            ->where('source_type', 'payment')
            ->where('source_id', $payment->id)
            ->with('lines.account')
            ->firstOrFail();

        $journalRegister = $this->getJson("/api/companies/{$companyId}/journals?source_type=document")
            ->assertOk()
            ->json('data');

        $ledger = $this->getJson("/api/companies/{$companyId}/reports/general-ledger?account_code=1100&from=2026-04-17&to=2026-04-18")
            ->assertOk()
            ->json('data');

        $trialBalance = $this->getJson("/api/companies/{$companyId}/reports/trial-balance")
            ->assertOk()
            ->json('data');

        $invoiceApi = $this->getJson("/api/companies/{$companyId}/sales-documents/{$invoice->id}")
            ->assertOk()
            ->json('data');

        $this->assertSame('paid', $invoice->status);
        $this->assertSame('0.00', (string) $invoice->balance_due);
        $this->assertSame($invoice->document_number, $invoiceRevenueJournal->reference);
        $this->assertTrue($invoiceRevenueJournal->lines->contains(fn ($line) => $line->account->code === '1100' && (float) $line->debit === 230.0));
        $this->assertTrue($invoiceRevenueJournal->lines->contains(fn ($line) => $line->account->code === '4000' && (float) $line->credit === 200.0));
        $this->assertTrue($invoiceRevenueJournal->lines->contains(fn ($line) => $line->account->code === '2200' && (float) $line->credit === 30.0));
        $this->assertTrue($invoiceInventoryJournal->lines->contains(fn ($line) => $line->account->code === '5000' && (float) $line->debit === 100.0));
        $this->assertTrue($invoiceInventoryJournal->lines->contains(fn ($line) => $line->account->code === '1152' && (float) $line->credit === 100.0));
        $this->assertTrue($paymentJournal->lines->contains(fn ($line) => in_array($line->account->code, ['1200', '1210'], true) && (float) $line->debit === 230.0));
        $this->assertTrue($paymentJournal->lines->contains(fn ($line) => $line->account->code === '1100' && (float) $line->credit === 230.0));
        $this->assertTrue(collect($journalRegister)->contains(function (array $entry) use ($invoice) {
            return $entry['entry_number'] === 'JE-1-00003'
                && $entry['reference'] === $invoice->document_number
                && collect($entry['lines'])->contains(fn (array $line) => $line['document_number'] === $invoice->document_number);
        }));

        $debitTotal = collect($trialBalance)->sum(fn (array $row) => (float) $row['debit_total']);
        $creditTotal = collect($trialBalance)->sum(fn (array $row) => (float) $row['credit_total']);
        $this->assertEqualsWithDelta($debitTotal, $creditTotal, 0.0001);

        $evidence = [
            'generated_at' => now()->toIso8601String(),
            'company_id' => $companyId,
            'invoice' => [
                'id' => $invoice->id,
                'document_number' => $invoice->document_number,
                'status' => $invoice->status,
                'api_link' => "/api/companies/{$companyId}/sales-documents/{$invoice->id}",
                'ui_hint' => "/workspace/documents/{$invoice->id}",
                'response' => $invoiceApi,
            ],
            'inventory_receipt' => [
                'inventory_id' => $inventory['id'],
                'code' => $inventory['code'],
                'quantity_on_hand' => $inventory['quantity_on_hand'],
            ],
            'journals' => [
                'invoice_revenue_vat' => $this->serializeJournal($invoiceRevenueJournal),
                'invoice_inventory_issue' => $this->serializeJournal($invoiceInventoryJournal),
                'payment_clearing' => $this->serializeJournal($paymentJournal),
            ],
            'ledger' => $ledger,
            'trial_balance' => [
                'rows' => $trialBalance,
                'total_debit' => number_format($debitTotal, 2, '.', ''),
                'total_credit' => number_format($creditTotal, 2, '.', ''),
                'balanced' => abs($debitTotal - $creditTotal) < 0.0001,
            ],
        ];

        $this->writeEvidence($evidence);
    }

    private function serializeJournal(JournalEntry $journal): array
    {
        return [
            'id' => $journal->id,
            'entry_number' => $journal->entry_number,
            'source_type' => $journal->source_type,
            'source_id' => $journal->source_id,
            'reference' => $journal->reference,
            'entry_date' => $journal->entry_date?->toDateString(),
            'description' => $journal->description,
            'lines' => $journal->lines->map(fn ($line) => [
                'account_code' => $line->account->code,
                'account_name' => $line->account->name,
                'debit' => (float) $line->debit,
                'credit' => (float) $line->credit,
                'document_id' => $line->document_id,
                'description' => $line->description,
            ])->values()->all(),
        ];
    }

    private function writeEvidence(array $evidence): void
    {
        $reportsDir = dirname(base_path()).DIRECTORY_SEPARATOR.'qa_reports'.DIRECTORY_SEPARATOR.'core_accounting_engine_20260417';
        if (! is_dir($reportsDir)) {
            mkdir($reportsDir, 0777, true);
        }

        file_put_contents(
            $reportsDir.DIRECTORY_SEPARATOR.'execution-evidence.json',
            json_encode($evidence, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }
}