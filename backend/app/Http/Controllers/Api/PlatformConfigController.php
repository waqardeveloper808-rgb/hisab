<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\ProductSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformConfigController extends Controller
{
    use ResolvesCompanyAccess;

    public function show(Request $request): JsonResponse
    {
        $this->ensurePlatformAbility($request->user(), 'platform.plans.view');

        return response()->json([
            'data' => ProductSetting::current(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $this->ensurePlatformAbility($request->user(), 'platform.plans.manage');

        $payload = $request->validate([
            'support_display_name' => ['required', 'string', 'max:255'],
            'support_whatsapp_number' => ['required', 'string', 'max:32'],
            'support_email' => ['required', 'email:rfc', 'max:255'],
            'free_trial_days' => ['required', 'integer', 'min:0', 'max:365'],
            'free_invoice_limit' => ['required', 'integer', 'min:0', 'max:100000'],
            'paid_plan_monthly_price_sar' => ['required', 'numeric', 'min:0'],
            'default_agent_commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $settings = ProductSetting::current();
        $settings->update($payload);

        return response()->json([
            'data' => $settings->fresh(),
        ]);
    }
}