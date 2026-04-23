<?php

namespace App\Services\Communication;

use App\Jobs\DispatchCommunicationJob;
use App\Models\Communication;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Document;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CommunicationService
{
    public function __construct(
        private readonly CommunicationResolverService $resolver,
        private readonly CommunicationLearningService $learningService,
        private readonly CommunicationTimelineService $timelineService,
    ) {
    }

    public function sendDocument(User $actor, Company $company, Document $document, array $payload): Communication
    {
        $document->loadMissing('contact');
        $recipient = $this->resolver->resolveRecipient($document->contact, $payload);

        abort_if(! $recipient['address'], 422, 'A target email address is required to send this document.');

        $template = $this->resolver->resolveTemplate($company, 'email', 'document', $payload);
        $content = $this->resolver->resolveDocumentContent($company, $document, $payload, $template);

        $existing = $this->findDuplicate($company->id, 'document', $document->id, 'email', (string) $recipient['address'], (string) $content['subject']);
        if ($existing) {
            return $existing->load(['attempts', 'template', 'contact', 'creator']);
        }

        $communication = DB::transaction(function () use ($actor, $company, $document, $recipient, $content, $template): Communication {
            $record = Communication::query()->create([
                'company_id' => $company->id,
                'contact_id' => $document->contact_id,
                'template_id' => $template?->id,
                'created_by' => $actor->id,
                'source_type' => 'document',
                'source_id' => $document->id,
                'source_record_type' => $document->type,
                'channel' => 'email',
                'direction' => 'outbound',
                'status' => 'queued',
                'target_address' => $recipient['address'],
                'target_name' => $recipient['name'],
                'subject' => $content['subject'],
                'body_html' => $content['body_html'],
                'body_text' => $content['body_text'],
                'queued_at' => now(),
                'metadata' => [
                    'template_code' => $template?->code,
                    'source_document_number' => $document->document_number,
                ],
                'learning_snapshot' => $this->learningService->snapshot($company->id, 'email', 'document', $recipient['address'], $template?->code),
            ]);

            Communication::query()->create([
                'company_id' => $company->id,
                'contact_id' => $document->contact_id,
                'template_id' => $template?->id,
                'created_by' => $actor->id,
                'source_type' => 'document',
                'source_id' => $document->id,
                'source_record_type' => $document->type,
                'channel' => 'in_app',
                'direction' => 'system',
                'status' => 'sent',
                'target_name' => $document->contact?->display_name,
                'subject' => 'Document communication logged',
                'body_text' => sprintf('Email prepared for %s via %s.', $document->document_number ?: ('Document '.$document->id), $recipient['address']),
                'dispatched_at' => now(),
                'delivered_at' => now(),
                'metadata' => [
                    'mirrors_communication_id' => $record->id,
                    'event_type' => 'document_sent',
                ],
            ]);

            $template?->update(['last_used_at' => now()]);

            return $record;
        });

        DispatchCommunicationJob::dispatchSync($communication->id);

        return $communication->fresh(['attempts', 'template', 'contact', 'creator']);
    }

    public function createGeneric(User $actor, Company $company, array $payload): Communication
    {
        $channel = (string) ($payload['channel'] ?? 'email');
        $sourceType = $payload['source_type'] ?? null;
        $contact = ! empty($payload['contact_id'])
            ? Contact::query()->where('company_id', $company->id)->findOrFail($payload['contact_id'])
            : null;
        $template = $this->resolver->resolveTemplate($company, $channel, $sourceType, $payload);
        $recipient = $this->resolver->resolveRecipient($contact, $payload);
        $content = $this->resolver->resolveGenericContent($payload, $template);

        abort_if($channel === 'email' && ! $recipient['address'], 422, 'A target email address is required for email communications.');

        $communication = Communication::query()->create([
            'company_id' => $company->id,
            'contact_id' => $contact?->id,
            'template_id' => $template?->id,
            'created_by' => $actor->id,
            'source_type' => $sourceType,
            'source_id' => $payload['source_id'] ?? null,
            'source_record_type' => $payload['source_record_type'] ?? null,
            'channel' => $channel,
            'direction' => $payload['direction'] ?? 'outbound',
            'status' => $channel === 'in_app' ? 'sent' : 'queued',
            'target_address' => $recipient['address'],
            'target_name' => $recipient['name'],
            'subject' => $content['subject'],
            'body_html' => $content['body_html'],
            'body_text' => $content['body_text'],
            'queued_at' => $channel === 'in_app' ? null : now(),
            'dispatched_at' => $channel === 'in_app' ? now() : null,
            'delivered_at' => $channel === 'in_app' ? now() : null,
            'metadata' => [
                'template_code' => $template?->code,
                'variables' => $payload['variables'] ?? [],
            ],
            'learning_snapshot' => $this->learningService->snapshot($company->id, $channel, $sourceType, $recipient['address'], $template?->code),
        ]);

        if ($channel !== 'in_app') {
            DispatchCommunicationJob::dispatchSync($communication->id);
        }

        return $communication->fresh(['attempts', 'template', 'contact', 'creator']);
    }

    public function list(Company $company, array $filters): Collection
    {
        return Communication::query()
            ->where('company_id', $company->id)
            ->when(! empty($filters['source_type']), fn ($query) => $query->where('source_type', $filters['source_type']))
            ->when(! empty($filters['source_id']), fn ($query) => $query->where('source_id', $filters['source_id']))
            ->when(! empty($filters['channel']), fn ($query) => $query->where('channel', $filters['channel']))
            ->when(! empty($filters['status']), fn ($query) => $query->where('status', $filters['status']))
            ->with(['attempts', 'template', 'contact', 'creator'])
            ->latest('id')
            ->limit((int) ($filters['limit'] ?? 50))
            ->get();
    }

    public function timeline(Company $company, string $sourceType, int $sourceId): Collection
    {
        return $this->timelineService->forSource($company, $sourceType, $sourceId);
    }

    private function findDuplicate(int $companyId, string $sourceType, int $sourceId, string $channel, string $targetAddress, string $subject): ?Communication
    {
        return Communication::query()
            ->where('company_id', $companyId)
            ->where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->where('channel', $channel)
            ->where('target_address', $targetAddress)
            ->where('subject', $subject)
            ->whereIn('status', ['queued', 'processing', 'sent'])
            ->where('created_at', '>=', now()->subMinutes(10))
            ->latest('id')
            ->first();
    }
}