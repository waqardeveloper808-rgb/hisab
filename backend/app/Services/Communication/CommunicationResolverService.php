<?php

namespace App\Services\Communication;

use App\Models\CommunicationTemplate;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Document;
use App\Services\DocumentTemplateRendererService;

class CommunicationResolverService
{
    public function __construct(
        private readonly DocumentTemplateRendererService $renderer,
    ) {
    }

    public function resolveRecipient(?Contact $contact, array $payload): array
    {
        return [
            'address' => $payload['email'] ?? $contact?->email,
            'name' => $contact?->display_name,
        ];
    }

    public function resolveTemplate(Company $company, string $channel, ?string $sourceType, array $payload): ?CommunicationTemplate
    {
        if (! empty($payload['template_id'])) {
            return CommunicationTemplate::query()
                ->where(function ($query) use ($company): void {
                    $query->where('company_id', $company->id)->orWhereNull('company_id');
                })
                ->findOrFail($payload['template_id']);
        }

        return CommunicationTemplate::query()
            ->where('channel', $channel)
            ->where('is_active', true)
            ->where(function ($query) use ($company): void {
                $query->where('company_id', $company->id)->orWhereNull('company_id');
            })
            ->where(function ($query) use ($sourceType): void {
                $query->where('source_type', $sourceType)->orWhereNull('source_type');
            })
            ->orderByDesc('company_id')
            ->orderByDesc('is_default')
            ->orderBy('id')
            ->first();
    }

    public function resolveDocumentContent(Company $company, Document $document, array $payload, ?CommunicationTemplate $template): array
    {
        $document->loadMissing(['lines', 'contact', 'template.logoAsset']);
        $subject = $payload['subject'] ?? ($document->document_number ?: 'Document from Gulf Hisab');
        $html = $this->renderer->renderHtml($company, $document);
        $text = trim(strip_tags(str_replace(['<br>', '<br/>', '<br />'], PHP_EOL, $html)));

        if ($template) {
            $variables = $this->documentVariables($company, $document);
            $subject = $this->applyVariables($template->subject_template ?: $subject, $variables);
            $html = $template->body_html_template
                ? $this->applyVariables($template->body_html_template, $variables)
                : $html;
            $text = $template->body_text_template
                ? $this->applyVariables($template->body_text_template, $variables)
                : $text;
        }

        return [
            'subject' => $subject,
            'body_html' => $html,
            'body_text' => $text,
        ];
    }

    public function resolveGenericContent(array $payload, ?CommunicationTemplate $template): array
    {
        $variables = is_array($payload['variables'] ?? null) ? $payload['variables'] : [];
        $subject = (string) ($payload['subject'] ?? $template?->subject_template ?? 'Communication from Gulf Hisab');
        $bodyHtml = (string) ($payload['body_html'] ?? $template?->body_html_template ?? '');
        $bodyText = (string) ($payload['body_text'] ?? $template?->body_text_template ?? strip_tags($bodyHtml));

        return [
            'subject' => $this->applyVariables($subject, $variables),
            'body_html' => $this->applyVariables($bodyHtml, $variables),
            'body_text' => $this->applyVariables($bodyText, $variables),
        ];
    }

    private function documentVariables(Company $company, Document $document): array
    {
        return [
            'company_name' => $company->trade_name ?: $company->legal_name,
            'document_number' => $document->document_number ?: 'Document '.$document->id,
            'document_type' => $document->type,
            'contact_name' => $document->contact?->display_name ?? 'Customer',
            'grand_total' => number_format((float) $document->grand_total, 2, '.', ''),
            'due_date' => $document->due_date?->toDateString() ?? '',
        ];
    }

    private function applyVariables(string $content, array $variables): string
    {
        $replacements = [];
        foreach ($variables as $key => $value) {
            $replacements['{{'.$key.'}}'] = (string) $value;
        }

        return strtr($content, $replacements);
    }
}