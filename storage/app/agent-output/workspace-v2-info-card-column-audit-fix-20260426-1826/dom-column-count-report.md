# DOM / grid audit — Workspace V2 info cards

## Summary table

| Card | File | Component / class | Child cells per row | Grid tracks (computed) | Right-gap cause (pre-fix) |
|---|---|---:|---|---|---|
| Client | `WorkspaceV2DocumentRenderer.tsx` → `InfoTable` | `.wsv2-info-row-3col` + `.wsv2-info-cell-*` | **3** (en / value / ar) | See JSON below | Fixed `Npx Npx Npx` tracks narrower than row `width:100%` → empty area right of AR cell |
| Document | (shared `InfoTable`) | same | **3** | same | same |

## Live sample (first row, after fix)

```json
{
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
```

- Expected: `childCount` === 3, `gridTemplateColumns` includes `minmax(` and `1fr` (value track grows).
