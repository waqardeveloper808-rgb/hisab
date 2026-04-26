# Validation — Workspace V2 info cards Value column default (225px)

- URL: http://localhost:3000/workspace-v2/user/templates/studio?template=tmpl-standard
- localStorage key: `hisabix.wsv2.templateUi.v1` — removed to verify clean default
- **DEFAULT_INFO_CARD_LAYOUT.valueColumnWidthPx** must be **225** (shared Client + Document info: `#wsv2-customer-value-col-width`, `#wsv2-docinfo-value-col-width`).
- **Reset studio defaults** restores Value column to **225** after a user edit.
- **Client Information preview:** `after-preview-customer-info-canvas.png`.
- **Document Information preview:** `after-preview-docinfo-canvas.png`.
- **PDF:** `C:\hisab\storage\app\agent-output\workspace-v2-info-value-width-225-20260426-1749\after-pdf-export-info-value-225.pdf`

## Telemetry

```json
{
  "cleanLocalStorageValueColumnCustomerPx": "225",
  "cleanLocalStorageValueColumnDocInfoPx": "225",
  "valueColumnAfterUserEditCustomer": "400",
  "valueColumnAfterUserEditDocInfo": "400",
  "afterResetValueColumnCustomerPx": "225",
  "afterResetValueColumnDocInfoPx": "225",
  "pdfPath": "C:\\hisab\\storage\\app\\agent-output\\workspace-v2-info-value-width-225-20260426-1749\\after-pdf-export-info-value-225.pdf"
}
```

- Exit code: 0
- Blockers: none
