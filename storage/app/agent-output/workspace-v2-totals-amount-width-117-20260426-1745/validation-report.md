# Validation — Workspace V2 Totals Amount column default (117)

- URL: http://localhost:3000/workspace-v2/user/templates/studio?template=tmpl-standard
- localStorage key: `hisabix.wsv2.templateUi.v1` — removed to verify clean default
- **DEFAULT_TOTALS_BLOCK.totals_amount_col_width_px** must be **117** (inspector `#wsv2-totals-col-amount`).
- **Reset studio defaults** restores Amount column to **117** after a user edit.
- **Preview:** see `after-preview-totals-canvas.png`.
- **PDF:** `C:\hisab\storage\app\agent-output\workspace-v2-totals-amount-width-117-20260426-1745\after-pdf-export-totals-117.pdf`

## Telemetry

```json
{
  "cleanLocalStorageAmountColumnPx": "117",
  "amountAfterUserEdit": "888",
  "afterResetStudioDefaultsAmountColumnPx": "117",
  "pdfPath": "C:\\hisab\\storage\\app\\agent-output\\workspace-v2-totals-amount-width-117-20260426-1745\\after-pdf-export-totals-117.pdf"
}
```

- Exit code: 0
- Blockers: none
