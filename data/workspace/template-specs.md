# Document template specifications — Standard · Modern · Compact

**Scope:** Wafeq Format 2 schema-driven document canvas (`WorkspaceDocumentRenderer` + `app/workspace/workspace.css`, `[data-wsv2] .wsv2-doc-paper-inner[data-style="…"]`).  
**Not in scope:** Template Studio chrome, workspace sidebar, System Monitor.

**Industry references (layout intent, not pixel copies):**

| Product | Standard-like | Modern-like | Compact-like |
|---------|---------------|--------------|----------------|
| **Wafeq** | Clear VAT blocks, dense tables, formal header | — | Long registers, tight rows |
| **Zoho Books** | Tabular invoice, balanced whitespace | Card-style summary panels on some themes | Statement-style dense lines |
| **QuickBooks** | Classic invoice: bold totals, clear columns | Cleaner sans hierarchy | Multi-line fit on one page |

**Readability:** minimum 9–10px effective body on compact; 11–12px standard; modern prioritizes scan path (title → totals → table).

---

## Shared invariants (all styles)

- A4 portrait canvas (794×1123 CSS px), same schema sections and column contract.
- Arabic / bilingual rules from document renderer (unchanged by style switch).
- One active `data-style` at a time: `standard` | `modern` | `compact`.

---

## Template 1 — Standard

**Positioning:** Classic accounting / compliance-friendly layout (closest to formal ZATCA-style clarity).

| Dimension | Rule |
|-----------|------|
| **Section rhythm** | Vertical stack; `gap` between sections **12px**; predictable scan order. |
| **Section shell** | `padding` **12px 14px**; `border-radius` **6px**; light border `#E7ECEF`. |
| **Header** | Three-column grid **1fr / 164px / 1fr**; top accent **3px** brand green; traditional seller | logo | Arabic. |
| **Title** | EN **25px** bold (per document tokens); AR **21px** bold. |
| **Body / table** | Body **12px** line **16px**; item table **11.5px** cells; header row **10.5px**. |
| **Table density** | **Normal** — `padding` 7×6px cells; readable line breaks. |
| **Totals / QR** | Default card padding; split row gap **12px**. |

**When to use:** Tax invoices, formal quotations, audit-facing PDFs.

---

## Template 2 — Modern

**Positioning:** SaaS / tech invoice — more air, softer containment, stronger hierarchy (inspired by Zoho/QB “clean” themes).

| Dimension | Rule |
|-----------|------|
| **Section rhythm** | **Larger** vertical gap **18px** between sections. |
| **Section shell** | **More padding** **16px 18px**; **larger radius** **10px**; subtle **box-shadow** (card lift). |
| **Header** | Wider grid gap **20px**; **4px** top accent; slightly roomier inner padding. |
| **Title** | EN **27px**; stronger separation from body. |
| **Body / table** | Slightly larger touch targets on headers; optional softer table header tint (keep contrast). |
| **Table density** | **Comfort** — same or slightly **more** cell padding than standard for tap/read targets. |
| **Visual weight** | Sections read as **cards** on white canvas, not flat boxes only. |

**When to use:** Customer-facing PDFs, proposals, brand-forward documents.

---

## Template 3 — Compact

**Positioning:** Bulk printing / long line lists (statement density; Wafeq-style register feel).

| Dimension | Rule |
|-----------|------|
| **Section rhythm** | **Tight** `gap` **6px** between sections. |
| **Section shell** | **Reduced padding** **8px 10px**; **smaller radius** **4px**. |
| **Header** | Tighter grid **1fr / 140px / 1fr**; **10px** column gap; less vertical padding. |
| **Title** | EN **22px**; AR **18px** — reclaim vertical space. |
| **Body / table** | Canvas body **11px**; item cells **10px**; section labels **9px** where applicable. |
| **Table density** | **High** — cell padding **5px 6px**; minimal row height. |
| **Totals / QR** | Tighter inner spacing so more lines fit above the fold. |

**When to use:** Long item lists, internal printouts, draft runs.

---

## Differences matrix (must all differ)

| Attribute | Standard | Modern | Compact |
|-----------|----------|--------|---------|
| Section `gap` (stack) | 12px | 18px | 6px |
| Section padding | 12×14 | 16×18 | 8×10 |
| Section radius | 6px | 10px | 4px |
| Section shadow | none | light | none |
| Header top accent | 3px | 4px | 3px (narrow band) |
| Header grid gap | 16px | 20px | 10px |
| Title EN size | 25px | 27px | 22px |
| Title AR size | 21px | (inherit modern bump) | 18px |
| Table cell font | ~11.5px | ~11.5–12px | 10px |
| Table cell padding | normal | comfort | minimal |

---

## Audit loop (implementation vs spec)

1. Compare each row in the matrix to `workspace.css` selectors under `[data-wsv2] .wsv2-doc-paper-inner[data-style="…"]`.
2. In Template Studio, switch **Select Template Style** and confirm `data-style` on `.wsv2-doc-paper-inner` updates.
3. If any matrix cell diverges, adjust CSS (or documented exception) and re-audit.
4. **Pass:** all three styles visibly distinct (density + whitespace + title weight); no duplicate layout with only color change.

---

## Files

| Role | Path |
|------|------|
| Spec (this file) | `data/workspace/template-specs.md` |
| Style tokens (code) | `lib/template-engine/layout-style-contract.ts` |
| Renderer | `components/workspace/WorkspaceDocumentRenderer.tsx` (`data-style`) |
| Studio control | `components/workspace/WorkspaceTemplateStudio.tsx` |
| CSS | `app/workspace/workspace.css` |
