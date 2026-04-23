<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Support\AccessMatrix;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccessProfileController extends Controller
{
    use ResolvesCompanyAccess;

    public function show(Request $request, Company $company): JsonResponse
    {
        $user = $request->user();
        $membership = $this->companyMembership($user, $company);
        $companyAbilities = $membership
            ? $this->resolveCompanyAbilities($membership)
            : [];
        $subscription = $company->subscriptions()->with('plan')->latest('id')->first();
        $referral = $company->creator?->referrals()->with('agent.user:id,name')->latest('id')->first();

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'platform_role' => $user->platform_role,
                    'is_platform_active' => $user->is_platform_active,
                ],
                'platform_abilities' => $user->platformAbilities(),
                'company' => [
                    'id' => $company->id,
                    'legal_name' => $company->legal_name,
                    'is_active' => $company->is_active,
                ],
                'membership' => $membership ? [
                    'role' => $membership->pivot->role,
                    'is_active' => (bool) $membership->pivot->is_active,
                    'permissions' => $this->normalizePermissions($membership->pivot->permissions),
                    'abilities' => $companyAbilities,
                    'permission_layers' => [
                        'defaults' => AccessMatrix::companyAbilitiesFor($membership->pivot->role),
                        'resolved' => $companyAbilities,
                    ],
                ] : null,
                'rbac' => [
                    'platform_defaults' => $user->platformAbilities(),
                    'company_role_catalog' => ['owner', 'admin', 'accountant'],
                ],
                'subscription' => $subscription ? [
                    'id' => $subscription->id,
                    'status' => $subscription->status,
                    'plan_code' => $subscription->plan_code,
                    'plan_name' => $subscription->plan_name,
                    'monthly_price_sar' => (float) $subscription->monthly_price_sar,
                    'trial_days' => $subscription->trial_days,
                    'started_at' => optional($subscription->started_at)?->toDateString(),
                    'trial_ends_at' => optional($subscription->trial_ends_at)?->toDateString(),
                    'plan' => $subscription->plan ? [
                        'invoice_limit' => $subscription->plan->invoice_limit,
                        'customer_limit' => $subscription->plan->customer_limit,
                        'accountant_seat_limit' => $subscription->plan->accountant_seat_limit,
                        'feature_flags' => $subscription->plan->feature_flags ?? [],
                    ] : null,
                ] : null,
                'referral' => $referral ? [
                    'referral_code' => $referral->referral_code,
                    'agent_name' => $referral->agent?->user?->name,
                ] : null,
            ],
        ]);
    }
}