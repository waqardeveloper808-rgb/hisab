<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Communication;
use App\Models\Company;
use App\Models\Document;
use App\Services\Communication\CommunicationRetryService;
use App\Services\Communication\CommunicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunicationController extends Controller
{
    use ResolvesCompanyAccess;

    public function __construct(
        private readonly CommunicationService $communicationService,
        private readonly CommunicationRetryService $retryService,
    ) {
    }

    public function index(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAccess($request->user(), $company);

        $payload = $request->validate([
            'source_type' => ['nullable', 'string', 'max:60'],
            'source_id' => ['nullable', 'integer'],
            'channel' => ['nullable', 'string', 'max:30'],
            'status' => ['nullable', 'string', 'max:30'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        return response()->json([
            'data' => $this->communicationService->list($company, $payload),
        ]);
    }

    public function store(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAccess($request->user(), $company);

        $payload = $request->validate([
            'channel' => ['required', 'in:email,in_app'],
            'source_type' => ['nullable', 'string', 'max:60'],
            'source_id' => ['nullable', 'integer'],
            'source_record_type' => ['nullable', 'string', 'max:60'],
            'contact_id' => ['nullable', 'integer'],
            'template_id' => ['nullable', 'integer'],
            'email' => ['nullable', 'email:rfc', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'body_html' => ['nullable', 'string'],
            'body_text' => ['nullable', 'string'],
            'variables' => ['nullable', 'array'],
        ]);

        if (($payload['source_type'] ?? null) === 'document' && ! empty($payload['source_id'])) {
            $document = Document::query()->where('company_id', $company->id)->findOrFail($payload['source_id']);

            return response()->json([
                'data' => $this->communicationService->sendDocument($request->user(), $company, $document, $payload),
            ], 201);
        }

        return response()->json([
            'data' => $this->communicationService->createGeneric($request->user(), $company, $payload),
        ], 201);
    }

    public function show(Request $request, Company $company, Communication $communication): JsonResponse
    {
        $this->ensureCompanyAccess($request->user(), $company);
        abort_unless($communication->company_id === $company->id, 404);

        return response()->json([
            'data' => $communication->load(['attempts', 'template', 'contact', 'creator']),
        ]);
    }

    public function retry(Request $request, Company $company, Communication $communication): JsonResponse
    {
        $this->ensureCompanyAccess($request->user(), $company);
        abort_unless($communication->company_id === $company->id, 404);

        return response()->json([
            'data' => $this->retryService->retry($communication),
        ]);
    }

    public function cancel(Request $request, Company $company, Communication $communication): JsonResponse
    {
        $this->ensureCompanyAccess($request->user(), $company);
        abort_unless($communication->company_id === $company->id, 404);

        $communication->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return response()->json([
            'data' => $communication->fresh(['attempts', 'template', 'contact', 'creator']),
        ]);
    }

    public function timeline(Request $request, Company $company, string $sourceType, int $sourceId): JsonResponse
    {
        $this->ensureCompanyAccess($request->user(), $company);

        return response()->json([
            'data' => $this->communicationService->timeline($company, $sourceType, $sourceId),
        ]);
    }
}