# Control Point Engine Rules

## Runtime Law

- No module may exist without control module registration.
- No sub-module may exist without control consideration.
- No new system may be marked complete unless its control points are defined, structured, registered, visible in inventory, and executable by the audit engine.
- The Control Point Engine is the permanent runtime and governance source of truth for control module registration, control point registration, inventory, lifecycle state, and standards traceability.

## Engine Responsibilities

- Register all active control modules.
- Register all active control points.
- Publish total counts, module counts, lifecycle counts, implementation counts, and standards traceability counts.
- Detect duplicates, orphans, missing module registration, modules with zero controls, and controls without standards traceability.
- Expose deterministic runtime output that can be imported by audit, validation, summary, and dashboard surfaces.

## Activation Rule

- Runtime activation is valid only when engine validation passes or the reported blockers are explicitly visible in the engine validation output.
- The engine must include self-controls for its own registration integrity, duplicate prevention, orphan detection, count accuracy, traceability, onboarding governance, validation execution, summary consistency, and runtime availability.