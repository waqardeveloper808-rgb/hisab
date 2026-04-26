# Validation report — Workspace V2 Template Studio

## Route and stack

- URL exercised: `http://localhost:3000/workspace-v2/user/templates/studio?template=tmpl-standard`
- localStorage key: `hisabix.wsv2.templateUi.v1` (cleared mid-run for clean-default pass)

## Automated checks (Playwright)

- After storage reset: QR card width input = **150**, QR image = **125**, QR align = **left**, totals card width = **430**.
- Totals card width change (430 → 260) reduced preview section width (bounding box).
- Client-side PDF download succeeded; artifact: `after-pdf-export.pdf`.

## Preview / PDF parity

- UI line: **Not checked** until user runs PDF export; after successful export: **Checked by last export** (session state only; not a cryptographic/layout proof).

## Artifacts (absolute paths)

Folder: `C:\hisab\storage\app\agent-output\workspace-v2-studio-control-completion-20260426-1329`

Screenshots and PDF as produced by `tools/capture-template-studio-screens.mjs`, including:

- `before-active-v2-studio.png`
- `after-vat-column-visible.png` / `after-vat-column-hidden.png` / `after-vat-column-hidden-canvas.png`
- `after-compact-inspector.png`
- `after-english-arabic-colors.png`
- `after-info-cards-density.png`
- `after-qr-defaults-150-125-left.png`
- `after-totals-default-430.png`
- `after-totals-internal-columns-adjusted.png`
- `after-logo-upload-control.png` / `after-stamp-upload-control.png` / `after-signature-upload-control.png`
- `after-signature-modal.png`
- `after-signature-preview-sequence.png`
- `after-reset-defaults-control.png`
- `after-preflight-panel.png`
- `after-pdf-export.pdf`

## Status

**PASS** for Workspace V2 Studio scope: controls, defaults after migration, capture script, and sample PDF export.

Repository-wide `tsc --noEmit` still reports errors in unrelated paths; not treated as V2 Studio regression here (see `blockers.md`).
