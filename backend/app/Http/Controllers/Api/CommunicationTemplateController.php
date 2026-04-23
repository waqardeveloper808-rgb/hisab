<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\CommunicationTemplate;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunicationTemplateController extends Controller
{
    use ResolvesCompanyAccess;

    public function index(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAccess($request->user(), $company);

        return response()->json([
            'data' => CommunicationTemplate::query()
                ->where(function ($query) use ($company): void {
                    $query->where('company_id', $company->id)->orWhereNull('company_id');
                })
                ->where('is_active', true)
                ->orderByDesc('company_id')
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAccess($request->user(), $company);
        $payload = $this->validatePayload($request);

        $template = CommunicationTemplate::query()->create(array_merge($payload, [
            'company_id' => $company->id,
            'is_system' => false,
        ]));

        return response()->json(['data' => $template], 201);
    }

    public function update(Request $request, Company $company, CommunicationTemplate $template): JsonResponse
    {
        $this->ensureCompanyAccess($request->user(), $company);
        abort_unless($template->company_id === null || $template->company_id === $company->id, 404);

        $template->update($this->validatePayload($request, true));

        return response()->json(['data' => $template->fresh()]);
    }

    private function validatePayload(Request $request, bool $isUpdate = false): array
    {
        return $request->validate([
            'code' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:120'],
            'name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
            'channel' => [$isUpdate ? 'sometimes' : 'required', 'in:email,in_app'],
            'source_type' => ['nullable', 'string', 'max:60'],
            'subject_template' => ['nullable', 'string', 'max:255'],
            'body_html_template' => ['nullable', 'string'],
            'body_text_template' => ['nullable', 'string'],
            'variables' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}