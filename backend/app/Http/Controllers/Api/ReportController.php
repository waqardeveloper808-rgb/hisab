<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\AuditLog;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Document;
use App\Models\DocumentLine;
use App\Models\JournalEntryLine;
use App\Models\Payment;
use App\Services\Reports\BalanceSheetService;
use App\Services\Reports\CashFlowService;
use App\Services\Reports\ProfitLossService;
use App\Services\Reports\VATReportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    use ResolvesCompanyAccess;

    public function __construct(
        private readonly ProfitLossService $profitLossService,
        private readonly BalanceSheetService $balanceSheetService,
        private readonly CashFlowService $cashFlowService,
        private readonly VATReportService $vatReportService,
    ) {
    }

    public function dashboardSummary(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.reports.view');

        $openInvoices = Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['tax_invoice', 'debit_note'])
            ->where('balance_due', '>', 0)
            ->count();

        $openBills = Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['vendor_bill', 'purchase_invoice'])
            ->where('balance_due', '>', 0)
            ->count();

        $receivablesTotal = (float) Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['tax_invoice', 'debit_note'])
            ->sum('balance_due');

        $payablesTotal = (float) Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['vendor_bill', 'purchase_invoice'])
            ->sum('balance_due');

        $recentInvoices = Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['tax_invoice', 'debit_note'])
            ->with('contact:id,display_name')
            ->orderByDesc('issue_date')
            ->limit(5)
            ->get(['id', 'contact_id', 'document_number', 'status', 'issue_date', 'grand_total', 'balance_due']);

        $recentBills = Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['vendor_bill', 'purchase_invoice'])
            ->with('contact:id,display_name')
            ->orderByDesc('issue_date')
            ->limit(5)
            ->get(['id', 'contact_id', 'document_number', 'status', 'issue_date', 'grand_total', 'balance_due']);

        $recentPayments = Payment::query()
            ->where('company_id', $company->id)
            ->orderByDesc('payment_date')
            ->limit(5)
            ->get(['id', 'contact_id', 'direction', 'payment_number', 'payment_date', 'amount', 'status', 'reference']);

        $vatLines = $this->vatDetail($request, $company)->getData(true)['data'];

        return response()->json([
            'data' => [
                'open_invoices' => $openInvoices,
                'open_bills' => $openBills,
                'receivables_total' => number_format($receivablesTotal, 2, '.', ''),
                'payables_total' => number_format($payablesTotal, 2, '.', ''),
                'vat_lines' => count($vatLines),
                'recent_invoices' => $recentInvoices,
                'recent_bills' => $recentBills,
                'recent_payments' => $recentPayments,
            ],
        ]);
    }

    public function invoiceRegister(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.reports.view');

        $rows = Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['tax_invoice', 'debit_note'])
            ->orderByDesc('issue_date')
            ->get(['id', 'contact_id', 'document_number', 'type', 'status', 'issue_date', 'due_date', 'taxable_total', 'tax_total', 'grand_total', 'balance_due']);

        return response()->json(['data' => $rows]);
    }

    public function billsRegister(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.reports.view');

        $rows = Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['vendor_bill', 'purchase_invoice'])
            ->orderByDesc('issue_date')
            ->get(['id', 'contact_id', 'document_number', 'type', 'status', 'issue_date', 'due_date', 'taxable_total', 'tax_total', 'grand_total', 'balance_due']);

        return response()->json(['data' => $rows]);
    }

    public function paymentsRegister(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.reports.view');

        $rows = Payment::query()
            ->where('company_id', $company->id)
            ->orderByDesc('payment_date')
            ->get(['id', 'contact_id', 'payment_number', 'direction', 'status', 'method', 'reference', 'payment_date', 'amount', 'allocated_total', 'unallocated_amount']);

        return response()->json(['data' => $rows]);
    }

    public function vatSummary(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.vat.view');

        return response()->json(['data' => $this->vatReportService->summary($company)]);
    }

    public function vatDetail(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.vat.view');

        return response()->json(['data' => $this->vatReportService->detail($company)]);
    }

    public function vatReceivedDetails(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.vat.view');

        return response()->json(['data' => $this->vatReportService->receivedDetails($company, $request)]);
    }

    public function vatPaidDetails(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.vat.view');

        return response()->json(['data' => $this->vatReportService->paidDetails($company, $request)]);
    }

    public function receivablesAging(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.reports.view');

        $today = Carbon::today();

        $rows = Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['tax_invoice', 'debit_note'])
            ->where('balance_due', '>', 0)
            ->get()
            ->map(function (Document $document) use ($today) {
                $daysPastDue = $document->due_date && Carbon::parse($document->due_date)->lt($today)
                    ? Carbon::parse($document->due_date)->diffInDays($today)
                    : 0;

                return [
                    'document_number' => $document->document_number,
                    'contact_id' => $document->contact_id,
                    'balance_due' => $document->balance_due,
                    'bucket' => match (true) {
                        $daysPastDue === 0 => 'current',
                        $daysPastDue <= 30 => '1_30',
                        $daysPastDue <= 60 => '31_60',
                        $daysPastDue <= 90 => '61_90',
                        default => '90_plus',
                    },
                ];
            });

        return response()->json(['data' => $rows]);
    }

    public function payablesAging(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.reports.view');

        $today = Carbon::today();

        $rows = Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['vendor_bill', 'purchase_invoice'])
            ->where('balance_due', '>', 0)
            ->get()
            ->map(function (Document $document) use ($today) {
                $daysPastDue = $document->due_date && Carbon::parse($document->due_date)->lt($today)
                    ? Carbon::parse($document->due_date)->diffInDays($today)
                    : 0;

                return [
                    'document_number' => $document->document_number,
                    'contact_id' => $document->contact_id,
                    'balance_due' => $document->balance_due,
                    'bucket' => match (true) {
                        $daysPastDue === 0 => 'current',
                        $daysPastDue <= 30 => '1_30',
                        $daysPastDue <= 60 => '31_60',
                        $daysPastDue <= 90 => '61_90',
                        default => '90_plus',
                    },
                ];
            });

        return response()->json(['data' => $rows]);
    }

    public function customerStatement(Request $request, Company $company, Contact $contact): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.reports.view');
        $this->ensureContactOwnership($company, $contact);

        $documents = Document::query()
            ->where('company_id', $company->id)
            ->where('contact_id', $contact->id)
            ->whereIn('type', ['tax_invoice', 'credit_note', 'debit_note'])
            ->orderBy('issue_date')
            ->get(['id', 'document_number', 'type', 'status', 'issue_date', 'grand_total', 'paid_total', 'credited_total', 'balance_due']);

        $payments = Payment::query()
            ->where('company_id', $company->id)
            ->where('contact_id', $contact->id)
            ->orderBy('payment_date')
            ->get(['id', 'payment_number', 'payment_date', 'amount', 'reference']);

        return response()->json([
            'data' => [
                'contact' => $contact,
                'documents' => $documents,
                'payments' => $payments,
            ],
        ]);
    }

    public function trialBalance(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.accounting.view');

        $rows = DB::table('journal_entry_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->where('journal_entries.company_id', $company->id)
            ->groupBy('accounts.code', 'accounts.name', 'accounts.type')
            ->orderBy('accounts.code')
            ->selectRaw('accounts.code, accounts.name, accounts.type, SUM(journal_entry_lines.debit) as debit_total, SUM(journal_entry_lines.credit) as credit_total, SUM(journal_entry_lines.debit - journal_entry_lines.credit) as balance')
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function profitLoss(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.accounting.view');

        return response()->json(['data' => $this->profitLossService->statement($company)]);
    }

    public function balanceSheet(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.accounting.view');

        return response()->json(['data' => $this->balanceSheetService->statement($company)]);
    }

    public function profitByCustomer(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.reports.view');

        $rows = Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['tax_invoice', 'credit_note', 'debit_note'])
            ->whereIn('status', ['finalized', 'partially_paid', 'paid', 'partially_credited', 'credited', 'credit_owed'])
            ->with(['contact:id,display_name', 'lines.item:id,default_purchase_price'])
            ->get()
            ->groupBy(fn (Document $document) => $document->contact_id ?: 0)
            ->map(function ($documents, $contactId) {
                $contactName = $documents->first()?->contact?->display_name ?: 'Unassigned contact';
                $revenue = 0.0;
                $estimatedCost = 0.0;

                foreach ($documents as $document) {
                    $sign = $document->type === 'credit_note' ? -1 : 1;

                    foreach ($document->lines as $line) {
                        $revenue += $sign * (float) $line->net_amount;
                        $estimatedCost += $sign * ((float) $line->quantity * (float) ($line->item?->default_purchase_price ?? 0));
                    }
                }

                return [
                    'contact_id' => (int) $contactId,
                    'contact_name' => $contactName,
                    'revenue' => number_format($revenue, 2, '.', ''),
                    'estimated_cost' => number_format($estimatedCost, 2, '.', ''),
                    'profit' => number_format($revenue - $estimatedCost, 2, '.', ''),
                ];
            })
            ->sortByDesc(fn (array $row) => (float) $row['profit'])
            ->values();

        return response()->json(['data' => $rows]);
    }

    public function profitByProduct(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.reports.view');

        $rows = DocumentLine::query()
            ->join('documents', 'documents.id', '=', 'document_lines.document_id')
            ->leftJoin('items', 'items.id', '=', 'document_lines.item_id')
            ->where('documents.company_id', $company->id)
            ->whereIn('documents.type', ['tax_invoice', 'credit_note', 'debit_note'])
            ->whereIn('documents.status', ['finalized', 'partially_paid', 'paid', 'partially_credited', 'credited', 'credit_owed'])
            ->selectRaw("COALESCE(items.id, 0) as item_id, COALESCE(items.name, document_lines.description) as item_name,
                SUM(CASE WHEN documents.type = 'credit_note' THEN -document_lines.quantity ELSE document_lines.quantity END) as quantity,
                SUM(CASE WHEN documents.type = 'credit_note' THEN -document_lines.net_amount ELSE document_lines.net_amount END) as revenue,
                SUM(CASE WHEN documents.type = 'credit_note' THEN -(document_lines.quantity * COALESCE(items.default_purchase_price, 0)) ELSE (document_lines.quantity * COALESCE(items.default_purchase_price, 0)) END) as estimated_cost")
            ->groupBy('items.id', 'items.name', 'document_lines.description')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($row) => [
                'item_id' => (int) $row->item_id,
                'item_name' => $row->item_name,
                'quantity' => number_format((float) $row->quantity, 2, '.', ''),
                'revenue' => number_format((float) $row->revenue, 2, '.', ''),
                'estimated_cost' => number_format((float) $row->estimated_cost, 2, '.', ''),
                'profit' => number_format((float) $row->revenue - (float) $row->estimated_cost, 2, '.', ''),
            ]);

        return response()->json(['data' => $rows]);
    }

    public function expenseBreakdown(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.reports.view');

        $rows = DB::table('document_lines')
            ->join('documents', 'documents.id', '=', 'document_lines.document_id')
            ->leftJoin('accounts', 'accounts.id', '=', 'document_lines.ledger_account_id')
            ->where('documents.company_id', $company->id)
            ->whereIn('documents.type', ['vendor_bill', 'purchase_invoice', 'purchase_credit_note'])
            ->whereIn('documents.status', ['finalized', 'partially_paid', 'paid', 'partially_credited', 'credited'])
            ->groupBy('accounts.code', 'accounts.name')
            ->selectRaw("COALESCE(accounts.code, 'UNASSIGNED') as category_code, COALESCE(accounts.name, 'Unassigned expense') as category_name,
                SUM(CASE WHEN documents.type = 'purchase_credit_note' THEN -document_lines.net_amount ELSE document_lines.net_amount END) as total")
            ->orderByDesc('total')
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function generalLedger(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.accounting.view');

        $payload = $request->validate([
            'account_id' => ['nullable', 'integer'],
            'account_code' => ['nullable', 'string', 'max:20'],
            'document_number' => ['nullable', 'string', 'max:80'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:2000'],
        ]);

        $query = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->leftJoin('contacts', 'contacts.id', '=', 'journal_entry_lines.contact_id')
            ->leftJoin('documents', 'documents.id', '=', 'journal_entry_lines.document_id')
            ->leftJoin('cost_centers', 'cost_centers.id', '=', 'journal_entry_lines.cost_center_id')
            ->where('journal_entries.company_id', $company->id)
            ->orderBy('journal_entries.entry_date')
            ->orderBy('journal_entries.id')
            ->orderBy('journal_entry_lines.id')
            ->selectRaw('journal_entry_lines.id, journal_entries.entry_number, journal_entries.entry_date, journal_entries.source_type, journal_entries.source_id, journal_entries.reference, accounts.id as account_id, accounts.code as account_code, accounts.name as account_name, contacts.display_name as contact_name, documents.document_number, cost_centers.code as cost_center_code, cost_centers.name as cost_center_name, COALESCE(journal_entry_lines.description, journal_entries.description) as description, journal_entry_lines.debit, journal_entry_lines.credit');

        if (! empty($payload['account_id'])) {
            $query->where('accounts.id', $payload['account_id']);
        }

        if (! empty($payload['account_code'])) {
            $query->where('accounts.code', $payload['account_code']);
        }

        if (! empty($payload['document_number'])) {
            $query->where('documents.document_number', $payload['document_number']);
        }

        if (! empty($payload['from'])) {
            $query->whereDate('journal_entries.entry_date', '>=', $payload['from']);
        }

        if (! empty($payload['to'])) {
            $query->whereDate('journal_entries.entry_date', '<=', $payload['to']);
        }

        $runningBalance = 0.0;

        $rows = $query
            ->limit($payload['limit'] ?? 2000)
            ->get()
            ->map(function ($row) use (&$runningBalance) {
                $runningBalance += (float) $row->debit - (float) $row->credit;

                return [
                    'id' => $row->id,
                    'entry_number' => $row->entry_number,
                    'entry_date' => $row->entry_date,
                    'source_type' => $row->source_type,
                    'source_id' => $row->source_id,
                    'reference' => $row->reference,
                    'account_id' => $row->account_id,
                    'account_code' => $row->account_code,
                    'account_name' => $row->account_name,
                    'contact_name' => $row->contact_name,
                    'document_number' => $row->document_number,
                    'cost_center_code' => $row->cost_center_code,
                    'cost_center_name' => $row->cost_center_name,
                    'description' => $row->description,
                    'debit' => number_format((float) $row->debit, 2, '.', ''),
                    'credit' => number_format((float) $row->credit, 2, '.', ''),
                    'running_balance' => number_format($runningBalance, 2, '.', ''),
                ];
            })
            ->values();

        return response()->json(['data' => $rows]);
    }

    public function auditTrail(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.accounting.view');

        $payload = $request->validate([
            'event' => ['nullable', 'string', 'max:60'],
            'auditable_type' => ['nullable', 'string', 'max:120'],
            'auditable_id' => ['nullable', 'integer'],
            'user_id' => ['nullable', 'integer'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $query = AuditLog::query()
            ->where('company_id', $company->id)
            ->leftJoin('users', 'users.id', '=', 'audit_logs.user_id')
            ->orderByDesc('audit_logs.created_at');

        if (! empty($payload['event'])) {
            $query->where('audit_logs.event', $payload['event']);
        }

        if (! empty($payload['auditable_type'])) {
            $query->where('audit_logs.auditable_type', $payload['auditable_type']);
        }

        if (! empty($payload['auditable_id'])) {
            $query->where('audit_logs.auditable_id', $payload['auditable_id']);
        }

        if (! empty($payload['user_id'])) {
            $query->where('audit_logs.user_id', $payload['user_id']);
        }

        if (! empty($payload['from'])) {
            $query->whereDate('audit_logs.created_at', '>=', $payload['from']);
        }

        if (! empty($payload['to'])) {
            $query->whereDate('audit_logs.created_at', '<=', $payload['to']);
        }

        return response()->json(['data' => $query
            ->limit(200)
            ->get([
                'audit_logs.*',
                'users.name as actor_name',
                'users.email as actor_email',
            ])
            ->map(function ($row) {
                $before = is_array($row->before) ? $row->before : [];
                $after = is_array($row->after) ? $row->after : [];
                $changeKeys = array_values(array_unique(array_merge(array_keys($before), array_keys($after))));

                return [
                    'id' => $row->id,
                    'company_id' => $row->company_id,
                    'user_id' => $row->user_id,
                    'actor_name' => $row->actor_name,
                    'actor_email' => $row->actor_email,
                    'event' => $row->event,
                    'auditable_type' => $row->auditable_type,
                    'auditable_id' => $row->auditable_id,
                    'before' => $before,
                    'after' => $after,
                    'context' => $row->context,
                    'created_at' => optional($row->created_at)?->toIso8601String(),
                    'change_summary' => $changeKeys,
                ];
            })]);
    }

    /**
     * Cash Flow — direct method from bank/cash account movements.
     */
    public function cashFlow(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.accounting.view');

        $payload = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        return response()->json(['data' => $this->cashFlowService->statement($company, $payload)]);
    }
}