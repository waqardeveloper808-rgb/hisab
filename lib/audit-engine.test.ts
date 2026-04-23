import { describe, expect, it } from "vitest";
import { loadControlPointRegistry } from "./audit-engine/registry";
import { evaluatePredicateGroup } from "./audit-engine/predicate-evaluator";
import { runAuditExecution, buildRetestQueue, buildAuditSummary } from "./audit-engine/orchestrator";
import type { AuditExecutionOptions, EvidenceArtifact, SourceSnapshot } from "./audit-engine/types";

function evidence(kind: string, label: string, source_clause_id: string, fields: Record<string, unknown> = {}): EvidenceArtifact {
  return {
    id: `${kind}-${label}`,
    kind,
    label,
    source: source_clause_id,
    traceableTo: [source_clause_id],
    capturedAt: new Date().toISOString(),
    fields,
  };
}

function sourceSnapshot(source_id: string, data: Record<string, unknown>): SourceSnapshot {
  return {
    source_id,
    source_type: "document",
    traceable: true,
    captured_at: new Date().toISOString(),
    data,
  };
}

describe("audit engine registry", () => {
  it("loads the hardened control-point registry", async () => {
    const registry = await loadControlPointRegistry();
    expect(registry.schema).toBe("gulf-hisab.control-point-registry.v2");
    expect(registry.controls).toHaveLength(37);
    expect(registry.controls.every((control) => control.expected_state.predicates.length > 0)).toBe(true);
    expect(registry.controls.every((control) => control.failure_condition.predicates.length > 0)).toBe(true);
  });
});

describe("predicate evaluator", () => {
  it("evaluates AND groups with boolean logic", () => {
    const result = evaluatePredicateGroup({
      logic: "AND",
      summary: "demo",
      predicates: [
        { lhs: "flag", operator: "=", rhs: true },
        { lhs: "count", operator: ">=", rhs: 2 },
        { lhs: "missing", operator: "not_exists" },
      ],
    }, { flag: true, count: 3 }, [], []);

    expect(result.result).toBe(true);
    expect(result.failed_predicates).toHaveLength(0);
    expect(result.passed_predicates).toHaveLength(3);
  });
});

describe("audit execution", () => {
  const passContext: AuditExecutionOptions = {
    request: {
      scope: "selected_controls",
      control_ids: ["CP-GOV-001"],
    },
    context: {
      observed_values_by_control_id: {
        "CP-GOV-001": {
          source_clause_id: "SYS-CON-010",
          source_document: "docs/governance/system-constitution.md",
          status: "active",
          validation_method: "deterministic",
          evidence_item_count: 4,
          cross_validation_source_count: 3,
          measurable_field_count: 5,
          resolved_winner_document: "docs/governance/system-constitution.md",
          precedence_violation: false,
          lower_precedence_override_count: 0,
          deprecation_in_effect: true,
          route_owner_present: true,
          route_resolves_to_real_page: true,
          placeholder_route_detected: false,
          generic_overview_masking: false,
        },
      },
      evidence_by_control_id: {
        "CP-GOV-001": [
          evidence("source_clause_snapshot", "source_clause_snapshot", "SYS-CON-010", {
            source_clause_id: "SYS-CON-010",
            source_document: "docs/governance/system-constitution.md",
          }),
          evidence("precedence_resolution_output", "precedence_resolution_output", "SYS-CON-010", { resolved_winner_document: "docs/governance/system-constitution.md" }),
          evidence("timestamped_review_log", "timestamped_review_log", "SYS-CON-010", { review_timestamp: new Date().toISOString() }),
          evidence("deprecation_map_entry", "deprecation_map_entry", "SYS-CON-010", { deprecation_status: "active" }),
        ],
      },
      source_snapshots_by_id: {
        "docs/governance/system-constitution.md": sourceSnapshot("docs/governance/system-constitution.md", {
          source_clause_id: "SYS-CON-010",
          source_document: "docs/governance/system-constitution.md",
          resolved_winner_document: "docs/governance/system-constitution.md",
          precedence_order: 1,
          deprecation_status: "active",
        }),
        "docs/governance/governance-precedence-matrix.md": sourceSnapshot("docs/governance/governance-precedence-matrix.md", {
          source_clause_id: "SYS-CON-010",
          source_document: "docs/governance/system-constitution.md",
          resolved_winner_document: "docs/governance/system-constitution.md",
          precedence_order: 1,
          deprecation_status: "active",
        }),
        "docs/governance/governance-integration-file-map.md": sourceSnapshot("docs/governance/governance-integration-file-map.md", {
          source_clause_id: "SYS-CON-010",
          source_document: "docs/governance/system-constitution.md",
          resolved_winner_document: "docs/governance/system-constitution.md",
          precedence_order: 1,
          deprecation_status: "active",
        }),
      },
    },
  };

  it("passes a fully evidenced governance control", async () => {
    const execution = await runAuditExecution(passContext);
    const control = execution.control_results[0];

    expect(control.control_id).toBe("CP-GOV-001");
    expect(control.result_status).toBe("pass");
    expect(control.expected_state_result.result).toBe(true);
    expect(control.failure_condition_result.result).toBe(false);
    expect(control.evidence_status.evidence_quality_status).toBe("sufficient");
    expect(control.anti_cheat_result.status).toBe("passed");
    expect(control.cross_validation_result.status).toBe("passed");
    expect(execution.summary.overall_status).toBe("passed");
  });

  it("blocks when required evidence is missing", async () => {
    const execution = await runAuditExecution({
      ...passContext,
      context: {
        ...passContext.context,
        evidence_by_control_id: {
          "CP-GOV-001": [],
        },
      },
    });

    expect(execution.control_results[0].result_status).toBe("not_executable_due_to_missing_evidence");
    expect(execution.control_results[0].evidence_status.evidence_items_missing.length).toBeGreaterThan(0);
  });

  it("fails when the failure condition is triggered", async () => {
    const execution = await runAuditExecution({
      ...passContext,
      context: {
        ...passContext.context,
        observed_values_by_control_id: {
          "CP-GOV-001": {
            ...passContext.context?.observed_values_by_control_id?.["CP-GOV-001"],
            precedence_violation: true,
            route_resolves_to_real_page: false,
          },
        },
        evidence_by_control_id: passContext.context?.evidence_by_control_id,
        source_snapshots_by_id: passContext.context?.source_snapshots_by_id,
      },
    });

    expect(execution.control_results[0].result_status).toBe("fail");
    expect(execution.control_results[0].failure_condition_result.result).toBe(true);
  });

  it("fails on anti-cheat flags", async () => {
    const execution = await runAuditExecution({
      ...passContext,
      context: {
        ...passContext.context,
        evidence_by_control_id: {
          "CP-GOV-001": [
            ...passContext.context?.evidence_by_control_id?.["CP-GOV-001"] ?? [],
            evidence("mocked_response_detected", "mocked_response_detected", "UX-ROUTE-001", { mocked_response_detected: true }),
          ],
        },
      },
    });

    expect(execution.control_results[0].result_status).toBe("fail");
    expect(execution.control_results[0].anti_cheat_result.flags).toContain("mocked_response_detected");
  });

  it("fails a cross-module mismatch", async () => {
    const execution = await runAuditExecution({
      request: {
        scope: "selected_controls",
        control_ids: ["CP-PAY-002"],
      },
      context: {
        observed_values_by_control_id: {
          "CP-PAY-002": {
            source_clause_id: "HR-ACC-001",
            source_document: "docs/governance/payroll-accounting-integration.md",
            status: "active",
            validation_method: "cross_module",
            evidence_item_count: 4,
            cross_validation_source_count: 3,
            measurable_field_count: 6,
            period_based_processing: true,
            salary_components_mapped: true,
            payslip_generated: true,
            journal_generated: true,
            salary_expense_payable_cash_linkage: true,
          },
        },
        evidence_by_control_id: {
          "CP-PAY-002": [
            evidence("payroll_run_snapshot", "payroll_run_snapshot", "HR-ACC-001", { payroll_run_id: "PR-1" }),
            evidence("journal_generation_log", "journal_generation_log", "HR-ACC-001", { journal_id: "J-1" }),
            evidence("attendance_basis_log", "attendance_basis_log", "HR-ACC-001", { attendance_basis_id: "ATT-1" }),
            evidence("payslip_log", "payslip_log", "HR-ACC-001", { payslip_id: "PS-1" }),
          ],
        },
        source_snapshots_by_id: {
          "docs/governance/payroll-engine-constitution.md": sourceSnapshot("docs/governance/payroll-engine-constitution.md", { payroll_run_id: "PR-1", period_id: "2026-04" }),
          "docs/governance/payroll-accounting-integration.md": sourceSnapshot("docs/governance/payroll-accounting-integration.md", { payroll_run_id: "PR-1", period_id: "2026-04" }),
          "docs/governance/accounting-engine-constitution.md": sourceSnapshot("docs/governance/accounting-engine-constitution.md", { payroll_run_id: "PR-2", period_id: "2026-04" }),
        },
      },
    });

    expect(execution.control_results[0].result_status).toBe("fail");
    expect(execution.control_results[0].cross_validation_result.status).toBe("failed");
  });

  it("fails a workspace placeholder detection scenario", async () => {
    const execution = await runAuditExecution({
      request: {
        scope: "selected_controls",
        control_ids: ["CP-WSP-001"],
      },
      context: {
        observed_values_by_control_id: {
          "CP-WSP-001": {
            source_clause_id: "UX-ROUTE-001",
            source_document: "docs/governance/workspace-route-ownership.md",
            status: "active",
            validation_method: "structural",
            evidence_item_count: 4,
            cross_validation_source_count: 3,
            measurable_field_count: 5,
            route_owner_present: false,
            route_resolves_to_real_page: false,
            placeholder_route_detected: true,
            generic_overview_masking: true,
          },
        },
        evidence_by_control_id: {
          "CP-WSP-001": [
            evidence("route_owner_snapshot", "route_owner_snapshot", "UX-ROUTE-001", { route_owner_id: "catch-all" }),
            evidence("resolved_page_snapshot", "resolved_page_snapshot", "UX-ROUTE-001", { resolved_page_id: "placeholder" }),
            evidence("route_truth_log", "route_truth_log", "UX-ROUTE-001", { route_pattern: "/workspace/admin/audit" }),
            evidence("placeholder_route_check", "placeholder_route_check", "UX-ROUTE-001", { placeholder_route_flag: true }),
          ],
        },
        source_snapshots_by_id: {
          "docs/governance/user-workspace-constitution.md": sourceSnapshot("docs/governance/user-workspace-constitution.md", { route_owner_id: "catch-all" }),
          "docs/governance/workspace-route-ownership.md": sourceSnapshot("docs/governance/workspace-route-ownership.md", { route_owner_id: "catch-all" }),
          "docs/governance/full-system-governance-integration.md": sourceSnapshot("docs/governance/full-system-governance-integration.md", { route_owner_id: "catch-all" }),
        },
      },
    });

    expect(execution.control_results[0].result_status).toBe("fail");
    expect(execution.control_results[0].failed_predicates.length).toBeGreaterThan(0);
  });

  it("builds summary and retest queue from mixed outcomes", async () => {
    const execution = await runAuditExecution({
      request: {
        scope: "selected_controls",
        control_ids: ["CP-GOV-001", "CP-WSP-001", "CP-PAY-002"],
      },
      context: passContext.context,
    });

    const summary = buildAuditSummary(execution.session.audit_id, "selected_controls", execution.control_results);
    const retestQueue = buildRetestQueue(execution.session.audit_id, execution.control_results);

    expect(summary.total_controls_evaluated).toBe(3);
    expect(summary.pass_count + summary.fail_count + summary.blocked_count + summary.warning_count + summary.not_executable_count).toBe(3);
    expect(retestQueue.length).toBeGreaterThan(0);
  });
});
