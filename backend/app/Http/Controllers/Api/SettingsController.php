<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Support\Validation\KsaBusinessValidation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    use ResolvesCompanyAccess;

    public function show(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'company.settings.manage');

        $company->load('settings');

        return response()->json([
            'data' => [
                'company' => [
                    'legal_name' => $company->legal_name,
                    'trade_name' => $company->trade_name,
                    'tax_number' => $company->tax_number,
                    'registration_number' => $company->registration_number,
                    'base_currency' => $company->base_currency,
                    'locale' => $company->locale,
                    'timezone' => $company->timezone,
                ],
                'settings' => $company->settings,
            ],
        ]);
    }

    public function update(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'company.settings.manage');

        $numberingRules = $request->input('settings.numbering_rules', []);
        if (! is_array($numberingRules)) {
            $numberingRules = [];
        }

        $numberingRules['phone'] = KsaBusinessValidation::normalizeSaudiPhone($numberingRules['phone'] ?? null);
        $numberingRules['addressCountry'] = KsaBusinessValidation::normalizeCountry($numberingRules['addressCountry'] ?? null);
        $request->merge([
            'company' => array_merge($request->input('company', []), [
                'tax_number' => $request->input('company.tax_number'),
            ]),
            'settings' => array_merge($request->input('settings', []), [
                'numbering_rules' => $numberingRules,
            ]),
        ]);

        $payload = $request->validate([
            'company.legal_name' => ['required', 'string', 'max:255'],
            'company.trade_name' => ['nullable', 'string', 'max:255'],
            'company.tax_number' => ['nullable', 'string', 'max:15', KsaBusinessValidation::vatRule()],
            'company.registration_number' => ['nullable', 'string', 'max:64'],
            'company.base_currency' => ['required', 'string', 'size:3'],
            'company.locale' => ['required', 'string', 'max:10'],
            'company.timezone' => ['required', 'string', 'max:64'],
            'settings.default_language' => ['required', 'string', 'max:10'],
            'settings.invoice_prefix' => ['required', 'string', 'max:20'],
            'settings.credit_note_prefix' => ['required', 'string', 'max:20'],
            'settings.payment_prefix' => ['required', 'string', 'max:20'],
            'settings.vendor_bill_prefix' => ['required', 'string', 'max:20'],
            'settings.purchase_invoice_prefix' => ['required', 'string', 'max:20'],
            'settings.purchase_credit_note_prefix' => ['required', 'string', 'max:20'],
            'settings.default_receivable_account_code' => ['required', 'string', 'max:20'],
            'settings.default_payable_account_code' => ['required', 'string', 'max:20'],
            'settings.default_revenue_account_code' => ['required', 'string', 'max:20'],
            'settings.default_expense_account_code' => ['required', 'string', 'max:20'],
            'settings.default_cash_account_code' => ['required', 'string', 'max:20'],
            'settings.default_customer_advance_account_code' => ['required', 'string', 'max:20'],
            'settings.default_supplier_advance_account_code' => ['required', 'string', 'max:20'],
            'settings.default_vat_payable_account_code' => ['required', 'string', 'max:20'],
            'settings.default_vat_receivable_account_code' => ['required', 'string', 'max:20'],
            'settings.zatca_environment' => ['required', 'string', 'max:20'],
            'settings.numbering_rules' => ['nullable', 'array'],
            'settings.numbering_rules.englishName' => ['required', 'string', 'max:255'],
            'settings.numbering_rules.arabicName' => ['required', 'string', 'max:255'],
            'settings.numbering_rules.phone' => ['required', 'regex:/^\+966\d{9}$/'],
            'settings.numbering_rules.email' => ['nullable', 'email', 'max:255'],
            ...KsaBusinessValidation::addressRules('settings.numbering_rules.address', false),
            'settings.numbering_rules.addressBuildingNumber' => ['required', 'digits:4'],
            'settings.numbering_rules.addressStreet' => ['required', 'string', 'max:255'],
            'settings.numbering_rules.addressArea' => ['required', 'string', 'max:255'],
            'settings.numbering_rules.addressCity' => ['required', 'string', 'max:120'],
            'settings.numbering_rules.addressPostalCode' => ['required', 'digits:5'],
            'settings.numbering_rules.addressAdditionalNumber' => ['required', 'digits:4'],
            'settings.numbering_rules.addressCountry' => ['required', 'string', 'size:2'],
            'settings.numbering_rules.shortAddress' => ['required', 'string', 'max:255'],
        ], [
            'company.tax_number.*' => 'VAT number must be 15 digits, start with 3, end with 3, and contain numbers only.',
            'settings.numbering_rules.phone.regex' => 'Phone number must normalize to the Saudi format +966XXXXXXXXX.',
            'settings.numbering_rules.addressBuildingNumber.digits' => 'Building number must contain exactly 4 digits.',
            'settings.numbering_rules.addressPostalCode.digits' => 'Postal code must contain exactly 5 digits.',
            'settings.numbering_rules.addressAdditionalNumber.digits' => 'Secondary number must contain exactly 4 digits.',
            'settings.numbering_rules.addressStreet.required' => 'Street name is required.',
            'settings.numbering_rules.addressArea.required' => 'District is required.',
            'settings.numbering_rules.addressCity.required' => 'City is required.',
            'settings.numbering_rules.addressCountry.size' => 'Country must use a 2-letter code such as SA.',
        ]);

        $payload['company']['tax_number'] = KsaBusinessValidation::normalizeVatNumber($payload['company']['tax_number'] ?? null);

        $company->update($payload['company']);

        $company->settings()->updateOrCreate(
            ['company_id' => $company->id],
            $payload['settings'],
        );

        $company->load('settings');

        return response()->json([
            'data' => [
                'company' => [
                    'legal_name' => $company->legal_name,
                    'trade_name' => $company->trade_name,
                    'tax_number' => $company->tax_number,
                    'registration_number' => $company->registration_number,
                    'base_currency' => $company->base_currency,
                    'locale' => $company->locale,
                    'timezone' => $company->timezone,
                ],
                'settings' => $company->settings,
            ],
        ]);
    }
}