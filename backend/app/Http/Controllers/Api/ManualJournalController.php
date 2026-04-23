<?php

namespace App\Http\Controllers\Api;

use App\Models\Company;
use App\Models\JournalEntry;
use App\Models\User;
use App\Services\ManualJournalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManualJournalController
{
    public function __construct(private readonly ManualJournalService $service) {}

    public function index(Company $company, Request $request): JsonResponse
    {
        $query = JournalEntry::query()
            ->where('company_id', $company->id)
            ->with(['lines.account', 'lines.document', 'creator:id,name'])
            ->orderByDesc('entry_date')
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('source_type')) {
            $query->where('source_type', $request->input('source_type'));
        }

        if ($request->filled('from_date')) {
            $query->whereDate('entry_date', '>=', $request->input('from_date'));
        }

        if ($request->filled('to_date')) {
            $query->whereDate('entry_date', '<=', $request->input('to_date'));
        }

        if ($request->filled('document_number')) {
            $documentNumber = $request->input('document_number');
            $query->where(function ($journalQuery) use ($documentNumber) {
                $journalQuery->where('reference', $documentNumber)
                    ->orWhere('description', 'like', '%'.$documentNumber.'%')
                    ->orWhereHas('lines.document', fn ($documentQuery) => $documentQuery->where('document_number', $documentNumber));
            });
        }

        $entries = $query->paginate($request->integer('per_page', 50));

        $mapped = $entries->through(function (JournalEntry $entry) {
            $documentNumber = $entry->metadata['document_number']
                ?? $entry->lines->pluck('document.document_number')->filter()->first();
            $documentNumbers = $entry->lines->pluck('document.document_number')->filter()->unique()->values()->all();

            return [
                'id' => $entry->id,
                'uuid' => $entry->uuid,
                'entry_number' => $entry->entry_number,
                'status' => $entry->status,
                'entry_date' => $entry->entry_date?->toDateString(),
                'posting_date' => $entry->posting_date?->toDateString(),
                'source_type' => $entry->source_type,
                'source_id' => $entry->source_id,
                'document_number' => $documentNumber,
                'document_numbers' => $documentNumbers,
                'reference' => $entry->reference,
                'description' => $entry->description,
                'memo' => $entry->memo,
                'metadata' => $entry->metadata,
                'created_by_name' => $entry->creator?->name,
                'posted_at' => $entry->posted_at?->toIso8601String(),
                'created_by' => $entry->created_by,
                'posted_by' => $entry->posted_by,
                'reversed_from_id' => $entry->reversed_from_id,
                'lines' => $entry->lines->map(fn ($l) => [
                    'id' => $l->id,
                    'line_no' => $l->line_no,
                    'account_id' => $l->account_id,
                    'account_code' => $l->account?->code,
                    'account_name' => $l->account?->name,
                    'contact_id' => $l->contact_id,
                    'document_id' => $l->document_id,
                    'document_number' => $l->document?->document_number,
                    'document_type' => $l->document?->type,
                    'document_status' => $l->document?->status,
                    'cost_center_id' => $l->cost_center_id,
                    'inventory_item_id' => $l->inventory_item_id,
                    'description' => $l->description,
                    'debit' => (float) $l->debit,
                    'credit' => (float) $l->credit,
                    'tax_code' => $l->tax_code,
                ]),
                'total_debit' => $entry->lines->sum(fn ($l) => (float) $l->debit),
                'total_credit' => $entry->lines->sum(fn ($l) => (float) $l->credit),
            ];
        });

        return response()->json($mapped);
    }

    public function store(Company $company, Request $request): JsonResponse
    {
        $request->validate([
            'entry_date' => 'required|date',
            'posting_date' => 'nullable|date',
            'reference' => 'nullable|string|max:80',
            'description' => 'nullable|string',
            'memo' => 'nullable|string',
            'metadata' => 'nullable|array',
            'status' => 'in:draft,posted',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|integer|exists:accounts,id',
            'lines.*.debit' => 'nullable|numeric|min:0',
            'lines.*.credit' => 'nullable|numeric|min:0',
            'lines.*.contact_id' => 'nullable|integer',
            'lines.*.document_id' => 'nullable|integer',
            'lines.*.inventory_item_id' => 'nullable|integer',
            'lines.*.cost_center_id' => 'nullable|integer',
            'lines.*.description' => 'nullable|string',
            'lines.*.tax_code' => 'nullable|string|max:30',
        ]);

        $actor = User::findOrFail($request->header('X-Gulf-Hisab-Actor-Id', 1));

        $journal = $this->service->createJournal($company, $actor, $request->all());

        return response()->json(['data' => $journal->load('lines')], 201);
    }

    public function show(Company $company, JournalEntry $journal): JsonResponse
    {
        if ((int) $journal->company_id !== (int) $company->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $journal->load(['lines.account', 'lines.document', 'creator:id,name']);

        return response()->json(['data' => [
            'document_number' => $journal->metadata['document_number']
                ?? $journal->lines->pluck('document.document_number')->filter()->first(),
            'document_numbers' => $journal->lines->pluck('document.document_number')->filter()->unique()->values()->all(),
            'id' => $journal->id,
            'uuid' => $journal->uuid,
            'entry_number' => $journal->entry_number,
            'status' => $journal->status,
            'entry_date' => $journal->entry_date?->toDateString(),
            'posting_date' => $journal->posting_date?->toDateString(),
            'source_type' => $journal->source_type,
            'source_id' => $journal->source_id,
            'reference' => $journal->reference,
            'description' => $journal->description,
            'memo' => $journal->memo,
            'metadata' => $journal->metadata,
            'created_by_name' => $journal->creator?->name,
            'reversed_from_id' => $journal->reversed_from_id,
            'lines' => $journal->lines->map(fn ($l) => [
                'id' => $l->id,
                'line_no' => $l->line_no,
                'account_id' => $l->account_id,
                'account_code' => $l->account?->code,
                'account_name' => $l->account?->name,
                'contact_id' => $l->contact_id,
                'document_id' => $l->document_id,
                'document_number' => $l->document?->document_number,
                'document_type' => $l->document?->type,
                'document_status' => $l->document?->status,
                'description' => $l->description,
                'debit' => (float) $l->debit,
                'credit' => (float) $l->credit,
            ]),
        ]]);
    }

    public function post(Company $company, JournalEntry $journal, Request $request): JsonResponse
    {
        $actor = User::findOrFail($request->header('X-Gulf-Hisab-Actor-Id', 1));
        $journal = $this->service->postJournal($company, $journal, $actor);

        return response()->json(['data' => $journal]);
    }

    public function reverse(Company $company, JournalEntry $journal, Request $request): JsonResponse
    {
        $actor = User::findOrFail($request->header('X-Gulf-Hisab-Actor-Id', 1));
        $reversal = $this->service->reverseJournal(
            $company,
            $journal,
            $actor,
            $request->input('reversal_date'),
        );

        return response()->json(['data' => $reversal]);
    }
}
