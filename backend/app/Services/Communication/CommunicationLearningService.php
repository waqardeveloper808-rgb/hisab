<?php

namespace App\Services\Communication;

use App\Models\Communication;
use Illuminate\Support\Facades\DB;

class CommunicationLearningService
{
    public function snapshot(int $companyId, string $channel, ?string $sourceType, ?string $targetAddress, ?string $templateCode): array
    {
        $recipientDomain = $this->recipientDomain($targetAddress);
        $rows = DB::table('communication_learning_signals')
            ->where('company_id', $companyId)
            ->where('channel', $channel)
            ->where('signal_key', 'delivery')
            ->when($sourceType, fn ($query) => $query->where('source_type', $sourceType))
            ->when($recipientDomain, fn ($query) => $query->where('recipient_domain', $recipientDomain))
            ->when($templateCode, fn ($query) => $query->where('template_code', $templateCode))
            ->get(['success_count', 'failure_count', 'last_status', 'learned_at']);

        return [
            'recipient_domain' => $recipientDomain,
            'success_count' => (int) $rows->sum('success_count'),
            'failure_count' => (int) $rows->sum('failure_count'),
            'last_status' => $rows->sortByDesc('learned_at')->first()->last_status ?? null,
        ];
    }

    public function recordOutcome(Communication $communication, string $status, ?string $reason = null): void
    {
        $metadata = $communication->metadata ?? [];
        $templateCode = data_get($metadata, 'template_code');
        $recipientDomain = $this->recipientDomain($communication->target_address);

        $key = [
            'company_id' => $communication->company_id,
            'channel' => $communication->channel,
            'source_type' => $communication->source_type,
            'recipient_domain' => $recipientDomain,
            'template_code' => $templateCode,
            'signal_key' => 'delivery',
        ];

        $existing = DB::table('communication_learning_signals')->where($key)->first();

        DB::table('communication_learning_signals')->updateOrInsert($key, [
            'success_count' => ($existing?->success_count ?? 0) + ($status === 'sent' ? 1 : 0),
            'failure_count' => ($existing?->failure_count ?? 0) + ($status === 'failed' ? 1 : 0),
            'last_status' => $status,
            'last_reason' => $reason,
            'metadata' => json_encode(['communication_id' => $communication->id], JSON_UNESCAPED_SLASHES),
            'learned_at' => now(),
            'updated_at' => now(),
            'created_at' => $existing?->created_at ?? now(),
        ]);
    }

    private function recipientDomain(?string $targetAddress): ?string
    {
        if (! $targetAddress || ! str_contains($targetAddress, '@')) {
            return null;
        }

        return strtolower((string) substr(strrchr($targetAddress, '@'), 1));
    }
}