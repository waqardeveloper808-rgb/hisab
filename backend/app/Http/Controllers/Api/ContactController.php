<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contact;
use App\Models\PaymentTerm;
use App\Services\PlanLimitService;
use App\Support\Validation\KsaBusinessValidation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    use ResolvesCompanyAccess;

    public function __construct(private readonly PlanLimitService $planLimitService)
    {
    }

    public function index(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.contacts.manage');

        $payload = $request->validate([
            'type' => ['nullable', 'in:customer,supplier'],
            'search' => ['nullable', 'string', 'max:255'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Contact::query()
            ->where('company_id', $company->id)
            ->orderBy('display_name');

        if (! empty($payload['type'])) {
            $query->where('type', $payload['type']);
        }

        if (! empty($payload['search'])) {
            $search = '%'.$payload['search'].'%';
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('display_name', 'like', $search)
                    ->orWhere('email', 'like', $search)
                    ->orWhere('phone', 'like', $search)
                    ->orWhere('tax_number', 'like', $search);
            });
        }

        return response()->json([
            'data' => $query
                ->limit($payload['limit'] ?? 50)
                ->get([
                    'id', 'uuid', 'type', 'display_name', 'email', 'phone', 'billing_address',
                    'tax_number',
                    'commercial_registration_number',
                    'opening_balance',
                    'opening_balance_type',
                    'opening_balance_as_of',
                    'is_active',
                ]),
        ]);
    }

    public function store(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.contacts.manage');

        $normalizedAddress = KsaBusinessValidation::normalizeAddress($request->input('billing_address'));
        $request->merge([
            'phone' => KsaBusinessValidation::normalizeSaudiPhone($request->input('phone')),
            'billing_address' => $normalizedAddress,
        ]);

        $payload = $request->validate([
            'type' => ['required', 'in:customer,supplier'],
            'display_name' => ['required', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'tax_number' => ['nullable', 'string', 'max:15', KsaBusinessValidation::vatRule()],
            'commercial_registration_number' => ['nullable', 'string', 'max:64'],
            'opening_balance' => ['nullable', 'numeric', 'between:-99999999999999.99,99999999999999.99'],
            'opening_balance_amount' => ['nullable', 'numeric', 'between:-99999999999999.99,99999999999999.99'],
            'opening_balance_type' => ['nullable', 'string', 'max:32', 'in:normal_debit,normal_credit,debit,credit'],
            'opening_balance_as_of' => ['nullable', 'date_format:Y-m-d'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'regex:/^\+966\d{9}$/'],
            'currency_code' => ['nullable', 'string', 'size:3'],
            'payment_term_id' => ['nullable', 'integer'],
            'billing_address' => ['nullable', 'array'],
            ...KsaBusinessValidation::addressRules('billing_address.'),
        ], [
            'phone.regex' => 'Phone number must normalize to the Saudi format +966XXXXXXXXX.',
            'billing_address.building_number.digits' => 'Building number must contain exactly 4 digits.',
            'billing_address.street_name.required' => 'Street name is required.',
            'billing_address.district.required' => 'District is required.',
            'billing_address.city.required' => 'City is required.',
            'billing_address.postal_code.digits' => 'Postal code must contain exactly 5 digits.',
            'billing_address.secondary_number.digits' => 'Secondary number must contain exactly 4 digits.',
            'billing_address.country.size' => 'Country must use a 2-letter code such as SA.',
        ]);

        $payload['tax_number'] = KsaBusinessValidation::normalizeVatNumber($payload['tax_number'] ?? null);
        $payload['legal_name'] = trim((string) ($payload['legal_name'] ?? '')) ?: $payload['display_name'];

        $amountExplicit = array_key_exists('opening_balance_amount', $payload) ? (float) $payload['opening_balance_amount'] : null;
        $amountLegacy = array_key_exists('opening_balance', $payload) ? (float) $payload['opening_balance'] : null;
        unset($payload['opening_balance_amount']);
        if ($amountExplicit !== null) {
            $payload['opening_balance'] = round($amountExplicit, 2);
        } elseif ($amountLegacy !== null) {
            $payload['opening_balance'] = round($amountLegacy, 2);
        }

        // Normalize synonyms for importer / API clients.
        if (! empty($payload['opening_balance_type']) && ($payload['opening_balance_type'] === 'debit' || $payload['opening_balance_type'] === 'credit')) {
            $payload['opening_balance_type'] = $payload['opening_balance_type'] === 'debit' ? 'normal_debit' : 'normal_credit';
        }

        if (! empty($payload['payment_term_id'])) {
            PaymentTerm::query()
                ->where('company_id', $company->id)
                ->findOrFail($payload['payment_term_id']);
        }

        if ($payload['type'] === 'customer') {
            $this->planLimitService->ensureCustomerLimit($company);
        }

        $openingBalance = isset($payload['opening_balance']) ? round((float) $payload['opening_balance'], 2) : 0.0;
        unset($payload['opening_balance']);

        $contact = Contact::create(array_merge($payload, [
            'company_id' => $company->id,
            'is_active' => true,
            'opening_balance' => $openingBalance,
        ]));

        return response()->json(['data' => $contact], 201);
    }
}