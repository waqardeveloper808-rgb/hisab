<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\AgentReferral;
use App\Models\ProductSetting;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use App\Models\User;
use App\Support\AccessMatrix;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'referral_code' => ['nullable', 'string', 'exists:agents,referral_code'],
            'plan_code' => ['nullable', 'string', 'max:40'],
        ]);

        $settings = ProductSetting::current();
        $plan = SubscriptionPlan::resolveForSignup($validated['plan_code'] ?? null);

        $user = DB::transaction(function () use ($validated, $settings, $plan) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => strtolower($validated['email']),
                'password' => $validated['password'],
                'platform_role' => 'customer',
            ]);

            $subscription = Subscription::query()->create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'plan_code' => $plan->code,
                'plan_name' => $plan->name,
                'status' => 'trialing',
                'monthly_price_sar' => $plan->monthly_price_sar,
                'trial_days' => $plan->trial_days,
                'free_invoice_limit' => $plan->invoice_limit ?? $settings->free_invoice_limit,
                'started_at' => now(),
                'trial_ends_at' => Carbon::now()->addDays($plan->trial_days),
            ]);

            if (! empty($validated['referral_code'])) {
                $agent = Agent::query()
                    ->where('referral_code', $validated['referral_code'])
                    ->where('is_active', true)
                    ->first();

                if ($agent) {
                    AgentReferral::query()->create([
                        'agent_id' => $agent->id,
                        'referred_user_id' => $user->id,
                        'subscription_id' => $subscription->id,
                        'referral_code' => $agent->referral_code,
                        'commission_rate' => $agent->commission_rate,
                        'commission_amount' => round(((float) $settings->paid_plan_monthly_price_sar) * ((float) $agent->commission_rate) / 100, 2),
                        'commission_status' => 'pending',
                        'signed_up_at' => now(),
                    ]);
                }
            }

            return $user;
        });

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'platform_role' => $user->platform_role,
            ],
        ], 201);
    }

    /**
     * @throws ValidationException
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email:rfc'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->where('email', strtolower($validated['email']))
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        if (in_array($user->platform_role, ['super_admin', 'support'], true) && ! $user->is_platform_active) {
            throw ValidationException::withMessages([
                'email' => 'This platform account is currently disabled.',
            ]);
        }

        $activeCompany = $this->resolveDefaultCompanyContext($user);

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'platform_role' => $user->platform_role,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'platform_role' => $user->platform_role,
                ],
                'workspace_context' => [
                    'active_company' => $activeCompany,
                ],
                'company_id' => $activeCompany['id'] ?? null,
                'active_company_id' => $activeCompany['id'] ?? null,
            ],
        ]);
    }

    private function resolveDefaultCompanyContext(User $user): ?array
    {
        $membership = $user->companies()
            ->wherePivot('is_active', true)
            ->where('companies.is_active', true)
            ->orderBy('companies.id')
            ->first();

        if (! $membership) {
            return null;
        }

        $role = is_string($membership->pivot->role) ? $membership->pivot->role : 'member';

        return [
            'id' => $membership->id,
            'legal_name' => $membership->legal_name,
            'role' => $role,
            'abilities' => AccessMatrix::companyAbilitiesFor(
                $role,
                AccessMatrix::normalizePermissions($membership->pivot->permissions),
            ),
        ];
    }
}
