# Root Cause Analysis Protocol

## 1. Required RCA Fields
1.1 Failed clause.
1.2 Failed control point.
1.3 Observed symptom.
1.4 Affected module.
1.5 Affected workflow.
1.6 Probable cause layer.
1.7 Suspected file, service, or component zone.
1.8 Failure mechanism.
1.9 Evidence supporting the cause.
1.10 Rejected alternative causes.
1.11 Confidence level.

## 2. Probable Cause Layers
2.1 Workspace shell.
2.2 Route ownership.
2.3 Template composition.
2.4 Preview renderer.
2.5 PDF generator.
2.6 Mapping layer.
2.7 Posting service.
2.8 Journal engine.
2.9 VAT resolver.
2.10 Report aggregation.
2.11 Inventory movement.
2.12 Valuation layer.
2.13 Payroll calculation.
2.14 Traceability metadata.
2.15 Control-point binding.
2.16 Audit binding.

## 3. Forbidden RCA Forms
3.1 “Bug somewhere.”
3.2 “Session issue maybe.”
3.3 “UI glitch.”
3.4 “Seems fixed.”

## 4. Clause IDs
4.1 Stable clauses in this document use the prefix `AUD-RCA`.

## 5. Enforceable Clauses
- `AUD-RCA-001`: RCA shall include the required fields.
- `AUD-RCA-002`: RCA shall identify a probable cause layer.
- `AUD-RCA-003`: RCA shall cite evidence.
- `AUD-RCA-004`: RCA shall reject lazy root-cause statements.
