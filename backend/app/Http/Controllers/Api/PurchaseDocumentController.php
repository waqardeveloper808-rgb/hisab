<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CostCenter;
use App\Models\Document;
use App\Services\PurchaseDocumentService;
use App\Services\ReversalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PurchaseDocumentController extends Controller
{
    use ResolvesCompanyAccess;

    public function __construct(
        private readonly PurchaseDocumentService $purchaseDocumentService,
        private readonly ReversalService $reversalService,
    ) {
    }

    public function index(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.purchases.manage');

        $payload = $request->validate([
            'status' => ['nullable', 'string', 'max:40'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['vendor_bill', 'purchase_invoice', 'purchase_credit_note', 'purchase_order'])
            ->with('contact:id,display_name')
            ->orderByDesc('issue_date')
            ->orderByDesc('id');

        if (! empty($payload['status'])) {
            $query->where('status', $payload['status']);
        }

        return response()->json([
            'data' => $query->limit($payload['limit'] ?? 50)->get(),
        ]);
    }

    public function store(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.purchases.manage');

        $payload = $this->validatePayload($request);
        $document = $this->purchaseDocumentService->createDraft($company, $request->user(), $payload);

        return response()->json(['data' => $document], 201);
    }

    public function update(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.purchases.manage');
        $this->ensureDocumentOwnership($company, $document);

        $payload = $this->validatePayload($request, false);
        $updated = $this->purchaseDocumentService->updateDraft($company, $document, $request->user(), $payload);

        return response()->json(['data' => $updated]);
    }

    public function show(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.purchases.manage');
        $this->ensureDocumentOwnership($company, $document);

        return response()->json(['data' => $document->load('lines')]);
    }

    public function finalize(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.purchases.manage');
        $this->ensureDocumentOwnership($company, $document);

        $finalized = $this->purchaseDocumentService->finalize($company, $document, $request->user());

        return response()->json(['data' => $finalized]);
    }

    public function issueCreditNote(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.purchases.manage');
        $this->ensureDocumentOwnership($company, $document);

        $payload = $request->validate([
            'issue_date' => ['nullable', 'date'],
            'supply_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'lines' => ['nullable', 'array'],
            'lines.*.source_line_id' => ['required', 'integer'],
            'lines.*.quantity' => ['required', 'numeric', 'gt:0'],
            'lines.*.description' => ['nullable', 'string'],
            'lines.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'lines.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $creditNote = $this->purchaseDocumentService->issueCreditNote($company, $document, $request->user(), $payload);

        return response()->json(['data' => $creditNote], 201);
    }

    public function void(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.purchases.manage');
        $this->ensureDocumentOwnership($company, $document);

        $payload = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $voided = $this->reversalService->voidDocument($company, $document, $request->user(), $payload['reason']);

        return response()->json(['data' => $voided]);
    }

    private function validatePayload(Request $request, bool $includeType = true): array
    {
        $rules = [
            'contact_id' => ['required', 'integer'],
            'branch_id' => ['nullable', 'integer'],
            'currency_code' => ['nullable', 'string', 'size:3'],
            'exchange_rate' => ['nullable', 'numeric', 'gt:0'],
            'issue_date' => ['nullable', 'date'],
            'supply_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'title' => ['nullable', 'string', 'max:255'],
            'template_id' => ['nullable', 'integer'],
            'cost_center_id' => ['nullable', 'integer'],
            'language_code' => ['nullable', 'in:en,ar'],
            'custom_fields' => ['nullable', 'array'],
            'purchase_context' => ['nullable', 'array'],
            'purchase_context.type' => ['nullable', 'string', 'max:80'],
            'purchase_context.purpose' => ['nullable', 'string', 'max:80'],
            'purchase_context.category' => ['nullable', 'string', 'max:80'],
            'attachments' => ['nullable', 'array'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.custom_fields' => ['nullable', 'array'],
            'lines.*.item_id' => ['nullable', 'integer'],
            'lines.*.description' => ['nullable', 'string'],
            'lines.*.quantity' => ['required', 'numeric', 'gt:0'],
            'lines.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'lines.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'lines.*.tax_category_id' => ['nullable', 'integer'],
            'lines.*.ledger_account_id' => ['nullable', 'integer'],
            'lines.*.cost_center_id' => ['nullable', 'integer'],
        ];

        if ($includeType) {
            $rules['type'] = ['required', 'in:vendor_bill,purchase_invoice,purchase_order'];
        }

        $payload = $request->validate($rules);

        if (! empty($payload['cost_center_id'])) {
            CostCenter::query()->where('company_id', $request->route('company')->id)->findOrFail($payload['cost_center_id']);
        }

        foreach ($payload['lines'] ?? [] as $index => $line) {
            if (! empty($line['cost_center_id'])) {
                $exists = CostCenter::query()
                    ->where('company_id', $request->route('company')->id)
                    ->whereKey($line['cost_center_id'])
                    ->exists();

                if (! $exists) {
                    throw ValidationException::withMessages([
                        "lines.$index.cost_center_id" => 'This cost center does not belong to the current company.',
                    ]);
                }
            }
        }

        return $payload;
    }
}