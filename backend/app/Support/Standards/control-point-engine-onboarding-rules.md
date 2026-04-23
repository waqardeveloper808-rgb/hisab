# Control Point Engine Onboarding Rules

## Mandatory Onboarding Flow

When a new module, sub-module, workflow, feature system, or smaller business engine is introduced, activation must not proceed until all of the following are complete:

1. Register the control module in the Control Point Engine registry.
2. Link the module to a standards source or governance clause.
3. Generate the corresponding control points using the active standards schema.
4. Register the generated control points in the Control Point Engine runtime.
5. Run engine validation and confirm there are no duplicate IDs, orphan controls, missing module registration, or count mismatches.
6. Ensure the audit engine can execute the new controls before the module is considered complete.

## Validation Gate

- A module onboarding is invalid if the module code is not present in the engine registry.
- A module onboarding is invalid if the related control points are missing from engine runtime registration.
- A module onboarding is invalid if the engine validation output reports duplicate IDs, orphan controls, missing module registration, or zero-control modules for the new module.

## Governance Note

- Control governance is part of delivery, not a post-delivery report.
- The Control Point Engine must be updated in the same change that introduces the new module or system.
- The engine self-controls must remain active and auditable whenever onboarding changes are made.