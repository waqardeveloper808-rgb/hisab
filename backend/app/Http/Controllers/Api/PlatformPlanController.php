<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformPlanController extends Controller
{
    use ResolvesCompanyAccess;

    public function index(Request $request): JsonResponse
    {
        $this->ensurePlatformAbility($request->user(), 'platform.plans.view');

        SubscriptionPlan::ensureDefaults();

        return response()->json([
            'data' => SubscriptionPlan::query()->orderBy('sort_order')->orderBy('id')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensurePlatformAbility($request->user(), 'platform.plans.manage');

        $plan = SubscriptionPlan::query()->create($this->validatePayload($request));

        return response()->json(['data' => $plan], 201);
    }

    public function update(Request $request, SubscriptionPlan $plan): JsonResponse
    {
        $this->ensurePlatformAbility($request->user(), 'platform.plans.manage');

        $plan->update($this->validatePayload($request, $plan->id));

        return response()->json(['data' => $plan->fresh()]);
    }

    private function validatePayload(Request $request, ?int $planId = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:40', 'unique:subscription_plans,code,'.($planId ?? 'NULL').',id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'monthly_price_sar' => ['required', 'numeric', 'min:0'],
            'annual_price_sar' => ['nullable', 'numeric', 'min:0'],
            'trial_days' => ['required', 'integer', 'min:0', 'max:365'],
            'invoice_limit' => ['nullable', 'integer', 'min:0'],
            'customer_limit' => ['nullable', 'integer', 'min:0'],
            'accountant_seat_limit' => ['nullable', 'integer', 'min:0'],
            'feature_flags' => ['nullable', 'array'],
            'marketing_points' => ['nullable', 'array'],
            'marketing_points.*' => ['string', 'max:255'],
            'is_visible' => ['required', 'boolean'],
            'is_free' => ['required', 'boolean'],
            'is_paid' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }
}