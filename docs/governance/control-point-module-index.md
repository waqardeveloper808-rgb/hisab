# Control Point Module Index

| Module | Total | Critical | High | Trigger distribution | Top source documents | Uncovered risk areas |
|---|---:|---:|---:|---|---|---|
| `governance` | 8 | 2 | 4 | governance_review x8 | system-constitution, master-design-authority, master-design-v2, standards-framework-v2, governance-precedence-matrix, implementation-execution-law, architect-dashboard-operating-model, module-completion-and-acceptance-law, governance-runtime-binding-model, governance-lifecycle, full-system-governance-integration | Runtime binding still depends on implementation work. |
| `workspace` | 3 | 1 | 1 | route_load x3 | workspace-route-ownership, user-workspace-constitution | Placeholder route drift and shell masking. |
| `ux` | 4 | 0 | 2 | resize_layout x2, render_preview x1, save_draft x1 | panel-window-behavior-standard, preview-register-detail-standard, ux-interaction-constitution, responsive-layout-constitution | Small-screen overflow regressions. |
| `document_engine` | 2 | 2 | 0 | save_draft x1, finalize x1 | document-engine-constitution, invoice-system-constitution, document-lifecycle-constitution | Finalization gating and traceability wiring. |
| `preview_engine` | 1 | 1 | 0 | render_preview x1 | preview-engine-constitution | Preview/PDF renderer drift. |
| `template_engine` | 1 | 0 | 1 | save_draft x1 | template-engine-constitution, template-editor-constitution | Allowed-block drift. |
| `compliance` | 1 | 1 | 0 | finalize x1 | compliance-document-law, pdf-generator-constitution | ZATCA/EU metadata completeness. |
| `accounting` | 4 | 4 | 0 | post x4 | accounting-engine-constitution, chart-of-accounts-constitution, journal-engine-constitution, transaction-posting-constitution | Posting workflow breadth and mapping gaps. |
| `vat` | 1 | 1 | 0 | finalize x1 | vat-engine-constitution, compliance-document-law | VAT override visibility. |
| `reporting` | 2 | 0 | 2 | generate_report x2 | financial-reporting-constitution, reporting-engine-constitution, cross-module-consistency-constitution | Drill-down completeness. |
| `inventory` | 4 | 3 | 1 | save x3, post x1 | inventory-engine-constitution, product-item-constitution, stock-movement-constitution, stock-valuation-constitution, cogs-engine-constitution, inventory-accounting-integration | Negative stock and valuation edges. |
| `reconciliation` | 1 | 1 | 0 | reconcile x1 | reconciliation-constitution | Matching completeness across live data sets. |
| `intelligence` | 1 | 0 | 0 | save_draft x1 | intelligence-layer-constitution | Pattern library drift. |
| `hr` | 1 | 1 | 0 | save x1 | employee-system-constitution | Orphan employee edge cases. |
| `attendance` | 1 | 0 | 1 | save x1 | timesheet-attendance-constitution | Auditability of edits. |
| `payroll` | 2 | 2 | 0 | calculate_payroll x1, post x1 | payroll-engine-constitution, payroll-accounting-integration | Period close and journal linkage. |
