# Control Point Anti-Cheat Analysis

## Purpose
This document explains the main ways a control point can appear to pass without actually being satisfied, and the prevention rules used in the hardened registry.

## False-Pass Patterns
1. Cached or preview-only output is substituted for real observed state.
2. A single source is used to self-attest success while cross-validation is omitted.
3. A placeholder page, generic overview, or masked route is treated as a real module surface.
4. A report is computed independently from the governed ledger or stock truth.
5. A workflow is marked complete even though the journal, VAT, movement, or attendance basis is missing.
6. A mismatch is hidden instead of being surfaced as a failure.
7. A field is defaulted, inferred, or blanked to force an apparent pass.

## Prevention Rules
1. Every control requires an `expected_state` predicate set and a `failure_condition` predicate set.
2. Every control requires at least two cross-validation sources.
3. Every control requires measurable fields that can be observed directly.
4. Every control requires evidence artifacts, not narrative summaries.
5. Every control requires a domain-specific anti-cheat rule set.
6. Every critical control must fail when the governing source, runtime output, and cross-check do not agree.

## Module-Specific Anti-Cheat Focus
- Workspace and UX controls prevent placeholder masking, preview dead-ends, and trapped layouts.
- Document and template controls prevent preview/PDF divergence, arbitrary HTML, and section drift.
- Accounting, VAT, inventory, and payroll controls prevent silent mutation, missing journals, stock/accounting mismatch, and standalone payroll behavior.
- Reporting and reconciliation controls prevent independent calculations and hidden mismatches.
- Governance controls prevent lower-precedence artifacts from being treated as law.

## Resulting Guarantee
A control point can only pass when the same requirement is satisfied by the governing clause, the relevant control logic, and the observable evidence set.
