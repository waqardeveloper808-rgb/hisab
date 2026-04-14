<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CustomFieldDefinition;
use App\Services\PlanLimitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CustomFieldDefinitionController extends Controller
{
    use ResolvesCompanyAccess;

    public function __construct(private readonly PlanLimitService $planLimitService)
    {
    }

    public function index(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'company.settings.manage');

        return response()->json([
            'data' => CustomFieldDefinition::query()->where('company_id', $company->id)->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'company.settings.manage');
        $this->planLimitService->ensureCustomFieldLimit($company);

        $field = CustomFieldDefinition::query()->create(array_merge(
            $this->validatePayload($request, $company),
            ['company_id' => $company->id],
        ));

        return response()->json(['data' => $field], 201);
    }

    public function update(Request $request, Company $company, CustomFieldDefinition $customField): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'company.settings.manage');
        abort_unless($customField->company_id === $company->id, 404);

        $customField->update($this->validatePayload($request, $company, $customField->id));

        return response()->json(['data' => $customField->fresh()]);
    }

    private function validatePayload(Request $request, Company $company, ?int $fieldId = null): array
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:80'],
            'field_type' => ['required', 'in:text,number,date,boolean,select'],
            'placement' => ['required', 'in:document,line'],
            'applies_to' => ['nullable', 'array'],
            'applies_to.*' => ['string', 'max:40'],
            'options' => ['nullable', 'array'],
            'is_active' => ['required', 'boolean'],
        ]);

        $payload['slug'] = Str::slug($payload['slug'] ?: $payload['name'], '_');

        abort_if(
            CustomFieldDefinition::query()
                ->where('company_id', $company->id)
                ->where('slug', $payload['slug'])
                ->when($fieldId, fn ($builder) => $builder->where('id', '!=', $fieldId))
                ->exists(),
            422,
            'A custom field with this slug already exists.'
        );

        return $payload;
    }
}