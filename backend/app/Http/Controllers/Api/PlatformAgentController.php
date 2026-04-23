<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Agent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformAgentController extends Controller
{
    use ResolvesCompanyAccess;

    public function index(Request $request): JsonResponse
    {
        $this->ensurePlatformAbility($request->user(), 'platform.agents.view');

        $payload = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        $query = Agent::query()
            ->with(['user:id,name,email', 'referrals.subscription:id,agent_referrals.subscription_id,status'])
            ->withCount('referrals')
            ->orderByDesc('id');

        if (! empty($payload['status'])) {
            $query->where('is_active', $payload['status'] === 'active');
        }

        if (! empty($payload['search'])) {
            $search = '%'.$payload['search'].'%';
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('referral_code', 'like', $search)
                    ->orWhereHas('user', function ($userQuery) use ($search): void {
                        $userQuery->where('name', 'like', $search)->orWhere('email', 'like', $search);
                    });
            });
        }

        $agents = $query->get()->map(function (Agent $agent) {
            $pendingCommission = $agent->referrals->where('commission_status', 'pending')->sum('commission_amount');
            $earnedCommission = $agent->referrals->where('commission_status', 'earned')->sum('commission_amount');

            return [
                'id' => $agent->id,
                'name' => $agent->user?->name,
                'email' => $agent->user?->email,
                'referral_code' => $agent->referral_code,
                'commission_rate' => (float) $agent->commission_rate,
                'is_active' => $agent->is_active,
                'referrals_count' => $agent->referrals_count,
                'pending_commission' => (float) $pendingCommission,
                'earned_commission' => (float) $earnedCommission,
            ];
        });

        return response()->json(['data' => $agents]);
    }

    public function update(Request $request, Agent $agent): JsonResponse
    {
        $this->ensurePlatformAbility($request->user(), 'platform.agents.manage');

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email,'.$agent->user_id],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['required', 'boolean'],
        ]);

        $agent->user()->update([
            'name' => $payload['name'],
            'email' => strtolower($payload['email']),
        ]);

        $agent->update([
            'commission_rate' => $payload['commission_rate'],
            'is_active' => $payload['is_active'],
        ]);

        $agent = $agent->fresh()->load(['user:id,name,email', 'referrals']);
        $pendingCommission = $agent->referrals->where('commission_status', 'pending')->sum('commission_amount');
        $earnedCommission = $agent->referrals->where('commission_status', 'earned')->sum('commission_amount');

        return response()->json([
            'data' => [
                'id' => $agent->id,
                'name' => $agent->user?->name,
                'email' => $agent->user?->email,
                'referral_code' => $agent->referral_code,
                'commission_rate' => (float) $agent->commission_rate,
                'is_active' => $agent->is_active,
                'referrals_count' => $agent->referrals->count(),
                'pending_commission' => (float) $pendingCommission,
                'earned_commission' => (float) $earnedCommission,
            ],
        ]);
    }
}