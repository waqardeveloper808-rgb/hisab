# Validation — Workspace V2 info cards: exactly 3 grid columns

- URL: http://localhost:3000/workspace-v2/user/templates/studio?template=tmpl-standard
- Rows: **3** DOM children per `.wsv2-info-row-3col` (English | Value | Arabic).
- Grid: `minmax(valueMinPx, 1fr)` middle track fills card width — no slack “fourth” strip.
- PDF: value column width recomputed to `tableW - enW - arW - 2*gap`.

## Artifacts

- `before-info-card-four-column-looking-layout.png` — injected fixed `125px 225px 125px` (pre-fix look).
- `after-client-info-exact-3-columns.png`
- `after-document-info-exact-3-columns.png`
- `after-arabic-right-align-near-border.png`
- `after-column-width-125-225-125.png`
- `after-full-preview-no-overflow.png`
- `dom-column-count-report.md`

## Telemetry

```json
{
  "domAudit": {
    "customer": {
      "childCount": 3,
      "childClasses": [
        "wsv2-info-cell-en wsv2-wf-info-label-en",
        "wsv2-info-cell-value wsv2-wf-info-value",
        "wsv2-info-cell-ar wsv2-wf-info-label-ar wsv2-wf-type-ar"
      ],
      "gridTemplateColumns": "125px 276.438px 125px",
      "columnGap": "8px",
      "rowWidthPx": 542.4375
    },
    "docInfo": {
      "childCount": 3,
      "childClasses": [
        "wsv2-info-cell-en wsv2-wf-info-label-en",
        "wsv2-info-cell-value wsv2-wf-info-value",
        "wsv2-info-cell-ar wsv2-wf-info-label-ar wsv2-wf-type-ar"
      ],
      "gridTemplateColumns": "125px 276.438px 125px",
      "columnGap": "8px",
      "rowWidthPx": 542.4375
    }
  }
}
```

- Exit code: 2
- Blockers: see blockers.md
