<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Document;
use App\Services\DocumentTemplateRendererService;
use App\Services\DocumentWorkflowService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class DocumentCenterController extends Controller
{
    use ResolvesCompanyAccess;

    public function __construct(
        private readonly DocumentTemplateRendererService $renderer,
        private readonly DocumentWorkflowService $workflow,
    ) {
    }

    public function index(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAccess($request->user(), $company);

        $payload = $request->validate([
            'group' => ['nullable', 'in:all,sales,purchase'],
            'type' => ['nullable', 'string', 'max:40'],
            'status' => ['nullable', 'string', 'max:40'],
            'search' => ['nullable', 'string', 'max:255'],
            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date'],
            'min_total' => ['nullable', 'numeric', 'min:0'],
            'max_total' => ['nullable', 'numeric', 'min:0'],
            'sort' => ['nullable', 'in:issue_date,document_number,grand_total,status'],
            'direction' => ['nullable', 'in:asc,desc'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Document::query()
            ->where('company_id', $company->id)
            ->with(['contact:id,display_name,email', 'template:id,name'])
            ->orderBy($payload['sort'] ?? 'issue_date', $payload['direction'] ?? 'desc')
            ->orderByDesc('id');

        if (($payload['group'] ?? 'all') === 'sales') {
            $query->whereIn('type', ['quotation', 'proforma_invoice', 'tax_invoice', 'credit_note', 'recurring_invoice', 'cash_invoice', 'api_invoice']);
        }

        if (($payload['group'] ?? 'all') === 'purchase') {
            $query->whereIn('type', ['vendor_bill', 'purchase_invoice', 'purchase_credit_note', 'purchase_order', 'debit_note']);
        }

        if (! empty($payload['type'])) {
            $query->where('type', $payload['type']);
        }

        if (! empty($payload['status'])) {
            $query->where('status', $payload['status']);
        }

        if (! empty($payload['from_date'])) {
            $query->whereDate('issue_date', '>=', $payload['from_date']);
        }

        if (! empty($payload['to_date'])) {
            $query->whereDate('issue_date', '<=', $payload['to_date']);
        }

        if (array_key_exists('min_total', $payload)) {
            $query->where('grand_total', '>=', $payload['min_total']);
        }

        if (array_key_exists('max_total', $payload)) {
            $query->where('grand_total', '<=', $payload['max_total']);
        }

        if (! empty($payload['search'])) {
            $search = '%'.$payload['search'].'%';
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('document_number', 'like', $search)
                    ->orWhere('title', 'like', $search)
                    ->orWhere('notes', 'like', $search)
                    ->orWhereHas('contact', fn ($contactQuery) => $contactQuery->where('display_name', 'like', $search));
            });
        }

        return response()->json([
            'data' => $query->limit($payload['limit'] ?? 80)->get(),
        ]);
    }

    public function show(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAccess($request->user(), $company);
        $this->ensureDocumentOwnership($company, $document);

        return response()->json([
            'data' => $document->load(['lines', 'contact', 'template.logoAsset']),
        ]);
    }

    public function preview(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAccess($request->user(), $company);
        $this->ensureDocumentOwnership($company, $document);

        $payload = $request->validate([
            'template_id' => ['nullable', 'integer'],
        ]);

        $document->load(['lines', 'contact', 'template.logoAsset']);

        $templateOverride = null;

        if (! empty($payload['template_id'])) {
            $templateOverride = $company->documentTemplates()->with('logoAsset')->findOrFail($payload['template_id']);
        }

        return response()->json([
            'data' => [
                'html' => $this->renderer->renderHtml($company, $document, $templateOverride),
            ],
        ]);
    }

    public function exportPdf(Request $request, Company $company, Document $document)
    {
        $this->ensureCompanyAccess($request->user(), $company);
        $this->ensureDocumentOwnership($company, $document);

        $document->load(['lines', 'contact', 'template.logoAsset']);

        return Pdf::loadHTML($this->renderer->renderHtml($company, $document))
            ->download(($document->document_number ?: 'document-'.$document->id).'.pdf');
    }

    public function send(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAccess($request->user(), $company);
        $this->ensureDocumentOwnership($company, $document);

        $payload = $request->validate([
            'email' => ['nullable', 'email:rfc', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
        ]);

        $document->load(['lines', 'contact', 'template.logoAsset']);
        $targetEmail = $payload['email'] ?? $document->contact?->email;

        if (! $targetEmail) {
            abort(422, 'A target email address is required to send this document.');
        }

        Mail::html($this->renderer->renderHtml($company, $document), function ($message) use ($targetEmail, $payload, $document): void {
            $message
                ->to($targetEmail)
                ->subject($payload['subject'] ?? ($document->document_number ?: 'Document from Gulf Hisab'));
        });

        $document->update([
            'sent_at' => now(),
            'sent_to_email' => $targetEmail,
            'sent_via' => 'email',
        ]);

        return response()->json(['data' => $document->fresh()]);
    }

    public function duplicate(Request $request, Company $company, Document $document): JsonResponse
    {
        $this->ensureCompanyAccess($request->user(), $company);
        $this->ensureDocumentOwnership($company, $document);

        return response()->json([
            'data' => $this->workflow->duplicateAsDraft($company, $document, $request->user()),
        ], 201);
    }
}