<?php

namespace App\Services\Intelligence;

class AnomalyDetector
{
    public function forTransaction(array $payload, array $patterns): array
    {
        $anomalies = [];
        $descriptions = [];

        foreach ($payload['lines'] ?? [] as $line) {
            $description = strtolower(trim((string) ($line['description'] ?? '')));
            if ($description !== '' && in_array($description, $descriptions, true)) {
                $anomalies[] = [
                    'severity' => 'warning',
                    'message' => sprintf('Duplicate line description detected: %s', $line['description']),
                    'confidence' => 81,
                ];
            }

            if (($line['quantity'] ?? 0) > 0 && ($line['unit_price'] ?? 0) > 0 && (($line['quantity'] * $line['unit_price']) > 50000)) {
                $anomalies[] = [
                    'severity' => 'warning',
                    'message' => sprintf('High line value detected for %s.', $line['description'] ?? 'unnamed line'),
                    'confidence' => 77,
                ];
            }

            if ($description !== '') {
                $descriptions[] = $description;
            }
        }

        if (empty($payload['contact_id'])) {
            $anomalies[] = [
                'severity' => 'critical',
                'message' => 'No customer or supplier is selected.',
                'confidence' => 96,
            ];
        }

        if (! empty($payload['issue_date']) && ! empty($payload['due_date']) && $payload['due_date'] < $payload['issue_date']) {
            $anomalies[] = [
                'severity' => 'critical',
                'message' => 'Due date precedes issue date.',
                'confidence' => 99,
            ];
        }

        if (($patterns['average_total'] ?? 0) > 0 && ($payload['line_total'] ?? 0) > (($patterns['average_total'] ?? 0) * 2)) {
            $anomalies[] = [
                'severity' => 'warning',
                'message' => 'Document total is significantly above the recent pattern for this workflow.',
                'confidence' => 74,
            ];
        }

        return $anomalies;
    }

    public function forReports(array $metrics, array $patterns): array
    {
        $anomalies = [];

        if (($metrics['net_profit'] ?? 0) < 0) {
            $anomalies[] = [
                'severity' => 'warning',
                'message' => 'Current period is operating at a loss.',
                'confidence' => 90,
            ];
        }

        if (($metrics['vat_balance'] ?? 0) > 10000) {
            $anomalies[] = [
                'severity' => 'warning',
                'message' => 'VAT payable is large enough to require a source-document review before filing.',
                'confidence' => 79,
            ];
        }

        if (($patterns['overdue_receivables'] ?? 0) > 0) {
            $anomalies[] = [
                'severity' => 'warning',
                'message' => 'Overdue receivables exist in the current reporting set.',
                'confidence' => 84,
            ];
        }

        return $anomalies;
    }
}