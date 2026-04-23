<?php

namespace App\Services\Reports;

use App\Models\Account;
use App\Models\Company;
use App\Models\JournalEntryLine;

class CashFlowService
{
    public function statement(Company $company, array $filters = []): array
    {
        $cashAccounts = Account::query()
            ->where('company_id', $company->id)
            ->where('account_class', 'asset')
            ->where(function ($query) {
                $query->where('group', 'bank')
                    ->orWhere('group', 'cash')
                    ->orWhere('subtype', 'bank')
                    ->orWhere('subtype', 'cash')
                    ->orWhereRaw('LOWER(name) LIKE ?', ['%bank%'])
                    ->orWhereRaw('LOWER(name) LIKE ?', ['%cash%']);
            })
            ->pluck('id')
            ->all();

        if ($cashAccounts === []) {
            return [
                'operating' => [],
                'investing' => [],
                'financing' => [],
                'operating_total' => 0,
                'investing_total' => 0,
                'financing_total' => 0,
                'net_change' => 0,
            ];
        }

        $lines = JournalEntryLine::query()
            ->whereIn('account_id', $cashAccounts)
            ->whereHas('journalEntry', function ($query) use ($company, $filters) {
                $query->where('company_id', $company->id)
                    ->where('status', 'posted');

                if (! empty($filters['from'])) {
                    $query->whereDate('entry_date', '>=', $filters['from']);
                }

                if (! empty($filters['to'])) {
                    $query->whereDate('entry_date', '<=', $filters['to']);
                }
            })
            ->with(['account:id,code,name', 'journalEntry:id,entry_number,entry_date,source_type,description'])
            ->get();

        $statement = [
            'operating' => [],
            'investing' => [],
            'financing' => [],
        ];

        foreach ($lines as $line) {
            $entry = $line->journalEntry;
            $net = (float) $line->debit - (float) $line->credit;
            $row = [
                'account_code' => $line->account?->code,
                'account_name' => $line->account?->name,
                'debit' => round((float) $line->debit, 2),
                'credit' => round((float) $line->credit, 2),
                'net' => round($net, 2),
                'entry_number' => $entry?->entry_number,
                'entry_date' => $entry?->entry_date?->toDateString(),
                'source_type' => $entry?->source_type,
                'description' => $line->description ?? $entry?->description,
            ];

            $source = (string) ($entry?->source_type ?? '');
            if (in_array($source, ['asset_purchase', 'asset_disposal'], true)) {
                $statement['investing'][] = $row;
            } elseif (in_array($source, ['loan', 'capital', 'drawing'], true)) {
                $statement['financing'][] = $row;
            } else {
                $statement['operating'][] = $row;
            }
        }

        $operatingTotal = array_sum(array_column($statement['operating'], 'net'));
        $investingTotal = array_sum(array_column($statement['investing'], 'net'));
        $financingTotal = array_sum(array_column($statement['financing'], 'net'));

        return [
            ...$statement,
            'operating_total' => round($operatingTotal, 2),
            'investing_total' => round($investingTotal, 2),
            'financing_total' => round($financingTotal, 2),
            'net_change' => round($operatingTotal + $investingTotal + $financingTotal, 2),
        ];
    }
}