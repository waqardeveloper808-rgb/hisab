# Validation — Workspace V2 info cards row density (compact spacing)

- URL: http://localhost:3000/workspace-v2/user/templates/studio?template=tmpl-standard
- Inspector: Card padding / Row padding Y / Row gap set to **0**; card min height **0** (auto).
- Preview: client + document info cards should show tight row spacing (no schema min-height shell or extra section padding).
- Screens: `before-info-row-large-gaps.png` (defaults), `after-row-gap-0-padding-0-compact.png`, `after-client-info-compact.png`, `after-document-info-compact.png`.

## Telemetry

```json
{
  "customerSectionHeightBefore": 244,
  "inspectorCardPaddingPx": "0",
  "inspectorRowPaddingYPx": "0",
  "inspectorRowGapPx": "0",
  "customerSectionHeightCompact": 102,
  "documentSectionHeightCompact": 88
}
```

- Exit code: 0
- Blockers: none
