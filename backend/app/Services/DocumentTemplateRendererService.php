<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Contact;
use App\Models\Document;
use App\Models\DocumentLine;
use App\Models\DocumentTemplate;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class DocumentTemplateRendererService
{
        private const DEFAULT_LOGO_SVG = <<<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" fill="none">
    <defs>
        <linearGradient id="g" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
            <stop stop-color="#1F7A53"/>
            <stop offset="1" stop-color="#0F5B41"/>
        </linearGradient>
    </defs>
    <rect x="10" y="10" width="98" height="98" rx="24" fill="url(#g)"/>
    <path d="M34 36h14v18h23V36h14v48H71V66H48v18H34V36Z" fill="#F7FBF8"/>
    <path d="M28 92c9.7-5.7 20.5-8.6 32.4-8.6 11.2 0 21.8 2.8 31.7 8.4" stroke="#D7EBDD" stroke-width="5" stroke-linecap="round"/>
    <path d="M141 44h12v31.5c0 9.2 4.9 14.2 14 14.2 9.1 0 13.9-5 13.9-14.2V44h12.1v31.8c0 15.4-9.8 24.3-26 24.3-16.3 0-26-8.9-26-24.3V44Z" fill="#112018"/>
    <path d="M223 99V44h22.2c18.4 0 30 10.3 30 27.5S263.6 99 245.2 99H223Z" fill="#112018"/>
    <path d="M235 88.6h9.6c11.2 0 18.1-6.2 18.1-17.1 0-10.7-6.9-16.9-18.1-16.9H235v34Z" fill="#F7FBF8"/>
</svg>
SVG;

    public function resolveTemplate(Company $company, ?Document $document = null, ?DocumentTemplate $overrideTemplate = null): ?DocumentTemplate
    {
        if ($overrideTemplate) {
            return $overrideTemplate->loadMissing('logoAsset');
        }

        if ($document?->template_id) {
            return DocumentTemplate::query()
                ->where('company_id', $company->id)
                ->with('logoAsset')
                ->find($document->template_id);
        }

        return DocumentTemplate::query()
            ->where('company_id', $company->id)
            ->where('is_default', true)
            ->where('is_active', true)
            ->with('logoAsset')
            ->first();
    }

    public function renderHtml(Company $company, Document $document, ?DocumentTemplate $overrideTemplate = null): string
    {
        $template = $this->resolveTemplate($company, $document, $overrideTemplate);

        return $this->buildHtml($company, $document, $template);
    }

    public function renderTemplatePreview(Company $company, DocumentTemplate $template, string $documentType = 'tax_invoice'): string
    {
        $document = new Document([
            'type' => $documentType,
            'status' => 'draft',
            'document_number' => strtoupper(Str::slug($documentType, '-')).'-PREVIEW',
            'title' => Str::headline(str_replace('_', ' ', $documentType)).' Preview',
            'currency_code' => $company->base_currency ?: 'SAR',
            'language_code' => $template->locale_mode === 'ar' ? 'ar' : 'en',
            'issue_date' => Carbon::parse('2026-04-13'),
            'due_date' => Carbon::parse('2026-04-20'),
            'subtotal' => 2500,
            'tax_total' => 375,
            'grand_total' => 2875,
            'taxable_total' => 2500,
            'balance_due' => 2875,
            'notes' => 'Preview the spacing, tax block, totals, and footer before assigning this template to live documents.',
            'custom_fields' => [
                'reference' => 'REF-2048',
                'purchase_order' => 'PO-8831',
                'project' => 'Warehouse rollout',
            ],
        ]);

        $document->setRelation('contact', new Contact([
            'display_name' => $documentType === 'vendor_bill' ? 'Red Dunes Supplies' : 'Northern Horizon Trading',
            'email' => $documentType === 'vendor_bill' ? 'ap@reddunes.sa' : 'finance@northernhorizon.sa',
        ]));

        $document->setRelation('lines', new Collection([
            new DocumentLine([
                'description' => 'Monthly advisory retainer',
                'quantity' => 1,
                'unit_price' => 1500,
                'gross_amount' => 1725,
                'tax_amount' => 225,
                'metadata' => ['custom_fields' => ['phase' => 'April']],
            ]),
            new DocumentLine([
                'description' => 'Branch rollout support',
                'quantity' => 2,
                'unit_price' => 500,
                'gross_amount' => 1150,
                'tax_amount' => 150,
                'metadata' => ['custom_fields' => ['project_stage' => 'Go live']],
            ]),
        ]));

        return $this->buildHtml($company, $document, $template);
    }

    private function buildHtml(Company $company, Document $document, ?DocumentTemplate $template): string
    {
        $settings = $template?->settings ?? [];
        $accentColor = $template?->accent_color ?? '#1f7a53';
        $logo = $template?->logoAsset?->public_url ?: $this->defaultLogoDataUri();
        $logoPosition = (string) ($settings['logo_position'] ?? 'left');
        $headerLayout = (string) ($settings['header_layout'] ?? 'split');
        $footerLayout = (string) ($settings['footer_layout'] ?? 'stacked');
        $showVatSection = filter_var($settings['show_vat_section'] ?? true, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
        $showTotals = filter_var($settings['show_totals'] ?? true, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
        $showVatSection = $showVatSection ?? true;
        $showTotals = $showTotals ?? true;
        $totalsStyle = (string) ($settings['totals_style'] ?? 'boxed');
        $defaultNote = (string) ($settings['default_note'] ?? '');

        $lines = $document->lines->map(function (DocumentLine $line): string {
            $lineCustomFields = collect($line->metadata['custom_fields'] ?? [])
                ->filter(fn ($value) => filled($value))
                ->map(fn ($value, $key) => '<span style="display:inline-block;margin:4px 8px 0 0;padding:2px 8px;border-radius:999px;background:#eef5f0;color:#295344;font-size:11px;">'.e(Str::headline(str_replace('_', ' ', (string) $key))).': '.e((string) $value).'</span>')
                ->implode('');

            return sprintf(
                '<tr><td style="padding:14px 12px;border-bottom:1px solid #e6ede6;"><div style="font-weight:600;color:#112018;">%s</div>%s</td><td style="padding:14px 12px;border-bottom:1px solid #e6ede6;text-align:right;">%s</td><td style="padding:14px 12px;border-bottom:1px solid #e6ede6;text-align:right;">%s</td><td style="padding:14px 12px;border-bottom:1px solid #e6ede6;text-align:right;">%s</td></tr>',
                e($line->description),
                $lineCustomFields ? '<div>'.$lineCustomFields.'</div>' : '',
                number_format((float) $line->quantity, 2),
                number_format((float) $line->unit_price, 2),
                number_format((float) $line->gross_amount, 2),
            );
        })->implode('');

        $customFieldRows = collect($document->custom_fields ?? [])
            ->filter(fn ($value) => filled($value))
            ->map(fn ($value, $key) => '<div style="display:flex;justify-content:space-between;gap:16px;padding:6px 0;border-bottom:1px solid #edf2ed;"><span style="color:#587064;">'.e(Str::headline(str_replace('_', ' ', (string) $key))).'</span><strong style="color:#112018;">'.e((string) $value).'</strong></div>')
            ->implode('');

        $purchaseContextRows = collect(($document->compliance_metadata['purchase_context'] ?? []))
            ->filter(fn ($value) => filled($value))
            ->map(fn ($value, $key) => '<div style="display:flex;justify-content:space-between;gap:16px;padding:6px 0;border-bottom:1px solid #edf2ed;"><span style="color:#587064;">'.e(Str::headline(str_replace('_', ' ', (string) $key))).'</span><strong style="color:#112018;">'.e((string) $value).'</strong></div>')
            ->implode('');

        $watermark = $template?->watermark_text
            ? '<div style="position:fixed;top:34%;left:10%;right:10%;text-align:center;font-size:82px;font-weight:700;color:rgba(0,0,0,.045);transform:rotate(-18deg);white-space:nowrap;pointer-events:none;">'.e($template->watermark_text).'</div>'
            : '';

        $headerAlignment = $headerLayout === 'stacked' ? 'display:block;' : 'display:flex;justify-content:space-between;align-items:flex-start;gap:24px;';
        $brandBlock = '<div style="'.($logoPosition === 'right' && $headerLayout !== 'stacked' ? 'order:2;text-align:right;' : '').'">'
            .($logo ? '<img src="'.e($logo).'" alt="Logo" style="max-height:64px;max-width:180px;display:block;'.($logoPosition === 'center' ? 'margin:0 auto 14px;' : 'margin-bottom:14px;').'" />' : '')
            .'<h1 style="margin:0;font-size:30px;line-height:1.15;color:#112018;">'.e($document->title ?: Str::headline(str_replace('_', ' ', $document->type))).'</h1>'
            .'<p style="margin:10px 0 0;font-size:15px;font-weight:600;color:#2a4338;">'.e($company->legal_name).'</p>'
            .'<p style="margin:6px 0 0;font-size:12px;color:#65786f;">Tax number: '.e($company->tax_number ?: 'Not set').'</p>'
            .'</div>';

        $metaBlock = '<div style="min-width:220px;'.($headerLayout === 'stacked' ? 'margin-top:18px;' : 'text-align:right;').'">'
            .'<div style="padding:14px 16px;border-radius:18px;background:#f4f8f1;border:1px solid #e2ebe2;">'
            .'<p style="margin:0;font-size:12px;color:#65786f;text-transform:uppercase;letter-spacing:.08em;">Document details</p>'
            .'<p style="margin:10px 0 0;"><strong>No.</strong> '.e($document->document_number ?: 'Draft').'</p>'
            .'<p style="margin:8px 0 0;"><strong>Date.</strong> '.e(optional($document->issue_date)?->toDateString() ?? '').'</p>'
            .'<p style="margin:8px 0 0;"><strong>Status.</strong> '.e(Str::headline($document->status)).'</p>'
            .'</div>'
            .'</div>';

        $headerBlocks = $headerLayout === 'stacked' ? $brandBlock.$metaBlock : ($logoPosition === 'right' ? $metaBlock.$brandBlock : $brandBlock.$metaBlock);

        $totalsContainerStyle = $totalsStyle === 'minimal'
            ? 'padding:0;border:none;background:transparent;'
            : 'padding:18px 20px;border:1px solid #dfe8df;border-radius:20px;background:#f7fbf8;';

        $footerContent = $template?->footer_html ? '<div>'.$template->footer_html.'</div>' : '';
        $footerWrapperStyle = $footerLayout === 'columns'
            ? 'display:flex;justify-content:space-between;gap:24px;align-items:flex-start;'
            : 'display:block;';

        return '<html><body style="margin:0;padding:0;background:#f1f5f1;font-family:DejaVu Sans,sans-serif;color:#112018;position:relative;">'
            .$watermark
            .'<div style="max-width:980px;margin:0 auto;padding:28px;">'
            .'<div style="background:#ffffff;border:1px solid #dde8de;border-radius:28px;box-shadow:0 28px 80px -54px rgba(17,32,24,0.28);overflow:hidden;">'
            .'<div style="height:10px;background:'.e($accentColor).';"></div>'
            .'<div style="padding:32px 34px 24px;">'
            .'<div style="'.$headerAlignment.'">'.$headerBlocks.'</div>'
            .($template?->header_html ? '<div style="margin-top:22px;padding:16px 18px;border-radius:18px;background:#f9fcfa;border:1px solid #e8efea;">'.$template->header_html.'</div>' : '')
            .'<div style="display:flex;gap:20px;margin-top:24px;align-items:stretch;">'
            .'<div style="flex:1;padding:18px 20px;border-radius:20px;background:#f7fbf8;border:1px solid #dfe8df;">'
            .'<p style="margin:0 0 10px;font-size:12px;color:'.e($accentColor).';text-transform:uppercase;letter-spacing:.08em;">'.e($document->type === 'vendor_bill' ? 'Supplier' : 'Customer').'</p>'
            .'<p style="margin:0;font-size:18px;font-weight:700;color:#112018;">'.e($document->contact?->display_name ?: 'No contact linked').'</p>'
            .'<p style="margin:8px 0 0;font-size:13px;color:#65786f;">'.e($document->contact?->email ?: 'No email on file').'</p>'
            .'</div>'
            .'<div style="flex:1;padding:18px 20px;border-radius:20px;background:#fffdf8;border:1px solid #f0e6d1;">'
            .'<p style="margin:0 0 10px;font-size:12px;color:#9b6a10;text-transform:uppercase;letter-spacing:.08em;">Document context</p>'
            .($customFieldRows ?: '<p style="margin:0;font-size:13px;color:#65786f;">No custom fields on this document.</p>')
            .($purchaseContextRows ? '<div style="margin-top:12px;">'.$purchaseContextRows.'</div>' : '')
            .'</div>'
            .'</div>'
            .'<div style="margin-top:28px;border:1px solid #e2ebe2;border-radius:24px;overflow:hidden;">'
            .'<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">'
            .'<thead><tr style="background:#f3f8f4;text-align:left;"><th style="padding:14px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#587064;">Description</th><th style="padding:14px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#587064;text-align:right;">Qty</th><th style="padding:14px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#587064;text-align:right;">Unit</th><th style="padding:14px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#587064;text-align:right;">Total</th></tr></thead>'
            .'<tbody>'.$lines.'</tbody>'
            .'</table>'
            .'</div>'
            .'<div style="display:flex;justify-content:space-between;gap:24px;margin-top:28px;align-items:flex-start;">'
            .'<div style="flex:1;">'
            .'<div style="padding:18px 20px;border-radius:20px;background:#fbfcfb;border:1px solid #e6ede6;font-size:13px;color:#52665c;line-height:1.7;">'
            .'<p style="margin:0;font-weight:700;color:#112018;">Notes</p>'
            .'<p style="margin:10px 0 0;">'.e($document->notes ?: $defaultNote ?: 'No internal notes attached to this document.').'</p>'
            .'</div>'
            .'</div>'
            .($showTotals ? '<div style="width:320px;'.$totalsContainerStyle.'">'
                .'<p style="display:flex;justify-content:space-between;margin:0 0 10px;"><span style="color:#65786f;">Subtotal</span><strong>'.number_format((float) $document->subtotal, 2).'</strong></p>'
                .($showVatSection ? '<p style="display:flex;justify-content:space-between;margin:0 0 10px;"><span style="color:#65786f;">Taxable amount</span><strong>'.number_format((float) $document->taxable_total, 2).'</strong></p>' : '')
                .($showVatSection ? '<p style="display:flex;justify-content:space-between;margin:0 0 10px;"><span style="color:#65786f;">VAT</span><strong>'.number_format((float) $document->tax_total, 2).'</strong></p>' : '')
                .'<p style="display:flex;justify-content:space-between;margin:0;padding-top:12px;border-top:1px solid #d7e4db;font-size:20px;"><span>Grand total</span><strong style="color:'.e($accentColor).';">'.number_format((float) $document->grand_total, 2).' '.e($document->currency_code).'</strong></p>'
                .'</div>' : '')
            .'</div>'
            .'<div style="margin-top:30px;padding-top:20px;border-top:1px solid #e6ede6;'.$footerWrapperStyle.'">'
            .'<div style="font-size:12px;color:#65786f;">'.($footerContent ?: 'Prepared in Gulf Hisab. Keep this document with your business records.').'</div>'
            .($showVatSection ? '<div style="font-size:12px;color:#65786f;'.($footerLayout === 'columns' ? 'text-align:right;min-width:220px;' : 'margin-top:12px;').'">VAT included where applicable. Review tax totals before filing.</div>' : '')
            .'</div>'
            .'</div>'
            .'</div>'
            .'</div>'
            .'</body></html>';
    }

    private function defaultLogoDataUri(): string
    {
        return 'data:image/svg+xml;base64,'.base64_encode(self::DEFAULT_LOGO_SVG);
    }
}