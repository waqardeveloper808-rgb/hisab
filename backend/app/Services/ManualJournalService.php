<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Company;
use App\Models\JournalEntry;
use App\Models\User;
use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ManualJournalService
{
    public function __construct(private readonly AccountingPeriodService $accountingPeriodService) {}

    private function nextEntryNumber(Company $company): string
    {
        $count = JournalEntry::query()
            ->where('company_id', $company->id)
            ->lockForUpdate()
            ->count() + 1;

        return sprintf('JV-%d-%05d', $company->id, $count);
    }

    /**
     * Create a manual journal entry (draft or posted).
     */
    public function createJournal(Company $company, User $actor, array $data): JournalEntry
    {
        $entryDate = Carbon::parse($data['entry_date']);
        $postingDate = isset($data['posting_date']) ? Carbon::parse($data['posting_date']) : $entryDate;
        $status = $data['status'] ?? 'draft';

        if ($status === 'posted') {
            $this->accountingPeriodService->ensureDateOpen($company, $postingDate);
        }

        $lines = $data['lines'] ?? [];
        if (count($lines) < 2) {
            throw ValidationException::withMessages([
                'lines' => 'A journal entry must have at least two lines.',
            ]);
        }

        $totalDebit = BigDecimal::zero();
        $totalCredit = BigDecimal::zero();

        foreach ($lines as $line) {
            $debit = BigDecimal::of((string) ($line['debit'] ?? '0'));
            $credit = BigDecimal::of((string) ($line['credit'] ?? '0'));

            if ($debit->isNegative() || $credit->isNegative()) {
                throw ValidationException::withMessages([
                    'lines' => 'Journal line amounts must not be negative.',
                ]);
            }

            if ($debit->isZero() && $credit->isZero()) {
                throw ValidationException::withMessages([
                    'lines' => 'Each journal line must have a debit or credit amount.',
                ]);
            }

            if ($debit->isPositive() && $credit->isPositive()) {
                throw ValidationException::withMessages([
                    'lines' => 'A journal line cannot have both debit and credit.',
                ]);
            }

            $account = Account::query()
                ->where('company_id', $company->id)
                ->where('id', $line['account_id'])
                ->first();

            if (! $account) {
                throw ValidationException::withMessages([
                    'lines' => "Account ID {$line['account_id']} not found.",
                ]);
            }

            if (! $account->allows_posting) {
                throw ValidationException::withMessages([
                    'lines' => "Account {$account->code} does not allow posting.",
                ]);
            }

            if (! $account->is_active) {
                throw ValidationException::withMessages([
                    'lines' => "Account {$account->code} is inactive.",
                ]);
            }

            $totalDebit = $totalDebit->plus($debit);
            $totalCredit = $totalCredit->plus($credit);
        }

        if (! $totalDebit->isEqualTo($totalCredit)) {
            throw ValidationException::withMessages([
                'lines' => sprintf(
                    'Journal is unbalanced. Total debit: %s, total credit: %s.',
                    $totalDebit->toScale(2, RoundingMode::HALF_UP),
                    $totalCredit->toScale(2, RoundingMode::HALF_UP),
                ),
            ]);
        }

        return DB::transaction(function () use ($company, $actor, $data, $entryDate, $postingDate, $status, $lines) {
            $journal = JournalEntry::create([
                'company_id' => $company->id,
                'entry_number' => $this->nextEntryNumber($company),
                'status' => $status,
                'entry_date' => $entryDate->toDateString(),
                'posting_date' => $postingDate->toDateString(),
                'source_type' => 'manual_journal',
                'reference' => $data['reference'] ?? null,
                'description' => $data['description'] ?? null,
                'memo' => $data['memo'] ?? null,
                'metadata' => $data['metadata'] ?? null,
                'created_by' => $actor->id,
                'posted_by' => $status === 'posted' ? $actor->id : null,
                'posted_at' => $status === 'posted' ? now() : null,
            ]);

            foreach ($lines as $idx => $line) {
                $journal->lines()->create([
                    'line_no' => $idx + 1,
                    'account_id' => $line['account_id'],
                    'contact_id' => $line['contact_id'] ?? null,
                    'document_id' => $line['document_id'] ?? null,
                    'cost_center_id' => $line['cost_center_id'] ?? null,
                    'branch_id' => $line['branch_id'] ?? null,
                    'inventory_item_id' => $line['inventory_item_id'] ?? null,
                    'description' => $line['description'] ?? null,
                    'debit' => (string) BigDecimal::of((string) ($line['debit'] ?? '0'))->toScale(2, RoundingMode::HALF_UP),
                    'credit' => (string) BigDecimal::of((string) ($line['credit'] ?? '0'))->toScale(2, RoundingMode::HALF_UP),
                    'tax_code' => $line['tax_code'] ?? null,
                ]);
            }

            return $journal->load('lines');
        });
    }

    /**
     * Post a draft journal entry.
     */
    public function postJournal(Company $company, JournalEntry $journal, User $actor): JournalEntry
    {
        if ($journal->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => 'Only draft journals can be posted.',
            ]);
        }

        $postingDate = $journal->posting_date ?? $journal->entry_date;
        $this->accountingPeriodService->ensureDateOpen($company, Carbon::parse($postingDate));

        $journal->update([
            'status' => 'posted',
            'posted_by' => $actor->id,
            'posted_at' => now(),
        ]);

        return $journal->fresh('lines');
    }

    /**
     * Reverse a posted journal entry.
     */
    public function reverseJournal(Company $company, JournalEntry $journal, User $actor, ?string $reversalDate = null): JournalEntry
    {
        if ($journal->status !== 'posted') {
            throw ValidationException::withMessages([
                'status' => 'Only posted journals can be reversed.',
            ]);
        }

        $date = $reversalDate ? Carbon::parse($reversalDate) : Carbon::now();
        $this->accountingPeriodService->ensureDateOpen($company, $date);

        return DB::transaction(function () use ($company, $journal, $actor, $date) {
            $reversal = JournalEntry::create([
                'company_id' => $company->id,
                'entry_number' => $this->nextEntryNumber($company),
                'status' => 'posted',
                'entry_date' => $date->toDateString(),
                'posting_date' => $date->toDateString(),
                'source_type' => 'manual_journal',
                'reference' => 'Reversal of ' . $journal->entry_number,
                'description' => 'Reversal of ' . $journal->entry_number,
                'memo' => 'Auto-reversal',
                'created_by' => $actor->id,
                'posted_by' => $actor->id,
                'posted_at' => now(),
                'reversed_from_id' => $journal->id,
            ]);

            foreach ($journal->lines as $idx => $line) {
                $reversal->lines()->create([
                    'line_no' => $idx + 1,
                    'account_id' => $line->account_id,
                    'contact_id' => $line->contact_id,
                    'document_id' => $line->document_id,
                    'cost_center_id' => $line->cost_center_id,
                    'branch_id' => $line->branch_id,
                    'inventory_item_id' => $line->inventory_item_id,
                    'description' => 'Reversal: ' . ($line->description ?? ''),
                    'debit' => $line->credit,
                    'credit' => $line->debit,
                    'tax_code' => $line->tax_code,
                ]);
            }

            return $reversal->load('lines');
        });
    }
}
