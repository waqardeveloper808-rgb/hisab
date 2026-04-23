<?php

namespace App\Services\Intelligence;

class SuggestionEngine
{
    public function forTransaction(array $payload, array $patterns): array
    {
        $suggestions = [];

        if (($patterns['recent_document_count'] ?? 0) >= 2) {
            $suggestions[] = [
                'label' => 'Reuse recurring document pattern',
                'reason' => 'This counterparty already has recent documents with a similar workflow.',
                'confidence' => 82,
            ];
        }

        if (($payload['document_type'] ?? null) === 'tax_invoice') {
            $suggestions[] = [
                'label' => 'Post invoice to VAT and receivables automatically',
                'reason' => 'Finalizing this invoice will push revenue, VAT, and receivable movement into the books.',
                'confidence' => 90,
            ];
        }

        if (($payload['document_type'] ?? null) === 'vendor_bill') {
            $suggestions[] = [
                'label' => 'Review purchase VAT recovery',
                'reason' => 'Supplier-side VAT is eligible for input VAT drill-down and filing preparation.',
                'confidence' => 86,
            ];
        }

        if (($patterns['average_total'] ?? 0) > 0 && ($payload['line_total'] ?? 0) > (($patterns['average_total'] ?? 0) * 1.25)) {
            $suggestions[] = [
                'label' => 'Check pricing variance before posting',
                'reason' => 'This document total is materially above the recent pattern for the same workflow.',
                'confidence' => 76,
            ];
        }

        return $suggestions;
    }

    public function forReports(array $metrics, array $patterns): array
    {
        $suggestions = [];

        if (($metrics['net_profit'] ?? 0) >= 0) {
            $suggestions[] = [
                'label' => 'Protect profitable segments',
                'reason' => 'Positive earnings support a drill-down into the strongest customers, products, and expense controls.',
                'confidence' => 73,
            ];
        }

        if (($patterns['open_receivables'] ?? 0) > ($patterns['open_payables'] ?? 0)) {
            $suggestions[] = [
                'label' => 'Push receivables collection workflow',
                'reason' => 'Open receivables exceed current payables pressure and should be converted into cash sooner.',
                'confidence' => 81,
            ];
        }

        return $suggestions;
    }
}