# Template Studio (Workspace V2) — Totals + QR validation

## Active surface (TASK 1)

| Item | Value |
|------|--------|
| **Route** | `http://localhost:3000/workspace-v2/user/templates/studio` → file `app/workspace-v2/user/templates/studio/page.tsx` |
| **Component** | `components/workspace-v2/WorkspaceV2TemplateStudio.tsx` |
| **QR controls** | Right inspector: block **QR card (preview)** under **QR / stamp / signature** (`#wsv2-qr-card-w`, `#wsv2-qr-img`, `#wsv2-qr-align`, …). |
| **Totals visibility** | Right inspector: **Totals** toggles + **Totals card (preview)** (`.wsv2-totals-card-props`). |
| **Preview** | `WorkspaceV2DocumentRenderer` reads `ui` from Template Studio state; layout metrics come from `buildDocumentLayout()` in `lib/workspace-v2/document-template-renderer.ts` (totals section `widthPx` from `totalsBlock.cardWidthPx`). Totals rows render as 3 columns in `TotalsSection` using `totalsBlock` column widths. |

Legacy `DocumentTemplatesRegister` / `lib/workspace-preview.ts` were **not** changed in this pass.

## Setting key mapping (TASK 2 / persistence)

Workspace V2 stores UI in `localStorage` key `hisabix.wsv2.templateUi.v1` as JSON. Nested shape:

| Spec / report key | JSON path |
|-------------------|-----------|
| `qr_image_size_px` | `qrBlock.imageSizePx` |
| `qr_card_width_px` | `qrBlock.cardWidthPx` |
| `qr_align` | `qrBlock.align` (`"left"` \| `"center"` \| `"right"`) |
| `totals_card_width_px` | `totalsBlock.cardWidthPx` |
| `totals_card_min_height_px` | `totalsBlock.cardMinHeightPx` (`0` = inherit schema min height) |
| `totals_card_fixed_height_px` | `totalsBlock.cardHeightPx` (optional) |
| `totals_card_padding_px` | `totalsBlock.cardPaddingPx` |
| `totals_row_gap_px` | `totalsBlock.rowGapPx` |
| `totals_desc_col_width_px` | `totalsBlock.totals_desc_col_width_px` |
| `totals_currency_col_width_px` | `totalsBlock.totals_currency_col_width_px` |
| `totals_amount_col_width_px` | `totalsBlock.totals_amount_col_width_px` |

## Automated checks (Playwright)

Run after `npm run dev` on port 3000:

```bash
set OUT_DIR=c:\hisab\storage\app\agent-output\template-studio-active-totals-qr-fix-20260426-1257
node c:\hisab\tools\capture-template-studio-screens.mjs
```

Observed console output (defaults after clearing `hisabix.wsv2.templateUi.v1`):

- `qrW`: **150**, `qrImg`: **125**, `qrAlign`: **left**, `totalsCardW`: **430**
- Live preview: totals section `getBoundingClientRect().width` **430** vs **260** after inspector edits (`totalsPreviewWidth430` / `totalsPreviewWidth260`).

## Validation checklist vs mission

1. QR card width default **150** — inspector + storage defaults (`DEFAULT_QR_BLOCK`).
2. QR image size default **125** — inspector + `QrSection` / PDF `drawQrBlock`.
3. QR alignment default **Left** — inspector + `QrSection` flex alignment + PDF caption/image alignment.
4. Totals card width control visible — screenshot `after-totals-card-controls-visible.png`.
5. Totals card width default **430** — inspector + `buildDocumentLayout` section width.
6. Totals internal column width controls visible — same screenshot + IDs `wsv2-totals-col-desc`, `wsv2-totals-col-cur`, `wsv2-totals-col-amt`.
7. Changing totals width updates live preview — measured **430px** vs **260px** on `[data-section="totals"]`.
8. Changing amount column width updates preview — screenshot `after-totals-column-width-changed.png` (amount column set to **200** px).
9. Active sidebar is Workspace V2 Template Studio — `before-active-sidebar.png` / route above.

## Screenshot absolute paths

- `c:\hisab\storage\app\agent-output\template-studio-active-totals-qr-fix-20260426-1257\before-active-sidebar.png`
- `c:\hisab\storage\app\agent-output\template-studio-active-totals-qr-fix-20260426-1257\after-qr-defaults-150-125-left.png`
- `c:\hisab\storage\app\agent-output\template-studio-active-totals-qr-fix-20260426-1257\after-totals-card-controls-visible.png`
- `c:\hisab\storage\app\agent-output\template-studio-active-totals-qr-fix-20260426-1257\after-totals-width-430-preview.png`
- `c:\hisab\storage\app\agent-output\template-studio-active-totals-qr-fix-20260426-1257\after-totals-column-width-changed.png`

## Layout / PDF notes

- Browser totals rows: description (EN+AR when bilingual) | currency glyph | amount (`white-space: nowrap`, tabular numerals, column gap **10** px).
- PDF `drawTotalsBlock` uses the same three columns; Riyal glyph column uses `arFont` when the symbol is `TOTALS_RIYAL_GLYPH`.
- PDF `drawQrBlock` respects `qrBlock` size, alignment, and `showCaptions`.
