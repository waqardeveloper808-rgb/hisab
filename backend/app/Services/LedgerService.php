<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Company;
use App\Models\Document;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Payment;
use Brick\Math\BigDecimal;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LedgerService
{
    public function __construct(private readonly AccountingPeriodService $accountingPeriodService)
    {
    }

    public function postSalesDocument(Document $document): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($document->company_id);
        $entryDate = Carbon::parse($document->issue_date ?? now()->toDateString());
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $receivable = $this->findAccount($company, $company->settings->default_receivable_account_code);
        $vatPayable = $this->findAccount($company, $company->settings->default_vat_payable_account_code);

        $revenueLines = $document->lines()
            ->get(['ledger_account_id', 'cost_center_id', 'net_amount'])
            ->groupBy(fn ($line) => $line->ledger_account_id.'|'.($line->cost_center_id ?? 'none'))
            ->map(function ($lines) use ($company, $document) {
                $sample = $lines->first();
                $account = Account::query()->where('company_id', $company->id)->findOrFail($sample->ledger_account_id);

                return [
                    'account_id' => $account->id,
                    'contact_id' => $document->contact_id,
                    'document_id' => $document->id,
                    'cost_center_id' => $sample->cost_center_id,
                    'description' => 'Revenue from sales document',
                    'debit' => '0.00',
                    'credit' => (string) BigDecimal::of((string) $lines->sum('net_amount'))->toScale(2),
                ];
            })
            ->values()
            ->all();

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'document',
            'source_id' => $document->id,
            'description' => sprintf('Posting for %s %s', $document->type, $document->document_number ?? $document->uuid),
        ], array_values(array_filter([
            [
                'account_id' => $receivable->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'cost_center_id' => $document->cost_center_id,
                'description' => 'Receivable created from sales document',
                'debit' => $document->grand_total,
                'credit' => '0.00',
            ],
            ...$revenueLines,
            $document->tax_total > 0 ? [
                'account_id' => $vatPayable->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'cost_center_id' => $document->cost_center_id,
                'description' => 'Output VAT',
                'debit' => '0.00',
                'credit' => $document->tax_total,
            ] : null,
        ])));
    }

    public function postCreditNote(Document $creditNote, Document $sourceDocument, string $receivableReduction, string $customerAdvanceIncrease): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($creditNote->company_id);
        $entryDate = Carbon::parse($creditNote->issue_date ?? now()->toDateString());
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $receivable = $this->findAccount($company, $company->settings->default_receivable_account_code);
        $advance = $this->findAccount($company, $company->settings->default_customer_advance_account_code);
        $vatPayable = $this->findAccount($company, $company->settings->default_vat_payable_account_code);

        $revenueLines = $creditNote->lines()
            ->get(['ledger_account_id', 'cost_center_id', 'net_amount'])
            ->groupBy(fn ($line) => $line->ledger_account_id.'|'.($line->cost_center_id ?? 'none'))
            ->map(function ($lines) use ($company, $sourceDocument, $creditNote) {
                $sample = $lines->first();
                $account = Account::query()->where('company_id', $company->id)->findOrFail($sample->ledger_account_id);

                return [
                    'account_id' => $account->id,
                    'contact_id' => $sourceDocument->contact_id,
                    'document_id' => $creditNote->id,
                    'cost_center_id' => $sample->cost_center_id,
                    'description' => 'Revenue reversal via credit note',
                    'debit' => (string) BigDecimal::of((string) $lines->sum('net_amount'))->toScale(2),
                    'credit' => '0.00',
                ];
            })
            ->values()
            ->all();

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'document',
            'source_id' => $creditNote->id,
            'description' => sprintf('Credit note reversal for %s', $sourceDocument->document_number ?? $sourceDocument->uuid),
        ], array_values(array_filter([
            ...$revenueLines,
            $creditNote->tax_total > 0 ? [
                'account_id' => $vatPayable->id,
                'contact_id' => $sourceDocument->contact_id,
                'document_id' => $creditNote->id,
                'cost_center_id' => $creditNote->cost_center_id,
                'description' => 'Output VAT reversal',
                'debit' => $creditNote->tax_total,
                'credit' => '0.00',
            ] : null,
            BigDecimal::of($receivableReduction)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $receivable->id,
                'contact_id' => $sourceDocument->contact_id,
                'document_id' => $creditNote->id,
                'cost_center_id' => $creditNote->cost_center_id,
                'description' => 'Receivable reduction from credit note',
                'debit' => '0.00',
                'credit' => $receivableReduction,
            ] : null,
            BigDecimal::of($customerAdvanceIncrease)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $advance->id,
                'contact_id' => $sourceDocument->contact_id,
                'document_id' => $creditNote->id,
                'cost_center_id' => $creditNote->cost_center_id,
                'description' => 'Customer credit created from credit note',
                'debit' => '0.00',
                'credit' => $customerAdvanceIncrease,
            ] : null,
        ])));
    }

    public function postPurchaseDocument(Document $document): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($document->company_id);
        $entryDate = Carbon::parse($document->issue_date ?? now()->toDateString());
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $payable = $this->findAccount($company, $company->settings->default_payable_account_code);
        $vatReceivable = $this->findAccount($company, $company->settings->default_vat_receivable_account_code);

        $expenseLines = $document->lines()
            ->get(['ledger_account_id', 'cost_center_id', 'net_amount'])
            ->groupBy(fn ($line) => $line->ledger_account_id.'|'.($line->cost_center_id ?? 'none'))
            ->map(function ($lines) use ($company, $document) {
                $sample = $lines->first();
                $account = Account::query()->where('company_id', $company->id)->findOrFail($sample->ledger_account_id);

                return [
                    'account_id' => $account->id,
                    'contact_id' => $document->contact_id,
                    'document_id' => $document->id,
                    'cost_center_id' => $sample->cost_center_id,
                    'description' => 'Expense or asset recognized from purchase document',
                    'debit' => (string) BigDecimal::of((string) $lines->sum('net_amount'))->toScale(2),
                    'credit' => '0.00',
                ];
            })
            ->values()
            ->all();

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'document',
            'source_id' => $document->id,
            'description' => sprintf('Posting for %s %s', $document->type, $document->document_number ?? $document->uuid),
        ], array_values(array_filter([
            ...$expenseLines,
            $document->tax_total > 0 ? [
                'account_id' => $vatReceivable->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'cost_center_id' => $document->cost_center_id,
                'description' => 'Input VAT recoverable',
                'debit' => $document->tax_total,
                'credit' => '0.00',
            ] : null,
            [
                'account_id' => $payable->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'cost_center_id' => $document->cost_center_id,
                'description' => 'Supplier payable created from purchase document',
                'debit' => '0.00',
                'credit' => $document->grand_total,
            ],
        ])));
    }

    public function postPurchaseCreditNote(Document $creditNote, Document $sourceDocument, string $payableReduction, string $supplierAdvanceIncrease): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($creditNote->company_id);
        $entryDate = Carbon::parse($creditNote->issue_date ?? now()->toDateString());
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $payable = $this->findAccount($company, $company->settings->default_payable_account_code);
        $supplierAdvance = $this->findAccount($company, $company->settings->default_supplier_advance_account_code);
        $vatReceivable = $this->findAccount($company, $company->settings->default_vat_receivable_account_code);

        $expenseLines = $creditNote->lines()
            ->get(['ledger_account_id', 'cost_center_id', 'net_amount'])
            ->groupBy(fn ($line) => $line->ledger_account_id.'|'.($line->cost_center_id ?? 'none'))
            ->map(function ($lines) use ($company, $creditNote) {
                $sample = $lines->first();
                $account = Account::query()->where('company_id', $company->id)->findOrFail($sample->ledger_account_id);

                return [
                    'account_id' => $account->id,
                    'contact_id' => $creditNote->contact_id,
                    'document_id' => $creditNote->id,
                    'cost_center_id' => $sample->cost_center_id,
                    'description' => 'Expense or asset reversal via purchase credit note',
                    'debit' => '0.00',
                    'credit' => (string) BigDecimal::of((string) $lines->sum('net_amount'))->toScale(2),
                ];
            })
            ->values()
            ->all();

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'document',
            'source_id' => $creditNote->id,
            'description' => sprintf('Purchase credit note reversal for %s', $sourceDocument->document_number ?? $sourceDocument->uuid),
        ], array_values(array_filter([
            BigDecimal::of($payableReduction)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $payable->id,
                'contact_id' => $sourceDocument->contact_id,
                'document_id' => $creditNote->id,
                'cost_center_id' => $creditNote->cost_center_id,
                'description' => 'Supplier payable reduction from purchase credit note',
                'debit' => $payableReduction,
                'credit' => '0.00',
            ] : null,
            BigDecimal::of($supplierAdvanceIncrease)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $supplierAdvance->id,
                'contact_id' => $sourceDocument->contact_id,
                'document_id' => $creditNote->id,
                'cost_center_id' => $creditNote->cost_center_id,
                'description' => 'Supplier advance created from purchase credit note',
                'debit' => $supplierAdvanceIncrease,
                'credit' => '0.00',
            ] : null,
            $creditNote->tax_total > 0 ? [
                'account_id' => $vatReceivable->id,
                'contact_id' => $sourceDocument->contact_id,
                'document_id' => $creditNote->id,
                'cost_center_id' => $creditNote->cost_center_id,
                'description' => 'Input VAT reversal',
                'debit' => '0.00',
                'credit' => $creditNote->tax_total,
            ] : null,
            ...$expenseLines,
        ])));
    }

    public function postIncomingPayment(Payment $payment, int $contactId, string $allocatedTotal, string $unallocatedAmount, ?int $documentId = null): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($payment->company_id);
        $entryDate = Carbon::parse($payment->payment_date);
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $cash = $payment->received_into_account_id
            ? Account::query()->where('company_id', $company->id)->findOrFail($payment->received_into_account_id)
            : $this->findAccount($company, $company->settings->default_cash_account_code);
        $receivable = $this->findAccount($company, $company->settings->default_receivable_account_code);
        $advance = $this->findAccount($company, $company->settings->default_customer_advance_account_code);

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'payment',
            'source_id' => $payment->id,
            'description' => sprintf('Incoming payment %s', $payment->payment_number ?? $payment->uuid),
        ], array_values(array_filter([
            [
                'account_id' => $cash->id,
                'contact_id' => $contactId,
                'document_id' => $documentId,
                'description' => 'Cash receipt',
                'debit' => $payment->amount,
                'credit' => '0.00',
            ],
            BigDecimal::of($allocatedTotal)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $receivable->id,
                'contact_id' => $contactId,
                'document_id' => $documentId,
                'description' => 'Settlement of receivable',
                'debit' => '0.00',
                'credit' => $allocatedTotal,
            ] : null,
            BigDecimal::of($unallocatedAmount)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $advance->id,
                'contact_id' => $contactId,
                'document_id' => $documentId,
                'description' => 'Unallocated customer advance',
                'debit' => '0.00',
                'credit' => $unallocatedAmount,
            ] : null,
        ])));
    }

    public function postOutgoingPayment(Payment $payment, int $contactId, string $allocatedTotal, string $unallocatedAmount, ?int $documentId = null): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($payment->company_id);
        $entryDate = Carbon::parse($payment->payment_date);
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $cash = $payment->received_into_account_id
            ? Account::query()->where('company_id', $company->id)->findOrFail($payment->received_into_account_id)
            : $this->findAccount($company, $company->settings->default_cash_account_code);
        $payable = $this->findAccount($company, $company->settings->default_payable_account_code);
        $supplierAdvance = $this->findAccount($company, $company->settings->default_supplier_advance_account_code);

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'payment',
            'source_id' => $payment->id,
            'description' => sprintf('Outgoing payment %s', $payment->payment_number ?? $payment->uuid),
        ], array_values(array_filter([
            BigDecimal::of($allocatedTotal)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $payable->id,
                'contact_id' => $contactId,
                'document_id' => $documentId,
                'description' => 'Settlement of supplier payable',
                'debit' => $allocatedTotal,
                'credit' => '0.00',
            ] : null,
            BigDecimal::of($unallocatedAmount)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $supplierAdvance->id,
                'contact_id' => $contactId,
                'document_id' => $documentId,
                'description' => 'Supplier advance created by overpayment',
                'debit' => $unallocatedAmount,
                'credit' => '0.00',
            ] : null,
            [
                'account_id' => $cash->id,
                'contact_id' => $contactId,
                'document_id' => $documentId,
                'description' => 'Cash disbursement',
                'debit' => '0.00',
                'credit' => $payment->amount,
            ],
        ])));
    }

    public function availableCustomerAdvance(Company $company, int $contactId): BigDecimal
    {
        $advance = $this->findAccount($company, $company->settings->default_customer_advance_account_code);

        $totals = JournalEntryLine::query()
            ->selectRaw('COALESCE(SUM(debit), 0) as debit_total, COALESCE(SUM(credit), 0) as credit_total')
            ->where('account_id', $advance->id)
            ->where('contact_id', $contactId)
            ->first();

        return BigDecimal::of((string) ($totals->credit_total ?? '0'))
            ->minus(BigDecimal::of((string) ($totals->debit_total ?? '0')));
    }

    public function applyCustomerAdvance(Document $document, string $amount, string $applicationDate): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($document->company_id);
        $entryDate = Carbon::parse($applicationDate);
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $receivable = $this->findAccount($company, $company->settings->default_receivable_account_code);
        $advance = $this->findAccount($company, $company->settings->default_customer_advance_account_code);

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'advance_application',
            'source_id' => $document->id,
            'description' => sprintf('Apply customer advance to %s', $document->document_number ?? $document->uuid),
        ], [
            [
                'account_id' => $advance->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'description' => 'Customer advance applied against receivable',
                'debit' => $amount,
                'credit' => '0.00',
            ],
            [
                'account_id' => $receivable->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'description' => 'Receivable settled using customer advance',
                'debit' => '0.00',
                'credit' => $amount,
            ],
        ]);
    }

    public function availableSupplierAdvance(Company $company, int $contactId): BigDecimal
    {
        $advance = $this->findAccount($company, $company->settings->default_supplier_advance_account_code);

        $totals = JournalEntryLine::query()
            ->selectRaw('COALESCE(SUM(debit), 0) as debit_total, COALESCE(SUM(credit), 0) as credit_total')
            ->where('account_id', $advance->id)
            ->where('contact_id', $contactId)
            ->first();

        return BigDecimal::of((string) ($totals->debit_total ?? '0'))
            ->minus(BigDecimal::of((string) ($totals->credit_total ?? '0')));
    }

    public function applySupplierAdvance(Document $document, string $amount, string $applicationDate): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($document->company_id);
        $entryDate = Carbon::parse($applicationDate);
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $payable = $this->findAccount($company, $company->settings->default_payable_account_code);
        $supplierAdvance = $this->findAccount($company, $company->settings->default_supplier_advance_account_code);

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'supplier_advance_application',
            'source_id' => $document->id,
            'description' => sprintf('Apply supplier advance to %s', $document->document_number ?? $document->uuid),
        ], [
            [
                'account_id' => $payable->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'description' => 'Supplier payable settled using supplier advance',
                'debit' => $amount,
                'credit' => '0.00',
            ],
            [
                'account_id' => $supplierAdvance->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'description' => 'Supplier advance consumed',
                'debit' => '0.00',
                'credit' => $amount,
            ],
        ]);
    }

    public function postCustomerAdvanceRefund(Payment $payment, int $contactId): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($payment->company_id);
        $entryDate = Carbon::parse($payment->payment_date);
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $cash = $payment->received_into_account_id
            ? Account::query()->where('company_id', $company->id)->findOrFail($payment->received_into_account_id)
            : $this->findAccount($company, $company->settings->default_cash_account_code);
        $advance = $this->findAccount($company, $company->settings->default_customer_advance_account_code);

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'payment',
            'source_id' => $payment->id,
            'description' => sprintf('Customer advance refund %s', $payment->payment_number ?? $payment->uuid),
        ], [
            [
                'account_id' => $advance->id,
                'contact_id' => $contactId,
                'description' => 'Customer advance refunded',
                'debit' => $payment->amount,
                'credit' => '0.00',
            ],
            [
                'account_id' => $cash->id,
                'contact_id' => $contactId,
                'description' => 'Cash paid out for customer refund',
                'debit' => '0.00',
                'credit' => $payment->amount,
            ],
        ]);
    }

    public function postSupplierAdvanceRefund(Payment $payment, int $contactId): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($payment->company_id);
        $entryDate = Carbon::parse($payment->payment_date);
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $cash = $payment->received_into_account_id
            ? Account::query()->where('company_id', $company->id)->findOrFail($payment->received_into_account_id)
            : $this->findAccount($company, $company->settings->default_cash_account_code);
        $supplierAdvance = $this->findAccount($company, $company->settings->default_supplier_advance_account_code);

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'payment',
            'source_id' => $payment->id,
            'description' => sprintf('Supplier advance refund %s', $payment->payment_number ?? $payment->uuid),
        ], [
            [
                'account_id' => $cash->id,
                'contact_id' => $contactId,
                'description' => 'Cash received from supplier refund',
                'debit' => $payment->amount,
                'credit' => '0.00',
            ],
            [
                'account_id' => $supplierAdvance->id,
                'contact_id' => $contactId,
                'description' => 'Supplier advance refunded back to cash',
                'debit' => '0.00',
                'credit' => $payment->amount,
            ],
        ]);
    }

    public function reverseJournalEntry(Company $company, JournalEntry $entry, string $sourceType, int $sourceId, string $description): JournalEntry
    {
        $entry->load('lines');

        return $this->createBalancedEntry($company, [
            'entry_date' => now()->toDateString(),
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'description' => $description,
        ], $entry->lines->map(fn (JournalEntryLine $line) => [
            'account_id' => $line->account_id,
            'contact_id' => $line->contact_id,
            'document_id' => $line->document_id,
            'description' => 'Reversal of journal entry '.$entry->entry_number,
            'debit' => (string) $line->credit,
            'credit' => (string) $line->debit,
        ])->all());
    }

    private function findAccount(Company $company, string $code): Account
    {
        $account = Account::query()
            ->where('company_id', $company->id)
            ->where('code', $code)
            ->firstOr(function () use ($code) {
                throw ValidationException::withMessages([
                    'account' => "Required account {$code} is not configured.",
                ]);
            });

        if (! $account->allows_posting) {
            throw ValidationException::withMessages([
                'account' => "Account {$code} is not a posting account.",
            ]);
        }

        return $account;
    }

    private function nextEntryNumber(Company $company): string
    {
        $count = DB::table('journal_entries')->where('company_id', $company->id)->lockForUpdate()->count() + 1;

        return sprintf('JE-%d-%05d', $company->id, $count);
    }

    private function createBalancedEntry(Company $company, array $entryAttributes, array $lines): JournalEntry
    {
        if ($lines === []) {
            throw ValidationException::withMessages([
                'journal' => 'Journal entries must contain at least one line.',
            ]);
        }

        $debitTotal = BigDecimal::zero();
        $creditTotal = BigDecimal::zero();

        foreach ($lines as $index => $line) {
            $account = Account::query()
                ->where('company_id', $company->id)
                ->findOrFail($line['account_id']);

            if (! $account->allows_posting) {
                throw ValidationException::withMessages([
                    "lines.$index.account_id" => 'Journal entries must use posting accounts only.',
                ]);
            }

            $debit = BigDecimal::of((string) $line['debit']);
            $credit = BigDecimal::of((string) $line['credit']);

            if ($debit->isLessThan(BigDecimal::zero()) || $credit->isLessThan(BigDecimal::zero())) {
                throw ValidationException::withMessages([
                    "lines.$index" => 'Journal lines cannot contain negative debit or credit values.',
                ]);
            }

            if (($debit->isEqualTo(BigDecimal::zero()) && $credit->isEqualTo(BigDecimal::zero())) || (! $debit->isEqualTo(BigDecimal::zero()) && ! $credit->isEqualTo(BigDecimal::zero()))) {
                throw ValidationException::withMessages([
                    "lines.$index" => 'Each journal line must post to exactly one side.',
                ]);
            }

            $debitTotal = $debitTotal->plus($debit);
            $creditTotal = $creditTotal->plus($credit);
        }

        if ($debitTotal->isLessThanOrEqualTo(BigDecimal::zero())) {
            throw ValidationException::withMessages([
                'journal' => 'Journal entries must carry a positive amount.',
            ]);
        }

        if (! $debitTotal->isEqualTo($creditTotal)) {
            throw ValidationException::withMessages([
                'journal' => sprintf('Unbalanced journal entry. Debits %s must equal credits %s.', $debitTotal, $creditTotal),
            ]);
        }

        $entry = JournalEntry::create([
            'uuid' => (string) Str::uuid(),
            'company_id' => $company->id,
            'entry_number' => $this->nextEntryNumber($company),
            'status' => 'posted',
            'entry_date' => $entryAttributes['entry_date'],
            'source_type' => $entryAttributes['source_type'] ?? null,
            'source_id' => $entryAttributes['source_id'] ?? null,
            'description' => $entryAttributes['description'] ?? null,
            'posted_at' => now(),
        ]);

        $entry->lines()->createMany($lines);

        return $entry->load('lines');
    }
}