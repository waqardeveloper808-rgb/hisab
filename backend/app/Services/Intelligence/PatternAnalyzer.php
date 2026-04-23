<?php

namespace App\Services\Intelligence;

use App\Models\Company;
use App\Models\Document;

class PatternAnalyzer
{
    public function transactionPatterns(Company $company, array $payload): array
    {
        $contactId = $payload['contact_id'] ?? null;
        $documentType = (string) ($payload['document_type'] ?? '');
        $recentDocuments = Document::query()
            ->where('company_id', $company->id)
            ->when($contactId, fn ($query) => $query->where('contact_id', $contactId))
            ->when($documentType !== '', fn ($query) => $query->where('type', $documentType))
            ->latest('issue_date')
            ->limit(10)
            ->get(['id', 'document_number', 'contact_id', 'type', 'issue_date', 'due_date', 'grand_total']);

        $lineDescriptions = collect($payload['lines'] ?? [])
            ->map(fn (array $line) => strtolower(trim((string) ($line['description'] ?? ''))))
            ->filter()
            ->values();

        return [
            'recent_documents' => $recentDocuments->map(fn (Document $document) => [
                'document_number' => $document->document_number,
                'issue_date' => $document->issue_date,
                'due_date' => $document->due_date,
                'grand_total' => (float) $document->grand_total,
            ])->all(),
            'matching_descriptions' => $recentDocuments
                ->filter(fn (Document $document) => $lineDescriptions->contains(fn (string $description) => str_contains(strtolower((string) $document->document_number), $description)))
                ->count(),
            'recent_document_count' => $recentDocuments->count(),
            'average_total' => round((float) $recentDocuments->avg('grand_total'), 2),
        ];
    }

    public function reportPatterns(Company $company): array
    {
        $openReceivables = Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['tax_invoice', 'debit_note'])
            ->where('balance_due', '>', 0)
            ->count();
        $overdueReceivables = Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['tax_invoice', 'debit_note'])
            ->where('balance_due', '>', 0)
            ->whereDate('due_date', '<', now()->toDateString())
            ->count();
        $openPayables = Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['vendor_bill', 'purchase_invoice'])
            ->where('balance_due', '>', 0)
            ->count();

        return [
            'open_receivables' => $openReceivables,
            'overdue_receivables' => $overdueReceivables,
            'open_payables' => $openPayables,
        ];
    }
}