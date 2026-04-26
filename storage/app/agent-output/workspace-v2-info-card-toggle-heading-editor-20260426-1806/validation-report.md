# Validation — Workspace V2 info card sizes, field switches, item headings

- URL: http://localhost:3000/workspace-v2/user/templates/studio?template=tmpl-standard
- **Client / Document** inspector: card width, min height, fixed height, padding, row gap (stable ids `wsv2-client-*` / `wsv2-docinfo-*`).
- **Field visibility:** compact `role="switch"` toggles (Customer + Document info sections).
- **Products / Services:** per-column EN/AR heading inputs; Description edited to **Item Description** / **وصف البند** in capture.

## Screenshots

- `before-large-info-card-spacing.png`
- `before-awkward-toggle-buttons.png`
- `before-fixed-table-headings.png`
- `after-client-card-controls-visible.png`
- `after-document-card-controls-visible.png`
- `after-client-card-auto-height-compact.png`
- `after-document-card-auto-height-compact.png`
- `after-client-card-fixed-height-test.png`
- `after-document-card-fixed-height-test.png`
- `after-row-gap-0-padding-0-compact.png`
- `after-customer-field-compact-toggles.png`
- `after-document-field-compact-toggles.png`
- `after-toggle-off-hides-field.png`
- `after-toggle-on-shows-field.png`
- `after-products-heading-editor-controls.png`
- `after-products-heading-edited-preview.png`
- `after-full-preview-no-overflow.png`

- **PDF (if captured):** `C:\hisab\storage\app\agent-output\workspace-v2-info-card-toggle-heading-editor-20260426-1806\after-products-heading-edited-pdf.pdf`

## Telemetry

```json
{
  "visibilityToggleSection": "docInfo",
  "visibilityPanelSwitchCount": 0,
  "pdfPath": "C:\\hisab\\storage\\app\\agent-output\\workspace-v2-info-card-toggle-heading-editor-20260426-1806\\after-products-heading-edited-pdf.pdf"
}
```

- Exit code: 2
- Blockers: see blockers.md
