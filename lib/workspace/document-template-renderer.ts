// Workspace — shared layout/data builder.
//
// Schema-first contract: turns (schema, doc, seller, customer, language)
// into a structured `LayoutPlan` consumed by:
//   - Browser preview (components/workspace/WorkspaceDocumentRenderer.tsx)
//   - PDF builder    (lib/workspace/exports/pdf.ts)
//   - XML builder    (lib/workspace/exports/xml.ts) — totals reconcile
//
// IMPORTANT:
//   - All values are pre-formatted strings (no `[object Object]` possible).
//   - Empty fields are dropped via `hideIfEmpty`.
//   - Numbers use comma grouping via `en-SA` Intl formatter.
//   - QR caption / footer fields are taken straight from the schema; no
//     debug / generated-by text leaks through.

import type { DocumentRecord } from "./types";
import {
  buildMinWidthGetter,
  fitItemColumnWidthsToTarget,
  getItemsTableInnerTargetPx,
} from "./item-column-resize";
import {
  FIELD_LABELS,
  PAGE_GEOMETRY,
  SECTION_LABELS,
  SPACING,
  type Bilingual,
  type ColumnKey,
  type DocumentTemplateSchema,
  type FieldKey,
  type InfoRow,
  type ItemColumnSpec,
  type LangMode,
  type SectionKey,
} from "./document-template-schemas";
import {
  DEFAULT_HEADER_BLOCK,
  DEFAULT_INFO_CARD_LAYOUT,
  DEFAULT_ITEM_HEADER_LABELS,
  DEFAULT_STAMP_SIGNATURE_BLOCK,
  DEFAULT_TOTALS_BLOCK,
  DEFAULT_TYPOGRAPHY,
  TOTALS_RIYAL_GLYPH,
  type HeaderBlockSettings,
  type InfoCardLayoutSettings,
  type StampSignatureBlockSettings,
  type TemplateUiSettings,
  normalizeStampSignatureBlock,
} from "./template-ui-settings";

// ─── Public types ───────────────────────────────────────────────────────────

export type RenderSeller = {
  name: string;
  nameAr?: string;
  vatNumber: string;
  registrationNumber?: string;
  addressEn?: string;
  addressAr?: string;
  email?: string;
  phone?: string;
};

export type RenderCustomer = {
  name: string;
  nameAr?: string;
  vatNumber?: string;
  registrationNumber?: string;
  city?: string;
  country?: string;
  addressEn?: string;
  addressAr?: string;
  email?: string;
  phone?: string;
  fax?: string;
};

export type LayoutInfoRow = {
  field: FieldKey;
  labelEn: string;
  labelAr: string;
  value: string;
};

export type LayoutItemColumn = ItemColumnSpec & {
  labelEn: string;
  labelAr: string;
};

export type LayoutItemRow = {
  /** 1-based index. */
  index: number;
  /** Pre-formatted cell values keyed by ColumnKey. */
  cells: Partial<Record<ColumnKey, string>>;
};

export type LayoutTotalsRow = {
  field: FieldKey;
  labelEn: string;
  labelAr: string;
  /** Full line for legacy consumers: `"1,234.56 ⃁"`. */
  value: string;
  amountOnly: string;
  currencySymbol: string;
  emphasis: boolean;
};

export type LayoutFooterParagraph = {
  field: FieldKey;
  labelEn: string;
  labelAr: string;
  value: string | null;
};

export type LayoutSection = {
  id: SectionKey;
  labelEn: string;
  labelAr: string;
  /** From `schema.sectionGeometry[id]`. */
  xPx: number;
  widthPx: number;
  minHeightPx: number;
  maxHeightPx: number | "auto";
  splitRow?: "totals_left_qr" | "totals_right";
};

export type LayoutPlan = {
  /** Active language mode used by the renderer. */
  language: LangMode;
  /** Document title bilingual pair. */
  title: Bilingual;
  /** Customer header label (Bill to / Customer / Supplier / Deliver to). */
  customerLabel: Bilingual;
  /** Seller block prepared for header. */
  seller: {
    nameEn: string;
    nameAr: string;
    addressEn: string;
    addressAr: string;
    email: string;
    phone: string;
    /** @deprecated Prefer vatLabelEn / vatLabelAr in bilingual UI. */
    vatLabel: string;
    vatLabelEn: string;
    vatLabelAr: string;
    vatValue: string;
    /** @deprecated Prefer crLabelEn / crLabelAr. */
    crLabel: string;
    crLabelEn: string;
    crLabelAr: string;
    crValue: string;
  };
  /** Strict section order from schema. */
  sections: LayoutSection[];
  /** Customer rows (already filtered for hideIfEmpty). */
  customerRows: LayoutInfoRow[];
  /** Document info rows (already filtered for hideIfEmpty). */
  documentInfoRows: LayoutInfoRow[];
  /** Items table columns + bilingual headers. */
  itemColumns: LayoutItemColumn[];
  /** Items rows. */
  itemRows: LayoutItemRow[];
  /** Totals rows. */
  totalsRows: LayoutTotalsRow[];
  /** Footer paragraphs. */
  footerParagraphs: LayoutFooterParagraph[];
  /** QR caption + applicability. */
  qr: {
    applicable: boolean;
    captionEn: string;
    captionAr: string;
    /** Status chip label (Phase 1 foundation / not implemented). */
    status: "phase1_foundation" | "missing_required" | "not_applicable";
  };
  /** Stamp / signature block visibility. */
  stampSignature: {
    enabled: boolean;
    showStamp: boolean;
    showSignature: boolean;
    showReceiverSignature: boolean;
  };
  /** Reconciled totals (line-derived). */
  reconciled: {
    taxableAmount: number;
    totalVat: number;
    grandTotal: number;
  };
  /** Body text: English vs Arabic (labels / mixed UI). Accent remains separate in renderer. */
  textColors: {
    english: string;
    arabic: string;
  };
  /** Body font stacks for labels (info rows, etc.). */
  bodyFonts: {
    english: string;
    arabic: string;
  };
  /** Customer / document info card — 3-column grid + density. */
  infoLayout: InfoCardLayoutSettings;
  /** Merged header card settings (inspector + PDF + preview). */
  headerBlock: HeaderBlockSettings;
  /** Stamp / signature card layout defaults + overrides. */
  stampSignatureBlock: StampSignatureBlockSettings;
};

// ─── Formatting helpers ─────────────────────────────────────────────────────

const NUMBER_FORMATTER = new Intl.NumberFormat("en-SA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const QTY_FORMATTER = new Intl.NumberFormat("en-SA", {
  maximumFractionDigits: 3,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function fmtMoney(value: number, currency: string): string {
  if (!Number.isFinite(value)) return `${currency} 0.00`;
  return `${currency} ${NUMBER_FORMATTER.format(value)}`;
}

function fmtNumber(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  return NUMBER_FORMATTER.format(value);
}

function fmtQty(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return QTY_FORMATTER.format(value);
}

function fmtPercent(rate: number): string {
  if (!Number.isFinite(rate)) return "0%";
  return `${Math.round(rate * 100)}%`;
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return DATE_FORMATTER.format(date);
}

// ─── Field value resolution ─────────────────────────────────────────────────

function customerValue(field: FieldKey, customer: RenderCustomer, language: LangMode): string {
  switch (field) {
    case "customerName":     return customer.name ?? "";
    case "customerNameAr":   return customer.nameAr ?? "";
    case "customerVat":      return customer.vatNumber ?? "";
    case "customerCr":       return customer.registrationNumber ?? "";
    case "customerCity":     return customer.city ?? "";
    case "customerCountry":  return customer.country ?? (language === "arabic" ? "المملكة العربية السعودية" : "Saudi Arabia");
    case "customerAddress": {
      if (language === "arabic" && customer.addressAr) return customer.addressAr;
      if (customer.addressEn) return customer.addressEn;
      if (customer.addressAr) return customer.addressAr;
      return customer.city ?? "";
    }
    case "customerEmail":    return customer.email ?? "";
    case "customerPhone":    return customer.phone ?? "";
    case "customerFax":      return customer.fax ?? "";
    default:                 return "";
  }
}

function metaValue(field: FieldKey, doc: DocumentRecord): string {
  switch (field) {
    case "docNumber":              return doc.number;
    case "issueDate":              return fmtDate(doc.issueDate);
    case "supplyDate":             return fmtDate(doc.issueDate);
    case "dueDate":                return fmtDate(doc.dueDate);
    case "validUntil":             return fmtDate(doc.dueDate);
    case "deliveryDate":           return fmtDate(doc.dueDate);
    case "expectedDeliveryDate":   return fmtDate(doc.dueDate);
    case "currency":               return doc.currency;
    case "paymentTerms":           return "Net 30";
    case "reference":              return "";
    case "reason":                 return doc.notes ?? "";
    case "amountReceived":         return fmtMoney(Math.max(0, doc.total - doc.balance), doc.currency);
    case "balanceDue":             return fmtMoney(doc.balance, doc.currency);
    case "paymentStatus": {
      switch (doc.status) {
        case "paid":            return "Paid";
        case "partially_paid":  return "Partially paid";
        case "sent":            return "Awaiting payment";
        default:                return doc.status;
      }
    }
    case "originalInvoiceNumber":  return "";
    case "originalInvoiceDate":    return "";
    case "relatedInvoiceNumber":   return "";
    case "relatedProformaNumber":  return "";
    case "deliveryLocation":       return "";
    case "deliveryStatus":         return "";
    case "quotationNumber":        return "";
    case "purchaseOrderNumber":    return "";
    default:                       return "";
  }
}

function reconcileTotals(doc: DocumentRecord) {
  let taxable = 0;
  let vat = 0;
  for (const line of doc.lines) {
    const lineTaxable = line.quantity * line.unitPrice;
    taxable += lineTaxable;
    vat += lineTaxable * (line.vatRate ?? 0);
  }
  return {
    taxableAmount: taxable,
    totalVat: vat,
    grandTotal: taxable + vat,
  };
}

function fmtTotalsNumber(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  return NUMBER_FORMATTER.format(value);
}

function totalsRowContent(
  field: FieldKey,
  doc: DocumentRecord,
  reconciled: ReturnType<typeof reconcileTotals>,
  currency: string,
): { value: string; amountOnly: string; currencySymbol: string } | null {
  const sym = currency === "SAR" ? TOTALS_RIYAL_GLYPH : currency;
  const pack = (n: number) => {
    const amountOnly = fmtTotalsNumber(n);
    return {
      value: `${amountOnly} ${sym}`.trim(),
      amountOnly,
      currencySymbol: sym,
    };
  };
  switch (field) {
    case "subtotal":       return pack(reconciled.taxableAmount);
    case "discount":       return pack(0);
    case "taxableAmount":  return pack(reconciled.taxableAmount);
    case "totalVat":       return pack(reconciled.totalVat);
    case "grandTotal":     return pack(reconciled.grandTotal);
    case "creditTotal":    return pack(reconciled.grandTotal);
    case "debitTotal":     return pack(reconciled.grandTotal);
    case "paid":           return pack(Math.max(0, doc.total - doc.balance));
    case "balanceDue":     return pack(doc.balance);
    case "amountReceived": return pack(Math.max(0, doc.total - doc.balance));
    default:               return null;
  }
}

function formatItemCell(col: ItemColumnSpec, line: DocumentRecord["lines"][number], idx: number, _currency: string): string {
  const taxable = line.quantity * line.unitPrice;
  const vat = taxable * (line.vatRate ?? 0);
  switch (col.key) {
    case "index":             return String(idx + 1);
    case "description":       return line.description;
    case "quantity":          return fmtQty(line.quantity);
    case "unit":              return "";
    case "deliveredQuantity": return fmtQty(line.quantity);
    case "pendingQuantity":   return fmtQty(0);
    case "remarks":           return "";
    case "price":             return fmtNumber(line.unitPrice);
    case "discount":          return fmtNumber(0);
    case "taxableAmount":     return fmtNumber(taxable);
    case "vatRate":           return fmtPercent(line.vatRate ?? 0);
    case "vatAmount":         return fmtNumber(vat);
    case "lineTotal":         return fmtNumber(taxable + vat);
    default:                  return "";
  }
}

// ─── Filters ────────────────────────────────────────────────────────────────

function filterRows(rows: InfoRow[], resolveValue: (field: FieldKey) => string, hidden: Partial<Record<FieldKey, boolean>>): LayoutInfoRow[] {
  const out: LayoutInfoRow[] = [];
  for (const row of rows) {
    if (hidden[row.field]) continue;
    const value = resolveValue(row.field);
    const trimmed = (value ?? "").toString().trim();
    if (!trimmed && row.hideIfEmpty) continue;
    out.push({
      field: row.field,
      labelEn: FIELD_LABELS[row.field].en,
      labelAr: FIELD_LABELS[row.field].ar,
      value: trimmed,
    });
  }
  return out;
}

// ─── Public builder ─────────────────────────────────────────────────────────

export type BuildLayoutOptions = {
  schema: DocumentTemplateSchema;
  doc: DocumentRecord;
  seller: RenderSeller;
  customer: RenderCustomer;
  language?: LangMode;
  hiddenSections?: Partial<Record<SectionKey, boolean>>;
  hiddenFields?: Partial<Record<FieldKey, boolean>>;
  hiddenColumns?: Partial<Record<ColumnKey, boolean>>;
  columnOrder?: ColumnKey[];
  /** Template Studio: enables `itemColumnWidthsByTemplateId[templateId]`. */
  templateId?: string;
  /** Template Studio / preview: typography, column labels, title overrides, etc. */
  ui?: TemplateUiSettings;
};

function resolveTitle(
  schema: DocumentTemplateSchema,
  _doc: DocumentRecord,
  ui: TemplateUiSettings | undefined,
): Bilingual {
  if (!ui?.title) return schema.title;
  const t = ui.title;
  const useVat =
    t.vatCompliantTitle &&
    (schema.documentType === "tax_invoice" ||
      schema.documentType === "simplified_tax_invoice");
  const en = t.en?.trim() || (useVat ? "Tax Invoice" : schema.title.en);
  const ar = t.ar?.trim() || (useVat ? "فاتورة ضريبية" : schema.title.ar);
  return { en, ar };
}

function resolveTextColors(ui: TemplateUiSettings | undefined): {
  english: string;
  arabic: string;
} {
  const t = ui?.typography;
  return {
    english: t?.english?.color ?? t?.enColor ?? DEFAULT_TYPOGRAPHY.enColor,
    arabic: t?.arabic?.color ?? t?.arColor ?? DEFAULT_TYPOGRAPHY.arColor,
  };
}

function normalizeItemColumnWidths(
  cols: LayoutItemColumn[],
  schemaCols: ItemColumnSpec[],
  targetPx: number,
): LayoutItemColumn[] {
  if (cols.length === 0) return cols;
  const minG = buildMinWidthGetter(schemaCols);
  const keys = cols.map((c) => c.key);
  const raw = cols.map((c) => c.widthPx);
  const fitted = fitItemColumnWidthsToTarget(keys, raw, targetPx, minG);
  return cols.map((c, i) => ({ ...c, widthPx: fitted[i]! }));
}

export function buildDocumentLayout(options: BuildLayoutOptions): LayoutPlan {
  const language: LangMode = options.language ?? "bilingual";
  const { schema, doc, seller, customer } = options;
  const ui = options.ui;
  const hiddenSections = options.hiddenSections ?? {};
  const hiddenFields = options.hiddenFields ?? {};
  const hiddenColumns: Partial<Record<ColumnKey, boolean>> = {
    ...(options.hiddenColumns ?? {}),
    ...(ui?.hiddenItemColumns ?? {}),
  };
  const templateId = options.templateId;
  const byTemplate =
    templateId && ui?.itemColumnWidthsByTemplateId?.[templateId]
      ? ui.itemColumnWidthsByTemplateId[templateId]
      : undefined;

  const reconciled = reconcileTotals(doc);

  const headerBlock: HeaderBlockSettings = {
    ...DEFAULT_HEADER_BLOCK,
    ...ui?.headerBlock,
  };
  const stampSignatureBlock: StampSignatureBlockSettings = normalizeStampSignatureBlock({
    ...DEFAULT_STAMP_SIGNATURE_BLOCK,
    ...(ui?.stampSignatureBlock ?? {}),
  });

  // Sections — strict schema order, with overrides hiding specific sections.
  let sections: LayoutSection[] = schema.sections
    .filter((id) => !hiddenSections[id])
    .map((id) => {
      const geom = schema.sectionGeometry[id];
      return {
        id,
        labelEn: SECTION_LABELS[id].en,
        labelAr: SECTION_LABELS[id].ar,
        xPx: geom?.xPx ?? PAGE_GEOMETRY.contentXPx,
        widthPx: geom?.widthPx ?? PAGE_GEOMETRY.safeWidthPx,
        minHeightPx: geom?.minHeightPx ?? 80,
        maxHeightPx: geom?.maxHeightPx ?? "auto",
        splitRow: geom?.splitRow,
      };
    });

  const tbMerged = { ...DEFAULT_TOTALS_BLOCK, ...ui?.totalsBlock };
  const totalsIdx = sections.findIndex((s) => s.id === "totals");
  if (totalsIdx >= 0) {
    const base = sections[totalsIdx]!;
    const maxTotalsW = PAGE_GEOMETRY.safeWidthPx;
    const nextWidth = Math.min(
      maxTotalsW,
      Math.max(200, tbMerged.cardWidthPx > 0 ? tbMerged.cardWidthPx : base.widthPx),
    );
    const nextMinH =
      tbMerged.cardMinHeightPx > 0 ? tbMerged.cardMinHeightPx : base.minHeightPx;
    const nextMaxH =
      tbMerged.cardHeightPx != null && tbMerged.cardHeightPx > 0
        ? tbMerged.cardHeightPx
        : base.maxHeightPx;
    sections = sections.slice();
    sections[totalsIdx] = {
      ...base,
      widthPx: nextWidth,
      minHeightPx: nextMinH,
      maxHeightPx: nextMaxH,
    };
  }

  const headerIdx = sections.findIndex((s) => s.id === "header");
  if (headerIdx >= 0) {
    const base = sections[headerIdx]!;
    const topA = ui?.showHeaderGreenAccent ? SPACING.topAccentPx : 0;
    const bodyMin = headerBlock.cardPaddingPx * 2 + headerBlock.logoHeightPx + 12;
    sections = sections.slice();
    sections[headerIdx] = {
      ...base,
      minHeightPx: Math.max(base.minHeightPx, topA + bodyMin),
    };
  }

  const stampIdx = sections.findIndex((s) => s.id === "stampSignature");
  if (stampIdx >= 0) {
    const base = sections[stampIdx]!;
    const stampSigEnabled =
      schema.stampSignature.enabled &&
      schema.sections.includes("stampSignature") &&
      !hiddenSections.stampSignature;
    const showStamp = stampSigEnabled && schema.stampSignature.showStamp && !hiddenFields.stamp;
    const showSignature =
      stampSigEnabled && schema.stampSignature.showSignature && !hiddenFields.signature;
    const pad = stampSignatureBlock.cardPaddingPx * 2;
    const footerBand = stampSignatureBlock.footerLineEnabled ? 44 : 28;
    const stampH = showStamp ? stampSignatureBlock.stampImageHeightPx + pad + footerBand : 0;
    const sigMeta = 44;
    const sigH = showSignature
      ? stampSignatureBlock.signatureImageHeightPx + pad + footerBand + sigMeta
      : 0;
    const stampSigVisualMin = Math.max(
      stampH,
      sigH,
      stampSignatureBlock.cardMinHeightPx,
    );
    sections = sections.slice();
    sections[stampIdx] = {
      ...base,
      minHeightPx: Math.max(base.minHeightPx, stampSigVisualMin),
    };
  }

  // Customer rows (apply hideIfEmpty + hiddenFields).
  const customerRows = filterRows(
    schema.customerRows,
    (field) => customerValue(field, customer, language),
    hiddenFields,
  );

  // Document info rows.
  const documentInfoRows = filterRows(
    schema.documentInfoRows,
    (field) => metaValue(field, doc),
    hiddenFields,
  );

  // Items columns — order overrides + visibility filter (required wins).
  const orderedKeys = options.columnOrder ?? schema.itemColumns.map((c) => c.key);
  const colMap = new Map(schema.itemColumns.map((c) => [c.key, c]));
  const itemTargetPx = getItemsTableInnerTargetPx(ui?.margins);
  const itemColumns: LayoutItemColumn[] = normalizeItemColumnWidths(
    orderedKeys
      .map((key) => colMap.get(key))
      .filter((col): col is ItemColumnSpec => Boolean(col))
      .filter((col) => col.required || !hiddenColumns[col.key])
      .map((col) => {
        const wT = byTemplate?.[col.key];
        const wG = ui?.itemColumnWidths[col.key];
        const w =
          wT != null && wT > 0
            ? wT
            : wG != null && wG > 0
              ? wG
              : col.widthPx;
        const labels = ui?.itemHeaderLabels[col.key];
        const def = DEFAULT_ITEM_HEADER_LABELS[col.key];
        return {
          ...col,
          widthPx: w,
          labelEn: labels?.en?.trim() || def.en,
          labelAr: labels?.ar?.trim() || def.ar,
        };
      }),
    schema.itemColumns,
    itemTargetPx,
  );

  const currency = doc.currency || "SAR";
  const itemRows: LayoutItemRow[] = doc.lines.map((line, idx) => {
    const cells: Partial<Record<ColumnKey, string>> = {};
    for (const col of itemColumns) {
      cells[col.key] = formatItemCell(col, line, idx, currency);
    }
    return { index: idx + 1, cells };
  });

  const titleResolved = resolveTitle(schema, doc, ui);

  // Totals rows. The grand total label can be overridden per derived schema.
  const totalsRows: LayoutTotalsRow[] = schema.totalsFields
    .filter((field) => !hiddenFields[field])
    .map((field) => {
      const content = totalsRowContent(field, doc, reconciled, currency);
      if (content == null) return null;
      const isGrand = field === "grandTotal" || field === "creditTotal" || field === "debitTotal";
      const label = (isGrand && schema.totalsGrandLabel)
        ? schema.totalsGrandLabel
        : FIELD_LABELS[field];
      return {
        field,
        labelEn: label.en,
        labelAr: label.ar,
        value: content.value,
        amountOnly: content.amountOnly,
        currencySymbol: content.currencySymbol,
        emphasis: isGrand,
      };
    })
    .filter((row): row is LayoutTotalsRow => row !== null);

  // Footer paragraphs (already filtered for hidden fields).
  const footerParagraphs: LayoutFooterParagraph[] = schema.footerFields
    .filter((field) => !hiddenFields[field])
    .map((field) => {
      const label = FIELD_LABELS[field];
      let value: string | null;
      if (field === "notes") value = doc.notes ?? null;
      else if (field === "terms") value = doc.notes ?? null;
      else if (field === "validityNote" || field === "deliveryTerms" || field === "purchaseTerms" || field === "proformaNote" || field === "zatcaNote") {
        value = language === "arabic" ? label.ar : label.en;
      } else if (field === "creditNoteReason" || field === "debitNoteReason") {
        value = doc.notes ?? null;
      } else if (field === "receiverName" || field === "signature") {
        value = null;
      } else {
        value = null;
      }
      return {
        field,
        labelEn: label.en,
        labelAr: label.ar,
        value,
      };
    });

  // QR — caption only, no debug text.
  const qrApplicable = schema.qr.applicable && !hiddenSections.qr;
  const qrStatus = !qrApplicable
    ? "not_applicable"
    : seller.vatNumber && reconciled.grandTotal > 0
      ? "phase1_foundation"
      : "missing_required";

  // Seller block.
  const sellerBlock = {
    nameEn: seller.name,
    nameAr: seller.nameAr ?? "",
    addressEn: seller.addressEn ?? "",
    addressAr: seller.addressAr ?? "",
    email: seller.email ?? "",
    phone: seller.phone ?? "",
    vatLabel: language === "arabic" ? FIELD_LABELS.sellerVat.ar : FIELD_LABELS.sellerVat.en,
    vatLabelEn: FIELD_LABELS.sellerVat.en,
    vatLabelAr: FIELD_LABELS.sellerVat.ar,
    vatValue: seller.vatNumber ?? "",
    crLabel: language === "arabic" ? FIELD_LABELS.sellerCr.ar : FIELD_LABELS.sellerCr.en,
    crLabelEn: FIELD_LABELS.sellerCr.en,
    crLabelAr: FIELD_LABELS.sellerCr.ar,
    crValue: seller.registrationNumber ?? "",
  };

  const typo = { ...DEFAULT_TYPOGRAPHY, ...ui?.typography };
  const infoLayout: InfoCardLayoutSettings = {
    ...DEFAULT_INFO_CARD_LAYOUT,
    ...ui?.infoCardLayout,
  };

  sections = sections.map((s) => {
    if (s.id === "customer") {
      const w =
        infoLayout.clientCardWidthPx > 0
          ? Math.min(Math.round(infoLayout.clientCardWidthPx), PAGE_GEOMETRY.safeWidthPx)
          : s.widthPx;
      const minH =
        infoLayout.clientCardMinHeightPx > 0 ? Math.round(infoLayout.clientCardMinHeightPx) : 0;
      return { ...s, widthPx: w, minHeightPx: minH };
    }
    if (s.id === "docInfo") {
      const w =
        infoLayout.documentCardWidthPx > 0
          ? Math.min(Math.round(infoLayout.documentCardWidthPx), PAGE_GEOMETRY.safeWidthPx)
          : s.widthPx;
      const minH =
        infoLayout.documentCardMinHeightPx > 0
          ? Math.round(infoLayout.documentCardMinHeightPx)
          : 0;
      return { ...s, widthPx: w, minHeightPx: minH };
    }
    return s;
  });

  return {
    language,
    title: titleResolved,
    customerLabel: schema.customerLabel,
    seller: sellerBlock,
    sections,
    customerRows,
    documentInfoRows,
    itemColumns,
    itemRows,
    totalsRows,
    footerParagraphs,
    qr: {
      applicable: qrApplicable,
      captionEn: schema.qr.caption.en,
      captionAr: schema.qr.caption.ar,
      status: qrStatus,
    },
    stampSignature: {
      enabled: schema.stampSignature.enabled && schema.sections.includes("stampSignature") && !hiddenSections.stampSignature,
      showStamp: schema.stampSignature.showStamp && !hiddenFields.stamp,
      showSignature: schema.stampSignature.showSignature && !hiddenFields.signature,
      showReceiverSignature: schema.stampSignature.showReceiverSignature && !hiddenFields.receiverSignature,
    },
    reconciled,
    textColors: resolveTextColors(ui),
    bodyFonts: {
      english: typo.english?.fontFamily ?? typo.enFontStack,
      arabic: typo.arabic?.fontFamily ?? typo.arFontStack,
    },
    infoLayout,
    headerBlock,
    stampSignatureBlock,
  };
}

/** Convenience: bilingual label text for a section id. */
export function bilingualLabel(en: string, ar: string, language: LangMode): string {
  if (language === "english") return en;
  if (language === "arabic") return ar;
  return `${en} / ${ar}`;
}
