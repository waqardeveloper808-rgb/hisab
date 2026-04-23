<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Document;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class PlanLimitService
{
    public function ensureInvoicingTrialWindow(Company $company): void
    {
        $subscription = $company->subscriptions()->with('plan')->latest('id')->first();
        $plan = $subscription?->plan;

        if (! $subscription || ! $plan) {
            return;
        }

        $trialDays = (int) ($plan->feature_flags['invoicing_trial_days'] ?? 60);
        $startedAt = $subscription->started_at ?? $subscription->trial_ends_at;

        if (! $startedAt) {
            return;
        }

        if ($startedAt->copy()->addDays($trialDays)->isPast()) {
            throw ValidationException::withMessages([
                'plan' => 'The e-invoicing trial window has ended. Activate a paid plan to issue more invoices.',
            ]);
        }
    }

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

    public function ensureAccountingPrintAccess(Company $company, Document $document): void
    {
        $subscription = $company->subscriptions()->with('plan')->latest('id')->first();
        $plan = $subscription?->plan;

        if (! $subscription || ! $plan) {
            return;
        }

        $trialDays = (int) ($plan->feature_flags['accounting_trial_days'] ?? 120);
        $printLimit = (int) ($plan->feature_flags['accounting_print_limit_per_day'] ?? 1);
        $startedAt = $subscription->started_at ?? $subscription->trial_ends_at;

        if (! $startedAt || ! $startedAt->copy()->addDays($trialDays)->isPast()) {
            return;
        }

        $cacheKey = sprintf('company:%d:document-print:%s', $company->id, now()->toDateString());
        $current = (int) Cache::get($cacheKey, 0);

        if ($current >= $printLimit) {
            throw ValidationException::withMessages([
                'plan' => sprintf('Accounting trial print mode is active. Only %d PDF export%s allowed per day after the trial window.', $printLimit, $printLimit === 1 ? ' is' : 's are'),
            ]);
        }

        Cache::put($cacheKey, $current + 1, now()->endOfDay());
    }

    private function activePlan(Company $company)
    {
        return $company->subscriptions()->with('plan')->latest('id')->first()?->plan;
    }
}