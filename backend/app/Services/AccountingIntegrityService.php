<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Company;
use App\Models\Document;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Payment;
use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AccountingIntegrityService
{
    public function validateSalesDocumentFinalization(Company $company, Document $document, array $inventoryJournalIds = [], ?int $userId = null): void
    {
        $document->loadMissing(['lines.item']);

        $salesJournal = JournalEntry::query()
            ->where('company_id', $company->id)
            ->where('source_type', 'document')
            ->where('source_id', $document->id)
            ->with(['lines.account'])
            ->first();

        if (! $salesJournal) {
            $this->fail('sales_document', 'Sales journal not created.', [
                'document_id' => $document->id,
                'document_number' => $document->document_number,
            ]);
        }

        $this->assertBalancedJournal($salesJournal, 'sales_document', $document);
        $this->assertHeaderTraceability($salesJournal, $document, 'sales_document');
        $this->assertLineTraceability($salesJournal, $document, 'sales_document');
        $this->assertSalesJournalCoverage($company, $document, $salesJournal);

        if ($inventoryJournalIds !== []) {
            $inventoryJournals = JournalEntry::query()
                ->where('company_id', $company->id)
                ->whereIn('id', $inventoryJournalIds)
                ->where('source_type', 'document_inventory')
                ->where('source_id', $document->id)
                ->with(['lines.account'])
                ->get();

            if ($inventoryJournals->count() !== count($inventoryJournalIds)) {
                $this->fail('inventory_document', 'One or more inventory journals were not created for the invoice.', [
                    'document_id' => $document->id,
                    'document_number' => $document->document_number,
                    'expected_journal_ids' => $inventoryJournalIds,
                    'found_journal_ids' => $inventoryJournals->pluck('id')->all(),
                ]);
            }

            foreach ($inventoryJournals as $journal) {
                $this->assertBalancedJournal($journal, 'inventory_document', $document);
                $this->assertHeaderTraceability($journal, $document, 'inventory_document');
                $this->assertLineTraceability($journal, $document, 'inventory_document');
            }

            $this->assertInventoryJournalCoverage($company, $document, $inventoryJournals, $inventoryJournalIds);
        }

        $expectedJournalIds = [$salesJournal->id, ...$inventoryJournalIds];
        $this->assertLedgerContainsJournalLines($company, $document, $expectedJournalIds, 'sales_document');
        $this->assertTrialBalanceContainsJournalAccounts($company, $expectedJournalIds, 'sales_document', $document);
        $this->assertGeneralLedgerIntegrity($company, $expectedJournalIds, 'sales_document', $document);

        $this->recordSuccess('accounting_integrity.sales_document_validated', Document::class, $document->id, $company->id, $userId, [
            'document_number' => $document->document_number,
            'journal_ids' => $expectedJournalIds,
        ]);
    }

    public function validateIncomingPayment(Company $company, Payment $payment, Document $document, ?int $userId = null): void
    {
        $paymentJournal = JournalEntry::query()
            ->where('company_id', $company->id)
            ->where('source_type', 'payment')
            ->where('source_id', $payment->id)
            ->with(['lines.account'])
            ->first();

        if (! $paymentJournal) {
            $this->fail('payment', 'Payment journal not created.', [
                'payment_id' => $payment->id,
                'payment_number' => $payment->payment_number,
                'document_number' => $document->document_number,
            ]);
        }

        $this->assertBalancedJournal($paymentJournal, 'payment', $document);
        $this->assertHeaderTraceability($paymentJournal, $document, 'payment');
        $this->assertLineTraceability($paymentJournal, $document, 'payment');
        $this->assertIncomingPaymentCoverage($company, $payment, $document, $paymentJournal);
        $this->assertLedgerContainsJournalLines($company, $document, [$paymentJournal->id], 'payment');
        $this->assertTrialBalanceContainsJournalAccounts($company, [$paymentJournal->id], 'payment', $document);
        $this->assertGeneralLedgerIntegrity($company, [$paymentJournal->id], 'payment', $document);

        $this->recordSuccess('accounting_integrity.payment_validated', Payment::class, $payment->id, $company->id, $userId, [
            'payment_number' => $payment->payment_number,
            'document_id' => $document->id,
            'document_number' => $document->document_number,
            'journal_id' => $paymentJournal->id,
        ]);
    }

    public function validateInventoryDocumentPosting(Company $company, Document $document, array $inventoryJournalIds, ?int $userId = null): void
    {
        if ($inventoryJournalIds === []) {
            return;
        }

        $document->loadMissing(['lines.item']);

        $journals = JournalEntry::query()
            ->where('company_id', $company->id)
            ->whereIn('id', $inventoryJournalIds)
            ->where('source_type', 'document_inventory')
            ->where('source_id', $document->id)
            ->with(['lines.account'])
            ->get();

        if ($journals->count() !== count($inventoryJournalIds)) {
            $this->fail('inventory_document', 'Inventory journal linkage is incomplete.', [
                'document_id' => $document->id,
                'document_number' => $document->document_number,
                'expected_journal_ids' => $inventoryJournalIds,
                'found_journal_ids' => $journals->pluck('id')->all(),
            ]);
        }

        foreach ($journals as $journal) {
            $this->assertBalancedJournal($journal, 'inventory_document', $document);
            $this->assertHeaderTraceability($journal, $document, 'inventory_document');
            $this->assertLineTraceability($journal, $document, 'inventory_document');
        }

        $this->assertInventoryJournalCoverage($company, $document, $journals, $inventoryJournalIds);
        $this->assertLedgerContainsJournalLines($company, $document, $inventoryJournalIds, 'inventory_document');
        $this->assertTrialBalanceContainsJournalAccounts($company, $inventoryJournalIds, 'inventory_document', $document);
        $this->assertGeneralLedgerIntegrity($company, $inventoryJournalIds, 'inventory_document', $document);

        $this->recordSuccess('accounting_integrity.inventory_validated', Document::class, $document->id, $company->id, $userId, [
            'document_number' => $document->document_number,
            'journal_ids' => $inventoryJournalIds,
        ]);
    }

    private function assertSalesJournalCoverage(Company $company, Document $document, JournalEntry $journal): void
    {
        $receivableCode = $company->settings()->firstOrFail()->default_receivable_account_code;
        $vatPayableCode = $company->settings()->firstOrFail()->default_vat_payable_account_code;
        $advanceCode = $company->settings()->firstOrFail()->default_customer_advance_account_code;
        $discountCode = $company->settings()->firstOrFail()->default_discount_account_code ?? '4500';

        $receivableAndAdvanceDebit = $journal->lines
            ->filter(fn (JournalEntryLine $line) => in_array($line->account?->code, [$receivableCode, $advanceCode], true))
            ->reduce(fn (BigDecimal $carry, JournalEntryLine $line) => $carry->plus((string) $line->debit), BigDecimal::zero())
            ->toScale(2, RoundingMode::HALF_UP);

        if (! $receivableAndAdvanceDebit->isEqualTo(BigDecimal::of((string) $document->grand_total)->toScale(2, RoundingMode::HALF_UP))) {
            $this->fail('sales_document', 'Invoice debit side does not reconcile to the invoice total.', [
                'document_number' => $document->document_number,
                'expected_total' => (string) BigDecimal::of((string) $document->grand_total)->toScale(2, RoundingMode::HALF_UP),
                'actual_debit_side' => (string) $receivableAndAdvanceDebit,
            ]);
        }

        $discountDebit = $journal->lines
            ->filter(fn (JournalEntryLine $line) => $line->account?->code === $discountCode)
            ->reduce(fn (BigDecimal $carry, JournalEntryLine $line) => $carry->plus((string) $line->debit), BigDecimal::zero())
            ->toScale(2, RoundingMode::HALF_UP);

        $revenueCodes = $document->lines->pluck('ledger_account_id')->filter()->unique()->values();
        $revenueCredit = $journal->lines
            ->filter(fn (JournalEntryLine $line) => $revenueCodes->contains($line->account_id))
            ->reduce(fn (BigDecimal $carry, JournalEntryLine $line) => $carry->plus((string) $line->credit), BigDecimal::zero())
            ->toScale(2, RoundingMode::HALF_UP);

        $expectedRevenue = BigDecimal::of((string) $document->taxable_total)
            ->plus((string) ($document->discount_total ?? '0'))
            ->toScale(2, RoundingMode::HALF_UP);

        if (! $revenueCredit->isEqualTo($expectedRevenue)) {
            $this->fail('sales_document', 'Revenue entry is missing or incorrect.', [
                'document_number' => $document->document_number,
                'expected_revenue' => (string) $expectedRevenue,
                'actual_revenue' => (string) $revenueCredit,
            ]);
        }

        if (! $discountDebit->isEqualTo(BigDecimal::of((string) ($document->discount_total ?? '0'))->toScale(2, RoundingMode::HALF_UP))) {
            $this->fail('sales_document', 'Discount entry is missing or incorrect.', [
                'document_number' => $document->document_number,
                'expected_discount' => (string) BigDecimal::of((string) ($document->discount_total ?? '0'))->toScale(2, RoundingMode::HALF_UP),
                'actual_discount' => (string) $discountDebit,
            ]);
        }

        if (BigDecimal::of((string) $document->tax_total)->isGreaterThan(BigDecimal::zero())) {
            $vatCredit = $journal->lines
                ->filter(fn (JournalEntryLine $line) => $line->account?->code === $vatPayableCode)
                ->reduce(fn (BigDecimal $carry, JournalEntryLine $line) => $carry->plus((string) $line->credit), BigDecimal::zero())
                ->toScale(2, RoundingMode::HALF_UP);

            if (! $vatCredit->isEqualTo(BigDecimal::of((string) $document->tax_total)->toScale(2, RoundingMode::HALF_UP))) {
                $this->fail('sales_document', 'VAT entry is missing or incorrect.', [
                    'document_number' => $document->document_number,
                    'expected_vat' => (string) BigDecimal::of((string) $document->tax_total)->toScale(2, RoundingMode::HALF_UP),
                    'actual_vat' => (string) $vatCredit,
                ]);
            }
        }
    }

    private function assertInventoryJournalCoverage(Company $company, Document $document, Collection $journals, array $inventoryJournalIds): void
    {
        $inventoryItems = InventoryItem::query()
            ->where('company_id', $company->id)
            ->whereIn('item_id', $document->lines->pluck('item_id')->filter()->unique())
            ->get()
            ->keyBy('item_id');

        $expectedQuantityByItem = $document->lines
            ->filter(fn ($line) => ($line->item?->type ?? null) === 'product')
            ->groupBy('item_id')
            ->map(fn (Collection $lines) => BigDecimal::of((string) $lines->sum('quantity'))->toScale(2, RoundingMode::HALF_UP));

        $actualTransactionQuantityByItem = InventoryTransaction::query()
            ->where('company_id', $company->id)
            ->whereIn('journal_entry_id', $inventoryJournalIds)
            ->get()
            ->groupBy(fn (InventoryTransaction $transaction) => optional($transaction->inventoryItem)->item_id)
            ->map(fn (Collection $transactions) => $transactions->reduce(
                fn (BigDecimal $carry, InventoryTransaction $transaction) => $carry->plus(BigDecimal::of((string) $transaction->quantity_delta)->abs()),
                BigDecimal::zero()
            )->toScale(2, RoundingMode::HALF_UP));

        foreach ($expectedQuantityByItem as $itemId => $expectedQuantity) {
            $actualQuantity = $actualTransactionQuantityByItem->get($itemId, BigDecimal::zero()->toScale(2, RoundingMode::HALF_UP));
            if (! $actualQuantity->isEqualTo($expectedQuantity)) {
                $this->fail('inventory_document', 'Inventory quantity was not reduced correctly.', [
                    'document_number' => $document->document_number,
                    'item_id' => $itemId,
                    'expected_quantity_delta' => (string) $expectedQuantity,
                    'actual_quantity_delta' => (string) $actualQuantity,
                ]);
            }
        }

        $expectedCogsAccountIds = $inventoryItems->pluck('cogs_account_id')->filter()->unique();
        $expectedInventoryAccountIds = $inventoryItems->pluck('inventory_account_id')->filter()->unique();

        $cogsPosted = $journals->flatMap->lines->contains(fn (JournalEntryLine $line) => $expectedCogsAccountIds->contains($line->account_id) && BigDecimal::of((string) $line->debit)->isGreaterThan(BigDecimal::zero()));
        if (! $cogsPosted) {
            $this->fail('inventory_document', 'COGS was not posted for the invoice inventory impact.', [
                'document_number' => $document->document_number,
                'journal_ids' => $inventoryJournalIds,
            ]);
        }

        $inventoryReduced = $journals->flatMap->lines->contains(fn (JournalEntryLine $line) => $expectedInventoryAccountIds->contains($line->account_id) && BigDecimal::of((string) $line->credit)->isGreaterThan(BigDecimal::zero()));
        if (! $inventoryReduced) {
            $this->fail('inventory_document', 'Inventory relief was not posted for the invoice inventory impact.', [
                'document_number' => $document->document_number,
                'journal_ids' => $inventoryJournalIds,
            ]);
        }
    }

    private function assertIncomingPaymentCoverage(Company $company, Payment $payment, Document $document, JournalEntry $journal): void
    {
        $cashAccountCode = $payment->received_into_account_id
            ? optional($journal->lines->firstWhere('account_id', $payment->received_into_account_id)?->account)->code
            : $company->settings()->firstOrFail()->default_cash_account_code;
        $receivableCode = $company->settings()->firstOrFail()->default_receivable_account_code;
        $advanceCode = $company->settings()->firstOrFail()->default_customer_advance_account_code;
        $discountCode = $company->settings()->firstOrFail()->default_discount_account_code ?? '4500';
        $currentAllocation = $payment->allocations->firstWhere('document_id', $document->id);
        $discountAllowed = BigDecimal::of((string) ($payment->notes ? ($payment->notes && false) : '0'))->toScale(2, RoundingMode::HALF_UP);

        $paymentDiscountAllocations = collect($journal->metadata['payment_allocations'] ?? []);
        $currentDiscountAllocation = BigDecimal::of((string) (collect($paymentDiscountAllocations)->firstWhere('document_id', $document->id)['discount_allowed_amount'] ?? '0'))->toScale(2, RoundingMode::HALF_UP);

        if (! $currentAllocation) {
            $this->fail('payment', 'Payment allocation is missing invoice linkage.', [
                'payment_number' => $payment->payment_number,
                'document_number' => $document->document_number,
                'payment_id' => $payment->id,
            ]);
        }

        $allocatedTotal = BigDecimal::of((string) $payment->allocated_total)->toScale(2, RoundingMode::HALF_UP);
        $unallocatedAmount = BigDecimal::of((string) $payment->unallocated_amount)->toScale(2, RoundingMode::HALF_UP);
        $currentAllocationAmount = BigDecimal::of((string) $currentAllocation->amount)->toScale(2, RoundingMode::HALF_UP);
        $allocationDocumentIds = $payment->allocations->pluck('document_id')->filter()->values();

        $cashDebit = $journal->lines
            ->filter(fn (JournalEntryLine $line) => $line->account?->code === $cashAccountCode)
            ->reduce(fn (BigDecimal $carry, JournalEntryLine $line) => $carry->plus((string) $line->debit), BigDecimal::zero())
            ->toScale(2, RoundingMode::HALF_UP);

        if (! $cashDebit->isEqualTo(BigDecimal::of((string) $payment->amount)->toScale(2, RoundingMode::HALF_UP))) {
            $this->fail('payment', 'Bank or cash account did not increase by the payment amount.', [
                'payment_number' => $payment->payment_number,
                'document_number' => $document->document_number,
                'expected_bank_debit' => (string) BigDecimal::of((string) $payment->amount)->toScale(2, RoundingMode::HALF_UP),
                'actual_bank_debit' => (string) $cashDebit,
            ]);
        }

        $receivableCredit = $journal->lines
            ->filter(fn (JournalEntryLine $line) => $line->account?->code === $receivableCode && $line->document_id === $document->id)
            ->reduce(fn (BigDecimal $carry, JournalEntryLine $line) => $carry->plus((string) $line->credit), BigDecimal::zero())
            ->toScale(2, RoundingMode::HALF_UP);

        if (! $receivableCredit->isEqualTo($currentAllocationAmount->plus($currentDiscountAllocation))) {
            $this->fail('payment', 'Accounts receivable credit cannot be traced to the allocated invoice amount.', [
                'payment_number' => $payment->payment_number,
                'document_number' => $document->document_number,
                'expected_receivable_credit' => (string) $currentAllocationAmount->plus($currentDiscountAllocation),
                'actual_receivable_credit' => (string) $receivableCredit,
            ]);
        }

        $totalReceivableCredit = $journal->lines
            ->filter(fn (JournalEntryLine $line) => $line->account?->code === $receivableCode)
            ->reduce(fn (BigDecimal $carry, JournalEntryLine $line) => $carry->plus((string) $line->credit), BigDecimal::zero())
            ->toScale(2, RoundingMode::HALF_UP);

        $totalDiscountAllowed = $paymentDiscountAllocations
            ->reduce(fn (BigDecimal $carry, array $allocation) => $carry->plus((string) ($allocation['discount_allowed_amount'] ?? '0')), BigDecimal::zero())
            ->toScale(2, RoundingMode::HALF_UP);

        if (! $totalReceivableCredit->isEqualTo($allocatedTotal->plus($totalDiscountAllowed))) {
            $this->fail('payment', 'Accounts receivable was not reduced by the total allocated payment amount.', [
                'payment_number' => $payment->payment_number,
                'document_number' => $document->document_number,
                'expected_receivable_credit' => (string) $allocatedTotal->plus($totalDiscountAllowed),
                'actual_receivable_credit' => (string) $totalReceivableCredit,
            ]);
        }

        if ($totalDiscountAllowed->isGreaterThan(BigDecimal::zero())) {
            $discountDebit = $journal->lines
                ->filter(fn (JournalEntryLine $line) => $line->account?->code === $discountCode)
                ->reduce(fn (BigDecimal $carry, JournalEntryLine $line) => $carry->plus((string) $line->debit), BigDecimal::zero())
                ->toScale(2, RoundingMode::HALF_UP);

            if (! $discountDebit->isEqualTo($totalDiscountAllowed)) {
                $this->fail('payment', 'Discount allowed was not posted correctly.', [
                    'payment_number' => $payment->payment_number,
                    'document_number' => $document->document_number,
                    'expected_discount_debit' => (string) $totalDiscountAllowed,
                    'actual_discount_debit' => (string) $discountDebit,
                ]);
            }
        }

        $orphanReceivableLineIds = $journal->lines
            ->filter(fn (JournalEntryLine $line) => $line->account?->code === $receivableCode)
            ->filter(fn (JournalEntryLine $line) => ! $line->document_id || ! $allocationDocumentIds->contains($line->document_id))
            ->pluck('id')
            ->values()
            ->all();

        if ($orphanReceivableLineIds !== []) {
            $this->fail('payment', 'Accounts receivable credit cannot be traced to a specific invoice.', [
                'payment_number' => $payment->payment_number,
                'document_number' => $document->document_number,
                'orphan_line_ids' => $orphanReceivableLineIds,
            ]);
        }

        if ($unallocatedAmount->isGreaterThan(BigDecimal::zero())) {
            $advanceCredit = $journal->lines
                ->filter(fn (JournalEntryLine $line) => $line->account?->code === $advanceCode)
                ->reduce(fn (BigDecimal $carry, JournalEntryLine $line) => $carry->plus((string) $line->credit), BigDecimal::zero())
                ->toScale(2, RoundingMode::HALF_UP);

            if (! $advanceCredit->isEqualTo($unallocatedAmount)) {
                $this->fail('payment', 'Unallocated customer advance was not posted correctly.', [
                    'payment_number' => $payment->payment_number,
                    'document_number' => $document->document_number,
                    'expected_advance_credit' => (string) $unallocatedAmount,
                    'actual_advance_credit' => (string) $advanceCredit,
                ]);
            }
        }
    }

    private function assertLedgerContainsJournalLines(Company $company, Document $document, array $journalIds, string $context): void
    {
        $expectedLineIds = JournalEntryLine::query()
            ->whereIn('journal_entry_id', $journalIds)
            ->where('document_id', $document->id)
            ->pluck('id');

        $ledgerRows = $this->ledgerRowsForDocument($company, $document->document_number);
        $ledgerLineIds = $ledgerRows->pluck('id');

        $missingLineIds = $expectedLineIds->diff($ledgerLineIds)->values()->all();

        if ($missingLineIds !== []) {
            $this->fail($context, 'Ledger report is missing one or more invoice-linked entries.', [
                'document_number' => $document->document_number,
                'missing_line_ids' => $missingLineIds,
                'journal_ids' => $journalIds,
            ]);
        }
    }

    private function assertTrialBalanceContainsJournalAccounts(Company $company, array $journalIds, string $context, Document $document): void
    {
        $expectedAccountCodes = JournalEntryLine::query()
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->whereIn('journal_entry_id', $journalIds)
            ->pluck('accounts.code')
            ->unique();

        $trialBalanceCodes = DB::table('journal_entry_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->where('journal_entries.company_id', $company->id)
            ->groupBy('accounts.code')
            ->pluck('accounts.code');

        $missingCodes = $expectedAccountCodes->diff($trialBalanceCodes)->values()->all();

        if ($missingCodes !== []) {
            $this->fail($context, 'Trial balance is missing one or more impacted accounts.', [
                'document_number' => $document->document_number,
                'missing_account_codes' => $missingCodes,
            ]);
        }
    }

    private function assertGeneralLedgerIntegrity(Company $company, array $journalIds, string $context, Document $document): void
    {
        $journalTotals = JournalEntryLine::query()
            ->whereIn('journal_entry_id', $journalIds)
            ->selectRaw('COALESCE(SUM(debit), 0) as debit_total, COALESCE(SUM(credit), 0) as credit_total')
            ->first();

        $trialSlice = DB::table('journal_entry_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->where('journal_entries.company_id', $company->id)
            ->whereIn('journal_entry_lines.journal_entry_id', $journalIds)
            ->selectRaw('COALESCE(SUM(journal_entry_lines.debit), 0) as debit_total, COALESCE(SUM(journal_entry_lines.credit), 0) as credit_total')
            ->first();

        $journalDebit = BigDecimal::of((string) ($journalTotals->debit_total ?? '0'))->toScale(2, RoundingMode::HALF_UP);
        $journalCredit = BigDecimal::of((string) ($journalTotals->credit_total ?? '0'))->toScale(2, RoundingMode::HALF_UP);
        $trialDebit = BigDecimal::of((string) ($trialSlice->debit_total ?? '0'))->toScale(2, RoundingMode::HALF_UP);
        $trialCredit = BigDecimal::of((string) ($trialSlice->credit_total ?? '0'))->toScale(2, RoundingMode::HALF_UP);

        if (! $journalDebit->isEqualTo($trialDebit) || ! $journalCredit->isEqualTo($trialCredit)) {
            $this->fail($context, 'General ledger totals do not reconcile with trial balance totals.', [
                'document_number' => $document->document_number,
                'journal_ids' => $journalIds,
                'journal_debit' => (string) $journalDebit,
                'journal_credit' => (string) $journalCredit,
                'trial_debit' => (string) $trialDebit,
                'trial_credit' => (string) $trialCredit,
            ]);
        }
    }

    private function assertBalancedJournal(JournalEntry $journal, string $context, Document $document): void
    {
        $debit = $journal->lines->reduce(fn (BigDecimal $carry, JournalEntryLine $line) => $carry->plus((string) $line->debit), BigDecimal::zero())->toScale(2, RoundingMode::HALF_UP);
        $credit = $journal->lines->reduce(fn (BigDecimal $carry, JournalEntryLine $line) => $carry->plus((string) $line->credit), BigDecimal::zero())->toScale(2, RoundingMode::HALF_UP);

        if (! $debit->isEqualTo($credit)) {
            $this->fail($context, 'Journal is not balanced.', [
                'journal_id' => $journal->id,
                'entry_number' => $journal->entry_number,
                'document_number' => $document->document_number,
                'debit_total' => (string) $debit,
                'credit_total' => (string) $credit,
            ]);
        }
    }

    private function assertHeaderTraceability(JournalEntry $journal, Document $document, string $context): void
    {
        $headerDocumentNumber = $journal->metadata['document_number'] ?? null;
        $documentLinkNumbers = collect($journal->metadata['document_links'] ?? [])->pluck('documentNumber')->filter();
        $searchable = $journal->reference === $document->document_number
            || $headerDocumentNumber === $document->document_number
            || $documentLinkNumbers->contains($document->document_number)
            || ($journal->description && str_contains($journal->description, $document->document_number));

        if (! $headerDocumentNumber && ! $journal->reference) {
            $this->fail($context, 'Journal header has no document number traceability.', [
                'journal_id' => $journal->id,
                'entry_number' => $journal->entry_number,
                'document_number' => $document->document_number,
            ]);
        }

        if (! $searchable) {
            $this->fail($context, 'Journal is not searchable by invoice number.', [
                'journal_id' => $journal->id,
                'entry_number' => $journal->entry_number,
                'document_number' => $document->document_number,
                'reference' => $journal->reference,
                'header_document_number' => $headerDocumentNumber,
                'description' => $journal->description,
            ]);
        }
    }

    private function assertLineTraceability(JournalEntry $journal, Document $document, string $context): void
    {
        if ($context === 'payment') {
            $receivableCodes = ['1100'];
            $missingReceivableLineIds = $journal->lines
                ->filter(fn (JournalEntryLine $line) => in_array($line->account?->code, $receivableCodes, true))
                ->filter(fn (JournalEntryLine $line) => $line->document_id !== $document->id)
                ->pluck('id')
                ->values()
                ->all();

            $currentDocumentReceivableLineIds = $journal->lines
                ->filter(fn (JournalEntryLine $line) => in_array($line->account?->code, $receivableCodes, true) && $line->document_id === $document->id)
                ->pluck('id')
                ->values()
                ->all();

            if ($currentDocumentReceivableLineIds === []) {
                $this->fail($context, 'Payment journal is missing invoice-linked receivable lines.', [
                    'journal_id' => $journal->id,
                    'entry_number' => $journal->entry_number,
                    'document_number' => $document->document_number,
                ]);
            }

            if ($missingReceivableLineIds !== [] && ! in_array($document->id, $journal->lines->pluck('document_id')->filter()->all(), true)) {
                $this->fail($context, 'Payment journal contains receivable lines without invoice linkage.', [
                    'journal_id' => $journal->id,
                    'entry_number' => $journal->entry_number,
                    'document_number' => $document->document_number,
                    'missing_line_ids' => $missingReceivableLineIds,
                ]);
            }

            return;
        }

        $missingLineIds = $journal->lines
            ->filter(fn (JournalEntryLine $line) => $line->document_id !== $document->id)
            ->pluck('id')
            ->values()
            ->all();

        if ($missingLineIds !== []) {
            $this->fail($context, 'Journal lines are missing invoice linkage.', [
                'journal_id' => $journal->id,
                'entry_number' => $journal->entry_number,
                'document_number' => $document->document_number,
                'missing_line_ids' => $missingLineIds,
            ]);
        }
    }

    private function ledgerRowsForDocument(Company $company, string $documentNumber): Collection
    {
        return JournalEntryLine::query()
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->leftJoin('contacts', 'contacts.id', '=', 'journal_entry_lines.contact_id')
            ->leftJoin('documents', 'documents.id', '=', 'journal_entry_lines.document_id')
            ->leftJoin('cost_centers', 'cost_centers.id', '=', 'journal_entry_lines.cost_center_id')
            ->where('journal_entries.company_id', $company->id)
            ->where('documents.document_number', $documentNumber)
            ->orderBy('journal_entries.entry_date')
            ->orderBy('journal_entries.id')
            ->orderBy('journal_entry_lines.id')
            ->selectRaw('journal_entry_lines.id, journal_entries.entry_number, journal_entries.entry_date, journal_entries.source_type, journal_entries.source_id, journal_entries.reference, accounts.id as account_id, accounts.code as account_code, accounts.name as account_name, contacts.display_name as contact_name, documents.document_number, cost_centers.code as cost_center_code, cost_centers.name as cost_center_name, COALESCE(journal_entry_lines.description, journal_entries.description) as description, journal_entry_lines.debit, journal_entry_lines.credit')
            ->get();
    }

    private function recordSuccess(string $event, string $auditableType, int $auditableId, int $companyId, ?int $userId, array $context): void
    {
        AuditLog::create([
            'company_id' => $companyId,
            'user_id' => $userId,
            'event' => $event,
            'auditable_type' => $auditableType,
            'auditable_id' => $auditableId,
            'context' => $context,
            'created_at' => now(),
        ]);
    }

    private function fail(string $component, string $message, array $context = []): never
    {
        Log::warning('accounting_integrity.failed', [
            'component' => $component,
            'message' => $message,
            'context' => $context,
        ]);

        throw ValidationException::withMessages([
            'accounting_integrity' => [$message],
            $component => $context !== [] ? [json_encode($context, JSON_UNESCAPED_SLASHES)] : [$message],
        ]);
    }
}