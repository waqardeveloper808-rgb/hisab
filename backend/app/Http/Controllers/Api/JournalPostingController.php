<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\AccountingControlException;
use App\Models\Company;
use App\Models\User;
use App\Services\JournalPostingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JournalPostingController
{
    public function __construct(private readonly JournalPostingService $service)
    {
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'company_id' => 'required|integer|exists:companies,id',
            'source_type' => 'required|string',
            'source_id' => 'required|uuid',
            'entry_date' => 'nullable|date',
            'description' => 'nullable|string',
            'entries' => 'required|array|min:1',
            'entries.*.account_id' => 'required|integer',
            'entries.*.debit' => 'nullable|numeric|min:0',
            'entries.*.credit' => 'nullable|numeric|min:0',
            'entries.*.description' => 'nullable|string',
        ]);

        $company = Company::query()->findOrFail((int) $payload['company_id']);
        $actor = $request->user() instanceof User ? $request->user() : User::findOrFail((int) $request->header('X-Gulf-Hisab-Actor-Id', 1));

        if (! $company->users()->where('users.id', $actor->id)->wherePivot('is_active', true)->exists() && (int) $company->created_by !== (int) $actor->id) {
            return response()->json([
                'control_id' => 'ACC-005',
                'message' => 'The actor does not have access to post journals for this company.',
            ], 403);
        }

        try {
            $batch = $this->service->postJournal(
                $company,
                $actor,
                (string) $payload['source_type'],
                (string) $payload['source_id'],
                $payload['entries'],
                $payload['entry_date'] ?? null,
                $payload['description'] ?? null,
            );
        } catch (AccountingControlException $exception) {
            return response()->json([
                'control_id' => $exception->controlId,
                'message' => $exception->getMessage(),
            ], 422);
        }

        $journal = $batch->journals->first();

        return response()->json([
            'data' => [
                'batch_id' => $batch->id,
                'source_type' => $batch->source_type,
                'source_id' => $batch->source_id,
                'status' => $batch->status,
                'journal_id' => $journal?->id,
                'entry_number' => $journal?->entry_number,
                'lines' => $journal?->lines->map(fn ($line) => [
                    'account_id' => $line->account_id,
                    'account_code' => $line->account?->code,
                    'debit' => (float) $line->debit,
                    'credit' => (float) $line->credit,
                    'description' => $line->description,
                ])->values()->all() ?? [],
            ],
        ], 201);
    }
}