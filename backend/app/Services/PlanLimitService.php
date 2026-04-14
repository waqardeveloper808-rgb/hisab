<?php

namespace App\Services;

use App\Models\Company;
use Illuminate\Validation\ValidationException;

class PlanLimitService
{
    public function ensureCustomerLimit(Company $company): void
    {
        $plan = $this->activePlan($company);
        $limit = $plan?->customer_limit;

        if ($limit === null) {
            return;
        }

        if ($company->contacts()->where('type', 'customer')->count() >= $limit) {
            throw ValidationException::withMessages([
                'plan' => 'This plan has reached the customer limit. Upgrade to add more customers.',
            ]);
        }
    }

    public function ensureInvoiceLimit(Company $company): void
    {
        $plan = $this->activePlan($company);
        $limit = $plan?->invoice_limit;

        if ($limit === null) {
            return;
        }

        $current = $company->documents()
            ->whereIn('type', ['tax_invoice', 'cash_invoice', 'api_invoice'])
            ->whereMonth('issue_date', now()->month)
            ->whereYear('issue_date', now()->year)
            ->count();

        if ($current >= $limit) {
            throw ValidationException::withMessages([
                'plan' => 'This plan has reached the invoice limit for the current month. Upgrade to continue issuing invoices.',
            ]);
        }
    }

    public function ensureCustomFieldLimit(Company $company): void
    {
        $plan = $this->activePlan($company);
        $limit = $plan?->feature_flags['custom_fields_limit'] ?? null;

        if ($limit === null) {
            return;
        }

        if ($company->customFieldDefinitions()->count() >= (int) $limit) {
            throw ValidationException::withMessages([
                'plan' => 'This plan has reached the custom field limit. Upgrade to add more fields.',
            ]);
        }
    }

    private function activePlan(Company $company)
    {
        return $company->subscriptions()->with('plan')->latest('id')->first()?->plan;
    }
}