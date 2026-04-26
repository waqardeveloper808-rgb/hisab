export type SystemMonitorStatus = "pass" | "fail" | "partial" | "blocked";

export type SystemMonitorSeverity = "low" | "medium" | "high" | "critical";

export type SystemMonitorLinkedEntities = {
  invoice_id?: string;
  journal_id?: string;
  product_id?: string;
  vat_entry_id?: string;
};

export type SystemMonitorControlPoint = {
  id: string;
  module: string;
  sub_module: string;
  status: SystemMonitorStatus;
  severity: SystemMonitorSeverity;
  title: string;
  description: string;
  expected_behavior: string;
  actual_behavior: string;
  evidence: unknown[];
  linked_entities: SystemMonitorLinkedEntities;
  linked_project_modules: string[];
  timestamp: string;
  module_code: string;
  traceability: string[];
  link_missing: boolean;
  root_cause_hint: string | null;
  evaluation_method: string;
  evidence_references: string[];
  source_standard_document: string;
  recommended_next_action: string;
};
