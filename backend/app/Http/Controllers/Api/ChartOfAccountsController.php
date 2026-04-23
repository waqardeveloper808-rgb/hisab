<?php

namespace App\Http\Controllers\Api;

use App\Models\Account;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChartOfAccountsController
{
    public function index(Company $company, Request $request): JsonResponse
    {
        $query = Account::query()
            ->where('company_id', $company->id)
            ->orderBy('code');

        if ($request->filled('class')) {
            $query->where('account_class', $request->input('class'));
        }

        if ($request->filled('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'ilike', "%{$search}%")
                  ->orWhere('name', 'ilike', "%{$search}%")
                  ->orWhere('name_ar', 'ilike', "%{$search}%")
                  ->orWhere('account_class', 'ilike', "%{$search}%")
                  ->orWhere('group', 'ilike', "%{$search}%");
            });
        }

        $accounts = $query->get()->map(function (Account $account) {
            return [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'name_ar' => $account->name_ar,
                'type' => $account->type,
                'account_class' => $account->account_class,
                'subtype' => $account->subtype,
                'group' => $account->group,
                'normal_balance' => $account->normal_balance,
                'parent_id' => $account->parent_id,
                'allows_posting' => $account->allows_posting,
                'is_active' => $account->is_active,
                'is_system' => $account->is_system,
                'currency' => $account->currency,
                'notes' => $account->notes,
                'balance' => $account->computeBalance(),
            ];
        });

        return response()->json(['data' => $accounts]);
    }

    public function store(Company $company, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20',
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'type' => 'required|string|in:asset,liability,equity,income,expense,cost_of_sales,contra',
            'account_class' => 'required|string',
            'subtype' => 'nullable|string|max:50',
            'group' => 'nullable|string|max:50',
            'normal_balance' => 'required|in:debit,credit',
            'parent_id' => 'nullable|integer|exists:accounts,id',
            'allows_posting' => 'boolean',
            'is_active' => 'boolean',
            'currency' => 'nullable|string|max:3',
            'notes' => 'nullable|string',
        ]);

        $existing = Account::query()
            ->where('company_id', $company->id)
            ->where('code', $validated['code'])
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'Account code already exists.'], 422);
        }

        $account = Account::create(array_merge($validated, [
            'company_id' => $company->id,
            'is_system' => false,
        ]));

        return response()->json(['data' => $account], 201);
    }

    public function update(Company $company, Account $account, Request $request): JsonResponse
    {
        if ((int) $account->company_id !== (int) $company->id) {
            return response()->json(['message' => 'Account not found.'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'subtype' => 'nullable|string|max:50',
            'group' => 'nullable|string|max:50',
            'allows_posting' => 'boolean',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $account->update($validated);

        return response()->json(['data' => $account->fresh()]);
    }
}
