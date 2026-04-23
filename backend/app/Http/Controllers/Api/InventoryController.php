<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    use ResolvesCompanyAccess;

    public function __construct(private readonly InventoryService $service)
    {
    }

    public function stock(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.items.manage');

        return response()->json([
            'data' => $this->service->listStock($company)->map(fn ($inventory) => [
                'id' => $inventory->id,
                'item_id' => $inventory->item_id,
                'product_name' => $inventory->product_name,
                'material' => $inventory->material,
                'inventory_type' => $inventory->inventory_type,
                'size' => $inventory->size,
                'source' => $inventory->source,
                'code' => $inventory->code,
                'quantity_on_hand' => (float) $inventory->quantity_on_hand,
                'committed_quantity' => (float) $inventory->committed_quantity,
                'reorder_level' => (float) $inventory->reorder_level,
                'batch_number' => $inventory->batch_number,
                'production_date' => $inventory->production_date?->toDateString(),
                'recorded_by' => $inventory->recorder?->name,
                'journal_entry_number' => $inventory->lastJournalEntry?->entry_number,
                'inventory_account_code' => $inventory->inventoryAccount?->code,
                'inventory_account_name' => $inventory->inventoryAccount?->name,
                'attachments' => $inventory->attachments ?? [],
                'document_links' => $inventory->document_links ?? [],
                'updated_at' => $inventory->updated_at?->toIso8601String(),
            ]),
        ]);
    }

    public function createStock(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.items.manage');

        $payload = $request->validate([
            'item_id' => ['nullable', 'integer'],
            'product_name' => ['required', 'string', 'max:255'],
            'material' => ['nullable', 'string', 'max:255'],
            'inventory_type' => ['required', 'string', 'max:30'],
            'size' => ['nullable', 'string', 'max:60'],
            'source' => ['required', 'in:production,purchase'],
            'code' => ['required', 'string', 'max:80'],
            'quantity_on_hand' => ['required', 'numeric', 'gt:0'],
            'committed_quantity' => ['nullable', 'numeric', 'min:0'],
            'reorder_level' => ['nullable', 'numeric', 'min:0'],
            'batch_number' => ['nullable', 'string', 'max:80'],
            'production_date' => ['nullable', 'date'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'offset_account_code' => ['nullable', 'string', 'max:20'],
            'inventory_account_code' => ['nullable', 'string', 'max:20'],
            'revenue_account_code' => ['nullable', 'string', 'max:20'],
            'cogs_account_code' => ['nullable', 'string', 'max:20'],
            'reference' => ['nullable', 'string', 'max:80'],
            'transaction_date' => ['nullable', 'date'],
            'attachments' => ['nullable', 'array'],
            'document_links' => ['nullable', 'array'],
        ]);

        $actor = User::findOrFail($request->header('X-Gulf-Hisab-Actor-Id', 1));
        $inventory = $this->service->createReceipt($company, $actor, $payload);

        return response()->json(['data' => [
            'id' => $inventory->id,
            'item_id' => $inventory->item_id,
            'product_name' => $inventory->product_name,
            'material' => $inventory->material,
            'inventory_type' => $inventory->inventory_type,
            'size' => $inventory->size,
            'source' => $inventory->source,
            'code' => $inventory->code,
            'quantity_on_hand' => (float) $inventory->quantity_on_hand,
            'committed_quantity' => (float) $inventory->committed_quantity,
            'reorder_level' => (float) $inventory->reorder_level,
            'batch_number' => $inventory->batch_number,
            'production_date' => $inventory->production_date?->toDateString(),
            'recorded_by' => $inventory->recorder?->name,
            'journal_entry_number' => $inventory->lastJournalEntry?->entry_number,
            'inventory_account_code' => $inventory->inventoryAccount?->code,
            'inventory_account_name' => $inventory->inventoryAccount?->name,
            'attachments' => $inventory->attachments ?? [],
            'document_links' => $inventory->document_links ?? [],
            'updated_at' => $inventory->updated_at?->toIso8601String(),
        ]], 201);
    }

    public function adjustments(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.items.manage');

        return response()->json([
            'data' => $this->service->listAdjustments($company)->map(fn ($row) => [
                'id' => $row->id,
                'date' => $row->transaction_date?->toDateString(),
                'reference' => $row->reference,
                'reason' => $row->reason,
                'item_count' => 1,
                'status' => $row->status,
                'code' => $row->inventoryItem?->code,
                'product_name' => $row->inventoryItem?->product_name,
                'quantity' => abs((float) $row->quantity_delta),
                'source' => $row->transaction_type === 'sale' ? 'purchase' : ($row->metadata['source'] ?? 'purchase'),
                'recorded_by' => $row->recorder?->name,
                'journal_entry_number' => $row->journalEntry?->entry_number,
                'inventory_account_code' => $row->inventoryItem?->inventoryAccount?->code,
                'inventory_account_name' => $row->inventoryItem?->inventoryAccount?->name,
                'attachments' => $row->attachments ?? [],
                'document_links' => $row->document_links ?? [],
                'transaction_type' => $row->transaction_type,
            ]),
        ]);
    }

    public function createAdjustment(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.items.manage');

        $payload = $request->validate([
            'inventory_item_id' => ['required', 'integer'],
            'quantity_delta' => ['required', 'numeric', 'not_in:0'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'reason' => ['required', 'string', 'max:120'],
            'reference' => ['nullable', 'string', 'max:80'],
            'transaction_date' => ['nullable', 'date'],
            'adjustment_account_code' => ['nullable', 'string', 'max:20'],
            'attachments' => ['nullable', 'array'],
            'document_links' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
        ]);

        $actor = User::findOrFail($request->header('X-Gulf-Hisab-Actor-Id', 1));
        $adjustment = $this->service->createAdjustment($company, $actor, $payload);

        return response()->json(['data' => [
            'id' => $adjustment->id,
            'date' => $adjustment->transaction_date?->toDateString(),
            'reference' => $adjustment->reference,
            'reason' => $adjustment->reason,
            'item_count' => 1,
            'status' => $adjustment->status,
            'code' => $adjustment->inventoryItem?->code,
            'product_name' => $adjustment->inventoryItem?->product_name,
            'quantity' => abs((float) $adjustment->quantity_delta),
            'source' => 'purchase',
            'recorded_by' => $adjustment->recorder?->name,
            'journal_entry_number' => $adjustment->journalEntry?->entry_number,
            'inventory_account_code' => $adjustment->inventoryItem?->inventoryAccount?->code,
            'inventory_account_name' => $adjustment->inventoryItem?->inventoryAccount?->name,
            'attachments' => $adjustment->attachments ?? [],
            'document_links' => $adjustment->document_links ?? [],
            'transaction_type' => $adjustment->transaction_type,
        ]], 201);
    }

    public function createSale(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.items.manage');

        $payload = $request->validate([
            'inventory_item_id' => ['required', 'integer'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit_price' => ['required', 'numeric', 'gt:0'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'tax_rate' => ['nullable', 'numeric', 'min:0'],
            'cash_account_code' => ['nullable', 'string', 'max:20'],
            'reference' => ['nullable', 'string', 'max:80'],
            'transaction_date' => ['nullable', 'date'],
            'proforma_invoice' => ['nullable', 'string', 'max:80'],
            'tax_invoice' => ['nullable', 'string', 'max:80'],
            'delivery_note' => ['nullable', 'string', 'max:80'],
            'attachments' => ['nullable', 'array'],
            'document_links' => ['nullable', 'array'],
        ]);

        $actor = User::findOrFail($request->header('X-Gulf-Hisab-Actor-Id', 1));
        $sale = $this->service->createSale($company, $actor, $payload);

        return response()->json(['data' => [
            'id' => $sale->id,
            'date' => $sale->transaction_date?->toDateString(),
            'reference' => $sale->reference,
            'reason' => $sale->reason,
            'item_count' => 1,
            'status' => $sale->status,
            'code' => $sale->inventoryItem?->code,
            'product_name' => $sale->inventoryItem?->product_name,
            'quantity' => abs((float) $sale->quantity_delta),
            'source' => 'purchase',
            'recorded_by' => $sale->recorder?->name,
            'journal_entry_number' => $sale->journalEntry?->entry_number,
            'inventory_account_code' => $sale->inventoryItem?->inventoryAccount?->code,
            'inventory_account_name' => $sale->inventoryItem?->inventoryAccount?->name,
            'attachments' => $sale->attachments ?? [],
            'document_links' => $sale->document_links ?? [],
            'transaction_type' => $sale->transaction_type,
        ]], 201);
    }
}