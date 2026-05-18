# Missing reference blocker — Invoice.mhtml

## Status

**BLOCKER**

## Required path

`C:\hisab\reference\Invoice.mhtml`

## Verification

- `C:\hisab\reference` directory: **not present** (verified 2026-05-01).
- Repository-wide glob for `Invoice.mhtml`: **0 files**.

## Impact

Per HISABIX FINAL RECOVERY V4 instructions:

- Template Studio redesign benchmarked **directly** from `Invoice.mhtml` cannot be performed from source material on disk.
- UX/layout parity claims against that file cannot be evidence-backed until the file is added.

## Remediation

1. Add folder `C:\hisab\reference\`.
2. Place `Invoice.mhtml` at `C:\hisab\reference\Invoice.mhtml`.
3. Re-run Phase 0 reference study and update `reports/invoice-mhtml-ux-extraction.md` from the actual file.

## Execution note

Work continued using **only** the phase specifications and structure described in the recovery ticket (no Wafeq proprietary code/CSS/assets copied). A copy of this report exists under the active artifact `reports/` folder when an artifact run is in progress.
