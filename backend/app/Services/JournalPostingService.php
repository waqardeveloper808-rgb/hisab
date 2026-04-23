<?php

namespace App\Services;

use App\Exceptions\AccountingControlException;
use App\Models\Account;
use App\Models\Company;
use App\Models\JournalBatch;
use App\Models\JournalEntry;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class JournalPostingService
{
    public function __construct(private readonly AccountingPeriodService $accountingPeriodService)
    {
    }

    public function postJournal(Company $company, User $actor, string $sourceType, string $sourceId, array $entries, ?string $entryDate = null, ?string $description = null): JournalBatch
    {
        if (trim($sourceType) === '' || trim($sourceId) === '') {
            throw new AccountingControlException('ACC-004', 'source_type and source_id are required.');
        }

        if (count($entries) < 2) {
            throw new AccountingControlException('ACC-002', 'At least two journal entries are required.');
        }

        if (JournalBatch::query()->where('source_type', $sourceType)->where('source_id', $sourceId)->exists()) {
            throw new AccountingControlException('ACC-010', 'A journal batch already exists for this source.');
        }

        $postingDate = Carbon::parse($entryDate ?? now()->toDateString());
        $this->accountingPeriodService->ensureDateOpen($company, $postingDate);

        $debitTotal = 0.0;
        $creditTotal = 0.0;
        $normalizedEntries = [];

        foreach ($entries as $index => $entry) {
            $accountId = (int) ($entry['account_id'] ?? 0);
            $account = Account::query()
                ->where('company_id', $company->id)
                ->whereKey($accountId)
                ->first();

            if (! $account || ! $account->is_active || ! $account->allows_posting) {
                throw new AccountingControlException('ACC-005', "Invalid or inactive account on line ".($index + 1).'.');
            }

            $debit = round((float) ($entry['debit'] ?? 0), 2);
            $credit = round((float) ($entry['credit'] ?? 0), 2);

            if ($debit < 0 || $credit < 0) {
                throw new AccountingControlException('ACC-005', 'Debit and credit must be zero or positive.');
            }

            if (($debit == 0.0 && $credit == 0.0) || ($debit > 0 && $credit > 0)) {
                throw new AccountingControlException('ACC-001', 'Each journal entry line must post to exactly one side.');
            }

            $debitTotal = round($debitTotal + $debit, 2);
            $creditTotal = round($creditTotal + $credit, 2);

            $normalizedEntries[] = [
                'account_id' => $account->id,
                'debit' => $debit,
                'credit' => $credit,
                'description' => $entry['description'] ?? null,
            ];
        }

        if (round($debitTotal, 2) !== round($creditTotal, 2)) {
            throw new AccountingControlException('ACC-001', 'Total debit must equal total credit.');
        }

        try {
            return DB::transaction(function () use ($company, $actor, $sourceType, $sourceId, $postingDate, $description, $normalizedEntries) {
                $batch = JournalBatch::query()->create([
                    'company_id' => $company->id,
                    'source_type' => $sourceType,
                    'source_id' => $sourceId,
                    'status' => JournalBatch::STATUS_DRAFT,
                    'created_by' => $actor->id,
                    'created_at' => now(),
                ]);

                $journal = JournalEntry::query()->create([
                    'uuid' => (string) Str::uuid(),
                    'company_id' => $company->id,
                    'batch_id' => $batch->id,
                    'entry_number' => $this->nextEntryNumber($company),
                    'status' => 'draft',
                    'entry_date' => $postingDate->toDateString(),
                    'posting_date' => $postingDate->toDateString(),
                    'source_type' => $sourceType,
                    'source_id' => $sourceId,
                    'reference' => $sourceId,
                    'description' => $description,
                    'created_by' => $actor->id,
                ]);

                foreach ($normalizedEntries as $index => $entry) {
                    $journal->lines()->create([
                        'line_no' => $index + 1,
                        'account_id' => $entry['account_id'],
                        'description' => $entry['description'],
                        'debit' => $entry['debit'],
                        'credit' => $entry['credit'],
                    ]);
                }

                $journal->update([
                    'status' => 'posted',
                    'posted_by' => $actor->id,
                    'posted_at' => now(),
                ]);

                $batch->update(['status' => JournalBatch::STATUS_POSTED]);

                return $batch->fresh('journals.lines.account');
            });
        } catch (AccountingControlException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            throw new AccountingControlException('ACC-003', 'Journal posting failed and was rolled back.');
        }
    }

    private function nextEntryNumber(Company $company): string
    {
        $count = DB::table('journal_entries')->where('company_id', $company->id)->lockForUpdate()->count() + 1;

        return sprintf('JE-%d-%05d', $company->id, $count);
    }
}