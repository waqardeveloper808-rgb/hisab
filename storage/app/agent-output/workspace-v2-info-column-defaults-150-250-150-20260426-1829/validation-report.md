# Validation — Workspace V2 info cards column defaults (150 / 250 / 150)

- URL: http://localhost:3000/workspace-v2/user/templates/studio?template=tmpl-standard
- localStorage key: `hisabix.wsv2.templateUi.v1` — removed to verify clean default
- **DEFAULT_INFO_CARD_LAYOUT:** `englishColumnWidthPx` **150**, `valueColumnWidthPx` **250**, `arabicColumnWidthPx` **150** (shared Client + Document info).
- **Reset studio defaults** restores all three after edits.
- **Screens:** `before-info-column-defaults.png`, `after-info-column-defaults-150-250-150.png`, canvas previews for customer + docInfo.

## Telemetry

```json
{
  "cleanLocalStorageCustomer": {
    "en": "150",
    "val": "250",
    "ar": "150"
  },
  "cleanLocalStorageDocInfo": {
    "en": "150",
    "val": "250",
    "ar": "150"
  },
  "afterResetCustomer": {
    "en": "150",
    "val": "250",
    "ar": "150"
  },
  "afterResetDocInfo": {
    "en": "150",
    "val": "250",
    "ar": "150"
  }
}
```

- Exit code: 0
- Blockers: none
