<?php

namespace App\Services\Communication;

use App\Models\Communication;
use App\Models\CommunicationAttempt;
use App\Models\Document;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Throwable;

class CommunicationDispatchService
{
    public function __construct(
        private readonly CommunicationLearningService $learningService,
    ) {
    }

    public function dispatch(Communication $communication): Communication
    {
        if ($communication->status === 'cancelled') {
            return $communication;
        }

        $communication->update([
            'status' => 'processing',
            'queued_at' => $communication->queued_at ?? now(),
            'last_attempt_at' => now(),
        ]);

        $attempt = CommunicationAttempt::query()->create([
            'communication_id' => $communication->id,
            'attempt_number' => $communication->attempts()->count() + 1,
            'channel' => $communication->channel,
            'transport' => $communication->channel === 'email' ? 'mail' : 'internal',
            'status' => 'processing',
            'target_address' => $communication->target_address,
            'subject' => $communication->subject,
            'attempted_at' => now(),
        ]);

        try {
            if ($communication->channel === 'email') {
                Mail::html($communication->body_html ?: nl2br(e($communication->body_text ?: '')), function ($message) use ($communication): void {
                    $message->to($communication->target_address)->subject($communication->subject ?: 'Communication from Gulf Hisab');
                });
            }

            $attempt->update([
                'status' => 'sent',
                'completed_at' => now(),
            ]);

            $communication->update([
                'status' => 'sent',
                'dispatched_at' => $communication->dispatched_at ?? now(),
                'delivered_at' => now(),
                'failed_at' => null,
            ]);

            $this->markDocumentIfNeeded($communication);
            $this->learningService->recordOutcome($communication->fresh(), 'sent');
        } catch (Throwable $throwable) {
            $attempt->update([
                'status' => 'failed',
                'error_code' => 'dispatch_failed',
                'error_message' => $throwable->getMessage(),
                'completed_at' => now(),
            ]);

            $communication->update([
                'status' => 'failed',
                'failed_at' => now(),
            ]);

            $this->learningService->recordOutcome($communication->fresh(), 'failed', $throwable->getMessage());

            throw $throwable;
        }

        return $communication->fresh(['attempts', 'template', 'contact', 'creator']);
    }

    private function markDocumentIfNeeded(Communication $communication): void
    {
        if ($communication->channel !== 'email' || $communication->source_type !== 'document' || ! $communication->source_id) {
            return;
        }

        $document = Document::query()
            ->where('company_id', $communication->company_id)
            ->find($communication->source_id);

        if (! $document) {
            return;
        }

        DB::transaction(function () use ($document, $communication): void {
            $document->update([
                'sent_at' => now(),
                'sent_to_email' => $communication->target_address,
                'sent_via' => 'email',
            ]);
        });
    }
}