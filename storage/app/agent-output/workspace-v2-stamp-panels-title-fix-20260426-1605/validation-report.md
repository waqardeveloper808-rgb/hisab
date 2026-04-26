# Validation — stamp/panels/title

- URL: http://localhost:3000/workspace-v2/user/templates/studio?template=tmpl-standard
- **localStorage key:** \`hisabix.wsv2.templateUi.v1\` (`studioLayout.leftPanelWidthPx`, `studioLayout.rightPanelWidthPx`)
- **Stamp defaults:** 150×90 stamp + 150×90 signature (inspector inputs).
- **Title colors:** English/Arabic document title use typography colors (see canvas screenshots).
- **Layout telemetry (JSON):**

```json
{
  "layoutBefore": {
    "leftPanelWidthPx": 220,
    "rightPanelWidthPx": 320
  },
  "stampDefaults": {
    "code": 0,
    "stW": "150",
    "stH": "90",
    "sigW": "150",
    "sigH": "90"
  },
  "layoutAfterDrag": {
    "leftPanelWidthPx": 275,
    "rightPanelWidthPx": 370
  },
  "layoutAfterReload": {
    "leftPanelWidthPx": 275,
    "rightPanelWidthPx": 370
  }
}
```

- **PDF:** `C:\hisab\storage\app\agent-output\workspace-v2-stamp-panels-title-fix-20260426-1605\after-pdf-export.pdf`
- Exit: 0
- Blockers: none
