<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
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

        $payload = $request->validate([
            'company.legal_name' => ['required', 'string', 'max:255'],
            'company.trade_name' => ['nullable', 'string', 'max:255'],
            'company.tax_number' => ['nullable', 'string', 'max:32'],
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
        ]);

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