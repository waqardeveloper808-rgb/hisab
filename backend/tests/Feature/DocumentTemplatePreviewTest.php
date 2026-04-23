<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Contact;
use App\Models\Document;
use App\Models\DocumentLine;
use App\Models\DocumentTemplate;
use App\Models\User;
use App\Services\DocumentTemplateRendererService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentTemplatePreviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_renderer_renders_blueprint_layout_for_required_document_types(): void
    {
        [$company, $contact, $template] = $this->createBlueprintFixture();
        $renderer = app(DocumentTemplateRendererService::class);

        $documentTypes = [
            'tax_invoice' => ['Tax Invoice', 'فاتورة ضريبية'],
            'quotation' => ['Quotation', 'عرض سعر'],
            'proforma_invoice' => ['Proforma Invoice', 'فاتورة مبدئية'],
            'credit_note' => ['Credit Note', 'إشعار دائن'],
            'debit_note' => ['Debit Note', 'إشعار مدين'],
        ];

        foreach ($documentTypes as $documentType => [$englishTitle, $arabicTitle]) {
            $document = $this->createDocument($company, $contact, $template, $documentType, $englishTitle);
            $html = $renderer->renderHtml($company->fresh(), $document->fresh()->load(['lines', 'contact', 'template.logoAsset']), $template);

            $this->assertBlueprintHtml($html, $englishTitle, $arabicTitle);

            $document->lines()->delete();
            $document->delete();
        }
    }

    public function test_preview_endpoint_renders_supported_document_types_with_locked_blueprint(): void
    {
        $user = User::factory()->create([
            'platform_role' => 'super_admin',
            'is_platform_active' => true,
        ]);

        $companyId = $this->actingAs($user)
            ->postJson('/api/companies', [
                'legal_name' => 'Template Preview Co',
                'trade_name' => 'Template Preview Co',
                'tax_number' => '300000000000123',
            ])
            ->assertCreated()
            ->json('data.id');

        $documentTypes = [
            'quotation' => ['Quotation', 'عرض سعر'],
            'proforma_invoice' => ['Proforma Invoice', 'فاتورة مبدئية'],
            'delivery_note' => ['Delivery Note', 'إشعار تسليم'],
            'tax_invoice' => ['Tax Invoice', 'فاتورة ضريبية'],
            'credit_note' => ['Credit Note', 'إشعار دائن'],
            'debit_note' => ['Debit Note', 'إشعار مدين'],
            'purchase_order' => ['Purchase Order', 'أمر شراء'],
            'vendor_bill' => ['Vendor Bill', 'فاتورة مورد'],
            'purchase_invoice' => ['Purchase Invoice', 'فاتورة شراء'],
            'purchase_credit_note' => ['Purchase Credit Note', 'إشعار دائن للمشتريات'],
        ];

        foreach ($documentTypes as $documentType => [$englishTitle, $arabicTitle]) {
            $html = $this->actingAs($user)
                ->postJson("/api/companies/{$companyId}/templates/preview", [
                    'name' => 'Enforcement Preview',
                    'document_types' => [$documentType],
                    'locale_mode' => 'bilingual',
                    'accent_color' => '#1f7a53',
                    'settings' => [
                        'layout' => 'classic_corporate',
                        'section_grid_columns' => 2,
                        'section_gap' => 8,
                        'spacing_scale' => 0.9,
                        'canvas_padding' => 14,
                        'top_bar_height' => 3,
                    ],
                    'document_type' => $documentType,
                ])
                ->assertOk()
                ->json('data.html');

            $this->assertBlueprintHtml($html, $englishTitle, $arabicTitle);
        }
    }

    private function createBlueprintFixture(): array
    {
        $user = User::factory()->create();

        $company = Company::query()->create([
            'legal_name' => 'Template Preview Co',
            'trade_name' => 'Template Preview Co',
            'tax_number' => '300000000000123',
            'registration_number' => '1010101010',
            'country_code' => 'SA',
            'base_currency' => 'SAR',
            'locale' => 'en',
            'timezone' => 'Asia/Riyadh',
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $contact = Contact::query()->create([
            'company_id' => $company->id,
            'type' => 'customer',
            'display_name' => 'Northern Horizon Trading',
            'legal_name' => 'Northern Horizon Trading',
            'tax_number' => '300111111100003',
            'email' => 'finance@northernhorizon.sa',
            'phone' => '0550000001',
            'billing_address' => [
                'line_1' => 'King Fahd Road 14',
                'district' => 'Al Muruj',
                'city' => 'Riyadh',
                'postal_code' => '12214',
                'country' => 'Saudi Arabia',
            ],
            'currency_code' => 'SAR',
            'custom_fields' => [
                'cr_number' => '1010543210',
                'po_box' => '43211',
                'short_address' => 'RMJH4321',
            ],
            'is_active' => true,
        ]);

        $template = DocumentTemplate::query()->create([
            'company_id' => $company->id,
            'name' => 'Blueprint Template',
            'document_types' => ['tax_invoice', 'quotation', 'proforma_invoice', 'credit_note', 'debit_note'],
            'locale_mode' => 'bilingual',
            'accent_color' => '#1f7a53',
            'settings' => [
                'layout' => 'classic_corporate',
                'spacing_scale' => 0.9,
                'font_size' => 11,
                'title_font_size' => 22,
                'show_totals' => true,
                'show_vat_section' => true,
            ],
            'is_default' => true,
            'is_active' => true,
        ]);

        return [$company, $contact, $template];
    }

    private function createDocument(Company $company, Contact $contact, DocumentTemplate $template, string $documentType, string $englishTitle): Document
    {
        $document = Document::query()->create([
            'company_id' => $company->id,
            'contact_id' => $contact->id,
            'template_id' => $template->id,
            'type' => $documentType,
            'status' => 'draft',
            'document_number' => strtoupper(substr($documentType, 0, 3)).'-0001',
            'title' => $englishTitle,
            'currency_code' => 'SAR',
            'language_code' => 'en',
            'issue_date' => Carbon::parse('2026-04-18'),
            'supply_date' => Carbon::parse('2026-04-18'),
            'due_date' => Carbon::parse('2026-04-25'),
            'subtotal' => 2500,
            'taxable_total' => 2500,
            'tax_total' => 375,
            'grand_total' => 2875,
            'balance_due' => 2875,
            'notes' => 'Blueprint validation note.',
            'custom_fields' => [
                'reference' => 'REF-2048',
                'project' => 'Warehouse rollout',
                'seller_name_ar' => 'شركة رمال الخليج التجارية',
                'seller_address_en' => 'Riyadh, King Fahd Road 10',
                'seller_address_ar' => 'الرياض، شارع الملك فهد 10',
                'seller_phone' => '0110000000',
                'seller_cr_number' => '1010101010',
                'buyer_name_ar' => 'شركة الأفق الشمالي التجارية',
                'buyer_address_ar' => 'الرياض، حي المروج، شارع العليا',
                'buyer_vat_number' => '300111111100003',
                'buyer_cr_number' => '1010543210',
                'buyer_po_box' => '43211',
                'buyer_postal_code' => '12214',
                'buyer_district' => 'Al Muruj',
                'buyer_short_address' => 'RMJH4321',
                'buyer_country' => 'Saudi Arabia',
                'buyer_phone' => '0550000001',
            ],
        ]);

        DocumentLine::query()->create([
            'document_id' => $document->id,
            'line_number' => 1,
            'description' => 'Monthly advisory retainer',
            'quantity' => 1,
            'unit_price' => 1500,
            'tax_amount' => 225,
            'gross_amount' => 1500,
            'metadata' => [
                'custom_fields' => [
                    'description_ar' => 'أتعاب استشارية شهرية',
                ],
            ],
        ]);

        DocumentLine::query()->create([
            'document_id' => $document->id,
            'line_number' => 2,
            'description' => 'Branch rollout support',
            'quantity' => 2,
            'unit_price' => 500,
            'tax_amount' => 150,
            'gross_amount' => 1000,
            'metadata' => [
                'custom_fields' => [
                    'description_ar' => 'دعم إطلاق الفرع',
                ],
            ],
        ]);

        return $document;
    }

    private function assertBlueprintHtml(string $html, string $englishTitle, string $arabicTitle): void
    {
        $this->assertStringContainsString($englishTitle, $html);
        $this->assertStringContainsString($arabicTitle, $html);
        $this->assertStringContainsString('data-doc-root="true"', $html);
        $this->assertStringContainsString('grid-template-columns:minmax(0,1fr) 132px minmax(0,1fr)', $html);
        $this->assertStringContainsString('data-doc-title="en"', $html);
        $this->assertStringContainsString('data-doc-title="ar"', $html);
        $this->assertStringContainsString('Issue Date', $html);
        $this->assertStringContainsString('تاريخ الإصدار', $html);
        $this->assertStringContainsString('Supply Date', $html);
        $this->assertStringContainsString('Delivery / التسليم', $html);
        $this->assertStringContainsString('grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)', $html);
        $this->assertStringContainsString('>VAT</div>', $html);
        $this->assertStringContainsString('>CR</div>', $html);
        $this->assertStringContainsString('<th style="width:5%;', $html);
        $this->assertStringContainsString('>Taxable</th>', $html);
        $this->assertStringContainsString('data-doc-total-block="true"', $html);
        $this->assertStringContainsString('>Total Due</span>', $html);
        $this->assertStringNotContainsString('border-radius:16px', $html);
        $this->assertStringNotContainsString('CUSTOMER CUSTOMER', $html);
        $this->assertStringNotContainsString('Status', $html);
    }
}
