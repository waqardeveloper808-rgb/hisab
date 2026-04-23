<?php

namespace App\Services\Intelligence;

use App\Models\Company;
use App\Models\Document;

class IntelligenceEngine
{
    public function __construct(
        private readonly PatternAnalyzer $patternAnalyzer,
        private readonly SuggestionEngine $suggestionEngine,
        private readonly AnomalyDetector $anomalyDetector,
        private readonly ConfidenceScorer $confidenceScorer,
    ) {
    }

    public function forTransaction(Company $company, array $payload): array
    {
        $lineTotal = collect($payload['lines'] ?? [])->sum(fn (array $line) => ((float) ($line['quantity'] ?? 0)) * ((float) ($line['unit_price'] ?? 0)));
        $normalized = [
            ...$payload,
            'line_total' => round($lineTotal, 2),
        ];

        $patterns = $this->patternAnalyzer->transactionPatterns($company, $normalized);
        $suggestions = $this->suggestionEngine->forTransaction($normalized, $patterns);
        $anomalies = $this->anomalyDetector->forTransaction($normalized, $patterns);
        $reminders = [];

        if (($payload['payment_amount'] ?? 0) == 0 && $lineTotal > 0) {
            $reminders[] = [
                'label' => 'Unpaid invoice follow-up',
                'reason' => 'No payment amount is recorded for a commercial document with value.',
                'priority' => $lineTotal > 5000 ? 'high' : 'medium',
            ];
        }

        if (($payload['document_type'] ?? null) === 'recurring_invoice') {
            $reminders[] = [
                'label' => 'Recurring schedule review',
                'reason' => 'Recurring invoices should be checked for due-date and customer alignment before release.',
                'priority' => 'medium',
            ];
        }

        $criticalAnomalies = collect($anomalies)->where('severity', 'critical')->count();

        return [
            'suggestions' => $suggestions,
            'anomalies' => $anomalies,
            'reminders' => $reminders,
            'patterns' => $patterns,
            'confidenceScore' => $this->confidenceScorer->score(count($suggestions), count($anomalies), $criticalAnomalies, count($reminders), ($patterns['recent_document_count'] ?? 0)),
        ];
    }

    public function forReports(Company $company, array $metrics): array
    {
        $patterns = $this->patternAnalyzer->reportPatterns($company);
        $suggestions = $this->suggestionEngine->forReports($metrics, $patterns);
        $anomalies = $this->anomalyDetector->forReports($metrics, $patterns);
        $reminders = [];

        if (($patterns['open_receivables'] ?? 0) > 0) {
            $reminders[] = [
                'label' => 'Receivables collection focus',
                'reason' => 'Open customer balances remain unpaid and should be reviewed from the aging register.',
                'priority' => ($patterns['overdue_receivables'] ?? 0) > 0 ? 'high' : 'medium',
            ];
        }

        if (abs((float) ($metrics['vat_balance'] ?? 0)) > 0) {
            $reminders[] = [
                'label' => 'VAT filing review',
                'reason' => 'Posted VAT movement is available and should be validated before filing.',
                'priority' => abs((float) ($metrics['vat_balance'] ?? 0)) > 10000 ? 'high' : 'medium',
            ];
        }

        $criticalAnomalies = collect($anomalies)->where('severity', 'critical')->count();

        return [
            'suggestions' => $suggestions,
            'anomalies' => $anomalies,
            'reminders' => $reminders,
            'patterns' => $patterns,
            'confidenceScore' => $this->confidenceScorer->score(count($suggestions), count($anomalies), $criticalAnomalies, count($reminders)),
        ];
    }

    public function overview(Company $company): array
    {
        $metrics = [
            'open_documents' => Document::query()->where('company_id', $company->id)->where('balance_due', '>', 0)->count(),
            'overdue_documents' => Document::query()->where('company_id', $company->id)->where('balance_due', '>', 0)->whereDate('due_date', '<', now()->toDateString())->count(),
        ];

        $reportSignals = $this->forReports($company, [
            'net_profit' => 0,
            'vat_balance' => 0,
        ]);

        return [
            ...$reportSignals,
            'metrics' => $metrics,
        ];
    }
}