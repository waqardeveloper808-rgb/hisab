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
                ->get(['id', 'uuid', 'type', 'display_name', 'email', 'phone', 'billing_address', 'tax_number', 'is_active']),
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

        if (! empty($payload['payment_term_id'])) {
            PaymentTerm::query()
                ->where('company_id', $company->id)
                ->findOrFail($payload['payment_term_id']);
        }

        if ($payload['type'] === 'customer') {
            $this->planLimitService->ensureCustomerLimit($company);
        }

        $contact = Contact::create(array_merge($payload, [
            'company_id' => $company->id,
            'is_active' => true,
        ]));

        return response()->json(['data' => $contact], 201);
    }
}