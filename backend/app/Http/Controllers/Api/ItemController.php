<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Company;
use App\Models\DocumentLine;
use App\Models\InventoryItem;
use App\Models\Item;
use App\Models\TaxCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    use ResolvesCompanyAccess;

    protected function baseQuery(Company $company)
    {
        return Item::query()
            ->where('company_id', $company->id)
            ->with(['taxCategory:id,code,name,rate', 'incomeAccount:id,code,name', 'expenseAccount:id,code,name', 'inventoryAccount:id,code,name', 'cogsAccount:id,code,name']);
    }

    protected function validatePayload(Request $request, Company $company, bool $isUpdate = false): array
    {
        $payload = $request->validate([
            'type' => [$isUpdate ? 'sometimes' : 'required', 'in:product,service'],
            'inventory_classification' => ['nullable', 'string', 'max:60'],
            'sku' => ['nullable', 'string', 'max:64'],
            'name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'unit_id' => ['nullable', 'integer'],
            'tax_category_id' => ['nullable', 'integer'],
            'income_account_id' => ['nullable', 'integer'],
            'expense_account_id' => ['nullable', 'integer'],
            'default_sale_price' => ['nullable', 'numeric', 'min:0'],
            'default_purchase_price' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
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

        return $payload;
    }

    protected function listItems(Request $request, Company $company, ?string $forcedType = null): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.items.manage');

        $payload = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:active,archived,all'],
            'type' => ['nullable', 'in:product,service'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = $this->baseQuery($company)->orderBy('name');

        $status = $payload['status'] ?? 'active';
        if ($status !== 'all') {
            $query->where('is_active', $status === 'active');
        }

        $type = $forcedType ?? ($payload['type'] ?? null);
        if ($type !== null) {
            $query->where('type', $type);
        }

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

    protected function createItem(Request $request, Company $company, ?string $forcedType = null): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.items.manage');

        if ($forcedType !== null) {
            $request->merge(['type' => $forcedType]);
        }

        $payload = $this->validatePayload($request, $company);

        if (! empty($forcedType)) {
            $payload['type'] = $forcedType;
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
            $defaultExpenseCode = $company->settings?->default_expense_account_code ?? '6900';
            $payload['expense_account_id'] = Account::query()
                ->where('company_id', $company->id)
                ->where('code', $defaultExpenseCode)
                ->value('id')
                ?? Account::query()
                    ->where('company_id', $company->id)
                    ->where('code', '6900')
                    ->value('id');
        }

        $item = Item::create(array_merge($payload, [
            'company_id' => $company->id,
            'is_active' => $payload['is_active'] ?? true,
        ]));

        return response()->json([
            'data' => $item->load(['taxCategory:id,code,name,rate', 'incomeAccount:id,code,name', 'expenseAccount:id,code,name', 'inventoryAccount:id,code,name', 'cogsAccount:id,code,name']),
        ], 201);
    }

    protected function showItem(Request $request, Company $company, Item $item, ?string $forcedType = null): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.items.manage');
        abort_unless($item->company_id === $company->id, 404);
        abort_if($forcedType !== null && $item->type !== $forcedType, 404);

        return response()->json([
            'data' => $this->baseQuery($company)->findOrFail($item->id),
        ]);
    }

    protected function updateItem(Request $request, Company $company, Item $item, ?string $forcedType = null): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.items.manage');
        abort_unless($item->company_id === $company->id, 404);
        abort_if($forcedType !== null && $item->type !== $forcedType, 404);

        if ($forcedType !== null) {
            $request->merge(['type' => $forcedType]);
        }

        $payload = $this->validatePayload($request, $company, true);

        if ($forcedType !== null) {
            $payload['type'] = $forcedType;
        }

        if (! array_key_exists('tax_category_id', $payload) || empty($payload['tax_category_id'])) {
            $payload['tax_category_id'] = $item->tax_category_id ?: TaxCategory::query()
                ->where('company_id', $company->id)
                ->where('is_default_sales', true)
                ->value('id')
                ?? TaxCategory::query()->where('company_id', $company->id)->value('id');
        }

        if (! array_key_exists('income_account_id', $payload) || empty($payload['income_account_id'])) {
            $payload['income_account_id'] = $item->income_account_id ?: Account::query()
                ->where('company_id', $company->id)
                ->where('code', '4000')
                ->value('id');
        }

        if (! array_key_exists('expense_account_id', $payload) || empty($payload['expense_account_id'])) {
            $defaultExpenseCode = $company->settings?->default_expense_account_code ?? '6900';
            $payload['expense_account_id'] = $item->expense_account_id ?: Account::query()
                ->where('company_id', $company->id)
                ->where('code', $defaultExpenseCode)
                ->value('id')
                ?? Account::query()
                    ->where('company_id', $company->id)
                    ->where('code', '6900')
                    ->value('id');
        }

        $item->update($payload);

        return response()->json([
            'data' => $item->fresh()->load(['taxCategory:id,code,name,rate', 'incomeAccount:id,code,name', 'expenseAccount:id,code,name', 'inventoryAccount:id,code,name', 'cogsAccount:id,code,name']),
        ]);
    }

    protected function destroyItem(Request $request, Company $company, Item $item, ?string $forcedType = null): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.items.manage');
        abort_unless($item->company_id === $company->id, 404);
        abort_if($forcedType !== null && $item->type !== $forcedType, 404);

        $isLinked = DocumentLine::query()->where('item_id', $item->id)->exists()
            || InventoryItem::query()->where('item_id', $item->id)->exists();

        if ($isLinked) {
            $item->update(['is_active' => false]);

            return response()->json([
                'data' => $item->fresh()->load(['taxCategory:id,code,name,rate', 'incomeAccount:id,code,name', 'expenseAccount:id,code,name', 'inventoryAccount:id,code,name', 'cogsAccount:id,code,name']),
                'meta' => [
                    'deleted' => false,
                    'archived' => true,
                    'message' => 'Item is linked to operational records and was archived instead of deleted.',
                ],
            ]);
        }

        $item->delete();

        return response()->json([
            'data' => [
                'id' => $item->id,
                'deleted' => true,
            ],
        ]);
    }

    protected function stockItems(Request $request, Company $company, ?string $forcedType = null): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.items.manage');

        $query = InventoryItem::query()
            ->where('company_id', $company->id)
            ->with(['item:id,type,name,sku', 'inventoryAccount:id,code,name', 'lastJournalEntry:id,entry_number', 'recorder:id,name'])
            ->orderByDesc('updated_at');

        if ($forcedType !== null) {
            $query->whereHas('item', fn ($builder) => $builder->where('type', $forcedType));
        }

        return response()->json([
            'data' => $query->get()->map(fn ($inventory) => [
                'id' => $inventory->id,
                'item_id' => $inventory->item_id,
                'item_type' => $inventory->item?->type,
                'item_name' => $inventory->item?->name,
                'sku' => $inventory->item?->sku,
                'product_name' => $inventory->product_name,
                'quantity_on_hand' => (float) $inventory->quantity_on_hand,
                'committed_quantity' => (float) $inventory->committed_quantity,
                'reorder_level' => (float) $inventory->reorder_level,
                'journal_entry_number' => $inventory->lastJournalEntry?->entry_number,
                'inventory_account_code' => $inventory->inventoryAccount?->code,
                'inventory_account_name' => $inventory->inventoryAccount?->name,
                'updated_at' => $inventory->updated_at?->toIso8601String(),
            ]),
        ]);
    }

    public function index(Request $request, Company $company): JsonResponse
    {
        return $this->listItems($request, $company);
    }

    public function store(Request $request, Company $company): JsonResponse
    {
        return $this->createItem($request, $company);
    }

    public function show(Request $request, Company $company, Item $item): JsonResponse
    {
        return $this->showItem($request, $company, $item);
    }

    public function update(Request $request, Company $company, Item $item): JsonResponse
    {
        return $this->updateItem($request, $company, $item);
    }

    public function destroy(Request $request, Company $company, Item $item): JsonResponse
    {
        return $this->destroyItem($request, $company, $item);
    }

    public function search(Request $request, Company $company): JsonResponse
    {
        return $this->listItems($request, $company);
    }

    public function stock(Request $request, Company $company): JsonResponse
    {
        return $this->stockItems($request, $company);
    }
}