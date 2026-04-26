// Workspace — Template UI settings (Template Studio + preview + PDF).
// Preview persistence: localStorage only (no backend claim).

import {
  COLUMN_LABELS,
  type ColumnKey,
  type SchemaDocType,
  type SectionKey,
} from "./document-template-schemas";

/** Millimetres → CSS pixels at 96dpi. */
export function mmToPx(mm: number): number {
  return (mm * 96) / 25.4;
}

/** Riyal display in totals (per product spec — Unicode Saudi Riyal / legacy forms vary by font). */
export const TOTALS_RIYAL_GLYPH = "⃁";

/**
 * Workspace Template Studio persisted UI (documented for migration).
 * Includes `studioLayout` (left/right panel widths) — same key, no separate store.
 */
export const TEMPLATE_UI_STORAGE_KEY = "hisabix.wsv2.templateUi.v1";
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
  cardWidthPx: 150,
  cardMinHeightPx: 120,
  imageSizePx: 125,
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
  cardWidthPx: 430,
  cardMinHeightPx: 0,
  cardPaddingPx: 12,
  rowGapPx: 6,
  totals_desc_col_width_px: 260,
  totals_currency_col_width_px: 10,
  totals_amount_col_width_px: 117,
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
  rowPaddingYPx: 8,
  rowGapPx: 2,
  cardPaddingPx: 18,
  englishColumnWidthPx: 150,
  valueColumnWidthPx: 250,
  arabicColumnWidthPx: 150,
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

export type HeaderBlockSettings = {
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
};

export const DEFAULT_HEADER_BLOCK: HeaderBlockSettings = {
  columnWidthMode: "equal",
  englishCardWidthPx: 240,
  /** Middle column: wide enough for default logo box (150px) + card padding without crowding. */
  logoCardWidthPx: 248,
  arabicCardWidthPx: 240,
  cardGapPx: 12,
  cardPaddingPx: 12,
  /** Max box for logo; preview/PDF use contain-style fitting so aspect ratio is preserved (no stretch/crop). */
  logoWidthPx: 150,
  logoHeightPx: 150,
  logoAlign: "center",
  englishAlign: "left",
  arabicAlign: "right",
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
  cardMinHeightPx: 140,
  cardMaxHeightPx: 220,
  cardPaddingPx: 12,
  stampImageWidthPx: 150,
  stampImageHeightPx: 90,
  signatureImageWidthPx: 150,
  signatureImageHeightPx: 90,
  footerLineEnabled: true,
  footerLabelPosition: "bottom",
  preferBottomWhenSpaceAvailable: true,
};

/** Template Studio chrome only — persisted in `hisabix.wsv2.templateUi.v1` as `studioLayout`. */
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
  enFontPx: 25,
  arFontPx: 21,
  /** Match body English typography — not accent green. */
  enColor: "#111827",
  arColor: "#111827",
  vatCompliantTitle: true,
};

export const DEFAULT_TYPOGRAPHY: TemplateTypography = {
  enFontStack: "Inter, system-ui, 'Segoe UI', Roboto, Arial, sans-serif",
  arFontStack: "'Noto Naskh Arabic', 'Noto Sans Arabic', 'Arial Unicode MS', Tahoma, sans-serif",
  enSizeScale: 1,
  arSizeScale: 1,
  enColor: "#111827",
  arColor: "#111827",
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
  };
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

  const loose = out as Record<string, unknown>;
  delete loose.english_font_color;
  delete loose.arabic_font_color;

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

  return out;
}

export function readTemplateUiFromStorage(): TemplateUiSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return mergeTemplateUi(defaultTemplateUi(), migrateTemplateUiPayload(parsed));
  } catch {
    return null;
  }
}

/** Reset Studio template UI to defaults (client-only). */
export function clearTemplateUiStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
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
    headerBlock: { ...DEFAULT_HEADER_BLOCK, ...base.headerBlock, ...patch.headerBlock },
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

