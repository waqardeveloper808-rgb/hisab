<?php

namespace App\Services\Reports;

use App\Models\Company;
use Illuminate\Support\Facades\DB;

class BalanceSheetService
{
    public function __construct(private readonly ProfitLossService $profitLossService)
    {
    }

    public function statement(Company $company): array
    {
        $rows = DB::table('journal_entry_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->where('journal_entries.company_id', $company->id)
            ->whereIn('accounts.type', ['asset', 'liability', 'equity'])
            ->groupBy('accounts.code', 'accounts.name', 'accounts.type')
            ->orderBy('accounts.code')
            ->selectRaw('accounts.code, accounts.name, accounts.type, SUM(journal_entry_lines.debit) as debit_total, SUM(journal_entry_lines.credit) as credit_total')
            ->get()
            ->map(function ($row) {
                $balance = $row->type === 'asset'
                    ? (float) $row->debit_total - (float) $row->credit_total
                    : (float) $row->credit_total - (float) $row->debit_total;

                return [
                    'code' => $row->code,
                    'name' => $row->name,
                    'type' => $row->type,
                    'balance' => number_format($balance, 2, '.', ''),
                ];
            })
            ->values();

        $profitLoss = $this->profitLossService->statement($company);
        $currentEarnings = (float) $profitLoss['net_profit'];
        $assetTotal = $rows->where('type', 'asset')->sum(fn (array $row) => (float) $row['balance']);
        $liabilityTotal = $rows->where('type', 'liability')->sum(fn (array $row) => (float) $row['balance']);
        $equityRows = $rows->where('type', 'equity')->values();
        $equityTotal = $equityRows->sum(fn (array $row) => (float) $row['balance']) + $currentEarnings;

        return [
            'assets' => $rows->where('type', 'asset')->values(),
            'liabilities' => $rows->where('type', 'liability')->values(),
            'equity' => $equityRows->push([
                'code' => 'CURRENT_EARNINGS',
                'name' => 'Current Earnings',
                'type' => 'equity',
                'balance' => number_format($currentEarnings, 2, '.', ''),
            ])->values(),
            'asset_total' => number_format($assetTotal, 2, '.', ''),
            'liability_total' => number_format($liabilityTotal, 2, '.', ''),
            'equity_total' => number_format($equityTotal, 2, '.', ''),
        ];
    }
}