<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CostCenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CostCenterController extends Controller
{
    use ResolvesCompanyAccess;

    public function index(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.purchases.manage');

        $payload = $request->validate([
            'active' => ['nullable', 'boolean'],
        ]);

        $query = CostCenter::query()
            ->where('company_id', $company->id)
            ->orderBy('name');

        if (array_key_exists('active', $payload)) {
            $query->where('is_active', (bool) $payload['active']);
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function store(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.purchases.manage');

        $costCenter = CostCenter::query()->create([
            ...$this->validatePayload($request, $company),
            'company_id' => $company->id,
        ]);

        return response()->json(['data' => $costCenter], 201);
    }

    public function update(Request $request, Company $company, CostCenter $costCenter): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.purchases.manage');

        if ($costCenter->company_id !== $company->id) {
            abort(404);
        }

        $costCenter->update($this->validatePayload($request, $company, $costCenter->id));

        return response()->json(['data' => $costCenter->fresh()]);
    }

    private function validatePayload(Request $request, Company $company, ?int $costCenterId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:40',
                Rule::unique('cost_centers', 'code')
                    ->where(fn ($query) => $query->where('company_id', $company->id))
                    ->ignore($costCenterId),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}