import type { V2ControlPoint } from "@/backend/app/Support/Standards/v2/control-point-schema";

export const v2ControlPoints: readonly V2ControlPoint[] = 
[
  {
    "id": "CP-ACC-001",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.1",
    "title": "Accounting Engine processing contract",
    "source_standard_clause": "Accounting Engine.processing_logic",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Translate business events into balanced journal entries using configured accounts and posting rules.",
    "control_rule": "Translate business events into balanced journal entries using configured accounts and posting rules.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Accounting Engine.processing_logic'."
    ],
    "evaluation_method": "Review the implementation path that fulfills accounting engine processing responsibilities.",
    "scoring_logic": "Pass when evidence confirms 'Translate business events into balanced journal entries using configured accounts and posting rules.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "service implementation trace",
      "workflow execution evidence"
    ],
    "nonconformity": "Accounting Engine processing responsibilities are not enforceable in runtime behavior.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Accounting Engine",
    "evaluator": "Accounting Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "document-engine",
      "inventory-engine",
      "reports-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-ACC-002",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.2",
    "title": "Every entry must keep source type, source id, and linked document context",
    "source_standard_clause": "Accounting Engine.traceability_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Traceability requirement from Accounting Engine: Every entry must keep source type, source id, and linked document context",
    "control_rule": "Every entry must keep source type, source id, and linked document context",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Accounting Engine.traceability_rules[0]'."
    ],
    "evaluation_method": "Inspect persisted identifiers and confirm the system retains the traceability required by 'Every entry must keep source type, source id, and linked document context'.",
    "scoring_logic": "Pass when evidence confirms 'Every entry must keep source type, source id, and linked document context' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "stored linkage sample",
      "lookup evidence"
    ],
    "nonconformity": "Required traceability is missing for 'Every entry must keep source type, source id, and linked document context'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Accounting Engine",
    "evaluator": "Accounting Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "document-engine",
      "inventory-engine",
      "reports-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-ACC-003",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.3",
    "title": "Entries must balance",
    "source_standard_clause": "Accounting Engine.validation_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Accounting Engine: Entries must balance",
    "control_rule": "Entries must balance",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Accounting Engine.validation_rules[0]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'Entries must balance'.",
    "scoring_logic": "Pass when evidence confirms 'Entries must balance' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'Entries must balance'.",
    "control_weight": 9,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Accounting Engine",
    "evaluator": "Accounting Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "document-engine",
      "inventory-engine",
      "reports-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-ACC-004",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.4",
    "title": "Required accounts must exist",
    "source_standard_clause": "Accounting Engine.validation_rules[1]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Accounting Engine: Required accounts must exist",
    "control_rule": "Required accounts must exist",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Accounting Engine.validation_rules[1]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'Required accounts must exist'.",
    "scoring_logic": "Pass when evidence confirms 'Required accounts must exist' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'Required accounts must exist'.",
    "control_weight": 9,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Accounting Engine",
    "evaluator": "Accounting Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "document-engine",
      "inventory-engine",
      "reports-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-ACC-005",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.5",
    "title": "Posting date must be in an open period if enforced",
    "source_standard_clause": "Accounting Engine.validation_rules[2]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Accounting Engine: Posting date must be in an open period if enforced",
    "control_rule": "Posting date must be in an open period if enforced",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Accounting Engine.validation_rules[2]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'Posting date must be in an open period if enforced'.",
    "scoring_logic": "Pass when evidence confirms 'Posting date must be in an open period if enforced' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'Posting date must be in an open period if enforced'.",
    "control_weight": 9,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Accounting Engine",
    "evaluator": "Accounting Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "document-engine",
      "inventory-engine",
      "reports-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-ACC-006",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.6",
    "title": "Accounting Engine feature - chart of accounts",
    "source_standard_clause": "accounting-engine.requiredFeatures[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Accounting Engine must provide the required feature 'chart of accounts'.",
    "control_rule": "Accounting Engine must provide chart of accounts as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'accounting-engine.requiredFeatures[0]'."
    ],
    "evaluation_method": "Verify that 'chart of accounts' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Accounting Engine must provide chart of accounts as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Accounting Engine does not provide the required feature 'chart of accounts'.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Accounting Engine",
    "evaluator": "Accounting Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "document-engine",
      "inventory-engine",
      "tax-vat-engine",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-ACC-007",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.7",
    "title": "Accounting Engine feature - journal posting",
    "source_standard_clause": "accounting-engine.requiredFeatures[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Accounting Engine must provide the required feature 'journal posting'.",
    "control_rule": "Accounting Engine must provide journal posting as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'accounting-engine.requiredFeatures[1]'."
    ],
    "evaluation_method": "Verify that 'journal posting' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Accounting Engine must provide journal posting as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Accounting Engine does not provide the required feature 'journal posting'.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Accounting Engine",
    "evaluator": "Accounting Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "document-engine",
      "inventory-engine",
      "tax-vat-engine",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-ACC-008",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.8",
    "title": "Accounting Engine feature - opening balances",
    "source_standard_clause": "accounting-engine.requiredFeatures[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Accounting Engine must provide the required feature 'opening balances'.",
    "control_rule": "Accounting Engine must provide opening balances as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'accounting-engine.requiredFeatures[2]'."
    ],
    "evaluation_method": "Verify that 'opening balances' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Accounting Engine must provide opening balances as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Accounting Engine does not provide the required feature 'opening balances'.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Accounting Engine",
    "evaluator": "Accounting Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "document-engine",
      "inventory-engine",
      "tax-vat-engine",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-ACC-009",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.9",
    "title": "Accounting Engine feature - source linkage",
    "source_standard_clause": "accounting-engine.requiredFeatures[3]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Accounting Engine must provide the required feature 'source linkage'.",
    "control_rule": "Accounting Engine must provide source linkage as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'accounting-engine.requiredFeatures[3]'."
    ],
    "evaluation_method": "Verify that 'source linkage' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Accounting Engine must provide source linkage as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Accounting Engine does not provide the required feature 'source linkage'.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Accounting Engine",
    "evaluator": "Accounting Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "document-engine",
      "inventory-engine",
      "tax-vat-engine",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-ACC-010",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.10",
    "title": "Accounting Engine proof expectation - documents and inventory create traceable journal impacts",
    "source_standard_clause": "accounting-engine.requiredProofExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Accounting Engine must produce the proof expectation 'documents and inventory create traceable journal impacts'.",
    "control_rule": "Accounting Engine must produce evidence that 'documents and inventory create traceable journal impacts'.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'accounting-engine.requiredProofExpectations[0]'."
    ],
    "evaluation_method": "Run the proof path and verify evidence exists for 'documents and inventory create traceable journal impacts'.",
    "scoring_logic": "Pass when evidence confirms 'Accounting Engine must produce evidence that 'documents and inventory create traceable journal impacts'.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "proof artifact",
      "execution summary"
    ],
    "nonconformity": "Accounting Engine cannot produce proof for 'documents and inventory create traceable journal impacts'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "Accounting Engine",
    "evaluator": "Accounting Engine reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "proof-layer",
      "document-engine",
      "inventory-engine",
      "tax-vat-engine",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-ACC-011",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.11",
    "title": "Accounting Engine UI expectation - real accounting routes",
    "source_standard_clause": "accounting-engine.requiredUiExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Accounting Engine must visibly satisfy the UI expectation 'real accounting routes'.",
    "control_rule": "Accounting Engine must expose real accounting routes without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'accounting-engine.requiredUiExpectations[0]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'real accounting routes' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Accounting Engine must expose real accounting routes without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Accounting Engine does not satisfy the UI expectation 'real accounting routes'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Accounting Engine",
    "evaluator": "Accounting Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "ui-ux-shell",
      "document-engine",
      "inventory-engine",
      "tax-vat-engine",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-ACC-012",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.12",
    "title": "Accounting Engine UI expectation - journal and ledger drill-down",
    "source_standard_clause": "accounting-engine.requiredUiExpectations[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Accounting Engine must visibly satisfy the UI expectation 'journal and ledger drill-down'.",
    "control_rule": "Accounting Engine must expose journal and ledger drill-down without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'accounting-engine.requiredUiExpectations[1]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'journal and ledger drill-down' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Accounting Engine must expose journal and ledger drill-down without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Accounting Engine does not satisfy the UI expectation 'journal and ledger drill-down'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Accounting Engine",
    "evaluator": "Accounting Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "ui-ux-shell",
      "document-engine",
      "inventory-engine",
      "tax-vat-engine",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-ACC-013",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.13",
    "title": "Do not weaken runtime accounting enforcement.",
    "source_standard_clause": "constitution.non_negotiable_rules[0]",
    "source_standard_document": "Master Design vNext / Constitution",
    "description": "Non-negotiable system rule: Do not weaken runtime accounting enforcement.",
    "control_rule": "Do not weaken runtime accounting enforcement.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'constitution.non_negotiable_rules[0]'."
    ],
    "evaluation_method": "Inspect runtime behavior and confirm the system does not violate 'Do not weaken runtime accounting enforcement.'.",
    "scoring_logic": "Pass when evidence confirms 'Do not weaken runtime accounting enforcement.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "runtime proof",
      "control center evidence"
    ],
    "nonconformity": "System behavior violates the non-negotiable rule 'Do not weaken runtime accounting enforcement.'.",
    "control_weight": 10,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and pre-deployment review",
    "control_owner": "System Governance",
    "evaluator": "Governance reviewer",
    "reviewer": "Architecture reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "document-engine",
      "inventory-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-ACC-014",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.14",
    "title": "Do not change invoice posting formulas unless explicitly required by accounting law.",
    "source_standard_clause": "constitution.non_negotiable_rules[2]",
    "source_standard_document": "Master Design vNext / Constitution",
    "description": "Non-negotiable system rule: Do not change invoice posting formulas unless explicitly required by accounting law.",
    "control_rule": "Do not change invoice posting formulas unless explicitly required by accounting law.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'constitution.non_negotiable_rules[2]'."
    ],
    "evaluation_method": "Inspect runtime behavior and confirm the system does not violate 'Do not change invoice posting formulas unless explicitly required by accounting law.'.",
    "scoring_logic": "Pass when evidence confirms 'Do not change invoice posting formulas unless explicitly required by accounting law.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "runtime proof",
      "control center evidence"
    ],
    "nonconformity": "System behavior violates the non-negotiable rule 'Do not change invoice posting formulas unless explicitly required by accounting law.'.",
    "control_weight": 10,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and pre-deployment review",
    "control_owner": "System Governance",
    "evaluator": "Governance reviewer",
    "reviewer": "Architecture reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "document-engine",
      "inventory-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-ACC-015",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.15",
    "title": "Do not change inventory posting formulas unless explicitly required by accounting law.",
    "source_standard_clause": "constitution.non_negotiable_rules[3]",
    "source_standard_document": "Master Design vNext / Constitution",
    "description": "Non-negotiable system rule: Do not change inventory posting formulas unless explicitly required by accounting law.",
    "control_rule": "Do not change inventory posting formulas unless explicitly required by accounting law.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'constitution.non_negotiable_rules[3]'."
    ],
    "evaluation_method": "Inspect runtime behavior and confirm the system does not violate 'Do not change inventory posting formulas unless explicitly required by accounting law.'.",
    "scoring_logic": "Pass when evidence confirms 'Do not change inventory posting formulas unless explicitly required by accounting law.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "runtime proof",
      "control center evidence"
    ],
    "nonconformity": "System behavior violates the non-negotiable rule 'Do not change inventory posting formulas unless explicitly required by accounting law.'.",
    "control_weight": 10,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and pre-deployment review",
    "control_owner": "System Governance",
    "evaluator": "Governance reviewer",
    "reviewer": "Architecture reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "document-engine",
      "inventory-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-ACC-016",
    "version": "2.0.0",
    "module_code": "ACC",
    "module_name": "Accounting Control",
    "chapter_number": "3.16",
    "title": "Do not hardcode account IDs.",
    "source_standard_clause": "constitution.non_negotiable_rules[4]",
    "source_standard_document": "Master Design vNext / Constitution",
    "description": "Non-negotiable system rule: Do not hardcode account IDs.",
    "control_rule": "Do not hardcode account IDs.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'constitution.non_negotiable_rules[4]'."
    ],
    "evaluation_method": "Inspect runtime behavior and confirm the system does not violate 'Do not hardcode account IDs.'.",
    "scoring_logic": "Pass when evidence confirms 'Do not hardcode account IDs.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "runtime proof",
      "control center evidence"
    ],
    "nonconformity": "System behavior violates the non-negotiable rule 'Do not hardcode account IDs.'.",
    "control_weight": 10,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and pre-deployment review",
    "control_owner": "System Governance",
    "evaluator": "Governance reviewer",
    "reviewer": "Architecture reviewer",
    "linked_project_modules": [
      "accounting-engine",
      "document-engine",
      "inventory-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-TAX-001",
    "version": "2.0.0",
    "module_code": "TAX",
    "module_name": "VAT / Tax Control",
    "chapter_number": "5.1",
    "title": "Tax / VAT Engine feature - VAT calculation",
    "source_standard_clause": "tax-vat-engine.requiredFeatures[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Tax / VAT Engine must provide the required feature 'VAT calculation'.",
    "control_rule": "Tax / VAT Engine must provide VAT calculation as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'tax-vat-engine.requiredFeatures[0]'."
    ],
    "evaluation_method": "Verify that 'VAT calculation' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Tax / VAT Engine must provide VAT calculation as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Tax / VAT Engine does not provide the required feature 'VAT calculation'.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Tax / VAT Engine",
    "evaluator": "Tax / VAT Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "tax-vat-engine",
      "contacts-counterparties",
      "document-engine",
      "reports-engine",
      "compliance-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TAX-002",
    "version": "2.0.0",
    "module_code": "TAX",
    "module_name": "VAT / Tax Control",
    "chapter_number": "5.2",
    "title": "Tax / VAT Engine feature - VAT summary and detail",
    "source_standard_clause": "tax-vat-engine.requiredFeatures[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Tax / VAT Engine must provide the required feature 'VAT summary and detail'.",
    "control_rule": "Tax / VAT Engine must provide VAT summary and detail as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'tax-vat-engine.requiredFeatures[1]'."
    ],
    "evaluation_method": "Verify that 'VAT summary and detail' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Tax / VAT Engine must provide VAT summary and detail as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Tax / VAT Engine does not provide the required feature 'VAT summary and detail'.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Tax / VAT Engine",
    "evaluator": "Tax / VAT Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "tax-vat-engine",
      "contacts-counterparties",
      "document-engine",
      "reports-engine",
      "compliance-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TAX-003",
    "version": "2.0.0",
    "module_code": "TAX",
    "module_name": "VAT / Tax Control",
    "chapter_number": "5.3",
    "title": "Tax / VAT Engine feature - country-owned decision rules",
    "source_standard_clause": "tax-vat-engine.requiredFeatures[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Tax / VAT Engine must provide the required feature 'country-owned decision rules'.",
    "control_rule": "Tax / VAT Engine must provide country-owned decision rules as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'tax-vat-engine.requiredFeatures[2]'."
    ],
    "evaluation_method": "Verify that 'country-owned decision rules' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Tax / VAT Engine must provide country-owned decision rules as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Tax / VAT Engine does not provide the required feature 'country-owned decision rules'.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Tax / VAT Engine",
    "evaluator": "Tax / VAT Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "tax-vat-engine",
      "contacts-counterparties",
      "document-engine",
      "reports-engine",
      "compliance-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TAX-004",
    "version": "2.0.0",
    "module_code": "TAX",
    "module_name": "VAT / Tax Control",
    "chapter_number": "5.4",
    "title": "Tax / VAT Engine proof expectation - VAT outputs reflect posted truth",
    "source_standard_clause": "tax-vat-engine.requiredProofExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Tax / VAT Engine must produce the proof expectation 'VAT outputs reflect posted truth'.",
    "control_rule": "Tax / VAT Engine must produce evidence that 'VAT outputs reflect posted truth'.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'tax-vat-engine.requiredProofExpectations[0]'."
    ],
    "evaluation_method": "Run the proof path and verify evidence exists for 'VAT outputs reflect posted truth'.",
    "scoring_logic": "Pass when evidence confirms 'Tax / VAT Engine must produce evidence that 'VAT outputs reflect posted truth'.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "proof artifact",
      "execution summary"
    ],
    "nonconformity": "Tax / VAT Engine cannot produce proof for 'VAT outputs reflect posted truth'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "Tax / VAT Engine",
    "evaluator": "Tax / VAT Engine reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": [
      "tax-vat-engine",
      "proof-layer",
      "contacts-counterparties",
      "document-engine",
      "reports-engine",
      "compliance-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TAX-005",
    "version": "2.0.0",
    "module_code": "TAX",
    "module_name": "VAT / Tax Control",
    "chapter_number": "5.5",
    "title": "Tax / VAT Engine proof expectation - customer origin affects tax treatment",
    "source_standard_clause": "tax-vat-engine.requiredProofExpectations[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Tax / VAT Engine must produce the proof expectation 'customer origin affects tax treatment'.",
    "control_rule": "Tax / VAT Engine must produce evidence that 'customer origin affects tax treatment'.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'tax-vat-engine.requiredProofExpectations[1]'."
    ],
    "evaluation_method": "Run the proof path and verify evidence exists for 'customer origin affects tax treatment'.",
    "scoring_logic": "Pass when evidence confirms 'Tax / VAT Engine must produce evidence that 'customer origin affects tax treatment'.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "proof artifact",
      "execution summary"
    ],
    "nonconformity": "Tax / VAT Engine cannot produce proof for 'customer origin affects tax treatment'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "Tax / VAT Engine",
    "evaluator": "Tax / VAT Engine reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": [
      "tax-vat-engine",
      "proof-layer",
      "contacts-counterparties",
      "document-engine",
      "reports-engine",
      "compliance-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TAX-006",
    "version": "2.0.0",
    "module_code": "TAX",
    "module_name": "VAT / Tax Control",
    "chapter_number": "5.6",
    "title": "Tax / VAT Engine UI expectation - VAT dashboard",
    "source_standard_clause": "tax-vat-engine.requiredUiExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Tax / VAT Engine must visibly satisfy the UI expectation 'VAT dashboard'.",
    "control_rule": "Tax / VAT Engine must expose VAT dashboard without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'tax-vat-engine.requiredUiExpectations[0]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'VAT dashboard' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Tax / VAT Engine must expose VAT dashboard without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Tax / VAT Engine does not satisfy the UI expectation 'VAT dashboard'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Tax / VAT Engine",
    "evaluator": "Tax / VAT Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "tax-vat-engine",
      "ui-ux-shell",
      "contacts-counterparties",
      "document-engine",
      "reports-engine",
      "compliance-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TAX-007",
    "version": "2.0.0",
    "module_code": "TAX",
    "module_name": "VAT / Tax Control",
    "chapter_number": "5.7",
    "title": "Tax / VAT Engine UI expectation - summary and detail views",
    "source_standard_clause": "tax-vat-engine.requiredUiExpectations[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Tax / VAT Engine must visibly satisfy the UI expectation 'summary and detail views'.",
    "control_rule": "Tax / VAT Engine must expose summary and detail views without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'tax-vat-engine.requiredUiExpectations[1]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'summary and detail views' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Tax / VAT Engine must expose summary and detail views without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Tax / VAT Engine does not satisfy the UI expectation 'summary and detail views'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Tax / VAT Engine",
    "evaluator": "Tax / VAT Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "tax-vat-engine",
      "ui-ux-shell",
      "contacts-counterparties",
      "document-engine",
      "reports-engine",
      "compliance-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TAX-008",
    "version": "2.0.0",
    "module_code": "TAX",
    "module_name": "VAT / Tax Control",
    "chapter_number": "5.8",
    "title": "VAT Engine processing contract",
    "source_standard_clause": "VAT Engine.processing_logic",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Calculate VAT at line and document level and expose compliant output/input VAT totals.",
    "control_rule": "Calculate VAT at line and document level and expose compliant output/input VAT totals.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'VAT Engine.processing_logic'."
    ],
    "evaluation_method": "Review the implementation path that fulfills vat engine processing responsibilities.",
    "scoring_logic": "Pass when evidence confirms 'Calculate VAT at line and document level and expose compliant output/input VAT totals.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "service implementation trace",
      "workflow execution evidence"
    ],
    "nonconformity": "VAT Engine processing responsibilities are not enforceable in runtime behavior.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "VAT Engine",
    "evaluator": "VAT Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "tax-vat-engine",
      "document-engine",
      "reports-engine",
      "company-profile"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TAX-009",
    "version": "2.0.0",
    "module_code": "TAX",
    "module_name": "VAT / Tax Control",
    "chapter_number": "5.9",
    "title": "VAT codes and document context must persist to VAT detail output",
    "source_standard_clause": "VAT Engine.traceability_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Traceability requirement from VAT Engine: VAT codes and document context must persist to VAT detail output",
    "control_rule": "VAT codes and document context must persist to VAT detail output",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'VAT Engine.traceability_rules[0]'."
    ],
    "evaluation_method": "Inspect persisted identifiers and confirm the system retains the traceability required by 'VAT codes and document context must persist to VAT detail output'.",
    "scoring_logic": "Pass when evidence confirms 'VAT codes and document context must persist to VAT detail output' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "stored linkage sample",
      "lookup evidence"
    ],
    "nonconformity": "Required traceability is missing for 'VAT codes and document context must persist to VAT detail output'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "VAT Engine",
    "evaluator": "VAT Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "tax-vat-engine",
      "document-engine",
      "reports-engine",
      "company-profile"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TAX-010",
    "version": "2.0.0",
    "module_code": "TAX",
    "module_name": "VAT / Tax Control",
    "chapter_number": "5.10",
    "title": "Buyer VAT and address requirements on tax invoices",
    "source_standard_clause": "VAT Engine.validation_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from VAT Engine: Buyer VAT and address requirements on tax invoices",
    "control_rule": "Buyer VAT and address requirements on tax invoices",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'VAT Engine.validation_rules[0]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'Buyer VAT and address requirements on tax invoices'.",
    "scoring_logic": "Pass when evidence confirms 'Buyer VAT and address requirements on tax invoices' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'Buyer VAT and address requirements on tax invoices'.",
    "control_weight": 9,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "VAT Engine",
    "evaluator": "VAT Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "tax-vat-engine",
      "document-engine",
      "reports-engine",
      "company-profile"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TAX-011",
    "version": "2.0.0",
    "module_code": "TAX",
    "module_name": "VAT / Tax Control",
    "chapter_number": "5.11",
    "title": "tax category must resolve",
    "source_standard_clause": "VAT Engine.validation_rules[1]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from VAT Engine: tax category must resolve",
    "control_rule": "tax category must resolve",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'VAT Engine.validation_rules[1]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'tax category must resolve'.",
    "scoring_logic": "Pass when evidence confirms 'tax category must resolve' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'tax category must resolve'.",
    "control_weight": 9,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "VAT Engine",
    "evaluator": "VAT Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "tax-vat-engine",
      "document-engine",
      "reports-engine",
      "company-profile"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TAX-012",
    "version": "2.0.0",
    "module_code": "TAX",
    "module_name": "VAT / Tax Control",
    "chapter_number": "5.12",
    "title": "rate math must reconcile with line totals",
    "source_standard_clause": "VAT Engine.validation_rules[2]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from VAT Engine: rate math must reconcile with line totals",
    "control_rule": "rate math must reconcile with line totals",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'VAT Engine.validation_rules[2]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'rate math must reconcile with line totals'.",
    "scoring_logic": "Pass when evidence confirms 'rate math must reconcile with line totals' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'rate math must reconcile with line totals'.",
    "control_weight": 9,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "VAT Engine",
    "evaluator": "VAT Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "tax-vat-engine",
      "document-engine",
      "reports-engine",
      "company-profile"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-IVC-001",
    "version": "2.0.0",
    "module_code": "IVC",
    "module_name": "Invoice Control",
    "chapter_number": "2.1",
    "title": "Invoice Engine processing contract",
    "source_standard_clause": "Invoice Engine.processing_logic",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Create, validate, and finalize sales documents and link them to accounting and downstream payment flows.",
    "control_rule": "Create, validate, and finalize sales documents and link them to accounting and downstream payment flows.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Invoice Engine.processing_logic'."
    ],
    "evaluation_method": "Review the implementation path that fulfills invoice engine processing responsibilities.",
    "scoring_logic": "Pass when evidence confirms 'Create, validate, and finalize sales documents and link them to accounting and downstream payment flows.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "service implementation trace",
      "workflow execution evidence"
    ],
    "nonconformity": "Invoice Engine processing responsibilities are not enforceable in runtime behavior.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Document Engine",
    "evaluator": "Document Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "document-engine",
      "accounting-engine",
      "tax-vat-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-IVC-002",
    "version": "2.0.0",
    "module_code": "IVC",
    "module_name": "Invoice Control",
    "chapter_number": "2.2",
    "title": "Invoice number must map to journal lines and ledger queries",
    "source_standard_clause": "Invoice Engine.traceability_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Traceability requirement from Invoice Engine: Invoice number must map to journal lines and ledger queries",
    "control_rule": "Invoice number must map to journal lines and ledger queries",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Invoice Engine.traceability_rules[0]'."
    ],
    "evaluation_method": "Inspect persisted identifiers and confirm the system retains the traceability required by 'Invoice number must map to journal lines and ledger queries'.",
    "scoring_logic": "Pass when evidence confirms 'Invoice number must map to journal lines and ledger queries' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "stored linkage sample",
      "lookup evidence"
    ],
    "nonconformity": "Required traceability is missing for 'Invoice number must map to journal lines and ledger queries'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Document Engine",
    "evaluator": "Document Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "document-engine",
      "accounting-engine",
      "tax-vat-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-IVC-003",
    "version": "2.0.0",
    "module_code": "IVC",
    "module_name": "Invoice Control",
    "chapter_number": "2.3",
    "title": "Required customer data present",
    "source_standard_clause": "Invoice Engine.validation_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Invoice Engine: Required customer data present",
    "control_rule": "Required customer data present",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Invoice Engine.validation_rules[0]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'Required customer data present'.",
    "scoring_logic": "Pass when evidence confirms 'Required customer data present' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'Required customer data present'.",
    "control_weight": 9,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Document Engine",
    "evaluator": "Document Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "document-engine",
      "accounting-engine",
      "tax-vat-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-IVC-004",
    "version": "2.0.0",
    "module_code": "IVC",
    "module_name": "Invoice Control",
    "chapter_number": "2.4",
    "title": "line items valid",
    "source_standard_clause": "Invoice Engine.validation_rules[1]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Invoice Engine: line items valid",
    "control_rule": "line items valid",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Invoice Engine.validation_rules[1]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'line items valid'.",
    "scoring_logic": "Pass when evidence confirms 'line items valid' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'line items valid'.",
    "control_weight": 9,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Document Engine",
    "evaluator": "Document Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "document-engine",
      "accounting-engine",
      "tax-vat-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-IVC-005",
    "version": "2.0.0",
    "module_code": "IVC",
    "module_name": "Invoice Control",
    "chapter_number": "2.5",
    "title": "tax rules calculable",
    "source_standard_clause": "Invoice Engine.validation_rules[2]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Invoice Engine: tax rules calculable",
    "control_rule": "tax rules calculable",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Invoice Engine.validation_rules[2]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'tax rules calculable'.",
    "scoring_logic": "Pass when evidence confirms 'tax rules calculable' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'tax rules calculable'.",
    "control_weight": 9,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Document Engine",
    "evaluator": "Document Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "document-engine",
      "accounting-engine",
      "tax-vat-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-INV-001",
    "version": "2.0.0",
    "module_code": "INV",
    "module_name": "Inventory Control",
    "chapter_number": "4.1",
    "title": "Inventory Engine processing contract",
    "source_standard_clause": "Inventory Engine.processing_logic",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Persist inventory movements and post inventory and cost journals where applicable.",
    "control_rule": "Persist inventory movements and post inventory and cost journals where applicable.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Inventory Engine.processing_logic'."
    ],
    "evaluation_method": "Review the implementation path that fulfills inventory engine processing responsibilities.",
    "scoring_logic": "Pass when evidence confirms 'Persist inventory movements and post inventory and cost journals where applicable.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "service implementation trace",
      "workflow execution evidence"
    ],
    "nonconformity": "Inventory Engine processing responsibilities are not enforceable in runtime behavior.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Inventory Engine",
    "evaluator": "Inventory Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "inventory-engine",
      "document-engine",
      "accounting-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-INV-002",
    "version": "2.0.0",
    "module_code": "INV",
    "module_name": "Inventory Control",
    "chapter_number": "4.2",
    "title": "Inventory transactions must retain reference, journal entry number, and source linkage",
    "source_standard_clause": "Inventory Engine.traceability_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Traceability requirement from Inventory Engine: Inventory transactions must retain reference, journal entry number, and source linkage",
    "control_rule": "Inventory transactions must retain reference, journal entry number, and source linkage",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Inventory Engine.traceability_rules[0]'."
    ],
    "evaluation_method": "Inspect persisted identifiers and confirm the system retains the traceability required by 'Inventory transactions must retain reference, journal entry number, and source linkage'.",
    "scoring_logic": "Pass when evidence confirms 'Inventory transactions must retain reference, journal entry number, and source linkage' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "stored linkage sample",
      "lookup evidence"
    ],
    "nonconformity": "Required traceability is missing for 'Inventory transactions must retain reference, journal entry number, and source linkage'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Inventory Engine",
    "evaluator": "Inventory Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "inventory-engine",
      "document-engine",
      "accounting-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-INV-003",
    "version": "2.0.0",
    "module_code": "INV",
    "module_name": "Inventory Control",
    "chapter_number": "4.3",
    "title": "No invalid item references",
    "source_standard_clause": "Inventory Engine.validation_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Inventory Engine: No invalid item references",
    "control_rule": "No invalid item references",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Inventory Engine.validation_rules[0]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'No invalid item references'.",
    "scoring_logic": "Pass when evidence confirms 'No invalid item references' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'No invalid item references'.",
    "control_weight": 9,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Inventory Engine",
    "evaluator": "Inventory Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "inventory-engine",
      "document-engine",
      "accounting-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-INV-004",
    "version": "2.0.0",
    "module_code": "INV",
    "module_name": "Inventory Control",
    "chapter_number": "4.4",
    "title": "stock constraints enforced where applicable",
    "source_standard_clause": "Inventory Engine.validation_rules[1]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Inventory Engine: stock constraints enforced where applicable",
    "control_rule": "stock constraints enforced where applicable",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Inventory Engine.validation_rules[1]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'stock constraints enforced where applicable'.",
    "scoring_logic": "Pass when evidence confirms 'stock constraints enforced where applicable' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'stock constraints enforced where applicable'.",
    "control_weight": 9,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Inventory Engine",
    "evaluator": "Inventory Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "inventory-engine",
      "document-engine",
      "accounting-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-INV-005",
    "version": "2.0.0",
    "module_code": "INV",
    "module_name": "Inventory Control",
    "chapter_number": "4.5",
    "title": "cost present for stock-affecting transactions",
    "source_standard_clause": "Inventory Engine.validation_rules[2]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Inventory Engine: cost present for stock-affecting transactions",
    "control_rule": "cost present for stock-affecting transactions",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Inventory Engine.validation_rules[2]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'cost present for stock-affecting transactions'.",
    "scoring_logic": "Pass when evidence confirms 'cost present for stock-affecting transactions' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'cost present for stock-affecting transactions'.",
    "control_weight": 9,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Inventory Engine",
    "evaluator": "Inventory Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "inventory-engine",
      "document-engine",
      "accounting-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-INV-006",
    "version": "2.0.0",
    "module_code": "INV",
    "module_name": "Inventory Control",
    "chapter_number": "4.6",
    "title": "Inventory Engine feature - stock register",
    "source_standard_clause": "inventory-engine.requiredFeatures[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Inventory Engine must provide the required feature 'stock register'.",
    "control_rule": "Inventory Engine must provide stock register as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'inventory-engine.requiredFeatures[0]'."
    ],
    "evaluation_method": "Verify that 'stock register' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Inventory Engine must provide stock register as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Inventory Engine does not provide the required feature 'stock register'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Inventory Engine",
    "evaluator": "Inventory Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "inventory-engine",
      "product-item-service",
      "document-engine",
      "accounting-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-INV-007",
    "version": "2.0.0",
    "module_code": "INV",
    "module_name": "Inventory Control",
    "chapter_number": "4.7",
    "title": "Inventory Engine feature - adjustments",
    "source_standard_clause": "inventory-engine.requiredFeatures[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Inventory Engine must provide the required feature 'adjustments'.",
    "control_rule": "Inventory Engine must provide adjustments as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'inventory-engine.requiredFeatures[1]'."
    ],
    "evaluation_method": "Verify that 'adjustments' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Inventory Engine must provide adjustments as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Inventory Engine does not provide the required feature 'adjustments'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Inventory Engine",
    "evaluator": "Inventory Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "inventory-engine",
      "product-item-service",
      "document-engine",
      "accounting-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-INV-008",
    "version": "2.0.0",
    "module_code": "INV",
    "module_name": "Inventory Control",
    "chapter_number": "4.8",
    "title": "Inventory Engine feature - inventory sales impact",
    "source_standard_clause": "inventory-engine.requiredFeatures[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Inventory Engine must provide the required feature 'inventory sales impact'.",
    "control_rule": "Inventory Engine must provide inventory sales impact as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'inventory-engine.requiredFeatures[2]'."
    ],
    "evaluation_method": "Verify that 'inventory sales impact' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Inventory Engine must provide inventory sales impact as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Inventory Engine does not provide the required feature 'inventory sales impact'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Inventory Engine",
    "evaluator": "Inventory Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "inventory-engine",
      "product-item-service",
      "document-engine",
      "accounting-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-INV-009",
    "version": "2.0.0",
    "module_code": "INV",
    "module_name": "Inventory Control",
    "chapter_number": "4.9",
    "title": "Inventory Engine proof expectation - inventory movement affects accounting and workflow proof",
    "source_standard_clause": "inventory-engine.requiredProofExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Inventory Engine must produce the proof expectation 'inventory movement affects accounting and workflow proof'.",
    "control_rule": "Inventory Engine must produce evidence that 'inventory movement affects accounting and workflow proof'.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'inventory-engine.requiredProofExpectations[0]'."
    ],
    "evaluation_method": "Run the proof path and verify evidence exists for 'inventory movement affects accounting and workflow proof'.",
    "scoring_logic": "Pass when evidence confirms 'Inventory Engine must produce evidence that 'inventory movement affects accounting and workflow proof'.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "proof artifact",
      "execution summary"
    ],
    "nonconformity": "Inventory Engine cannot produce proof for 'inventory movement affects accounting and workflow proof'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "Inventory Engine",
    "evaluator": "Inventory Engine reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": [
      "inventory-engine",
      "proof-layer",
      "product-item-service",
      "document-engine",
      "accounting-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-INV-010",
    "version": "2.0.0",
    "module_code": "INV",
    "module_name": "Inventory Control",
    "chapter_number": "4.10",
    "title": "Inventory Engine UI expectation - real stock register",
    "source_standard_clause": "inventory-engine.requiredUiExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Inventory Engine must visibly satisfy the UI expectation 'real stock register'.",
    "control_rule": "Inventory Engine must expose real stock register without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'inventory-engine.requiredUiExpectations[0]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'real stock register' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Inventory Engine must expose real stock register without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Inventory Engine does not satisfy the UI expectation 'real stock register'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Inventory Engine",
    "evaluator": "Inventory Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "inventory-engine",
      "ui-ux-shell",
      "product-item-service",
      "document-engine",
      "accounting-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-INV-011",
    "version": "2.0.0",
    "module_code": "INV",
    "module_name": "Inventory Control",
    "chapter_number": "4.11",
    "title": "Inventory Engine UI expectation - real adjustment workflow",
    "source_standard_clause": "inventory-engine.requiredUiExpectations[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Inventory Engine must visibly satisfy the UI expectation 'real adjustment workflow'.",
    "control_rule": "Inventory Engine must expose real adjustment workflow without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'inventory-engine.requiredUiExpectations[1]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'real adjustment workflow' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Inventory Engine must expose real adjustment workflow without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Inventory Engine does not satisfy the UI expectation 'real adjustment workflow'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Inventory Engine",
    "evaluator": "Inventory Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "inventory-engine",
      "ui-ux-shell",
      "product-item-service",
      "document-engine",
      "accounting-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-001",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.1",
    "title": "Completion requires evidence and passing checks",
    "source_standard_clause": "decision_rules.complete",
    "source_standard_document": "Prompt Engine v4",
    "description": "Use when definition of done is satisfied with evidence and passing checks.",
    "control_rule": "Completion must only be granted when definition of done is satisfied with evidence and passing checks.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'decision_rules.complete'."
    ],
    "evaluation_method": "Review completion decisions against evidence outputs and test results.",
    "scoring_logic": "Pass when evidence confirms 'Completion must only be granted when definition of done is satisfied with evidence and passing checks.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "decision log",
      "test results",
      "evidence outputs"
    ],
    "nonconformity": "A task is marked complete without evidence or passing checks.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per run and acceptance review",
    "control_owner": "Prompt Governance",
    "evaluator": "Prompt governance reviewer",
    "reviewer": "Architecture reviewer",
    "linked_project_modules": [
      "proof-layer",
      "workflow-intelligence"
    ],
    "linked_files": [
      "system/prompt_engine_v4.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-002",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.2",
    "title": "Evidence law - data_proof",
    "source_standard_clause": "evidence_law[0]",
    "source_standard_document": "Master Design vNext / Evidence Law",
    "description": "Evidence law requires 'data_proof' for completion claims.",
    "control_rule": "Every governed workflow must produce data proof.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'evidence_law[0]'."
    ],
    "evaluation_method": "Review generated evidence and confirm 'data_proof' exists for the governed workflow.",
    "scoring_logic": "Pass when evidence confirms 'Every governed workflow must produce data proof.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "artifact evidence",
      "execution summary"
    ],
    "nonconformity": "Required evidence 'data_proof' is missing from the governed workflow.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per run and acceptance review",
    "control_owner": "Proof Layer",
    "evaluator": "Proof reviewer",
    "reviewer": "Governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "workflow-intelligence",
      "reports-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json",
      "system/prompt_engine_v4.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-003",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.3",
    "title": "Evidence law - journal_ledger_report_output",
    "source_standard_clause": "evidence_law[1]",
    "source_standard_document": "Master Design vNext / Evidence Law",
    "description": "Evidence law requires 'journal_ledger_report_output' for completion claims.",
    "control_rule": "Every governed workflow must produce journal ledger report output.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'evidence_law[1]'."
    ],
    "evaluation_method": "Review generated evidence and confirm 'journal_ledger_report_output' exists for the governed workflow.",
    "scoring_logic": "Pass when evidence confirms 'Every governed workflow must produce journal ledger report output.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "artifact evidence",
      "execution summary"
    ],
    "nonconformity": "Required evidence 'journal_ledger_report_output' is missing from the governed workflow.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per run and acceptance review",
    "control_owner": "Proof Layer",
    "evaluator": "Proof reviewer",
    "reviewer": "Governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "workflow-intelligence",
      "reports-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json",
      "system/prompt_engine_v4.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-004",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.4",
    "title": "Evidence law - api_or_ui_evidence",
    "source_standard_clause": "evidence_law[2]",
    "source_standard_document": "Master Design vNext / Evidence Law",
    "description": "Evidence law requires 'api_or_ui_evidence' for completion claims.",
    "control_rule": "Every governed workflow must produce api or ui evidence.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'evidence_law[2]'."
    ],
    "evaluation_method": "Review generated evidence and confirm 'api_or_ui_evidence' exists for the governed workflow.",
    "scoring_logic": "Pass when evidence confirms 'Every governed workflow must produce api or ui evidence.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "artifact evidence",
      "execution summary"
    ],
    "nonconformity": "Required evidence 'api_or_ui_evidence' is missing from the governed workflow.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per run and acceptance review",
    "control_owner": "Proof Layer",
    "evaluator": "Proof reviewer",
    "reviewer": "Governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "workflow-intelligence",
      "reports-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json",
      "system/prompt_engine_v4.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-005",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.5",
    "title": "Evidence law - completion_summary",
    "source_standard_clause": "evidence_law[3]",
    "source_standard_document": "Master Design vNext / Evidence Law",
    "description": "Evidence law requires 'completion_summary' for completion claims.",
    "control_rule": "Every governed workflow must produce completion summary.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'evidence_law[3]'."
    ],
    "evaluation_method": "Review generated evidence and confirm 'completion_summary' exists for the governed workflow.",
    "scoring_logic": "Pass when evidence confirms 'Every governed workflow must produce completion summary.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "artifact evidence",
      "execution summary"
    ],
    "nonconformity": "Required evidence 'completion_summary' is missing from the governed workflow.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per run and acceptance review",
    "control_owner": "Proof Layer",
    "evaluator": "Proof reviewer",
    "reviewer": "Governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "workflow-intelligence",
      "reports-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json",
      "system/prompt_engine_v4.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-006",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.6",
    "title": "Proof Layer feature - workflow proof scripts",
    "source_standard_clause": "proof-layer.requiredFeatures[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Proof Layer must provide the required feature 'workflow proof scripts'.",
    "control_rule": "Proof Layer must provide workflow proof scripts as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'proof-layer.requiredFeatures[0]'."
    ],
    "evaluation_method": "Verify that 'workflow proof scripts' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Proof Layer must provide workflow proof scripts as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Proof Layer does not provide the required feature 'workflow proof scripts'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Proof Layer",
    "evaluator": "Proof Layer reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "document-engine",
      "accounting-engine",
      "inventory-engine",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-007",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.7",
    "title": "Proof Layer feature - UI/API evidence",
    "source_standard_clause": "proof-layer.requiredFeatures[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Proof Layer must provide the required feature 'UI/API evidence'.",
    "control_rule": "Proof Layer must provide UI/API evidence as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'proof-layer.requiredFeatures[1]'."
    ],
    "evaluation_method": "Verify that 'UI/API evidence' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Proof Layer must provide UI/API evidence as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Proof Layer does not provide the required feature 'UI/API evidence'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Proof Layer",
    "evaluator": "Proof Layer reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "document-engine",
      "accounting-engine",
      "inventory-engine",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-008",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.8",
    "title": "Proof Layer feature - failure diagnostics",
    "source_standard_clause": "proof-layer.requiredFeatures[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Proof Layer must provide the required feature 'failure diagnostics'.",
    "control_rule": "Proof Layer must provide failure diagnostics as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'proof-layer.requiredFeatures[2]'."
    ],
    "evaluation_method": "Verify that 'failure diagnostics' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Proof Layer must provide failure diagnostics as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Proof Layer does not provide the required feature 'failure diagnostics'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Proof Layer",
    "evaluator": "Proof Layer reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "document-engine",
      "accounting-engine",
      "inventory-engine",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-009",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.9",
    "title": "Proof Layer proof expectation - critical flows have reviewable evidence",
    "source_standard_clause": "proof-layer.requiredProofExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Proof Layer must produce the proof expectation 'critical flows have reviewable evidence'.",
    "control_rule": "Proof Layer must produce evidence that 'critical flows have reviewable evidence'.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'proof-layer.requiredProofExpectations[0]'."
    ],
    "evaluation_method": "Run the proof path and verify evidence exists for 'critical flows have reviewable evidence'.",
    "scoring_logic": "Pass when evidence confirms 'Proof Layer must produce evidence that 'critical flows have reviewable evidence'.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "proof artifact",
      "execution summary"
    ],
    "nonconformity": "Proof Layer cannot produce proof for 'critical flows have reviewable evidence'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "Proof Layer",
    "evaluator": "Proof Layer reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "document-engine",
      "accounting-engine",
      "inventory-engine",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-010",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.10",
    "title": "Proof Layer UI expectation - control dashboard reflects proof health",
    "source_standard_clause": "proof-layer.requiredUiExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Proof Layer must visibly satisfy the UI expectation 'control dashboard reflects proof health'.",
    "control_rule": "Proof Layer must expose control dashboard reflects proof health without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'proof-layer.requiredUiExpectations[0]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'control dashboard reflects proof health' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Proof Layer must expose control dashboard reflects proof health without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Proof Layer does not satisfy the UI expectation 'control dashboard reflects proof health'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Proof Layer",
    "evaluator": "Proof Layer reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "ui-ux-shell",
      "document-engine",
      "accounting-engine",
      "inventory-engine",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-011",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.11",
    "title": "Testing Layer processing contract",
    "source_standard_clause": "Testing Layer.processing_logic",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Run smoke, workflow, validation, edge-case, and regression checks against backend and UI surfaces.",
    "control_rule": "Run smoke, workflow, validation, edge-case, and regression checks against backend and UI surfaces.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Testing Layer.processing_logic'."
    ],
    "evaluation_method": "Review the implementation path that fulfills testing layer processing responsibilities.",
    "scoring_logic": "Pass when evidence confirms 'Run smoke, workflow, validation, edge-case, and regression checks against backend and UI surfaces.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "service implementation trace",
      "workflow execution evidence"
    ],
    "nonconformity": "Testing Layer processing responsibilities are not enforceable in runtime behavior.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Testing Layer",
    "evaluator": "Testing Layer reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "workflow-intelligence"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-012",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.12",
    "title": "Tests must reference concrete artifacts, outputs, or report payloads",
    "source_standard_clause": "Testing Layer.traceability_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Traceability requirement from Testing Layer: Tests must reference concrete artifacts, outputs, or report payloads",
    "control_rule": "Tests must reference concrete artifacts, outputs, or report payloads",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Testing Layer.traceability_rules[0]'."
    ],
    "evaluation_method": "Inspect persisted identifiers and confirm the system retains the traceability required by 'Tests must reference concrete artifacts, outputs, or report payloads'.",
    "scoring_logic": "Pass when evidence confirms 'Tests must reference concrete artifacts, outputs, or report payloads' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "stored linkage sample",
      "lookup evidence"
    ],
    "nonconformity": "Required traceability is missing for 'Tests must reference concrete artifacts, outputs, or report payloads'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Testing Layer",
    "evaluator": "Testing Layer reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "workflow-intelligence"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-013",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.13",
    "title": "No task is complete without passing relevant checks",
    "source_standard_clause": "Testing Layer.validation_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Testing Layer: No task is complete without passing relevant checks",
    "control_rule": "No task is complete without passing relevant checks",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Testing Layer.validation_rules[0]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'No task is complete without passing relevant checks'.",
    "scoring_logic": "Pass when evidence confirms 'No task is complete without passing relevant checks' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'No task is complete without passing relevant checks'.",
    "control_weight": 9,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Testing Layer",
    "evaluator": "Testing Layer reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "workflow-intelligence"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-014",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.14",
    "title": "Traceability Engine processing contract",
    "source_standard_clause": "Traceability Engine.processing_logic",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Preserve cross-reference data so every accounting movement can be traced back to a business event.",
    "control_rule": "Preserve cross-reference data so every accounting movement can be traced back to a business event.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Traceability Engine.processing_logic'."
    ],
    "evaluation_method": "Review the implementation path that fulfills traceability engine processing responsibilities.",
    "scoring_logic": "Pass when evidence confirms 'Preserve cross-reference data so every accounting movement can be traced back to a business event.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "service implementation trace",
      "workflow execution evidence"
    ],
    "nonconformity": "Traceability Engine processing responsibilities are not enforceable in runtime behavior.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Traceability Engine",
    "evaluator": "Traceability Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "accounting-engine",
      "document-engine",
      "reports-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-015",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.15",
    "title": "Every cross-module post stores source_type, source_id, and document context",
    "source_standard_clause": "Traceability Engine.traceability_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Traceability requirement from Traceability Engine: Every cross-module post stores source_type, source_id, and document context",
    "control_rule": "Every cross-module post stores source_type, source_id, and document context",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Traceability Engine.traceability_rules[0]'."
    ],
    "evaluation_method": "Inspect persisted identifiers and confirm the system retains the traceability required by 'Every cross-module post stores source_type, source_id, and document context'.",
    "scoring_logic": "Pass when evidence confirms 'Every cross-module post stores source_type, source_id, and document context' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "stored linkage sample",
      "lookup evidence"
    ],
    "nonconformity": "Required traceability is missing for 'Every cross-module post stores source_type, source_id, and document context'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Traceability Engine",
    "evaluator": "Traceability Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "accounting-engine",
      "document-engine",
      "reports-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-016",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.16",
    "title": "No orphan settlement lines",
    "source_standard_clause": "Traceability Engine.validation_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Traceability Engine: No orphan settlement lines",
    "control_rule": "No orphan settlement lines",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Traceability Engine.validation_rules[0]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'No orphan settlement lines'.",
    "scoring_logic": "Pass when evidence confirms 'No orphan settlement lines' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'No orphan settlement lines'.",
    "control_weight": 9,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Traceability Engine",
    "evaluator": "Traceability Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "accounting-engine",
      "document-engine",
      "reports-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-017",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.17",
    "title": "linked document numbers must be queryable",
    "source_standard_clause": "Traceability Engine.validation_rules[1]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Traceability Engine: linked document numbers must be queryable",
    "control_rule": "linked document numbers must be queryable",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Traceability Engine.validation_rules[1]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'linked document numbers must be queryable'.",
    "scoring_logic": "Pass when evidence confirms 'linked document numbers must be queryable' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'linked document numbers must be queryable'.",
    "control_weight": 9,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Traceability Engine",
    "evaluator": "Traceability Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "proof-layer",
      "accounting-engine",
      "document-engine",
      "reports-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-018",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.18",
    "title": "Workflow / Intelligence Layer feature - audit surfacing",
    "source_standard_clause": "workflow-intelligence.requiredFeatures[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Workflow / Intelligence Layer must provide the required feature 'audit surfacing'.",
    "control_rule": "Workflow / Intelligence Layer must provide audit surfacing as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'workflow-intelligence.requiredFeatures[0]'."
    ],
    "evaluation_method": "Verify that 'audit surfacing' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Workflow / Intelligence Layer must provide audit surfacing as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Workflow / Intelligence Layer does not provide the required feature 'audit surfacing'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Workflow / Intelligence Layer",
    "evaluator": "Workflow / Intelligence Layer reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "workflow-intelligence",
      "proof-layer",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-019",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.19",
    "title": "Workflow / Intelligence Layer feature - command/help surfaces",
    "source_standard_clause": "workflow-intelligence.requiredFeatures[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Workflow / Intelligence Layer must provide the required feature 'command/help surfaces'.",
    "control_rule": "Workflow / Intelligence Layer must provide command/help surfaces as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'workflow-intelligence.requiredFeatures[1]'."
    ],
    "evaluation_method": "Verify that 'command/help surfaces' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Workflow / Intelligence Layer must provide command/help surfaces as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Workflow / Intelligence Layer does not provide the required feature 'command/help surfaces'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Workflow / Intelligence Layer",
    "evaluator": "Workflow / Intelligence Layer reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "workflow-intelligence",
      "proof-layer",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-020",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.20",
    "title": "Workflow / Intelligence Layer feature - workflow guidance",
    "source_standard_clause": "workflow-intelligence.requiredFeatures[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Workflow / Intelligence Layer must provide the required feature 'workflow guidance'.",
    "control_rule": "Workflow / Intelligence Layer must provide workflow guidance as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'workflow-intelligence.requiredFeatures[2]'."
    ],
    "evaluation_method": "Verify that 'workflow guidance' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Workflow / Intelligence Layer must provide workflow guidance as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Workflow / Intelligence Layer does not provide the required feature 'workflow guidance'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Workflow / Intelligence Layer",
    "evaluator": "Workflow / Intelligence Layer reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "workflow-intelligence",
      "proof-layer",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-021",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.21",
    "title": "Workflow / Intelligence Layer proof expectation - findings expose real drift rather than fake health",
    "source_standard_clause": "workflow-intelligence.requiredProofExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Workflow / Intelligence Layer must produce the proof expectation 'findings expose real drift rather than fake health'.",
    "control_rule": "Workflow / Intelligence Layer must produce evidence that 'findings expose real drift rather than fake health'.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'workflow-intelligence.requiredProofExpectations[0]'."
    ],
    "evaluation_method": "Run the proof path and verify evidence exists for 'findings expose real drift rather than fake health'.",
    "scoring_logic": "Pass when evidence confirms 'Workflow / Intelligence Layer must produce evidence that 'findings expose real drift rather than fake health'.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "proof artifact",
      "execution summary"
    ],
    "nonconformity": "Workflow / Intelligence Layer cannot produce proof for 'findings expose real drift rather than fake health'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "Workflow / Intelligence Layer",
    "evaluator": "Workflow / Intelligence Layer reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": [
      "workflow-intelligence",
      "proof-layer",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-022",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.22",
    "title": "Workflow / Intelligence Layer UI expectation - operational support surfaces",
    "source_standard_clause": "workflow-intelligence.requiredUiExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Workflow / Intelligence Layer must visibly satisfy the UI expectation 'operational support surfaces'.",
    "control_rule": "Workflow / Intelligence Layer must expose operational support surfaces without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'workflow-intelligence.requiredUiExpectations[0]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'operational support surfaces' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Workflow / Intelligence Layer must expose operational support surfaces without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Workflow / Intelligence Layer does not satisfy the UI expectation 'operational support surfaces'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Workflow / Intelligence Layer",
    "evaluator": "Workflow / Intelligence Layer reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "workflow-intelligence",
      "ui-ux-shell",
      "proof-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AUD-023",
    "version": "2.0.0",
    "module_code": "AUD",
    "module_name": "Audit Control",
    "chapter_number": "6.23",
    "title": "Workflow / Intelligence Layer UI expectation - no vague placeholder queues",
    "source_standard_clause": "workflow-intelligence.requiredUiExpectations[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Workflow / Intelligence Layer must visibly satisfy the UI expectation 'no vague placeholder queues'.",
    "control_rule": "Workflow / Intelligence Layer must expose no vague placeholder queues without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'workflow-intelligence.requiredUiExpectations[1]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'no vague placeholder queues' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Workflow / Intelligence Layer must expose no vague placeholder queues without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Workflow / Intelligence Layer does not satisfy the UI expectation 'no vague placeholder queues'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Workflow / Intelligence Layer",
    "evaluator": "Workflow / Intelligence Layer reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "workflow-intelligence",
      "ui-ux-shell",
      "proof-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-UX-001",
    "version": "2.0.0",
    "module_code": "UX",
    "module_name": "User Experience",
    "chapter_number": "1.1",
    "title": "UI / UX Shell feature - dense operational shell",
    "source_standard_clause": "ui-ux-shell.requiredFeatures[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "UI / UX Shell must provide the required feature 'dense operational shell'.",
    "control_rule": "UI / UX Shell must provide dense operational shell as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'ui-ux-shell.requiredFeatures[0]'."
    ],
    "evaluation_method": "Verify that 'dense operational shell' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'UI / UX Shell must provide dense operational shell as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "UI / UX Shell does not provide the required feature 'dense operational shell'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "UI / UX Shell",
    "evaluator": "UI / UX Shell reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "ui-ux-shell",
      "identity-workspace",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-UX-002",
    "version": "2.0.0",
    "module_code": "UX",
    "module_name": "User Experience",
    "chapter_number": "1.2",
    "title": "UI / UX Shell feature - truthful route ownership",
    "source_standard_clause": "ui-ux-shell.requiredFeatures[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "UI / UX Shell must provide the required feature 'truthful route ownership'.",
    "control_rule": "UI / UX Shell must provide truthful route ownership as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'ui-ux-shell.requiredFeatures[1]'."
    ],
    "evaluation_method": "Verify that 'truthful route ownership' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'UI / UX Shell must provide truthful route ownership as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "UI / UX Shell does not provide the required feature 'truthful route ownership'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "UI / UX Shell",
    "evaluator": "UI / UX Shell reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "ui-ux-shell",
      "identity-workspace",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-UX-003",
    "version": "2.0.0",
    "module_code": "UX",
    "module_name": "User Experience",
    "chapter_number": "1.3",
    "title": "UI / UX Shell feature - master design control tab",
    "source_standard_clause": "ui-ux-shell.requiredFeatures[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "UI / UX Shell must provide the required feature 'master design control tab'.",
    "control_rule": "UI / UX Shell must provide master design control tab as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'ui-ux-shell.requiredFeatures[2]'."
    ],
    "evaluation_method": "Verify that 'master design control tab' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'UI / UX Shell must provide master design control tab as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "UI / UX Shell does not provide the required feature 'master design control tab'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "UI / UX Shell",
    "evaluator": "UI / UX Shell reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "ui-ux-shell",
      "identity-workspace",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-UX-004",
    "version": "2.0.0",
    "module_code": "UX",
    "module_name": "User Experience",
    "chapter_number": "1.4",
    "title": "UI / UX Shell proof expectation - shell exposes real implemented modules",
    "source_standard_clause": "ui-ux-shell.requiredProofExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "UI / UX Shell must produce the proof expectation 'shell exposes real implemented modules'.",
    "control_rule": "UI / UX Shell must produce evidence that 'shell exposes real implemented modules'.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'ui-ux-shell.requiredProofExpectations[0]'."
    ],
    "evaluation_method": "Run the proof path and verify evidence exists for 'shell exposes real implemented modules'.",
    "scoring_logic": "Pass when evidence confirms 'UI / UX Shell must produce evidence that 'shell exposes real implemented modules'.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "proof artifact",
      "execution summary"
    ],
    "nonconformity": "UI / UX Shell cannot produce proof for 'shell exposes real implemented modules'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "UI / UX Shell",
    "evaluator": "UI / UX Shell reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": [
      "ui-ux-shell",
      "proof-layer",
      "identity-workspace",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-UX-005",
    "version": "2.0.0",
    "module_code": "UX",
    "module_name": "User Experience",
    "chapter_number": "1.5",
    "title": "UI / UX Shell UI expectation - no placeholder overclaim for shipped modules",
    "source_standard_clause": "ui-ux-shell.requiredUiExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "UI / UX Shell must visibly satisfy the UI expectation 'no placeholder overclaim for shipped modules'.",
    "control_rule": "UI / UX Shell must expose no placeholder overclaim for shipped modules without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'ui-ux-shell.requiredUiExpectations[0]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'no placeholder overclaim for shipped modules' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'UI / UX Shell must expose no placeholder overclaim for shipped modules without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "UI / UX Shell does not satisfy the UI expectation 'no placeholder overclaim for shipped modules'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "UI / UX Shell",
    "evaluator": "UI / UX Shell reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "ui-ux-shell",
      "identity-workspace",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-UX-006",
    "version": "2.0.0",
    "module_code": "UX",
    "module_name": "User Experience",
    "chapter_number": "1.6",
    "title": "UI / UX Shell UI expectation - live control center route",
    "source_standard_clause": "ui-ux-shell.requiredUiExpectations[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "UI / UX Shell must visibly satisfy the UI expectation 'live control center route'.",
    "control_rule": "UI / UX Shell must expose live control center route without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'ui-ux-shell.requiredUiExpectations[1]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'live control center route' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'UI / UX Shell must expose live control center route without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "UI / UX Shell does not satisfy the UI expectation 'live control center route'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "UI / UX Shell",
    "evaluator": "UI / UX Shell reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "ui-ux-shell",
      "identity-workspace",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-001",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.1",
    "title": "Identity & Workspace feature - authenticated workspace session",
    "source_standard_clause": "identity-workspace.requiredFeatures[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Identity & Workspace must provide the required feature 'authenticated workspace session'.",
    "control_rule": "Identity & Workspace must provide authenticated workspace session as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'identity-workspace.requiredFeatures[0]'."
    ],
    "evaluation_method": "Verify that 'authenticated workspace session' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Identity & Workspace must provide authenticated workspace session as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Identity & Workspace does not provide the required feature 'authenticated workspace session'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Identity & Workspace",
    "evaluator": "Identity & Workspace reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-002",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.2",
    "title": "Identity & Workspace feature - role-aware navigation",
    "source_standard_clause": "identity-workspace.requiredFeatures[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Identity & Workspace must provide the required feature 'role-aware navigation'.",
    "control_rule": "Identity & Workspace must provide role-aware navigation as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'identity-workspace.requiredFeatures[1]'."
    ],
    "evaluation_method": "Verify that 'role-aware navigation' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Identity & Workspace must provide role-aware navigation as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Identity & Workspace does not provide the required feature 'role-aware navigation'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Identity & Workspace",
    "evaluator": "Identity & Workspace reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-003",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.3",
    "title": "Identity & Workspace feature - first-class master design route",
    "source_standard_clause": "identity-workspace.requiredFeatures[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Identity & Workspace must provide the required feature 'first-class master design route'.",
    "control_rule": "Identity & Workspace must provide first-class master design route as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'identity-workspace.requiredFeatures[2]'."
    ],
    "evaluation_method": "Verify that 'first-class master design route' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Identity & Workspace must provide first-class master design route as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Identity & Workspace does not provide the required feature 'first-class master design route'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Identity & Workspace",
    "evaluator": "Identity & Workspace reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-004",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.4",
    "title": "Identity & Workspace proof expectation - route opens under workspace shell",
    "source_standard_clause": "identity-workspace.requiredProofExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Identity & Workspace must produce the proof expectation 'route opens under workspace shell'.",
    "control_rule": "Identity & Workspace must produce evidence that 'route opens under workspace shell'.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'identity-workspace.requiredProofExpectations[0]'."
    ],
    "evaluation_method": "Run the proof path and verify evidence exists for 'route opens under workspace shell'.",
    "scoring_logic": "Pass when evidence confirms 'Identity & Workspace must produce evidence that 'route opens under workspace shell'.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "proof artifact",
      "execution summary"
    ],
    "nonconformity": "Identity & Workspace cannot produce proof for 'route opens under workspace shell'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "Identity & Workspace",
    "evaluator": "Identity & Workspace reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "proof-layer",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-005",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.5",
    "title": "Identity & Workspace proof expectation - navigation exposes control center",
    "source_standard_clause": "identity-workspace.requiredProofExpectations[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Identity & Workspace must produce the proof expectation 'navigation exposes control center'.",
    "control_rule": "Identity & Workspace must produce evidence that 'navigation exposes control center'.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'identity-workspace.requiredProofExpectations[1]'."
    ],
    "evaluation_method": "Run the proof path and verify evidence exists for 'navigation exposes control center'.",
    "scoring_logic": "Pass when evidence confirms 'Identity & Workspace must produce evidence that 'navigation exposes control center'.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "proof artifact",
      "execution summary"
    ],
    "nonconformity": "Identity & Workspace cannot produce proof for 'navigation exposes control center'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "Identity & Workspace",
    "evaluator": "Identity & Workspace reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "proof-layer",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-006",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.6",
    "title": "Identity & Workspace UI expectation - visible master design tab",
    "source_standard_clause": "identity-workspace.requiredUiExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Identity & Workspace must visibly satisfy the UI expectation 'visible master design tab'.",
    "control_rule": "Identity & Workspace must expose visible master design tab without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'identity-workspace.requiredUiExpectations[0]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'visible master design tab' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Identity & Workspace must expose visible master design tab without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Identity & Workspace does not satisfy the UI expectation 'visible master design tab'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Identity & Workspace",
    "evaluator": "Identity & Workspace reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-007",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.7",
    "title": "Identity & Workspace UI expectation - dedicated route ownership",
    "source_standard_clause": "identity-workspace.requiredUiExpectations[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Identity & Workspace must visibly satisfy the UI expectation 'dedicated route ownership'.",
    "control_rule": "Identity & Workspace must expose dedicated route ownership without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'identity-workspace.requiredUiExpectations[1]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'dedicated route ownership' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Identity & Workspace must expose dedicated route ownership without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Identity & Workspace does not satisfy the UI expectation 'dedicated route ownership'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Identity & Workspace",
    "evaluator": "Identity & Workspace reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-008",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.8",
    "title": "Identity & Workspace UI expectation - no catch-all placeholder for shipped control pages",
    "source_standard_clause": "identity-workspace.requiredUiExpectations[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Identity & Workspace must visibly satisfy the UI expectation 'no catch-all placeholder for shipped control pages'.",
    "control_rule": "Identity & Workspace must expose no catch-all placeholder for shipped control pages without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'identity-workspace.requiredUiExpectations[2]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'no catch-all placeholder for shipped control pages' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Identity & Workspace must expose no catch-all placeholder for shipped control pages without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Identity & Workspace does not satisfy the UI expectation 'no catch-all placeholder for shipped control pages'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Identity & Workspace",
    "evaluator": "Identity & Workspace reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-009",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.9",
    "title": "User Workspace priority - Keep receivables, payables, and VAT visible without leaving the main workflow.",
    "source_standard_clause": "user.priorities[0]",
    "source_standard_document": "Workspace Role Definition",
    "description": "User Workspace must satisfy the role priority 'Keep receivables, payables, and VAT visible without leaving the main workflow.'.",
    "control_rule": "Keep receivables, payables, and VAT visible without leaving the main workflow.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'user.priorities[0]'."
    ],
    "evaluation_method": "Inspect the user workspace shell and confirm the priority is reflected in navigation and available actions.",
    "scoring_logic": "Pass when evidence confirms 'Keep receivables, payables, and VAT visible without leaving the main workflow.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "workspace screenshot",
      "route ownership evidence"
    ],
    "nonconformity": "User Workspace does not satisfy the priority 'Keep receivables, payables, and VAT visible without leaving the main workflow.'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "User Workspace",
    "evaluator": "User Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-010",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.10",
    "title": "User Workspace priority - Move from task to module directly instead of routing through abstract overview pages.",
    "source_standard_clause": "user.priorities[1]",
    "source_standard_document": "Workspace Role Definition",
    "description": "User Workspace must satisfy the role priority 'Move from task to module directly instead of routing through abstract overview pages.'.",
    "control_rule": "Move from task to module directly instead of routing through abstract overview pages.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'user.priorities[1]'."
    ],
    "evaluation_method": "Inspect the user workspace shell and confirm the priority is reflected in navigation and available actions.",
    "scoring_logic": "Pass when evidence confirms 'Move from task to module directly instead of routing through abstract overview pages.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "workspace screenshot",
      "route ownership evidence"
    ],
    "nonconformity": "User Workspace does not satisfy the priority 'Move from task to module directly instead of routing through abstract overview pages.'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "User Workspace",
    "evaluator": "User Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-011",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.11",
    "title": "User Workspace priority - Keep every daily action one click away from the role home and sidebar.",
    "source_standard_clause": "user.priorities[2]",
    "source_standard_document": "Workspace Role Definition",
    "description": "User Workspace must satisfy the role priority 'Keep every daily action one click away from the role home and sidebar.'.",
    "control_rule": "Keep every daily action one click away from the role home and sidebar.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'user.priorities[2]'."
    ],
    "evaluation_method": "Inspect the user workspace shell and confirm the priority is reflected in navigation and available actions.",
    "scoring_logic": "Pass when evidence confirms 'Keep every daily action one click away from the role home and sidebar.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "workspace screenshot",
      "route ownership evidence"
    ],
    "nonconformity": "User Workspace does not satisfy the priority 'Keep every daily action one click away from the role home and sidebar.'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "User Workspace",
    "evaluator": "User Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-012",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.12",
    "title": "User Workspace sidebar group - Dashboard",
    "source_standard_clause": "user.sidebarGroups[0]",
    "source_standard_document": "Workspace Role Definition",
    "description": "User Workspace must expose the 'Dashboard' navigation group with direct access to its operational routes.",
    "control_rule": "User Workspace must expose the 'Dashboard' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'user.sidebarGroups[0]'."
    ],
    "evaluation_method": "Review user workspace navigation and confirm the 'Dashboard' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'User Workspace must expose the 'Dashboard' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "User Workspace does not expose the 'Dashboard' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "User Workspace",
    "evaluator": "User Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-013",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.13",
    "title": "User Workspace sidebar group - Sales",
    "source_standard_clause": "user.sidebarGroups[1]",
    "source_standard_document": "Workspace Role Definition",
    "description": "User Workspace must expose the 'Sales' navigation group with direct access to its operational routes.",
    "control_rule": "User Workspace must expose the 'Sales' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'user.sidebarGroups[1]'."
    ],
    "evaluation_method": "Review user workspace navigation and confirm the 'Sales' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'User Workspace must expose the 'Sales' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "User Workspace does not expose the 'Sales' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "User Workspace",
    "evaluator": "User Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-014",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.14",
    "title": "User Workspace sidebar group - Purchases",
    "source_standard_clause": "user.sidebarGroups[2]",
    "source_standard_document": "Workspace Role Definition",
    "description": "User Workspace must expose the 'Purchases' navigation group with direct access to its operational routes.",
    "control_rule": "User Workspace must expose the 'Purchases' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'user.sidebarGroups[2]'."
    ],
    "evaluation_method": "Review user workspace navigation and confirm the 'Purchases' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'User Workspace must expose the 'Purchases' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "User Workspace does not expose the 'Purchases' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "User Workspace",
    "evaluator": "User Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-015",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.15",
    "title": "User Workspace sidebar group - Inventory",
    "source_standard_clause": "user.sidebarGroups[3]",
    "source_standard_document": "Workspace Role Definition",
    "description": "User Workspace must expose the 'Inventory' navigation group with direct access to its operational routes.",
    "control_rule": "User Workspace must expose the 'Inventory' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'user.sidebarGroups[3]'."
    ],
    "evaluation_method": "Review user workspace navigation and confirm the 'Inventory' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'User Workspace must expose the 'Inventory' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "User Workspace does not expose the 'Inventory' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "User Workspace",
    "evaluator": "User Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-016",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.16",
    "title": "User Workspace sidebar group - Accounting",
    "source_standard_clause": "user.sidebarGroups[4]",
    "source_standard_document": "Workspace Role Definition",
    "description": "User Workspace must expose the 'Accounting' navigation group with direct access to its operational routes.",
    "control_rule": "User Workspace must expose the 'Accounting' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'user.sidebarGroups[4]'."
    ],
    "evaluation_method": "Review user workspace navigation and confirm the 'Accounting' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'User Workspace must expose the 'Accounting' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "User Workspace does not expose the 'Accounting' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "User Workspace",
    "evaluator": "User Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-017",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.17",
    "title": "User Workspace sidebar group - Banking",
    "source_standard_clause": "user.sidebarGroups[5]",
    "source_standard_document": "Workspace Role Definition",
    "description": "User Workspace must expose the 'Banking' navigation group with direct access to its operational routes.",
    "control_rule": "User Workspace must expose the 'Banking' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'user.sidebarGroups[5]'."
    ],
    "evaluation_method": "Review user workspace navigation and confirm the 'Banking' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'User Workspace must expose the 'Banking' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "User Workspace does not expose the 'Banking' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "User Workspace",
    "evaluator": "User Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-018",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.18",
    "title": "User Workspace sidebar group - VAT / Compliance",
    "source_standard_clause": "user.sidebarGroups[6]",
    "source_standard_document": "Workspace Role Definition",
    "description": "User Workspace must expose the 'VAT / Compliance' navigation group with direct access to its operational routes.",
    "control_rule": "User Workspace must expose the 'VAT / Compliance' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'user.sidebarGroups[6]'."
    ],
    "evaluation_method": "Review user workspace navigation and confirm the 'VAT / Compliance' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'User Workspace must expose the 'VAT / Compliance' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "User Workspace does not expose the 'VAT / Compliance' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "User Workspace",
    "evaluator": "User Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-019",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.19",
    "title": "User Workspace sidebar group - Reports",
    "source_standard_clause": "user.sidebarGroups[7]",
    "source_standard_document": "Workspace Role Definition",
    "description": "User Workspace must expose the 'Reports' navigation group with direct access to its operational routes.",
    "control_rule": "User Workspace must expose the 'Reports' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'user.sidebarGroups[7]'."
    ],
    "evaluation_method": "Review user workspace navigation and confirm the 'Reports' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'User Workspace must expose the 'Reports' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "User Workspace does not expose the 'Reports' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "User Workspace",
    "evaluator": "User Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-020",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.20",
    "title": "User Workspace sidebar group - Templates",
    "source_standard_clause": "user.sidebarGroups[8]",
    "source_standard_document": "Workspace Role Definition",
    "description": "User Workspace must expose the 'Templates' navigation group with direct access to its operational routes.",
    "control_rule": "User Workspace must expose the 'Templates' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'user.sidebarGroups[8]'."
    ],
    "evaluation_method": "Review user workspace navigation and confirm the 'Templates' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'User Workspace must expose the 'Templates' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "User Workspace does not expose the 'Templates' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "User Workspace",
    "evaluator": "User Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-USR-021",
    "version": "2.0.0",
    "module_code": "USR",
    "module_name": "User Workspace Control",
    "chapter_number": "7.21",
    "title": "User Workspace sidebar group - Settings",
    "source_standard_clause": "user.sidebarGroups[9]",
    "source_standard_document": "Workspace Role Definition",
    "description": "User Workspace must expose the 'Settings' navigation group with direct access to its operational routes.",
    "control_rule": "User Workspace must expose the 'Settings' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'user.sidebarGroups[9]'."
    ],
    "evaluation_method": "Review user workspace navigation and confirm the 'Settings' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'User Workspace must expose the 'Settings' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "User Workspace does not expose the 'Settings' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "User Workspace",
    "evaluator": "User Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-001",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.1",
    "title": "Agent Admin highlight - Commission visibility",
    "source_standard_clause": "admin-agents.highlights[0]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Agent Admin must satisfy the highlighted workspace rule 'Commission visibility'.",
    "control_rule": "Agent Admin must deliver 'Commission visibility' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin-agents.highlights[0]'."
    ],
    "evaluation_method": "Inspect /workspace/admin/agents and confirm 'Commission visibility' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Agent Admin must deliver 'Commission visibility' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Agent Admin does not deliver the highlight 'Commission visibility'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Agent Admin",
    "evaluator": "Agent Admin reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-002",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.2",
    "title": "Agent Admin highlight - Referral search",
    "source_standard_clause": "admin-agents.highlights[1]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Agent Admin must satisfy the highlighted workspace rule 'Referral search'.",
    "control_rule": "Agent Admin must deliver 'Referral search' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin-agents.highlights[1]'."
    ],
    "evaluation_method": "Inspect /workspace/admin/agents and confirm 'Referral search' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Agent Admin must deliver 'Referral search' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Agent Admin does not deliver the highlight 'Referral search'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Agent Admin",
    "evaluator": "Agent Admin reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-003",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.3",
    "title": "Agent Admin highlight - Active and inactive control",
    "source_standard_clause": "admin-agents.highlights[2]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Agent Admin must satisfy the highlighted workspace rule 'Active and inactive control'.",
    "control_rule": "Agent Admin must deliver 'Active and inactive control' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin-agents.highlights[2]'."
    ],
    "evaluation_method": "Inspect /workspace/admin/agents and confirm 'Active and inactive control' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Agent Admin must deliver 'Active and inactive control' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Agent Admin does not deliver the highlight 'Active and inactive control'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Agent Admin",
    "evaluator": "Agent Admin reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-004",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.4",
    "title": "Customers highlight - Company status control",
    "source_standard_clause": "admin-customers.highlights[0]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Customers must satisfy the highlighted workspace rule 'Company status control'.",
    "control_rule": "Customers must deliver 'Company status control' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin-customers.highlights[0]'."
    ],
    "evaluation_method": "Inspect /workspace/admin/customers and confirm 'Company status control' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Customers must deliver 'Company status control' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Customers does not deliver the highlight 'Company status control'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Customers",
    "evaluator": "Customers reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-005",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.5",
    "title": "Customers highlight - Subscription visibility",
    "source_standard_clause": "admin-customers.highlights[1]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Customers must satisfy the highlighted workspace rule 'Subscription visibility'.",
    "control_rule": "Customers must deliver 'Subscription visibility' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin-customers.highlights[1]'."
    ],
    "evaluation_method": "Inspect /workspace/admin/customers and confirm 'Subscription visibility' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Customers must deliver 'Subscription visibility' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Customers does not deliver the highlight 'Subscription visibility'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Customers",
    "evaluator": "Customers reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-006",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.6",
    "title": "Customers highlight - Linked user inspection",
    "source_standard_clause": "admin-customers.highlights[2]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Customers must satisfy the highlighted workspace rule 'Linked user inspection'.",
    "control_rule": "Customers must deliver 'Linked user inspection' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin-customers.highlights[2]'."
    ],
    "evaluation_method": "Inspect /workspace/admin/customers and confirm 'Linked user inspection' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Customers must deliver 'Linked user inspection' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Customers does not deliver the highlight 'Linked user inspection'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Customers",
    "evaluator": "Customers reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-007",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.7",
    "title": "Plans highlight - Live pricing values",
    "source_standard_clause": "admin-plans.highlights[0]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Plans must satisfy the highlighted workspace rule 'Live pricing values'.",
    "control_rule": "Plans must deliver 'Live pricing values' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin-plans.highlights[0]'."
    ],
    "evaluation_method": "Inspect /workspace/admin/plans and confirm 'Live pricing values' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Plans must deliver 'Live pricing values' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Plans does not deliver the highlight 'Live pricing values'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Plans",
    "evaluator": "Plans reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-008",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.8",
    "title": "Plans highlight - Trial and support settings",
    "source_standard_clause": "admin-plans.highlights[1]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Plans must satisfy the highlighted workspace rule 'Trial and support settings'.",
    "control_rule": "Plans must deliver 'Trial and support settings' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin-plans.highlights[1]'."
    ],
    "evaluation_method": "Inspect /workspace/admin/plans and confirm 'Trial and support settings' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Plans must deliver 'Trial and support settings' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Plans does not deliver the highlight 'Trial and support settings'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Plans",
    "evaluator": "Plans reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-009",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.9",
    "title": "Plans highlight - Marketing points stay synced to the site",
    "source_standard_clause": "admin-plans.highlights[2]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Plans must satisfy the highlighted workspace rule 'Marketing points stay synced to the site'.",
    "control_rule": "Plans must deliver 'Marketing points stay synced to the site' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin-plans.highlights[2]'."
    ],
    "evaluation_method": "Inspect /workspace/admin/plans and confirm 'Marketing points stay synced to the site' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Plans must deliver 'Marketing points stay synced to the site' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Plans does not deliver the highlight 'Marketing points stay synced to the site'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Plans",
    "evaluator": "Plans reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-010",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.10",
    "title": "Admin Workspace priority - Keep customer, subscription, and support-account decisions grounded in live platform state.",
    "source_standard_clause": "admin.priorities[0]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Admin Workspace must satisfy the role priority 'Keep customer, subscription, and support-account decisions grounded in live platform state.'.",
    "control_rule": "Keep customer, subscription, and support-account decisions grounded in live platform state.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin.priorities[0]'."
    ],
    "evaluation_method": "Inspect the admin workspace shell and confirm the priority is reflected in navigation and available actions.",
    "scoring_logic": "Pass when evidence confirms 'Keep customer, subscription, and support-account decisions grounded in live platform state.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "workspace screenshot",
      "route ownership evidence"
    ],
    "nonconformity": "Admin Workspace does not satisfy the priority 'Keep customer, subscription, and support-account decisions grounded in live platform state.'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Admin Workspace",
    "evaluator": "Admin Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-011",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.11",
    "title": "Admin Workspace priority - Separate platform control from the operating workspace used by customers.",
    "source_standard_clause": "admin.priorities[1]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Admin Workspace must satisfy the role priority 'Separate platform control from the operating workspace used by customers.'.",
    "control_rule": "Separate platform control from the operating workspace used by customers.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin.priorities[1]'."
    ],
    "evaluation_method": "Inspect the admin workspace shell and confirm the priority is reflected in navigation and available actions.",
    "scoring_logic": "Pass when evidence confirms 'Separate platform control from the operating workspace used by customers.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "workspace screenshot",
      "route ownership evidence"
    ],
    "nonconformity": "Admin Workspace does not satisfy the priority 'Separate platform control from the operating workspace used by customers.'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Admin Workspace",
    "evaluator": "Admin Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-012",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.12",
    "title": "Admin Workspace priority - Make route quality and governance visible without burying them under generic platform labels.",
    "source_standard_clause": "admin.priorities[2]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Admin Workspace must satisfy the role priority 'Make route quality and governance visible without burying them under generic platform labels.'.",
    "control_rule": "Make route quality and governance visible without burying them under generic platform labels.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin.priorities[2]'."
    ],
    "evaluation_method": "Inspect the admin workspace shell and confirm the priority is reflected in navigation and available actions.",
    "scoring_logic": "Pass when evidence confirms 'Make route quality and governance visible without burying them under generic platform labels.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "workspace screenshot",
      "route ownership evidence"
    ],
    "nonconformity": "Admin Workspace does not satisfy the priority 'Make route quality and governance visible without burying them under generic platform labels.'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Admin Workspace",
    "evaluator": "Admin Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-013",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.13",
    "title": "Admin Workspace sidebar group - Platform Control",
    "source_standard_clause": "admin.sidebarGroups[0]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Admin Workspace must expose the 'Platform Control' navigation group with direct access to its operational routes.",
    "control_rule": "Admin Workspace must expose the 'Platform Control' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin.sidebarGroups[0]'."
    ],
    "evaluation_method": "Review admin workspace navigation and confirm the 'Platform Control' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'Admin Workspace must expose the 'Platform Control' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "Admin Workspace does not expose the 'Platform Control' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Admin Workspace",
    "evaluator": "Admin Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-014",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.14",
    "title": "Admin Workspace sidebar group - Commercial Operations",
    "source_standard_clause": "admin.sidebarGroups[1]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Admin Workspace must expose the 'Commercial Operations' navigation group with direct access to its operational routes.",
    "control_rule": "Admin Workspace must expose the 'Commercial Operations' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin.sidebarGroups[1]'."
    ],
    "evaluation_method": "Review admin workspace navigation and confirm the 'Commercial Operations' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'Admin Workspace must expose the 'Commercial Operations' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "Admin Workspace does not expose the 'Commercial Operations' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Admin Workspace",
    "evaluator": "Admin Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-015",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.15",
    "title": "Admin Workspace sidebar group - Access / Governance",
    "source_standard_clause": "admin.sidebarGroups[2]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Admin Workspace must expose the 'Access / Governance' navigation group with direct access to its operational routes.",
    "control_rule": "Admin Workspace must expose the 'Access / Governance' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin.sidebarGroups[2]'."
    ],
    "evaluation_method": "Review admin workspace navigation and confirm the 'Access / Governance' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'Admin Workspace must expose the 'Access / Governance' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "Admin Workspace does not expose the 'Access / Governance' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Admin Workspace",
    "evaluator": "Admin Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-016",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.16",
    "title": "Admin Workspace sidebar group - AI Review",
    "source_standard_clause": "admin.sidebarGroups[3]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Admin Workspace must expose the 'AI Review' navigation group with direct access to its operational routes.",
    "control_rule": "Admin Workspace must expose the 'AI Review' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'admin.sidebarGroups[3]'."
    ],
    "evaluation_method": "Review admin workspace navigation and confirm the 'AI Review' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'Admin Workspace must expose the 'AI Review' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "Admin Workspace does not expose the 'AI Review' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Admin Workspace",
    "evaluator": "Admin Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-017",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.17",
    "title": "Support Accounts highlight - Activation control",
    "source_standard_clause": "support-accounts.highlights[0]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Support Accounts must satisfy the highlighted workspace rule 'Activation control'.",
    "control_rule": "Support Accounts must deliver 'Activation control' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'support-accounts.highlights[0]'."
    ],
    "evaluation_method": "Inspect /workspace/admin/support-accounts and confirm 'Activation control' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Support Accounts must deliver 'Activation control' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Support Accounts does not deliver the highlight 'Activation control'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Support Accounts",
    "evaluator": "Support Accounts reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-018",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.18",
    "title": "Support Accounts highlight - Permission assignment",
    "source_standard_clause": "support-accounts.highlights[1]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Support Accounts must satisfy the highlighted workspace rule 'Permission assignment'.",
    "control_rule": "Support Accounts must deliver 'Permission assignment' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'support-accounts.highlights[1]'."
    ],
    "evaluation_method": "Inspect /workspace/admin/support-accounts and confirm 'Permission assignment' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Support Accounts must deliver 'Permission assignment' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Support Accounts does not deliver the highlight 'Permission assignment'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Support Accounts",
    "evaluator": "Support Accounts reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ADM-019",
    "version": "2.0.0",
    "module_code": "ADM",
    "module_name": "Admin Workspace Control",
    "chapter_number": "8.19",
    "title": "Support Accounts highlight - Support account lifecycle",
    "source_standard_clause": "support-accounts.highlights[2]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Support Accounts must satisfy the highlighted workspace rule 'Support account lifecycle'.",
    "control_rule": "Support Accounts must deliver 'Support account lifecycle' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'support-accounts.highlights[2]'."
    ],
    "evaluation_method": "Inspect /workspace/admin/support-accounts and confirm 'Support account lifecycle' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Support Accounts must deliver 'Support account lifecycle' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Support Accounts does not deliver the highlight 'Support account lifecycle'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Support Accounts",
    "evaluator": "Support Accounts reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AST-001",
    "version": "2.0.0",
    "module_code": "AST",
    "module_name": "Assistant Workspace Control",
    "chapter_number": "9.1",
    "title": "Assistant Workspace priority - Keep follow-up, onboarding, and help intake visible in the same workspace.",
    "source_standard_clause": "assistant.priorities[0]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Assistant Workspace must satisfy the role priority 'Keep follow-up, onboarding, and help intake visible in the same workspace.'.",
    "control_rule": "Keep follow-up, onboarding, and help intake visible in the same workspace.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'assistant.priorities[0]'."
    ],
    "evaluation_method": "Inspect the assistant workspace shell and confirm the priority is reflected in navigation and available actions.",
    "scoring_logic": "Pass when evidence confirms 'Keep follow-up, onboarding, and help intake visible in the same workspace.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "workspace screenshot",
      "route ownership evidence"
    ],
    "nonconformity": "Assistant Workspace does not satisfy the priority 'Keep follow-up, onboarding, and help intake visible in the same workspace.'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Assistant Workspace",
    "evaluator": "Assistant Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AST-002",
    "version": "2.0.0",
    "module_code": "AST",
    "module_name": "Assistant Workspace Control",
    "chapter_number": "9.2",
    "title": "Assistant Workspace priority - Use operational queues and customer health signals instead of vague support placeholders.",
    "source_standard_clause": "assistant.priorities[1]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Assistant Workspace must satisfy the role priority 'Use operational queues and customer health signals instead of vague support placeholders.'.",
    "control_rule": "Use operational queues and customer health signals instead of vague support placeholders.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'assistant.priorities[1]'."
    ],
    "evaluation_method": "Inspect the assistant workspace shell and confirm the priority is reflected in navigation and available actions.",
    "scoring_logic": "Pass when evidence confirms 'Use operational queues and customer health signals instead of vague support placeholders.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "workspace screenshot",
      "route ownership evidence"
    ],
    "nonconformity": "Assistant Workspace does not satisfy the priority 'Use operational queues and customer health signals instead of vague support placeholders.'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Assistant Workspace",
    "evaluator": "Assistant Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AST-003",
    "version": "2.0.0",
    "module_code": "AST",
    "module_name": "Assistant Workspace Control",
    "chapter_number": "9.3",
    "title": "Assistant Workspace priority - Move directly from issue context into the next customer-facing action.",
    "source_standard_clause": "assistant.priorities[2]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Assistant Workspace must satisfy the role priority 'Move directly from issue context into the next customer-facing action.'.",
    "control_rule": "Move directly from issue context into the next customer-facing action.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'assistant.priorities[2]'."
    ],
    "evaluation_method": "Inspect the assistant workspace shell and confirm the priority is reflected in navigation and available actions.",
    "scoring_logic": "Pass when evidence confirms 'Move directly from issue context into the next customer-facing action.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "workspace screenshot",
      "route ownership evidence"
    ],
    "nonconformity": "Assistant Workspace does not satisfy the priority 'Move directly from issue context into the next customer-facing action.'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Assistant Workspace",
    "evaluator": "Assistant Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AST-004",
    "version": "2.0.0",
    "module_code": "AST",
    "module_name": "Assistant Workspace Control",
    "chapter_number": "9.4",
    "title": "Assistant Workspace sidebar group - Support Queue",
    "source_standard_clause": "assistant.sidebarGroups[0]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Assistant Workspace must expose the 'Support Queue' navigation group with direct access to its operational routes.",
    "control_rule": "Assistant Workspace must expose the 'Support Queue' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'assistant.sidebarGroups[0]'."
    ],
    "evaluation_method": "Review assistant workspace navigation and confirm the 'Support Queue' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'Assistant Workspace must expose the 'Support Queue' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "Assistant Workspace does not expose the 'Support Queue' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Assistant Workspace",
    "evaluator": "Assistant Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AST-005",
    "version": "2.0.0",
    "module_code": "AST",
    "module_name": "Assistant Workspace Control",
    "chapter_number": "9.5",
    "title": "Assistant Workspace sidebar group - Customer Success",
    "source_standard_clause": "assistant.sidebarGroups[1]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Assistant Workspace must expose the 'Customer Success' navigation group with direct access to its operational routes.",
    "control_rule": "Assistant Workspace must expose the 'Customer Success' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'assistant.sidebarGroups[1]'."
    ],
    "evaluation_method": "Review assistant workspace navigation and confirm the 'Customer Success' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'Assistant Workspace must expose the 'Customer Success' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "Assistant Workspace does not expose the 'Customer Success' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Assistant Workspace",
    "evaluator": "Assistant Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AST-006",
    "version": "2.0.0",
    "module_code": "AST",
    "module_name": "Assistant Workspace Control",
    "chapter_number": "9.6",
    "title": "Assistant Workspace sidebar group - Knowledge / Escalations",
    "source_standard_clause": "assistant.sidebarGroups[2]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Assistant Workspace must expose the 'Knowledge / Escalations' navigation group with direct access to its operational routes.",
    "control_rule": "Assistant Workspace must expose the 'Knowledge / Escalations' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'assistant.sidebarGroups[2]'."
    ],
    "evaluation_method": "Review assistant workspace navigation and confirm the 'Knowledge / Escalations' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'Assistant Workspace must expose the 'Knowledge / Escalations' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "Assistant Workspace does not expose the 'Knowledge / Escalations' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Assistant Workspace",
    "evaluator": "Assistant Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AST-007",
    "version": "2.0.0",
    "module_code": "AST",
    "module_name": "Assistant Workspace Control",
    "chapter_number": "9.7",
    "title": "Help highlight - Help stays available but quiet",
    "source_standard_clause": "help.highlights[0]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Help must satisfy the highlighted workspace rule 'Help stays available but quiet'.",
    "control_rule": "Help must deliver 'Help stays available but quiet' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'help.highlights[0]'."
    ],
    "evaluation_method": "Inspect /workspace/help and confirm 'Help stays available but quiet' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Help must deliver 'Help stays available but quiet' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Help does not deliver the highlight 'Help stays available but quiet'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Help",
    "evaluator": "Help reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AST-008",
    "version": "2.0.0",
    "module_code": "AST",
    "module_name": "Assistant Workspace Control",
    "chapter_number": "9.8",
    "title": "Help highlight - Daily work does not compete with support content",
    "source_standard_clause": "help.highlights[1]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Help must satisfy the highlighted workspace rule 'Daily work does not compete with support content'.",
    "control_rule": "Help must deliver 'Daily work does not compete with support content' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'help.highlights[1]'."
    ],
    "evaluation_method": "Inspect /workspace/help and confirm 'Daily work does not compete with support content' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Help must deliver 'Daily work does not compete with support content' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Help does not deliver the highlight 'Daily work does not compete with support content'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Help",
    "evaluator": "Help reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-AST-009",
    "version": "2.0.0",
    "module_code": "AST",
    "module_name": "Assistant Workspace Control",
    "chapter_number": "9.9",
    "title": "Help highlight - Business language stays consistent across guidance",
    "source_standard_clause": "help.highlights[2]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Help must satisfy the highlighted workspace rule 'Business language stays consistent across guidance'.",
    "control_rule": "Help must deliver 'Business language stays consistent across guidance' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'help.highlights[2]'."
    ],
    "evaluation_method": "Inspect /workspace/help and confirm 'Business language stays consistent across guidance' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Help must deliver 'Business language stays consistent across guidance' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Help does not deliver the highlight 'Business language stays consistent across guidance'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Help",
    "evaluator": "Help reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ACP-001",
    "version": "2.0.0",
    "module_code": "ACP",
    "module_name": "Accountant / Partner Workspace Control",
    "chapter_number": "10.1",
    "title": "Agent Workspace priority - Keep commercial follow-up and account ownership visible, not buried inside generic partner pages.",
    "source_standard_clause": "agent.priorities[0]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Agent Workspace must satisfy the role priority 'Keep commercial follow-up and account ownership visible, not buried inside generic partner pages.'.",
    "control_rule": "Keep commercial follow-up and account ownership visible, not buried inside generic partner pages.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'agent.priorities[0]'."
    ],
    "evaluation_method": "Inspect the agent workspace shell and confirm the priority is reflected in navigation and available actions.",
    "scoring_logic": "Pass when evidence confirms 'Keep commercial follow-up and account ownership visible, not buried inside generic partner pages.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "workspace screenshot",
      "route ownership evidence"
    ],
    "nonconformity": "Agent Workspace does not satisfy the priority 'Keep commercial follow-up and account ownership visible, not buried inside generic partner pages.'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Agent Workspace",
    "evaluator": "Agent Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ACP-002",
    "version": "2.0.0",
    "module_code": "ACP",
    "module_name": "Accountant / Partner Workspace Control",
    "chapter_number": "10.2",
    "title": "Agent Workspace priority - Make leads, outreach, and assigned-client actions obvious from the first screen.",
    "source_standard_clause": "agent.priorities[1]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Agent Workspace must satisfy the role priority 'Make leads, outreach, and assigned-client actions obvious from the first screen.'.",
    "control_rule": "Make leads, outreach, and assigned-client actions obvious from the first screen.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'agent.priorities[1]'."
    ],
    "evaluation_method": "Inspect the agent workspace shell and confirm the priority is reflected in navigation and available actions.",
    "scoring_logic": "Pass when evidence confirms 'Make leads, outreach, and assigned-client actions obvious from the first screen.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "workspace screenshot",
      "route ownership evidence"
    ],
    "nonconformity": "Agent Workspace does not satisfy the priority 'Make leads, outreach, and assigned-client actions obvious from the first screen.'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Agent Workspace",
    "evaluator": "Agent Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ACP-003",
    "version": "2.0.0",
    "module_code": "ACP",
    "module_name": "Accountant / Partner Workspace Control",
    "chapter_number": "10.3",
    "title": "Agent Workspace priority - Keep pipeline actions tied to the real signup and referral flow.",
    "source_standard_clause": "agent.priorities[2]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Agent Workspace must satisfy the role priority 'Keep pipeline actions tied to the real signup and referral flow.'.",
    "control_rule": "Keep pipeline actions tied to the real signup and referral flow.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'agent.priorities[2]'."
    ],
    "evaluation_method": "Inspect the agent workspace shell and confirm the priority is reflected in navigation and available actions.",
    "scoring_logic": "Pass when evidence confirms 'Keep pipeline actions tied to the real signup and referral flow.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "workspace screenshot",
      "route ownership evidence"
    ],
    "nonconformity": "Agent Workspace does not satisfy the priority 'Keep pipeline actions tied to the real signup and referral flow.'.",
    "control_weight": 7,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Agent Workspace",
    "evaluator": "Agent Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ACP-004",
    "version": "2.0.0",
    "module_code": "ACP",
    "module_name": "Accountant / Partner Workspace Control",
    "chapter_number": "10.4",
    "title": "Agent Workspace sidebar group - Pipeline",
    "source_standard_clause": "agent.sidebarGroups[0]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Agent Workspace must expose the 'Pipeline' navigation group with direct access to its operational routes.",
    "control_rule": "Agent Workspace must expose the 'Pipeline' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'agent.sidebarGroups[0]'."
    ],
    "evaluation_method": "Review agent workspace navigation and confirm the 'Pipeline' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'Agent Workspace must expose the 'Pipeline' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "Agent Workspace does not expose the 'Pipeline' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Agent Workspace",
    "evaluator": "Agent Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ACP-005",
    "version": "2.0.0",
    "module_code": "ACP",
    "module_name": "Accountant / Partner Workspace Control",
    "chapter_number": "10.5",
    "title": "Agent Workspace sidebar group - Outreach",
    "source_standard_clause": "agent.sidebarGroups[1]",
    "source_standard_document": "Workspace Role Definition",
    "description": "Agent Workspace must expose the 'Outreach' navigation group with direct access to its operational routes.",
    "control_rule": "Agent Workspace must expose the 'Outreach' navigation group and its routes as first-class workspace navigation.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'agent.sidebarGroups[1]'."
    ],
    "evaluation_method": "Review agent workspace navigation and confirm the 'Outreach' group is present with direct route access.",
    "scoring_logic": "Pass when evidence confirms 'Agent Workspace must expose the 'Outreach' navigation group and its routes as first-class workspace navigation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "sidebar evidence",
      "route list evidence"
    ],
    "nonconformity": "Agent Workspace does not expose the 'Outreach' navigation group correctly.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Agent Workspace",
    "evaluator": "Agent Workspace reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/role-workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ACP-006",
    "version": "2.0.0",
    "module_code": "ACP",
    "module_name": "Accountant / Partner Workspace Control",
    "chapter_number": "10.6",
    "title": "Agents highlight - Referral link ready to share",
    "source_standard_clause": "agents.highlights[0]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Agents must satisfy the highlighted workspace rule 'Referral link ready to share'.",
    "control_rule": "Agents must deliver 'Referral link ready to share' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'agents.highlights[0]'."
    ],
    "evaluation_method": "Inspect /workspace/agents and confirm 'Referral link ready to share' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Agents must deliver 'Referral link ready to share' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Agents does not deliver the highlight 'Referral link ready to share'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Agents",
    "evaluator": "Agents reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ACP-007",
    "version": "2.0.0",
    "module_code": "ACP",
    "module_name": "Accountant / Partner Workspace Control",
    "chapter_number": "10.7",
    "title": "Agents highlight - Signups and commissions stay visible",
    "source_standard_clause": "agents.highlights[1]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Agents must satisfy the highlighted workspace rule 'Signups and commissions stay visible'.",
    "control_rule": "Agents must deliver 'Signups and commissions stay visible' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'agents.highlights[1]'."
    ],
    "evaluation_method": "Inspect /workspace/agents and confirm 'Signups and commissions stay visible' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Agents must deliver 'Signups and commissions stay visible' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Agents does not deliver the highlight 'Signups and commissions stay visible'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Agents",
    "evaluator": "Agents reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ACP-008",
    "version": "2.0.0",
    "module_code": "ACP",
    "module_name": "Accountant / Partner Workspace Control",
    "chapter_number": "10.8",
    "title": "Agents highlight - Partner sales can be measured without exports",
    "source_standard_clause": "agents.highlights[2]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Agents must satisfy the highlighted workspace rule 'Partner sales can be measured without exports'.",
    "control_rule": "Agents must deliver 'Partner sales can be measured without exports' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'agents.highlights[2]'."
    ],
    "evaluation_method": "Inspect /workspace/agents and confirm 'Partner sales can be measured without exports' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Agents must deliver 'Partner sales can be measured without exports' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Agents does not deliver the highlight 'Partner sales can be measured without exports'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Agents",
    "evaluator": "Agents reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ACP-009",
    "version": "2.0.0",
    "module_code": "ACP",
    "module_name": "Accountant / Partner Workspace Control",
    "chapter_number": "10.9",
    "title": "Users highlight - Seat usage stays visible",
    "source_standard_clause": "company-users.highlights[0]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Users must satisfy the highlighted workspace rule 'Seat usage stays visible'.",
    "control_rule": "Users must deliver 'Seat usage stays visible' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'company-users.highlights[0]'."
    ],
    "evaluation_method": "Inspect /workspace/settings/users and confirm 'Seat usage stays visible' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Users must deliver 'Seat usage stays visible' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Users does not deliver the highlight 'Seat usage stays visible'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Users",
    "evaluator": "Users reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ACP-010",
    "version": "2.0.0",
    "module_code": "ACP",
    "module_name": "Accountant / Partner Workspace Control",
    "chapter_number": "10.10",
    "title": "Users highlight - Role changes are controlled",
    "source_standard_clause": "company-users.highlights[1]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Users must satisfy the highlighted workspace rule 'Role changes are controlled'.",
    "control_rule": "Users must deliver 'Role changes are controlled' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'company-users.highlights[1]'."
    ],
    "evaluation_method": "Inspect /workspace/settings/users and confirm 'Role changes are controlled' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Users must deliver 'Role changes are controlled' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Users does not deliver the highlight 'Role changes are controlled'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Users",
    "evaluator": "Users reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-ACP-011",
    "version": "2.0.0",
    "module_code": "ACP",
    "module_name": "Accountant / Partner Workspace Control",
    "chapter_number": "10.11",
    "title": "Users highlight - Internal user access stays simple",
    "source_standard_clause": "company-users.highlights[2]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Users must satisfy the highlighted workspace rule 'Internal user access stays simple'.",
    "control_rule": "Users must deliver 'Internal user access stays simple' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'company-users.highlights[2]'."
    ],
    "evaluation_method": "Inspect /workspace/settings/users and confirm 'Internal user access stays simple' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Users must deliver 'Internal user access stays simple' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Users does not deliver the highlight 'Internal user access stays simple'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Users",
    "evaluator": "Users reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-VAL-001",
    "version": "2.0.0",
    "module_code": "VAL",
    "module_name": "Validation Control",
    "chapter_number": "13.1",
    "title": "Import Engine feature - directory import",
    "source_standard_clause": "import-engine.requiredFeatures[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Import Engine must provide the required feature 'directory import'.",
    "control_rule": "Import Engine must provide directory import as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'import-engine.requiredFeatures[0]'."
    ],
    "evaluation_method": "Verify that 'directory import' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Import Engine must provide directory import as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Import Engine does not provide the required feature 'directory import'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Import Engine",
    "evaluator": "Import Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "import-engine",
      "contacts-counterparties",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-VAL-002",
    "version": "2.0.0",
    "module_code": "VAL",
    "module_name": "Validation Control",
    "chapter_number": "13.2",
    "title": "Import Engine feature - statement import",
    "source_standard_clause": "import-engine.requiredFeatures[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Import Engine must provide the required feature 'statement import'.",
    "control_rule": "Import Engine must provide statement import as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'import-engine.requiredFeatures[1]'."
    ],
    "evaluation_method": "Verify that 'statement import' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Import Engine must provide statement import as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Import Engine does not provide the required feature 'statement import'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Import Engine",
    "evaluator": "Import Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "import-engine",
      "contacts-counterparties",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-VAL-003",
    "version": "2.0.0",
    "module_code": "VAL",
    "module_name": "Validation Control",
    "chapter_number": "13.3",
    "title": "Import Engine feature - mapping analysis",
    "source_standard_clause": "import-engine.requiredFeatures[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Import Engine must provide the required feature 'mapping analysis'.",
    "control_rule": "Import Engine must provide mapping analysis as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'import-engine.requiredFeatures[2]'."
    ],
    "evaluation_method": "Verify that 'mapping analysis' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Import Engine must provide mapping analysis as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Import Engine does not provide the required feature 'mapping analysis'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Import Engine",
    "evaluator": "Import Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "import-engine",
      "contacts-counterparties",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-VAL-004",
    "version": "2.0.0",
    "module_code": "VAL",
    "module_name": "Validation Control",
    "chapter_number": "13.4",
    "title": "Import Engine proof expectation - imported rows feed operational modules correctly",
    "source_standard_clause": "import-engine.requiredProofExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Import Engine must produce the proof expectation 'imported rows feed operational modules correctly'.",
    "control_rule": "Import Engine must produce evidence that 'imported rows feed operational modules correctly'.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'import-engine.requiredProofExpectations[0]'."
    ],
    "evaluation_method": "Run the proof path and verify evidence exists for 'imported rows feed operational modules correctly'.",
    "scoring_logic": "Pass when evidence confirms 'Import Engine must produce evidence that 'imported rows feed operational modules correctly'.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "proof artifact",
      "execution summary"
    ],
    "nonconformity": "Import Engine cannot produce proof for 'imported rows feed operational modules correctly'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "Import Engine",
    "evaluator": "Import Engine reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": [
      "import-engine",
      "proof-layer",
      "contacts-counterparties",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-VAL-005",
    "version": "2.0.0",
    "module_code": "VAL",
    "module_name": "Validation Control",
    "chapter_number": "13.5",
    "title": "Import Engine UI expectation - field mapping UI",
    "source_standard_clause": "import-engine.requiredUiExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Import Engine must visibly satisfy the UI expectation 'field mapping UI'.",
    "control_rule": "Import Engine must expose field mapping UI without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'import-engine.requiredUiExpectations[0]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'field mapping UI' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Import Engine must expose field mapping UI without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Import Engine does not satisfy the UI expectation 'field mapping UI'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Import Engine",
    "evaluator": "Import Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "import-engine",
      "ui-ux-shell",
      "contacts-counterparties",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-VAL-006",
    "version": "2.0.0",
    "module_code": "VAL",
    "module_name": "Validation Control",
    "chapter_number": "13.6",
    "title": "Import Engine UI expectation - validation feedback",
    "source_standard_clause": "import-engine.requiredUiExpectations[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Import Engine must visibly satisfy the UI expectation 'validation feedback'.",
    "control_rule": "Import Engine must expose validation feedback without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'import-engine.requiredUiExpectations[1]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'validation feedback' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Import Engine must expose validation feedback without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Import Engine does not satisfy the UI expectation 'validation feedback'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Import Engine",
    "evaluator": "Import Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "import-engine",
      "ui-ux-shell",
      "contacts-counterparties",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-VAL-007",
    "version": "2.0.0",
    "module_code": "VAL",
    "module_name": "Validation Control",
    "chapter_number": "13.7",
    "title": "Import Engine UI expectation - import logs",
    "source_standard_clause": "import-engine.requiredUiExpectations[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Import Engine must visibly satisfy the UI expectation 'import logs'.",
    "control_rule": "Import Engine must expose import logs without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'import-engine.requiredUiExpectations[2]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'import logs' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Import Engine must expose import logs without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Import Engine does not satisfy the UI expectation 'import logs'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Import Engine",
    "evaluator": "Import Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "import-engine",
      "ui-ux-shell",
      "contacts-counterparties",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-VAL-008",
    "version": "2.0.0",
    "module_code": "VAL",
    "module_name": "Validation Control",
    "chapter_number": "13.8",
    "title": "UI Validation Layer processing contract",
    "source_standard_clause": "UI Validation Layer.processing_logic",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validate that business constraints and successful actions are correctly represented in the interface.",
    "control_rule": "Validate that business constraints and successful actions are correctly represented in the interface.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'UI Validation Layer.processing_logic'."
    ],
    "evaluation_method": "Review the implementation path that fulfills ui validation layer processing responsibilities.",
    "scoring_logic": "Pass when evidence confirms 'Validate that business constraints and successful actions are correctly represented in the interface.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "service implementation trace",
      "workflow execution evidence"
    ],
    "nonconformity": "UI Validation Layer processing responsibilities are not enforceable in runtime behavior.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "UI Validation Layer",
    "evaluator": "UI Validation Layer reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "ui-ux-shell",
      "identity-workspace",
      "document-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-VAL-009",
    "version": "2.0.0",
    "module_code": "VAL",
    "module_name": "Validation Control",
    "chapter_number": "13.9",
    "title": "UI-issued documents must match backend document numbers and later report results",
    "source_standard_clause": "UI Validation Layer.traceability_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Traceability requirement from UI Validation Layer: UI-issued documents must match backend document numbers and later report results",
    "control_rule": "UI-issued documents must match backend document numbers and later report results",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'UI Validation Layer.traceability_rules[0]'."
    ],
    "evaluation_method": "Inspect persisted identifiers and confirm the system retains the traceability required by 'UI-issued documents must match backend document numbers and later report results'.",
    "scoring_logic": "Pass when evidence confirms 'UI-issued documents must match backend document numbers and later report results' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "stored linkage sample",
      "lookup evidence"
    ],
    "nonconformity": "Required traceability is missing for 'UI-issued documents must match backend document numbers and later report results'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "UI Validation Layer",
    "evaluator": "UI Validation Layer reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "ui-ux-shell",
      "identity-workspace",
      "document-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-VAL-010",
    "version": "2.0.0",
    "module_code": "VAL",
    "module_name": "Validation Control",
    "chapter_number": "13.10",
    "title": "Required fields must block issue",
    "source_standard_clause": "UI Validation Layer.validation_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from UI Validation Layer: Required fields must block issue",
    "control_rule": "Required fields must block issue",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'UI Validation Layer.validation_rules[0]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'Required fields must block issue'.",
    "scoring_logic": "Pass when evidence confirms 'Required fields must block issue' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'Required fields must block issue'.",
    "control_weight": 9,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "UI Validation Layer",
    "evaluator": "UI Validation Layer reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "ui-ux-shell",
      "identity-workspace",
      "document-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-VAL-011",
    "version": "2.0.0",
    "module_code": "VAL",
    "module_name": "Validation Control",
    "chapter_number": "13.11",
    "title": "short stock must warn",
    "source_standard_clause": "UI Validation Layer.validation_rules[1]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from UI Validation Layer: short stock must warn",
    "control_rule": "short stock must warn",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'UI Validation Layer.validation_rules[1]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'short stock must warn'.",
    "scoring_logic": "Pass when evidence confirms 'short stock must warn' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'short stock must warn'.",
    "control_weight": 9,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "UI Validation Layer",
    "evaluator": "UI Validation Layer reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "ui-ux-shell",
      "identity-workspace",
      "document-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-VAL-012",
    "version": "2.0.0",
    "module_code": "VAL",
    "module_name": "Validation Control",
    "chapter_number": "13.12",
    "title": "successful issue flow must surface next actions",
    "source_standard_clause": "UI Validation Layer.validation_rules[2]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from UI Validation Layer: successful issue flow must surface next actions",
    "control_rule": "successful issue flow must surface next actions",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'UI Validation Layer.validation_rules[2]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'successful issue flow must surface next actions'.",
    "scoring_logic": "Pass when evidence confirms 'successful issue flow must surface next actions' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'successful issue flow must surface next actions'.",
    "control_weight": 9,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "UI Validation Layer",
    "evaluator": "UI Validation Layer reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "ui-ux-shell",
      "identity-workspace",
      "document-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-SEC-001",
    "version": "2.0.0",
    "module_code": "SEC",
    "module_name": "Security Control",
    "chapter_number": "14.1",
    "title": "API Layer processing contract",
    "source_standard_clause": "API Layer.processing_logic",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Expose business workflows and reports through company-scoped endpoints.",
    "control_rule": "Expose business workflows and reports through company-scoped endpoints.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'API Layer.processing_logic'."
    ],
    "evaluation_method": "Review the implementation path that fulfills api layer processing responsibilities.",
    "scoring_logic": "Pass when evidence confirms 'Expose business workflows and reports through company-scoped endpoints.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "service implementation trace",
      "workflow execution evidence"
    ],
    "nonconformity": "API Layer processing responsibilities are not enforceable in runtime behavior.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "API Layer",
    "evaluator": "API Layer reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-SEC-002",
    "version": "2.0.0",
    "module_code": "SEC",
    "module_name": "Security Control",
    "chapter_number": "14.2",
    "title": "Endpoints must return sufficient identifiers for follow-up report proof",
    "source_standard_clause": "API Layer.traceability_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Traceability requirement from API Layer: Endpoints must return sufficient identifiers for follow-up report proof",
    "control_rule": "Endpoints must return sufficient identifiers for follow-up report proof",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'API Layer.traceability_rules[0]'."
    ],
    "evaluation_method": "Inspect persisted identifiers and confirm the system retains the traceability required by 'Endpoints must return sufficient identifiers for follow-up report proof'.",
    "scoring_logic": "Pass when evidence confirms 'Endpoints must return sufficient identifiers for follow-up report proof' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "stored linkage sample",
      "lookup evidence"
    ],
    "nonconformity": "Required traceability is missing for 'Endpoints must return sufficient identifiers for follow-up report proof'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "API Layer",
    "evaluator": "API Layer reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-SEC-003",
    "version": "2.0.0",
    "module_code": "SEC",
    "module_name": "Security Control",
    "chapter_number": "14.3",
    "title": "Authorization headers required",
    "source_standard_clause": "API Layer.validation_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from API Layer: Authorization headers required",
    "control_rule": "Authorization headers required",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'API Layer.validation_rules[0]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'Authorization headers required'.",
    "scoring_logic": "Pass when evidence confirms 'Authorization headers required' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'Authorization headers required'.",
    "control_weight": 9,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "API Layer",
    "evaluator": "API Layer reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-SEC-004",
    "version": "2.0.0",
    "module_code": "SEC",
    "module_name": "Security Control",
    "chapter_number": "14.4",
    "title": "payload schema must be valid",
    "source_standard_clause": "API Layer.validation_rules[1]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from API Layer: payload schema must be valid",
    "control_rule": "payload schema must be valid",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'API Layer.validation_rules[1]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'payload schema must be valid'.",
    "scoring_logic": "Pass when evidence confirms 'payload schema must be valid' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'payload schema must be valid'.",
    "control_weight": 9,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "API Layer",
    "evaluator": "API Layer reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-SEC-005",
    "version": "2.0.0",
    "module_code": "SEC",
    "module_name": "Security Control",
    "chapter_number": "14.5",
    "title": "resource scoping must hold",
    "source_standard_clause": "API Layer.validation_rules[2]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from API Layer: resource scoping must hold",
    "control_rule": "resource scoping must hold",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'API Layer.validation_rules[2]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'resource scoping must hold'.",
    "scoring_logic": "Pass when evidence confirms 'resource scoping must hold' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'resource scoping must hold'.",
    "control_weight": 9,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "API Layer",
    "evaluator": "API Layer reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell",
      "workflow-intelligence"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TMP-001",
    "version": "2.0.0",
    "module_code": "TMP",
    "module_name": "Template Engine Control",
    "chapter_number": "12.1",
    "title": "Template Engine feature - template CRUD",
    "source_standard_clause": "template-engine.requiredFeatures[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Template Engine must provide the required feature 'template CRUD'.",
    "control_rule": "Template Engine must provide template CRUD as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'template-engine.requiredFeatures[0]'."
    ],
    "evaluation_method": "Verify that 'template CRUD' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Template Engine must provide template CRUD as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Template Engine does not provide the required feature 'template CRUD'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Template Engine",
    "evaluator": "Template Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "template-engine",
      "document-engine",
      "company-profile"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TMP-002",
    "version": "2.0.0",
    "module_code": "TMP",
    "module_name": "Template Engine Control",
    "chapter_number": "12.2",
    "title": "Template Engine feature - section order",
    "source_standard_clause": "template-engine.requiredFeatures[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Template Engine must provide the required feature 'section order'.",
    "control_rule": "Template Engine must provide section order as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'template-engine.requiredFeatures[1]'."
    ],
    "evaluation_method": "Verify that 'section order' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Template Engine must provide section order as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Template Engine does not provide the required feature 'section order'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Template Engine",
    "evaluator": "Template Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "template-engine",
      "document-engine",
      "company-profile"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TMP-003",
    "version": "2.0.0",
    "module_code": "TMP",
    "module_name": "Template Engine Control",
    "chapter_number": "12.3",
    "title": "Template Engine feature - asset assignment",
    "source_standard_clause": "template-engine.requiredFeatures[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Template Engine must provide the required feature 'asset assignment'.",
    "control_rule": "Template Engine must provide asset assignment as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'template-engine.requiredFeatures[2]'."
    ],
    "evaluation_method": "Verify that 'asset assignment' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Template Engine must provide asset assignment as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Template Engine does not provide the required feature 'asset assignment'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Template Engine",
    "evaluator": "Template Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "template-engine",
      "document-engine",
      "company-profile"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TMP-004",
    "version": "2.0.0",
    "module_code": "TMP",
    "module_name": "Template Engine Control",
    "chapter_number": "12.4",
    "title": "Template Engine feature - preview parity",
    "source_standard_clause": "template-engine.requiredFeatures[3]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Template Engine must provide the required feature 'preview parity'.",
    "control_rule": "Template Engine must provide preview parity as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'template-engine.requiredFeatures[3]'."
    ],
    "evaluation_method": "Verify that 'preview parity' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Template Engine must provide preview parity as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Template Engine does not provide the required feature 'preview parity'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Template Engine",
    "evaluator": "Template Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "template-engine",
      "document-engine",
      "company-profile"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TMP-005",
    "version": "2.0.0",
    "module_code": "TMP",
    "module_name": "Template Engine Control",
    "chapter_number": "12.5",
    "title": "Template Engine proof expectation - template changes affect live document output",
    "source_standard_clause": "template-engine.requiredProofExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Template Engine must produce the proof expectation 'template changes affect live document output'.",
    "control_rule": "Template Engine must produce evidence that 'template changes affect live document output'.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'template-engine.requiredProofExpectations[0]'."
    ],
    "evaluation_method": "Run the proof path and verify evidence exists for 'template changes affect live document output'.",
    "scoring_logic": "Pass when evidence confirms 'Template Engine must produce evidence that 'template changes affect live document output'.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "proof artifact",
      "execution summary"
    ],
    "nonconformity": "Template Engine cannot produce proof for 'template changes affect live document output'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "Template Engine",
    "evaluator": "Template Engine reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": [
      "template-engine",
      "proof-layer",
      "document-engine",
      "company-profile"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TMP-006",
    "version": "2.0.0",
    "module_code": "TMP",
    "module_name": "Template Engine Control",
    "chapter_number": "12.6",
    "title": "Template Engine UI expectation - dedicated template dashboard",
    "source_standard_clause": "template-engine.requiredUiExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Template Engine must visibly satisfy the UI expectation 'dedicated template dashboard'.",
    "control_rule": "Template Engine must expose dedicated template dashboard without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'template-engine.requiredUiExpectations[0]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'dedicated template dashboard' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Template Engine must expose dedicated template dashboard without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Template Engine does not satisfy the UI expectation 'dedicated template dashboard'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Template Engine",
    "evaluator": "Template Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "template-engine",
      "ui-ux-shell",
      "document-engine",
      "company-profile"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TMP-007",
    "version": "2.0.0",
    "module_code": "TMP",
    "module_name": "Template Engine Control",
    "chapter_number": "12.7",
    "title": "Template Engine UI expectation - real editing canvas",
    "source_standard_clause": "template-engine.requiredUiExpectations[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Template Engine must visibly satisfy the UI expectation 'real editing canvas'.",
    "control_rule": "Template Engine must expose real editing canvas without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'template-engine.requiredUiExpectations[1]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'real editing canvas' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Template Engine must expose real editing canvas without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Template Engine does not satisfy the UI expectation 'real editing canvas'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Template Engine",
    "evaluator": "Template Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "template-engine",
      "ui-ux-shell",
      "document-engine",
      "company-profile"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-TMP-008",
    "version": "2.0.0",
    "module_code": "TMP",
    "module_name": "Template Engine Control",
    "chapter_number": "12.8",
    "title": "Template Engine UI expectation - no fake family diversity",
    "source_standard_clause": "template-engine.requiredUiExpectations[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Template Engine must visibly satisfy the UI expectation 'no fake family diversity'.",
    "control_rule": "Template Engine must expose no fake family diversity without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'template-engine.requiredUiExpectations[2]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'no fake family diversity' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Template Engine must expose no fake family diversity without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Template Engine does not satisfy the UI expectation 'no fake family diversity'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Template Engine",
    "evaluator": "Template Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "template-engine",
      "ui-ux-shell",
      "document-engine",
      "company-profile"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-DOC-001",
    "version": "2.0.0",
    "module_code": "DOC",
    "module_name": "Document Engine Control",
    "chapter_number": "11.1",
    "title": "Document Engine feature - draft and finalize workflow",
    "source_standard_clause": "document-engine.requiredFeatures[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Document Engine must provide the required feature 'draft and finalize workflow'.",
    "control_rule": "Document Engine must provide draft and finalize workflow as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'document-engine.requiredFeatures[0]'."
    ],
    "evaluation_method": "Verify that 'draft and finalize workflow' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Document Engine must provide draft and finalize workflow as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Document Engine does not provide the required feature 'draft and finalize workflow'.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Document Engine",
    "evaluator": "Document Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "document-engine",
      "template-engine",
      "accounting-engine",
      "inventory-engine",
      "tax-vat-engine",
      "compliance-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-DOC-002",
    "version": "2.0.0",
    "module_code": "DOC",
    "module_name": "Document Engine Control",
    "chapter_number": "11.2",
    "title": "Document Engine feature - document preview and PDF",
    "source_standard_clause": "document-engine.requiredFeatures[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Document Engine must provide the required feature 'document preview and PDF'.",
    "control_rule": "Document Engine must provide document preview and PDF as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'document-engine.requiredFeatures[1]'."
    ],
    "evaluation_method": "Verify that 'document preview and PDF' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Document Engine must provide document preview and PDF as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Document Engine does not provide the required feature 'document preview and PDF'.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Document Engine",
    "evaluator": "Document Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "document-engine",
      "template-engine",
      "accounting-engine",
      "inventory-engine",
      "tax-vat-engine",
      "compliance-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-DOC-003",
    "version": "2.0.0",
    "module_code": "DOC",
    "module_name": "Document Engine Control",
    "chapter_number": "11.3",
    "title": "Document Engine feature - credit and debit note support",
    "source_standard_clause": "document-engine.requiredFeatures[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Document Engine must provide the required feature 'credit and debit note support'.",
    "control_rule": "Document Engine must provide credit and debit note support as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'document-engine.requiredFeatures[2]'."
    ],
    "evaluation_method": "Verify that 'credit and debit note support' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Document Engine must provide credit and debit note support as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Document Engine does not provide the required feature 'credit and debit note support'.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Document Engine",
    "evaluator": "Document Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "document-engine",
      "template-engine",
      "accounting-engine",
      "inventory-engine",
      "tax-vat-engine",
      "compliance-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-DOC-004",
    "version": "2.0.0",
    "module_code": "DOC",
    "module_name": "Document Engine Control",
    "chapter_number": "11.4",
    "title": "Document Engine proof expectation - issue/pay/render flow is evidenced",
    "source_standard_clause": "document-engine.requiredProofExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Document Engine must produce the proof expectation 'issue/pay/render flow is evidenced'.",
    "control_rule": "Document Engine must produce evidence that 'issue/pay/render flow is evidenced'.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'document-engine.requiredProofExpectations[0]'."
    ],
    "evaluation_method": "Run the proof path and verify evidence exists for 'issue/pay/render flow is evidenced'.",
    "scoring_logic": "Pass when evidence confirms 'Document Engine must produce evidence that 'issue/pay/render flow is evidenced'.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "proof artifact",
      "execution summary"
    ],
    "nonconformity": "Document Engine cannot produce proof for 'issue/pay/render flow is evidenced'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "Document Engine",
    "evaluator": "Document Engine reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": [
      "document-engine",
      "proof-layer",
      "template-engine",
      "accounting-engine",
      "inventory-engine",
      "tax-vat-engine",
      "compliance-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-DOC-005",
    "version": "2.0.0",
    "module_code": "DOC",
    "module_name": "Document Engine Control",
    "chapter_number": "11.5",
    "title": "Document Engine proof expectation - preview and PDF match the same contract",
    "source_standard_clause": "document-engine.requiredProofExpectations[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Document Engine must produce the proof expectation 'preview and PDF match the same contract'.",
    "control_rule": "Document Engine must produce evidence that 'preview and PDF match the same contract'.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'document-engine.requiredProofExpectations[1]'."
    ],
    "evaluation_method": "Run the proof path and verify evidence exists for 'preview and PDF match the same contract'.",
    "scoring_logic": "Pass when evidence confirms 'Document Engine must produce evidence that 'preview and PDF match the same contract'.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "proof artifact",
      "execution summary"
    ],
    "nonconformity": "Document Engine cannot produce proof for 'preview and PDF match the same contract'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "Document Engine",
    "evaluator": "Document Engine reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": [
      "document-engine",
      "proof-layer",
      "template-engine",
      "accounting-engine",
      "inventory-engine",
      "tax-vat-engine",
      "compliance-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-DOC-006",
    "version": "2.0.0",
    "module_code": "DOC",
    "module_name": "Document Engine Control",
    "chapter_number": "11.6",
    "title": "Document Engine UI expectation - real registers",
    "source_standard_clause": "document-engine.requiredUiExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Document Engine must visibly satisfy the UI expectation 'real registers'.",
    "control_rule": "Document Engine must expose real registers without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'document-engine.requiredUiExpectations[0]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'real registers' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Document Engine must expose real registers without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Document Engine does not satisfy the UI expectation 'real registers'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Document Engine",
    "evaluator": "Document Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "document-engine",
      "ui-ux-shell",
      "template-engine",
      "accounting-engine",
      "inventory-engine",
      "tax-vat-engine",
      "compliance-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-DOC-007",
    "version": "2.0.0",
    "module_code": "DOC",
    "module_name": "Document Engine Control",
    "chapter_number": "11.7",
    "title": "Document Engine UI expectation - real create and detail pages",
    "source_standard_clause": "document-engine.requiredUiExpectations[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Document Engine must visibly satisfy the UI expectation 'real create and detail pages'.",
    "control_rule": "Document Engine must expose real create and detail pages without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'document-engine.requiredUiExpectations[1]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'real create and detail pages' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Document Engine must expose real create and detail pages without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Document Engine does not satisfy the UI expectation 'real create and detail pages'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Document Engine",
    "evaluator": "Document Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "document-engine",
      "ui-ux-shell",
      "template-engine",
      "accounting-engine",
      "inventory-engine",
      "tax-vat-engine",
      "compliance-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-DOC-008",
    "version": "2.0.0",
    "module_code": "DOC",
    "module_name": "Document Engine Control",
    "chapter_number": "11.8",
    "title": "Document Engine UI expectation - split preview drill-down",
    "source_standard_clause": "document-engine.requiredUiExpectations[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Document Engine must visibly satisfy the UI expectation 'split preview drill-down'.",
    "control_rule": "Document Engine must expose split preview drill-down without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'document-engine.requiredUiExpectations[2]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'split preview drill-down' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Document Engine must expose split preview drill-down without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Document Engine does not satisfy the UI expectation 'split preview drill-down'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Document Engine",
    "evaluator": "Document Engine reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "document-engine",
      "ui-ux-shell",
      "template-engine",
      "accounting-engine",
      "inventory-engine",
      "tax-vat-engine",
      "compliance-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-001",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.1",
    "title": "Do not bypass payment validation.",
    "source_standard_clause": "constitution.non_negotiable_rules[1]",
    "source_standard_document": "Master Design vNext / Constitution",
    "description": "Non-negotiable system rule: Do not bypass payment validation.",
    "control_rule": "Do not bypass payment validation.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'constitution.non_negotiable_rules[1]'."
    ],
    "evaluation_method": "Inspect runtime behavior and confirm the system does not violate 'Do not bypass payment validation.'.",
    "scoring_logic": "Pass when evidence confirms 'Do not bypass payment validation.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "runtime proof",
      "control center evidence"
    ],
    "nonconformity": "System behavior violates the non-negotiable rule 'Do not bypass payment validation.'.",
    "control_weight": 10,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and pre-deployment review",
    "control_owner": "System Governance",
    "evaluator": "Governance reviewer",
    "reviewer": "Architecture reviewer",
    "linked_project_modules": [
      "workflow-intelligence",
      "proof-layer",
      "ui-ux-shell"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-002",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.2",
    "title": "Every task must produce verifiable evidence.",
    "source_standard_clause": "constitution.non_negotiable_rules[5]",
    "source_standard_document": "Master Design vNext / Constitution",
    "description": "Non-negotiable system rule: Every task must produce verifiable evidence.",
    "control_rule": "Every task must produce verifiable evidence.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'constitution.non_negotiable_rules[5]'."
    ],
    "evaluation_method": "Inspect runtime behavior and confirm the system does not violate 'Every task must produce verifiable evidence.'.",
    "scoring_logic": "Pass when evidence confirms 'Every task must produce verifiable evidence.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "runtime proof",
      "control center evidence"
    ],
    "nonconformity": "System behavior violates the non-negotiable rule 'Every task must produce verifiable evidence.'.",
    "control_weight": 10,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and pre-deployment review",
    "control_owner": "System Governance",
    "evaluator": "Governance reviewer",
    "reviewer": "Architecture reviewer",
    "linked_project_modules": [
      "workflow-intelligence",
      "proof-layer",
      "ui-ux-shell"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-003",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.3",
    "title": "Country Service Architecture feature - active KSA product",
    "source_standard_clause": "country-service-architecture.requiredFeatures[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Country Service Architecture must provide the required feature 'active KSA product'.",
    "control_rule": "Country Service Architecture must provide active KSA product as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global",
      "France"
    ],
    "conditions": [
      "When the system executes the standard clause 'country-service-architecture.requiredFeatures[0]'."
    ],
    "evaluation_method": "Verify that 'active KSA product' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Country Service Architecture must provide active KSA product as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Country Service Architecture does not provide the required feature 'active KSA product'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Country Service Architecture",
    "evaluator": "Country Service Architecture reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "country-service-architecture",
      "document-engine",
      "tax-vat-engine",
      "compliance-layer",
      "company-profile"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-004",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.4",
    "title": "Country Service Architecture feature - France readiness boundary",
    "source_standard_clause": "country-service-architecture.requiredFeatures[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Country Service Architecture must provide the required feature 'France readiness boundary'.",
    "control_rule": "Country Service Architecture must provide France readiness boundary as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global",
      "France"
    ],
    "conditions": [
      "When the system executes the standard clause 'country-service-architecture.requiredFeatures[1]'."
    ],
    "evaluation_method": "Verify that 'France readiness boundary' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Country Service Architecture must provide France readiness boundary as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Country Service Architecture does not provide the required feature 'France readiness boundary'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Country Service Architecture",
    "evaluator": "Country Service Architecture reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "country-service-architecture",
      "document-engine",
      "tax-vat-engine",
      "compliance-layer",
      "company-profile"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-005",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.5",
    "title": "Country Service Architecture feature - future country slots",
    "source_standard_clause": "country-service-architecture.requiredFeatures[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Country Service Architecture must provide the required feature 'future country slots'.",
    "control_rule": "Country Service Architecture must provide future country slots as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global",
      "France"
    ],
    "conditions": [
      "When the system executes the standard clause 'country-service-architecture.requiredFeatures[2]'."
    ],
    "evaluation_method": "Verify that 'future country slots' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'Country Service Architecture must provide future country slots as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "Country Service Architecture does not provide the required feature 'future country slots'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Country Service Architecture",
    "evaluator": "Country Service Architecture reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "country-service-architecture",
      "document-engine",
      "tax-vat-engine",
      "compliance-layer",
      "company-profile"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-006",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.6",
    "title": "Country Service Architecture proof expectation - country-specific logic is attributable",
    "source_standard_clause": "country-service-architecture.requiredProofExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Country Service Architecture must produce the proof expectation 'country-specific logic is attributable'.",
    "control_rule": "Country Service Architecture must produce evidence that 'country-specific logic is attributable'.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'country-service-architecture.requiredProofExpectations[0]'."
    ],
    "evaluation_method": "Run the proof path and verify evidence exists for 'country-specific logic is attributable'.",
    "scoring_logic": "Pass when evidence confirms 'Country Service Architecture must produce evidence that 'country-specific logic is attributable'.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "proof artifact",
      "execution summary"
    ],
    "nonconformity": "Country Service Architecture cannot produce proof for 'country-specific logic is attributable'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "Country Service Architecture",
    "evaluator": "Country Service Architecture reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": [
      "country-service-architecture",
      "proof-layer",
      "document-engine",
      "tax-vat-engine",
      "compliance-layer",
      "company-profile"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-007",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.7",
    "title": "Country Service Architecture UI expectation - country readiness shown in control center",
    "source_standard_clause": "country-service-architecture.requiredUiExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Country Service Architecture must visibly satisfy the UI expectation 'country readiness shown in control center'.",
    "control_rule": "Country Service Architecture must expose country readiness shown in control center without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global",
      "France"
    ],
    "conditions": [
      "When the system executes the standard clause 'country-service-architecture.requiredUiExpectations[0]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'country readiness shown in control center' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'Country Service Architecture must expose country readiness shown in control center without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "Country Service Architecture does not satisfy the UI expectation 'country readiness shown in control center'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Country Service Architecture",
    "evaluator": "Country Service Architecture reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "country-service-architecture",
      "ui-ux-shell",
      "document-engine",
      "tax-vat-engine",
      "compliance-layer",
      "company-profile"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-008",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.8",
    "title": "End-to-End Workflow Proof feature - company to document to payment to reports flow",
    "source_standard_clause": "end-to-end-workflow-proof.requiredFeatures[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "End-to-End Workflow Proof must provide the required feature 'company to document to payment to reports flow'.",
    "control_rule": "End-to-End Workflow Proof must provide company to document to payment to reports flow as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'end-to-end-workflow-proof.requiredFeatures[0]'."
    ],
    "evaluation_method": "Verify that 'company to document to payment to reports flow' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'End-to-End Workflow Proof must provide company to document to payment to reports flow as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "End-to-End Workflow Proof does not provide the required feature 'company to document to payment to reports flow'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "End-to-End Workflow Proof",
    "evaluator": "End-to-End Workflow Proof reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "end-to-end-workflow-proof",
      "company-profile",
      "document-engine",
      "accounting-engine",
      "reports-engine",
      "proof-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-009",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.9",
    "title": "End-to-End Workflow Proof feature - stored proof artifacts",
    "source_standard_clause": "end-to-end-workflow-proof.requiredFeatures[1]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "End-to-End Workflow Proof must provide the required feature 'stored proof artifacts'.",
    "control_rule": "End-to-End Workflow Proof must provide stored proof artifacts as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'end-to-end-workflow-proof.requiredFeatures[1]'."
    ],
    "evaluation_method": "Verify that 'stored proof artifacts' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'End-to-End Workflow Proof must provide stored proof artifacts as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "End-to-End Workflow Proof does not provide the required feature 'stored proof artifacts'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "End-to-End Workflow Proof",
    "evaluator": "End-to-End Workflow Proof reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "end-to-end-workflow-proof",
      "company-profile",
      "document-engine",
      "accounting-engine",
      "reports-engine",
      "proof-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-010",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.10",
    "title": "End-to-End Workflow Proof feature - control dashboard status",
    "source_standard_clause": "end-to-end-workflow-proof.requiredFeatures[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "End-to-End Workflow Proof must provide the required feature 'control dashboard status'.",
    "control_rule": "End-to-End Workflow Proof must provide control dashboard status as a real runtime capability.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'end-to-end-workflow-proof.requiredFeatures[2]'."
    ],
    "evaluation_method": "Verify that 'control dashboard status' exists as a persisted, routed, or API-backed capability.",
    "scoring_logic": "Pass when evidence confirms 'End-to-End Workflow Proof must provide control dashboard status as a real runtime capability.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "feature proof",
      "route or API evidence"
    ],
    "nonconformity": "End-to-End Workflow Proof does not provide the required feature 'control dashboard status'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "End-to-End Workflow Proof",
    "evaluator": "End-to-End Workflow Proof reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "end-to-end-workflow-proof",
      "company-profile",
      "document-engine",
      "accounting-engine",
      "reports-engine",
      "proof-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-011",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.11",
    "title": "End-to-End Workflow Proof proof expectation - practical end-to-end flow is evidenced",
    "source_standard_clause": "end-to-end-workflow-proof.requiredProofExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "End-to-End Workflow Proof must produce the proof expectation 'practical end-to-end flow is evidenced'.",
    "control_rule": "End-to-End Workflow Proof must produce evidence that 'practical end-to-end flow is evidenced'.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'end-to-end-workflow-proof.requiredProofExpectations[0]'."
    ],
    "evaluation_method": "Run the proof path and verify evidence exists for 'practical end-to-end flow is evidenced'.",
    "scoring_logic": "Pass when evidence confirms 'End-to-End Workflow Proof must produce evidence that 'practical end-to-end flow is evidenced'.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "proof artifact",
      "execution summary"
    ],
    "nonconformity": "End-to-End Workflow Proof cannot produce proof for 'practical end-to-end flow is evidenced'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "End-to-End Workflow Proof",
    "evaluator": "End-to-End Workflow Proof reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": [
      "end-to-end-workflow-proof",
      "proof-layer",
      "company-profile",
      "document-engine",
      "accounting-engine",
      "reports-engine"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-012",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.12",
    "title": "End-to-End Workflow Proof UI expectation - control center shows workflow readiness and remaining work",
    "source_standard_clause": "end-to-end-workflow-proof.requiredUiExpectations[0]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "End-to-End Workflow Proof must visibly satisfy the UI expectation 'control center shows workflow readiness and remaining work'.",
    "control_rule": "End-to-End Workflow Proof must expose control center shows workflow readiness and remaining work without placeholder overclaim.",
    "applicability": [
      "KSA",
      "Gulf"
    ],
    "conditions": [
      "When the system executes the standard clause 'end-to-end-workflow-proof.requiredUiExpectations[0]'."
    ],
    "evaluation_method": "Review the routed UI and confirm 'control center shows workflow readiness and remaining work' is visible and operational.",
    "scoring_logic": "Pass when evidence confirms 'End-to-End Workflow Proof must expose control center shows workflow readiness and remaining work without placeholder overclaim.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI screenshot or DOM evidence",
      "route proof"
    ],
    "nonconformity": "End-to-End Workflow Proof does not satisfy the UI expectation 'control center shows workflow readiness and remaining work'.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "End-to-End Workflow Proof",
    "evaluator": "End-to-End Workflow Proof reviewer",
    "reviewer": "Phase 1 governance reviewer",
    "linked_project_modules": [
      "end-to-end-workflow-proof",
      "ui-ux-shell",
      "company-profile",
      "document-engine",
      "accounting-engine",
      "reports-engine",
      "proof-layer"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-013",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.13",
    "title": "Integrity Enforcement Engine processing contract",
    "source_standard_clause": "Integrity Enforcement Engine.processing_logic",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Run synchronous post-write accounting validations and reject broken state.",
    "control_rule": "Run synchronous post-write accounting validations and reject broken state.",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Integrity Enforcement Engine.processing_logic'."
    ],
    "evaluation_method": "Review the implementation path that fulfills integrity enforcement engine processing responsibilities.",
    "scoring_logic": "Pass when evidence confirms 'Run synchronous post-write accounting validations and reject broken state.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "service implementation trace",
      "workflow execution evidence"
    ],
    "nonconformity": "Integrity Enforcement Engine processing responsibilities are not enforceable in runtime behavior.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Integrity Enforcement Engine",
    "evaluator": "Integrity Enforcement Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "workflow-intelligence",
      "accounting-engine",
      "document-engine",
      "inventory-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-014",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.14",
    "title": "Must verify invoice-level linkage for allocated payment lines",
    "source_standard_clause": "Integrity Enforcement Engine.traceability_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Traceability requirement from Integrity Enforcement Engine: Must verify invoice-level linkage for allocated payment lines",
    "control_rule": "Must verify invoice-level linkage for allocated payment lines",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Integrity Enforcement Engine.traceability_rules[0]'."
    ],
    "evaluation_method": "Inspect persisted identifiers and confirm the system retains the traceability required by 'Must verify invoice-level linkage for allocated payment lines'.",
    "scoring_logic": "Pass when evidence confirms 'Must verify invoice-level linkage for allocated payment lines' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "stored linkage sample",
      "lookup evidence"
    ],
    "nonconformity": "Required traceability is missing for 'Must verify invoice-level linkage for allocated payment lines'.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Integrity Enforcement Engine",
    "evaluator": "Integrity Enforcement Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "workflow-intelligence",
      "accounting-engine",
      "document-engine",
      "inventory-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-015",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.15",
    "title": "Balanced entry validation",
    "source_standard_clause": "Integrity Enforcement Engine.validation_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Integrity Enforcement Engine: Balanced entry validation",
    "control_rule": "Balanced entry validation",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Integrity Enforcement Engine.validation_rules[0]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'Balanced entry validation'.",
    "scoring_logic": "Pass when evidence confirms 'Balanced entry validation' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'Balanced entry validation'.",
    "control_weight": 9,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Integrity Enforcement Engine",
    "evaluator": "Integrity Enforcement Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "workflow-intelligence",
      "accounting-engine",
      "document-engine",
      "inventory-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-016",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.16",
    "title": "coverage validation",
    "source_standard_clause": "Integrity Enforcement Engine.validation_rules[1]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Integrity Enforcement Engine: coverage validation",
    "control_rule": "coverage validation",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Integrity Enforcement Engine.validation_rules[1]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'coverage validation'.",
    "scoring_logic": "Pass when evidence confirms 'coverage validation' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'coverage validation'.",
    "control_weight": 9,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Integrity Enforcement Engine",
    "evaluator": "Integrity Enforcement Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "workflow-intelligence",
      "accounting-engine",
      "document-engine",
      "inventory-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-017",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.17",
    "title": "traceability validation",
    "source_standard_clause": "Integrity Enforcement Engine.validation_rules[2]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Integrity Enforcement Engine: traceability validation",
    "control_rule": "traceability validation",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Integrity Enforcement Engine.validation_rules[2]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'traceability validation'.",
    "scoring_logic": "Pass when evidence confirms 'traceability validation' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'traceability validation'.",
    "control_weight": 9,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Integrity Enforcement Engine",
    "evaluator": "Integrity Enforcement Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "workflow-intelligence",
      "accounting-engine",
      "document-engine",
      "inventory-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-XMD-018",
    "version": "2.0.0",
    "module_code": "XMD",
    "module_name": "Cross-Module Dependency Control",
    "chapter_number": "16.18",
    "title": "report visibility validation",
    "source_standard_clause": "Integrity Enforcement Engine.validation_rules[3]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Validation rule from Integrity Enforcement Engine: report visibility validation",
    "control_rule": "report visibility validation",
    "applicability": [
      "KSA",
      "Gulf",
      "EU",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'Integrity Enforcement Engine.validation_rules[3]'."
    ],
    "evaluation_method": "Execute the validation path and confirm the system enforces 'report visibility validation'.",
    "scoring_logic": "Pass when evidence confirms 'report visibility validation' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "validation result",
      "API or UI blocking evidence"
    ],
    "nonconformity": "The system does not enforce 'report visibility validation'.",
    "control_weight": 9,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Integrity Enforcement Engine",
    "evaluator": "Integrity Enforcement Engine reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": [
      "workflow-intelligence",
      "accounting-engine",
      "document-engine",
      "inventory-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-FRM-001",
    "version": "2.0.0",
    "module_code": "FRM",
    "module_name": "Forms and Registers Control",
    "chapter_number": "17.1",
    "title": "Operational forms must block invalid business actions",
    "source_standard_clause": "UI Validation Layer.validation_rules",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Operational forms and registers must surface validation clearly and block invalid issue paths.",
    "control_rule": "Required fields and invalid business inputs must block the action at the form or register surface with visible feedback.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'UI Validation Layer.validation_rules'."
    ],
    "evaluation_method": "Execute representative form and register flows and confirm invalid business actions are blocked with visible guidance.",
    "scoring_logic": "Pass when evidence confirms 'Required fields and invalid business inputs must block the action at the form or register surface with visible feedback.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "UI validation evidence",
      "blocking message evidence"
    ],
    "nonconformity": "Invalid business actions can pass through operational forms or registers without visible blocking guidance.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "UI Validation Layer",
    "evaluator": "UI validation reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "ui-ux-shell",
      "identity-workspace",
      "document-engine"
    ],
    "linked_files": [
      "master_design/master_design_vNext.json",
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-BRD-001",
    "version": "2.0.0",
    "module_code": "BRD",
    "module_name": "Branding Control",
    "chapter_number": "15.1",
    "title": "Users highlight - Seat usage stays visible",
    "source_standard_clause": "company-users.highlights[0]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Users must satisfy the highlighted workspace rule 'Seat usage stays visible'.",
    "control_rule": "Users must deliver 'Seat usage stays visible' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'company-users.highlights[0]'."
    ],
    "evaluation_method": "Inspect /workspace/settings/users and confirm 'Seat usage stays visible' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Users must deliver 'Seat usage stays visible' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Users does not deliver the highlight 'Seat usage stays visible'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Users",
    "evaluator": "Users reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-BRD-002",
    "version": "2.0.0",
    "module_code": "BRD",
    "module_name": "Branding Control",
    "chapter_number": "15.2",
    "title": "Users highlight - Role changes are controlled",
    "source_standard_clause": "company-users.highlights[1]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Users must satisfy the highlighted workspace rule 'Role changes are controlled'.",
    "control_rule": "Users must deliver 'Role changes are controlled' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'company-users.highlights[1]'."
    ],
    "evaluation_method": "Inspect /workspace/settings/users and confirm 'Role changes are controlled' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Users must deliver 'Role changes are controlled' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Users does not deliver the highlight 'Role changes are controlled'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Users",
    "evaluator": "Users reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-BRD-003",
    "version": "2.0.0",
    "module_code": "BRD",
    "module_name": "Branding Control",
    "chapter_number": "15.3",
    "title": "Users highlight - Internal user access stays simple",
    "source_standard_clause": "company-users.highlights[2]",
    "source_standard_document": "Workspace Module Directory",
    "description": "Users must satisfy the highlighted workspace rule 'Internal user access stays simple'.",
    "control_rule": "Users must deliver 'Internal user access stays simple' through the shipped workspace route and actions.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'company-users.highlights[2]'."
    ],
    "evaluation_method": "Inspect /workspace/settings/users and confirm 'Internal user access stays simple' is visible and actionable.",
    "scoring_logic": "Pass when evidence confirms 'Users must deliver 'Internal user access stays simple' through the shipped workspace route and actions.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "route screenshot",
      "action evidence"
    ],
    "nonconformity": "Users does not deliver the highlight 'Internal user access stays simple'.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workspace review",
    "control_owner": "Users",
    "evaluator": "Users reviewer",
    "reviewer": "Workspace governance reviewer",
    "linked_project_modules": [
      "identity-workspace",
      "ui-ux-shell"
    ],
    "linked_files": [
      "data/workspace.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-BRD-004",
    "version": "2.0.0",
    "module_code": "BRD",
    "module_name": "Branding Control",
    "chapter_number": "15.4",
    "title": "Template assets must stay assigned through one contract",
    "source_standard_clause": "template-engine.requiredFeatures[2]",
    "source_standard_document": "KSA Phase 1 Module Specs",
    "description": "Template engine must own asset assignment so logos and brand assets remain consistent across live output.",
    "control_rule": "Template asset assignment must be persisted once and reused consistently by live document rendering.",
    "applicability": [
      "KSA",
      "Gulf",
      "Global"
    ],
    "conditions": [
      "When the system executes the standard clause 'template-engine.requiredFeatures[2]'."
    ],
    "evaluation_method": "Inspect template persistence and rendered output to confirm brand assets remain consistent.",
    "scoring_logic": "Pass when evidence confirms 'Template asset assignment must be persisted once and reused consistently by live document rendering.' and fail when the clause is absent, bypassed, or unverifiable.",
    "evidence_requirement": [
      "template asset record",
      "rendered output sample"
    ],
    "nonconformity": "Brand assets diverge between template configuration and rendered output.",
    "control_weight": 6,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and template review",
    "control_owner": "Template Engine",
    "evaluator": "Template reviewer",
    "reviewer": "Brand governance reviewer",
    "linked_project_modules": [
      "template-engine",
      "document-engine",
      "company-profile"
    ],
    "linked_files": [
      "data/master-design/ksa-phase1.ts"
    ],
    "migration_action": "replace",
    "implementation_status": "partial",
    "status": "active"
  },
  {
    "id": "CP-COM-001",
    "version": "2.0.0",
    "module_code": "COM",
    "module_name": "Communication Control",
    "chapter_number": "10.1",
    "title": "Communication processing contract",
    "source_standard_clause": "Communication Engine.processing_logic",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Persist, dispatch, retry, and timeline outbound communications through one backend-owned runtime.",
    "control_rule": "Persist, dispatch, retry, and timeline outbound communications through one backend-owned runtime.",
    "applicability": ["KSA", "Gulf", "EU", "Global"],
    "conditions": ["When the system executes the standard clause 'Communication Engine.processing_logic'."],
    "evaluation_method": "Review the implementation path that fulfills communication engine processing responsibilities.",
    "scoring_logic": "Pass when evidence confirms the communication runtime persists, dispatches, retries, and exposes timelines without bypasses.",
    "evidence_requirement": ["service implementation trace", "workflow execution evidence"],
    "nonconformity": "Communication responsibilities are handled outside a persistent backend runtime.",
    "control_weight": 9,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Communication Engine",
    "evaluator": "Communication reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": ["document-engine", "workflow-intelligence", "identity-workspace"],
    "linked_files": ["backend/app/Services/Communication/CommunicationService.php"],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-COM-002",
    "version": "2.0.0",
    "module_code": "COM",
    "module_name": "Communication Control",
    "chapter_number": "10.2",
    "title": "Communication traceability",
    "source_standard_clause": "Communication Engine.traceability_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Every communication must retain source type, source id, channel, recipient, and attempt history.",
    "control_rule": "Every communication must retain source type, source id, channel, recipient, and attempt history.",
    "applicability": ["KSA", "Gulf", "EU", "Global"],
    "conditions": ["When the system executes the standard clause 'Communication Engine.traceability_rules[0]'."],
    "evaluation_method": "Inspect persisted identifiers and attempt records for communication traceability.",
    "scoring_logic": "Pass when communications and attempts keep full source and recipient traceability.",
    "evidence_requirement": ["stored linkage sample", "attempt evidence"],
    "nonconformity": "Communication traceability is missing or incomplete.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Communication Engine",
    "evaluator": "Communication reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": ["document-engine", "workflow-intelligence", "identity-workspace"],
    "linked_files": ["backend/app/Models/Communication.php", "backend/app/Models/CommunicationAttempt.php"],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-COM-003",
    "version": "2.0.0",
    "module_code": "COM",
    "module_name": "Communication Control",
    "chapter_number": "10.3",
    "title": "Communication required recipient validation",
    "source_standard_clause": "Communication Engine.validation_rules[0]",
    "source_standard_document": "Master Design vNext / Module Architecture",
    "description": "Email dispatch must block when a target address is absent.",
    "control_rule": "Email dispatch must block when a target address is absent.",
    "applicability": ["KSA", "Gulf", "EU", "Global"],
    "conditions": ["When the system executes the standard clause 'Communication Engine.validation_rules[0]'."],
    "evaluation_method": "Execute the validation path and confirm email sends require a target address.",
    "scoring_logic": "Pass when communication requests without recipient addresses are blocked.",
    "evidence_requirement": ["validation result", "API blocking evidence"],
    "nonconformity": "Email communications can be created without recipients.",
    "control_weight": 9,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Communication Engine",
    "evaluator": "Communication reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": ["document-engine", "identity-workspace"],
    "linked_files": ["backend/app/Http/Controllers/Api/CommunicationController.php"],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-COM-004",
    "version": "2.0.0",
    "module_code": "COM",
    "module_name": "Communication Control",
    "chapter_number": "10.4",
    "title": "Communication template resolution",
    "source_standard_clause": "Communication Engine.requiredFeatures[0]",
    "source_standard_document": "Communication Module Spec",
    "description": "The module must resolve system and company templates by channel and source type.",
    "control_rule": "Communication templates must resolve by channel and source type inside the backend runtime.",
    "applicability": ["KSA", "Gulf", "EU", "Global"],
    "conditions": ["When the system executes the standard clause 'Communication Engine.requiredFeatures[0]'."],
    "evaluation_method": "Verify backend template resolution exists and is persisted.",
    "scoring_logic": "Pass when communication templates are persisted and used for runtime content resolution.",
    "evidence_requirement": ["template records", "service evidence"],
    "nonconformity": "Template resolution is missing or handled outside the backend runtime.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Communication Engine",
    "evaluator": "Communication reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": ["document-engine", "ui-ux-shell"],
    "linked_files": ["backend/app/Services/Communication/CommunicationResolverService.php"],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-COM-005",
    "version": "2.0.0",
    "module_code": "COM",
    "module_name": "Communication Control",
    "chapter_number": "10.5",
    "title": "Communication dispatch attempts",
    "source_standard_clause": "Communication Engine.requiredFeatures[1]",
    "source_standard_document": "Communication Module Spec",
    "description": "Every dispatch must create a persisted attempt record with status and outcome.",
    "control_rule": "Every dispatch must create a persisted attempt record with status and outcome.",
    "applicability": ["KSA", "Gulf", "EU", "Global"],
    "conditions": ["When the system executes the standard clause 'Communication Engine.requiredFeatures[1]'."],
    "evaluation_method": "Inspect dispatch runtime and attempt persistence.",
    "scoring_logic": "Pass when dispatches always create attempt records with outcome state.",
    "evidence_requirement": ["attempt record", "dispatch service evidence"],
    "nonconformity": "Communication dispatch outcomes are not persisted.",
    "control_weight": 8,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Communication Engine",
    "evaluator": "Communication reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": ["document-engine", "workflow-intelligence"],
    "linked_files": ["backend/app/Services/Communication/CommunicationDispatchService.php"],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-COM-006",
    "version": "2.0.0",
    "module_code": "COM",
    "module_name": "Communication Control",
    "chapter_number": "10.6",
    "title": "Communication retry bounds",
    "source_standard_clause": "Communication Engine.validation_rules[1]",
    "source_standard_document": "Communication Module Spec",
    "description": "Retries must be bounded and persist retry counters.",
    "control_rule": "Communication retries must be bounded and persist retry counters.",
    "applicability": ["KSA", "Gulf", "EU", "Global"],
    "conditions": ["When the system executes the standard clause 'Communication Engine.validation_rules[1]'."],
    "evaluation_method": "Execute retry flow and verify retry ceiling enforcement.",
    "scoring_logic": "Pass when retries increment counters and block beyond the configured ceiling.",
    "evidence_requirement": ["retry evidence", "validation result"],
    "nonconformity": "Retries are unbounded or do not persist correctly.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Communication Engine",
    "evaluator": "Communication reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": ["document-engine", "workflow-intelligence"],
    "linked_files": ["backend/app/Services/Communication/CommunicationRetryService.php"],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-COM-007",
    "version": "2.0.0",
    "module_code": "COM",
    "module_name": "Communication Control",
    "chapter_number": "10.7",
    "title": "Communication duplicate prevention",
    "source_standard_clause": "Communication Engine.validation_rules[2]",
    "source_standard_document": "Communication Module Spec",
    "description": "Repeated sends for the same source, recipient, and subject must be deduplicated within the active runtime window.",
    "control_rule": "Repeated sends for the same source, recipient, and subject must be deduplicated within the active runtime window.",
    "applicability": ["KSA", "Gulf", "EU", "Global"],
    "conditions": ["When the system executes the standard clause 'Communication Engine.validation_rules[2]'."],
    "evaluation_method": "Execute duplicate send flow and verify reuse of the existing communication record.",
    "scoring_logic": "Pass when duplicate send requests return the active communication record instead of creating duplicates.",
    "evidence_requirement": ["validation result", "stored linkage sample"],
    "nonconformity": "Duplicate communication records are created for the same send intent.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Communication Engine",
    "evaluator": "Communication reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": ["document-engine", "workflow-intelligence"],
    "linked_files": ["backend/app/Services/Communication/CommunicationService.php"],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-COM-008",
    "version": "2.0.0",
    "module_code": "COM",
    "module_name": "Communication Control",
    "chapter_number": "10.8",
    "title": "Communication source timeline",
    "source_standard_clause": "Communication Engine.requiredFeatures[2]",
    "source_standard_document": "Communication Module Spec",
    "description": "Communication history must be queryable by source record.",
    "control_rule": "Communication history must be queryable by source record.",
    "applicability": ["KSA", "Gulf", "EU", "Global"],
    "conditions": ["When the system executes the standard clause 'Communication Engine.requiredFeatures[2]'."],
    "evaluation_method": "Review timeline API and UI integration by source record.",
    "scoring_logic": "Pass when communication history is queryable and visible by source record.",
    "evidence_requirement": ["route or API evidence", "UI screenshot or DOM evidence"],
    "nonconformity": "Communication history cannot be retrieved by source record.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Communication Engine",
    "evaluator": "Communication reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": ["document-engine", "ui-ux-shell", "workflow-intelligence"],
    "linked_files": ["backend/app/Services/Communication/CommunicationTimelineService.php"],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-COM-009",
    "version": "2.0.0",
    "module_code": "COM",
    "module_name": "Communication Control",
    "chapter_number": "10.9",
    "title": "Document send integration",
    "source_standard_clause": "Communication Engine.requiredFeatures[3]",
    "source_standard_document": "Communication Module Spec",
    "description": "Document sending must route through the Communication module instead of direct mail dispatch.",
    "control_rule": "Document sending must route through the Communication module instead of direct mail dispatch.",
    "applicability": ["KSA", "Gulf", "EU", "Global"],
    "conditions": ["When the system executes the standard clause 'Communication Engine.requiredFeatures[3]'."],
    "evaluation_method": "Review document send controller and invoice detail integration.",
    "scoring_logic": "Pass when document send flows create communication records and attempt history.",
    "evidence_requirement": ["service implementation trace", "workflow execution evidence"],
    "nonconformity": "Document sends bypass the Communication module.",
    "control_weight": 9,
    "risk_priority": "critical",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Communication Engine",
    "evaluator": "Communication reviewer",
    "reviewer": "Standards governance reviewer",
    "linked_project_modules": ["document-engine", "ui-ux-shell"],
    "linked_files": ["backend/app/Http/Controllers/Api/DocumentCenterController.php", "components/workspace/InvoiceDetailWorkspace.tsx"],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-COM-010",
    "version": "2.0.0",
    "module_code": "COM",
    "module_name": "Communication Control",
    "chapter_number": "10.10",
    "title": "In-app event mirroring",
    "source_standard_clause": "Communication Engine.requiredFeatures[4]",
    "source_standard_document": "Communication Module Spec",
    "description": "External sends must create an in-app/system timeline event for operational visibility.",
    "control_rule": "External sends must create an in-app/system timeline event for operational visibility.",
    "applicability": ["KSA", "Gulf", "EU", "Global"],
    "conditions": ["When the system executes the standard clause 'Communication Engine.requiredFeatures[4]'."],
    "evaluation_method": "Inspect communication creation flow and timeline results.",
    "scoring_logic": "Pass when document send flows create both email and in-app communication records.",
    "evidence_requirement": ["workflow execution evidence", "timeline evidence"],
    "nonconformity": "Operational communication events are not visible in-app.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly workflow review",
    "control_owner": "Communication Engine",
    "evaluator": "Communication reviewer",
    "reviewer": "Workflow reviewer",
    "linked_project_modules": ["document-engine", "workflow-intelligence", "ui-ux-shell"],
    "linked_files": ["backend/app/Services/Communication/CommunicationService.php"],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-COM-011",
    "version": "2.0.0",
    "module_code": "COM",
    "module_name": "Communication Control",
    "chapter_number": "10.11",
    "title": "Communication learning persistence",
    "source_standard_clause": "Communication Engine.requiredFeatures[5]",
    "source_standard_document": "Communication Module Spec",
    "description": "The module must persist delivery learning signals and snapshot them on communication records.",
    "control_rule": "The module must persist delivery learning signals and snapshot them on communication records.",
    "applicability": ["KSA", "Gulf", "EU", "Global"],
    "conditions": ["When the system executes the standard clause 'Communication Engine.requiredFeatures[5]'."],
    "evaluation_method": "Inspect learning table persistence and communication snapshots.",
    "scoring_logic": "Pass when delivery outcomes update learning signals and communications store learning snapshots.",
    "evidence_requirement": ["db-state", "service implementation trace"],
    "nonconformity": "Learning state is not persisted or not linked to communications.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly review",
    "control_owner": "Communication Engine",
    "evaluator": "Communication reviewer",
    "reviewer": "Architecture reviewer",
    "linked_project_modules": ["workflow-intelligence", "document-engine"],
    "linked_files": ["backend/app/Services/Communication/CommunicationLearningService.php"],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-COM-012",
    "version": "2.0.0",
    "module_code": "COM",
    "module_name": "Communication Control",
    "chapter_number": "10.12",
    "title": "Communication API ownership",
    "source_standard_clause": "Communication Engine.requiredFeatures[6]",
    "source_standard_document": "Communication Module Spec",
    "description": "The module must expose company-scoped API ownership for register, timeline, retry, cancel, and template management.",
    "control_rule": "The module must expose company-scoped API ownership for register, timeline, retry, cancel, and template management.",
    "applicability": ["KSA", "Gulf", "EU", "Global"],
    "conditions": ["When the system executes the standard clause 'Communication Engine.requiredFeatures[6]'."],
    "evaluation_method": "Review company-scoped API routes and controllers.",
    "scoring_logic": "Pass when the module owns company-scoped API routes for runtime operations.",
    "evidence_requirement": ["route or API evidence", "controller evidence"],
    "nonconformity": "Communication runtime operations are not owned by company-scoped APIs.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and quarterly control review",
    "control_owner": "Communication Engine",
    "evaluator": "Communication reviewer",
    "reviewer": "Security reviewer",
    "linked_project_modules": ["identity-workspace", "document-engine"],
    "linked_files": ["backend/routes/api.php"],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-COM-013",
    "version": "2.0.0",
    "module_code": "COM",
    "module_name": "Communication Control",
    "chapter_number": "10.13",
    "title": "Communication register UI",
    "source_standard_clause": "Communication Engine.requiredUiExpectations[0]",
    "source_standard_document": "Communication Module Spec",
    "description": "The module must expose a real communication register UI.",
    "control_rule": "The module must expose a real communication register UI without placeholder overclaim.",
    "applicability": ["KSA", "Gulf", "EU", "Global"],
    "conditions": ["When the system executes the standard clause 'Communication Engine.requiredUiExpectations[0]'."],
    "evaluation_method": "Review the communication register route and runtime-backed list rendering.",
    "scoring_logic": "Pass when a real communication register route lists live communication records.",
    "evidence_requirement": ["UI screenshot or DOM evidence", "route proof"],
    "nonconformity": "No real communication register UI exists.",
    "control_weight": 7,
    "risk_priority": "medium",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Communication Engine",
    "evaluator": "Communication reviewer",
    "reviewer": "UX reviewer",
    "linked_project_modules": ["ui-ux-shell", "document-engine"],
    "linked_files": ["components/workspace/CommunicationRegister.tsx"],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-COM-014",
    "version": "2.0.0",
    "module_code": "COM",
    "module_name": "Communication Control",
    "chapter_number": "10.14",
    "title": "Invoice detail send dialog and timeline",
    "source_standard_clause": "Communication Engine.requiredUiExpectations[1]",
    "source_standard_document": "Communication Module Spec",
    "description": "Invoice detail must expose the communication send dialog and timeline panel against live APIs.",
    "control_rule": "Invoice detail must expose the communication send dialog and timeline panel against live APIs.",
    "applicability": ["KSA", "Gulf", "EU", "Global"],
    "conditions": ["When the system executes the standard clause 'Communication Engine.requiredUiExpectations[1]'."],
    "evaluation_method": "Review invoice detail route and confirm the UI is runtime-backed.",
    "scoring_logic": "Pass when invoice detail shows runtime-backed send dialog, status badge, and timeline.",
    "evidence_requirement": ["UI screenshot or DOM evidence", "route proof"],
    "nonconformity": "Invoice detail communication UI is missing or not runtime-backed.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and monthly UX review",
    "control_owner": "Communication Engine",
    "evaluator": "Communication reviewer",
    "reviewer": "UX reviewer",
    "linked_project_modules": ["document-engine", "ui-ux-shell"],
    "linked_files": ["components/workspace/InvoiceDetailWorkspace.tsx"],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  },
  {
    "id": "CP-COM-015",
    "version": "2.0.0",
    "module_code": "COM",
    "module_name": "Communication Control",
    "chapter_number": "10.15",
    "title": "Communication proof expectation",
    "source_standard_clause": "Communication Engine.requiredProofExpectations[0]",
    "source_standard_document": "Communication Module Spec",
    "description": "The module must produce verifiable evidence for persisted delivery, retry, and timeline behavior.",
    "control_rule": "The module must produce verifiable evidence for persisted delivery, retry, and timeline behavior.",
    "applicability": ["KSA", "Gulf", "EU", "Global"],
    "conditions": ["When the system executes the standard clause 'Communication Engine.requiredProofExpectations[0]'."],
    "evaluation_method": "Run communication tests and evidence capture to verify persisted runtime behavior.",
    "scoring_logic": "Pass when communication tests and evidence files prove persisted delivery, retry, and timeline behavior.",
    "evidence_requirement": ["proof artifact", "execution summary"],
    "nonconformity": "Communication runtime proof is missing or unverifiable.",
    "control_weight": 8,
    "risk_priority": "high",
    "evaluation_frequency": "Per release and before acceptance",
    "control_owner": "Communication Engine",
    "evaluator": "Communication reviewer",
    "reviewer": "Proof governance reviewer",
    "linked_project_modules": ["proof-layer", "document-engine", "workflow-intelligence"],
    "linked_files": ["backend/tests/Feature/CommunicationModuleTest.php"],
    "migration_action": "replace",
    "implementation_status": "implemented",
    "status": "active"
  }
] as const;

export const masterDesignSystemControlPoints = [
  { id: "CP-MD-001", title: "dashboard reads runtime audit only", rule: "System Master Design must read runtime audit output only." },
  { id: "CP-MD-002", title: "no static values allowed", rule: "System Master Design must not render hardcoded pass, fail, or partial counts." },
  { id: "CP-MD-003", title: "all modules mapped correctly", rule: "System Master Design must map every active system module into the compact tree." },
  { id: "CP-MD-004", title: "drill-down hierarchy valid", rule: "System Master Design must expand inline and expose child modules without dead-end navigation." },
  { id: "CP-MD-005", title: "UI reflects real counts", rule: "System Master Design cards must show runtime-derived progress, fail, and partial counts." },
  { id: "CP-MD-006", title: "no stale data", rule: "System Master Design must surface current failing areas and priority modules from runtime state." },
] as const;
