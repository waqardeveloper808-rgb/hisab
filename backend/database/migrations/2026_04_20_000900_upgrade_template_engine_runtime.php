<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
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

    public function up(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $table->string('layout', 80)->default('classic_corporate')->after('name');
            $table->json('sections')->nullable()->after('layout');
            $table->json('fields')->nullable()->after('sections');
            $table->unsignedInteger('render_count')->default(0)->after('is_active');
            $table->unsignedInteger('render_success_count')->default(0)->after('render_count');
            $table->timestamp('last_rendered_at')->nullable()->after('render_success_count');
        });

        $templates = DB::table('document_templates')->get();
        foreach ($templates as $template) {
            $settings = json_decode((string) ($template->settings ?? '{}'), true);
            $sections = collect(explode(',', (string) ($settings['section_order'] ?? implode(',', self::DEFAULT_SECTIONS))))
                ->map(fn (string $value) => trim($value))
                ->filter()
                ->values()
                ->all();

            DB::table('document_templates')
                ->where('id', $template->id)
                ->update([
                    'layout' => (string) ($settings['layout'] ?? 'classic_corporate'),
                    'sections' => json_encode($sections !== [] ? $sections : self::DEFAULT_SECTIONS, JSON_UNESCAPED_SLASHES),
                    'fields' => json_encode(self::DEFAULT_FIELDS, JSON_UNESCAPED_SLASHES),
                ]);
        }

        $companyIds = DB::table('companies')->pluck('id');
        foreach ($companyIds as $companyId) {
            $templates = DB::table('document_templates')
                ->where('company_id', $companyId)
                ->where('is_active', true)
                ->orderByDesc('is_default')
                ->orderBy('id')
                ->get();

            if ($templates->isEmpty()) {
                continue;
            }

            $documents = DB::table('documents')
                ->where('company_id', $companyId)
                ->whereNull('template_id')
                ->get(['id', 'type']);

            foreach ($documents as $document) {
                $template = $templates->first(function ($candidate) use ($document) {
                    $documentTypes = json_decode((string) ($candidate->document_types ?? '[]'), true);

                    return ! is_array($documentTypes) || $documentTypes === [] || in_array($document->type, $documentTypes, true);
                }) ?? $templates->first();

                if (! $template) {
                    continue;
                }

                DB::table('documents')
                    ->where('id', $document->id)
                    ->update(['template_id' => $template->id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $table->dropColumn(['layout', 'sections', 'fields', 'render_count', 'render_success_count', 'last_rendered_at']);
        });
    }
};