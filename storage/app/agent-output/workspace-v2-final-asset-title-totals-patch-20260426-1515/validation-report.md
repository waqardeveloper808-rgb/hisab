# Validation — Workspace V2 final asset / title / totals patch

- URL: http://localhost:3000/workspace-v2/user/templates/studio?template=tmpl-standard
- Cleared \`hisabix.wsv2.templateUi.v1\` then reloaded.
- **Clean-load defaults (JSON):**

```json
{
  "header": {
    "columnWidthMode": "equal",
    "logoWidthPx": "125",
    "logoHeightPx": "125"
  },
  "stampSignatureImagePx": {
    "stampW": "90",
    "stampH": "90",
    "signatureW": "90",
    "signatureH": "150"
  }
}
```

- Expected: header logo **125×125**; stamp **90×90**; signature **90×150**; totals amount column **100**.
- Title: English follows typography color (not legacy green unless set).
- Artifacts: `before-current-preview.png`, `after-logo-125x125.png`, stamp/signature shots, title colors, totals control, full preview, `after-pdf-export.pdf`.
- Exit code: 0
- Blockers: none
