"use client";

// Workspace — Template Studio (schema-driven).
//
// All layout, sections, columns, totals, footer fields and QR applicability
// are derived from `DocumentTemplateSchema`. The canvas is rendered by the
// shared <WorkspaceDocumentRenderer/> so that what you see here matches
// the document preview drawer and the PDF export EXACTLY.

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  EyeOff,
  FileCode,
  Layers3,
  LogOut,
  Maximize2,
  Minus,
  MoreHorizontal,
  Plus,
  Save,
  Settings2,
  Sparkles,
  Type,
} from "lucide-react";
import { previewCompany } from "@/data/preview-company";
import { templates } from "@/data/workspace/templates";
import { invoices } from "@/data/workspace/invoices";
import { findCustomer } from "@/data/workspace/customers";
import { USER_WORKSPACE_BASE } from "@/lib/workspace/navigation";
import { buildPhase1Qr } from "@/lib/workspace/exports/qr";
import { buildInvoiceUbl } from "@/lib/workspace/exports/xml";
import { downloadXml } from "@/lib/workspace/exports/download";
import { TEMPLATE_STYLE_OPTIONS } from "@/lib/template-engine";
import {
  COLUMN_LABELS,
  DOCUMENT_TEMPLATE_SCHEMAS,
  FIELD_LABELS,
  PAGE_GEOMETRY,
  SECTION_LABELS,
  REAL_STYLE_VARIANTS_BY_DOC_TYPE,
  documentMetaFields,
  itemColumnKeys,
  optionalCustomerFields,
  type ColumnKey,
  type FieldKey,
  type LangMode,
  type SchemaDocType,
  type SectionKey,
  type TemplateStyle,
} from "@/lib/workspace/document-template-schemas";
import { buildDocumentLayout } from "@/lib/workspace/document-template-renderer";
import {
  fitItemColumnWidthsToTarget,
  fitWidthsWithLockedColumn,
  getItemsTableInnerTargetPx,
  itemColumnHardMinPx,
  itemColumnMinPx,
  sanitizeItemColumnWidthRecord,
  widthsArrayToRecord,
} from "@/lib/workspace/item-column-resize";
import {
  DEFAULT_HEADER_BLOCK,
  DEFAULT_INFO_CARD_LAYOUT,
  DEFAULT_ITEM_HEADER_LABELS,
  DEFAULT_QR_BLOCK,
  DEFAULT_STAMP_SIGNATURE_BLOCK,
  DEFAULT_STUDIO_LAYOUT,
  DEFAULT_TOTALS_BLOCK,
  SCHEMA_TO_SLUG,
  SLUG_TO_SCHEMA,
  defaultTemplateUi,
  modernTemplatePresetUi,
  compactTemplatePresetUi,
  mergeTemplateUi,
  migrateTemplateUiPayload,
  readTemplateUiFromStorage,
  writeTemplateUiToStorage,
  readTemplateAssetsFromStorage,
  writeTemplateAsset,
  clearTemplateUiStorage,
  type InfoCardLayoutSettings,
  type InfoTextAlign,
  type QrBlockSettings,
  type StudioDocumentTypeSlug,
  type TemplateAssetState,
  type TemplateUiSettings,
  type TotalsColAlign,
} from "@/lib/workspace/template-ui-settings";
import {
  WSV2_TEMPLATE_AR_FONT_STACK,
  WSV2_TEMPLATE_LATIN_FONT_STACK,
} from "@/lib/workspace/template-font-stacks";
import {
  WorkspaceDocumentRenderer,
  makeRendererCustomer,
  makeRendererSeller,
} from "./WorkspaceDocumentRenderer";

const ZOOM_STEPS = [0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5];

/** Stable id slug per column for heading editor (`wsv2-item-col-{slug}-label-en`). */
const ITEM_COL_HEADING_SLUG: Partial<Record<ColumnKey, string>> = {
  index: "number",
  description: "description",
  quantity: "qty",
  unit: "unit",
  price: "rate",
  taxableAmount: "taxable",
  vatRate: "vat-rate",
  vatAmount: "vat",
  lineTotal: "total",
  deliveredQuantity: "delivered-qty",
  pendingQuantity: "pending-qty",
  remarks: "remarks",
  discount: "discount",
};

function itemColHeadingInputId(col: ColumnKey, lang: "en" | "ar"): string {
  const slug = ITEM_COL_HEADING_SLUG[col] ?? String(col).replace(/([A-Z])/g, "-$1").toLowerCase();
  return `wsv2-item-col-${slug}-label-${lang}`;
}

function InspectorGroup({
  title,
  children,
  defaultOpen = false,
  dataTestId,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  dataTestId?: string;
}) {
  return (
    <details
      className="rounded-2xl border border-slate-200 bg-white p-3"
      open={defaultOpen}
      data-testid={dataTestId}
    >
      <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

function ControlRow({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

// Map a TemplateRecord.documentType to the schema's SchemaDocType.
const TEMPLATE_TO_SCHEMA: Record<string, SchemaDocType> = {
  invoice: "tax_invoice",
  simplified_invoice: "simplified_tax_invoice",
  quotation: "quotation",
  proforma: "proforma_invoice",
  credit_note: "credit_note",
  debit_note: "debit_note",
  delivery_note: "delivery_note",
  purchase_order: "purchase_order",
};

const DOC_TYPE_PILLS: { id: SchemaDocType; label: string; ar: string }[] = [
  { id: "tax_invoice", label: "Tax Invoice", ar: "فاتورة ضريبية" },
  { id: "simplified_tax_invoice", label: "Simplified Tax", ar: "ضريبية مبسطة" },
  { id: "quotation", label: "Quotation", ar: "عرض سعر" },
  { id: "proforma_invoice", label: "Proforma", ar: "فاتورة أولية" },
  { id: "credit_note", label: "Credit Note", ar: "إشعار دائن" },
  { id: "debit_note", label: "Debit Note", ar: "إشعار مدين" },
  { id: "delivery_note", label: "Delivery Note", ar: "إشعار تسليم" },
  { id: "purchase_order", label: "Purchase Order", ar: "أمر شراء" },
];

/** Right-inspector document type dropdown — same order as toolbar select. */
const DOC_TYPE_SELECT_ORDER: StudioDocumentTypeSlug[] = [
  "tax-invoice",
  "simplified-tax",
  "quotation",
  "proforma",
  "credit-note",
  "debit-note",
  "delivery-note",
  "purchase-order",
];

const DOC_TYPE_SELECT_LABEL: Record<StudioDocumentTypeSlug, string> = {
  "tax-invoice": "Tax Invoice",
  "simplified-tax": "Simplified Tax",
  quotation: "Quotation",
  proforma: "Proforma",
  "credit-note": "Credit Note",
  "debit-note": "Debit Note",
  "delivery-note": "Delivery Note",
  "purchase-order": "Purchase Order",
};

const SECTION_INSPECTOR_LABEL: Record<SectionKey, string> = {
  header: "Header",
  title: "Document title",
  customer: "Client company information",
  docInfo: "Document information",
  items: "Products / services",
  totals: "Totals",
  qr: "QR code",
  stampSignature: "Stamp and signature",
  footer: "Footer",
};

const EN_FONT_PRESETS: { label: string; value: string }[] = [
  {
    label: "UI / Inter (default)",
    value: WSV2_TEMPLATE_LATIN_FONT_STACK,
  },
  {
    label: "System UI",
    value: "system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
  },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
];

const AR_FONT_PRESETS: { label: string; value: string }[] = [
  {
    label: "Noto Sans + IBM Plex (default, UI match)",
    value: WSV2_TEMPLATE_AR_FONT_STACK,
  },
  {
    label: "Tahoma",
    value: "Tahoma, Tahoma, 'Segoe UI', sans-serif",
  },
  {
    label: "System Arabic",
    value: "system-ui, 'Segoe UI', Tahoma, sans-serif",
  },
];

type StudioPopoverKind =
  | "header-name-size"
  | "customer-fields"
  | "document-fields"
  | "item-columns"
  | "item-heading";

type StudioPopoverState =
  | null
  | {
      kind: StudioPopoverKind;
      anchor: { x: number; y: number };
      column?: ColumnKey;
    };

function StudioFloatingPopover({
  state,
  onClose,
  children,
}: {
  state: NonNullable<StudioPopoverState>;
  onClose: () => void;
  children: ReactNode;
}) {
  const pos = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const left = Math.max(16, Math.min(state.anchor.x - 160, window.innerWidth - 340));
    const top = Math.max(16, Math.min(state.anchor.y, window.innerHeight - 260));
    return { left, top };
  }, [state.anchor.x, state.anchor.y]);
  if (!pos) return null;
  return (
    <div
      className="wsv2-inline-popover hisab-studio-inline-popover rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
      data-testid={`studio-popover-${state.kind}`}
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        zIndex: 80,
        width: 320,
        maxWidth: "calc(100vw - 32px)",
        boxSizing: "border-box",
      }}
    >
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          className="wsv2-popover-close text-lg leading-none text-slate-500 hover:text-slate-800"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {children}
    </div>
  );
}

function uiPresetForStyle(nextStyle: TemplateStyle): TemplateUiSettings {
  if (nextStyle === "modern") return modernTemplatePresetUi();
  if (nextStyle === "compact") return compactTemplatePresetUi();
  return defaultTemplateUi();
}

function StudioPanelSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";
  return (
    <section
      className="hisab-studio-panel-section"
      data-testid={`studio-panel-section-${slug}`}
    >
      <h3 className="hisab-studio-panel-heading">{title}</h3>
      <div className="hisab-studio-panel-body">{children}</div>
    </section>
  );
}

/** Keep user layout knobs when swapping base presets (toolbar + deep-link URL). */
function mergeTemplateUiPreservingUserLayout(
  preset: TemplateUiSettings,
  prev: TemplateUiSettings,
): TemplateUiSettings {
  return mergeTemplateUi(preset, {
    itemColumnWidthsByTemplateId: prev.itemColumnWidthsByTemplateId,
    studioLayout: prev.studioLayout,
    itemHeaderLabels: prev.itemHeaderLabels,
    hiddenItemColumns: prev.hiddenItemColumns,
    margins: prev.margins,
    headerBlock: prev.headerBlock,
  });
}

function resolveStudioCatalogTemplateId(raw: string | undefined, styleHint?: string | null): string {
  const first = templates[0]!.id;
  if (!raw?.trim()) return first;
  const t = raw.trim();
  if (/^\d+$/.test(t)) {
    const s = (styleHint ?? "standard") as TemplateStyle;
    if (s === "modern") return "tmpl-modern";
    if (s === "compact") return "tmpl-compact";
    return "tmpl-standard";
  }
  return templates.find((x) => x.id === t)?.id ?? first;
}

function studioWidthPersistKey(catalogId: string, rawUrlId: string | undefined): string {
  if (rawUrlId?.trim() && /^\d+$/.test(rawUrlId.trim())) {
    return `backend-${rawUrlId.trim()}`;
  }
  return catalogId;
}

type Props = {
  templateId?: string;
  initialStyle?: TemplateStyle;
  documentTypeParam?: string;
};

type InfoLayoutPatch = Partial<InfoCardLayoutSettings>;

function FieldVisibilitySwitch({
  label,
  checked,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className="wsv2-field-toggle-row" data-disabled={disabled ? "true" : undefined}>
      <span className="wsv2-field-toggle-label">
        <span>{label}</span>
        {hint ? <span className="wsv2-field-toggle-hint">{hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`wsv2-switch ${checked ? "wsv2-switch-on" : "wsv2-switch-off"}`}
        aria-label={`${label}: ${checked ? "visible" : "hidden"}`}
        onClick={onChange}
      >
        <span className="wsv2-switch-knob" aria-hidden />
      </button>
    </div>
  );
}

function InfoCardLayoutControls(props: {
  variant: "client" | "document";
  heading: string;
  note: string;
  colIds: {
    enW: string;
    valW: string;
    arW: string;
    enAlign: string;
    valAlign: string;
    arAlign: string;
  };
  il: InfoCardLayoutSettings;
  setTemplateUi: Dispatch<SetStateAction<ReturnType<typeof defaultTemplateUi>>>;
}) {
  const { variant, heading, note, colIds, il, setTemplateUi } = props;
  const sid =
    variant === "client"
      ? {
          cardW: "wsv2-client-card-width",
          cardMinH: "wsv2-client-card-min-height",
          cardH: "wsv2-client-card-height",
          pad: "wsv2-client-card-padding",
          rowPy: "wsv2-client-row-padding-y",
          rowGap: "wsv2-client-row-gap",
        }
      : {
          cardW: "wsv2-docinfo-card-width",
          cardMinH: "wsv2-docinfo-card-min-height",
          cardH: "wsv2-docinfo-card-height",
          pad: "wsv2-docinfo-card-padding",
          rowPy: "wsv2-docinfo-row-padding-y",
          rowGap: "wsv2-docinfo-row-gap",
        };

  const patch = (p: InfoLayoutPatch) =>
    setTemplateUi((prev) =>
      mergeTemplateUi(prev, {
        infoCardLayout: { ...DEFAULT_INFO_CARD_LAYOUT, ...prev.infoCardLayout, ...p },
      }),
    );

  return (
    <>
      <h5>{heading}</h5>
      <p
        style={{
          fontSize: 10.5,
          color: "var(--wsv2-ink-subtle)",
          margin: "0 0 8px",
          lineHeight: 1.35,
        }}
      >
        {note}
      </p>
      <div className="wsv2-field">
        <label htmlFor={sid.cardW}>Card width (px, 0 = auto)</label>
        <input
          id={sid.cardW}
          type="number"
          min={0}
          max={900}
          step={1}
          value={variant === "client" ? il.clientCardWidthPx : il.documentCardWidthPx}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isFinite(n) || n < 0) return;
            patch(variant === "client" ? { clientCardWidthPx: n } : { documentCardWidthPx: n });
          }}
        />
      </div>
      <div className="wsv2-field">
        <label htmlFor={sid.cardMinH}>Card min height (px, 0 = auto)</label>
        <input
          id={sid.cardMinH}
          type="number"
          min={0}
          max={600}
          step={1}
          value={variant === "client" ? il.clientCardMinHeightPx : il.documentCardMinHeightPx}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isFinite(n) || n < 0) return;
            patch(
              variant === "client" ? { clientCardMinHeightPx: n } : { documentCardMinHeightPx: n },
            );
          }}
        />
      </div>
      <div className="wsv2-field">
        <label htmlFor={sid.cardH}>Card fixed height (px, 0 = auto)</label>
        <input
          id={sid.cardH}
          type="number"
          min={0}
          max={600}
          step={1}
          value={variant === "client" ? il.clientCardHeightPx : il.documentCardHeightPx}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isFinite(n) || n < 0) return;
            patch(variant === "client" ? { clientCardHeightPx: n } : { documentCardHeightPx: n });
          }}
        />
      </div>
      <div className="wsv2-field">
        <label htmlFor={sid.pad}>Card padding (px)</label>
        <input
          id={sid.pad}
          type="number"
          min={0}
          max={40}
          step={1}
          value={il.cardPaddingPx}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isFinite(n) || n < 0) return;
            patch({ cardPaddingPx: n });
          }}
        />
      </div>
      <div className="wsv2-field">
        <label htmlFor={sid.rowPy}>Row padding Y (px)</label>
        <input
          id={sid.rowPy}
          type="number"
          min={0}
          max={24}
          step={1}
          value={il.rowPaddingYPx}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isFinite(n) || n < 0) return;
            patch({ rowPaddingYPx: n });
          }}
        />
      </div>
      <div className="wsv2-field">
        <label htmlFor={sid.rowGap}>Row gap (px)</label>
        <input
          id={sid.rowGap}
          type="number"
          min={0}
          max={16}
          step={1}
          value={il.rowGapPx}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isFinite(n) || n < 0) return;
            patch({ rowGapPx: n });
          }}
        />
      </div>
      <div className="wsv2-field">
        <label htmlFor={colIds.enW}>English column width (px)</label>
        <input
          id={colIds.enW}
          type="number"
          min={48}
          step={1}
          value={il.englishColumnWidthPx}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isFinite(n) || n < 1) return;
            patch({ englishColumnWidthPx: n });
          }}
        />
      </div>
      <div className="wsv2-field">
        <label htmlFor={colIds.valW}>Value column width (px)</label>
        <input
          id={colIds.valW}
          type="number"
          min={64}
          step={1}
          value={il.valueColumnWidthPx}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isFinite(n) || n < 1) return;
            patch({ valueColumnWidthPx: n });
          }}
        />
      </div>
      <div className="wsv2-field">
        <label htmlFor={colIds.arW}>Arabic column width (px)</label>
        <input
          id={colIds.arW}
          type="number"
          min={48}
          step={1}
          value={il.arabicColumnWidthPx}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isFinite(n) || n < 1) return;
            patch({ arabicColumnWidthPx: n });
          }}
        />
      </div>
      <div className="wsv2-field">
        <label htmlFor={colIds.enAlign}>English alignment</label>
        <select
          id={colIds.enAlign}
          value={il.englishAlign}
          onChange={(e) => patch({ englishAlign: e.target.value as InfoTextAlign })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
      <div className="wsv2-field">
        <label htmlFor={colIds.valAlign}>Value alignment</label>
        <select
          id={colIds.valAlign}
          value={il.valueAlign}
          onChange={(e) => patch({ valueAlign: e.target.value as InfoTextAlign })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
      <div className="wsv2-field">
        <label htmlFor={colIds.arAlign}>Arabic alignment</label>
        <select
          id={colIds.arAlign}
          value={il.arabicAlign}
          onChange={(e) => patch({ arabicAlign: e.target.value as InfoTextAlign })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
    </>
  );
}

function mapUrlDocumentTypeToSchema(raw: string | undefined): SchemaDocType | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  if (t in DOCUMENT_TEMPLATE_SCHEMAS) {
    return t as SchemaDocType;
  }
  const slug = t.replace(/_/g, "-") as StudioDocumentTypeSlug;
  return SLUG_TO_SCHEMA[slug] ?? null;
}

export function WorkspaceTemplateStudio({
  templateId: urlTemplateId,
  initialStyle: urlInitialStyle,
  documentTypeParam,
}: Props) {
  const catalogTemplateId = useMemo(
    () => resolveStudioCatalogTemplateId(urlTemplateId, urlInitialStyle ?? null),
    [urlTemplateId, urlInitialStyle],
  );
  const widthPersistKey = useMemo(
    () => studioWidthPersistKey(catalogTemplateId, urlTemplateId),
    [catalogTemplateId, urlTemplateId],
  );
  const initialTemplate = useMemo(
    () => templates.find((tmpl) => tmpl.id === catalogTemplateId) ?? templates[0]!,
    [catalogTemplateId],
  );

  // Doc type drives the schema. Prefer persisted Studio slug, then URL template.
  const initialDocType =
    TEMPLATE_TO_SCHEMA[initialTemplate.documentType] ?? "tax_invoice";
  const [docType, setDocType] = useState<SchemaDocType>(() => {
    const fromUrl = mapUrlDocumentTypeToSchema(documentTypeParam);
    if (fromUrl) return fromUrl;
    const ui = readTemplateUiFromStorage() ?? defaultTemplateUi();
    const slug = ui.studioDocumentType;
    if (slug && SLUG_TO_SCHEMA[slug]) return SLUG_TO_SCHEMA[slug];
    return initialDocType;
  });
  const schema = DOCUMENT_TEMPLATE_SCHEMAS[docType];

  // Sample data: reuse the same invoice record across schemas. The renderer
  // renders only the columns / fields / totals declared by the active schema.
  const sample = invoices[0];
  const customer = findCustomer(sample.customerId);

  // ── Section + field + column visibility ──────────────────────────────────
  const [hiddenSections, setHiddenSections] = useState<
    Partial<Record<SectionKey, boolean>>
  >({});
  const [hiddenFields, setHiddenFields] = useState<Partial<Record<FieldKey, boolean>>>(
    {},
  );
  const defaultColumnKeys = useMemo(() => itemColumnKeys(schema), [schema]);
  const [columnOrderState, setColumnOrderState] = useState<ColumnKey[] | null>(
    null,
  );
  const columnOrder = useMemo(
    () => columnOrderState ?? defaultColumnKeys,
    [columnOrderState, defaultColumnKeys],
  );

  // Reset overrides when the schema changes — old fields/columns no longer
  // exist on a different doc type.
  useEffect(() => {
    setHiddenSections({});
    setHiddenFields({});
    setColumnOrderState(defaultColumnKeys);
    setTemplateUi((prev) =>
      mergeTemplateUi(prev, {
        hiddenItemColumns: {},
      }),
    );
  }, [docType, defaultColumnKeys, catalogTemplateId]);

  useEffect(() => {
    const fromUrl = mapUrlDocumentTypeToSchema(documentTypeParam);
    if (fromUrl) {
      setDocType(fromUrl);
    }
  }, [documentTypeParam]);

  const toggleSection = (key: SectionKey) =>
    setHiddenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleField = (key: FieldKey) =>
    setHiddenFields((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleColumn = (key: ColumnKey) => {
    if (schema.requiredItemColumns.includes(key)) return;
    setTemplateUi((prev) => {
      const cur = prev.hiddenItemColumns ?? {};
      const nextHidden = { ...cur, [key]: !cur[key] };
      return mergeTemplateUi(prev, {
        hiddenItemColumns: nextHidden,
      });
    });
  };
  const moveColumn = (key: ColumnKey, direction: -1 | 1) => {
    setColumnOrderState((prev) => {
      const next = [...(prev ?? defaultColumnKeys)];
      const idx = next.indexOf(key);
      if (idx === -1) return next;
      const target = idx + direction;
      if (target < 0 || target >= next.length) return next;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  // ── Active section + canvas refs (for highlight + scroll) ────────────────
  const [activeSection, setActiveSection] = useState<SectionKey>(schema.sections[0]);
  useEffect(() => {
    const stored = readTemplateUiFromStorage()?.selectedSection;
    if (stored && schema.sections.includes(stored)) {
      setActiveSection(stored);
    } else {
      setActiveSection(schema.sections[0]);
    }
  }, [docType, schema.sections]);
  const sectionRefs = useRef<Partial<Record<SectionKey, HTMLDivElement | null>>>(
    {},
  );
  const setSectionRef = (id: SectionKey, node: HTMLDivElement | null) => {
    sectionRefs.current[id] = node;
  };
  const focusSection = (id: SectionKey) => {
    setActiveSection(id);
    setTemplateUi((p) => mergeTemplateUi(p, { selectedSection: id }));
    const node = sectionRefs.current[id];
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  useEffect(() => {
    setTemplateUi((p) => mergeTemplateUi(p, { studioDocumentType: SCHEMA_TO_SLUG[docType] }));
  }, [docType]);

  // ── Style / language / spacing / zoom ────────────────────────────────────
  const [style, setStyle] = useState<TemplateStyle>(() => urlInitialStyle ?? initialTemplate.style);
  const [language, setLanguage] = useState<LangMode>(
    initialTemplate.language as LangMode,
  );
  const [fontScale, setFontScale] = useState<"compact" | "regular" | "large">(
    "regular",
  );
  const [spacing, setSpacing] = useState<"tight" | "balanced" | "airy">(
    "balanced",
  );
  const [density, setDensity] = useState<"compact" | "normal" | "wide">("normal");
  const [zoom, setZoom] = useState<number>(1);
  const [canvasA4Overflow, setCanvasA4Overflow] = useState(false);

  const [studioPopover, setStudioPopover] = useState<StudioPopoverState>(null);

  const openStudioPopover = useCallback(
    (event: ReactMouseEvent<HTMLElement>, next: Omit<NonNullable<StudioPopoverState>, "anchor">) => {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setStudioPopover({
        ...next,
        anchor: { x: rect.left + rect.width / 2, y: rect.bottom + 8 },
      });
    },
    [],
  );

  const studioControls = useMemo(
    () => ({
      enabled: true,
      openHeaderNameSize: (e: ReactMouseEvent<HTMLElement>) => openStudioPopover(e, { kind: "header-name-size" }),
      openCustomerFields: (e: ReactMouseEvent<HTMLElement>) => openStudioPopover(e, { kind: "customer-fields" }),
      openDocumentFields: (e: ReactMouseEvent<HTMLElement>) => openStudioPopover(e, { kind: "document-fields" }),
      openItemColumns: (e: ReactMouseEvent<HTMLElement>) => openStudioPopover(e, { kind: "item-columns" }),
      openItemHeading: (e: ReactMouseEvent<HTMLElement>, column: ColumnKey) =>
        openStudioPopover(e, { kind: "item-heading", column }),
    }),
    [openStudioPopover],
  );

  const [templateUi, setTemplateUi] = useState(() => {
    const stored = readTemplateUiFromStorage();
    if (stored) return stored;
    const seed =
      urlInitialStyle ??
      (initialTemplate.style as TemplateStyle | undefined) ??
      ("standard" as TemplateStyle);
    return uiPresetForStyle(seed);
  });
  const hiddenItemColumns = useMemo(
    () => templateUi.hiddenItemColumns ?? {},
    [templateUi.hiddenItemColumns],
  );
  const infoLayoutMerged = { ...DEFAULT_INFO_CARD_LAYOUT, ...templateUi.infoCardLayout };
  const [templateAssets, setTemplateAssets] = useState<TemplateAssetState>(() =>
    readTemplateAssetsFromStorage(),
  );

  useEffect(() => {
    writeTemplateUiToStorage(templateUi);
  }, [templateUi]);

  const legacyWidthsSanitizedRef = useRef(false);
  useEffect(() => {
    if (legacyWidthsSanitizedRef.current) return;
    legacyWidthsSanitizedRef.current = true;
    setTemplateUi((cur) => {
      const patch = migrateTemplateUiPayload(cur);
      const merged = mergeTemplateUi(cur, patch);
      const widthsKey = (u: TemplateUiSettings) =>
        JSON.stringify({ g: u.itemColumnWidths ?? {}, m: u.itemColumnWidthsByTemplateId ?? {} });
      if (widthsKey(merged) !== widthsKey(cur)) {
        console.log("[template-studio] sanitized legacy item column widths");
        return merged;
      }
      return cur;
    });
  }, []);

  const tableInnerTarget = useMemo(
    () => getItemsTableInnerTargetPx(templateUi.margins, { sectionPaddingPx: 8, borderPx: 1 }),
    [templateUi.margins],
  );
  const sanitizedTemplateUi = useMemo(() => {
    const keys = itemColumnKeys(schema);
    const target = getItemsTableInnerTargetPx(templateUi.margins, {
      sectionPaddingPx: 8,
      borderPx: 1,
    });
    const applyFit = (rec: Partial<Record<ColumnKey, number>> | undefined) => {
      if (!rec || Object.keys(rec).length === 0) return rec;
      const sanitized = sanitizeItemColumnWidthRecord(keys, rec, target);
      const raw = keys.map((k) => sanitized[k] ?? itemColumnMinPx(k));
      const fitted = fitItemColumnWidthsToTarget(keys, raw, target, itemColumnMinPx);
      const o: Partial<Record<ColumnKey, number>> = {};
      keys.forEach((k, i) => {
        o[k] = fitted[i]!;
      });
      return o;
    };

    let changed = false;
    const iw = templateUi.itemColumnWidths;
    let nextIw = iw;
    if (iw && Object.keys(iw).length > 0) {
      const nf = applyFit(iw)!;
      if (JSON.stringify(nf) !== JSON.stringify(iw)) changed = true;
      nextIw = nf;
    }
    const byT = templateUi.itemColumnWidthsByTemplateId;
    let nextBy = byT;
    if (byT && Object.keys(byT).length > 0) {
      nextBy = { ...byT };
      for (const [tid, rec] of Object.entries(byT)) {
        if (!rec) continue;
        const nf = applyFit(rec)!;
        if (JSON.stringify(nf) !== JSON.stringify(rec)) changed = true;
        nextBy[tid] = nf;
      }
    }
    if (!changed) return templateUi;
    return mergeTemplateUi(templateUi, {
      itemColumnWidths: nextIw,
      itemColumnWidthsByTemplateId: nextBy,
    });
  }, [schema, templateUi]);
  const previewLayout = useMemo(
    () =>
      buildDocumentLayout({
        schema,
        doc: sample,
        seller: makeRendererSeller(),
        customer: makeRendererCustomer(customer),
        language,
        hiddenSections,
        hiddenFields,
        hiddenColumns: hiddenItemColumns,
        columnOrder,
        ui: sanitizedTemplateUi,
        templateId: widthPersistKey,
      }),
    [
      schema,
      sample,
      customer,
      language,
      hiddenSections,
      hiddenFields,
      hiddenItemColumns,
      columnOrder,
      sanitizedTemplateUi,
      widthPersistKey,
    ],
  );

  const studioTableMetrics = useMemo(() => {
    const tgt = Math.round(previewLayout.itemTableTargetWidthPx ?? tableInnerTarget);
    const used = Math.round(previewLayout.itemColumns.reduce((s, c) => s + c.widthPx, 0));
    const descCol = Math.round(previewLayout.itemColumns.find((c) => c.key === "description")?.widthPx ?? 0);
    const totalCol = Math.round(previewLayout.itemColumns.find((c) => c.key === "lineTotal")?.widthPx ?? 0);
    const widestPx = previewLayout.itemColumns.reduce((m, c) => Math.max(m, c.widthPx), 0);
    const overflow = used > tgt + 2;
    const descriptionIsWidest = descCol > 0 && descCol >= widestPx - 0.5;
    const totalIsNotWidest = totalCol < widestPx - 0.5 && totalCol <= descCol;
    return {
      tgt,
      used,
      descCol,
      totalCol,
      overflow,
      descriptionIsWidest,
      totalIsNotWidest,
    };
  }, [previewLayout, tableInnerTarget]);

  const preflightNotes = useMemo(() => {
    const notes: string[] = [];
    const inner = tableInnerTarget;
    const sumW = previewLayout.itemColumns.reduce((s, c) => s + c.widthPx, 0);
    if (sumW > inner + 2) {
      notes.push("Items table column widths may exceed the inner width budget.");
    }
    const amtCol =
      templateUi.totalsBlock?.totals_amount_col_width_px ??
      DEFAULT_TOTALS_BLOCK.totals_amount_col_width_px;
    if (amtCol < 108) {
      notes.push("Totals amount column may be tight for values like 10,000,000.00.");
    }
    if (!templateAssets.logoDataUrl) notes.push("Logo not uploaded (optional).");
    if (!templateAssets.stampDataUrl) notes.push("Stamp not uploaded (optional).");
    if (!templateAssets.signatureDataUrl) notes.push("Signature not uploaded (optional).");
    if (canvasA4Overflow) {
      notes.push("A4 portrait canvas reports vertical overflow — content may clip in Studio before print/export.");
    }
    if (schema.qr.applicable) {
      notes.push(
        previewLayout.qr.status === "not_applicable"
          ? "QR section hidden in this preview."
          : "QR is Phase 1 foundation only (not production clearance).",
      );
    }
    notes.push("Preview vs PDF parity is not fully validated by automated checks.");
    return notes;
  }, [
    previewLayout,
    tableInnerTarget,
    templateUi.totalsBlock,
    templateAssets,
    schema.qr.applicable,
    canvasA4Overflow,
  ]);

  // Real ZATCA Phase 1 QR foundation — only when the schema marks QR
  // applicable; quotations / proforma / delivery notes / purchase orders
  // never request a QR.
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!schema.qr.applicable) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    buildPhase1Qr({
      sellerName: previewCompany.sellerName,
      vatNumber: previewCompany.vatNumber,
      invoiceTotal: sample.total,
      vatAmount: sample.vat,
      timestamp: new Date(sample.issueDate).toISOString(),
    })
      .then((qr) => {
        if (cancelled) return;
        setQrDataUrl(qr.imageDataUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [schema.qr.applicable, sample.total, sample.vat, sample.issueDate]);

  // ── Real download wiring (PDF + XML) ─────────────────────────────────────
  const [busy, setBusy] = useState<"pdf" | "xml" | null>(null);
  const [pdfParityStatus, setPdfParityStatus] = useState<"not_checked" | "checked_last_export">(
    "not_checked",
  );
  const [preflightOpen, setPreflightOpen] = useState(false);
  const [advancedPanelOpen, setAdvancedPanelOpen] = useState(false);
  const [signatureModal, setSignatureModal] = useState<{ dataUrl: string } | null>(null);
  const [sigDraftName, setSigDraftName] = useState("");
  const [sigDraftPosition, setSigDraftPosition] = useState("");

  const handleDownloadPdf = async () => {
    if (busy) return;
    setBusy("pdf");
    try {
      const payload = {
          doc: sample,
          schema,
          language,
          seller: {
            name: previewCompany.sellerName,
            nameAr: previewCompany.sellerNameAr,
            vatNumber: previewCompany.vatNumber,
            registrationNumber: previewCompany.registrationNumber,
            addressEn: previewCompany.sellerAddressEn,
            addressAr: previewCompany.sellerAddressAr,
            email: previewCompany.sellerEmail,
            phone: previewCompany.sellerPhone,
          },
          customer: {
            name: customer?.legalName ?? "Customer",
            nameAr: customer?.legalNameAr,
            vatNumber: customer?.vatNumber,
            city: customer?.city,
            country: "SA",
            email: customer?.email,
            phone: customer?.phone,
          },
          qrPngDataUrl: qrDataUrl ?? undefined,
          ui: sanitizedTemplateUi,
          hiddenSections,
          hiddenFields,
          hiddenColumns: hiddenItemColumns,
          columnOrder,
          templateId: widthPersistKey,
          templateAssets: {
            logoDataUrl: templateAssets.logoDataUrl,
            stampDataUrl: templateAssets.stampDataUrl,
            signatureDataUrl: templateAssets.signatureDataUrl,
            signatoryName: templateAssets.signatoryName,
            signatoryDesignation: templateAssets.signatoryDesignation,
          },
          templateStyle: style,
        };
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/workspace/template-studio/pdf";
      form.style.display = "none";
      const input = document.createElement("textarea");
      input.name = "payload";
      input.value = JSON.stringify(payload);
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      window.setTimeout(() => form.remove(), 0);
      setPdfParityStatus("checked_last_export");
    } finally {
      setBusy(null);
    }
  };
  useEffect(() => {
    if (signatureModal) {
      setSigDraftName(templateAssets.signatoryName);
      setSigDraftPosition(templateAssets.signatoryDesignation);
    }
  }, [signatureModal, templateAssets.signatoryName, templateAssets.signatoryDesignation]);

  const readFileDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(new Error("read-failed"));
      fr.readAsDataURL(file);
    });

  const onAssetLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const url = await readFileDataUrl(f);
      writeTemplateAsset("logo", url);
      setTemplateAssets(readTemplateAssetsFromStorage());
    } catch {
      /* ignore */
    }
  };

  const onAssetStamp = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const url = await readFileDataUrl(f);
      writeTemplateAsset("stamp", url);
      setTemplateAssets(readTemplateAssetsFromStorage());
    } catch {
      /* ignore */
    }
  };

  const onAssetSignaturePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const url = await readFileDataUrl(f);
      setSignatureModal({ dataUrl: url });
    } catch {
      /* ignore */
    }
  };

  const saveSignatureModal = () => {
    if (!signatureModal) return;
    writeTemplateAsset("signature", signatureModal.dataUrl);
    writeTemplateAsset("signatory", sigDraftName.trim() || null);
    writeTemplateAsset("designation", sigDraftPosition.trim() || null);
    setTemplateAssets(readTemplateAssetsFromStorage());
    setSignatureModal(null);
  };

  const cancelSignatureModal = () => {
    setSignatureModal(null);
  };

  const resetStudioDefaults = () => {
    if (
      !window.confirm(
        "Reset Template Studio UI to defaults? This clears saved column widths and studio preferences (not your invoices).",
      )
    ) {
      return;
    }
    clearTemplateUiStorage();
    const fresh = defaultTemplateUi();
    setTemplateUi(fresh);
    const nextDt =
      SLUG_TO_SCHEMA[fresh.studioDocumentType ?? "tax-invoice"] ?? initialDocType;
    setDocType(nextDt);
    setActiveSection(DOCUMENT_TEMPLATE_SCHEMAS[nextDt].sections[0]);
  };

  const handleDownloadXml = () => {
    if (busy) return;
    setBusy("xml");
    try {
      const xml = buildInvoiceUbl(
        sample,
        {
          name: previewCompany.sellerName,
          nameAr: previewCompany.sellerNameAr,
          vatNumber: previewCompany.vatNumber,
          registrationNumber: previewCompany.registrationNumber,
          addressEn: previewCompany.sellerAddressEn,
        },
        {
          name: customer?.legalName ?? "Customer",
          nameAr: customer?.legalNameAr,
          vatNumber: customer?.vatNumber,
          city: customer?.city,
          country: "SA",
        },
        schema,
      );
      downloadXml(xml, `${sample.number}.xml`);
    } finally {
      setBusy(null);
    }
  };

  const onItemColumnWidthChange = useCallback(
    (widths: Partial<Record<ColumnKey, number>>) => {
      setTemplateUi((prev) => {
        const keys = itemColumnKeys(schema);
        const prevRec = prev.itemColumnWidthsByTemplateId?.[widthPersistKey] ?? {};
        const merged = { ...prevRec, ...widths };
        const sanitizedRec = sanitizeItemColumnWidthRecord(keys, merged, tableInnerTarget);
        return mergeTemplateUi(prev, {
          itemColumnWidthsByTemplateId: {
            ...prev.itemColumnWidthsByTemplateId,
            [widthPersistKey]: sanitizedRec,
          },
        });
      });
    },
    [widthPersistKey, schema, tableInnerTarget],
  );

  const setItemColumnWidthPx = useCallback(
    (key: ColumnKey, nextPx: number) => {
      const keys = previewLayout.itemColumns.map((c) => c.key);
      if (keys.length === 0) return;
      const raw = previewLayout.itemColumns.map((c) => c.widthPx);
      const idx = keys.indexOf(key);
      if (idx < 0) return;
      const px = Math.max(itemColumnHardMinPx(key), Math.floor(nextPx));
      const fitted = fitWidthsWithLockedColumn(keys, raw, idx, px, tableInnerTarget);
      onItemColumnWidthChange(widthsArrayToRecord(keys, fitted));
    },
    [previewLayout, onItemColumnWidthChange, tableInnerTarget],
  );

  const adjustItemColumnWidthPx = useCallback(
    (key: ColumnKey, delta: number) => {
      const col = previewLayout.itemColumns.find((c) => c.key === key);
      if (!col) return;
      setItemColumnWidthPx(key, col.widthPx + delta);
    },
    [previewLayout.itemColumns, setItemColumnWidthPx],
  );

  const setItemHeaderLabel = useCallback((key: ColumnKey, lang: "en" | "ar", value: string) => {
    setTemplateUi((prev) => {
      const prevPair = prev.itemHeaderLabels?.[key];
      const def = DEFAULT_ITEM_HEADER_LABELS[key];
      return mergeTemplateUi(prev, {
        itemHeaderLabels: {
          [key]: {
            en: lang === "en" ? value : (prevPair?.en ?? def.en),
            ar: lang === "ar" ? value : (prevPair?.ar ?? def.ar),
          },
        },
      });
    });
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const canvasPaper = document.querySelector(
        ".wsv2-template-studio .wsv2-doc-paper-inner[data-a4-overflow]",
      );
      setCanvasA4Overflow(canvasPaper?.getAttribute("data-a4-overflow") === "true");
      if (process.env.NODE_ENV === "development") {
        const paper = document.querySelector(".wsv2-template-studio .wsv2-doc-paper-inner");
        const itemSection = document.querySelector(
          '.wsv2-template-studio .wsv2-wf-section[data-section="items"]',
        );
        const wrap = document.querySelector(".wsv2-template-studio [data-wsv2-items-table-wrap]");
        const table = document.querySelector(".wsv2-template-studio .wsv2-wf-items-table");
        const log = (name: string, el: Element | null) => {
          if (el && el.scrollWidth > el.clientWidth + 1) {
            console.warn(
              `[wsv2 template studio] width overflow: ${name} scroll=${el.scrollWidth} client=${el.clientWidth}`,
            );
          }
        };
        log("paper", paper);
        log("items section", itemSection);
        log("items wrap", wrap);
        log("items table", table);
      }
    }, 400);
    return () => clearTimeout(id);
  }, [
    templateUi,
    columnOrder,
    hiddenItemColumns,
    docType,
    zoom,
    hiddenSections,
    sanitizedTemplateUi,
    style,
    language,
    previewLayout,
  ]);

  const stepZoom = (direction: "in" | "out") => {
    const idx = ZOOM_STEPS.findIndex((value) => Math.abs(value - zoom) < 0.001);
    const next =
      direction === "in"
        ? ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, idx === -1 ? 4 : idx + 1)]
        : ZOOM_STEPS[Math.max(0, idx === -1 ? 4 : idx - 1)];
    setZoom(next);
  };

  const fontSizePx =
    fontScale === "compact" ? 11.5 : fontScale === "large" ? 13.5 : 12.5;

  const studioLayoutMerged = templateUi.studioLayout ?? DEFAULT_STUDIO_LAYOUT;
  const leftPanelW = studioLayoutMerged.leftPanelWidthPx;
  const rightPanelW = studioLayoutMerged.rightPanelWidthPx;
  const studioGridCols = advancedPanelOpen
    ? `${leftPanelW}px 6px minmax(0, 1fr) 6px ${rightPanelW}px`
    : `${leftPanelW}px 6px minmax(0, 1fr)`;

  type PanelResizeDrag = {
    which: "left" | "right";
    startX: number;
    startLeft: number;
    startRight: number;
  };
  const panelResizeRef = useRef<PanelResizeDrag | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const s = panelResizeRef.current;
      if (!s) return;
      if (s.which === "left") {
        const dx = e.clientX - s.startX;
        setTemplateUi((p) =>
          mergeTemplateUi(p, { studioLayout: { leftPanelWidthPx: s.startLeft + dx } }),
        );
      } else {
        const dx = e.clientX - s.startX;
        setTemplateUi((p) =>
          mergeTemplateUi(p, { studioLayout: { rightPanelWidthPx: s.startRight - dx } }),
        );
      }
    };
    const end = () => {
      panelResizeRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  const onLeftResizePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const cur = templateUi.studioLayout ?? DEFAULT_STUDIO_LAYOUT;
    panelResizeRef.current = {
      which: "left",
      startX: e.clientX,
      startLeft: cur.leftPanelWidthPx,
      startRight: cur.rightPanelWidthPx,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const onRightResizePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const cur = templateUi.studioLayout ?? DEFAULT_STUDIO_LAYOUT;
    panelResizeRef.current = {
      which: "right",
      startX: e.clientX,
      startLeft: cur.leftPanelWidthPx,
      startRight: cur.rightPanelWidthPx,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const xmlAvailable = schema.zatcaClassification === "foundation_only";
  // Style tabs: real variants only. Per spec, do not show fake templates;
  // doc types other than tax_invoice expose only the Standard variant.
  const styleVariantsForDocType = useMemo<TemplateStyle[]>(
    () => REAL_STYLE_VARIANTS_BY_DOC_TYPE[docType] ?? ["standard"],
    [docType],
  );
  useEffect(() => {
    if (!styleVariantsForDocType.includes(style)) {
      setStyle(styleVariantsForDocType[0]);
    }
  }, [styleVariantsForDocType, style]);

  useEffect(() => {
    if (!urlInitialStyle || !styleVariantsForDocType.includes(urlInitialStyle)) return;
    setStyle(urlInitialStyle);
    setTemplateUi((prev) =>
      mergeTemplateUiPreservingUserLayout(uiPresetForStyle(urlInitialStyle), prev),
    );
  }, [urlInitialStyle, styleVariantsForDocType]);

  const headerFontPxOptions = useMemo(() => Array.from({ length: 23 }, (_, i) => i + 10), []);

  return (
    <div
      className="hisab-template-studio-page wsv2-template-studio wsv2-template-studio-page"
      data-testid="template-studio-page"
      role="region"
      aria-label="Template studio"
    >
      {/* Top toolbar — file actions */}
      <div className="wsv2-studio-top" data-testid="template-studio-toolbar">
        <Link
          href={`${USER_WORKSPACE_BASE}/templates`}
          className="wsv2-icon-btn"
          aria-label="Exit template studio"
        >
          <LogOut size={13} /> Exit
        </Link>
        <span className="studio-name">
          {initialTemplate.name} · {schema.title.en}
        </span>
        <div className="spacer" />
        <button
          type="button"
          className="wsv2-icon-btn hisab-studio-toolbar-button"
          data-testid="template-studio-advanced-toggle"
          aria-expanded={advancedPanelOpen}
          aria-controls="template-studio-advanced-panel"
          onClick={() => setAdvancedPanelOpen((v) => !v)}
          title={advancedPanelOpen ? "Hide advanced inspector" : "Show advanced inspector"}
        >
          <Layers3 size={13} /> Advanced
        </button>
        <div className="group">
          <button type="button" className="wsv2-icon-btn">
            <Save size={13} /> Save draft
          </button>
          <button type="button" className="wsv2-icon-btn">
            <Eye size={13} /> Preview
          </button>
          <button
            type="button"
            className="wsv2-icon-btn"
            onClick={handleDownloadPdf}
            disabled={busy === "pdf"}
            title="Download a real PDF generated client-side via pdf-lib (foundation, not PDF/A-3)"
          >
            <Download size={13} /> {busy === "pdf" ? "Building…" : "PDF"}
          </button>
          {xmlAvailable ? (
            <button
              type="button"
              className="wsv2-icon-btn"
              onClick={handleDownloadXml}
              disabled={busy === "xml"}
              title="Download UBL 2.1 invoice XML (foundation, not ZATCA-validated)"
            >
              <FileCode size={13} /> {busy === "xml" ? "Building…" : "XML"}
            </button>
          ) : null}
          <button type="button" className="wsv2-icon-btn">
            <Settings2 size={13} /> Set default
          </button>
          <button type="button" className="wsv2-icon-btn" aria-label="More">
            <MoreHorizontal size={13} />
          </button>
        </div>
      </div>

      <div
        className="wsv2-studio-body"
        style={{
          gridTemplateColumns: studioGridCols,
        }}
      >
      <aside
        className="wsv2-studio-left hisab-studio-basic-panel"
        data-testid="template-studio-basic-panel"
        aria-label="Basic template controls"
      >
        <StudioPanelSection title="Template identity">
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-slate-800">{initialTemplate.name}</p>
            <p className="text-[11px] text-slate-500">
              {initialTemplate.isDefault
                ? "This catalog sample is marked default for its document family."
                : "Set the workspace default from the template register after sign-in."}
            </p>
          </div>
        </StudioPanelSection>

        <StudioPanelSection title="Typography">
          <div className="space-y-2">
            <div className="wsv2-field">
              <label htmlFor="wsv2-basic-en-font">English font</label>
              <select
                id="wsv2-basic-en-font"
                className="w-full"
                value={templateUi.typography.enFontStack}
                onChange={(e) => {
                  const v = e.target.value;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      typography: {
                        ...p.typography,
                        enFontStack: v,
                        english: { ...p.typography.english, fontFamily: v },
                      },
                    }),
                  );
                }}
              >
                {EN_FONT_PRESETS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
                {!EN_FONT_PRESETS.some((o) => o.value === templateUi.typography.enFontStack) ? (
                  <option value={templateUi.typography.enFontStack}>Custom (current)</option>
                ) : null}
              </select>
            </div>
            <div className="wsv2-field">
              <label htmlFor="wsv2-basic-ar-font">Arabic font</label>
              <select
                id="wsv2-basic-ar-font"
                className="w-full"
                value={templateUi.typography.arFontStack}
                onChange={(e) => {
                  const v = e.target.value;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      typography: {
                        ...p.typography,
                        arFontStack: v,
                        arabic: { ...p.typography.arabic, fontFamily: v },
                      },
                    }),
                  );
                }}
              >
                {AR_FONT_PRESETS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
                {!AR_FONT_PRESETS.some((o) => o.value === templateUi.typography.arFontStack) ? (
                  <option value={templateUi.typography.arFontStack}>Custom (current)</option>
                ) : null}
              </select>
            </div>
            <div className="wsv2-field wsv2-color-row">
              <label htmlFor="wsv2-basic-en-color">English color</label>
              <input
                id="wsv2-basic-en-color"
                type="color"
                value={templateUi.typography.enColor}
                onChange={(e) => {
                  const v = e.target.value;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      typography: { ...p.typography, enColor: v, english: { ...p.typography.english, color: v } },
                    }),
                  );
                }}
                className="wsv2-color-swatch"
              />
              <input
                type="text"
                className="wsv2-hex-input"
                value={templateUi.typography.enColor}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (!/^#[0-9A-Fa-f]{6}$/.test(v)) return;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      typography: { ...p.typography, enColor: v, english: { ...p.typography.english, color: v } },
                    }),
                  );
                }}
                aria-label="English color hex"
              />
            </div>
            <div className="wsv2-field wsv2-color-row">
              <label htmlFor="wsv2-basic-ar-color">Arabic color</label>
              <input
                id="wsv2-basic-ar-color"
                type="color"
                value={templateUi.typography.arColor}
                onChange={(e) => {
                  const v = e.target.value;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      typography: { ...p.typography, arColor: v, arabic: { ...p.typography.arabic, color: v } },
                    }),
                  );
                }}
                className="wsv2-color-swatch"
              />
              <input
                type="text"
                className="wsv2-hex-input"
                value={templateUi.typography.arColor}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (!/^#[0-9A-Fa-f]{6}$/.test(v)) return;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      typography: { ...p.typography, arColor: v, arabic: { ...p.typography.arabic, color: v } },
                    }),
                  );
                }}
                aria-label="Arabic color hex"
              />
            </div>
            <div className="wsv2-field">
              <label htmlFor="wsv2-basic-en-font-size">English body size (px)</label>
              <input
                id="wsv2-basic-en-font-size"
                type="number"
                min={8}
                max={18}
                className="w-full"
                value={templateUi.typography.english?.fontSize ?? 12}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n)) return;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      typography: { ...p.typography, english: { ...p.typography.english, fontSize: n } },
                    }),
                  );
                }}
              />
            </div>
            <div className="wsv2-field">
              <label htmlFor="wsv2-basic-ar-font-size">Arabic body size (px)</label>
              <input
                id="wsv2-basic-ar-font-size"
                type="number"
                min={8}
                max={18}
                className="w-full"
                value={templateUi.typography.arabic?.fontSize ?? 12}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n)) return;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      typography: { ...p.typography, arabic: { ...p.typography.arabic, fontSize: n } },
                    }),
                  );
                }}
              />
            </div>
          </div>
        </StudioPanelSection>

        <StudioPanelSection title="Margins">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(["topMm", "bottomMm", "leftMm", "rightMm"] as const).map((key) => (
              <label key={key} className="wsv2-field">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {key === "topMm"
                    ? "Top"
                    : key === "bottomMm"
                      ? "Bottom"
                      : key === "leftMm"
                        ? "Left"
                        : "Right"}{" "}
                  (mm)
                </span>
                <input
                  type="number"
                  min={4}
                  max={40}
                  className="mt-1 w-full"
                  value={templateUi.margins[key]}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    setTemplateUi((p) => mergeTemplateUi(p, { margins: { ...p.margins, [key]: n } }));
                  }}
                />
              </label>
            ))}
          </div>
        </StudioPanelSection>
      </aside>

      <div
        id="wsv2-left-resize-handle"
        className="wsv2-resize-handle wsv2-resize-handle-left"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sections panel"
        onPointerDown={onLeftResizePointerDown}
        onDoubleClick={(e) => {
          e.preventDefault();
          setTemplateUi((p) =>
            mergeTemplateUi(p, { studioLayout: { leftPanelWidthPx: DEFAULT_STUDIO_LAYOUT.leftPanelWidthPx } }),
          );
        }}
      />

      {/* Sub-toolbar — document type, style, language tabs, zoom */}
      <div className="wsv2-studio-subtop">
        <label className="wsv2-field wsv2-subtop-field" htmlFor="wsv2-document-type-toolbar">
          <span>Document Type</span>
          <select
            id="wsv2-document-type-toolbar"
            value={docType}
            onChange={(event) => setDocType(event.target.value as SchemaDocType)}
            aria-label="Document type"
          >
            {DOC_TYPE_PILLS.map((pill) => (
              <option key={pill.id} value={pill.id}>
                {pill.label}
              </option>
            ))}
          </select>
        </label>

        <label className="wsv2-field" htmlFor="wsv2-select-template-style-toolbar" style={{ minWidth: 140 }}>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--wsv2-ink-subtle)" }}>
            Template style
          </span>
          <select
            id="wsv2-select-template-style-toolbar"
            data-testid="template-style-select"
            className="wsv2-template-style-select mt-1 w-full min-w-[8rem]"
            aria-label="Select template style"
            value={style}
            onChange={(e) => {
              const v = e.target.value as TemplateStyle;
              setStyle(v);
              setTemplateUi((p) =>
                mergeTemplateUiPreservingUserLayout(uiPresetForStyle(v), p),
              );
            }}
          >
            {styleVariantsForDocType.map((value) => {
              const opt = TEMPLATE_STYLE_OPTIONS.find((o) => o.value === value);
              const labelText = opt?.label ?? value.charAt(0).toUpperCase() + value.slice(1);
              return (
                <option key={value} value={value}>
                  {labelText}
                </option>
              );
            })}
          </select>
          {styleVariantsForDocType.length === 1 ? (
            <span
              style={{
                fontSize: 10,
                color: "var(--wsv2-ink-subtle)",
                marginTop: 4,
                display: "block",
              }}
            >
              One style variant applies to this doc type.
            </span>
          ) : null}
        </label>

        <div className="lang-tabs" role="tablist" aria-label="Language mode">
          {(["english", "arabic", "bilingual"] as LangMode[]).map((lang) => (
            <button
              key={lang}
              type="button"
              role="tab"
              aria-selected={language === lang}
              data-active={language === lang ? "true" : "false"}
              onClick={() => setLanguage(lang)}
            >
              {lang === "english" ? "EN" : lang === "arabic" ? "AR" : "EN+AR"}
            </button>
          ))}
        </div>

        <div className="zoom-group" aria-label="Zoom">
          <button type="button" aria-label="Zoom out" onClick={() => stepZoom("out")}>
            <Minus size={12} />
          </button>
          <span className="zoom-value">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Zoom in" onClick={() => stepZoom("in")}>
            <Plus size={12} />
          </button>
          <button type="button" onClick={() => setZoom(1)} title="Fit width">
            Fit width
          </button>
          <button type="button" onClick={() => setZoom(0.8)} title="Fit page">
            <Maximize2 size={12} /> Fit page
          </button>
        </div>

      </div>

      {/* Canvas — single shared schema renderer. */}
      <section
        data-testid="template-studio-canvas"
        className="wsv2-studio-canvas"
        aria-label="Document canvas"
        onClick={() => {
          /* clicking the empty canvas area keeps current selection */
        }}
      >
        <div
          className="paper"
          style={{
            transform: `scale(${zoom})`,
            padding: 0,
            fontSize: fontSizePx,
          }}
        >
          <WorkspaceDocumentRenderer
            schema={schema}
            doc={sample}
            seller={makeRendererSeller()}
            customer={makeRendererCustomer(customer)}
            language={language}
            style={style}
            hiddenSections={hiddenSections}
            hiddenFields={hiddenFields}
            hiddenColumns={hiddenItemColumns}
            columnOrder={columnOrder}
            density={density}
            activeSection={activeSection}
            onSectionSelect={(id) => focusSection(id)}
            setSectionRef={setSectionRef}
            qrImageDataUrl={qrDataUrl}
            ui={sanitizedTemplateUi}
            templateAssets={templateAssets}
            resizableItemColumns
            onItemColumnWidthChange={onItemColumnWidthChange}
            templateId={widthPersistKey}
            studioControls={studioControls}
          />
        </div>
      </section>

      {advancedPanelOpen ? (
        <>
      <div
        id="wsv2-right-resize-handle"
        className="wsv2-resize-handle wsv2-resize-handle-right"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize inspector panel"
        onPointerDown={onRightResizePointerDown}
        onDoubleClick={(e) => {
          e.preventDefault();
          setTemplateUi((p) =>
            mergeTemplateUi(p, { studioLayout: { rightPanelWidthPx: DEFAULT_STUDIO_LAYOUT.rightPanelWidthPx } }),
          );
        }}
      />

      {/* Right inspector — document + section filters, global type, then section controls. */}
      <aside
        id="template-studio-advanced-panel"
        className="wsv2-studio-right wsv2-global-controls"
        data-testid="template-studio-advanced-panel"
        aria-label="Advanced inspector"
      >
        <div className="space-y-3" data-testid="template-studio-inspector-groups">
          <InspectorGroup title="Canvas sections" defaultOpen={false} dataTestId="inspector-group-canvas-sections">
            <p className="text-[11px] text-slate-500">
              Navigate and show or hide logical blocks rendered on the A4 preview (same renderer as PDF export).
            </p>
            {schema.sections.map((id) => {
              const label = SECTION_LABELS[id];
              const isHidden = Boolean(hiddenSections[id]);
              return (
                <div
                  key={id}
                  className="layer"
                  data-active={activeSection === id ? "true" : "false"}
                  role="button"
                  tabIndex={0}
                  onClick={() => focusSection(id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") focusSection(id);
                  }}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <span className="layer-label">
                    {language === "arabic" ? label.ar : label.en}
                    {language === "bilingual" ? (
                      <span
                        style={{
                          color: "var(--wsv2-ink-subtle)",
                          marginInlineStart: 6,
                          fontWeight: 400,
                        }}
                      >
                        {label.ar}
                      </span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    className="eye"
                    data-hidden={isHidden ? "true" : "false"}
                    aria-label={isHidden ? `Show ${label.en}` : `Hide ${label.en}`}
                    title={isHidden ? "Show section" : "Hide section"}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleSection(id);
                    }}
                  >
                    {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              );
            })}
          </InspectorGroup>

          <InspectorGroup title="Document" defaultOpen dataTestId="inspector-group-document">
            <ControlRow label="Document type" hint="Keeps toolbar document tabs and this selector in sync.">
              <div className="wsv2-field">
                <select
                  id="wsv2-document-type"
                  value={SCHEMA_TO_SLUG[docType]}
                  onChange={(e) => {
                    const slug = e.target.value as StudioDocumentTypeSlug;
                    const next = SLUG_TO_SCHEMA[slug];
                    if (next) setDocType(next);
                  }}
                >
                  {DOC_TYPE_SELECT_ORDER.map((slug) => (
                    <option key={slug} value={slug}>
                      {DOC_TYPE_SELECT_LABEL[slug]}
                    </option>
                  ))}
                </select>
              </div>
            </ControlRow>
            <p className="text-[10px] leading-snug text-slate-500">
              Template style, EN/AR, zoom, and layout presets stay in the sub-toolbar.
              Use &quot;Canvas sections&quot; to focus or hide logical blocks; studio spacing and font scale are under
              &quot;Layout&quot;; logo/stamp/signature live under Company assets.
            </p>
          </InspectorGroup>

          <InspectorGroup title="Selected section" defaultOpen dataTestId="inspector-group-selected-section">
            <ControlRow label="Section focus" hint="Toggle visibility via “Canvas sections” above.">
              <div className="wsv2-field">
                <select
                  id="wsv2-section-selector"
                  value={activeSection}
                  onChange={(event) => focusSection(event.target.value as SectionKey)}
                >
                  {schema.sections.map((id) => (
                    <option key={id} value={id}>
                      {SECTION_INSPECTOR_LABEL[id]}
                    </option>
                  ))}
                </select>
              </div>
            </ControlRow>
          </InspectorGroup>

          <InspectorGroup title="Layout" dataTestId="inspector-group-layout">
            <div className="wsv2-field wsv2-field-compact">
              <button type="button" className="wsv2-reset-defaults" onClick={resetStudioDefaults}>
                Reset studio defaults
              </button>
            </div>

            <div className="wsv2-field">
              <label>Spacing</label>
              <select
                value={spacing}
                onChange={(event) =>
                  setSpacing(event.target.value as "tight" | "balanced" | "airy")
                }
              >
                <option value="tight">Tight</option>
                <option value="balanced">Balanced</option>
                <option value="airy">Airy</option>
              </select>
            </div>
            <div className="wsv2-field">
              <label>
                <Type size={11} style={{ verticalAlign: "middle", marginInlineEnd: 4 }} />
                Font scale
              </label>
              <select
                value={fontScale}
                onChange={(event) =>
                  setFontScale(event.target.value as "compact" | "regular" | "large")
                }
              >
                <option value="compact">Compact</option>
                <option value="regular">Regular</option>
                <option value="large">Large</option>
              </select>
            </div>

            <h5 style={{ margin: "8px 0 2px", fontSize: "11px", fontWeight: 700 }}>
              Header
            </h5>
            <p
              style={{
                fontSize: 10.5,
                color: "var(--wsv2-ink-subtle)",
                margin: "0 0 8px",
                lineHeight: 1.35,
              }}
            >
              Three cards: English company, logo, Arabic company. Upload the logo under{" "}
              <strong>Company assets</strong> in this inspector.
            </p>
            <div className="wsv2-field">
              <label htmlFor="wsv2-header-column-mode">Header columns</label>
              <select
                id="wsv2-header-column-mode"
                value={
                  templateUi.headerBlock?.columnWidthMode ?? DEFAULT_HEADER_BLOCK.columnWidthMode
                }
                onChange={(e) =>
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      headerBlock: {
                        columnWidthMode: e.target.value as "equal" | "custom",
                      },
                    }),
                  )
                }
              >
                <option value="equal">Equal width (fits page)</option>
                <option value="custom">Custom widths (px)</option>
              </select>
            </div>
            {(() => {
              const hb = { ...DEFAULT_HEADER_BLOCK, ...templateUi.headerBlock };
              const inner = PAGE_GEOMETRY.safeWidthPx - 28;
              const sum =
                hb.englishCardWidthPx + hb.logoCardWidthPx + hb.arabicCardWidthPx + 2 * hb.cardGapPx;
              if (hb.columnWidthMode !== "custom" || sum <= inner) return null;
              return (
                <p
                  style={{
                    fontSize: 10.5,
                    color: "var(--wsv2-warn, #b45309)",
                    margin: "0 0 8px",
                    lineHeight: 1.35,
                  }}
                >
                  Custom card widths + gaps ({sum}px) exceed content width budget (~{inner}px). The preview and PDF will
                  scale columns down.
                </p>
              );
            })()}
            {(templateUi.headerBlock?.columnWidthMode ?? DEFAULT_HEADER_BLOCK.columnWidthMode) ===
            "custom" ? (
              <>
                <div className="wsv2-field wsv2-field-compact">
                  <label htmlFor="wsv2-header-en-card-width">English card width (px)</label>
                  <input
                    id="wsv2-header-en-card-width"
                    type="number"
                    min={120}
                    max={400}
                    value={
                      templateUi.headerBlock?.englishCardWidthPx ??
                      DEFAULT_HEADER_BLOCK.englishCardWidthPx
                    }
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isFinite(v)) return;
                      setTemplateUi((p) =>
                        mergeTemplateUi(p, { headerBlock: { englishCardWidthPx: Math.round(v) } }),
                      );
                    }}
                  />
                </div>
                <div className="wsv2-field wsv2-field-compact">
                  <label htmlFor="wsv2-header-logo-card-width">Logo card width (px)</label>
                  <input
                    id="wsv2-header-logo-card-width"
                    type="number"
                    min={120}
                    max={320}
                    value={
                      templateUi.headerBlock?.logoCardWidthPx ??
                      DEFAULT_HEADER_BLOCK.logoCardWidthPx
                    }
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isFinite(v)) return;
                      setTemplateUi((p) =>
                        mergeTemplateUi(p, { headerBlock: { logoCardWidthPx: Math.round(v) } }),
                      );
                    }}
                  />
                </div>
                <div className="wsv2-field wsv2-field-compact">
                  <label htmlFor="wsv2-header-ar-card-width">Arabic card width (px)</label>
                  <input
                    id="wsv2-header-ar-card-width"
                    type="number"
                    min={120}
                    max={400}
                    value={
                      templateUi.headerBlock?.arabicCardWidthPx ??
                      DEFAULT_HEADER_BLOCK.arabicCardWidthPx
                    }
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isFinite(v)) return;
                      setTemplateUi((p) =>
                        mergeTemplateUi(p, { headerBlock: { arabicCardWidthPx: Math.round(v) } }),
                      );
                    }}
                  />
                </div>
              </>
            ) : (
              <p
                style={{
                  fontSize: 10.5,
                  color: "var(--wsv2-ink-subtle)",
                  margin: "0 0 8px",
                  lineHeight: 1.35,
                }}
              >
                Equal columns: per-card widths are ignored; three flexible columns fill the header row.
              </p>
            )}
            <div className="wsv2-field wsv2-field-compact">
              <label htmlFor="wsv2-header-card-gap">Card gap (px)</label>
              <input
                id="wsv2-header-card-gap"
                type="number"
                min={0}
                max={48}
                value={templateUi.headerBlock?.cardGapPx ?? DEFAULT_HEADER_BLOCK.cardGapPx}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;
                  setTemplateUi((p) => mergeTemplateUi(p, { headerBlock: { cardGapPx: Math.round(v) } }));
                }}
              />
            </div>
            <div className="wsv2-field wsv2-field-compact">
              <label htmlFor="wsv2-header-card-padding">Card padding (px)</label>
              <input
                id="wsv2-header-card-padding"
                type="number"
                min={4}
                max={32}
                value={templateUi.headerBlock?.cardPaddingPx ?? DEFAULT_HEADER_BLOCK.cardPaddingPx}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, { headerBlock: { cardPaddingPx: Math.round(v) } }),
                  );
                }}
              />
            </div>
            <div className="wsv2-field wsv2-field-compact">
              <label htmlFor="wsv2-header-logo-width">Logo image width (px)</label>
              <input
                id="wsv2-header-logo-width"
                type="number"
                min={48}
                max={280}
                value={templateUi.headerBlock?.logoWidthPx ?? DEFAULT_HEADER_BLOCK.logoWidthPx}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;
                  setTemplateUi((p) => mergeTemplateUi(p, { headerBlock: { logoWidthPx: Math.round(v) } }));
                }}
              />
            </div>
            <div className="wsv2-field wsv2-field-compact">
              <label htmlFor="wsv2-header-logo-height">Logo image height (px)</label>
              <input
                id="wsv2-header-logo-height"
                type="number"
                min={48}
                max={280}
                value={templateUi.headerBlock?.logoHeightPx ?? DEFAULT_HEADER_BLOCK.logoHeightPx}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, { headerBlock: { logoHeightPx: Math.round(v) } }),
                  );
                }}
              />
            </div>
            <div className="wsv2-field">
              <label htmlFor="wsv2-header-logo-align">Logo alignment</label>
              <select
                id="wsv2-header-logo-align"
                value={templateUi.headerBlock?.logoAlign ?? DEFAULT_HEADER_BLOCK.logoAlign}
                onChange={(e) =>
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      headerBlock: { logoAlign: e.target.value as "left" | "center" | "right" },
                    }),
                  )
                }
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="wsv2-field">
              <label htmlFor="wsv2-header-en-align">English card text alignment</label>
              <select
                id="wsv2-header-en-align"
                value={templateUi.headerBlock?.englishAlign ?? DEFAULT_HEADER_BLOCK.englishAlign}
                onChange={(e) =>
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      headerBlock: { englishAlign: e.target.value as "left" | "center" | "right" },
                    }),
                  )
                }
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="wsv2-field">
              <label htmlFor="wsv2-header-ar-align">Arabic card text alignment</label>
              <select
                id="wsv2-header-ar-align"
                value={templateUi.headerBlock?.arabicAlign ?? DEFAULT_HEADER_BLOCK.arabicAlign}
                onChange={(e) =>
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      headerBlock: { arabicAlign: e.target.value as "left" | "center" | "right" },
                    }),
                  )
                }
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </InspectorGroup>

          <InspectorGroup title="Typography / colors" defaultOpen dataTestId="inspector-group-typography-colors">
            <div className="wsv2-field">
              <label htmlFor="wsv2-english-font">English font</label>
              <select
                id="wsv2-english-font"
                value={templateUi.typography.enFontStack}
                onChange={(e) => {
                  const v = e.target.value;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      typography: {
                        ...p.typography,
                        enFontStack: v,
                        english: { ...p.typography.english, fontFamily: v },
                      },
                    }),
                  );
                }}
              >
                {EN_FONT_PRESETS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
                {!EN_FONT_PRESETS.some((o) => o.value === templateUi.typography.enFontStack) ? (
                  <option value={templateUi.typography.enFontStack}>Custom (current)</option>
                ) : null}
              </select>
            </div>
            <div className="wsv2-field">
              <label htmlFor="wsv2-arabic-font">Arabic font</label>
              <select
                id="wsv2-arabic-font"
                value={templateUi.typography.arFontStack}
                onChange={(e) => {
                  const v = e.target.value;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      typography: {
                        ...p.typography,
                        arFontStack: v,
                        arabic: { ...p.typography.arabic, fontFamily: v },
                      },
                    }),
                  );
                }}
              >
                {AR_FONT_PRESETS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
                {!AR_FONT_PRESETS.some((o) => o.value === templateUi.typography.arFontStack) ? (
                  <option value={templateUi.typography.arFontStack}>Custom (current)</option>
                ) : null}
              </select>
            </div>
            <div className="wsv2-field wsv2-color-row">
              <label htmlFor="wsv2-english-font-color">English font color</label>
              <input
                id="wsv2-english-font-color"
                type="color"
                value={templateUi.typography.enColor}
                onChange={(e) => {
                  const v = e.target.value;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      typography: { ...p.typography, enColor: v, english: { ...p.typography.english, color: v } },
                    }),
                  );
                }}
                className="wsv2-color-swatch"
              />
              <input
                type="text"
                className="wsv2-hex-input"
                value={templateUi.typography.enColor}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (!/^#[0-9A-Fa-f]{6}$/.test(v)) return;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      typography: { ...p.typography, enColor: v, english: { ...p.typography.english, color: v } },
                    }),
                  );
                }}
                aria-label="English color hex"
              />
            </div>
            <div className="wsv2-field wsv2-color-row">
              <label htmlFor="wsv2-arabic-font-color">Arabic font color</label>
              <input
                id="wsv2-arabic-font-color"
                type="color"
                value={templateUi.typography.arColor}
                onChange={(e) => {
                  const v = e.target.value;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      typography: { ...p.typography, arColor: v, arabic: { ...p.typography.arabic, color: v } },
                    }),
                  );
                }}
                className="wsv2-color-swatch"
              />
              <input
                type="text"
                className="wsv2-hex-input"
                value={templateUi.typography.arColor}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (!/^#[0-9A-Fa-f]{6}$/.test(v)) return;
                  setTemplateUi((p) =>
                    mergeTemplateUi(p, {
                      typography: { ...p.typography, arColor: v, arabic: { ...p.typography.arabic, color: v } },
                    }),
                  );
                }}
                aria-label="Arabic color hex"
              />
            </div>
            <div className="wsv2-field wsv2-color-row">
              <label htmlFor="wsv2-header-row-color">Header row color</label>
              <input
                id="wsv2-header-row-color"
                type="color"
                value={templateUi.headerRowColor ?? "#E8F4EC"}
                onChange={(e) => {
                  const v = e.target.value;
                  setTemplateUi((p) => mergeTemplateUi(p, { headerRowColor: v }));
                }}
                className="wsv2-color-swatch"
              />
              <input
                type="text"
                className="wsv2-hex-input"
                value={templateUi.headerRowColor ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v && !/^#[0-9A-Fa-f]{6}$/.test(v)) return;
                  setTemplateUi((p) => mergeTemplateUi(p, { headerRowColor: v || undefined }));
                }}
                placeholder="#E8F4EC"
                aria-label="Header row color hex"
              />
            </div>
          </InspectorGroup>

        {activeSection === "title" ? (
          <>
            <h5>Document title</h5>
            <p
              style={{
                fontSize: 10.5,
                color: "var(--wsv2-ink-subtle)",
                margin: "0 0 8px",
                lineHeight: 1.35,
              }}
            >
              Title copy and VAT-compliant defaults follow the active schema. Colors use Typography
              settings above.
            </p>
          </>
        ) : null}

        {activeSection === "customer" ? (
          <>
            {optionalCustomerFields(schema).length > 0 ? (
              <>
                <h5>Customer fields</h5>
                {optionalCustomerFields(schema).map((field) => (
                  <FieldVisibilitySwitch
                    key={field}
                    label={FIELD_LABELS[field].en}
                    checked={!hiddenFields[field]}
                    onChange={() => toggleField(field)}
                  />
                ))}
              </>
            ) : null}
            <InfoCardLayoutControls
              variant="client"
              heading="Client company information card"
              note="Card size applies to the client section only. Column layout is shared with the document information card."
              colIds={{
                enW: "wsv2-customer-en-col-width",
                valW: "wsv2-customer-value-col-width",
                arW: "wsv2-customer-ar-col-width",
                enAlign: "wsv2-customer-en-align",
                valAlign: "wsv2-customer-value-align",
                arAlign: "wsv2-customer-ar-align",
              }}
              il={infoLayoutMerged}
              setTemplateUi={setTemplateUi}
            />
          </>
        ) : null}

        {activeSection === "docInfo" ? (
          <>
            {documentMetaFields(schema).length > 0 ? (
              <>
                <h5>Document info fields</h5>
                {documentMetaFields(schema).map((field) => (
                  <FieldVisibilitySwitch
                    key={field}
                    label={FIELD_LABELS[field].en}
                    checked={!hiddenFields[field]}
                    onChange={() => toggleField(field)}
                  />
                ))}
              </>
            ) : null}
            <InfoCardLayoutControls
              variant="document"
              heading="Document information card"
              note="Card size applies to the document information section only. Column layout is shared with the client card."
              colIds={{
                enW: "wsv2-docinfo-en-col-width",
                valW: "wsv2-docinfo-value-col-width",
                arW: "wsv2-docinfo-ar-col-width",
                enAlign: "wsv2-docinfo-en-align",
                valAlign: "wsv2-docinfo-value-align",
                arAlign: "wsv2-docinfo-ar-align",
              }}
              il={infoLayoutMerged}
              setTemplateUi={setTemplateUi}
            />
          </>
        ) : null}

        {/* Items table columns from schema — always available in Inspector. */}
          <InspectorGroup title="Table columns" defaultOpen={false} dataTestId="inspector-group-table-columns">
        <>
        <h5>Items table — columns &amp; density</h5>
        <div className="wsv2-field">
          <label>Row density</label>
          <select
            value={density}
            onChange={(event) =>
              setDensity(event.target.value as "compact" | "normal" | "wide")
            }
          >
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
            <option value="wide">Wide</option>
          </select>
        </div>
        <div className="wsv2-col-builder" role="group" aria-label="Item table columns">
          {columnOrder.map((col, idx) => {
            const required = schema.requiredItemColumns.includes(col);
            const visible = required ? true : !hiddenItemColumns[col];
            const plCol = previewLayout.itemColumns.find((c) => c.key === col);
            const defLbl = DEFAULT_ITEM_HEADER_LABELS[col];
            const stored = templateUi.itemHeaderLabels?.[col];
            const enHeading = stored?.en ?? defLbl.en;
            const arHeading = stored?.ar ?? defLbl.ar;
            const widthValue = plCol
              ? Math.round(plCol.widthPx)
              : Math.round(
                  templateUi.itemColumnWidthsByTemplateId?.[widthPersistKey]?.[col] ??
                    templateUi.itemColumnWidths?.[col] ??
                    schema.itemColumns.find((c) => c.key === col)?.widthPx ??
                    40,
                );
            const colTitle = `${COLUMN_LABELS[col].en}${required ? " (required)" : ""}`;
            const colWidthMin = itemColumnHardMinPx(col);
            return (
              <div
                key={col}
                className="wsv2-item-heading-editor-row wsv2-col-row wsv2-item-col-slab"
                data-required={required}
              >
                <div className="wsv2-item-col-control-row">
                  <span className="wsv2-item-col-title" id={`wsv2-item-col-label-${col}`}>
                    {colTitle}
                  </span>
                  <button
                    type="button"
                    className="wsv2-icon-btn wsv2-item-col-visibility-btn"
                    aria-pressed={visible}
                    aria-labelledby={`wsv2-item-col-label-${col}`}
                    disabled={required}
                    title={required ? "Required column" : visible ? "Hide column" : "Show column"}
                    data-on={visible ? "true" : "false"}
                    onClick={() => {
                      if (!required) toggleColumn(col);
                    }}
                  >
                    {visible ? <Eye size={14} /> : <EyeOff size={14} className="wsv2-col-picker-off" />}
                  </button>
                  <div className="wsv2-col-actions">
                    <button
                      type="button"
                      aria-label={`Move ${COLUMN_LABELS[col].en} up`}
                      onClick={() => moveColumn(col, -1)}
                      disabled={idx === 0}
                    >
                      <ArrowUp size={11} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${COLUMN_LABELS[col].en} down`}
                      onClick={() => moveColumn(col, 1)}
                      disabled={idx === columnOrder.length - 1}
                    >
                      <ArrowDown size={11} />
                    </button>
                  </div>
                  {visible && plCol ? (
                    <div
                      className="wsv2-col-width"
                      aria-label="Column width in pixels"
                    >
                      <button
                        type="button"
                        className="wsv2-icon-btn wsv2-col-width-bump"
                        aria-label="Decrease width"
                        onClick={() => adjustItemColumnWidthPx(col, -2)}
                      >
                        <Minus size={11} />
                      </button>
                      <input
                        id={col === "vatRate" ? "wsv2-item-col-vat-rate-width" : undefined}
                        className="wsv2-col-width-input"
                        type="number"
                        min={colWidthMin}
                        value={widthValue}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!Number.isFinite(n)) return;
                          if (n >= colWidthMin) {
                            setItemColumnWidthPx(col, n);
                          }
                        }}
                        aria-label={`${COLUMN_LABELS[col].en} width px`}
                      />
                      <button
                        type="button"
                        className="wsv2-icon-btn wsv2-col-width-bump"
                        aria-label="Increase width"
                        onClick={() => adjustItemColumnWidthPx(col, 2)}
                      >
                        <Plus size={11} />
                      </button>
                      <span className="wsv2-col-width-unit" aria-hidden="true">
                        px
                      </span>
                    </div>
                  ) : null}
                  {!visible && !required ? (
                    <div className="wsv2-col-width-muted" title="Turn the column on to edit width and headings">
                      —
                    </div>
                  ) : null}
                </div>
                {visible ? (
                  <div className="wsv2-item-heading-inputs-row">
                    <div className="wsv2-field wsv2-item-heading-input">
                      <label htmlFor={itemColHeadingInputId(col, "en")}>Heading (English)</label>
                      <input
                        id={itemColHeadingInputId(col, "en")}
                        type="text"
                        className="wsv2-item-heading-input"
                        value={enHeading}
                        onChange={(e) => setItemHeaderLabel(col, "en", e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                    <div className="wsv2-field wsv2-item-heading-input">
                      <label htmlFor={itemColHeadingInputId(col, "ar")}>Heading (Arabic)</label>
                      <input
                        id={itemColHeadingInputId(col, "ar")}
                        type="text"
                        className="wsv2-item-heading-input"
                        dir="rtl"
                        lang="ar"
                        value={arHeading}
                        onChange={(e) => setItemHeaderLabel(col, "ar", e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <p
          className={studioTableMetrics.overflow ? "wsv2-inspector-table-overflow" : undefined}
          style={{
            fontSize: 10.5,
            fontWeight: studioTableMetrics.overflow ? 700 : 400,
            color: studioTableMetrics.overflow ? "#b91c1c" : "var(--wsv2-ink-subtle)",
            margin: "8px 0 0",
            lineHeight: 1.35,
          }}
        >
          Table width: available {studioTableMetrics.tgt}px · used {studioTableMetrics.used}px · description{" "}
          {studioTableMetrics.descCol}px · total {studioTableMetrics.totalCol}px · overflow:{" "}
          {studioTableMetrics.overflow ? "YES" : "NO"} · description widest:{" "}
          {studioTableMetrics.descriptionIsWidest ? "YES" : "NO"}
        </p>
        <p
          style={{
            fontSize: 10.5,
            color: "var(--wsv2-ink-subtle)",
            margin: "6px 0 0",
            lineHeight: 1.35,
          }}
        >
          Column widths sum:{" "}
          {Math.round(previewLayout.itemColumns.reduce((s, c) => s + c.widthPx, 0))} px (inner budget{" "}
          {tableInnerTarget} px).
        </p>
        <p
          style={{
            fontSize: 10.5,
            color: "var(--wsv2-ink-subtle)",
            margin: "6px 0 0",
            lineHeight: 1.35,
          }}
        >
          Table inner budget ≈ {tableInnerTarget}px; drag column borders on the
          page or adjust widths here (totals re-balance to fit the card).
        </p>
        </>
          </InspectorGroup>

        <InspectorGroup title="QR / totals" defaultOpen={false} dataTestId="inspector-group-qr-totals">
        {/* Totals fields the schema declares — hide rows individually. */}
        {schema.totalsFields.length > 0 ? (
          <>
            <h5>Totals</h5>
            {schema.totalsFields.map((field) => (
              <CompactToggle
                key={field}
                label={FIELD_LABELS[field].en}
                value={!hiddenFields[field]}
                onChange={() => toggleField(field)}
              />
            ))}
            <div className="wsv2-totals-card-props">
              <h6
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--wsv2-ink-subtle)",
                  margin: "8px 0 0",
                }}
              >
                Totals card (preview)
              </h6>
              <div className="wsv2-field">
                <label htmlFor="wsv2-totals-card-width">Card width (px)</label>
                <div className="wsv2-col-width" aria-label="Totals card width">
                  <button
                    type="button"
                    className="wsv2-icon-btn wsv2-col-width-bump"
                    aria-label="Decrease totals card width"
                    onClick={() => {
                      const cur =
                        templateUi.totalsBlock?.cardWidthPx ??
                        DEFAULT_TOTALS_BLOCK.cardWidthPx;
                      setTemplateUi((p) =>
                        mergeTemplateUi(p, {
                          totalsBlock: {
                            ...DEFAULT_TOTALS_BLOCK,
                            ...p.totalsBlock,
                            cardWidthPx: Math.max(200, cur - 4),
                          },
                        }),
                      );
                    }}
                  >
                    <Minus size={11} />
                  </button>
                  <input
                    id="wsv2-totals-card-width"
                    className="wsv2-col-width-input"
                    type="number"
                    min={200}
                    step={1}
                    value={
                      templateUi.totalsBlock?.cardWidthPx ??
                      DEFAULT_TOTALS_BLOCK.cardWidthPx
                    }
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (!Number.isFinite(n) || n < 1) return;
                      setTemplateUi((p) =>
                        mergeTemplateUi(p, {
                          totalsBlock: {
                            ...DEFAULT_TOTALS_BLOCK,
                            ...p.totalsBlock,
                            cardWidthPx: n,
                          },
                        }),
                      );
                    }}
                  />
                  <button
                    type="button"
                    className="wsv2-icon-btn wsv2-col-width-bump"
                    aria-label="Increase totals card width"
                    onClick={() => {
                      const cur =
                        templateUi.totalsBlock?.cardWidthPx ??
                        DEFAULT_TOTALS_BLOCK.cardWidthPx;
                      setTemplateUi((p) =>
                        mergeTemplateUi(p, {
                          totalsBlock: {
                            ...DEFAULT_TOTALS_BLOCK,
                            ...p.totalsBlock,
                            cardWidthPx: Math.min(720, cur + 4),
                          },
                        }),
                      );
                    }}
                  >
                    <Plus size={11} />
                  </button>
                  <span className="wsv2-col-width-unit" aria-hidden="true">
                    px
                  </span>
                </div>
              </div>
              <div className="wsv2-field">
                <label htmlFor="wsv2-totals-card-hmin">Card min height (px)</label>
                <input
                  id="wsv2-totals-card-hmin"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Auto (schema)"
                  value={
                    templateUi.totalsBlock?.cardMinHeightPx != null &&
                    templateUi.totalsBlock.cardMinHeightPx > 0
                      ? templateUi.totalsBlock.cardMinHeightPx
                      : ""
                  }
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setTemplateUi((p) =>
                      mergeTemplateUi(p, {
                        totalsBlock: {
                          ...DEFAULT_TOTALS_BLOCK,
                          ...p.totalsBlock,
                          cardMinHeightPx:
                            v === ""
                              ? 0
                              : Math.max(0, parseInt(v, 10) || 0),
                        },
                      }),
                    );
                  }}
                />
              </div>
              <div className="wsv2-field">
                <label htmlFor="wsv2-totals-card-hfix">Fixed card height (px, optional)</label>
                <input
                  id="wsv2-totals-card-hfix"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Auto"
                  value={
                    templateUi.totalsBlock?.cardHeightPx != null &&
                    templateUi.totalsBlock.cardHeightPx > 0
                      ? templateUi.totalsBlock.cardHeightPx
                      : ""
                  }
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setTemplateUi((p) =>
                      mergeTemplateUi(p, {
                        totalsBlock: {
                          ...DEFAULT_TOTALS_BLOCK,
                          ...p.totalsBlock,
                          cardHeightPx:
                            v === ""
                              ? undefined
                              : Math.max(0, parseInt(v, 10) || 0) || undefined,
                        },
                      }),
                    );
                  }}
                />
              </div>
              <div className="wsv2-field">
                <label htmlFor="wsv2-totals-padding">Card padding (px)</label>
                <input
                  id="wsv2-totals-padding"
                  type="number"
                  min={0}
                  max={48}
                  step={1}
                  value={
                    templateUi.totalsBlock?.cardPaddingPx ??
                    DEFAULT_TOTALS_BLOCK.cardPaddingPx
                  }
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!Number.isFinite(n) || n < 0) return;
                    setTemplateUi((p) =>
                      mergeTemplateUi(p, {
                        totalsBlock: {
                          ...DEFAULT_TOTALS_BLOCK,
                          ...p.totalsBlock,
                          cardPaddingPx: n,
                        },
                      }),
                    );
                  }}
                />
              </div>
              <div className="wsv2-field">
                <label htmlFor="wsv2-totals-row-gap">Row gap (px)</label>
                <input
                  id="wsv2-totals-row-gap"
                  type="number"
                  min={0}
                  max={32}
                  step={1}
                  value={
                    templateUi.totalsBlock?.rowGapPx ??
                    DEFAULT_TOTALS_BLOCK.rowGapPx
                  }
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!Number.isFinite(n) || n < 0) return;
                    setTemplateUi((p) =>
                      mergeTemplateUi(p, {
                        totalsBlock: {
                          ...DEFAULT_TOTALS_BLOCK,
                          ...p.totalsBlock,
                          rowGapPx: n,
                        },
                      }),
                    );
                  }}
                />
              </div>
              <div className="wsv2-field">
                <label htmlFor="wsv2-totals-col-desc">Description column width (px)</label>
                <input
                  id="wsv2-totals-col-desc"
                  type="number"
                  min={80}
                  step={1}
                  value={
                    templateUi.totalsBlock?.totals_desc_col_width_px ??
                    DEFAULT_TOTALS_BLOCK.totals_desc_col_width_px
                  }
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!Number.isFinite(n) || n < 1) return;
                    setTemplateUi((p) =>
                      mergeTemplateUi(p, {
                        totalsBlock: {
                          ...DEFAULT_TOTALS_BLOCK,
                          ...p.totalsBlock,
                          totals_desc_col_width_px: n,
                        },
                      }),
                    );
                  }}
                />
              </div>
              <div className="wsv2-field">
                <label htmlFor="wsv2-totals-col-currency">Currency symbol column width (px)</label>
                <input
                  id="wsv2-totals-col-currency"
                  type="number"
                  min={10}
                  step={1}
                  value={
                    templateUi.totalsBlock?.totals_currency_col_width_px ??
                    DEFAULT_TOTALS_BLOCK.totals_currency_col_width_px
                  }
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!Number.isFinite(n) || n < 1) return;
                    setTemplateUi((p) =>
                      mergeTemplateUi(p, {
                        totalsBlock: {
                          ...DEFAULT_TOTALS_BLOCK,
                          ...p.totalsBlock,
                          totals_currency_col_width_px: n,
                        },
                      }),
                    );
                  }}
                />
              </div>
              <div className="wsv2-field">
                <label htmlFor="wsv2-totals-col-amount">Amount column width (px)</label>
                <input
                  id="wsv2-totals-col-amount"
                  type="number"
                  min={72}
                  step={1}
                  value={
                    templateUi.totalsBlock?.totals_amount_col_width_px ??
                    DEFAULT_TOTALS_BLOCK.totals_amount_col_width_px
                  }
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!Number.isFinite(n) || n < 1) return;
                    setTemplateUi((p) =>
                      mergeTemplateUi(p, {
                        totalsBlock: {
                          ...DEFAULT_TOTALS_BLOCK,
                          ...p.totalsBlock,
                          totals_amount_col_width_px: n,
                        },
                      }),
                    );
                  }}
                />
              </div>
              <div className="wsv2-field">
                <label htmlFor="wsv2-totals-desc-align">Description alignment</label>
                <select
                  id="wsv2-totals-desc-align"
                  value={
                    templateUi.totalsBlock?.totals_desc_align ??
                    DEFAULT_TOTALS_BLOCK.totals_desc_align ??
                    "left"
                  }
                  onChange={(e) =>
                    setTemplateUi((p) =>
                      mergeTemplateUi(p, {
                        totalsBlock: {
                          ...DEFAULT_TOTALS_BLOCK,
                          ...p.totalsBlock,
                          totals_desc_align: e.target.value as TotalsColAlign,
                        },
                      }),
                    )
                  }
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div className="wsv2-field">
                <label htmlFor="wsv2-totals-currency-align">Currency column alignment</label>
                <select
                  id="wsv2-totals-currency-align"
                  value={
                    templateUi.totalsBlock?.totals_currency_align ??
                    DEFAULT_TOTALS_BLOCK.totals_currency_align ??
                    "center"
                  }
                  onChange={(e) =>
                    setTemplateUi((p) =>
                      mergeTemplateUi(p, {
                        totalsBlock: {
                          ...DEFAULT_TOTALS_BLOCK,
                          ...p.totalsBlock,
                          totals_currency_align: e.target.value as TotalsColAlign,
                        },
                      }),
                    )
                  }
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div className="wsv2-field">
                <label htmlFor="wsv2-totals-amount-align">Amount alignment</label>
                <select
                  id="wsv2-totals-amount-align"
                  value={
                    templateUi.totalsBlock?.totals_amount_align ??
                    DEFAULT_TOTALS_BLOCK.totals_amount_align ??
                    "right"
                  }
                  onChange={(e) =>
                    setTemplateUi((p) =>
                      mergeTemplateUi(p, {
                        totalsBlock: {
                          ...DEFAULT_TOTALS_BLOCK,
                          ...p.totalsBlock,
                          totals_amount_align: e.target.value as TotalsColAlign,
                        },
                      }),
                    )
                  }
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
          </>
        ) : null}

        {/* QR — ZATCA section */}
        {schema.qr.applicable ? (
          <>
            <h5>QR code</h5>
            <CompactToggle
              label="ZATCA QR"
              value={!hiddenSections.qr}
              onChange={() => toggleSection("qr")}
              hint="Real Phase 1 TLV foundation"
            />
            {!hiddenSections.qr ? (
                  <div className="wsv2-qr-props">
                    <h6
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--wsv2-ink-subtle)",
                        margin: "8px 0 0",
                      }}
                    >
                      QR card (preview)
                    </h6>
                    <div className="wsv2-field">
                      <label htmlFor="wsv2-qr-card-w">Card max width (px)</label>
                      <input
                        id="wsv2-qr-card-w"
                        type="number"
                        min={120}
                        step={1}
                        value={templateUi.qrBlock?.cardWidthPx ?? DEFAULT_QR_BLOCK.cardWidthPx}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!Number.isFinite(n) || n < 1) return;
                          setTemplateUi((p) =>
                            mergeTemplateUi(p, {
                              qrBlock: {
                                ...DEFAULT_QR_BLOCK,
                                ...p.qrBlock,
                                cardWidthPx: n,
                              },
                            }),
                          );
                        }}
                      />
                    </div>
                    <div className="wsv2-field">
                      <label htmlFor="wsv2-qr-card-hmin">Card min height (px)</label>
                      <input
                        id="wsv2-qr-card-hmin"
                        type="number"
                        min={80}
                        step={1}
                        value={templateUi.qrBlock?.cardMinHeightPx ?? DEFAULT_QR_BLOCK.cardMinHeightPx}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!Number.isFinite(n) || n < 1) return;
                          setTemplateUi((p) =>
                            mergeTemplateUi(p, {
                              qrBlock: {
                                ...DEFAULT_QR_BLOCK,
                                ...p.qrBlock,
                                cardMinHeightPx: n,
                              },
                            }),
                          );
                        }}
                      />
                    </div>
                    <div className="wsv2-field">
                      <label htmlFor="wsv2-qr-card-hfix">Fixed card height (px, optional)</label>
                      <input
                        id="wsv2-qr-card-hfix"
                        type="number"
                        min={0}
                        step={1}
                        placeholder="Auto"
                        value={
                          templateUi.qrBlock?.cardHeightPx != null &&
                          templateUi.qrBlock.cardHeightPx > 0
                            ? templateUi.qrBlock.cardHeightPx
                            : ""
                        }
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          setTemplateUi((p) =>
                            mergeTemplateUi(p, {
                              qrBlock: {
                                ...DEFAULT_QR_BLOCK,
                                ...p.qrBlock,
                                cardHeightPx:
                                  v === ""
                                    ? undefined
                                    : Math.max(0, parseInt(v, 10) || 0) || undefined,
                              },
                            }),
                          );
                        }}
                      />
                    </div>
                    <div className="wsv2-field">
                      <label htmlFor="wsv2-qr-img">QR image size (px)</label>
                      <input
                        id="wsv2-qr-img"
                        type="number"
                        min={48}
                        max={200}
                        step={1}
                        value={templateUi.qrBlock?.imageSizePx ?? DEFAULT_QR_BLOCK.imageSizePx}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!Number.isFinite(n) || n < 1) return;
                          setTemplateUi((p) =>
                            mergeTemplateUi(p, {
                              qrBlock: {
                                ...DEFAULT_QR_BLOCK,
                                ...p.qrBlock,
                                imageSizePx: n,
                              },
                            }),
                          );
                        }}
                      />
                    </div>
                    <div className="wsv2-field">
                      <label htmlFor="wsv2-qr-align">QR alignment in card</label>
                      <select
                        id="wsv2-qr-align"
                        value={templateUi.qrBlock?.align ?? DEFAULT_QR_BLOCK.align}
                        onChange={(e) => {
                          const v = e.target.value as QrBlockSettings["align"];
                          setTemplateUi((p) =>
                            mergeTemplateUi(p, {
                              qrBlock: { ...DEFAULT_QR_BLOCK, ...p.qrBlock, align: v },
                            }),
                          );
                        }}
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <CompactToggle
                      label="Show QR captions (EN/AR text)"
                      value={templateUi.qrBlock?.showCaptions ?? DEFAULT_QR_BLOCK.showCaptions}
                      onChange={() => {
                        const next = !(
                          templateUi.qrBlock?.showCaptions ?? DEFAULT_QR_BLOCK.showCaptions
                        );
                        setTemplateUi((p) =>
                          mergeTemplateUi(p, {
                            qrBlock: { ...DEFAULT_QR_BLOCK, ...p.qrBlock, showCaptions: next },
                          }),
                        );
                      }}
                    />
                  </div>
            ) : null}
          </>
        ) : !schema.qr.applicable ? (
          <p className="wsv2-inspector-muted">QR is not applicable for this document type.</p>
        ) : null}
        </InspectorGroup>

        <InspectorGroup title="Company assets" defaultOpen={false} dataTestId="inspector-group-company-assets">
        <div className="wsv2-asset-row">
          <input id="wsv2-upload-logo-inspector" type="file" accept="image/*" className="wsv2-sr-only" onChange={onAssetLogo} />
          <label htmlFor="wsv2-upload-logo-inspector" className="wsv2-asset-btn">
            Logo
          </label>
          {templateAssets.logoDataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={templateAssets.logoDataUrl} alt="" className="wsv2-asset-thumb" />
          ) : null}
          {templateAssets.logoDataUrl ? (
            <button
              type="button"
              className="wsv2-asset-remove"
              onClick={() => {
                writeTemplateAsset("logo", null);
                setTemplateAssets(readTemplateAssetsFromStorage());
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
        <div className="wsv2-asset-row">
          <input id="wsv2-upload-stamp-inspector" type="file" accept="image/*" className="wsv2-sr-only" onChange={onAssetStamp} />
          <label htmlFor="wsv2-upload-stamp-inspector" className="wsv2-asset-btn">
            Stamp
          </label>
          {templateAssets.stampDataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={templateAssets.stampDataUrl} alt="" className="wsv2-asset-thumb" />
          ) : null}
          {templateAssets.stampDataUrl ? (
            <button
              type="button"
              className="wsv2-asset-remove"
              onClick={() => {
                writeTemplateAsset("stamp", null);
                setTemplateAssets(readTemplateAssetsFromStorage());
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
        <div className="wsv2-asset-row">
          <input
            id="wsv2-upload-signature-inspector"
            type="file"
            accept="image/*"
            className="wsv2-sr-only"
            onChange={onAssetSignaturePick}
          />
          <label htmlFor="wsv2-upload-signature-inspector" className="wsv2-asset-btn">
            Signature
          </label>
          {templateAssets.signatureDataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={templateAssets.signatureDataUrl} alt="" className="wsv2-asset-thumb" />
          ) : null}
          {templateAssets.signatureDataUrl ? (
            <button
              type="button"
              className="wsv2-asset-remove"
              onClick={() => {
                writeTemplateAsset("signature", null);
                writeTemplateAsset("signatory", null);
                writeTemplateAsset("designation", null);
                setTemplateAssets(readTemplateAssetsFromStorage());
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
        </InspectorGroup>

        {activeSection === "stampSignature" && schema.sections.includes("stampSignature") ? (
          <>
            <h5>Stamp and signature</h5>
            <CompactToggle
              label="Stamp area"
              value={!hiddenFields.stamp}
              onChange={() => toggleField("stamp")}
            />
            <CompactToggle
              label="Signature area"
              value={!hiddenFields.signature}
              onChange={() => toggleField("signature")}
            />
            {schema.footerFields.includes("receiverName") ? (
              <CompactToggle
                label="Receiver signature"
                value={!hiddenFields.receiverName}
                onChange={() => toggleField("receiverName")}
              />
            ) : null}
            <p
              style={{
                fontSize: 10.5,
                color: "var(--wsv2-ink-subtle)",
                margin: "10px 0 6px",
                lineHeight: 1.35,
              }}
            >
              Assets are also under <strong>Company assets</strong> above. Signatory name and
              position are set when you upload a signature (modal).
            </p>
            <div className="wsv2-asset-row">
              <input id="wsv2-upload-stamp-panel" type="file" accept="image/*" className="wsv2-sr-only" onChange={onAssetStamp} />
              <label htmlFor="wsv2-upload-stamp-panel" className="wsv2-asset-btn">
                Stamp upload
              </label>
              {templateAssets.stampDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={templateAssets.stampDataUrl} alt="" className="wsv2-asset-thumb" />
              ) : null}
            </div>
            <div className="wsv2-asset-row">
              <input
                id="wsv2-upload-signature-panel"
                type="file"
                accept="image/*"
                className="wsv2-sr-only"
                onChange={onAssetSignaturePick}
              />
              <label htmlFor="wsv2-upload-signature-panel" className="wsv2-asset-btn">
                Signature upload
              </label>
              {templateAssets.signatureDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={templateAssets.signatureDataUrl} alt="" className="wsv2-asset-thumb" />
              ) : null}
            </div>
            <div className="wsv2-field wsv2-field-compact">
              <label htmlFor="wsv2-signatory-name-inline">Signatory name</label>
              <input
                id="wsv2-signatory-name-inline"
                type="text"
                value={templateAssets.signatoryName}
                onChange={(e) => {
                  writeTemplateAsset("signatory", e.target.value.trim() || null);
                  setTemplateAssets(readTemplateAssetsFromStorage());
                }}
              />
            </div>
            <div className="wsv2-field wsv2-field-compact">
              <label htmlFor="wsv2-signatory-position-inline">Signatory position</label>
              <input
                id="wsv2-signatory-position-inline"
                type="text"
                value={templateAssets.signatoryDesignation}
                onChange={(e) => {
                  writeTemplateAsset("designation", e.target.value.trim() || null);
                  setTemplateAssets(readTemplateAssetsFromStorage());
                }}
              />
            </div>
            <div className="wsv2-field wsv2-field-compact">
              <span id="wsv2-stamp-sig-dims-label">Image box (px)</span>
              <div
                role="group"
                aria-labelledby="wsv2-stamp-sig-dims-label"
                style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}
              >
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "var(--wsv2-ink-subtle)", width: 52 }}>Stamp</span>
                  <input
                    id="wsv2-stamp-img-w"
                    type="number"
                    min={32}
                    max={200}
                    style={{ width: 64 }}
                    value={
                      templateUi.stampSignatureBlock?.stampImageWidthPx ??
                      DEFAULT_STAMP_SIGNATURE_BLOCK.stampImageWidthPx
                    }
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isFinite(v)) return;
                      setTemplateUi((p) =>
                        mergeTemplateUi(p, { stampSignatureBlock: { stampImageWidthPx: Math.round(v) } }),
                      );
                    }}
                    aria-label="Stamp image width"
                  />
                  <span style={{ fontSize: 12, color: "var(--wsv2-ink-subtle)" }}>×</span>
                  <input
                    id="wsv2-stamp-img-h"
                    type="number"
                    min={32}
                    max={200}
                    style={{ width: 64 }}
                    value={
                      templateUi.stampSignatureBlock?.stampImageHeightPx ??
                      DEFAULT_STAMP_SIGNATURE_BLOCK.stampImageHeightPx
                    }
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isFinite(v)) return;
                      setTemplateUi((p) =>
                        mergeTemplateUi(p, { stampSignatureBlock: { stampImageHeightPx: Math.round(v) } }),
                      );
                    }}
                    aria-label="Stamp image height"
                  />
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "var(--wsv2-ink-subtle)", width: 52 }}>Sign.</span>
                  <input
                    id="wsv2-signature-img-w"
                    type="number"
                    min={32}
                    max={200}
                    style={{ width: 64 }}
                    value={
                      templateUi.stampSignatureBlock?.signatureImageWidthPx ??
                      DEFAULT_STAMP_SIGNATURE_BLOCK.signatureImageWidthPx
                    }
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isFinite(v)) return;
                      setTemplateUi((p) =>
                        mergeTemplateUi(p, { stampSignatureBlock: { signatureImageWidthPx: Math.round(v) } }),
                      );
                    }}
                    aria-label="Signature image width"
                  />
                  <span style={{ fontSize: 12, color: "var(--wsv2-ink-subtle)" }}>×</span>
                  <input
                    id="wsv2-signature-img-h"
                    type="number"
                    min={48}
                    max={240}
                    style={{ width: 64 }}
                    value={
                      templateUi.stampSignatureBlock?.signatureImageHeightPx ??
                      DEFAULT_STAMP_SIGNATURE_BLOCK.signatureImageHeightPx
                    }
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isFinite(v)) return;
                      setTemplateUi((p) =>
                        mergeTemplateUi(p, { stampSignatureBlock: { signatureImageHeightPx: Math.round(v) } }),
                      );
                    }}
                    aria-label="Signature image height"
                  />
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* Footer fields. */}
        {activeSection === "footer" && schema.footerFields.length > 0 ? (
          <>
            <h5>Footer</h5>
            {schema.footerFields.map((field) => (
              <CompactToggle
                key={field}
                label={FIELD_LABELS[field].en}
                value={!hiddenFields[field]}
                onChange={() => toggleField(field)}
              />
            ))}
          </>
        ) : null}

        <InspectorGroup title="Preflight" defaultOpen={false} dataTestId="inspector-group-preflight">
          <p className="wsv2-parity-line !mt-0" role="status">
            Preview/PDF parity:{" "}
            {pdfParityStatus === "not_checked" ? "Not checked" : "Checked by last export"}
          </p>
          <div className="wsv2-preflight">
            <button
              type="button"
              className="wsv2-preflight-toggle"
              onClick={() => setPreflightOpen((o) => !o)}
              aria-expanded={preflightOpen}
            >
              Warnings list {preflightOpen ? "▾" : "▸"}
            </button>
            {preflightOpen ? (
              <ul className="wsv2-preflight-list">
                {preflightNotes.map((n, i) => (
                  <li key={`preflight-${i}`}>{n}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div
            style={{
              marginTop: 14,
              padding: 10,
              borderRadius: 8,
              background: "var(--wsv2-surface-alt)",
              border: "1px solid var(--wsv2-line)",
              fontSize: 11.5,
              color: "var(--wsv2-ink-muted)",
              lineHeight: 1.5,
            }}
          >
            <Sparkles size={12} style={{ verticalAlign: "middle", marginInlineEnd: 4 }} />
            {schema.zatcaClassification === "foundation_only"
              ? "PDF + XML + QR are real client-side foundations (pdf-lib + qrcode + UBL). Not yet wired to the production ZATCA reporting pipeline; not PDF/A-3."
              : schema.zatcaClassification === "not_applicable"
              ? "ZATCA reporting is not applicable to this document type. PDF is generated as a clean A4 layout."
              : "Document is informational. PDF is foundation-only."}
          </div>
        </InspectorGroup>

        </div>

      </aside>
        </>
      ) : null}

      </div>

      {studioPopover ? (
        <StudioFloatingPopover state={studioPopover} onClose={() => setStudioPopover(null)}>
          {studioPopover.kind === "header-name-size" ? (
            <div className="space-y-3 text-sm text-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company name size</p>
              <label className="block text-xs">
                English (px)
                <select
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                  value={templateUi.headerBlock?.englishCompanyNameFontPx ?? 16}
                  onChange={(e) =>
                    setTemplateUi((p) =>
                      mergeTemplateUi(p, {
                        headerBlock: { englishCompanyNameFontPx: Number(e.target.value) },
                      }),
                    )
                  }
                >
                  {headerFontPxOptions.map((px) => (
                    <option key={`en-${px}`} value={px}>
                      {px}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs">
                Arabic (px)
                <select
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                  value={templateUi.headerBlock?.arabicCompanyNameFontPx ?? 16}
                  onChange={(e) =>
                    setTemplateUi((p) =>
                      mergeTemplateUi(p, {
                        headerBlock: { arabicCompanyNameFontPx: Number(e.target.value) },
                      }),
                    )
                  }
                >
                  {headerFontPxOptions.map((px) => (
                    <option key={`ar-${px}`} value={px}>
                      {px}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          {studioPopover.kind === "customer-fields" ? (
            <div className="max-h-64 space-y-1 overflow-y-auto text-sm">
              <p className="text-xs font-semibold text-slate-500">Customer fields</p>
              {schema.customerRows.map((row) => (
                <label key={row.field} className="flex cursor-pointer items-center gap-2 rounded border border-slate-100 px-2 py-1 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={!hiddenFields[row.field]}
                    onChange={() => toggleField(row.field)}
                  />
                  <span>{FIELD_LABELS[row.field]?.en ?? row.field}</span>
                </label>
              ))}
            </div>
          ) : null}
          {studioPopover.kind === "document-fields" ? (
            <div className="max-h-64 space-y-1 overflow-y-auto text-sm">
              <p className="text-xs font-semibold text-slate-500">Document fields</p>
              {documentMetaFields(schema).map((field) => (
                <label key={field} className="flex cursor-pointer items-center gap-2 rounded border border-slate-100 px-2 py-1 hover:bg-slate-50">
                  <input type="checkbox" checked={!hiddenFields[field]} onChange={() => toggleField(field)} />
                  <span>{FIELD_LABELS[field]?.en ?? field}</span>
                </label>
              ))}
            </div>
          ) : null}
          {studioPopover.kind === "item-columns" ? (
            <div className="max-h-72 space-y-2 overflow-y-auto text-xs">
              <p className="text-xs font-semibold text-slate-500">Columns</p>
              {columnOrder.map((key, idx) => {
                const required = schema.requiredItemColumns.includes(key);
                const visible = required ? true : !hiddenItemColumns[key];
                const plCol = previewLayout.itemColumns.find((c) => c.key === key);
                const widthVal = plCol ? Math.round(plCol.widthPx) : 40;
                return (
                  <div key={key} className="flex flex-wrap items-center gap-1 rounded border border-slate-100 p-1">
                    <span className="min-w-[5rem] font-medium">{COLUMN_LABELS[key].en}</span>
                    <button
                      type="button"
                      className="rounded border px-1 py-0.5 disabled:opacity-40"
                      disabled={idx === 0}
                      onClick={() => moveColumn(key, -1)}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="rounded border px-1 py-0.5 disabled:opacity-40"
                      disabled={idx >= columnOrder.length - 1}
                      onClick={() => moveColumn(key, 1)}
                    >
                      →
                    </button>
                    <input
                      type="number"
                      className="w-14 rounded border px-1"
                      value={widthVal}
                      min={itemColumnHardMinPx(key)}
                      onChange={(ev) =>
                        setItemColumnWidthPx(key, Number(ev.target.value) || itemColumnHardMinPx(key))
                      }
                    />
                    <label className="ml-auto flex items-center gap-1">
                      <input type="checkbox" checked={visible} disabled={required} onChange={() => toggleColumn(key)} />
                      Show
                    </label>
                  </div>
                );
              })}
            </div>
          ) : null}
          {studioPopover.kind === "item-heading" && studioPopover.column ? (
            <div className="space-y-2 text-sm">
              <p className="text-xs font-semibold text-slate-500">Column heading</p>
              <label className="block text-xs">
                English
                <input
                  id={itemColHeadingInputId(studioPopover.column, "en")}
                  className="mt-1 w-full rounded border px-2 py-1"
                  defaultValue={
                    templateUi.itemHeaderLabels?.[studioPopover.column]?.en ??
                    DEFAULT_ITEM_HEADER_LABELS[studioPopover.column].en
                  }
                  key={`${studioPopover.column}-en-${studioPopover.anchor.x}`}
                />
              </label>
              <label className="block text-xs">
                Arabic
                <input
                  id={itemColHeadingInputId(studioPopover.column, "ar")}
                  className="mt-1 w-full rounded border px-2 py-1"
                  defaultValue={
                    templateUi.itemHeaderLabels?.[studioPopover.column]?.ar ??
                    DEFAULT_ITEM_HEADER_LABELS[studioPopover.column].ar
                  }
                  key={`${studioPopover.column}-ar-${studioPopover.anchor.x}`}
                />
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => setStudioPopover(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className="rounded bg-slate-900 px-2 py-1 text-xs text-white"
                  onClick={() => {
                    const col = studioPopover.column!;
                    const enEl = document.getElementById(itemColHeadingInputId(col, "en")) as HTMLInputElement | null;
                    const arEl = document.getElementById(itemColHeadingInputId(col, "ar")) as HTMLInputElement | null;
                    if (enEl) setItemHeaderLabel(col, "en", enEl.value);
                    if (arEl) setItemHeaderLabel(col, "ar", arEl.value);
                    setStudioPopover(null);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : null}
        </StudioFloatingPopover>
      ) : null}

      {signatureModal ? (
        <div
          id="wsv2-signature-modal"
          className="wsv2-signature-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wsv2-signature-modal-title"
          onClick={cancelSignatureModal}
        >
          <div className="wsv2-signature-modal-panel" onClick={(e) => e.stopPropagation()}>
            <h4 id="wsv2-signature-modal-title" className="wsv2-signature-modal-title">
              Signature details
            </h4>
            <p className="wsv2-signature-modal-hint">
              Enter the signatory name and position. These appear below the signature image on the
              document.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureModal.dataUrl}
              alt=""
              className="wsv2-signature-modal-preview"
            />
            <div className="wsv2-field wsv2-field-compact">
              <label htmlFor="wsv2-signatory-name">Signatory name</label>
              <input
                id="wsv2-signatory-name"
                type="text"
                autoComplete="name"
                value={sigDraftName}
                onChange={(e) => setSigDraftName(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="wsv2-field wsv2-field-compact">
              <label htmlFor="wsv2-signatory-position">Position / title</label>
              <input
                id="wsv2-signatory-position"
                type="text"
                autoComplete="organization-title"
                value={sigDraftPosition}
                onChange={(e) => setSigDraftPosition(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="wsv2-signature-modal-actions">
              <button type="button" className="wsv2-signature-modal-primary" onClick={saveSignatureModal}>
                Save signature details
              </button>
              <button type="button" className="wsv2-signature-modal-secondary" onClick={cancelSignatureModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Compact, professional toggle. Keeps the existing wsv2-toggle look but
//    no over-sized green circles.
function CompactToggle({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: () => void;
  hint?: string;
}) {
  return (
    <div className="wsv2-toggle">
      <span className="toggle-label">
        <span>{label}</span>
        {hint ? <span className="hint">{hint}</span> : null}
      </span>
      <button
        type="button"
        className="wsv2-toggle-switch"
        data-on={value ? "true" : "false"}
        aria-pressed={value}
        aria-label={`Toggle ${label}`}
        onClick={onChange}
      />
    </div>
  );
}
