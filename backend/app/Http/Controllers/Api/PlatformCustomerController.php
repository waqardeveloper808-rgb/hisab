<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\SubscriptionPlan;
use App\Support\Validation\KsaBusinessValidation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformCustomerController extends Controller
{
    use ResolvesCompanyAccess;

    public function index(Request $request): JsonResponse
    {
        $this->ensurePlatformAbility($request->user(), 'platform.customers.view');

        $payload = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:active,suspended'],
        ]);

        $query = Company::query()
            ->with([
                'creator:id,name,email',
                'users:id,name,email',
                'subscriptions' => fn ($builder) => $builder->with('plan')->latest('id')->limit(1),
            ])
            ->orderByDesc('id');

        if (! empty($payload['status'])) {
            $query->where('is_active', $payload['status'] === 'active');
        }

        if (! empty($payload['search'])) {
            $search = '%'.$payload['search'].'%';
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('legal_name', 'like', $search)
                    ->orWhere('trade_name', 'like', $search)
                    ->orWhere('tax_number', 'like', $search)
                    ->orWhereHas('creator', function ($creatorQuery) use ($search): void {
                        $creatorQuery->where('name', 'like', $search)->orWhere('email', 'like', $search);
                    });
            });
        }

        return response()->json([
            'data' => $query->get()->map(fn (Company $company) => $this->mapCompany($company)),
        ]);
    }

    public function show(Request $request, Company $company): JsonResponse
    {
        $this->ensurePlatformAbility($request->user(), 'platform.customers.view');

        $company->load([
            'creator:id,name,email',
            'users:id,name,email',
            'subscriptions' => fn ($builder) => $builder->with('plan')->latest('id')->limit(1),
        ]);

        return response()->json([
            'data' => $this->mapCompany($company),
        ]);
    }

    public function update(Request $request, Company $company): JsonResponse
    {
        $this->ensurePlatformAbility($request->user(), 'platform.customers.manage');

        $payload = $request->validate([
            'legal_name' => ['required', 'string', 'max:255'],
            'trade_name' => ['nullable', 'string', 'max:255'],
            'tax_number' => ['nullable', 'string', 'max:15', KsaBusinessValidation::vatRule()],
            'registration_number' => ['nullable', 'string', 'max:64'],
            'base_currency' => ['required', 'string', 'size:3'],
            'locale' => ['required', 'string', 'max:10'],
            'timezone' => ['required', 'string', 'max:64'],
            'is_active' => ['required', 'boolean'],
            'suspended_reason' => ['nullable', 'string', 'max:255'],
            'plan_id' => ['nullable', 'integer'],
            'subscription_status' => ['nullable', 'in:trialing,active,cancelled,paused'],
        ]);

        $payload['tax_number'] = KsaBusinessValidation::normalizeVatNumber($payload['tax_number'] ?? null);

        $company->update([
            'legal_name' => $payload['legal_name'],
            'trade_name' => $payload['trade_name'] ?? null,
            'tax_number' => $payload['tax_number'] ?? null,
            'registration_number' => $payload['registration_number'] ?? null,
            'base_currency' => $payload['base_currency'],
            'locale' => $payload['locale'],
            'timezone' => $payload['timezone'],
            'is_active' => $payload['is_active'],
            'suspended_at' => $payload['is_active'] ? null : now(),
            'suspended_reason' => $payload['is_active'] ? null : ($payload['suspended_reason'] ?? 'Suspended by platform operator'),
        ]);

        if (array_key_exists('plan_id', $payload)) {
            $plan = $payload['plan_id'] ? SubscriptionPlan::query()->findOrFail($payload['plan_id']) : null;
            $subscription = $company->subscriptions()->latest('id')->first() ?? $company->subscriptions()->make([
                'user_id' => $company->created_by,
                'status' => 'trialing',
                'started_at' => now(),
            ]);

            if ($plan) {
                $subscription->fill([
                    'plan_id' => $plan->id,
                    'plan_code' => $plan->code,
                    'plan_name' => $plan->name,
                    'monthly_price_sar' => $plan->monthly_price_sar,
                    'trial_days' => $plan->trial_days,
                    'free_invoice_limit' => $plan->invoice_limit ?? 0,
                ]);
            }

            if (! empty($payload['subscription_status'])) {
                $subscription->status = $payload['subscription_status'];
            }

            if (! $subscription->exists) {
                $subscription->company_id = $company->id;
            }

            $subscription->save();
        }

        return response()->json([
            'data' => $this->mapCompany($company->fresh()->load([
                'creator:id,name,email',
                'users:id,name,email',
                'subscriptions' => fn ($builder) => $builder->with('plan')->latest('id')->limit(1),
            ])),
        ]);
    }

    private function mapCompany(Company $company): array
    {
        $subscription = $company->subscriptions->first();
        $referral = $company->creator?->referrals()->with('agent.user:id,name')->latest('id')->first();

        return [
            'id' => $company->id,
            'legal_name' => $company->legal_name,
            'trade_name' => $company->trade_name,
            'tax_number' => $company->tax_number,
            'registration_number' => $company->registration_number,
            'base_currency' => $company->base_currency,
            'locale' => $company->locale,
            'timezone' => $company->timezone,
            'is_active' => $company->is_active,
            'suspended_reason' => $company->suspended_reason,
            'owner' => [
                'name' => $company->creator?->name,
                'email' => $company->creator?->email,
            ],
            'users' => $company->users->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->pivot->role,
                'is_active' => (bool) $user->pivot->is_active,
            ])->values(),
            'subscription' => $subscription ? [
                'plan_id' => $subscription->plan_id,
                'status' => $subscription->status,
                'plan_code' => $subscription->plan_code,
                'plan_name' => $subscription->plan_name,
                'monthly_price_sar' => (float) $subscription->monthly_price_sar,
            ] : null,
            'referral_source' => $referral ? [
                'referral_code' => $referral->referral_code,
                'agent_name' => $referral->agent?->user?->name,
            ] : null,
        ];
    }
}