<?php

namespace App\Services\Reports;

use App\Models\Company;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VATReportService
{
    /** @return list<string> */
    private function excludedNonPostingStatuses(): array
    {
        return ['draft', 'cancelled', 'void'];
    }

    private function applyPostingStatusConstraint($query): void
    {
        $query->whereNotIn('documents.status', $this->excludedNonPostingStatuses());
    }

    /**
     * Documented sales-side posting statuses (parity with legacy engines). Queries use {@see excludedNonPostingStatuses}
     * so valid states like `overdue` are never excluded by omission from this list.
     *
     * @return list<string>
     */
    private function postingSalesStatuses(): array
    {
        return ['finalized', 'sent', 'issued', 'posted', 'partially_paid', 'paid', 'partially_credited', 'credited', 'credit_owed', 'overdue'];
    }

    /** @return list<string> */
    private function postingPurchaseStatuses(): array
    {
        return $this->postingSalesStatuses();
    }

    /** Output-VAT document kinds (invoice-level received + line aggregates). */
    private function salesOutputDocumentTypes(): array
    {
        return ['tax_invoice', 'debit_note', 'credit_note', 'cash_invoice', 'api_invoice'];
    }

    /** Purchase-side VAT document kinds. */
    private function purchaseInputDocumentTypes(): array
    {
        return ['vendor_bill', 'purchase_invoice', 'purchase_credit_note'];
    }

    /**
     * Per-tax-category aggregates from posted document lines (source of truth for VAT filing views).
     *
     * @return array<int, object{
     *   code: string,
     *   name: string,
     *   rate: float,
     *   output_taxable: float,
     *   output_tax: float,
     *   input_taxable: float,
     *   input_tax: float
     * }>
     */
    private function aggregatesByTaxCode(Company $company, ?Request $request): array
    {
        if (\count($this->postingSalesStatuses()) === 0 || \count($this->postingPurchaseStatuses()) === 0) {
            throw new \LogicException('postingSalesStatuses/postingPurchaseStatuses must enumerate posting states for VAT parity audits.');
        }
        $from = $request?->string('from_date')->toString();
        $to = $request?->string('to_date')->toString();

        $outTypes = implode("','", $this->salesOutputDocumentTypes());
        $inTypes = implode("','", $this->purchaseInputDocumentTypes());

        $rows = DB::table('document_lines')
            ->join('documents', 'documents.id', '=', 'document_lines.document_id')
            ->join('tax_categories', 'tax_categories.id', '=', 'document_lines.tax_category_id')
            ->where('documents.company_id', $company->id)
            ->where(function ($q) use ($outTypes, $inTypes) {
                $q->whereRaw("documents.type IN ('{$outTypes}')")
                    ->orWhereRaw("documents.type IN ('{$inTypes}')");
            })
            ->tap(fn ($q) => $this->applyPostingStatusConstraint($q))
            ->when($from, fn ($q) => $q->whereDate('documents.issue_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('documents.issue_date', '<=', $to))
            ->groupBy('tax_categories.id', 'tax_categories.code', 'tax_categories.name', 'tax_categories.rate')
            ->selectRaw('
                tax_categories.code as code,
                tax_categories.name as name,
                tax_categories.rate as rate,
                SUM(CASE WHEN documents.type IN (\'tax_invoice\',\'cash_invoice\',\'api_invoice\',\'debit_note\')
                    THEN document_lines.net_amount ELSE 0 END)
                  - SUM(CASE WHEN documents.type = \'credit_note\'
                    THEN document_lines.net_amount ELSE 0 END) as output_taxable,
                SUM(CASE WHEN documents.type IN (\'tax_invoice\',\'cash_invoice\',\'api_invoice\',\'debit_note\')
                    THEN document_lines.tax_amount ELSE 0 END)
                  - SUM(CASE WHEN documents.type = \'credit_note\'
                    THEN document_lines.tax_amount ELSE 0 END) as output_tax,
                SUM(CASE WHEN documents.type IN (\'vendor_bill\',\'purchase_invoice\')
                    THEN document_lines.net_amount ELSE 0 END)
                  - SUM(CASE WHEN documents.type = \'purchase_credit_note\'
                    THEN document_lines.net_amount ELSE 0 END) as input_taxable,
                SUM(CASE WHEN documents.type IN (\'vendor_bill\',\'purchase_invoice\')
                    THEN document_lines.tax_amount ELSE 0 END)
                  - SUM(CASE WHEN documents.type = \'purchase_credit_note\'
                    THEN document_lines.tax_amount ELSE 0 END) as input_tax
            ')
            ->get();

        return $rows->map(function ($row) {
            return (object) [
                'code' => (string) $row->code,
                'name' => (string) $row->name,
                'rate' => (float) $row->rate,
                'output_taxable' => (float) $row->output_taxable,
                'output_tax' => (float) $row->output_tax,
                'input_taxable' => (float) $row->input_taxable,
                'input_tax' => (float) $row->input_tax,
            ];
        })->values()->all();
    }

    /**
     * VAT summary table: one row per tax code with net output taxable and tax (after credit notes).
     *
     * @return array{rows: array<int, array<string, string>>, meta: array<string, mixed>}
     */
    public function summary(Company $company, ?Request $request = null): array
    {
        $settings = $company->settings()->firstOrFail();

        $vatReceivedLedger = (float) DB::table('journal_entry_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->where('journal_entries.company_id', $company->id)
            ->where('accounts.code', $settings->default_vat_payable_account_code)
            ->selectRaw('COALESCE(SUM(journal_entry_lines.credit - journal_entry_lines.debit), 0) as total')
            ->value('total');

        $vatPaidLedger = (float) DB::table('journal_entry_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->where('journal_entries.company_id', $company->id)
            ->where('accounts.code', $settings->default_vat_receivable_account_code)
            ->selectRaw('COALESCE(SUM(journal_entry_lines.debit - journal_entry_lines.credit), 0) as total')
            ->value('total');

        $aggregates = $this->aggregatesByTaxCode($company, $request);

        $rows = [];
        $expectedOutput = 0.0;
        $expectedInput = 0.0;
        foreach ($aggregates as $row) {
            $expectedOutput += $row->output_tax;
            $expectedInput += $row->input_tax;
            if (abs($row->output_taxable) < 0.0005 && abs($row->output_tax) < 0.0005) {
                continue;
            }
            $rows[] = [
                'code' => $row->code,
                'name' => $row->name,
                'tax_rate' => number_format(round($row->rate, 2), 2, '.', ''),
                'taxable_amount' => number_format(round($row->output_taxable, 2), 2, '.', ''),
                'tax_amount' => number_format(round($row->output_tax, 2), 2, '.', ''),
            ];
        }

        $expectedOutput = round($expectedOutput, 2);
        $expectedInput = round($expectedInput, 2);

        $meta = [
            'vat_received' => number_format(round($vatReceivedLedger, 2), 2, '.', ''),
            'vat_paid' => number_format(round($vatPaidLedger, 2), 2, '.', ''),
            'vat_payable' => number_format(round($vatReceivedLedger - $vatPaidLedger, 2), 2, '.', ''),
            'expected_output_vat_from_documents' => number_format($expectedOutput, 2, '.', ''),
            'expected_input_vat_from_documents' => number_format($expectedInput, 2, '.', ''),
            'output_vat_mismatch' => number_format(round($vatReceivedLedger - $expectedOutput, 2), 2, '.', ''),
            'input_vat_mismatch' => number_format(round($vatPaidLedger - $expectedInput, 2), 2, '.', ''),
            'validation_status' => abs(round($vatReceivedLedger - $expectedOutput, 2)) <= 0.01 && abs(round($vatPaidLedger - $expectedInput, 2)) <= 0.01
                ? 'matched'
                : 'mismatch',
        ];

        return ['rows' => $rows, 'meta' => $meta];
    }

    public function detail(Company $company, ?Request $request = null): array
    {
        $aggregates = $this->aggregatesByTaxCode($company, $request);
        $out = [];
        foreach ($aggregates as $row) {
            if (
                abs($row->output_taxable) < 0.0005 && abs($row->output_tax) < 0.0005
                && abs($row->input_taxable) < 0.0005 && abs($row->input_tax) < 0.0005
            ) {
                continue;
            }
            $out[] = [
                'code' => $row->code,
                'name' => $row->name,
                'tax_rate' => number_format(round($row->rate, 2), 2, '.', ''),
                'output_taxable_amount' => number_format(round($row->output_taxable, 2), 2, '.', ''),
                'output_tax_amount' => number_format(round($row->output_tax, 2), 2, '.', ''),
                'input_taxable_amount' => number_format(round($row->input_taxable, 2), 2, '.', ''),
                'input_tax_amount' => number_format(round($row->input_tax, 2), 2, '.', ''),
            ];
        }

        return $out;
    }

    public function receivedDetails(Company $company, Request $request): array
    {
        return Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', $this->salesOutputDocumentTypes())
            ->tap(fn ($q) => $this->applyPostingStatusConstraint($q))
            ->when($request->string('from_date')->toString(), fn ($query, $fromDate) => $query->whereDate('issue_date', '>=', $fromDate))
            ->when($request->string('to_date')->toString(), fn ($query, $toDate) => $query->whereDate('issue_date', '<=', $toDate))
            ->with('contact:id,display_name')
            ->orderByDesc('issue_date')
            ->get(['id', 'type', 'contact_id', 'document_number', 'issue_date', 'status', 'taxable_total', 'tax_total'])
            ->map(function (Document $document) {
                $sign = $document->type === 'credit_note' ? -1 : 1;

                return [
                    'id' => $document->id,
                    'document_number' => $document->document_number,
                    'document_type' => $document->type,
                    'status' => $document->status,
                    'issue_date' => $document->issue_date,
                    'customer' => $document->contact?->display_name,
                    'taxable_amount' => number_format($sign * round((float) $document->taxable_total, 2), 2, '.', ''),
                    'vat_amount' => number_format($sign * round((float) $document->tax_total, 2), 2, '.', ''),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Invoice-line-level output VAT rows (one row per document line), for reconciliation vs document totals.
     */
    public function receivedLineDetails(Company $company, Request $request): array
    {
        $from = $request->string('from_date')->toString();
        $to = $request->string('to_date')->toString();

        $rows = DB::table('document_lines')
            ->join('documents', 'documents.id', '=', 'document_lines.document_id')
            ->leftJoin('contacts', 'contacts.id', '=', 'documents.contact_id')
            ->leftJoin('tax_categories', 'tax_categories.id', '=', 'document_lines.tax_category_id')
            ->where('documents.company_id', $company->id)
            ->whereIn('documents.type', $this->salesOutputDocumentTypes())
            ->tap(fn ($q) => $this->applyPostingStatusConstraint($q))
            ->when($from, fn ($q) => $q->whereDate('documents.issue_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('documents.issue_date', '<=', $to))
            ->whereNotNull('document_lines.tax_category_id')
            ->orderByDesc('documents.issue_date')
            ->orderByDesc('documents.id')
            ->orderBy('document_lines.id')
            ->select([
                'document_lines.id as line_id',
                'documents.id as document_id',
                'documents.document_number',
                'documents.type as document_type',
                'documents.issue_date',
                'documents.status as document_status',
                'contacts.display_name as customer',
                'tax_categories.code as tax_code',
                'tax_categories.rate as tax_rate',
                'document_lines.description as line_description',
                'document_lines.net_amount',
                'document_lines.tax_amount',
            ])
            ->get();

        return $rows->map(function ($row): array {
            $sign = ($row->document_type ?? '') === 'credit_note' ? -1 : 1;
            $net = $sign * (float) ($row->net_amount ?? 0);
            $vat = $sign * (float) ($row->tax_amount ?? 0);

            return [
                'line_id' => (int) $row->line_id,
                'document_id' => (int) $row->document_id,
                'document_number' => (string) $row->document_number,
                'document_type' => (string) $row->document_type,
                'issue_date' => $row->issue_date,
                'customer' => $row->customer,
                'tax_code' => (string) ($row->tax_code ?? ''),
                'tax_rate' => $row->tax_rate !== null ? (float) $row->tax_rate : null,
                'line_description' => (string) ($row->line_description ?? ''),
                'taxable_amount' => number_format(round($net, 2), 2, '.', ''),
                'vat_amount' => number_format(round($vat, 2), 2, '.', ''),
                'status' => (string) $row->document_status,
            ];
        })->values()->all();
    }

    public function paidDetails(Company $company, Request $request): array
    {
        return Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['vendor_bill', 'purchase_invoice', 'purchase_credit_note'])
            ->whereNotIn('status', $this->excludedNonPostingStatuses())
            ->when($request->string('from_date')->toString(), fn ($query, $fromDate) => $query->whereDate('issue_date', '>=', $fromDate))
            ->when($request->string('to_date')->toString(), fn ($query, $toDate) => $query->whereDate('issue_date', '<=', $toDate))
            ->with('contact:id,display_name')
            ->orderByDesc('issue_date')
            ->get(['id', 'type', 'contact_id', 'document_number', 'issue_date', 'title', 'notes', 'status', 'tax_total', 'taxable_total'])
            ->map(function (Document $document) {
                $sign = $document->type === 'purchase_credit_note' ? -1 : 1;
                $text = strtolower(trim(($document->title ?? '').' '.($document->notes ?? '')));

                return [
                    'id' => $document->id,
                    'reference' => $document->document_number,
                    'document_type' => $document->type,
                    'status' => $document->status,
                    'issue_date' => $document->issue_date,
                    'vendor' => $document->contact?->display_name,
                    'taxable_amount' => number_format($sign * round((float) $document->taxable_total, 2), 2, '.', ''),
                    'vat_amount' => number_format($sign * round((float) $document->tax_total, 2), 2, '.', ''),
                    'category' => str_contains($text, 'rent') ? 'rent' : ($document->type === 'vendor_bill' ? 'expense' : ($document->type === 'purchase_credit_note' ? 'purchase_credit' : 'purchase')),
                ];
            })
            ->values()
            ->all();
    }
}
