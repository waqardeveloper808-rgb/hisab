# Template Rebuild Summary

## Completed

- Rebuilt the live backend invoice renderer in `backend/app/Services/DocumentTemplateRendererService.php` around a stricter bilingual Saudi invoice structure.
- Updated the live export path so all three families now render:
  - left English seller block
  - centered logo block
  - right Arabic seller block with VAT and CR
  - bilingual invoice meta grid
  - structured bilingual customer block with Saudi address fields
  - item table with required taxable amount column
  - dominant right-aligned totals card
- Updated `tools/inspector/document-parity-capture.ts` so proof output can be isolated into a dedicated report folder.

## Validation

- Frontend build passed: `npm run build`
- Backend tests passed: `php artisan test`
- Fresh capture report generated:
  - `qa_reports/template_rebuild_20260418/document-parity-matrix.json`

## Generated Proof

Available live invoice proof cases in this workspace/app data:

- `INV-2026-1101OverdueAl`
  - Classic Corporate preview/PDF
  - Modern Carded preview/PDF
  - Industrial / Supply Chain preview/PDF
- `INV-2026-1102PaidDesert`
  - Classic Corporate preview/PDF
  - Modern Carded preview/PDF
  - Industrial / Supply Chain preview/PDF

Artifact examples:

- `qa_reports/template_rebuild_20260418/inv-2026-1101overdueal-classic-corporate-preview.png`
- `qa_reports/template_rebuild_20260418/inv-2026-1101overdueal-classic-corporate.pdf`
- `qa_reports/template_rebuild_20260418/inv-2026-1102paiddesert-industrial-supply-chain-preview.png`
- `qa_reports/template_rebuild_20260418/inv-2026-1102paiddesert-industrial-supply-chain.pdf`

## Explicit Blocker

The requested source documents `INV-AHN-25-151`, `INV-AHN-25-162`, and `Huawei Invoice` were searched for in the current repository and active app data but were not found. The rebuild and proof were therefore executed against the live invoices available in the seeded workspace (`1101`, `1102`).
