<?php

namespace App\Services\VAT;

use App\Models\Document;

class VATLedgerService
{
    public function buildDocumentSummary(Document $document): array
    {
        $document->loadMissing('lines.taxCategory');

        $direction = in_array($document->type, ['vendor_bill', 'purchase_invoice', 'purchase_credit_note'], true)
            ? 'input'
            : 'output';

        $lines = $document->lines->map(function ($line) {
            $decision = $line->metadata['vat_decision'] ?? [];

            return [
                'line_number' => $line->line_number,
                'tax_code' => $line->taxCategory?->code,
                'tax_name' => $line->taxCategory?->name,
                'tax_rate' => (float) $line->tax_rate,
                'net_amount' => (float) $line->net_amount,
                'tax_amount' => (float) $line->tax_amount,
                'classification' => $decision['classification'] ?? null,
                'report_bucket' => $decision['report_bucket'] ?? null,
            ];
        })->values()->all();

        return [
            'direction' => $direction,
            'taxable_total' => round((float) $document->taxable_total, 2),
            'tax_total' => round((float) $document->tax_total, 2),
            'net_payable' => round($direction === 'output' ? (float) $document->tax_total : (float) $document->tax_total * -1, 2),
            'line_count' => count($lines),
            'lines' => $lines,
        ];
    }
}