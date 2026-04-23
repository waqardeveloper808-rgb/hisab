<?php

namespace App\Services\Intelligence;

use App\Models\Company;
use App\Models\Document;

class SmartTriggerService
{
    public function buildDocumentSnapshot(Company $company, Document $document, array $intelligence): array
    {
        return [
            'company_id' => $company->id,
            'document_id' => $document->id,
            'document_type' => $document->type,
            'status' => $document->status,
            'suggestion_count' => count($intelligence['suggestions'] ?? []),
            'anomaly_count' => count($intelligence['anomalies'] ?? []),
            'reminder_count' => count($intelligence['reminders'] ?? []),
            'confidence_score' => $intelligence['confidenceScore'] ?? 0,
            'captured_at' => now()->toIso8601String(),
        ];
    }
}