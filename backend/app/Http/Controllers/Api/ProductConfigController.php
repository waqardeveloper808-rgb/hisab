<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductSetting;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;

class ProductConfigController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = ProductSetting::current();
        SubscriptionPlan::ensureDefaults();

        return response()->json([
            'data' => [
                'support_display_name' => $settings->support_display_name,
                'support_whatsapp_number' => $settings->support_whatsapp_number,
                'support_email' => $settings->support_email,
                'free_trial_days' => $settings->free_trial_days,
                'free_invoice_limit' => $settings->free_invoice_limit,
                'paid_plan_monthly_price_sar' => (float) $settings->paid_plan_monthly_price_sar,
                'default_agent_commission_rate' => (float) $settings->default_agent_commission_rate,
                'plans' => SubscriptionPlan::query()
                    ->where('is_visible', true)
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->get()
                    ->map(fn (SubscriptionPlan $plan) => [
                        'code' => $plan->code,
                        'name' => $plan->name,
                        'description' => $plan->description,
                        'monthly_price_sar' => (float) $plan->monthly_price_sar,
                        'annual_price_sar' => $plan->annual_price_sar === null ? null : (float) $plan->annual_price_sar,
                        'trial_days' => $plan->trial_days,
                        'invoice_limit' => $plan->invoice_limit,
                        'customer_limit' => $plan->customer_limit,
                        'accountant_seat_limit' => $plan->accountant_seat_limit,
                        'feature_flags' => $plan->feature_flags ?? [],
                        'marketing_points' => $plan->marketing_points ?? [],
                        'is_free' => $plan->is_free,
                        'is_paid' => $plan->is_paid,
                    ])->values(),
            ],
        ]);
    }
}