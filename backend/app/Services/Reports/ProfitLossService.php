<?php

namespace App\Services\Reports;

use App\Models\Company;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProfitLossService
{
    public function statement(Company $company): array
    {
        $revenueTypes = ['revenue', 'income', 'contra'];

        $lines = DB::table('journal_entry_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->where('journal_entries.company_id', $company->id)
            ->whereIn('accounts.type', [...$revenueTypes, 'expense'])
            ->groupBy('accounts.code', 'accounts.name', 'accounts.type')
            ->orderBy('accounts.code')
            ->selectRaw('accounts.code, accounts.name, accounts.type, SUM(journal_entry_lines.debit) as debit_total, SUM(journal_entry_lines.credit) as credit_total')
            ->get()
            ->map(function ($row) use ($revenueTypes) {
                $net = in_array($row->type, $revenueTypes, true)
                    ? (float) $row->credit_total - (float) $row->debit_total
                    : (float) $row->debit_total - (float) $row->credit_total;

                return [
                    'code' => $row->code,
                    'name' => $row->name,
                    'type' => $row->type,
                    'debit_total' => number_format((float) $row->debit_total, 2, '.', ''),
                    'credit_total' => number_format((float) $row->credit_total, 2, '.', ''),
                    'net_amount' => number_format($net, 2, '.', ''),
                ];
            })
            ->values();

        $revenueTotal = $lines
            ->filter(fn (array $row) => in_array($row['type'], $revenueTypes, true))
            ->sum(fn (array $row) => (float) $row['net_amount']);
        $expenseTotal = $lines->where('type', 'expense')->sum(fn (array $row) => (float) $row['net_amount']);

        return [
            'lines' => $lines,
            'revenue_total' => number_format($revenueTotal, 2, '.', ''),
            'expense_total' => number_format($expenseTotal, 2, '.', ''),
            'net_profit' => number_format($revenueTotal - $expenseTotal, 2, '.', ''),
        ];
    }

    public function lines(Company $company): Collection
    {
        return collect($this->statement($company)['lines']);
    }
}