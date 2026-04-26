# Template Studio visibility diagnosis

## STEP 1 — Active render path (legacy workspace)

| Area | File | Component / function | Notes |
|------|------|----------------------|--------|
| Right sidebar inspector | `components/workspace/DocumentTemplatesRegister.tsx` | `DocumentTemplatesRegister` | Used by routes under `app/workspace/settings/templates/page.tsx`, `app/workspace/user/*-templates/page.tsx`. |
| Live preview HTML (signed-in) | `lib/workspace-preview.ts` | `renderWorkspaceDocumentHtml` → `buildDocumentHtml` | Called from `app/api/workspace/[...slug]/route.ts` → `renderAuthenticatedTemplatePreview` (POST `templates/preview`). |
| Settings written | Same register | `updateDraftSettings` / `handleSave` → `updateDocumentTemplate` | `draft.settings` passed to `previewDocumentTemplate` in `useEffect`. |

**Alternate path:** Workspace V2 Template Studio is `components/workspace-v2/WorkspaceV2TemplateStudio.tsx` (`app/workspace-v2/user/templates/studio/page.tsx`). It does **not** use `DocumentTemplatesRegister` or `buildDocumentHtml`. Users opening **V2 → templates/studio** will see none of the legacy inspector changes.

## STEP 2 — Key matrix (before this patch)

| KEY | Written by UI | Read by preview (`buildDocumentHtml`) | Persisted on Save | Visible in live UI |
|-----|---------------|----------------------------------------|-------------------|-------------------|
| `qr_card_width_px` | NO | NO | — | NO |
| `totals_card_width_px` | NO (until this fix) | NO (until this fix) | — | NO |
| `english_font_color` | NO | NO | — | NO |
| `arabic_font_color` | NO | NO | — | NO |
| `stamp_asset_id` | YES (`handleAssetUpload`, select) | YES (`resolveTemplateAssets`) | YES | YES (lower inspector; easy to miss scroll) |
| `signature_asset_id` | YES | YES | YES | YES |
| `signatory_name` | YES | YES | YES | YES |
| `signatory_position` | YES | YES | YES | YES |
| `text_color_en` / `text_color_ar` | YES | YES | YES | YES (labeled “English text” / “Arabic text”, not “font color”) |
| `totals_card_width_pct` | YES | YES | YES | YES but label **“Totals width %”**, not “Totals Card Width”; buried under many sections |

**Root cause of “prompts implemented but UI unchanged”:**

1. **Wrong product surface:** Work may have targeted legacy `DocumentTemplatesRegister` while users use **Workspace V2** studio (different component tree).
2. **Key / label mismatch:** Spec called for `totals_card_width_px` and “Totals Card Width”; codebase only exposed **`totals_card_width_pct`** (“Totals width %”) deep in the inspector.
3. **QR / font keys:** `qr_card_width_px`, `english_font_color`, `arabic_font_color` were never wired in UI + preview together under those names.

## STEP 3–5 — Screenshots

`before-live-ui.png`, `after-totals-width-control-visible.png`, and `after-totals-width-changed-preview.png` were **not** captured in this run (no automated browser session against a running dev server). **STATUS must be FAIL** until those files exist.

## STEP 4 — Single fix applied (this run)

- Added **Totals Card Width** block at **top of inspector** (after Template name): label, numeric input, − / +, range 280–720, setting key **`totals_card_width_px`** (default 540 in preview).
- **`buildDocumentHtml`** applies `max-width: min(100%, …)` from `totals_card_width_px` (and optional legacy `totals_card_max_width_px` cap).
- Removed redundant **“Totals width %”** control from the lower grid to avoid conflicting width models.
