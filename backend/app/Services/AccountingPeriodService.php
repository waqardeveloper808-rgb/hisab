<?php

namespace App\Services;

use App\Models\AccountingPeriod;
use App\Models\Company;
use Carbon\CarbonInterface;
use Illuminate\Validation\ValidationException;

class AccountingPeriodService
{
    public function ensureDateOpen(Company $company, CarbonInterface $date): void
    {
        $period = AccountingPeriod::query()
            ->where('company_id', $company->id)
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->first();

        if (! $period) {
            throw ValidationException::withMessages([
                'entry_date' => 'No accounting period exists for the selected date.',
            ]);
        }

        if ($period->status !== 'open') {
            throw ValidationException::withMessages([
                'entry_date' => 'The accounting period for this date is locked.',
            ]);
        }
    }
}