<?php

namespace App\Http\Controllers\Api;

use App\Models\Account;
use App\Models\BankStatementLine;
use App\Models\Company;
use App\Models\JournalEntryLine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReconciliationController
{
    private const NEGATIVE_BANK_EXPLANATION = 'Bank asset is negative because credits exceed debits. Add funding/opening balance or classify as overdraft liability.';

    public function bankAccounts(Company $company): JsonResponse
    {
        $accounts = Account::query()
            ->where('company_id', $company->id)
            ->where('account_class', 'asset')
            ->where(function ($q) {
                $q->where('group', 'bank')
                  ->orWhere('group', 'cash')
                  ->orWhere('subtype', 'bank')
                  ->orWhere('subtype', 'cash')
                  ->orWhere(DB::raw('lower(name)'), 'like', '%bank%')
                  ->orWhere(DB::raw('lower(name)'), 'like', '%cash%');
            })
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'normal_balance']);

        $payload = $accounts->map(function (Account $account) use ($company) {
            $row = DB::table('journal_entry_lines')
                ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
                ->where('journal_entries.company_id', $company->id)
                ->where('journal_entries.status', 'posted')
                ->where('journal_entry_lines.account_id', $account->id)
                ->selectRaw('COALESCE(SUM(journal_entry_lines.debit), 0) as debit_total, COALESCE(SUM(journal_entry_lines.credit), 0) as credit_total')
                ->first();

            $debitTotal = (float) ($row->debit_total ?? 0);
            $creditTotal = (float) ($row->credit_total ?? 0);
            $normal = (string) ($account->normal_balance ?? 'debit');
            $balance = $normal === 'credit'
                ? round($creditTotal - $debitTotal, 2)
                : round($debitTotal - $creditTotal, 2);

            $epsilon = 0.005;
            if ($balance > $epsilon) {
                $balanceStatus = 'positive';
                $explanation = '';
            } elseif ($balance < -$epsilon) {
                $balanceStatus = 'negative';
                $explanation = self::NEGATIVE_BANK_EXPLANATION;
            } else {
                $balanceStatus = 'zero';
                $explanation = '';
            }

            return [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'normal_balance' => $account->normal_balance,
                'debit_total' => round($debitTotal, 2),
                'credit_total' => round($creditTotal, 2),
                'balance' => $balance,
                'balance_status' => $balanceStatus,
                'balance_explanation' => $explanation,
            ];
        })->values();

        return response()->json(['data' => $payload]);
    }

    public function statementLines(Company $company, Account $account, Request $request): JsonResponse
    {
        $lines = BankStatementLine::query()
            ->where('company_id', $company->id)
            ->where('bank_account_id', $account->id)
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('from_date'), fn ($q) => $q->whereDate('transaction_date', '>=', $request->input('from_date')))
            ->when($request->filled('to_date'), fn ($q) => $q->whereDate('transaction_date', '<=', $request->input('to_date')))
            ->orderBy('transaction_date')
            ->paginate($request->integer('per_page', 100));

        return response()->json($lines);
    }

    public function importStatementLines(Company $company, Account $account, Request $request): JsonResponse
    {
        $request->validate([
            'lines' => 'required|array|min:1',
            'lines.*.transaction_date' => 'required|date',
            'lines.*.value_date' => 'nullable|date',
            'lines.*.reference' => 'nullable|string|max:120',
            'lines.*.description' => 'nullable|string',
            'lines.*.debit' => 'nullable|numeric|min:0',
            'lines.*.credit' => 'nullable|numeric|min:0',
            'lines.*.running_balance' => 'nullable|numeric',
        ]);

        $created = [];
        foreach ($request->input('lines') as $line) {
            $created[] = BankStatementLine::create(array_merge($line, [
                'company_id' => $company->id,
                'bank_account_id' => $account->id,
                'status' => 'unmatched',
            ]));
        }

        return response()->json(['data' => $created, 'count' => count($created)], 201);
    }

    public function candidates(Company $company, Account $account, BankStatementLine $statementLine): JsonResponse
    {
        $amount = $statementLine->debit > 0 ? $statementLine->debit : $statementLine->credit;
        $side = $statementLine->debit > 0 ? 'credit' : 'debit';

        $candidates = JournalEntryLine::query()
            ->where('account_id', $account->id)
            ->where($side, $amount)
            ->whereDoesntHave('matchedStatementLine')
            ->with('journalEntry:id,entry_number,entry_date,description')
            ->limit(20)
            ->get();

        return response()->json(['data' => $candidates]);
    }

    public function match(Company $company, Account $account, BankStatementLine $statementLine, Request $request): JsonResponse
    {
        $request->validate([
            'journal_line_id' => 'required|integer|exists:journal_entry_lines,id',
        ]);

        $statementLine->update([
            'matched_journal_line_id' => $request->input('journal_line_id'),
            'status' => 'matched',
        ]);

        return response()->json(['data' => $statementLine->fresh()]);
    }

    public function reconcile(Company $company, Account $account, Request $request): JsonResponse
    {
        $request->validate([
            'statement_line_ids' => 'required|array|min:1',
            'statement_line_ids.*' => 'integer|exists:bank_statement_lines,id',
        ]);

        $updated = BankStatementLine::query()
            ->where('company_id', $company->id)
            ->where('bank_account_id', $account->id)
            ->where('status', 'matched')
            ->whereIn('id', $request->input('statement_line_ids'))
            ->update([
                'status' => 'reconciled',
                'reconciled_at' => now()->toDateString(),
            ]);

        return response()->json(['reconciled_count' => $updated]);
    }
}
