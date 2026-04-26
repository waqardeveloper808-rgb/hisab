<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanyAsset;
use App\Models\Contact;
use App\Models\Document;
use App\Models\DocumentLine;
use App\Models\DocumentTemplate;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DocumentTemplateRendererService
{
    private const CANONICAL_SECTIONS = ['header', 'title', 'document-info', 'delivery', 'customer', 'items', 'totals', 'notes', 'footer'];
    private const DOCUMENT_FONT_STACK = "'Segoe UI','Noto Naskh Arabic',Tahoma,Arial,sans-serif";
    private const ARABIC_FONT_STACK = "'Noto Naskh Arabic',Tahoma,Arial,sans-serif";
    private const SPACE_4 = 4;
    private const SPACE_8 = 8;
    private const SPACE_12 = 12;
    private const SPACE_16 = 16;
    private const SPACE_24 = 24;

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

    private const TEMPLATE_FAMILY_CLASSIC = 'classic_corporate';
    private const TEMPLATE_FAMILY_MODERN = 'modern_carded';
    private const TEMPLATE_FAMILY_INDUSTRIAL = 'industrial_supply';

    private const DOCUMENT_TITLE_MAP = [
        'quotation' => ['Quotation', 'عرض سعر'],
        'proforma_invoice' => ['Proforma Invoice', 'فاتورة مبدئية'],
        'delivery_note' => ['Delivery Note', 'إشعار تسليم'],
        'tax_invoice' => ['Tax Invoice', 'فاتورة ضريبية'],
        'credit_note' => ['Credit Note', 'إشعار دائن'],
        'debit_note' => ['Debit Note', 'إشعار مدين'],
        'cash_invoice' => ['Cash Invoice', 'فاتورة نقدية'],
        'api_invoice' => ['API Invoice', 'فاتورة نظامية'],
        'recurring_invoice' => ['Recurring Invoice', 'فاتورة دورية'],
        'vendor_bill' => ['Vendor Bill', 'فاتورة مورد'],
        'purchase_invoice' => ['Purchase Invoice', 'فاتورة شراء'],
        'purchase_order' => ['Purchase Order', 'أمر شراء'],
        'purchase_credit_note' => ['Purchase Credit Note', 'إشعار دائن للمشتريات'],
    ];

    public function __construct(private readonly TemplateEngineRuntimeService $templateEngineRuntime)
    {
    }

    public function renderHtml(Company $company, Document $document, ?DocumentTemplate $overrideTemplate = null): string
    {
        $template = $overrideTemplate?->loadMissing('logoAsset');

        if (! $template && $document->template_id) {
            $template = DocumentTemplate::query()
                ->where('company_id', $company->id)
                ->with('logoAsset')
                ->find($document->template_id);
        }

        if (! $template) {
            throw ValidationException::withMessages([
                'template_id' => 'This document cannot be rendered until it is linked to an active template.',
            ]);
        }

        $html = $this->buildHtml($company, $document, $template);
        $this->templateEngineRuntime->recordRender($company, $template, $document, true, 'document-render');

        return $html;
    }

    public function renderTemplatePreview(Company $company, DocumentTemplate $template, string $documentType = 'tax_invoice'): string
    {
        $document = new Document([
            'type' => $documentType,
            'status' => 'draft',
            'document_number' => strtoupper(Str::slug($documentType, '-')).'-PREVIEW',
            'title' => Str::headline(str_replace('_', ' ', $documentType)),
            'currency_code' => $company->base_currency ?: 'SAR',
            'language_code' => $template->locale_mode === 'ar' ? 'ar' : 'en',
            'issue_date' => Carbon::parse('2026-04-13'),
            'due_date' => Carbon::parse('2026-04-20'),
            'subtotal' => 1_000_000,
            'tax_total' => 150_000,
            'grand_total' => 1_150_000,
            'taxable_total' => 1_000_000,
            'balance_due' => 1_150_000,
            'notes' => '',
            'custom_fields' => [
                'reference' => 'INV-2026-1101',
                'order_number' => 'PO-2026-4108',
                'project' => 'Jeddah retail finance rollout',
                'seller_name_en' => 'Al Noor Trading LLC',
                'seller_name_ar' => 'شركة النور التجارية ذ.م.م',
                'seller_address_en' => 'Building 1234, King Abdulaziz Road, Al Olaya, Riyadh 12211, Additional No. 5678, Saudi Arabia',
                'seller_address_ar' => 'مبنى 1234، طريق الملك عبدالعزيز، حي العليا، الرياض 12211، الرقم الإضافي 5678، المملكة العربية السعودية',
                'seller_vat_number' => '300123456700003',
                'seller_cr_number' => '1010123456',
                'seller_email' => 'finance@alnoor.com',
                'seller_phone' => '+966500000101',
                'buyer_name_en' => 'Desert Retail Co.',
                'buyer_name_ar' => 'شركة صحراء للتجزئة',
                'buyer_address_en' => 'Prince Sultan Street, Al Zahra, Jeddah 23425, Saudi Arabia',
                'buyer_address_ar' => 'شارع الأمير سلطان، حي الزهراء، جدة 23425، المملكة العربية السعودية',
                'buyer_vat_number' => '301112223330003',
                'buyer_cr_number' => '4030187654',
                'buyer_postal_code' => '23425',
                'buyer_district' => 'Al Zahra',
                'buyer_country' => 'Saudi Arabia',
            ],
        ]);

        $document->setRelation('contact', new Contact([
            'display_name' => $documentType === 'vendor_bill' ? 'Red Dunes Supplies' : 'Desert Retail Co.',
            'display_name_ar' => $documentType === 'vendor_bill' ? 'مؤسسة الكثبان الحمراء للتوريد' : 'شركة صحراء للتجزئة',
            'email' => $documentType === 'vendor_bill' ? 'ap@reddunes.sa' : 'ap@desertretail.sa',
        ]));

        $document->setRelation('lines', new Collection([
            new DocumentLine([
                'description' => 'Monthly bookkeeping services',
                'quantity' => 1,
                'unit_price' => 1_000_000,
                'gross_amount' => 1_000_000,
                'tax_rate' => 15,
                'tax_amount' => 150_000,
                'metadata' => ['custom_fields' => ['description_ar' => 'خدمات مسك الدفاتر الشهرية', 'unit' => 'srv', 'vat_rate' => 15]],
            ]),
        ]));

        $html = $this->buildHtml($company, $document, $template);

        if ($template->exists) {
            $this->templateEngineRuntime->recordRender($company, $template, null, true, 'template-preview');
        }

        return $html;
    }

    public function renderTemplate(DocumentTemplate $template, array $documentData): array
    {
        $sections = collect($template->sections ?? self::CANONICAL_SECTIONS)->values()->all();
        $fields = collect($template->fields ?? [])->values()->all();
        $values = [
            'document_number' => (string) ($documentData['document_number'] ?? ''),
            'issue_date' => (string) ($documentData['issue_date'] ?? ''),
            'due_date' => (string) ($documentData['due_date'] ?? ''),
            'contact' => (string) ($documentData['contact_name'] ?? $documentData['contact'] ?? ''),
            'lines' => $documentData['lines'] ?? [],
            'subtotal' => $documentData['subtotal'] ?? null,
            'tax_total' => $documentData['tax_total'] ?? null,
            'grand_total' => $documentData['grand_total'] ?? null,
            'notes' => (string) ($documentData['notes'] ?? ''),
            'logo_asset_id' => $template->logo_asset_id,
            'accent_color' => $template->accent_color,
            'watermark_text' => $template->watermark_text,
        ];

        $renderedSections = collect($sections)->map(fn (string $section) => [
            'id' => $section,
            'fields' => collect($fields)->filter(fn (string $field) => match ($section) {
                'header' => in_array($field, ['logo_asset_id', 'accent_color'], true),
                'title' => in_array($field, ['document_number'], true),
                'document-info' => in_array($field, ['issue_date', 'due_date'], true),
                'customer' => in_array($field, ['contact'], true),
                'items' => in_array($field, ['lines'], true),
                'totals' => in_array($field, ['subtotal', 'tax_total', 'grand_total'], true),
                'notes' => in_array($field, ['notes'], true),
                'footer' => in_array($field, ['watermark_text'], true),
                default => false,
            })->map(fn (string $field) => [
                'name' => $field,
                'value' => $values[$field] ?? null,
            ])->values()->all(),
        ])->values()->all();

        $html = collect($renderedSections)->map(function (array $section): string {
            $items = collect($section['fields'])->map(function (array $field): string {
                $value = is_array($field['value']) ? json_encode($field['value'], JSON_UNESCAPED_SLASHES) : (string) ($field['value'] ?? '');

                return '<div data-template-field="'.e($field['name']).'"><strong>'.e($field['name']).':</strong> '.e($value).'</div>';
            })->implode('');

            return '<section data-template-section="'.e($section['id']).'">'.$items.'</section>';
        })->implode('');

        return [
            'html' => '<article data-template-render="true">'.$html.'</article>',
            'json' => [
                'template_id' => $template->id,
                'layout' => $template->layout,
                'sections' => $renderedSections,
                'fields' => $fields,
            ],
        ];
    }

    private function buildHtml(Company $company, Document $document, ?DocumentTemplate $template): string
    {
        $settings = $template?->settings ?? [];
        $accentColor = $template?->accent_color ?? '#1f7a53';
        $logo = $template?->logoAsset?->public_url ?: $this->defaultLogoDataUri();
        $family = $this->normalizeFamily((string) ($settings['layout'] ?? self::TEMPLATE_FAMILY_CLASSIC));
        $showVatSection = filter_var($settings['show_vat_section'] ?? true, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true;
        $showTotals = filter_var($settings['show_totals'] ?? true, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true;
        $defaultNote = (string) ($settings['default_note'] ?? '');

        $documentType = (string) $document->type;
        $documentTitle = $document->title ?: ($this->documentTitlePair($documentType)['en'] ?? Str::headline(str_replace('_', ' ', $documentType)));
        $isTaxComplianceDocument = in_array($documentType, ['tax_invoice', 'credit_note', 'debit_note', 'cash_invoice', 'api_invoice', 'purchase_invoice', 'vendor_bill'], true);
        $showCommercialTotals = $showTotals;
        $contactLabel = in_array($documentType, ['vendor_bill', 'purchase_invoice', 'purchase_order', 'purchase_credit_note'], true) ? 'Supplier' : 'Customer';

        $stampAsset = ! empty($settings['stamp_asset_id']) ? CompanyAsset::query()->find((int) $settings['stamp_asset_id']) : null;
        $signatureAsset = ! empty($settings['signature_asset_id']) ? CompanyAsset::query()->find((int) $settings['signature_asset_id']) : null;

        $watermark = $template?->watermark_text
            ? '<div style="position:fixed;top:34%;left:10%;right:10%;text-align:center;font-size:82px;font-weight:700;color:rgba(0,0,0,.045);transform:rotate(-18deg);white-space:nowrap;pointer-events:none;">'.e($template->watermark_text).'</div>'
            : '';
        $body = $this->renderCanonicalTemplate(
            $company,
            $document,
            $template,
            $documentTitle,
            $accentColor,
            $logo,
            $family,
            $contactLabel,
            $defaultNote,
            $showCommercialTotals,
            $showVatSection,
            $isTaxComplianceDocument,
            $stampAsset?->public_url,
            $signatureAsset?->public_url,
        );

        return '<html><body style="margin:0;padding:0;background:#f1f5f1;font-family:'.self::DOCUMENT_FONT_STACK.';color:#112018;position:relative;">'
            .$watermark
            .$body
            .'</body></html>';
    }

    private function normalizeFamily(string $layout): string
    {
        return match ($layout) {
            'compact-grid', 'statement', 'modern', self::TEMPLATE_FAMILY_MODERN => self::TEMPLATE_FAMILY_MODERN,
            'legal', 'ledger', self::TEMPLATE_FAMILY_INDUSTRIAL => self::TEMPLATE_FAMILY_INDUSTRIAL,
            default => self::TEMPLATE_FAMILY_CLASSIC,
        };
    }

    private function renderCanonicalTemplate(Company $company, Document $document, ?DocumentTemplate $template, string $documentTitle, string $accentColor, string $logo, string $family, string $contactLabel, string $defaultNote, bool $showCommercialTotals, bool $showVatSection, bool $isTaxComplianceDocument, ?string $stampUrl, ?string $signatureUrl): string
    {
        $settings = $template?->settings ?? [];
        $spacingScale = max((float) ($settings['spacing_scale'] ?? 0.9), 0.82);
        $fontFamily = e((string) ($settings['font_family'] ?? self::DOCUMENT_FONT_STACK));
        $fontSize = max((int) ($settings['font_size'] ?? 12), 11);
        $titleSize = max((int) ($settings['title_font_size'] ?? 24), 22);
        $theme = $this->themePalette($family, $accentColor);

        $sectionOrder = $this->buildSectionOrder((string) ($settings['section_order'] ?? ''));
        $hiddenSections = collect(explode(',', (string) ($settings['hidden_sections'] ?? '')))
            ->map(fn (string $value) => trim($value))
            ->filter(fn (string $value) => in_array($value, self::CANONICAL_SECTIONS, true))
            ->all();

        $sectionMap = [
            'header' => $this->renderHeaderSection($company, $document, $logo, $theme, $fontSize, $spacingScale, $settings),
            'title' => $this->renderTitleSection($documentTitle, $document, $titleSize, 'center', $theme, $fontSize),
            'document-info' => $this->renderDocumentInfoSection($document, $theme, $fontSize, $spacingScale, $settings),
            'delivery' => $this->renderDeliverySection($document, $theme, $fontSize, $spacingScale, $settings),
            'customer' => $this->renderCustomerSection($document, $contactLabel, $theme, $fontSize, $spacingScale, $settings),
            'items' => $this->renderItemsSection($document, $theme, $fontSize, $spacingScale, $showCommercialTotals, $settings),
            'totals' => $showCommercialTotals ? $this->renderTotalsSection($document, $theme, $fontSize, $spacingScale, $showVatSection, $settings) : '',
            'notes' => filled($document->notes ?: $defaultNote) ? $this->renderNotesSection($document->notes ?: $defaultNote, $theme, $fontSize, $spacingScale) : '',
            'footer' => $this->renderFooterSection($company, $document, $theme, $fontSize, $spacingScale, $isTaxComplianceDocument, $stampUrl, $signatureUrl, $settings),
        ];

        $sections = collect($sectionOrder)
            ->reject(fn (string $section) => in_array($section, $hiddenSections, true))
            ->map(fn (string $section) => $sectionMap[$section] ?? '')
            ->filter(fn (string $html) => $html !== '')
            ->implode('');

        return '<div style="max-width:980px;margin:0 auto;padding:'.self::SPACE_16.'px;background:#ffffff;">'
            .'<article data-doc-root="true" style="background:#ffffff;border:1px solid '.$theme['frame'].';font-family:'.$fontFamily.',Tahoma,Arial,sans-serif;color:'.$theme['text'].';padding:'.self::SPACE_16.'px;">'
            .$sections
            .'</article></div>';
    }

    private function buildSectionOrder(string $configured): array
    {
        $canonical = self::CANONICAL_SECTIONS;

        $sections = collect(explode(',', $configured))
            ->map(fn (string $value) => trim($value))
            ->map(fn (string $value) => $value === 'seller-buyer' ? 'customer' : ($value === 'qr' ? 'footer' : $value))
            ->filter(fn (string $value) => in_array($value, $canonical, true))
            ->unique()
            ->values()
            ->all();

        if ($sections === []) {
            return $canonical;
        }

        foreach ($canonical as $section) {
            if (! in_array($section, $sections, true)) {
                $sections[] = $section;
            }
        }

        return $sections;
    }

    private function buildSectionLayoutMap(array $settings, int $gridColumns, array $sectionOrder): array
    {
        $defaults = $this->defaultSectionLayout($gridColumns);
        $decoded = json_decode((string) ($settings['section_layout_map'] ?? ''), true);
        $positionIndex = array_flip($sectionOrder);

        return collect(self::CANONICAL_SECTIONS)
            ->map(function (string $section) use ($decoded, $defaults, $positionIndex, $gridColumns): array {
                $base = $defaults[$section] ?? ['row' => ($positionIndex[$section] ?? 0) + 1, 'column' => 1, 'span' => 1];
                $candidate = is_array($decoded) && is_array($decoded[$section] ?? null) ? $decoded[$section] : [];
                $column = max((int) ($candidate['column'] ?? $base['column']), 1);
                $column = min($column, $gridColumns);
                $span = max((int) ($candidate['span'] ?? $base['span']), 1);
                $span = min($span, $gridColumns - $column + 1);

                return [
                    'section' => $section,
                    'row' => max((int) ($candidate['row'] ?? $base['row']), 1),
                    'column' => $column,
                    'span' => $span,
                    'index' => $positionIndex[$section] ?? 999,
                ];
            })
            ->sort(fn (array $left, array $right) => [$left['row'], $left['column'], $left['index']] <=> [$right['row'], $right['column'], $right['index']])
            ->values()
            ->all();
    }

    private function defaultSectionLayout(int $gridColumns): array
    {
        if ($gridColumns >= 3) {
            return [
                'header' => ['row' => 1, 'column' => 1, 'span' => 3],
                'title' => ['row' => 2, 'column' => 1, 'span' => 3],
                'document-info' => ['row' => 3, 'column' => 1, 'span' => 1],
                'delivery' => ['row' => 3, 'column' => 2, 'span' => 1],
                'customer' => ['row' => 3, 'column' => 3, 'span' => 1],
                'items' => ['row' => 4, 'column' => 1, 'span' => 3],
                'notes' => ['row' => 5, 'column' => 1, 'span' => 2],
                'totals' => ['row' => 5, 'column' => 3, 'span' => 1],
                'footer' => ['row' => 6, 'column' => 1, 'span' => 3],
            ];
        }

        return [
            'header' => ['row' => 1, 'column' => 1, 'span' => $gridColumns],
            'title' => ['row' => 2, 'column' => 1, 'span' => $gridColumns],
            'document-info' => ['row' => 3, 'column' => 1, 'span' => 1],
            'delivery' => ['row' => 3, 'column' => min(2, $gridColumns), 'span' => 1],
            'customer' => ['row' => 4, 'column' => 1, 'span' => 1],
            'totals' => ['row' => 4, 'column' => min(2, $gridColumns), 'span' => 1],
            'items' => ['row' => 5, 'column' => 1, 'span' => $gridColumns],
            'notes' => ['row' => 6, 'column' => 1, 'span' => 1],
            'footer' => ['row' => 6, 'column' => min(2, $gridColumns), 'span' => max(1, $gridColumns - 1)],
        ];
    }

    private function themePalette(string $family, string $accentColor): array
    {
        return match ($family) {
            self::TEMPLATE_FAMILY_INDUSTRIAL => ['accent' => '#1c4559', 'canvas' => '#ffffff', 'section' => '#ffffff', 'frame' => '#aebbc3', 'muted' => '#4e616d', 'header' => '#dde8ee', 'text' => '#12232c', 'row' => '#f6f9fb'],
            self::TEMPLATE_FAMILY_MODERN => ['accent' => '#0d7767', 'canvas' => '#ffffff', 'section' => '#fcfdfd', 'frame' => '#cfddd7', 'muted' => '#63756f', 'header' => '#eef6f3', 'text' => '#152720', 'row' => '#fafcfb'],
            default => ['accent' => $accentColor, 'canvas' => '#ffffff', 'section' => '#ffffff', 'frame' => '#cbd7d0', 'muted' => '#5f6e68', 'header' => '#f7faf8', 'text' => '#13231b', 'row' => '#ffffff'],
        };
    }

    private function familyChrome(string $family, array $settings): array
    {
        $defaults = match ($family) {
            self::TEMPLATE_FAMILY_INDUSTRIAL => ['grid_columns' => 3, 'section_gap' => 10, 'spacing_scale' => 0.9, 'canvas_padding' => 16, 'top_bar_height' => 4],
            self::TEMPLATE_FAMILY_MODERN => ['grid_columns' => 2, 'section_gap' => 14, 'spacing_scale' => 1.04, 'canvas_padding' => 20, 'top_bar_height' => 5],
            default => ['grid_columns' => 2, 'section_gap' => 8, 'spacing_scale' => 0.9, 'canvas_padding' => 14, 'top_bar_height' => 3],
        };

        return [
            'grid_columns' => (int) ($settings['section_grid_columns'] ?? $defaults['grid_columns']),
            'section_gap' => (float) ($settings['section_gap'] ?? $defaults['section_gap']),
            'spacing_scale' => (float) ($settings['spacing_scale'] ?? $defaults['spacing_scale']),
            'canvas_padding' => (int) ($settings['canvas_padding'] ?? $defaults['canvas_padding']),
            'top_bar_height' => (int) ($settings['top_bar_height'] ?? $defaults['top_bar_height']),
        ];
    }

    private function documentTitlePair(string $documentType): array
    {
        return self::DOCUMENT_TITLE_MAP[$documentType] ?? [Str::headline(str_replace('_', ' ', $documentType)), 'مستند مالي'];
    }

    private function renderHeaderSection(Company $company, Document $document, string $logo, array $theme, int $fontSize, float $spacingScale, array $settings): string
    {
        $custom = (array) ($document->custom_fields ?? []);
        $sellerNameEn = (string) ($custom['seller_name_en'] ?? $company->legal_name ?? '');
        $sellerNameAr = (string) ($custom['seller_name_ar'] ?? '');
        $sellerAddressEn = (string) ($custom['seller_address_en'] ?? '');
        $sellerAddressAr = (string) ($custom['seller_address_ar'] ?? '');
        $sellerEmail = (string) ($custom['seller_email'] ?? '');
        $sellerPhone = (string) ($custom['seller_phone'] ?? '');
        $sellerVat = (string) ($custom['seller_vat_number'] ?? $company->tax_number ?? '');
        $sellerCr = (string) ($custom['seller_cr_number'] ?? $company->registration_number ?? '');

        $logoMaxWidth = max(72, min(260, (int) ($settings['logo_max_width'] ?? 160)));
        $logoMaxHeight = max(44, min(160, (int) ($settings['logo_max_height'] ?? 62)));

        return '<section data-doc-section="header" style="display:grid;grid-template-columns:minmax(0,1fr) 132px minmax(0,1fr);gap:0;align-items:start;padding-bottom:'.self::SPACE_16.'px;border-bottom:1px solid '.$theme['frame'].';margin-bottom:'.self::SPACE_16.'px;">'
            .'<div style="display:grid;gap:'.self::SPACE_4.'px;align-content:start;text-align:left;font-size:'.$fontSize.'px;line-height:1.5;color:'.$theme['text'].';padding-right:'.self::SPACE_12.'px;">'
            .'<div style="font-size:'.($fontSize + 6).'px;font-weight:800;line-height:1.15;">'.e($sellerNameEn).'</div>'
            .($sellerAddressEn !== '' ? '<div>'.e($sellerAddressEn).'</div>' : '')
            .(($sellerEmail !== '' || $sellerPhone !== '') ? '<div>'.e(trim(implode(' / ', array_filter([$sellerEmail, $sellerPhone])))).'</div>' : '')
            .'</div>'
            .'<div style="display:flex;justify-content:center;align-items:flex-start;min-height:72px;padding:0 '.self::SPACE_8.'px;"><img src="'.e($logo).'" alt="Logo" style="max-width:'.$logoMaxWidth.'px;max-height:'.$logoMaxHeight.'px;object-fit:contain;display:block;" /></div>'
            .'<div dir="rtl" style="display:grid;gap:'.self::SPACE_4.'px;align-content:start;font-size:'.$fontSize.'px;line-height:1.6;color:'.$theme['text'].';padding-left:'.self::SPACE_12.'px;font-family:'.self::ARABIC_FONT_STACK.';direction:rtl;unicode-bidi:isolate;text-align:right;">'
            .($sellerNameAr !== '' ? '<div style="font-size:'.($fontSize + 6).'px;font-weight:800;line-height:1.2;">'.e($sellerNameAr).'</div>' : '')
            .($sellerAddressAr !== '' ? '<div>'.e($sellerAddressAr).'</div>' : '')
            .($sellerVat !== '' ? '<div>الرقم الضريبي: '.e($sellerVat).'</div>' : '')
            .($sellerCr !== '' ? '<div>السجل التجاري: '.e($sellerCr).'</div>' : '')
            .'</div></section>';
    }

    private function renderTitleSection(string $documentTitle, Document $document, int $titleSize, string $titleAlign, array $theme, int $fontSize): string
    {
        $titlePair = $this->documentTitlePair((string) $document->type);

        return '<section data-doc-section="title" style="padding:0 0 '.self::SPACE_16.'px;">'
            .'<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:'.self::SPACE_16.'px;align-items:end;border-bottom:1px solid '.$theme['frame'].';padding-bottom:'.self::SPACE_12.'px;">'
            .'<div data-doc-title="en" style="text-align:left;">'
            .'<div style="font-size:'.($fontSize - 1).'px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:'.$theme['muted'].';">Document</div>'
            .'<div style="margin-top:'.self::SPACE_8.'px;font-size:'.$titleSize.'px;font-weight:900;letter-spacing:.01em;line-height:1.05;color:'.$theme['text'].';">'.e($documentTitle).'</div>'
            .'</div>'
            .'<div data-doc-title="ar" dir="rtl" style="text-align:right;font-family:'.self::ARABIC_FONT_STACK.';direction:rtl;unicode-bidi:isolate;">'
            .'<div style="font-size:'.($fontSize - 1).'px;font-weight:700;letter-spacing:.08em;color:'.$theme['muted'].';">المستند</div>'
            .'<div style="margin-top:'.self::SPACE_8.'px;font-size:'.($titleSize - 1).'px;font-weight:900;line-height:1.15;color:'.$theme['text'].';">'.e($titlePair[1]).'</div>'
            .'</div>'
            .'</div>'
            .'</section>';
    }

    private function renderDocumentInfoSection(Document $document, array $theme, int $fontSize, float $spacingScale, array $settings): string
    {
        $documentLabel = $this->documentTypeNumberLabel((string) $document->type);
        $supplyDate = (string) data_get($document->custom_fields, 'supply_date', optional($document->issue_date)?->toDateString() ?? '');
        $labelColorEn = (string) ($settings['label_color_en'] ?? $theme['muted']);
        $labelColorAr = (string) ($settings['label_color_ar'] ?? $theme['muted']);
        $documentNumberLabels = $this->resolveLabelPair($settings, 'invoice_number', $documentLabel['en'], $documentLabel['ar']);
        $issueDateLabels = $this->resolveLabelPair($settings, 'issue_date', 'Issue Date', 'تاريخ الإصدار');
        $supplyDateLabels = $this->resolveLabelPair($settings, 'supply_date', 'Supply Date', 'تاريخ التوريد');
        $dueDateLabels = $this->resolveLabelPair($settings, 'due_date', 'Due Date', 'تاريخ الاستحقاق');
        $referenceLabels = $this->resolveLabelPair($settings, 'reference', 'Reference', 'المرجع');
        $rows = array_filter([
            [$documentNumberLabels['en'], $documentNumberLabels['ar'], $document->document_number ?: 'Draft'],
            [$issueDateLabels['en'], $issueDateLabels['ar'], optional($document->issue_date)?->toDateString()],
            [$supplyDateLabels['en'], $supplyDateLabels['ar'], $supplyDate],
            [$dueDateLabels['en'], $dueDateLabels['ar'], optional($document->due_date)?->toDateString()],
            [$referenceLabels['en'], $referenceLabels['ar'], (string) data_get($document->custom_fields, 'reference', '')],
        ], fn (array $row) => filled($row[2]));

        return '<section data-doc-section="document-info" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:'.self::SPACE_12.'px;margin-bottom:'.self::SPACE_16.'px;">'
            .collect($rows)->map(function (array $row) use ($fontSize, $labelColorEn, $labelColorAr, $theme): string {
                return '<div data-doc-meta-card="true" style="display:grid;min-width:0;border:1px solid '.$theme['frame'].';background:#fff;padding:'.self::SPACE_12.'px;gap:'.self::SPACE_8.'px;">'
                    .'<div data-doc-meta-labels="true" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:'.self::SPACE_12.'px;align-items:start;">'
                    .'<div data-doc-label="en" style="font-size:'.($fontSize - 2).'px;line-height:1.25;font-weight:700;color:'.$labelColorEn.';text-transform:uppercase;letter-spacing:.06em;overflow-wrap:anywhere;">'.e($row[0]).'</div>'
                    .'<div data-doc-label="ar" dir="rtl" style="font-size:'.($fontSize - 2).'px;font-weight:700;color:'.$labelColorAr.';font-family:'.self::ARABIC_FONT_STACK.';direction:rtl;unicode-bidi:isolate;text-align:right;line-height:1.35;overflow-wrap:anywhere;">'.e($row[1]).'</div>'
                    .'</div>'
                    .'<div data-doc-meta-value="true" style="min-width:0;border-top:1px solid '.$theme['frame'].';padding-top:'.self::SPACE_8.'px;font-size:'.($fontSize + 1).'px;font-weight:800;color:'.$theme['text'].';line-height:1.35;overflow-wrap:anywhere;word-break:break-word;font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate;text-align:left;">'.e((string) $row[2]).'</div>'
                    .'</div>';
            })->implode('')
            .'</section>';
    }

    private function renderDeliverySection(Document $document, array $theme, int $fontSize, float $spacingScale, array $settings): string
    {
        $supplyDateLabels = $this->resolveLabelPair($settings, 'supply_date', 'Supply Date', 'تاريخ التوريد');
        $orderNumberLabels = $this->resolveLabelPair($settings, 'order_number', 'Order Number', 'رقم الطلب');
        $projectLabels = $this->resolveLabelPair($settings, 'project', 'Project', 'المشروع');
        $rows = array_filter([
            [$supplyDateLabels['en'], $supplyDateLabels['ar'], (string) data_get($document->custom_fields, 'supply_date', '')],
            ['Delivery Note', 'رقم إشعار التسليم', (string) data_get($document->custom_fields, 'linked_delivery_note_number', '')],
            [$orderNumberLabels['en'], $orderNumberLabels['ar'], (string) data_get($document->custom_fields, 'order_number', '')],
            [$projectLabels['en'], $projectLabels['ar'], (string) data_get($document->custom_fields, 'project', '')],
        ], fn (array $row) => filled($row[2]));

        if ($rows === []) {
            return '';
        }

        return '<section data-doc-section="delivery" style="border:1px solid '.$theme['frame'].';background:'.$theme['section'].';padding:'.self::SPACE_12.'px;margin-bottom:'.self::SPACE_16.'px;">'
            .'<div style="margin-bottom:'.self::SPACE_8.'px;font-size:'.($fontSize - 2).'px;text-transform:uppercase;letter-spacing:.06em;color:'.$theme['muted'].';font-weight:800;">Delivery / التسليم</div>'
            .'<div style="display:grid;gap:'.self::SPACE_8.'px;">'
            .collect($rows)->map(fn (array $row) => '<div data-doc-bilingual-row="true" style="display:grid;grid-template-columns:1fr 1fr;gap:'.self::SPACE_12.'px;"><div style="text-align:left;"><strong>'.e($row[0]).':</strong> '.e((string) $row[2]).'</div><div dir="rtl" style="text-align:right;"><strong>'.e($row[1]).':</strong> '.e((string) $row[2]).'</div></div>')->implode('')
            .'</div></section>';
    }

    private function renderCustomerSection(Document $document, string $contactLabel, array $theme, int $fontSize, float $spacingScale, array $settings): string
    {
        $custom = (array) ($document->custom_fields ?? []);
        $contact = $document->contact;
        $buyerNameEn = (string) ($custom['buyer_name_en'] ?? $contact?->display_name ?? '');
        $buyerNameAr = (string) ($custom['buyer_name_ar'] ?? $contact?->display_name_ar ?? '');
        $buyerVat = (string) ($custom['buyer_vat_number'] ?? $contact?->tax_number ?? $contact?->vat_number ?? '');
        $buyerCr = (string) ($custom['buyer_cr_number'] ?? data_get($contact, 'custom_fields.cr_number', ''));
        $street = (string) data_get($contact, 'billing_address.line_1', data_get($custom, 'buyer_street', ''));
        $district = (string) data_get($contact, 'billing_address.district', data_get($custom, 'buyer_district', ''));
        $city = (string) data_get($contact, 'billing_address.city', data_get($custom, 'buyer_city', ''));
        $postalCode = (string) data_get($contact, 'billing_address.postal_code', data_get($custom, 'buyer_postal_code', ''));
        $poBox = (string) data_get($contact, 'custom_fields.po_box', data_get($custom, 'buyer_po_box', ''));
        $shortAddress = (string) data_get($contact, 'custom_fields.short_address', data_get($custom, 'buyer_short_address', ''));
        $country = (string) data_get($contact, 'billing_address.country', data_get($custom, 'buyer_country', ''));
        $buyerAddressEn = (string) ($custom['buyer_address_en'] ?? '');
        $buyerAddressAr = (string) ($custom['buyer_address_ar'] ?? '');
        $arabicCounterLabel = $contactLabel === 'Supplier' ? 'المورد' : 'العميل';
        $phone = (string) ($custom['buyer_phone'] ?? $contact?->phone ?? '');

        $addressLines = array_values(array_filter([
            $buyerAddressEn,
            trim(implode(', ', array_filter([$street, $district]))),
            trim(implode(', ', array_filter([$city, $postalCode]))),
            trim(implode(', ', array_filter([$poBox !== '' ? 'PO Box '.$poBox : '', $shortAddress]))),
            $country,
        ], fn (?string $value) => filled($value)));

        return '<section data-doc-section="customer" style="display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:0;border:1px solid '.$theme['frame'].';margin-bottom:'.self::SPACE_16.'px;">'
            .'<div style="padding:'.self::SPACE_12.'px;border-right:1px solid '.$theme['frame'].';font-size:'.$fontSize.'px;line-height:1.45;">'
            .($buyerNameEn !== '' ? '<div data-doc-party="en" style="font-size:'.($fontSize + 1).'px;font-weight:800;line-height:1.25;">'.e($buyerNameEn).'</div>' : '')
            .($buyerNameAr !== '' ? '<div data-doc-party="ar" dir="rtl" style="margin-top:'.self::SPACE_4.'px;font-family:'.self::ARABIC_FONT_STACK.';font-size:'.($fontSize + 1).'px;font-weight:800;line-height:1.35;text-align:right;">'.e($buyerNameAr).'</div>' : '')
            .'</div>'
            .'<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);padding:'.self::SPACE_12.'px;font-size:'.$fontSize.'px;line-height:1.45;">'
            .'<div style="padding-right:'.self::SPACE_12.'px;border-right:1px solid '.$theme['frame'].';">'
            .collect($addressLines)->map(fn (string $line) => '<div>'.e($line).'</div>')->implode('')
            .($buyerAddressAr !== '' ? '<div dir="rtl" style="margin-top:'.self::SPACE_4.'px;font-family:'.self::ARABIC_FONT_STACK.';text-align:right;">'.e($buyerAddressAr).'</div>' : '')
            .'</div>'
            .'<div style="padding-left:'.self::SPACE_12.'px;">'
            .($buyerVat !== '' ? '<div style="display:grid;gap:2px;"><div>VAT</div><strong>'.e($buyerVat).'</strong></div>' : '')
            .($buyerCr !== '' ? '<div style="display:grid;gap:2px;margin-top:'.self::SPACE_8.'px;"><div>CR</div><strong>'.e($buyerCr).'</strong></div>' : '')
            .($phone !== '' ? '<div style="display:grid;gap:2px;margin-top:'.self::SPACE_8.'px;"><div>Phone</div><strong>'.e($phone).'</strong></div>' : '')
            .'</div>'
            .'</div>'
            .'</section>';
    }

    private function renderKeyValueGridSection(string $title, array $rows, array $theme, int $fontSize, float $spacingScale, int $columns): string
    {
        return '<div style="border:1px solid '.$theme['frame'].';border-radius:16px;background:'.$theme['section'].';padding:'.(int) round(16 * $spacingScale).'px;">'
            .'<div style="margin-bottom:10px;font-size:'.($fontSize - 1).'px;text-transform:uppercase;letter-spacing:.08em;color:'.$theme['muted'].';font-weight:800;">'.e($title).'</div>'
            .'<div style="display:grid;grid-template-columns:repeat('.$columns.',minmax(0,1fr));gap:12px 16px;font-size:'.$fontSize.'px;">'
            .collect($rows)->map(fn (array $row) => '<div style="display:grid;gap:4px;"><div style="font-size:'.($fontSize - 2).'px;text-transform:uppercase;letter-spacing:.06em;color:'.$theme['muted'].';">'.e($row[0]).'</div><div style="font-weight:700;color:#183226;line-height:1.45;">'.e((string) $row[1]).'</div></div>')->implode('')
            .'</div></div>';
    }

    private function renderItemsSection(Document $document, array $theme, int $fontSize, float $spacingScale, bool $showCommercialTotals, array $settings): string
    {
        $columns = $this->resolveItemTableColumns($settings);
        $bilingualTableHeadings = filter_var($settings['table_heading_bilingual'] ?? false, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false;
        $labelQuantity = $this->resolveLabelPair($settings, 'quantity', 'Qty', 'الكمية');
        $labelUnit = $this->resolveLabelPair($settings, 'unit', 'Unit', 'الوحدة');
        $labelUnitPrice = $this->resolveLabelPair($settings, 'unit_price', 'Rate', 'السعر');
        $labelTaxable = $this->resolveLabelPair($settings, 'taxable', 'Taxable', 'الخاضع للضريبة');
        $labelVatRate = $this->resolveLabelPair($settings, 'vat_rate', 'VAT %', '% الضريبة');
        $labelVat = $this->resolveLabelPair($settings, 'vat', 'VAT', 'الضريبة');
        $labelTotal = $this->resolveLabelPair($settings, 'total', 'Total', 'الإجمالي');

        $labelMap = [
            'serial' => ['en' => '#', 'ar' => '#'],
            'description' => ['en' => 'Description', 'ar' => 'الوصف'],
            'quantity' => $labelQuantity,
            'unit' => $labelUnit,
            'unit_price' => $labelUnitPrice,
            'taxable' => $labelTaxable,
            'vat_rate' => $labelVatRate,
            'vat' => $labelVat,
            'total' => $labelTotal,
        ];

        $rows = $document->lines->map(function (DocumentLine $line, int $index) use ($columns, $fontSize, $spacingScale, $showCommercialTotals, $theme): string {
            $vatAmount = (float) ($line->tax_amount ?? 0);
            $taxableAmount = (float) (($line->gross_amount ?? null) !== null ? $line->gross_amount : ((float) $line->quantity * (float) $line->unit_price));
            $lineTotal = $showCommercialTotals ? $taxableAmount + $vatAmount : $taxableAmount;

            $arabicDescription = (string) data_get($line->metadata, 'custom_fields.description_ar', '');
            $unit = (string) data_get($line->metadata, 'custom_fields.unit', '');
            $unitDisplay = $unit !== '' ? $unit : '—';
            $rateRaw = $line->tax_rate;
            if (($rateRaw === null || (float) $rateRaw === 0.0) && data_get($line->metadata, 'custom_fields.vat_rate') !== null) {
                $rateRaw = data_get($line->metadata, 'custom_fields.vat_rate');
            }
            $vatRateDisplay = number_format((float) $rateRaw, 2).'%';

            $rowValues = [
                'serial' => (string) ($index + 1),
                'description' => '<div>'.e((string) $line->description).'</div>'.($arabicDescription !== '' ? '<div dir="rtl" style="margin-top:2px;text-align:right;">'.e($arabicDescription).'</div>' : ''),
                'quantity' => number_format((float) $line->quantity, 2),
                'unit' => e($unitDisplay),
                'unit_price' => number_format((float) $line->unit_price, 2),
                'taxable' => number_format($taxableAmount, 2),
                'vat_rate' => e($vatRateDisplay),
                'vat' => number_format($vatAmount, 2),
                'total' => number_format($lineTotal, 2),
            ];

            return '<tr>'.$columns->map(function (array $column) use ($rowValues, $theme): string {
                $key = $column['key'];
                $alignment = in_array($key, ['serial'], true) ? 'center' : (in_array($key, ['description'], true) ? 'left' : 'right');
                $fontWeight = $key === 'total' ? '700' : '400';

                return '<td style="width:'.$column['width'].'%;border:1px solid '.$theme['frame'].';padding:6px;text-align:'.$alignment.';font-variant-numeric:tabular-nums;vertical-align:middle;font-weight:'.$fontWeight.';">'.($rowValues[$key] ?? '').'</td>';
            })->implode('').'</tr>';
        })->implode('');

        return '<section data-doc-section="items" style="margin-bottom:'.self::SPACE_16.'px;">'
            .'<table style="width:100%;border-collapse:collapse;font-size:'.$fontSize.'px;line-height:1.3;">'
            .'<thead>'
            .'<tr>'.$columns->map(function (array $column) use ($bilingualTableHeadings, $theme, $labelMap): string {
                $key = $column['key'];
                $labels = $labelMap[$key] ?? ['en' => ucfirst($key), 'ar' => ucfirst($key)];
                $alignment = in_array($key, ['serial'], true) ? 'center' : (in_array($key, ['description'], true) ? 'left' : 'right');

                if (! $bilingualTableHeadings) {
                    return '<th style="width:'.$column['width'].'%;border:1px solid '.$theme['frame'].';padding:'.self::SPACE_8.'px;text-align:'.$alignment.';font-weight:800;background:'.$theme['header'].';">'.e((string) $labels['en']).'</th>';
                }

                return '<th style="width:'.$column['width'].'%;border:1px solid '.$theme['frame'].';padding:'.self::SPACE_8.'px;text-align:'.$alignment.';font-weight:800;background:'.$theme['header'].';">'
                    .'<div>'.e((string) $labels['en']).'</div>'
                    .'<div dir="rtl" style="font-family:'.self::ARABIC_FONT_STACK.';text-align:right;font-size:11px;font-weight:700;">'.e((string) $labels['ar']).'</div>'
                    .'</th>';
            })->implode('').'</tr>'
            .'</thead>'
            .'<tbody>'
            .$rows
            .'</tbody>'
            .'</table>'
            .'</section>';
    }

    private function renderTotalsSection(Document $document, array $theme, int $fontSize, float $spacingScale, bool $showVatSection, array $settings): string
    {
        $subtotalLabel = $this->resolveLabelPair($settings, 'subtotal', 'Subtotal', 'الإجمالي الفرعي');
        $taxableLabel = $this->resolveLabelPair($settings, 'taxable', 'Taxable Amount', 'المبلغ الخاضع للضريبة');
        $vatLabel = $this->resolveLabelPair($settings, 'vat', 'VAT', 'الضريبة');
        $grandTotalLabel = $this->resolveLabelPair($settings, 'grand_total', 'Total Due', 'الإجمالي');
        $rows = [
            [$subtotalLabel['en'], $subtotalLabel['ar'], number_format((float) $document->subtotal, 2)],
        ];

        if ($showVatSection) {
            $rows[] = [$taxableLabel['en'], $taxableLabel['ar'], number_format((float) $document->taxable_total, 2)];
            $rows[] = [$vatLabel['en'], $vatLabel['ar'], number_format((float) $document->tax_total, 2)];
        }

        return '<section data-doc-section="totals" style="display:flex;justify-content:flex-end;margin-bottom:'.self::SPACE_16.'px;">'
            .'<div data-doc-total-block="true" style="width:360px;border:1px solid '.$theme['frame'].';padding:'.self::SPACE_12.'px;background:linear-gradient(180deg,#ffffff 0%,'.$theme['header'].' 100%);">'
            .collect($rows)->map(fn (array $row) => '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:'.self::SPACE_12.'px;padding:'.self::SPACE_8.'px 0;border-bottom:1px solid '.$theme['frame'].';font-size:'.$fontSize.'px;line-height:1.3;"><span>'.e($row[0]).'</span><strong style="text-align:right;font-variant-numeric:tabular-nums;">'.e($row[2]).'</strong></div>')->implode('')
            .'<div data-doc-total-row="true" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:'.self::SPACE_16.'px;padding:'.self::SPACE_12.'px 0 '.self::SPACE_8.'px;font-size:'.($fontSize + 5).'px;line-height:1.1;font-weight:900;border-top:2px solid '.$theme['accent'].';margin-top:'.self::SPACE_8.'px;">'
                .'<span style="display:grid;gap:'.self::SPACE_4.'px;"><span>'.e($grandTotalLabel['en']).'</span><span dir="rtl" style="font-family:'.self::ARABIC_FONT_STACK.';font-size:'.($fontSize + 1).'px;line-height:1.2;text-align:right;">'.e($grandTotalLabel['ar']).'</span></span>'
            .'<strong data-doc-total-value="true" style="text-align:right;font-variant-numeric:tabular-nums;">'.number_format((float) $document->grand_total, 2).' '.e((string) $document->currency_code).'</strong></div>'
            .'</div></section>';
    }

    private function renderNotesSection(string $notes, array $theme, int $fontSize, float $spacingScale): string
    {
        return '<section data-doc-section="notes" style="border-top:1px solid '.$theme['frame'].';padding-top:'.self::SPACE_12.'px;margin-bottom:'.self::SPACE_12.'px;">'
            .'<div style="font-size:'.$fontSize.'px;line-height:1.35;">'.e($notes).'</div>'
            .'</section>';
    }

    private function documentTypeNumberLabel(string $documentType): array
    {
        return match ($documentType) {
            'quotation' => ['en' => 'Quotation Number', 'ar' => 'رقم عرض السعر'],
            'proforma_invoice' => ['en' => 'Proforma Number', 'ar' => 'رقم الفاتورة المبدئية'],
            'delivery_note' => ['en' => 'Delivery Note Number', 'ar' => 'رقم إشعار التسليم'],
            'credit_note' => ['en' => 'Credit Note Number', 'ar' => 'رقم الإشعار الدائن'],
            'debit_note' => ['en' => 'Debit Note Number', 'ar' => 'رقم الإشعار المدين'],
            'purchase_order' => ['en' => 'Purchase Order Number', 'ar' => 'رقم أمر الشراء'],
            'purchase_credit_note' => ['en' => 'Purchase Credit Note Number', 'ar' => 'رقم الإشعار الدائن للمشتريات'],
            'vendor_bill', 'purchase_invoice' => ['en' => 'Purchase Invoice Number', 'ar' => 'رقم فاتورة الشراء'],
            default => ['en' => 'Invoice Number', 'ar' => 'رقم الفاتورة'],
        };
    }

    private function renderFooterSection(Company $company, Document $document, array $theme, int $fontSize, float $spacingScale, bool $isTaxComplianceDocument, ?string $stampUrl, ?string $signatureUrl, array $settings): string
    {
        if (! (filter_var($settings['show_footer'] ?? true, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true)) {
            return '';
        }

        $right = collect([
            $stampUrl ? '<img src="'.e($stampUrl).'" alt="Stamp" style="max-width:96px;max-height:72px;object-fit:contain;" />' : '',
            $signatureUrl ? '<img src="'.e($signatureUrl).'" alt="Signature" style="max-width:132px;max-height:44px;object-fit:contain;" />' : '',
        ])->filter()->implode('');

        return '<section data-doc-section="footer" style="border-top:1px solid '.$theme['frame'].';padding-top:'.self::SPACE_12.'px;display:flex;justify-content:space-between;align-items:center;gap:'.self::SPACE_12.'px;min-height:40px;">'
            .'<div style="font-size:'.($fontSize - 1).'px;color:'.$theme['muted'].';">'.e($company->legal_name).($isTaxComplianceDocument ? ' · VAT '.e((string) ($company->tax_number ?: 'Not set')) : '').'</div>'
            .'<div style="display:flex;align-items:center;gap:10px;">'.$right.'</div>'
            .'</section>';
    }

    private function resolveLabelPair(array $settings, string $key, string $defaultEn, string $defaultAr): array
    {
        $en = $this->decodeJsonMapValue((string) ($settings['label_overrides_en'] ?? ''), $key);
        $ar = $this->decodeJsonMapValue((string) ($settings['label_overrides_ar'] ?? ''), $key);

        return [
            'en' => $en !== null && $en !== '' ? $en : $defaultEn,
            'ar' => $ar !== null && $ar !== '' ? $ar : $defaultAr,
        ];
    }

    private function decodeJsonMapValue(string $raw, string $key): ?string
    {
        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return null;
        }

        $value = $decoded[$key] ?? null;
        return is_string($value) ? trim($value) : null;
    }

    private function resolveItemTableColumns(array $settings): Collection
    {
        $defaults = collect([
            ['key' => 'serial', 'width' => 4, 'visible' => true],
            ['key' => 'description', 'width' => 26, 'visible' => true],
            ['key' => 'quantity', 'width' => 7, 'visible' => true],
            ['key' => 'unit', 'width' => 7, 'visible' => true],
            ['key' => 'unit_price', 'width' => 9, 'visible' => true],
            ['key' => 'taxable', 'width' => 11, 'visible' => true],
            ['key' => 'vat_rate', 'width' => 7, 'visible' => true],
            ['key' => 'vat', 'width' => 9, 'visible' => true],
            ['key' => 'total', 'width' => 20, 'visible' => true],
        ]);

        $decoded = json_decode((string) ($settings['item_table_columns'] ?? ''), true);
        $byKey = [];
        if (is_array($decoded)) {
            foreach ($decoded as $entry) {
                if (is_array($entry) && isset($entry['key']) && is_string($entry['key'])) {
                    $byKey[$entry['key']] = $entry;
                }
            }
        }

        $merged = $defaults->map(function (array $d) use ($byKey): array {
            $o = $byKey[$d['key']] ?? null;
            if (! is_array($o)) {
                return $d;
            }

            return [
                'key' => $d['key'],
                'width' => max(3, min(60, (int) ($o['width'] ?? $d['width']))),
                'visible' => filter_var($o['visible'] ?? true, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true,
            ];
        });

        $visible = $merged->filter(fn (array $c) => $c['visible'])->values();
        $sumWidths = (int) $visible->sum('width');
        if ($sumWidths < 1) {
            $sumWidths = 1;
        }

        return $visible->map(fn (array $c) => [
            'key' => $c['key'],
            'width' => round(100 * $c['width'] / $sumWidths, 4),
        ]);
    }

    private function defaultLogoDataUri(): string
    {
        return 'data:image/svg+xml;base64,'.base64_encode(self::DEFAULT_LOGO_SVG);
    }
}