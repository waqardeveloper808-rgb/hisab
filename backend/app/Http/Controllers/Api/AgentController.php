<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\Company;
use App\Models\ProductSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AgentController extends Controller
{
    use ResolvesCompanyAccess;

    public function show(Request $request, Company $company): JsonResponse
    {
        $user = $request->user();
        $this->ensureCompanyAbility($user, $company, 'workspace.agents.view');

        $settings = ProductSetting::current();

        $agent = Agent::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'referral_code' => $this->generateUniqueReferralCode($user->name),
                'commission_rate' => $settings->default_agent_commission_rate,
                'is_active' => true,
            ],
        );

        $agent->load([
            'referrals.referredUser:id,name,email',
            'referrals.subscription:id,status,plan_name,monthly_price_sar,trial_ends_at,activated_at',
        ]);

        $referrals = $agent->referrals
            ->sortByDesc('signed_up_at')
            ->values();

        $pendingCommission = $referrals
            ->where('commission_status', 'pending')
            ->sum(fn ($referral) => (float) $referral->commission_amount);

        $earnedCommission = $referrals
            ->where('commission_status', 'earned')
            ->sum(fn ($referral) => (float) $referral->commission_amount);

        $activeSubscriptions = $referrals
            ->filter(fn ($referral) => $referral->subscription?->status === 'active')
            ->count();

        return response()->json([
            'data' => [
                'agent' => [
                    'referral_code' => $agent->referral_code,
                    'commission_rate' => (float) $agent->commission_rate,
                    'is_active' => $agent->is_active,
                ],
                'summary' => [
                    'total_referrals' => $referrals->count(),
                    'total_signups' => $referrals->count(),
                    'total_subscriptions' => $referrals->filter(fn ($referral) => $referral->subscription !== null)->count(),
                    'active_subscriptions' => $activeSubscriptions,
                    'pending_commission' => $pendingCommission,
                    'earned_commission' => $earnedCommission,
                ],
                'referrals' => $referrals->map(fn ($referral) => [
                    'id' => $referral->id,
                    'name' => $referral->referredUser?->name,
                    'email' => $referral->referredUser?->email,
                    'signed_up_at' => optional($referral->signed_up_at)?->toIso8601String(),
                    'commission_amount' => (float) $referral->commission_amount,
                    'commission_status' => $referral->commission_status,
                    'subscription' => $referral->subscription ? [
                        'plan_name' => $referral->subscription->plan_name,
                        'status' => $referral->subscription->status,
                        'monthly_price_sar' => (float) $referral->subscription->monthly_price_sar,
                        'trial_ends_at' => optional($referral->subscription->trial_ends_at)?->toDateString(),
                        'activated_at' => optional($referral->subscription->activated_at)?->toIso8601String(),
                    ] : null,
                ]),
            ],
        ]);
    }

    private function generateUniqueReferralCode(string $name): string
    {
        $base = Str::upper(Str::substr(preg_replace('/[^A-Za-z0-9]/', '', $name) ?: 'GULF', 0, 6));

        do {
            $code = $base.'-'.Str::upper(Str::random(6));
        } while (Agent::query()->where('referral_code', $code)->exists());

        return $code;
    }
}