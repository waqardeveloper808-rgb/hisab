<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CompanyProvisioningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanySetupController extends Controller
{
    public function __construct(private readonly CompanyProvisioningService $provisioningService)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'legal_name' => ['required', 'string', 'max:255'],
            'trade_name' => ['nullable', 'string', 'max:255'],
            'tax_number' => ['nullable', 'string', 'max:32'],
            'registration_number' => ['nullable', 'string', 'max:64'],
            'base_currency' => ['nullable', 'string', 'size:3'],
            'locale' => ['nullable', 'string', 'max:10'],
            'timezone' => ['nullable', 'string', 'max:100'],
            'branch_name' => ['nullable', 'string', 'max:255'],
            'branch_city' => ['nullable', 'string', 'max:120'],
        ]);

        $company = $this->provisioningService->provision($request->user(), $payload);

        return response()->json([
            'data' => $company,
        ], 201);
    }
}