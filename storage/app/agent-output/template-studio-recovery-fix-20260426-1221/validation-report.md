# Template Studio recovery — validation report

## Status

Automated validation: code paths wired; browser screenshots and PDF bytes were **not** captured in this agent run.

## Numeric / amount coloring (preview)

The workspace HTML builder does **not** expose a separate “amount only” color. Numeric cells in the items table use `colorEn` for Latin numerals; the grand total row uses the template **accent** for emphasis. Document this as the supported behavior until a dedicated `amount_text_color` (or similar) is added.

## English / Arabic text colors

Settings: `text_color_en`, `text_color_ar`. Empty or whitespace values fall back to the layout theme `text` color so documents do not render with invalid CSS.

## Preview document fixture

Guest/authenticated template preview document in `lib/workspace-preview.ts` uses million-scale totals and a single line with `gross_amount` 1,000,000 and metadata `unit` / `vat_rate` for column testing.

## PHP parity (partial)

`DocumentTemplateRendererService` now:

- Merges `item_table_columns` with defaults including `unit` and `vat_rate`, renormalizes visible column widths to 100%.
- Renders `unit` and `vat_rate` cells.
- Uses million-scale amounts in `renderTemplatePreview` sample line.

Larger layout parity (totals+QR flex, three-column totals rows, bilingual customer/document rows, `text_color_en` / `text_color_ar`, signatory stack in footer) is **not** fully duplicated in PHP in this change set; server HTML may still differ from the Node `buildDocumentHtml` output until those sections are ported.

## Screenshots

The following files are **required** for a PASS claim per the mission brief; they are placeholders until captured from a running app:

- before-template-studio.png
- after-vat-column-hidden.png
- after-vat-column-visible.png
- after-compact-sidebar.png
- after-language-colors.png
- after-customer-document-density.png
- after-qr-left-card.png
- after-totals-controls.png
- after-assets-upload-controls.png
- after-signature-modal.png
- after-signature-card.png
- after-pdf-export.pdf (if export route available)
