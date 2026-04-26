# Document Engine Rebuild Plan

## Scope

This plan covers the current document/template surface used by the Next.js workspace and the Laravel backend. The rebuild target is a schema-driven, deterministic document engine with:

- canonical section schema
- shared data binding
- one preview/PDF rendering path
- ZATCA-ready QR/XML/compliance hooks
- one editor surface for Standard / Compact / Modern templates

## Keep

- `app/api/workspace/[...slug]/route.ts`
  Active workspace gateway for authenticated preview, PDF generation, templates, and backend proxying.

- `lib/document-platform/schema.ts`
  Current canonical settings/types anchor for document template families and default schema settings.

- `lib/zatca-engine.ts`
  Existing compliance/state/XML/QR foundation that should become the compliance layer behind the renderer.

- `lib/zatca-engine.test.ts`
  Existing focused coverage for ZATCA submission scaffolding and XML validation.

- `backend/app/Services/TemplateEngineRuntimeService.php`
  Runtime ownership of template persistence, default selection, and company template inventory.

- `backend/app/Http/Controllers/Api/DocumentTemplateController.php`
  Backend CRUD boundary for document templates; keep the endpoint shape while swapping renderer internals.

- `data/document-template-adapter.ts`
  Thin grouping utility for the template register; safe to keep as a presentation adapter.

## Rewrite

- `lib/workspace-preview.ts`
  Current active renderer, preview data store, asset resolver, QR builder, and document HTML generator are all mixed into one file and must be split into schema, binding, rendering, and preview-store layers.

- `components/workspace/DocumentTemplatesRegister.tsx`
  Active template editor already supports full-screen mode, section ordering, asset upload, and live preview, but it still needs a cleaner schema-driven editor model and more isolated WYSIWYG controls.

- `lib/document-engine/index.tsx`
  Keep only the PDF shell helper; move old render-model and HTML rendering responsibilities into the new document-platform renderer modules.

- `backend/app/Services/DocumentTemplateRendererService.php`
  Backend still contains a second canonical HTML builder; replace with a single schema-aware render flow or reduce to a compatibility wrapper.

- `components/workspace/UserWorkspaceHome.tsx`
  Workspace landing reads are now stable, but fetch orchestration should stay abort-aware and route-safe while the document engine rebuild changes route timing.

## Delete

- `lib/document-engine/contracts/taxInvoiceAhnContract.ts`
  Legacy contract family not used by the active workspace render path.

- `lib/document-engine/mappers/mapInvoiceToAhnTemplate.ts`
  Legacy mapper for the orphaned Ahn renderer path.

- `lib/document-engine/templates/TaxInvoiceAhnTemplate.tsx`
  Legacy unused template implementation.

- `lib/document-engine/renderers/renderTaxInvoiceAhn.ts`
  Legacy unused renderer that duplicates active invoice rendering concerns.

## Active Duplication To Remove

- `lib/workspace-preview.ts` and `backend/app/Services/DocumentTemplateRendererService.php` both generate canonical-looking document HTML.
- `lib/document-engine/index.tsx` still exposes a second HTML/render-model path that is no longer the route-backed source of truth.
- The `Ahn` contract/template/render trio is a dead parallel invoice family.
- Preview seed/template naming and backend runtime naming drifted until normalization was added; the rebuild must make schema family identity the only source of truth.

## Rebuild Order

1. Extract a `template schema` module with canonical sections:
   `header`, `seller_info`, `invoice_meta`, `buyer_info`, `items_table`, `totals`, `footer`.

2. Extract a `binding layer` that maps workspace/backend documents into one normalized render payload with:
   bilingual fields, VAT metadata, QR payload inputs, XML inputs, submission/editability flags.

3. Extract a `render layer` that converts schema + payload into:
   workspace preview HTML and printable HTML/PDF with identical layout rules.

4. Repoint `DocumentTemplatesRegister` to edit the extracted schema instead of mutating a large settings bag directly.

5. Collapse backend/Next preview rendering to one source of truth and remove the orphaned Ahn/legacy invoice renderers.

## Known Gaps Still Blocking Full Completion

- `lib/workspace-preview.ts` is still monolithic and mixes preview storage with rendering.
- The editor is full-screen and live, but not yet a fully isolated schema-first WYSIWYG system.
- The backend still ships a duplicate HTML renderer service.
- The current schema list in `lib/document-platform/schema.ts` still reflects older block names (`title`, `document-info`, `customer`, `notes`) rather than the requested final canonical names.
