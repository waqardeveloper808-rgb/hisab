<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Document;
use App\Models\Payment;
use App\Services\PaymentService;
use App\Services\ReversalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    use ResolvesCompanyAccess;

    public function __construct(
        private readonly PaymentService $paymentService,
        private readonly ReversalService $reversalService,
    ) {
    }

    public function indexForCompany(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.payments.manage');

        $payload = $request->validate([
            'direction' => ['nullable', 'in:incoming,outgoing'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Payment::query()
            ->where('company_id', $company->id)
            ->orderByDesc('payment_date')
            ->orderByDesc('id');

        if (! empty($payload['direction'])) {
            $query->where('direction', $payload['direction']);
        }

        return response()->json([
            'data' => $query->limit($payload['limit'] ?? 50)->get(),
        ]);
    }

    public function store(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.payments.manage');
        $this->ensureDocumentOwnership($company, $document);

        $payload = $request->validate([
            'amount' => ['required', 'numeric', 'gt:0'],
            'payment_date' => ['nullable', 'date'],
            'method' => ['nullable', 'string', 'max:30'],
            'reference' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string'],
            'received_into_account_id' => ['nullable', 'integer'],
            'currency_code' => ['nullable', 'string', 'size:3'],
        ]);

        $payment = $this->paymentService->recordIncomingPayment($company, $document, $request->user(), $payload);

        return response()->json(['data' => $payment], 201);
    }

    public function storeForCompany(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.payments.manage');

        $payload = $request->validate([
            'contact_id' => ['required', 'integer'],
            'branch_id' => ['nullable', 'integer'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'payment_date' => ['nullable', 'date'],
            'method' => ['nullable', 'string', 'max:30'],
            'reference' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string'],
            'received_into_account_id' => ['nullable', 'integer'],
            'currency_code' => ['nullable', 'string', 'size:3'],
            'allocations' => ['nullable', 'array'],
            'allocations.*.document_id' => ['required', 'integer'],
            'allocations.*.amount' => ['required', 'numeric', 'gt:0'],
        ]);

        $payment = $this->paymentService->recordIncomingPaymentForAllocations($company, $request->user(), $payload);

        return response()->json(['data' => $payment], 201);
    }

    public function storeOutgoingForCompany(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.payments.manage');

        $payload = $request->validate([
            'contact_id' => ['required', 'integer'],
            'branch_id' => ['nullable', 'integer'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'payment_date' => ['nullable', 'date'],
            'method' => ['nullable', 'string', 'max:30'],
            'reference' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string'],
            'received_into_account_id' => ['nullable', 'integer'],
            'currency_code' => ['nullable', 'string', 'size:3'],
            'allocations' => ['nullable', 'array'],
            'allocations.*.document_id' => ['required', 'integer'],
            'allocations.*.amount' => ['required', 'numeric', 'gt:0'],
        ]);

        $payment = $this->paymentService->recordOutgoingPaymentForAllocations($company, $request->user(), $payload);

        return response()->json(['data' => $payment], 201);
    }

    public function storeOutgoing(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.payments.manage');
        $this->ensureDocumentOwnership($company, $document);

        $payload = $request->validate([
            'amount' => ['required', 'numeric', 'gt:0'],
            'payment_date' => ['nullable', 'date'],
            'method' => ['nullable', 'string', 'max:30'],
            'reference' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string'],
            'received_into_account_id' => ['nullable', 'integer'],
            'currency_code' => ['nullable', 'string', 'size:3'],
        ]);

        $payment = $this->paymentService->recordOutgoingPayment($company, $document, $request->user(), $payload);

        return response()->json(['data' => $payment], 201);
    }

    public function applyAdvance(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.payments.manage');
        $this->ensureDocumentOwnership($company, $document);

        $payload = $request->validate([
            'amount' => ['nullable', 'numeric', 'gt:0'],
            'application_date' => ['nullable', 'date'],
        ]);

        $updatedDocument = $this->paymentService->applyCustomerAdvance($company, $document, $request->user(), $payload);

        return response()->json(['data' => $updatedDocument]);
    }

    public function applySupplierAdvance(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.payments.manage');
        $this->ensureDocumentOwnership($company, $document);

        $payload = $request->validate([
            'amount' => ['nullable', 'numeric', 'gt:0'],
            'application_date' => ['nullable', 'date'],
        ]);

        $updatedDocument = $this->paymentService->applySupplierAdvance($company, $document, $request->user(), $payload);

        return response()->json(['data' => $updatedDocument]);
    }

    public function refundCustomerAdvance(Request $request, Company $company, Contact $contact): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.payments.manage');
        $this->ensureContactOwnership($company, $contact);

        $payload = $request->validate([
            'branch_id' => ['nullable', 'integer'],
            'amount' => ['nullable', 'numeric', 'gt:0'],
            'payment_date' => ['nullable', 'date'],
            'method' => ['nullable', 'string', 'max:30'],
            'reference' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string'],
            'received_into_account_id' => ['nullable', 'integer'],
            'currency_code' => ['nullable', 'string', 'size:3'],
        ]);

        $payment = $this->paymentService->refundCustomerAdvance($company, $contact->id, $request->user(), $payload);

        return response()->json(['data' => $payment], 201);
    }

    public function refundSupplierAdvance(Request $request, Company $company, Contact $contact): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.payments.manage');
        $this->ensureContactOwnership($company, $contact);

        $payload = $request->validate([
            'branch_id' => ['nullable', 'integer'],
            'amount' => ['nullable', 'numeric', 'gt:0'],
            'payment_date' => ['nullable', 'date'],
            'method' => ['nullable', 'string', 'max:30'],
            'reference' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string'],
            'received_into_account_id' => ['nullable', 'integer'],
            'currency_code' => ['nullable', 'string', 'size:3'],
        ]);

        $payment = $this->paymentService->refundSupplierAdvance($company, $contact->id, $request->user(), $payload);

        return response()->json(['data' => $payment], 201);
    }

    public function void(Request $request, Company $company, Payment $payment): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.payments.manage');
        $this->ensurePaymentOwnership($company, $payment);

        $payload = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $voided = $this->reversalService->voidPayment($company, $payment, $request->user(), $payload['reason']);

        return response()->json(['data' => $voided]);
    }
}