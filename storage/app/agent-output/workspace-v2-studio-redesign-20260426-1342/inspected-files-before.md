# Phase 0 — inspected surface (before code changes)

## Layout / data flow

| Concern | File | Location |
|--------|------|----------|
| Customer rows built | `lib/workspace-v2/document-template-renderer.ts` | `buildDocumentLayout` → `filterRows(schema.customerRows, customerValue, …)` |
| Document info rows built | same | `filterRows(schema.documentInfoRows, metaValue, …)` |
| Info layout merged | same | `infoLayout = { ...DEFAULT_INFO_CARD_LAYOUT, ...ui?.infoCardLayout }` on `LayoutPlan` |
| Totals rows built | same | `totalsRows` from `schema.totalsFields` + `totalsRowContent` |
| Info rows rendered | `components/workspace-v2/WorkspaceV2DocumentRenderer.tsx` | `InfoTable` → `CustomerSection` / `DocInfoSection` |
| Totals rendered | same | `TotalsSection` with CSS grid `gridTemplateColumns` from `totalsBlock` |
| Right inspector | `components/workspace-v2/WorkspaceV2TemplateStudio.tsx` | `<aside className="wsv2-studio-right">` |
| Document type | same | React `docType` + subtop `DOC_TYPE_PILLS` |
| Active section | same | `activeSection` + left sidebar `focusSection` |
| localStorage merge | `lib/workspace-v2/template-ui-settings.ts` | `readTemplateUiFromStorage` → `mergeTemplateUi(defaultTemplateUi(), migrateTemplateUiPayload(parsed))` |

## Root cause — broken 3-column info cards

`InfoTable` renders three sibling `<div>` cells per row but **no parent row uses `display: grid` or `flex`**. There is **no CSS** for `.wsv2-wf-info-grid-row` in `v2.css`, so rows default to block flow and the three cells stack vertically (Arabic appears under English). Values only had inline `textAlign: center`, which does not create columns.

## Planned correction

- Add explicit **3-column CSS grid** on each row using `infoCardLayout` column widths (px), scaled to section inner width.
- Extend `infoCardLayout` + `totalsBlock` in settings; migrate old localStorage.
- Reorganize right inspector: document type + section dropdowns, global typography always on, section-scoped controls only.
- PDF: use same px columns and alignments; grand total uses English color in PDF.
