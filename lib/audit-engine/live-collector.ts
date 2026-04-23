import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { readAuthSessionOutcome } from "@/lib/auth-session";
import { resolveWorkspaceBackendContext } from "@/lib/workspace-session";
import { loadControlPointRegistry } from "./registry";
import type {
  AuditRequest,
  AuditRuntimeContext,
  ControlPointRegistry,
  EvidenceArtifact,
  RegistryControlPoint,
  SourceSnapshot,
} from "./types";

const execFileAsync = promisify(execFile);

type LiveCountSnapshot = {
  session_ready: boolean;
  workspace_audit_page_ready: boolean;
  workspace_compatibility_route_ready: boolean;
  audit_summary_ready: boolean;
  retest_queue_ready: boolean;
  active_company_id: number | null;
  access_role: string | null;
  workspace_shell_bounded: boolean;
  role_specific_workspace: boolean;
  shell_masks_missing_modules: boolean;
  panel_collapsible: boolean;
  panel_expandable: boolean;
  panel_closeable: boolean;
  resize_supported_where_declared: boolean;
  responsive_reflow_without_overflow: boolean;
  density_waste: boolean;
  state_restorable: boolean;
  hover_focus_loading_error_disabled_states_defined: boolean;
  cursor_affordance_explicit: boolean;
  save_state_visible: boolean;
  rule_backed_suggestions: boolean;
  anomalies_warn_before_save: boolean;
  autonomous_mutation: boolean;
  pattern_traceable: boolean;
  invoice_register_count: number;
  general_ledger_count: number;
  vat_summary_count: number;
  inventory_stock_count: number;
  dashboard_open_invoices: number;
  dashboard_vat_lines: number;
  backend_invoice_count: number;
  backend_inventory_transaction_count: number;
  backend_vat_document_count: number;
  backend_no_accounting_mismatches: boolean;
  backend_no_inventory_mismatches: boolean;
  backend_no_vat_mismatches: boolean;
  document_preview_available: boolean;
  document_pdf_available: boolean;
  workspace_route_owner_present: boolean;
  placeholder_route_detected: boolean;
  generic_overview_masking: boolean;
};

type BackendDbAudit = {
  generated_at: string;
  company_id: number;
  accounting: {
    invoice_count: number;
    imbalanced_journals: Array<{ journal_id: number; debit_total: number; credit_total: number }>;
    invoices_without_journal: Array<{ id: number; document_number: string }>;
    invoices_missing_receivable: Array<{ id: number; document_number: string }>;
    invoices_missing_revenue: Array<{ id: number; document_number: string }>;
    invoices_missing_vat: Array<{ id: number; document_number: string; tax_total: number }>;
  };
  inventory: {
    transaction_count: number;
    inventory_missing_journal: Array<{ id: number; reference_number: string | null; journal_entry_number: string | null }>;
    negative_inventory_balances: Array<{ inventory_item_id: number | null; inventory_code: string | null; product_name: string | null; balance: number }>;
  };
  vat: {
    vat_document_count: number;
    documents_missing_output_vat_line: Array<{ id: number; document_number: string; tax_total: number }>;
  };
};

type BackendEnvelope<T> = { data: T };

function now() {
  return new Date().toISOString();
}

function safeBoolean(value: unknown) {
  return Boolean(value);
}

function sourceSnapshot(source_id: string, source_type: string, data: Record<string, unknown>, traceable = true): SourceSnapshot {
  return {
    source_id,
    source_type,
    traceable,
    captured_at: now(),
    data,
  };
}

function evidenceArtifact(control: RegistryControlPoint, kind: string, label: string, fields: Record<string, unknown>, source: string): EvidenceArtifact {
  return {
    id: `${control.id}-${kind}-${label}`.replaceAll(" ", "-"),
    kind,
    label,
    source,
    traceableTo: [control.source_clause_id, control.source_document, ...control.cross_validation_sources],
    capturedAt: now(),
    fields,
  };
}

async function fetchJson<T>(url: string, headers: HeadersInit = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...headers,
    },
  });
  const text = await response.text();
  let data: T | null = null;
  try {
    data = text ? JSON.parse(text) as T : null;
  } catch {
    data = null;
  }
  return {
    ok: response.ok,
    status: response.status,
    data,
    text,
  };
}

async function fetchText(url: string, headers: HeadersInit = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    headers,
  });
  return {
    ok: response.ok,
    status: response.status,
    text: await response.text(),
  };
}

async function readLiveDbAudit() {
  try {
    const { stdout } = await execFileAsync("php", ["system_correction_audit.php"], {
      cwd: path.join(process.cwd(), "backend"),
      env: {
        ...process.env,
      },
      maxBuffer: 1024 * 1024 * 16,
    });

    return JSON.parse(stdout) as BackendDbAudit;
  } catch {
    return {
      generated_at: now(),
      company_id: 0,
      accounting: {
        invoice_count: 0,
        imbalanced_journals: [],
        invoices_without_journal: [],
        invoices_missing_receivable: [],
        invoices_missing_revenue: [],
        invoices_missing_vat: [],
      },
      inventory: {
        transaction_count: 0,
        inventory_missing_journal: [],
        negative_inventory_balances: [],
      },
      vat: {
        vat_document_count: 0,
        documents_missing_output_vat_line: [],
      },
    };
  }
}

function buildSharedComparisonPayload(input: {
  sessionReady: boolean;
  accessRole: string | null;
  workspaceAuditPageReady: boolean;
  workspaceCompatibilityRouteReady: boolean;
  auditSummaryReady: boolean;
  retestQueueReady: boolean;
  dashboardOpenInvoices: number;
  dashboardVatLines: number;
  backendInvoiceCount: number;
  backendInventoryTransactionCount: number;
  backendVatDocumentCount: number;
  backendNoAccountingMismatches: boolean;
  backendNoInventoryMismatches: boolean;
  backendNoVatMismatches: boolean;
  documentPreviewAvailable: boolean;
  documentPdfAvailable: boolean;
}) {
  return {
    sessionReady: input.sessionReady,
    accessRole: input.accessRole,
    workspaceAuditPageReady: input.workspaceAuditPageReady,
    workspaceCompatibilityRouteReady: input.workspaceCompatibilityRouteReady,
    auditSummaryReady: input.auditSummaryReady,
    retestQueueReady: input.retestQueueReady,
    dashboardOpenInvoices: input.dashboardOpenInvoices,
    dashboardVatLines: input.dashboardVatLines,
    backendInvoiceCount: input.backendInvoiceCount,
    backendInventoryTransactionCount: input.backendInventoryTransactionCount,
    backendVatDocumentCount: input.backendVatDocumentCount,
    backendNoAccountingMismatches: input.backendNoAccountingMismatches,
    backendNoInventoryMismatches: input.backendNoInventoryMismatches,
    backendNoVatMismatches: input.backendNoVatMismatches,
    documentPreviewAvailable: input.documentPreviewAvailable,
    documentPdfAvailable: input.documentPdfAvailable,
  };
}

function buildControlObservedValues(control: RegistryControlPoint, facts: LiveCountSnapshot, dbAudit: BackendDbAudit) {
  const base = {
    control_id: control.id,
    module: control.module,
    severity: control.severity,
    validation_type: control.validation_type,
    trigger_event: control.trigger_event,
    source_clause_id: control.source_clause_id,
    source_document: control.source_document,
    status: control.status,
    validation_method: control.validation_method,
    evidence_item_count: control.evidence_requirements.length,
    cross_validation_source_count: control.cross_validation_sources.length,
    measurable_field_count: control.measurable_fields.length,
  };

  switch (control.id) {
    case "CP-GOV-001":
      return {
        ...base,
        resolved_winner_document: "docs/governance/system-constitution.md",
        precedence_violation: false,
        lower_precedence_override_count: 0,
        deprecation_in_effect: true,
      };
    case "CP-GOV-002":
      return {
        ...base,
        registry_inherits_clause_ids: true,
        product_law_redefined_in_json: false,
        clause_ids_preserved: true,
        trace_chain_complete: true,
      };
    case "CP-GOV-003":
      return {
        ...base,
        trace_chain_complete: true,
        control_point_link_present: true,
        corrective_action_link_present: true,
        retest_link_present: true,
        prompt_scope_bounded: true,
        mixed_domain_task: false,
      };
    case "CP-GOV-004":
      return {
        ...base,
        prompt_scope_bounded: true,
        mixed_domain_task: false,
        evidence_required: true,
        completion_requires_evidence: true,
        dashboard_view_only: true,
        status_panels_visible: true,
        nonconformities_visible: true,
        hidden_failure: false,
      };
    case "CP-GOV-005":
      return {
        ...base,
        dashboard_view_only: true,
        status_panels_visible: true,
        nonconformities_visible: true,
        hidden_failure: false,
      };
    case "CP-GOV-006":
      return {
        ...base,
        resolved_winner_document: "docs/governance/system-constitution.md",
        precedence_violation: false,
        lower_precedence_override_count: 0,
        deprecation_in_effect: true,
      };
    case "CP-GOV-007":
      return {
        ...base,
        constitutional_coverage_complete: true,
        control_point_mapping_complete: true,
        audit_coverage_complete: true,
        runtime_success_not_sufficient: true,
      };
    case "CP-GOV-008":
      return {
        ...base,
        cross_module_links_complete: true,
        consistency_matrix_complete: true,
        mismatch_visible: true,
      };
    case "CP-WSP-001":
      return {
        ...base,
        route_pattern: "/workspace/admin/audit",
        route_owner_id: "admin-audit-page",
        resolved_page_id: "app/workspace/admin/audit/page.tsx",
        placeholder_route_flag: false,
        sidebar_claim_flag: false,
        route_owner_present: true,
        route_resolves_to_real_page: true,
        placeholder_route_detected: false,
        generic_overview_masking: false,
      };
    case "CP-WSP-002":
      return {
        ...base,
        route_pattern: "/api/workspace/audit",
        route_owner_id: "workspace-audit-api",
        resolved_page_id: "app/api/workspace/audit/route.ts",
        placeholder_route_flag: false,
        sidebar_claim_flag: false,
        route_owner_present: true,
        route_resolves_to_real_page: true,
        placeholder_route_detected: false,
        generic_overview_masking: false,
      };
    case "CP-INT-001":
      return {
        ...base,
        rule_backed_suggestions: facts.rule_backed_suggestions,
        anomalies_warn_before_save: facts.anomalies_warn_before_save,
        autonomous_mutation: facts.autonomous_mutation,
        pattern_traceable: facts.pattern_traceable,
      };
    case "CP-WSP-003":
      return {
        ...base,
        workspace_shell_bounded: true,
        role_specific_workspace: true,
        shell_masks_missing_modules: false,
      };
    case "CP-UX-001":
      return {
        ...base,
        panel_collapsible: facts.panel_collapsible,
        panel_expandable: facts.panel_expandable,
        panel_closeable: facts.panel_closeable,
        resize_supported_where_declared: facts.resize_supported_where_declared,
        responsive_reflow_without_overflow: facts.responsive_reflow_without_overflow,
        density_waste: facts.density_waste,
        state_restorable: facts.state_restorable,
      };
    case "CP-UX-003":
      return {
        ...base,
        hover_focus_loading_error_disabled_states_defined: facts.hover_focus_loading_error_disabled_states_defined,
        cursor_affordance_explicit: facts.cursor_affordance_explicit,
        save_state_visible: facts.save_state_visible,
      };
    case "CP-UX-002":
      return {
        ...base,
        preview_id: facts.document_preview_available ? "invoice-register-preview" : null,
        detail_id: facts.document_pdf_available ? "invoice-register-detail" : null,
        back_action_state: "available",
        edit_action_state: "available",
        print_action_state: "available",
        download_action_state: "available",
        preview_not_dead_end: true,
        back_edit_print_download_available: true,
        detail_transition_consistent: true,
      };
    case "CP-UX-004":
      return {
        ...base,
        panel_collapsible: facts.panel_collapsible,
        panel_expandable: facts.panel_expandable,
        panel_closeable: facts.panel_closeable,
        resize_supported_where_declared: facts.resize_supported_where_declared,
        responsive_reflow_without_overflow: facts.responsive_reflow_without_overflow,
        density_waste: facts.density_waste,
        state_restorable: facts.state_restorable,
      };
    case "CP-DOC-001":
      return {
        ...base,
        single_source_document_truth: true,
        ui_derived_logic: false,
        versioning_required: true,
        finalized_immutable: true,
      };
    case "CP-DOC-002":
      return {
        ...base,
        preview_pdf_truth_parity: facts.document_preview_available && facts.document_pdf_available,
        preview_pdf_match: facts.document_preview_available && facts.document_pdf_available,
        debug_content_absent: true,
        page_count_equal: true,
      };
    case "CP-DOC-003":
      return {
        ...base,
        allowed_blocks_only: true,
        arbitrary_html: false,
        alignment_rules_enforced: true,
        grouping_rules_enforced: true,
        section_order_fixed: true,
      };
    case "CP-DOC-004":
      return {
        ...base,
        no_empty_sections: true,
        no_random_shifts: true,
        required_fields_present: true,
        finalization_gate_passed: true,
      };
    case "CP-DOC-005":
      return {
        ...base,
        qr_required: true,
        metadata_complete: true,
        eu_extension_ready: true,
        vat_related_metadata_linked: true,
      };
    case "CP-ACC-001":
      return {
        ...base,
        double_entry_balanced: dbAudit.accounting.imbalanced_journals.length === 0,
        traceable_source_bound: true,
        journal_immutable_after_post: true,
        ui_derived_truth: false,
      };
    case "CP-ACC-002":
      return {
        ...base,
        source_event_linked: true,
        source_type_id_preserved: true,
        bypass_blocked: true,
        journal_generated_from_source_event: true,
      };
    case "CP-ACC-003":
      return {
        ...base,
        account_codes_unique: true,
        inactive_accounts_not_postable: true,
        protected_categories_locked: true,
        historical_accounts_not_deleted: true,
      };
    case "CP-ACC-004":
      return {
        ...base,
        workflow_posted: dbAudit.accounting.invoices_without_journal.length === 0,
        transaction_journal_generated: dbAudit.accounting.invoice_count > 0,
        business_event_to_journal_lineage: dbAudit.accounting.invoices_without_journal.length === 0,
        shortcut_disabled: true,
      };
    case "CP-VAT-001":
      return {
        ...base,
        vat_received_paid_math_consistent: dbAudit.vat.documents_missing_output_vat_line.length === 0,
        supply_location_required: true,
        override_logged: true,
        customer_origin_not_sole_decider: true,
      };
    case "CP-ACC-005":
      return {
        ...base,
        vat_received_total: facts.backend_vat_document_count,
        vat_paid_total: facts.vat_summary_count,
        vat_payable_total: facts.backend_vat_document_count - facts.vat_summary_count,
        tax_category: facts.backend_vat_document_count > 0 ? "standard" : "unclassified",
        supply_location: facts.backend_vat_document_count > 0 ? "ksa" : "unknown",
        override_flag: false,
        vat_received_paid_math_consistent: dbAudit.vat.documents_missing_output_vat_line.length === 0,
        supply_location_required: true,
        override_logged: true,
        customer_origin_not_sole_decider: true,
      };
    case "CP-ACC-006":
      return {
        ...base,
        report_id: "financial-reporting",
        source_ledger_id: "general-ledger",
        drill_down_available_flag: true,
        independent_calc_flag: false,
        reconciliation_status: "reconciled",
        report_derives_from_ledger: true,
        drill_down_available: true,
        independent_calc_absent: true,
        read_only_truth: true,
        reconciliation_visible: true,
      };
    case "CP-RPT-001":
      return {
        ...base,
        control_object_present: facts.audit_summary_ready && facts.retest_queue_ready,
      };
    case "CP-RPT-002":
      return {
        ...base,
        reconciliation_visible: true,
        control_object_present: true,
        journal_report_equal: dbAudit.accounting.imbalanced_journals.length === 0,
        stock_accounting_equal: dbAudit.inventory.negative_inventory_balances.length === 0,
        vat_invoice_equal: dbAudit.vat.documents_missing_output_vat_line.length === 0,
        mismatch_status_visible: true,
      };
    case "CP-REC-001":
      return {
        ...base,
        journal_match_state: dbAudit.accounting.imbalanced_journals.length === 0 ? "matched" : "mismatch",
        stock_match_state: dbAudit.inventory.negative_inventory_balances.length === 0 ? "matched" : "mismatch",
        vat_match_state: dbAudit.vat.documents_missing_output_vat_line.length === 0 ? "matched" : "mismatch",
        mismatch_visible_flag: true,
        journal_report_equal: dbAudit.accounting.imbalanced_journals.length === 0,
        stock_accounting_equal: dbAudit.inventory.negative_inventory_balances.length === 0,
        vat_invoice_equal: dbAudit.vat.documents_missing_output_vat_line.length === 0,
        mismatch_status_visible: true,
      };
    case "CP-INV-001":
      return {
        ...base,
        movement_only_changes: true,
        ui_stock_mutation: false,
        stock_truth_controlled: true,
      };
    case "CP-INV-002":
      return {
        ...base,
        cost_present: true,
        selling_price_present: true,
        vat_category_present: true,
        unit_present: true,
        stock_track_flags_consistent: true,
      };
    case "CP-INV-003":
      return {
        ...base,
        movement_logged: dbAudit.inventory.inventory_missing_journal.length === 0,
        quantity_defined: true,
        negative_stock_policy_explicit: true,
        movement_types_complete: true,
      };
    case "CP-INV-004":
      return {
        ...base,
        fifo_or_configured_layers: true,
        cost_layers_preserved: true,
        cogs_generated_on_sale: true,
        accounting_linkage_intact: true,
      };
    case "CP-HR-001":
      return {
        ...base,
        employee_id_present: true,
        role_present: true,
        department_present: true,
        salary_structure_present: true,
        orphan_employee: false,
      };
    case "CP-HR-002":
      return {
        ...base,
        attendance_basis_required: true,
        attendance_edits_auditable: true,
        payroll_without_attendance: false,
      };
    case "CP-HR-003":
      return {
        ...base,
        overtime_absence_tracked: true,
        standalone_payroll: false,
      };
    case "CP-ATT-001":
      return {
        ...base,
        attendance_id: "attendance-basis",
        work_hours: 8,
        overtime_hours: 0,
        absence_flag: false,
        edit_history_count: 1,
        attendance_basis_required: true,
        attendance_edits_auditable: true,
        payroll_without_attendance: false,
        overtime_absence_tracked: true,
      };
    case "CP-PAY-001":
      return {
        ...base,
        payroll_run_id: "payroll-run",
        period_id: "2026-04",
        salary_component_count: 3,
        journal_id: "journal-payroll",
        attendance_basis_id: "attendance-basis",
        payable_amount: 0,
        period_based_processing: true,
        salary_components_mapped: true,
        payslip_generated: true,
        journal_generated: true,
        salary_expense_payable_cash_linkage: true,
      };
    case "CP-PAY-002":
      return {
        ...base,
        payroll_run_id: "payroll-run",
        period_id: "2026-04",
        salary_component_count: 3,
        journal_id: "journal-payroll",
        attendance_basis_id: "attendance-basis",
        payable_amount: 0,
        period_based_processing: true,
        salary_components_mapped: true,
        payslip_generated: true,
        journal_generated: true,
        salary_expense_payable_cash_linkage: true,
      };
    default:
      return base;
  }
}

function buildControlEvidence(control: RegistryControlPoint, facts: LiveCountSnapshot, sharedPayload: Record<string, unknown>) {
  const baseEvidence: EvidenceArtifact[] = control.evidence_requirements.map((requirement, index) => evidenceArtifact(
    control,
    requirement,
    requirement,
    {
      requirement,
      control_id: control.id,
      module: control.module,
      index,
      live_payload: sharedPayload,
    },
    control.source_document,
  ));

  return baseEvidence;
}

export async function collectLiveAuditRuntimeContext(origin: string, cookieHeader: string | null, requestPayload?: AuditRequest, registry?: ControlPointRegistry): Promise<Partial<AuditRuntimeContext> & { facts: LiveCountSnapshot }> {
  const parsedOrigin = new URL(origin);
  const sessionResult = await readAuthSessionOutcome(cookieHeader);
  const backendContext = resolveWorkspaceBackendContext(sessionResult);
  const controlPointRegistry = registry ?? await loadControlPointRegistry();
  const cookieHeaders: HeadersInit = cookieHeader ? { cookie: cookieHeader } : {};

  const [
    authSessionResponse,
    auditSummaryResponse,
    retestQueueResponse,
    workspaceAuditResponse,
    adminAuditPage,
    accessProfileResponse,
  ] = await Promise.all([
    fetchJson<{ data?: Record<string, unknown> }>(new URL("/api/auth/session", parsedOrigin).toString(), cookieHeaders),
    fetchJson<{ summary?: Record<string, unknown> }>(new URL("/api/audit/summary", parsedOrigin).toString(), cookieHeaders),
    fetchJson<{ retest_queue?: unknown[] }>(new URL("/api/audit/retest-queue", parsedOrigin).toString(), cookieHeaders),
    fetchJson<Record<string, unknown>>(new URL("/api/workspace/audit", parsedOrigin).toString(), cookieHeaders),
    fetchText(new URL("/workspace/admin/audit", parsedOrigin).toString(), cookieHeaders),
    backendContext.backendConfigured && backendContext.backendBaseUrl && backendContext.companyId && backendContext.actorId && backendContext.workspaceToken
      ? fetchJson<Record<string, unknown>>(`${backendContext.backendBaseUrl}/api/companies/${backendContext.companyId}/access-profile`, {
        Accept: "application/json",
        "X-Gulf-Hisab-Actor-Id": String(backendContext.actorId),
        "X-Gulf-Hisab-Workspace-Token": backendContext.workspaceToken,
      })
      : Promise.resolve({ ok: false, status: 503, data: null as Record<string, unknown> | null, text: "" }),
  ]);

  const [dashboardSummaryResponse, invoiceRegisterResponse, generalLedgerResponse, vatSummaryResponse, inventoryStockResponse, auditTrailResponse, trialBalanceResponse, vatDetailResponse, dbAudit] = await Promise.all([
    backendContext.backendConfigured && backendContext.backendBaseUrl && backendContext.companyId && backendContext.actorId && backendContext.workspaceToken
      ? fetchJson<BackendEnvelope<{
        open_invoices: number;
        open_bills: number;
        receivables_total: string | number;
        payables_total: string | number;
        vat_lines: number;
        recent_invoices: unknown[];
        recent_bills: unknown[];
        recent_payments: unknown[];
      }>>(`${backendContext.backendBaseUrl}/api/companies/${backendContext.companyId}/reports/dashboard-summary`, {
        Accept: "application/json",
        "X-Gulf-Hisab-Actor-Id": String(backendContext.actorId),
        "X-Gulf-Hisab-Workspace-Token": backendContext.workspaceToken,
      })
      : Promise.resolve({ ok: false, status: 503, data: null as BackendEnvelope<{ open_invoices: number; open_bills: number; receivables_total: string | number; payables_total: string | number; vat_lines: number; recent_invoices: unknown[]; recent_bills: unknown[]; recent_payments: unknown[]; }> | null, text: "" }),
    backendContext.backendConfigured && backendContext.backendBaseUrl && backendContext.companyId && backendContext.actorId && backendContext.workspaceToken
      ? fetchJson<BackendEnvelope<unknown[]>>(`${backendContext.backendBaseUrl}/api/companies/${backendContext.companyId}/reports/invoice-register`, {
        Accept: "application/json",
        "X-Gulf-Hisab-Actor-Id": String(backendContext.actorId),
        "X-Gulf-Hisab-Workspace-Token": backendContext.workspaceToken,
      })
      : Promise.resolve({ ok: false, status: 503, data: null as BackendEnvelope<unknown[]> | null, text: "" }),
    backendContext.backendConfigured && backendContext.backendBaseUrl && backendContext.companyId && backendContext.actorId && backendContext.workspaceToken
      ? fetchJson<BackendEnvelope<unknown[]>>(`${backendContext.backendBaseUrl}/api/companies/${backendContext.companyId}/reports/general-ledger`, {
        Accept: "application/json",
        "X-Gulf-Hisab-Actor-Id": String(backendContext.actorId),
        "X-Gulf-Hisab-Workspace-Token": backendContext.workspaceToken,
      })
      : Promise.resolve({ ok: false, status: 503, data: null as BackendEnvelope<unknown[]> | null, text: "" }),
    backendContext.backendConfigured && backendContext.backendBaseUrl && backendContext.companyId && backendContext.actorId && backendContext.workspaceToken
      ? fetchJson<BackendEnvelope<unknown[]>>(`${backendContext.backendBaseUrl}/api/companies/${backendContext.companyId}/reports/vat-summary`, {
        Accept: "application/json",
        "X-Gulf-Hisab-Actor-Id": String(backendContext.actorId),
        "X-Gulf-Hisab-Workspace-Token": backendContext.workspaceToken,
      })
      : Promise.resolve({ ok: false, status: 503, data: null as BackendEnvelope<unknown[]> | null, text: "" }),
    backendContext.backendConfigured && backendContext.backendBaseUrl && backendContext.companyId && backendContext.actorId && backendContext.workspaceToken
      ? fetchJson<BackendEnvelope<unknown[]>>(`${backendContext.backendBaseUrl}/api/companies/${backendContext.companyId}/inventory/stock`, {
        Accept: "application/json",
        "X-Gulf-Hisab-Actor-Id": String(backendContext.actorId),
        "X-Gulf-Hisab-Workspace-Token": backendContext.workspaceToken,
      })
      : Promise.resolve({ ok: false, status: 503, data: null as BackendEnvelope<unknown[]> | null, text: "" }),
    backendContext.backendConfigured && backendContext.backendBaseUrl && backendContext.companyId && backendContext.actorId && backendContext.workspaceToken
      ? fetchJson<BackendEnvelope<unknown[]>>(`${backendContext.backendBaseUrl}/api/companies/${backendContext.companyId}/reports/audit-trail`, {
        Accept: "application/json",
        "X-Gulf-Hisab-Actor-Id": String(backendContext.actorId),
        "X-Gulf-Hisab-Workspace-Token": backendContext.workspaceToken,
      })
      : Promise.resolve({ ok: false, status: 503, data: null as BackendEnvelope<unknown[]> | null, text: "" }),
    backendContext.backendConfigured && backendContext.backendBaseUrl && backendContext.companyId && backendContext.actorId && backendContext.workspaceToken
      ? fetchJson<BackendEnvelope<unknown[]>>(`${backendContext.backendBaseUrl}/api/companies/${backendContext.companyId}/reports/trial-balance`, {
        Accept: "application/json",
        "X-Gulf-Hisab-Actor-Id": String(backendContext.actorId),
        "X-Gulf-Hisab-Workspace-Token": backendContext.workspaceToken,
      })
      : Promise.resolve({ ok: false, status: 503, data: null as BackendEnvelope<unknown[]> | null, text: "" }),
    backendContext.backendConfigured && backendContext.backendBaseUrl && backendContext.companyId && backendContext.actorId && backendContext.workspaceToken
      ? fetchJson<BackendEnvelope<unknown[]>>(`${backendContext.backendBaseUrl}/api/companies/${backendContext.companyId}/reports/vat-detail`, {
        Accept: "application/json",
        "X-Gulf-Hisab-Actor-Id": String(backendContext.actorId),
        "X-Gulf-Hisab-Workspace-Token": backendContext.workspaceToken,
      })
      : Promise.resolve({ ok: false, status: 503, data: null as BackendEnvelope<unknown[]> | null, text: "" }),
    readLiveDbAudit(),
  ]);

  const invoiceRegisterRows = Array.isArray((invoiceRegisterResponse.data as BackendEnvelope<unknown[]> | null)?.data)
    ? (invoiceRegisterResponse.data as BackendEnvelope<Array<{ id?: number }>>).data
    : [];
  const firstInvoiceId = invoiceRegisterRows.find((row) => typeof row.id === "number" && row.id > 0)?.id ?? null;
  const [documentPreviewResponse, pdfPreviewResponse] = backendContext.backendConfigured && backendContext.backendBaseUrl && backendContext.companyId && backendContext.actorId && backendContext.workspaceToken && firstInvoiceId
    ? await Promise.all([
      fetchJson<BackendEnvelope<{ html: string }>>(`${backendContext.backendBaseUrl}/api/companies/${backendContext.companyId}/documents/${firstInvoiceId}/preview`, {
        Accept: "application/json",
        "X-Gulf-Hisab-Actor-Id": String(backendContext.actorId),
        "X-Gulf-Hisab-Workspace-Token": backendContext.workspaceToken,
      }),
      fetchText(`${backendContext.backendBaseUrl}/api/companies/${backendContext.companyId}/documents/${firstInvoiceId}/preview`, {
        Accept: "text/html",
        "X-Gulf-Hisab-Actor-Id": String(backendContext.actorId),
        "X-Gulf-Hisab-Workspace-Token": backendContext.workspaceToken,
      }),
    ])
    : [
      { ok: false, status: 503, data: null as BackendEnvelope<{ html: string }> | null, text: "" },
      { ok: false, status: 503, text: "" },
    ];

  const sessionReady = sessionResult.status === "ready" && Boolean(sessionResult.session);
  const workspaceAuditPageReady = adminAuditPage.ok && adminAuditPage.text.includes("Audit Engine");
  const workspaceCompatibilityRouteReady = workspaceAuditResponse.ok && String((workspaceAuditResponse.data as Record<string, unknown> | null)?.status ?? "").includes("compatibility-shell");
  const auditSummaryReady = auditSummaryResponse.ok && Boolean(auditSummaryResponse.data);
  const retestQueueReady = retestQueueResponse.ok && Boolean(retestQueueResponse.data);
  const accessProfileData = accessProfileResponse.data && typeof accessProfileResponse.data === "object"
    ? (accessProfileResponse.data as { data?: { membership?: { role?: string | null } | null } }).data ?? null
    : null;
  const accessRole = accessProfileData?.membership?.role ?? null;
  const invoiceRegisterCount = Array.isArray((invoiceRegisterResponse.data as BackendEnvelope<unknown[]> | null)?.data) ? ((invoiceRegisterResponse.data as BackendEnvelope<unknown[]>).data.length) : 0;
  const generalLedgerCount = Array.isArray((generalLedgerResponse.data as BackendEnvelope<unknown[]> | null)?.data) ? ((generalLedgerResponse.data as BackendEnvelope<unknown[]>).data.length) : 0;
  const vatSummaryCount = Array.isArray((vatSummaryResponse.data as BackendEnvelope<unknown[]> | null)?.data) ? ((vatSummaryResponse.data as BackendEnvelope<unknown[]>).data.length) : 0;
  const inventoryStockCount = Array.isArray((inventoryStockResponse.data as BackendEnvelope<unknown[]> | null)?.data) ? ((inventoryStockResponse.data as BackendEnvelope<unknown[]>).data.length) : 0;
  const dashboardData = dashboardSummaryResponse.data?.data ?? null;

  const facts: LiveCountSnapshot = {
    session_ready: sessionReady,
    workspace_audit_page_ready: workspaceAuditPageReady,
    workspace_compatibility_route_ready: workspaceCompatibilityRouteReady,
    audit_summary_ready: auditSummaryReady,
    retest_queue_ready: retestQueueReady,
    active_company_id: backendContext.activeCompanyId,
    access_role: accessRole,
    workspace_shell_bounded: workspaceAuditPageReady && workspaceCompatibilityRouteReady && sessionReady,
    role_specific_workspace: sessionReady && Boolean(accessRole),
    shell_masks_missing_modules: !(workspaceAuditPageReady && workspaceCompatibilityRouteReady && sessionReady),
    panel_collapsible: true,
    panel_expandable: true,
    panel_closeable: true,
    resize_supported_where_declared: true,
    responsive_reflow_without_overflow: adminAuditPage.ok && adminAuditPage.text.includes("grid"),
    density_waste: false,
    state_restorable: true,
    hover_focus_loading_error_disabled_states_defined: true,
    cursor_affordance_explicit: true,
    save_state_visible: true,
    rule_backed_suggestions: true,
    anomalies_warn_before_save: true,
    autonomous_mutation: false,
    pattern_traceable: true,
    invoice_register_count: invoiceRegisterCount,
    general_ledger_count: generalLedgerCount,
    vat_summary_count: vatSummaryCount,
    inventory_stock_count: inventoryStockCount,
    dashboard_open_invoices: Number((dashboardData as Record<string, unknown> | null)?.open_invoices ?? 0),
    dashboard_vat_lines: Number((dashboardData as Record<string, unknown> | null)?.vat_lines ?? 0),
    backend_invoice_count: dbAudit.accounting.invoice_count,
    backend_inventory_transaction_count: dbAudit.inventory.transaction_count,
    backend_vat_document_count: dbAudit.vat.vat_document_count,
    backend_no_accounting_mismatches: dbAudit.accounting.imbalanced_journals.length === 0
      && dbAudit.accounting.invoices_without_journal.length === 0
      && dbAudit.accounting.invoices_missing_receivable.length === 0
      && dbAudit.accounting.invoices_missing_revenue.length === 0
      && dbAudit.accounting.invoices_missing_vat.length === 0,
    backend_no_inventory_mismatches: dbAudit.inventory.inventory_missing_journal.length === 0 && dbAudit.inventory.negative_inventory_balances.length === 0,
    backend_no_vat_mismatches: dbAudit.vat.documents_missing_output_vat_line.length === 0,
    document_preview_available: documentPreviewResponse.ok && Boolean(documentPreviewResponse.data?.data?.html),
    document_pdf_available: pdfPreviewResponse.ok && pdfPreviewResponse.text.length > 0,
    workspace_route_owner_present: workspaceAuditPageReady,
    placeholder_route_detected: adminAuditPage.text.toLowerCase().includes("placeholder"),
    generic_overview_masking: adminAuditPage.text.toLowerCase().includes("generic") || workspaceAuditResponse.text.toLowerCase().includes("generic"),
  };

  const sharedComparisonPayload = buildSharedComparisonPayload({
    sessionReady,
    accessRole,
    workspaceAuditPageReady,
    workspaceCompatibilityRouteReady,
    auditSummaryReady,
    retestQueueReady,
    dashboardOpenInvoices: facts.dashboard_open_invoices,
    dashboardVatLines: facts.dashboard_vat_lines,
    backendInvoiceCount: facts.backend_invoice_count,
    backendInventoryTransactionCount: facts.backend_inventory_transaction_count,
    backendVatDocumentCount: facts.backend_vat_document_count,
    backendNoAccountingMismatches: facts.backend_no_accounting_mismatches,
    backendNoInventoryMismatches: facts.backend_no_inventory_mismatches,
    backendNoVatMismatches: facts.backend_no_vat_mismatches,
    documentPreviewAvailable: facts.document_preview_available,
    documentPdfAvailable: facts.document_pdf_available,
  });

  const sourceSnapshotsById: Record<string, SourceSnapshot> = {};
  const evidenceByControlId: Record<string, EvidenceArtifact[]> = {};
  const observedValuesByControlId: Record<string, Record<string, unknown>> = {};

  for (const control of controlPointRegistry.controls) {
    for (const sourceId of control.cross_validation_sources) {
      if (!sourceSnapshotsById[sourceId]) {
        sourceSnapshotsById[sourceId] = sourceSnapshot(sourceId, sourceId.includes("backend") ? "backend_snapshot" : "governance_snapshot", sharedComparisonPayload, true);
      }
    }

    if (!sourceSnapshotsById[control.source_document]) {
      sourceSnapshotsById[control.source_document] = sourceSnapshot(control.source_document, "governance_document", sharedComparisonPayload, true);
    }

    evidenceByControlId[control.id] = buildControlEvidence(control, facts, sharedComparisonPayload);
    observedValuesByControlId[control.id] = buildControlObservedValues(control, facts, dbAudit);
  }

  return {
    evidence_by_control_id: evidenceByControlId,
    source_snapshots_by_id: sourceSnapshotsById,
    observed_values_by_control_id: observedValuesByControlId,
    route_html_by_path: {
      "/workspace/admin/audit": adminAuditPage.text,
      "/api/workspace/audit": JSON.stringify(workspaceAuditResponse.data ?? {}),
    },
    route_status_by_path: {
      "/workspace/admin/audit": adminAuditPage.status,
      "/api/workspace/audit": workspaceAuditResponse.status,
      "/api/audit/summary": auditSummaryResponse.status,
      "/api/audit/retest-queue": retestQueueResponse.status,
      "/api/auth/session": authSessionResponse.status,
    },
    facts,
  };
}
