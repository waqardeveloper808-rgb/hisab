<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Document;
use App\Services\ReversalService;
use App\Services\SalesDocumentService;
use App\Services\PlanLimitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalesDocumentController extends Controller
{
    use ResolvesCompanyAccess;

    public function __construct(
        private readonly SalesDocumentService $salesDocumentService,
        private readonly ReversalService $reversalService,
        private readonly PlanLimitService $planLimitService,
    ) {
    }

    public function index(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.sales.manage');

        $payload = $request->validate([
            'status' => ['nullable', 'string', 'max:40'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['quotation', 'proforma_invoice', 'tax_invoice', 'credit_note'])
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
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.sales.manage');

        $payload = $this->validatePayload($request);

        if (in_array($payload['type'], ['tax_invoice', 'cash_invoice', 'api_invoice'], true)) {
            $this->planLimitService->ensureInvoiceLimit($company);
        }

        $document = $this->salesDocumentService->createDraft($company, $request->user(), $payload);

        return response()->json(['data' => $document], 201);
    }

    public function update(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.sales.manage');
        $this->ensureDocumentOwnership($company, $document);

        $payload = $this->validatePayload($request, false);
        $updated = $this->salesDocumentService->updateDraft($company, $document, $request->user(), $payload);

        return response()->json(['data' => $updated]);
    }

    public function show(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.sales.manage');
        $this->ensureDocumentOwnership($company, $document);

        return response()->json(['data' => $document->load('lines')]);
    }

    public function finalize(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.sales.manage');
        $this->ensureDocumentOwnership($company, $document);

        $finalized = $this->salesDocumentService->finalize($company, $document, $request->user());

        return response()->json(['data' => $finalized]);
    }

    public function issueCreditNote(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.sales.manage');
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

        $creditNote = $this->salesDocumentService->issueCreditNote($company, $document, $request->user(), $payload);

        return response()->json(['data' => $creditNote], 201);
    }

    public function void(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.sales.manage');
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
            'language_code' => ['nullable', 'in:en,ar'],
            'custom_fields' => ['nullable', 'array'],
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
        ];

        if ($includeType) {
            $rules['type'] = ['required', 'in:quotation,proforma_invoice,tax_invoice,recurring_invoice,cash_invoice,api_invoice'];
        }

        return $request->validate($rules);
    }
}