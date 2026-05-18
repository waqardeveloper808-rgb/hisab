// Workspace — Template UI settings (Template Studio + preview + PDF).
// Preview persistence: localStorage only (no backend claim).

import {
  COLORS,
  COLUMN_LABELS,
  mmToPx,
  type ColumnKey,
  type SchemaDocType,
  type SectionKey,
} from "./document-template-schemas";
import {
  getItemsTableInnerTargetPx,
  sanitizeItemColumnWidthRecord,
} from "./item-column-resize";

export { mmToPx };

/** Single canonical currency glyph for SAR in preview + PDF (engine contract). */
export const TOTALS_RIYAL_GLYPH = "⃁";

/** Single canonical currency glyph for SAR in preview + PDF (engine contract). */
export const CURRENCY_DISPLAY_SYMBOL = TOTALS_RIYAL_GLYPH;

/**
 * Workspace Template Studio persisted UI (documented for migration).
 * Includes `studioLayout` (left/right panel widths) — same key, no separate store.
 */
/** Current key — v2 migrates poisoned v1 widths; v3 reads as one-shot legacy after experimental v3 key (A4-D). */
export const TEMPLATE_UI_STORAGE_KEY = "hisabix.wsv2.templateUi.v2";
/** One-shot reads only; migrated into `TEMPLATE_UI_STORAGE_KEY` then removed. */
const LEGACY_TEMPLATE_UI_STORAGE_KEY_V3 = "hisabix.wsv2.templateUi.v3";
const LEGACY_TEMPLATE_UI_STORAGE_KEY_V1 = "hisabix.wsv2.templateUi.v1";
const STORAGE_KEY = TEMPLATE_UI_STORAGE_KEY;

export type CardBorderSettings = {
  show: boolean;
  widthPx: number;
  radiusPx: number;
  color: string;
};

export type TemplateTitleSettings = {
  en: string;
  ar: string;
  enFontPx: number;
  arFontPx: number;
  enColor: string;
  arColor: string;
  /** When true, tax invoices force VAT-compliant default titles. */
  vatCompliantTitle: boolean;
};

export type TemplateTypography = {
  enFontStack: string;
  arFontStack: string;
  /** Multiplier, 1 = base */
  enSizeScale: number;
  arSizeScale: number;
  /** English body / label color (`typography.english.color`). */
  enColor: string;
  /** Arabic body / label color (`typography.arabic.color`). */
  arColor: string;
  /** Optional nested mirror for industry naming — wins over `enColor` when set. */
  english?: { color?: string; fontFamily?: string; fontSize?: number };
  /** Optional nested mirror — wins over `arColor` when set. */
  arabic?: { color?: string; fontFamily?: string; fontSize?: number };
};

export type TemplateMargins = {
  topMm: number;
  rightMm: number;
  bottomMm: number;
  leftMm: number;
};

/** Template Studio — QR card layout (browser preview). PDF uses its own layout. */
export type QrBlockSettings = {
  cardWidthPx: number;
  cardMinHeightPx: number;
  /** When set, fixed block height in addition to min-height. */
  cardHeightPx?: number;
  imageSizePx: number;
  align: "left" | "center" | "right";
  showCaptions: boolean;
};

export const DEFAULT_QR_BLOCK: QrBlockSettings = {
  cardWidthPx: 152,
  cardMinHeightPx: 104,
  imageSizePx: 96,
  align: "left",
  showCaptions: true,
};

/**
 * Totals card in Template Studio preview / PDF (Workspace).
 * Conceptual persistence keys (flat) for docs / reports:
 * - totals_card_width_px → cardWidthPx
 * - totals_card_min_height_px → cardMinHeightPx (0 = inherit schema min height)
 * - totals_card_fixed_height_px → cardHeightPx
 * - totals_card_padding_px → cardPaddingPx
 * - totals_row_gap_px → rowGapPx
 * - totals_desc_col_width_px, totals_currency_col_width_px, totals_amount_col_width_px → same names on object
 */
export type TotalsColAlign = "left" | "center" | "right";

export type TotalsBlockSettings = {
  cardWidthPx: number;
  /** 0 = use schema section min height. */
  cardMinHeightPx: number;
  cardHeightPx?: number;
  cardPaddingPx: number;
  rowGapPx: number;
  totals_desc_col_width_px: number;
  totals_currency_col_width_px: number;
  totals_amount_col_width_px: number;
  totals_desc_align?: TotalsColAlign;
  totals_currency_align?: TotalsColAlign;
  totals_amount_align?: TotalsColAlign;
};

/** Defaults aligned from Workspace Template Studio verified state on 2026-04-26. */
export const DEFAULT_TOTALS_BLOCK: TotalsBlockSettings = {
  cardWidthPx: 300,
  cardMinHeightPx: 0,
  cardPaddingPx: 6,
  rowGapPx: 3,
  totals_desc_col_width_px: 150,
  totals_currency_col_width_px: 12,
  totals_amount_col_width_px: 108,
  totals_desc_align: "left",
  totals_currency_align: "center",
  totals_amount_align: "right",
};

/** Customer / document info cards — preview + PDF density + 3-column grid. */
export type InfoTextAlign = "left" | "center" | "right";

export type InfoCardLayoutSettings = {
  /** 0 = full width (schema content width). */
  clientCardWidthPx: number;
  /** 0 = no extra min-height; shell shrinks to content. */
  clientCardMinHeightPx: number;
  /** 0 = auto height; >0 = fixed shell height (preview/PDF frame). */
  clientCardHeightPx: number;
  documentCardWidthPx: number;
  documentCardMinHeightPx: number;
  documentCardHeightPx: number;
  rowPaddingYPx: number;
  rowGapPx: number;
  cardPaddingPx: number;
  englishColumnWidthPx: number;
  valueColumnWidthPx: number;
  arabicColumnWidthPx: number;
  englishAlign: InfoTextAlign;
  valueAlign: InfoTextAlign;
  arabicAlign: InfoTextAlign;
  englishDirection: "ltr";
  valueDirection: "ltr";
  arabicDirection: "rtl";
};

/** Defaults aligned from Workspace Template Studio verified state on 2026-04-26. */
export const DEFAULT_INFO_CARD_LAYOUT: InfoCardLayoutSettings = {
  clientCardWidthPx: 0,
  clientCardMinHeightPx: 0,
  clientCardHeightPx: 0,
  documentCardWidthPx: 0,
  documentCardMinHeightPx: 0,
  documentCardHeightPx: 0,
  rowPaddingYPx: 2,
  rowGapPx: 2,
  cardPaddingPx: 6,
  englishColumnWidthPx: 130,
  valueColumnWidthPx: 200,
  arabicColumnWidthPx: 130,
  englishAlign: "left",
  valueAlign: "center",
  arabicAlign: "right",
  englishDirection: "ltr",
  valueDirection: "ltr",
  arabicDirection: "rtl",
};

/** Default EN/AR item table headings (Studio reset + migration). */
export const DEFAULT_ITEM_HEADER_LABELS: Record<ColumnKey, { en: string; ar: string }> = {
  ...COLUMN_LABELS,
};

function mergeItemHeaderLabels(
  base: Partial<Record<ColumnKey, { en: string; ar: string }>>,
  patch: Partial<Record<ColumnKey, { en: string; ar: string }>> | undefined,
): Partial<Record<ColumnKey, { en: string; ar: string }>> {
  if (!patch) return { ...base };
  const out: Partial<Record<ColumnKey, { en: string; ar: string }>> = { ...base };
  for (const k of Object.keys(patch) as ColumnKey[]) {
    const p = patch[k];
    if (!p) continue;
    const prev = out[k];
    out[k] = {
      en: p.en ?? prev?.en ?? DEFAULT_ITEM_HEADER_LABELS[k].en,
      ar: p.ar ?? prev?.ar ?? DEFAULT_ITEM_HEADER_LABELS[k].ar,
    };
  }
  return out;
}

/** Header row: three separate cards (English | Logo | Arabic). */
export type HeaderTextAlign = "left" | "center" | "right";

/** `equal` = three columns share width inside page (safe default). `custom` = pixel widths (clamped in renderers). */
export type HeaderColumnWidthMode = "equal" | "custom";

/** `three_column` = EN | logo | AR in one row. `two_column_logo_in_title` = EN | AR only; logo + title in title section. */
export type HeaderStructureMode = "three_column" | "two_column_logo_in_title";

export type HeaderBlockSettings = {
  /** Default `three_column` (Wafeq baseline). */
  structure?: HeaderStructureMode;
  columnWidthMode: HeaderColumnWidthMode;
  /** Used when `columnWidthMode === "custom"` (inspector hints; clamped to content width). */
  englishCardWidthPx: number;
  logoCardWidthPx: number;
  arabicCardWidthPx: number;
  cardGapPx: number;
  cardPaddingPx: number;
  logoWidthPx: number;
  logoHeightPx: number;
  logoAlign: HeaderTextAlign;
  englishAlign: HeaderTextAlign;
  arabicAlign: HeaderTextAlign;
  /** Seller / company name in header (English card), px — Template Studio + PDF. */
  englishCompanyNameFontPx?: number;
  /** Seller / company name in header (Arabic card), px — Template Studio + PDF. */
  arabicCompanyNameFontPx?: number;
  /** Fixed header card chrome height (preview); text shrinks inside. */
  headerCardHeightPx?: number;
  headerCardMaxHeightPx?: number;
  /** Detail lines below company name — base px before shrink-to-fit. */
  headerLineFontPx?: number;
  headerLineMinFontPx?: number;
};

export const DEFAULT_HEADER_BLOCK: HeaderBlockSettings = {
  structure: "three_column",
  columnWidthMode: "equal",
  englishCardWidthPx: 228,
  logoCardWidthPx: 228,
  arabicCardWidthPx: 228,
  cardGapPx: 8,
  cardPaddingPx: 6,
  logoWidthPx: 96,
  logoHeightPx: 72,
  logoAlign: "center",
  englishAlign: "left",
  arabicAlign: "right",
  englishCompanyNameFontPx: 12,
  arabicCompanyNameFontPx: 12,
  headerCardHeightPx: 108,
  headerCardMaxHeightPx: 108,
  headerLineFontPx: 8,
  headerLineMinFontPx: 6,
};

/** Stamp / signature card chrome (preview + PDF). */
export type StampSignatureBlockSettings = {
  cardMinHeightPx: number;
  /** Caps stamp card height in preview when set (signature card may grow for tall image). */
  cardMaxHeightPx?: number;
  cardPaddingPx: number;
  stampImageWidthPx: number;
  stampImageHeightPx: number;
  signatureImageWidthPx: number;
  signatureImageHeightPx: number;
  /**
   * @deprecated Legacy single box for both images. Migrated in `normalizeStampSignatureBlock`.
   */
  imageMaxWidthPx?: number;
  imageMaxHeightPx?: number;
  footerLineEnabled: boolean;
  footerLabelPosition: "bottom";
  /** Preview: flex spacer before this section when the page body has extra vertical space. */
  preferBottomWhenSpaceAvailable?: boolean;
};

export const DEFAULT_STAMP_SIGNATURE_BLOCK: StampSignatureBlockSettings = {
  cardMinHeightPx: 96,
  cardMaxHeightPx: 168,
  cardPaddingPx: 8,
  stampImageWidthPx: 132,
  stampImageHeightPx: 76,
  signatureImageWidthPx: 132,
  signatureImageHeightPx: 76,
  footerLineEnabled: true,
  footerLabelPosition: "bottom",
  preferBottomWhenSpaceAvailable: false,
};

/** Template Studio chrome only — persisted in `hisabix.wsv2.templateUi.v2` as `studioLayout`. */
export type StudioLayoutSettings = {
  leftPanelWidthPx: number;
  rightPanelWidthPx: number;
};

export const DEFAULT_STUDIO_LAYOUT: StudioLayoutSettings = {
  leftPanelWidthPx: 220,
  rightPanelWidthPx: 320,
};

export function clampStudioLayout(
  input: Partial<StudioLayoutSettings> & Record<string, unknown>,
): StudioLayoutSettings {
  const m = { ...DEFAULT_STUDIO_LAYOUT, ...input };
  return {
    leftPanelWidthPx: Math.min(360, Math.max(180, Math.round(Number(m.leftPanelWidthPx) || DEFAULT_STUDIO_LAYOUT.leftPanelWidthPx))),
    rightPanelWidthPx: Math.min(460, Math.max(260, Math.round(Number(m.rightPanelWidthPx) || DEFAULT_STUDIO_LAYOUT.rightPanelWidthPx))),
  };
}

/**
 * Merge persisted stamp/signature settings: map legacy `imageMax*` to stamp + signature boxes
 * when no dedicated keys were stored.
 */
export function normalizeStampSignatureBlock(
  input: Partial<StampSignatureBlockSettings> & Record<string, unknown>,
): StampSignatureBlockSettings {
  const merged: StampSignatureBlockSettings = {
    ...DEFAULT_STAMP_SIGNATURE_BLOCK,
    ...input,
  };
  const hasExplicitNew =
    input.stampImageWidthPx != null ||
    input.stampImageHeightPx != null ||
    input.signatureImageWidthPx != null ||
    input.signatureImageHeightPx != null;
  const legacyW = input.imageMaxWidthPx;
  const legacyH = input.imageMaxHeightPx;
  if (!hasExplicitNew && (legacyW != null || legacyH != null)) {
    const w = typeof legacyW === "number" && Number.isFinite(legacyW) ? legacyW : merged.stampImageWidthPx;
    const h = typeof legacyH === "number" && Number.isFinite(legacyH) ? legacyH : w;
    return {
      ...merged,
      stampImageWidthPx: w,
      stampImageHeightPx: h,
      signatureImageWidthPx: w,
      signatureImageHeightPx: h,
    };
  }
  return merged;
}

/** Persisted Studio document type (dropdown slug). Maps to `SchemaDocType`. */
export type StudioDocumentTypeSlug =
  | "tax-invoice"
  | "simplified-tax"
  | "quotation"
  | "proforma"
  | "credit-note"
  | "debit-note"
  | "delivery-note"
  | "purchase-order";

export const SLUG_TO_SCHEMA: Record<StudioDocumentTypeSlug, SchemaDocType> = {
  "tax-invoice": "tax_invoice",
  "simplified-tax": "simplified_tax_invoice",
  quotation: "quotation",
  proforma: "proforma_invoice",
  "credit-note": "credit_note",
  "debit-note": "debit_note",
  "delivery-note": "delivery_note",
  "purchase-order": "purchase_order",
};

export const SCHEMA_TO_SLUG: Record<SchemaDocType, StudioDocumentTypeSlug> = {
  tax_invoice: "tax-invoice",
  simplified_tax_invoice: "simplified-tax",
  quotation: "quotation",
  proforma_invoice: "proforma",
  credit_note: "credit-note",
  debit_note: "debit-note",
  delivery_note: "delivery-note",
  purchase_order: "purchase-order",
};

const SECTION_KEYS: SectionKey[] = [
  "header",
  "title",
  "customer",
  "docInfo",
  "items",
  "totals",
  "qr",
  "stampSignature",
  "footer",
];

function isSectionKey(x: string): x is SectionKey {
  return (SECTION_KEYS as string[]).includes(x);
}

export type TemplateUiSettings = {
  margins: TemplateMargins;
  showHeaderGreenAccent: boolean;
  cardBorder: CardBorderSettings;
  title: TemplateTitleSettings;
  typography: TemplateTypography;
  itemColumnWidths: Partial<Record<ColumnKey, number>>;
  /** Template Studio: item column px widths keyed by `templates[].id`. */
  itemColumnWidthsByTemplateId?: Record<string, Partial<Record<ColumnKey, number>>>;
  itemHeaderLabels: Partial<Record<ColumnKey, { en: string; ar: string }>>;
  /**
   * Hidden item columns (`true` = hidden). Persisted; merged with schema required columns.
   * Maps from flat keys `itemColumns.<key>.visible` (inverted: visible false → hidden true).
   */
  hiddenItemColumns?: Partial<Record<ColumnKey, boolean>>;
  infoCardLayout?: InfoCardLayoutSettings;
  /** QR card in document preview (split row / QR section). */
  qrBlock?: QrBlockSettings;
  /** Totals card dimensions + 3-column grid (preview + PDF). */
  totalsBlock?: TotalsBlockSettings;
  /** Three-card header row (English | logo | Arabic). */
  headerBlock?: HeaderBlockSettings;
  /** Stamp / signature baseline layout. */
  stampSignatureBlock?: StampSignatureBlockSettings;
  /**
   * @deprecated Legacy Studio accent; not used for document text. Kept only so old
   *   persisted JSON does not fail shape checks — do not map to typography.
   */
  accentColor?: string;
  /** Template Studio: persisted document type slug for the inspector dropdown. */
  studioDocumentType?: StudioDocumentTypeSlug;
  /** Template Studio: last-focused section (inspector + canvas). */
  selectedSection?: SectionKey;
  /** Template Studio: left / right sidebar widths (px). */
  studioLayout?: StudioLayoutSettings;
  /**
   * Table header row + optional card title bars (preview/PDF).
   * Default matches schema `COLORS.tableHeaderBg`.
   */
  headerRowColor?: string;
};

export const DEFAULT_MARGINS_MM: TemplateMargins = {
  topMm: 10,
  rightMm: 10,
  bottomMm: 10,
  leftMm: 10,
};

export const DEFAULT_TITLE: TemplateTitleSettings = {
  en: "",
  ar: "",
  enFontPx: 12,
  arFontPx: 12,
  /** Match body English typography — not accent green. */
  enColor: "#111827",
  arColor: "#111827",
  vatCompliantTitle: true,
};

export const DEFAULT_TYPOGRAPHY: TemplateTypography = {
  enFontStack: 'var(--font-body), "Segoe UI", Tahoma, system-ui, sans-serif',
  arFontStack:
    'var(--font-noto-sans-arabic), var(--font-tajawal), var(--font-ibm-plex-sans-arabic), sans-serif',
  enSizeScale: 1,
  arSizeScale: 1,
  enColor: "#111827",
  arColor: "#111827",
  english: { fontSize: 9 },
  arabic: { fontSize: 9 },
};

export const DEFAULT_CARD_BORDER: CardBorderSettings = {
  show: true,
  widthPx: 1,
  radiusPx: 6,
  color: "#E7ECEF",
};

export function defaultTemplateUi(): TemplateUiSettings {
  return {
    margins: { ...DEFAULT_MARGINS_MM },
    showHeaderGreenAccent: false,
    cardBorder: { ...DEFAULT_CARD_BORDER },
    title: { ...DEFAULT_TITLE },
    typography: { ...DEFAULT_TYPOGRAPHY },
    itemColumnWidths: {},
    itemColumnWidthsByTemplateId: {},
    itemHeaderLabels: {},
    hiddenItemColumns: {},
    infoCardLayout: { ...DEFAULT_INFO_CARD_LAYOUT },
    qrBlock: { ...DEFAULT_QR_BLOCK },
    totalsBlock: { ...DEFAULT_TOTALS_BLOCK },
    headerBlock: { ...DEFAULT_HEADER_BLOCK },
    stampSignatureBlock: { ...DEFAULT_STAMP_SIGNATURE_BLOCK },
    studioLayout: { ...DEFAULT_STUDIO_LAYOUT },
    studioDocumentType: "tax-invoice",
    headerRowColor: COLORS.tableHeaderBg,
  };
}

/**
 * Modern (slot #2) — card-forward, airy layout per `template-specs.md`: stronger
 * hierarchy, comfort table density, bilingual info panels (not compact).
 */
export function modernTemplatePresetUi(): TemplateUiSettings {
  return mergeTemplateUi(defaultTemplateUi(), {
    showHeaderGreenAccent: true,
    headerRowColor: "#E8F4EC",
    headerBlock: {
      ...DEFAULT_HEADER_BLOCK,
      structure: "two_column_logo_in_title",
      columnWidthMode: "equal",
      logoWidthPx: 100,
      logoHeightPx: 64,
    },
    typography: {
      ...DEFAULT_TYPOGRAPHY,
      enSizeScale: 1,
      arSizeScale: 1,
    },
    title: {
      ...DEFAULT_TITLE,
      enFontPx: 12,
      arFontPx: 12,
    },
    totalsBlock: {
      ...DEFAULT_TOTALS_BLOCK,
      totals_desc_align: "center",
      totals_currency_align: "center",
      totals_amount_align: "right",
    },
    infoCardLayout: {
      ...DEFAULT_INFO_CARD_LAYOUT,
      rowPaddingYPx: 4,
      rowGapPx: 4,
      cardPaddingPx: 8,
    },
  });
}

/** Dense / compact preset — visibly tighter than Standard and Modern. */
export function compactTemplatePresetUi(): TemplateUiSettings {
  return mergeTemplateUi(defaultTemplateUi(), {
    typography: {
      ...DEFAULT_TYPOGRAPHY,
      enSizeScale: 0.94,
      arSizeScale: 0.96,
    },
    cardBorder: {
      show: true,
      widthPx: 1,
      radiusPx: 6,
      color: "#CBD5E1",
    },
    headerRowColor: "#F8FAFC",
    showHeaderGreenAccent: false,
    margins: { topMm: 7, rightMm: 7, bottomMm: 7, leftMm: 7 },
    headerBlock: {
      ...DEFAULT_HEADER_BLOCK,
      cardPaddingPx: 8,
      cardGapPx: 8,
      logoWidthPx: 96,
      logoHeightPx: 80,
      englishCompanyNameFontPx: 12,
      arabicCompanyNameFontPx: 12,
    },
    infoCardLayout: {
      ...DEFAULT_INFO_CARD_LAYOUT,
      rowPaddingYPx: 2,
      rowGapPx: 2,
      cardPaddingPx: 6,
    },
  });
}

/** Preset: plain workspace default. */
export function defaultPresetUi(): TemplateUiSettings {
  return defaultTemplateUi();
}

/**
 * Preset: ZATCA-oriented presentation (foundation only — not validated clearance).
 * Slightly stricter visual defaults, bilingual-friendly.
 */
export function zatcaStandardPresetUi(): TemplateUiSettings {
  const base = defaultTemplateUi();
  return {
    ...base,
    margins: { topMm: 10, rightMm: 10, bottomMm: 10, leftMm: 10 },
    showHeaderGreenAccent: false,
    title: {
      ...base.title,
      vatCompliantTitle: true,
    },
  };
}

/**
 * Migrate raw localStorage JSON: flat color keys, legacy QR defaults, invalid shapes.
 * Does not strip valid user overrides except known legacy QR fingerprint.
 */
export function migrateTemplateUiPayload(input: unknown): Partial<TemplateUiSettings> {
  if (!input || typeof input !== "object") return {};
  const p = input as Record<string, unknown>;
  const out: Partial<TemplateUiSettings> = { ...(p as Partial<TemplateUiSettings>) };

  const flatEn = p.english_font_color;
  const flatAr = p.arabic_font_color;
  if (typeof flatEn === "string") {
    out.typography = { ...(out.typography as TemplateTypography), enColor: flatEn } as TemplateTypography;
  }
  if (typeof flatAr === "string") {
    out.typography = { ...(out.typography as TemplateTypography), arColor: flatAr } as TemplateTypography;
  }

  const typo = out.typography as TemplateTypography | undefined;
  if (typo?.english?.color) {
    out.typography = { ...typo, enColor: typo.english.color };
  }
  if (typo?.arabic?.color) {
    out.typography = { ...typo, arColor: typo.arabic.color };
  }

  const qb = out.qrBlock;
  if (
    qb &&
    qb.cardWidthPx === 390 &&
    qb.imageSizePx === 92 &&
    qb.align === "right"
  ) {
    out.qrBlock = { ...DEFAULT_QR_BLOCK };
  }

  if (typeof out.selectedSection === "string" && !isSectionKey(out.selectedSection)) {
    delete out.selectedSection;
  }
  if (typeof out.studioDocumentType === "string") {
    if (!(out.studioDocumentType in SLUG_TO_SCHEMA)) {
      delete out.studioDocumentType;
    }
  }

  const title = out.title as TemplateTitleSettings | undefined;
  const typoM = out.typography as TemplateTypography | undefined;
  if (title?.enColor && /^#2[fF][aA]e2[bB]$/.test(title.enColor.replace(/\s/g, ""))) {
    const en = typoM?.enColor ?? DEFAULT_TYPOGRAPHY.enColor;
    out.title = { ...title, enColor: en };
  }
  if (title?.arColor && /^#2[fF][aA]e2[bB]$/.test(title.arColor.replace(/\s/g, ""))) {
    const ar = typoM?.arColor ?? DEFAULT_TYPOGRAPHY.arColor;
    out.title = { ...title, arColor: ar };
  }

  const sl = out.studioLayout as Partial<StudioLayoutSettings> | undefined;
  if (sl && (sl.leftPanelWidthPx != null || sl.rightPanelWidthPx != null)) {
    out.studioLayout = clampStudioLayout(sl);
  }

  const hb = out.headerBlock as Partial<HeaderBlockSettings> | undefined;
  if (hb && hb.columnWidthMode == null) {
    out.headerBlock = { ...DEFAULT_HEADER_BLOCK, ...hb, columnWidthMode: "equal" };
  }
  const hb2 = out.headerBlock as Partial<HeaderBlockSettings> | undefined;
  if (hb2) {
    const clampPx = (n: unknown) => {
      const v = Math.round(Number(n));
      if (!Number.isFinite(v)) return undefined;
      return Math.min(18, Math.max(7, v));
    };
    const en = clampPx(hb2.englishCompanyNameFontPx);
    const ar = clampPx(hb2.arabicCompanyNameFontPx);
    out.headerBlock = {
      ...DEFAULT_HEADER_BLOCK,
      ...hb2,
      ...(en != null ? { englishCompanyNameFontPx: en } : {}),
      ...(ar != null ? { arabicCompanyNameFontPx: ar } : {}),
    };
  }

  const titleMig = out.title as TemplateTitleSettings | undefined;
  let titleNext = titleMig;
  if (titleNext && typeof titleNext.enFontPx === "number") {
    const v = Math.round(titleNext.enFontPx);
    if (
      (v >= 24 && v <= 28) ||
      v === 21 ||
      v === 22 ||
      v === 25 ||
      v === 27 ||
      v === 18
    ) {
      titleNext = { ...titleNext, enFontPx: 12 };
    }
  }
  if (titleNext && typeof titleNext.arFontPx === "number") {
    const v = Math.round(titleNext.arFontPx);
    if ([18, 21, 22].includes(v) || v >= 25) titleNext = { ...titleNext, arFontPx: 12 };
  }
  if (titleNext !== titleMig && titleNext) out.title = titleNext;

  const typoMig = out.typography as TemplateTypography | undefined;
  if (
    typoMig?.english?.fontSize === 12 ||
    typoMig?.arabic?.fontSize === 12
  ) {
    out.typography = {
      ...DEFAULT_TYPOGRAPHY,
      ...typoMig,
      english: { ...typoMig?.english, fontSize: 9 },
      arabic: { ...typoMig?.arabic, fontSize: 9 },
    };
  }

  const looseFinal = out as Record<string, unknown>;
  delete looseFinal.english_font_color;
  delete looseFinal.arabic_font_color;

  const icRaw = out.infoCardLayout as Record<string, unknown> | undefined;
  if (icRaw && typeof icRaw === "object") {
    const merged = { ...DEFAULT_INFO_CARD_LAYOUT, ...icRaw } as InfoCardLayoutSettings;
    const legacyMin = icRaw.cardMinHeightPx;
    if (typeof legacyMin === "number" && legacyMin > 0) {
      if (merged.clientCardMinHeightPx === 0) merged.clientCardMinHeightPx = legacyMin;
      if (merged.documentCardMinHeightPx === 0) merged.documentCardMinHeightPx = legacyMin;
    }
    delete (merged as Record<string, unknown>).cardMinHeightPx;
    out.infoCardLayout = merged;
  }

  const itemKeysBase: ColumnKey[] = [
    "index",
    "description",
    "quantity",
    "unit",
    "price",
    "taxableAmount",
    "vatRate",
    "vatAmount",
    "lineTotal",
  ];
  const collectMigrateItemKeys = (rec?: Partial<Record<ColumnKey, number>>): ColumnKey[] => {
    const k = [...itemKeysBase];
    if (!rec) return k;
    for (const key of Object.keys(rec) as ColumnKey[]) {
      if (!k.includes(key)) k.push(key);
    }
    return k;
  };
  const migMargins = out.margins ?? DEFAULT_MARGINS_MM;
  const itemTargetPx = getItemsTableInnerTargetPx(migMargins, { sectionPaddingPx: 8, borderPx: 1 });

  const iwGlob = out.itemColumnWidths as Partial<Record<ColumnKey, number>> | undefined;
  if (iwGlob && Object.keys(iwGlob).length > 0) {
    const k = collectMigrateItemKeys(iwGlob);
    out.itemColumnWidths = {
      ...iwGlob,
      ...sanitizeItemColumnWidthRecord(k, iwGlob, itemTargetPx),
    };
  }
  const byT = out.itemColumnWidthsByTemplateId;
  if (byT && typeof byT === "object") {
    const nextMap: Record<string, Partial<Record<ColumnKey, number>>> = { ...byT };
    for (const [tid, rec] of Object.entries(byT)) {
      if (!rec || typeof rec !== "object") continue;
      const r = rec as Partial<Record<ColumnKey, number>>;
      const keys = collectMigrateItemKeys(r);
      nextMap[tid] = { ...r, ...sanitizeItemColumnWidthRecord(keys, r, itemTargetPx) };
    }
    out.itemColumnWidthsByTemplateId = nextMap;
  }

  const hbName = out.headerBlock as Partial<HeaderBlockSettings> | undefined;
  if (
    hbName &&
    typeof hbName.englishCompanyNameFontPx === "number"
  ) {
    const vn = Math.round(hbName.englishCompanyNameFontPx);
    if (vn === 14 || vn === 16 || vn === 18) {
      out.headerBlock = { ...DEFAULT_HEADER_BLOCK, ...hbName, englishCompanyNameFontPx: 12 };
    }
  }
  const hbAr = out.headerBlock as Partial<HeaderBlockSettings> | undefined;
  if (hbAr && typeof hbAr.arabicCompanyNameFontPx === "number") {
    const va = Math.round(hbAr.arabicCompanyNameFontPx);
    if (va === 14 || va === 16 || va === 18) {
      out.headerBlock = { ...DEFAULT_HEADER_BLOCK, ...hbAr, arabicCompanyNameFontPx: 12 };
    }
  }

  return out;
}

export function readTemplateUiFromStorage(): TemplateUiSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    const v3legacy = window.localStorage.getItem(LEGACY_TEMPLATE_UI_STORAGE_KEY_V3);
    const v1 = window.localStorage.getItem(LEGACY_TEMPLATE_UI_STORAGE_KEY_V1);
    const raw = current ?? v3legacy ?? v1;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    const merged = mergeTemplateUi(defaultTemplateUi(), migrateTemplateUiPayload(parsed));
    if (v3legacy || v1) {
      try {
        window.localStorage.removeItem(LEGACY_TEMPLATE_UI_STORAGE_KEY_V3);
        window.localStorage.removeItem(LEGACY_TEMPLATE_UI_STORAGE_KEY_V1);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        /* ignore quota */
      }
    }
    return merged;
  } catch {
    return null;
  }
}

/** Reset Studio template UI to defaults (client-only). */
export function clearTemplateUiStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_TEMPLATE_UI_STORAGE_KEY_V3);
    window.localStorage.removeItem(LEGACY_TEMPLATE_UI_STORAGE_KEY_V1);
  } catch {
    /* ignore */
  }
}

export function writeTemplateUiToStorage(ui: TemplateUiSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ui));
  } catch {
    /* ignore */
  }
}

/** Shallow patch for `mergeTemplateUi` with nested partials for block settings. */
export type TemplateUiMergePatch = Omit<
  Partial<TemplateUiSettings>,
  "headerBlock" | "stampSignatureBlock" | "infoCardLayout" | "qrBlock" | "totalsBlock" | "studioLayout"
> & {
  infoCardLayout?: Partial<InfoCardLayoutSettings>;
  qrBlock?: Partial<QrBlockSettings>;
  totalsBlock?: Partial<TotalsBlockSettings>;
  headerBlock?: Partial<HeaderBlockSettings>;
  stampSignatureBlock?: Partial<StampSignatureBlockSettings>;
  studioLayout?: Partial<StudioLayoutSettings>;
};

export function mergeTemplateUi(
  base: TemplateUiSettings,
  patch: TemplateUiMergePatch,
): TemplateUiSettings {
  const clampCompanyNamePx = (n: unknown): number => {
    const next = Number(n);
    if (!Number.isFinite(next)) return 12;
    return Math.min(18, Math.max(7, Math.round(next)));
  };

  const mergedTypo: TemplateTypography = {
    ...base.typography,
    ...patch.typography,
    english: { ...base.typography.english, ...patch.typography?.english },
    arabic: { ...base.typography.arabic, ...patch.typography?.arabic },
  };
  if (mergedTypo.english?.color) {
    mergedTypo.enColor = mergedTypo.english.color;
  }
  if (mergedTypo.arabic?.color) {
    mergedTypo.arColor = mergedTypo.arabic.color;
  }
  if (mergedTypo.english?.fontFamily) {
    mergedTypo.enFontStack = mergedTypo.english.fontFamily;
  }
  if (mergedTypo.arabic?.fontFamily) {
    mergedTypo.arFontStack = mergedTypo.arabic.fontFamily;
  }
  const mergedHeaderBlock = { ...DEFAULT_HEADER_BLOCK, ...base.headerBlock, ...patch.headerBlock };
  return {
    ...base,
    ...patch,
    margins: { ...base.margins, ...patch.margins },
    cardBorder: { ...base.cardBorder, ...patch.cardBorder },
    title: { ...base.title, ...patch.title },
    typography: mergedTypo,
    itemColumnWidths: { ...base.itemColumnWidths, ...patch.itemColumnWidths },
    itemColumnWidthsByTemplateId: {
      ...base.itemColumnWidthsByTemplateId,
      ...patch.itemColumnWidthsByTemplateId,
    },
    itemHeaderLabels: mergeItemHeaderLabels(base.itemHeaderLabels, patch.itemHeaderLabels),
    hiddenItemColumns: { ...base.hiddenItemColumns, ...patch.hiddenItemColumns },
    infoCardLayout: {
      ...DEFAULT_INFO_CARD_LAYOUT,
      ...base.infoCardLayout,
      ...patch.infoCardLayout,
    },
    qrBlock: { ...DEFAULT_QR_BLOCK, ...base.qrBlock, ...patch.qrBlock },
    totalsBlock: { ...DEFAULT_TOTALS_BLOCK, ...base.totalsBlock, ...patch.totalsBlock },
    headerBlock: {
      ...mergedHeaderBlock,
      englishCompanyNameFontPx: clampCompanyNamePx(mergedHeaderBlock.englishCompanyNameFontPx ?? 12),
      arabicCompanyNameFontPx: clampCompanyNamePx(mergedHeaderBlock.arabicCompanyNameFontPx ?? 12),
    },
    stampSignatureBlock: normalizeStampSignatureBlock({
      ...DEFAULT_STAMP_SIGNATURE_BLOCK,
      ...base.stampSignatureBlock,
      ...patch.stampSignatureBlock,
    }),
    studioLayout: clampStudioLayout({
      ...DEFAULT_STUDIO_LAYOUT,
      ...base.studioLayout,
      ...patch.studioLayout,
    }),
    studioDocumentType: patch.studioDocumentType ?? base.studioDocumentType,
    selectedSection: patch.selectedSection ?? base.selectedSection,
    headerRowColor: patch.headerRowColor ?? base.headerRowColor,
  };
}

const ASSET_STORAGE = {
  logo: "hisabix.wsv2.templateAsset.logo",
  stamp: "hisabix.wsv2.templateAsset.stamp",
  signature: "hisabix.wsv2.templateAsset.signature",
  signatory: "hisabix.wsv2.templateAsset.signatory",
  designation: "hisabix.wsv2.templateAsset.designation",
} as const;

export type TemplateAssetState = {
  logoDataUrl: string | null;
  stampDataUrl: string | null;
  signatureDataUrl: string | null;
  signatoryName: string;
  signatoryDesignation: string;
};

export function defaultTemplateAssets(): TemplateAssetState {
  return {
    logoDataUrl: null,
    stampDataUrl: null,
    signatureDataUrl: null,
    signatoryName: "",
    signatoryDesignation: "",
  };
}

export function readTemplateAssetsFromStorage(): TemplateAssetState {
  if (typeof window === "undefined") return defaultTemplateAssets();
  try {
    return {
      logoDataUrl: window.localStorage.getItem(ASSET_STORAGE.logo),
      stampDataUrl: window.localStorage.getItem(ASSET_STORAGE.stamp),
      signatureDataUrl: window.localStorage.getItem(ASSET_STORAGE.signature),
      signatoryName: window.localStorage.getItem(ASSET_STORAGE.signatory) ?? "",
      signatoryDesignation: window.localStorage.getItem(ASSET_STORAGE.designation) ?? "",
    };
  } catch {
    return defaultTemplateAssets();
  }
}

export function writeTemplateAsset(
  key: keyof typeof ASSET_STORAGE,
  value: string | null,
): void {
  if (typeof window === "undefined") return;
  try {
    if (value == null) window.localStorage.removeItem(ASSET_STORAGE[key]);
    else window.localStorage.setItem(ASSET_STORAGE[key], value);
  } catch {
    /* quota */
  }
}

/** Re-export of canvas layout tokens (Standard / Modern / Compact) owned in `layout-style-contract.ts`. */
export { LAYOUT_STYLE_CONTRACT as TEMPLATE_STYLE_LAYOUT_TOKENS } from "@/lib/template-engine/layout-style-contract";
