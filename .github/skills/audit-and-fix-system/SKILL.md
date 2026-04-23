---
name: audit-and-fix-system
description: "Use when running a full audit/fix loop: load control points, run the audit engine, capture results, identify FAIL items, fix each failure, rerun audit, and repeat until all required checks pass with evidence. Best for system recovery, forensic validation, control-point enforcement, and evidence-driven remediation."
---

# Audit and Fix System

## Objective

Run a full audit, identify failures, fix issues, and rerun the audit until the target scope passes with evidence.

## Use When

- You need an evidence-driven audit and remediation loop.
- You are validating control points, workflows, or operational pages.
- You must avoid skipping failures or claiming completion without reruns.
- You need a repeatable execution format for recovery or stabilization work.

## Inputs To Confirm

Before executing, confirm these inputs if they are not already explicit in the request:

- Audit scope: full system, module, route set, workflow, or file group.
- Environment: local, staging, or other target.
- Evidence targets: DB, API, UI, logs, workflow proofs, or all of them.
- Pass criteria: what must be green before closure.
- Artifact location: where reports, logs, and proofs should be written.

If any of these are missing, ask only for the missing items. Do not delay execution for information that can be discovered directly from the workspace.

## Execution Workflow

Execute in order. Do not skip steps.

1. Load control points.
   - Locate the authoritative control-point registry, runtime definitions, and audit engine entrypoints.
   - Confirm which controls apply to the requested scope.
   - Record missing or stale control definitions as findings, not assumptions.

2. Run the audit engine.
   - Execute the existing audit command or script for the target scope.
   - If there is no usable command, build the minimum viable audit entrypoint required to produce machine-readable output.
   - Capture raw results before making fixes.

3. Capture results.
   - Save raw outputs, summaries, and supporting evidence.
   - Preserve exact failure messages, counts, and affected entities.
   - Prefer independently measured evidence over derived summaries.

4. Identify FAIL items.
   - Enumerate all FAIL, BLOCKED, PARTIAL, and invalid states.
   - Classify each issue by root cause area: design, implementation, operating, configuration, data, or environment.
   - Map each issue to the exact files, functions, routes, and dependencies involved.

5. Fix each failure.
   - Fix the root cause, not the symptom.
   - Do not suppress errors, rename failures, or replace broken flows with placeholders.
   - Keep changes minimal and traceable.
   - Update related scripts, tests, or docs if they are part of the broken path.

6. Re-run the audit.
   - Re-execute the same audit and proof steps after each meaningful fix set.
   - Confirm that previous failures changed state for the right reason.
   - Treat regressions or mismatches between DB, API, and UI as open failures.

7. Repeat until all PASS.
   - Continue the loop until all required checks pass, or until remaining blockers are explicit and independently evidenced.
   - If a blocker cannot be resolved within the current environment, log it clearly with proof and stop only that branch of work.

## Decision Rules

- If control definitions are missing or incomplete, repair the control layer first.
- If audit output contradicts DB/API/UI truth, trust independent evidence over internal PASS flags.
- If a failure is caused by missing data, prove whether the data should exist and fix the generation or loading path.
- If the environment is broken, distinguish environment failure from application failure, but still capture proof.
- If one fix touches multiple failures, rerun the relevant proofs before proceeding to unrelated issues.

## Enforcement Rules

- No skipping.
- Evidence required.
- Retry loop mandatory.
- No error suppression.
- No fake-empty fallbacks for real backend failures.
- No closure without fresh rerun evidence.

## Quality Criteria

A cycle is only complete when all of the following are true for the current scope:

- Audit output was captured before and after fixes.
- Each failure has an exact root cause or explicit blocker.
- Fixes were applied to the real broken path.
- Independent evidence matches the reported status.
- Reruns prove the failure is resolved or still blocked.

## Output Format

Return results in this structure:

### Execution Summary

- Scope audited
- Commands or scripts run
- Evidence captured
- Audit status before fixes
- Audit status after fixes

### Failures

- Each failed or blocked item
- Root cause
- Affected files or routes
- Evidence reference

### Fixes Applied

- Files changed
- What was corrected
- Why the change addresses the root cause

### Final Status

- PASS, FAIL, PARTIAL, or BLOCKED
- Open blockers, if any
- Required next rerun or follow-up action

## Example Prompts

- /audit-and-fix-system Run a full audit on the invoice workflow, fix failures, and rerun until DB, API, and UI evidence align.
- /audit-and-fix-system Audit the control-point engine for the template editor, repair broken controls, and produce before/after evidence.
- /audit-and-fix-system Run the recovery loop for journal entry pages, capture FAIL items, fix them, and return final status with proof.