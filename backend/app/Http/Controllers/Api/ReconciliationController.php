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
    public function bankAccounts(Company $company): JsonResponse
    {
        $accounts = Account::query()
            ->where('company_id', $company->id)
            ->where('account_class', 'asset')
            ->where(function ($q) {
                $q->where('group', 'bank')
                  ->orWhere('subtype', 'bank')
                ->orWhere(DB::raw('lower(name)'), 'like', '%bank%');
            })
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'normal_balance'])
            ->map(fn (Account $account) => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'normal_balance' => $account->normal_balance,
                'balance' => $account->computeBalance(),
            ])
            ->values();

        return response()->json(['data' => $accounts]);
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
