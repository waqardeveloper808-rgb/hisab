<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Document;
use App\Models\DocumentTemplate;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class TemplateEngineRuntimeService
{
    private const RUNTIME_STATE_PATH = 'template-engine-runtime.json';

    private const DEFAULT_SECTIONS = ['header', 'title', 'document-info', 'delivery', 'customer', 'items', 'totals', 'notes', 'footer'];

    private const DEFAULT_FIELDS = [
        'document_number',
        'issue_date',
        'due_date',
        'contact',
        'lines',
        'subtotal',
        'tax_total',
        'grand_total',
        'notes',
        'logo_asset_id',
        'accent_color',
        'watermark_text',
    ];

    public function listTemplates(Company $company): EloquentCollection
    {
        return DocumentTemplate::query()
            ->where('company_id', $company->id)
            ->with('logoAsset')
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get();
    }

    public function getTemplateById(Company $company, int $templateId): DocumentTemplate
    {
        return DocumentTemplate::query()
            ->where('company_id', $company->id)
            ->with('logoAsset')
            ->findOrFail($templateId);
    }

    public function createTemplate(Company $company, array $payload): DocumentTemplate
    {
        $template = DocumentTemplate::query()->create(array_merge(
            $this->normalizeTemplatePayload($payload),
            ['company_id' => $company->id],
        ));

        if ($template->is_default) {
            DocumentTemplate::query()
                ->where('company_id', $company->id)
                ->where('id', '!=', $template->id)
                ->update(['is_default' => false]);
        }

        $this->refreshCompanyRuntime($company);

        return $template->fresh()->load('logoAsset');
    }

    public function updateTemplate(Company $company, DocumentTemplate $template, array $payload): DocumentTemplate
    {
        $template->update($this->normalizeTemplatePayload($payload));

        if ($template->is_default) {
            DocumentTemplate::query()
                ->where('company_id', $company->id)
                ->where('id', '!=', $template->id)
                ->update(['is_default' => false]);
        }

        $this->refreshCompanyRuntime($company);

        return $template->fresh()->load('logoAsset');
    }

    public function requireTemplate(Company $company, ?int $templateId, string $documentType): DocumentTemplate
    {
        $templates = $company->documentTemplates()
            ->where('is_active', true)
            ->with('logoAsset')
            ->orderByDesc('is_default')
            ->orderBy('id')
            ->get();

        if ($templates->isEmpty()) {
            throw ValidationException::withMessages([
                'template_id' => 'No active document templates are configured for this company.',
            ]);
        }

        $template = $templateId
            ? $templates->firstWhere('id', $templateId)
            : $templates->first(function (DocumentTemplate $candidate) use ($documentType): bool {
                $documentTypes = collect($candidate->document_types ?? []);

                return $documentTypes->isEmpty() || $documentTypes->contains($documentType);
            });

        if (! $template) {
            throw ValidationException::withMessages([
                'template_id' => 'The selected template does not exist for this company.',
            ]);
        }

        $documentTypes = collect($template->document_types ?? []);
        if ($documentTypes->isNotEmpty() && ! $documentTypes->contains($documentType)) {
            throw ValidationException::withMessages([
                'template_id' => 'The selected template does not support this document type.',
            ]);
        }

        return $template;
    }

    public function backfillDocumentsWithoutTemplate(Company $company): int
    {
        $templates = $company->documentTemplates()
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('id')
            ->get();

        if ($templates->isEmpty()) {
            return 0;
        }

        $updated = 0;
        $documents = $company->documents()->whereNull('template_id')->get();
        foreach ($documents as $document) {
            $template = $templates->first(function (DocumentTemplate $candidate) use ($document): bool {
                $documentTypes = collect($candidate->document_types ?? []);

                return $documentTypes->isEmpty() || $documentTypes->contains((string) $document->type);
            }) ?? $templates->first();

            if (! $template) {
                continue;
            }

            $document->forceFill(['template_id' => $template->id])->save();
            $updated++;
        }

        $this->refreshCompanyRuntime($company);

        return $updated;
    }

    public function recordRender(Company $company, DocumentTemplate $template, ?Document $document, bool $success, string $channel = 'render'): array
    {
        $template->forceFill([
            'render_count' => (int) $template->render_count + 1,
            'render_success_count' => (int) $template->render_success_count + ($success ? 1 : 0),
            'last_rendered_at' => now(),
        ])->save();

        return $this->refreshCompanyRuntime($company, [
            'renderSuccess' => $success,
            'lastRenderChannel' => $channel,
            'lastRenderedTemplateId' => $template->id,
            'lastRenderedDocumentId' => $document?->id,
        ]);
    }

    public function refreshCompanyRuntime(Company $company, array $overrides = []): array
    {
        $state = $this->readRuntimeState();
        $templates = $company->documentTemplates()->with('logoAsset')->orderBy('id')->get();
        $documents = $company->documents()
            ->whereNotNull('template_id')
            ->orderByDesc('id')
            ->get(['id', 'template_id', 'document_number', 'type', 'company_id', 'status']);

        $existing = collect($state['companies'] ?? [])->firstWhere('company_id', $company->id) ?? [];
        $templateRenderCount = (int) ($templates->sum('render_count'));
        $successfulRenderCount = (int) ($templates->sum('render_success_count'));

        $companySummary = [
            'company_id' => $company->id,
            'templateCount' => $templates->count(),
            'templatesExist' => $templates->isNotEmpty(),
            'templateUsageCount' => $documents->count(),
            'linkedDocumentsCount' => $documents->count(),
            'templateRenderCount' => $templateRenderCount,
            'successfulRenderCount' => $successfulRenderCount,
            'lastRenderedAt' => $overrides['lastRenderedAt'] ?? $existing['lastRenderedAt'] ?? optional($templates->sortByDesc('last_rendered_at')->first()?->last_rendered_at)?->toISOString(),
            'renderSuccess' => (bool) ($overrides['renderSuccess'] ?? $existing['renderSuccess'] ?? ($templateRenderCount > 0 && $successfulRenderCount === $templateRenderCount)),
            'renderSuccessRate' => $templateRenderCount > 0 ? round($successfulRenderCount / $templateRenderCount, 4) : 0,
            'assetAssignmentCapableCount' => $templates->filter(fn (DocumentTemplate $template) => in_array('logo_asset_id', $template->fields ?? [], true))->count(),
            'sectionOrderCapableCount' => $templates->filter(fn (DocumentTemplate $template) => count($template->sections ?? []) > 0)->count(),
            'familyDiversityCount' => $templates->pluck('layout')->filter()->unique()->count(),
            'templateLinkedDocuments' => $documents->take(50)->map(fn (Document $document) => [
                'document_id' => $document->id,
                'template_id' => $document->template_id,
                'document_number' => $document->document_number,
                'type' => $document->type,
                'status' => $document->status,
                'company_id' => $document->company_id,
            ])->values()->all(),
            'templates' => $templates->map(fn (DocumentTemplate $template) => [
                'id' => $template->id,
                'company_id' => $template->company_id,
                'name' => $template->name,
                'layout' => $template->layout,
                'sections' => $template->sections ?? [],
                'fields' => $template->fields ?? [],
                'document_types' => $template->document_types ?? [],
                'locale_mode' => $template->locale_mode,
                'accent_color' => $template->accent_color,
                'logo_asset_id' => $template->logo_asset_id,
                'has_asset_assignment' => in_array('logo_asset_id', $template->fields ?? [], true),
                'is_default' => (bool) $template->is_default,
                'is_active' => (bool) $template->is_active,
                'render_count' => (int) $template->render_count,
                'render_success_count' => (int) $template->render_success_count,
                'last_rendered_at' => optional($template->last_rendered_at)?->toISOString(),
            ])->values()->all(),
            'lastRenderChannel' => $overrides['lastRenderChannel'] ?? $existing['lastRenderChannel'] ?? null,
            'lastRenderedTemplateId' => $overrides['lastRenderedTemplateId'] ?? $existing['lastRenderedTemplateId'] ?? null,
            'lastRenderedDocumentId' => $overrides['lastRenderedDocumentId'] ?? $existing['lastRenderedDocumentId'] ?? null,
        ];

        $companies = collect($state['companies'] ?? [])
            ->reject(fn (array $entry) => (int) ($entry['company_id'] ?? 0) === $company->id)
            ->push($companySummary)
            ->sortBy('company_id')
            ->values();

        $merged = [
            'updated_at' => now()->toISOString(),
            'templateUsageCount' => $companies->sum('templateUsageCount'),
            'templateRenderCount' => $companies->sum('templateRenderCount'),
            'successfulRenderCount' => $companies->sum('successfulRenderCount'),
            'lastRenderedAt' => $companies->pluck('lastRenderedAt')->filter()->sortDesc()->first(),
            'renderSuccess' => $companies->sum('templateRenderCount') > 0
                ? $companies->sum('successfulRenderCount') === $companies->sum('templateRenderCount')
                : false,
            'renderSuccessRate' => $companies->sum('templateRenderCount') > 0
                ? round($companies->sum('successfulRenderCount') / $companies->sum('templateRenderCount'), 4)
                : 0,
            'templatesExist' => $companies->sum('templateCount') > 0,
            'linkedDocumentsCount' => $companies->sum('linkedDocumentsCount'),
            'familyDiversityCount' => $companies->flatMap(fn (array $entry) => collect($entry['templates'] ?? [])->pluck('layout'))->filter()->unique()->count(),
            'templateLinkedDocuments' => $companies->flatMap(fn (array $entry) => $entry['templateLinkedDocuments'] ?? [])->take(100)->values()->all(),
            'templates' => $companies->flatMap(fn (array $entry) => $entry['templates'] ?? [])->values()->all(),
            'companies' => $companies->all(),
        ];

        Storage::disk('local')->put(self::RUNTIME_STATE_PATH, json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        return $merged;
    }

    private function readRuntimeState(): array
    {
        if (! Storage::disk('local')->exists(self::RUNTIME_STATE_PATH)) {
            return [
                'updated_at' => null,
                'templateUsageCount' => 0,
                'templateRenderCount' => 0,
                'successfulRenderCount' => 0,
                'lastRenderedAt' => null,
                'renderSuccess' => false,
                'renderSuccessRate' => 0,
                'templatesExist' => false,
                'linkedDocumentsCount' => 0,
                'familyDiversityCount' => 0,
                'templateLinkedDocuments' => [],
                'templates' => [],
                'companies' => [],
            ];
        }

        $decoded = json_decode((string) Storage::disk('local')->get(self::RUNTIME_STATE_PATH), true);

        return is_array($decoded) ? $decoded : [];
    }

    private function normalizeTemplatePayload(array $payload): array
    {
        $settings = is_array($payload['settings'] ?? null) ? $payload['settings'] : [];
        $sections = is_array($payload['sections'] ?? null) && ($payload['sections'] ?? []) !== []
            ? array_values(array_unique(array_map('strval', $payload['sections'])))
            : $this->deriveSections($settings);

        $fields = is_array($payload['fields'] ?? null) && ($payload['fields'] ?? []) !== []
            ? array_values(array_unique(array_map('strval', $payload['fields'])))
            : self::DEFAULT_FIELDS;

        $layout = (string) ($payload['layout'] ?? $settings['layout'] ?? 'classic_corporate');

        return array_merge($payload, [
            'layout' => $layout,
            'sections' => $sections,
            'fields' => $fields,
            'settings' => array_merge($settings, [
                'layout' => $layout,
                'section_order' => implode(',', $sections),
            ]),
            'document_types' => array_values(array_unique(array_filter($payload['document_types'] ?? []))),
        ]);
    }

    private function deriveSections(array $settings): array
    {
        $configured = collect(explode(',', (string) ($settings['section_order'] ?? implode(',', self::DEFAULT_SECTIONS))))
            ->map(fn (string $value) => trim($value))
            ->filter()
            ->values()
            ->all();

        return $configured !== [] ? $configured : self::DEFAULT_SECTIONS;
    }
}