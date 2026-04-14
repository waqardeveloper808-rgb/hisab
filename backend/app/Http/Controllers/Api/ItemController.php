<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Company;
use App\Models\Item;
use App\Models\TaxCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    use ResolvesCompanyAccess;

    public function index(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.items.manage');

        $payload = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Item::query()
            ->where('company_id', $company->id)
            ->with(['taxCategory:id,code,name,rate', 'incomeAccount:id,code,name', 'expenseAccount:id,code,name'])
            ->orderBy('name');

        if (! empty($payload['search'])) {
            $search = '%'.$payload['search'].'%';
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('name', 'like', $search)
                    ->orWhere('sku', 'like', $search)
                    ->orWhere('description', 'like', $search);
            });
        }

        return response()->json([
            'data' => $query
                ->limit($payload['limit'] ?? 50)
                ->get(),
        ]);
    }

    public function store(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.items.manage');

        $payload = $request->validate([
            'type' => ['required', 'in:product,service'],
            'sku' => ['nullable', 'string', 'max:64'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'unit_id' => ['nullable', 'integer'],
            'tax_category_id' => ['nullable', 'integer'],
            'income_account_id' => ['nullable', 'integer'],
            'expense_account_id' => ['nullable', 'integer'],
            'default_sale_price' => ['nullable', 'numeric', 'min:0'],
            'default_purchase_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (! empty($payload['tax_category_id'])) {
            TaxCategory::query()
                ->where('company_id', $company->id)
                ->findOrFail($payload['tax_category_id']);
        }

        foreach (['income_account_id', 'expense_account_id'] as $accountField) {
            if (! empty($payload[$accountField])) {
                Account::query()
                    ->where('company_id', $company->id)
                    ->findOrFail($payload[$accountField]);
            }
        }

        if (empty($payload['tax_category_id'])) {
            $payload['tax_category_id'] = TaxCategory::query()
                ->where('company_id', $company->id)
                ->where('is_default_sales', true)
                ->value('id')
                ?? TaxCategory::query()->where('company_id', $company->id)->value('id');
        }

        if (empty($payload['income_account_id'])) {
            $payload['income_account_id'] = Account::query()
                ->where('company_id', $company->id)
                ->where('code', '4000')
                ->value('id');
        }

        if (empty($payload['expense_account_id'])) {
            $payload['expense_account_id'] = Account::query()
                ->where('company_id', $company->id)
                ->where('code', '5100')
                ->value('id');
        }

        $item = Item::create(array_merge($payload, [
            'company_id' => $company->id,
            'is_active' => true,
        ]));

        return response()->json([
            'data' => $item->load(['taxCategory:id,code,name,rate', 'incomeAccount:id,code,name', 'expenseAccount:id,code,name']),
        ], 201);
    }
}