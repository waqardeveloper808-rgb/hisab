<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyAsset;
use App\Models\DocumentTemplate;
use App\Services\DocumentTemplateRendererService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentTemplateController extends Controller
{
    use ResolvesCompanyAccess;

    public function __construct(private readonly DocumentTemplateRendererService $renderer)
    {
    }

    public function index(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'company.settings.manage');

        return response()->json([
            'data' => DocumentTemplate::query()
                ->where('company_id', $company->id)
                ->with('logoAsset')
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'company.settings.manage');

        $template = DocumentTemplate::query()->create(array_merge(
            $this->validatePayload($request, $company),
            ['company_id' => $company->id],
        ));

        if ($template->is_default) {
            DocumentTemplate::query()->where('company_id', $company->id)->where('id', '!=', $template->id)->update(['is_default' => false]);
        }

        return response()->json(['data' => $template->load('logoAsset')], 201);
    }

    public function update(Request $request, Company $company, DocumentTemplate $template): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'company.settings.manage');
        abort_unless($template->company_id === $company->id, 404);

        $template->update($this->validatePayload($request, $company));

        if ($template->is_default) {
            DocumentTemplate::query()->where('company_id', $company->id)->where('id', '!=', $template->id)->update(['is_default' => false]);
        }

        return response()->json(['data' => $template->fresh()->load('logoAsset')]);
    }

    public function preview(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'company.settings.manage');

        $payload = $this->validatePayload($request, $company, null, false);
        $documentType = $request->validate([
            'document_type' => ['nullable', 'string', 'max:40'],
        ])['document_type'] ?? 'tax_invoice';

        $template = new DocumentTemplate($payload);
        $template->company_id = $company->id;

        if (! empty($payload['logo_asset_id'])) {
            $template->setRelation('logoAsset', CompanyAsset::query()->find($payload['logo_asset_id']));
        }

        return response()->json([
            'data' => [
                'html' => $this->renderer->renderTemplatePreview($company, $template, $documentType),
            ],
        ]);
    }

    private function validatePayload(Request $request, Company $company, ?int $templateId = null, bool $requireFlags = true): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'document_types' => ['nullable', 'array'],
            'document_types.*' => ['string', 'max:40'],
            'locale_mode' => ['required', 'in:en,ar,bilingual,english,arabic'],
            'accent_color' => ['required', 'string', 'max:20'],
            'watermark_text' => ['nullable', 'string', 'max:120'],
            'header_html' => ['nullable', 'string'],
            'footer_html' => ['nullable', 'string'],
            'settings' => ['nullable', 'array'],
            'logo_asset_id' => ['nullable', 'integer'],
        ];

        if ($requireFlags) {
            $rules['is_default'] = ['required', 'boolean'];
            $rules['is_active'] = ['required', 'boolean'];
        } else {
            $rules['is_default'] = ['nullable', 'boolean'];
            $rules['is_active'] = ['nullable', 'boolean'];
        }

        $payload = $request->validate($rules);

        $payload['locale_mode'] = match ($payload['locale_mode']) {
            'english' => 'en',
            'arabic' => 'ar',
            default => $payload['locale_mode'],
        };

        if (! array_key_exists('is_default', $payload)) {
            $payload['is_default'] = false;
        }

        if (! array_key_exists('is_active', $payload)) {
            $payload['is_active'] = true;
        }

        if (! empty($payload['logo_asset_id'])) {
            CompanyAsset::query()->where('company_id', $company->id)->findOrFail($payload['logo_asset_id']);
        }

        return $payload;
    }
}