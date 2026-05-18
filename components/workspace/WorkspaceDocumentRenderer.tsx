"use client";

// Workspace — schema-driven document renderer (Wafeq Format 2).
//
// Reads the layout from `buildDocumentLayout()` so the browser preview, the
// Template Studio canvas, and the PDF export all share the same coordinate
// system. Section dimensions, customer/document info rows, items column
// widths, totals/QR split, stamp/signature blocks and footer are ALL derived
// from the schema — none of it is invented here.

import Image from "next/image";
import { forwardRef, Fragment, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  ForwardedRef,
  MutableRefObject,
  ReactNode,
  PointerEvent as ReactPointerEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import type { DocumentRecord, Customer } from "@/lib/workspace/types";
import { previewCompany } from "@/data/preview-company";
import {
  PAGE_GEOMETRY,
  SECTION_LABELS,
  SPACING,
  TYPOGRAPHY,
  type ColumnKey,
  type DocumentTemplateSchema,
  type FieldKey,
  type LangMode,
  type SectionKey,
  type TemplateStyle,
} from "@/lib/workspace/document-template-schemas";
import {
  applyBoundaryDragPx,
  fitItemColumnWidthsToTarget,
  getItemsTableInnerTargetPx,
  isWrappingItemColumn,
  itemColumnMinPx,
  sanitizeItemColumnWidthRecord,
} from "@/lib/workspace/item-column-resize";
import { LAYOUT_STYLE_CONTRACT } from "@/lib/template-engine/layout-style-contract";
import {
  buildDocumentLayout,
  bilingualLabel,
  type LayoutInfoRow,
  type LayoutPlan,
  type LayoutSection,
  type RenderCustomer,
  type RenderSeller,
} from "@/lib/workspace/document-template-renderer";
import {
  containsArabic,
  isPrimarilyArabicBlock,
  rtlPlaintextBlockStyle,
} from "@/lib/workspace/document-bidi";
import {
  type TemplateAssetState,
  type TemplateUiSettings,
  type QrBlockSettings,
  type TotalsBlockSettings,
  DEFAULT_QR_BLOCK,
  DEFAULT_TOTALS_BLOCK,
  defaultTemplateUi,
} from "@/lib/workspace/template-ui-settings";
import { Eye } from "lucide-react";

function assignForwardedRef<T>(r: ForwardedRef<T>, value: T | null): void {
  if (typeof r === "function") r(value);
  else if (r != null) (r as MutableRefObject<T | null>).current = value;
}

export type RendererSeller = RenderSeller;
export type RendererCustomer = RenderCustomer;

export type RendererOptions = {
  schema: DocumentTemplateSchema;
  doc: DocumentRecord;
  seller: RendererSeller;
  customer: RendererCustomer;
  language: LangMode;
  style?: TemplateStyle;
  hiddenSections?: Partial<Record<SectionKey, boolean>>;
  hiddenFields?: Partial<Record<FieldKey, boolean>>;
  hiddenColumns?: Partial<Record<ColumnKey, boolean>>;
  columnOrder?: ColumnKey[];
  density?: "compact" | "normal" | "wide";
  activeSection?: SectionKey;
  onSectionSelect?: (id: SectionKey) => void;
  setSectionRef?: (id: SectionKey, node: HTMLDivElement | null) => void;
  qrImageDataUrl?: string | null;
  ui?: TemplateUiSettings;
  templateAssets?: TemplateAssetState;
  /** Template Studio: live drag to resize product table columns (persisted with `templateId`). */
  resizableItemColumns?: boolean;
  onItemColumnWidthChange?: (widths: Partial<Record<ColumnKey, number>>) => void;
  /** Must match the template being edited in Studio for per-template column widths. */
  templateId?: string;
  /** Inline Template Studio controls (popover triggers) — never used for PDF. */
  studioControls?: {
    enabled: boolean;
    openHeaderNameSize?: (event: ReactMouseEvent<HTMLElement>) => void;
    openCustomerFields?: (event: ReactMouseEvent<HTMLElement>) => void;
    openDocumentFields?: (event: ReactMouseEvent<HTMLElement>) => void;
    openItemColumns?: (event: ReactMouseEvent<HTMLElement>) => void;
    openItemHeading?: (event: ReactMouseEvent<HTMLElement>, column: ColumnKey) => void;
  };
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function dirFor(language: LangMode): "ltr" | "rtl" {
  return language === "arabic" ? "rtl" : "ltr";
}

function biLabel(en: string, ar: string, language: LangMode): ReactNode {
  if (language === "english") return en;
  if (language === "arabic") return ar;
  return (
    <>
      <span className="wsv2-bi-en">{en}</span>
      <span className="wsv2-bi-ar" lang="ar" dir="rtl">
        {" "}
        {ar}
      </span>
    </>
  );
}

/** Long bilingual / legal text in info cards (not items table numerics). */
const CELL_WRAP_SAFE: CSSProperties = {
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  whiteSpace: "normal",
};

const CELL_NOWRAP: CSSProperties = {
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  whiteSpace: "nowrap",
  overflowWrap: "normal",
  wordBreak: "normal",
  fontVariantNumeric: "tabular-nums",
};

const CELL_DESC_WRAP: CSSProperties = {
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  whiteSpace: "normal",
  overflowWrap: "anywhere",
  wordBreak: "normal",
};

/** Scale inner content uniformly to fit fixed header card height (does not expand the card). */
function FitHeaderTextBlock({
  outerMaxHeightPx,
  transformOrigin,
  rerunKey,
  children,
}: {
  outerMaxHeightPx: number;
  transformOrigin: string;
  rerunKey: string;
  children: React.ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    inner.style.transform = "scale(1)";
    inner.style.transformOrigin = transformOrigin;
    inner.style.width = "100%";

    const ih = Math.max(1, inner.scrollHeight);
    const iw = Math.max(1, inner.scrollWidth);
    const oh = Math.max(1, outer.clientHeight);
    const ow = Math.max(1, outer.clientWidth);
    let s = Math.min(oh / ih, ow / iw, 1);
    const minS = 6 / 12;
    s = Math.max(minS, Number.isFinite(s) ? s : 1);
    inner.style.transform = `scale(${s})`;
  }, [outerMaxHeightPx, transformOrigin, rerunKey]);

  return (
    <div
      ref={outerRef}
      style={{
        flex: "1 1 auto",
        minHeight: 0,
        maxHeight: outerMaxHeightPx,
        height: outerMaxHeightPx,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div ref={innerRef} style={{ width: "100%", boxSizing: "border-box" }}>
        {children}
      </div>
    </div>
  );
}

function HeaderSection({
  layout,
  language,
  showHeaderAccent,
  logoDataUrl,
  textColors,
  cardBorder,
  studioControls,
}: {
  layout: LayoutPlan;
  language: LangMode;
  showHeaderAccent: boolean;
  logoDataUrl: string | null;
  textColors: { english: string; arabic: string };
  cardBorder: TemplateUiSettings["cardBorder"];
  studioControls?: RendererOptions["studioControls"];
}) {
  const hb = layout.headerBlock;
  const englishCompanyNameFontPx = hb.englishCompanyNameFontPx ?? 12;
  const arabicCompanyNameFontPx = hb.arabicCompanyNameFontPx ?? 12;
  const headerCardPx =
    hb.headerCardMaxHeightPx ?? hb.headerCardHeightPx ?? 108;
  const headerDetailLinePx =
    hb.headerLineFontPx ?? TYPOGRAPHY.smallPx ?? 8;
  const innerFitMaxPx = Math.max(40, headerCardPx - 2 * hb.cardPaddingPx);
  const headerFitKey = `${language}|${layout.seller.nameEn}|${layout.seller.addressEn}|${layout.seller.nameAr}|${layout.seller.addressAr}`;
  const headerSec = layout.sections.find((s) => s.id === "header");
  const avail = headerSec ? Math.max(200, headerSec.widthPx - 28) : 640;
  const gap = hb.cardGapPx;
  const twoColTitleLogo = hb.structure === "two_column_logo_in_title";
  let gridTemplateColumns: string;
  if (twoColTitleLogo) {
    if (hb.columnWidthMode === "custom") {
      let wEn = hb.englishCardWidthPx;
      let wAr = hb.arabicCardWidthPx;
      const raw = wEn + wAr + gap;
      if (raw > avail && raw > 0) {
        const s = avail / raw;
        wEn *= s;
        wAr *= s;
      }
      gridTemplateColumns = `${wEn}px ${wAr}px`;
    } else {
      gridTemplateColumns = "minmax(0, 1fr) minmax(0, 1fr)";
    }
  } else if (hb.columnWidthMode === "custom") {
    let wEn = hb.englishCardWidthPx;
    let wLogo = hb.logoCardWidthPx;
    let wAr = hb.arabicCardWidthPx;
    const raw = wEn + wLogo + wAr + 2 * gap;
    if (raw > avail && raw > 0) {
      const s = avail / raw;
      wEn *= s;
      wLogo *= s;
      wAr *= s;
    }
    gridTemplateColumns = `${wEn}px ${wLogo}px ${wAr}px`;
  } else {
    gridTemplateColumns = "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)";
  }

  const enFont = layout.bodyFonts.english;

  const cardShell = (): CSSProperties => ({
    boxSizing: "border-box",
    padding: hb.cardPaddingPx,
    borderRadius: cardBorder.radiusPx,
    ...(cardBorder.show
      ? { border: `${cardBorder.widthPx}px solid ${cardBorder.color}` }
      : { border: "none" }),
    background: "#ffffff",
    minWidth: 0,
    maxWidth: "100%",
    height: headerCardPx,
    maxHeight: headerCardPx,
    minHeight: headerCardPx,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  });

  const showEn = language !== "arabic";
  const showAr = language !== "english";

  const nameEnIsArabic = isPrimarilyArabicBlock(layout.seller.nameEn);
  const addrEnIsArabic = isPrimarilyArabicBlock(layout.seller.addressEn);
  const arAlignKey = hb.arabicAlign === "left" ? "left" : hb.arabicAlign === "center" ? "center" : "right";
  const arBlockBidi = rtlPlaintextBlockStyle(arAlignKey);

  const enAlignItems =
    hb.englishAlign === "right" ? "flex-end" : hb.englishAlign === "center" ? "center" : "flex-start";
  const arAlignItems =
    hb.arabicAlign === "left" ? "flex-start" : hb.arabicAlign === "center" ? "center" : "flex-end";

  const logoJustify =
    hb.logoAlign === "left" ? "flex-start" : hb.logoAlign === "right" ? "flex-end" : "center";

  return (
    <div
      className="wsv2-header-card-grid"
      style={{
        display: "grid",
        gridTemplateColumns,
        gap,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        ...(showHeaderAccent
          ? { borderTop: `${SPACING.topAccentPx}px solid ${textColors.english}` }
          : {}),
      }}
    >
      <div
        className="wsv2-header-card-en"
        dir="ltr"
        lang="en"
        style={{
          ...cardShell(),
          gap: 3,
          alignItems: enAlignItems,
          textAlign: hb.englishAlign,
          fontFamily: enFont,
          color: textColors.english,
        }}
      >
        <FitHeaderTextBlock outerMaxHeightPx={innerFitMaxPx} transformOrigin="top left" rerunKey={headerFitKey}>
          {showEn ? (
          <>
            {studioControls?.enabled && studioControls.openHeaderNameSize ? (
              <button
                type="button"
                data-testid="studio-header-company-name-size-trigger"
                className="wsv2-wf-seller-name wsv2-studio-inline-trigger"
                {...(nameEnIsArabic ? { dir: "rtl" as const, lang: "ar" as const } : {})}
                style={{
                  color: textColors.english,
                  fontSize: englishCompanyNameFontPx,
                  lineHeight: 1.15,
                  minWidth: 0,
                  maxWidth: "100%",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                  whiteSpace: "normal",
                  boxSizing: "border-box",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "inherit",
                  fontFamily: "inherit",
                  ...(nameEnIsArabic ? rtlPlaintextBlockStyle("right") : {}),
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  studioControls.openHeaderNameSize?.(event);
                }}
              >
                {layout.seller.nameEn}
              </button>
            ) : (
              <div
                className="wsv2-wf-seller-name"
                {...(nameEnIsArabic ? { dir: "rtl" as const, lang: "ar" as const } : {})}
                style={{
                  color: textColors.english,
                  fontSize: englishCompanyNameFontPx,
                  lineHeight: 1.15,
                  minWidth: 0,
                  maxWidth: "100%",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                  whiteSpace: "normal",
                  boxSizing: "border-box",
                  ...(nameEnIsArabic ? rtlPlaintextBlockStyle("right") : {}),
                }}
              >
                {layout.seller.nameEn}
              </div>
            )}
            {layout.seller.addressEn ? (
              <div
                className="wsv2-wf-line"
                {...(addrEnIsArabic ? { dir: "rtl" as const, lang: "ar" as const } : {})}
                style={{
                  color: textColors.english,
                  fontSize: headerDetailLinePx,
                  ...CELL_WRAP_SAFE,
                  ...(addrEnIsArabic ? rtlPlaintextBlockStyle("right") : {}),
                }}
              >
                {layout.seller.addressEn}
              </div>
            ) : null}
            {layout.seller.email ? (
              <div
                className="wsv2-wf-line"
                dir="ltr"
                style={{
                  color: textColors.english,
                  fontSize: headerDetailLinePx,
                  unicodeBidi: "plaintext",
                  ...CELL_WRAP_SAFE,
                }}
              >
                {layout.seller.email}
              </div>
            ) : null}
            {layout.seller.vatValue ? (
              <div className="wsv2-wf-line" style={{ color: textColors.english, fontSize: headerDetailLinePx, ...CELL_WRAP_SAFE }}>
                <span className="wsv2-wf-line-label" style={{ color: textColors.english }}>
                  {layout.seller.vatLabelEn}
                </span>{" "}
                <span dir="ltr" style={{ ...CELL_NOWRAP, unicodeBidi: "plaintext" }}>
                  {layout.seller.vatValue}
                </span>
              </div>
            ) : null}
            {layout.seller.crValue ? (
              <div className="wsv2-wf-line" style={{ color: textColors.english, fontSize: headerDetailLinePx, ...CELL_WRAP_SAFE }}>
                <span className="wsv2-wf-line-label" style={{ color: textColors.english }}>
                  {layout.seller.crLabelEn}
                </span>{" "}
                <span dir="ltr" style={{ ...CELL_NOWRAP, unicodeBidi: "plaintext" }}>
                  {layout.seller.crValue}
                </span>
              </div>
            ) : null}
          </>
        ) : null}
        </FitHeaderTextBlock>
      </div>

      {twoColTitleLogo ? null : (
      <div
        className="wsv2-header-card-logo"
        style={{
          ...cardShell(),
          display: "flex",
          alignItems: "center",
          justifyContent: logoJustify,
          fontFamily: enFont,
        }}
      >
        {logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoDataUrl}
            alt=""
            className="wsv2-header-logo-image"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              flexShrink: 0,
              display: "block",
            }}
          />
        ) : (
          <div
            className="wsv2-wf-logo-box"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: Math.min(hb.logoWidthPx, 96),
              height: Math.min(hb.logoHeightPx, 72),
              boxSizing: "border-box",
            }}
            aria-hidden="true"
          />
        )}
      </div>
      )}

      <div
        className="wsv2-header-card-ar"
        dir="rtl"
        lang="ar"
        style={{
          ...cardShell(),
          ...arBlockBidi,
          gap: 3,
          alignItems: arAlignItems,
          textAlign: hb.arabicAlign,
          color: textColors.arabic,
        }}
      >
        <FitHeaderTextBlock outerMaxHeightPx={innerFitMaxPx} transformOrigin="top right" rerunKey={headerFitKey}>
        {showAr ? (
          <>
            {layout.seller.nameAr || layout.seller.nameEn ? (
              studioControls?.enabled && studioControls.openHeaderNameSize ? (
                <button
                  type="button"
                  data-testid="studio-header-company-name-size-trigger"
                  className="wsv2-wf-seller-name wsv2-studio-inline-trigger"
                  style={{
                    color: textColors.arabic,
                    fontSize: arabicCompanyNameFontPx,
                    lineHeight: 1.15,
                    minWidth: 0,
                    maxWidth: "100%",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                    boxSizing: "border-box",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    textAlign: "inherit",
                    fontFamily: "inherit",
                    ...rtlPlaintextBlockStyle(arAlignKey),
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    studioControls.openHeaderNameSize?.(event);
                  }}
                >
                  {layout.seller.nameAr || layout.seller.nameEn}
                </button>
              ) : (
                <div
                  className="wsv2-wf-seller-name"
                  style={{
                    color: textColors.arabic,
                    fontSize: arabicCompanyNameFontPx,
                    lineHeight: 1.15,
                    minWidth: 0,
                    maxWidth: "100%",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                    boxSizing: "border-box",
                    ...rtlPlaintextBlockStyle(arAlignKey),
                  }}
                >
                  {layout.seller.nameAr || layout.seller.nameEn}
                </div>
              )
            ) : null}
            {layout.seller.addressAr ? (
              <div
                className="wsv2-wf-line"
                style={{ color: textColors.arabic, fontSize: headerDetailLinePx, ...CELL_WRAP_SAFE, ...rtlPlaintextBlockStyle(arAlignKey) }}
              >
                {layout.seller.addressAr}
              </div>
            ) : null}
            {layout.seller.email ? (
              <div
                className="wsv2-wf-line"
                dir="ltr"
                style={{
                  color: textColors.arabic,
                  fontSize: headerDetailLinePx,
                  unicodeBidi: "plaintext",
                  textAlign: arAlignKey === "left" ? "left" : "right",
                  width: "100%",
                  ...CELL_WRAP_SAFE,
                }}
              >
                {layout.seller.email}
              </div>
            ) : null}
            {layout.seller.vatValue ? (
              <div
                className="wsv2-header-seller-meta-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  columnGap: 10,
                  rowGap: 2,
                  alignItems: "baseline",
                  width: "100%",
                  boxSizing: "border-box",
                  color: textColors.arabic,
                  fontSize: headerDetailLinePx,
                }}
              >
                <span
                  className="wsv2-wf-line-label"
                  style={{ color: textColors.arabic, textAlign: "right", minWidth: 0 }}
                >
                  {layout.seller.vatLabelAr}
                </span>
                <span
                  dir="ltr"
                  style={{
                    color: textColors.arabic,
                    unicodeBidi: "plaintext",
                    textAlign: "right",
                    ...CELL_NOWRAP,
                  }}
                >
                  {layout.seller.vatValue}
                </span>
              </div>
            ) : null}
            {layout.seller.crValue ? (
              <div
                className="wsv2-header-seller-meta-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  columnGap: 10,
                  rowGap: 2,
                  alignItems: "baseline",
                  width: "100%",
                  boxSizing: "border-box",
                  color: textColors.arabic,
                  fontSize: headerDetailLinePx,
                }}
              >
                <span
                  className="wsv2-wf-line-label"
                  style={{ color: textColors.arabic, textAlign: "right", minWidth: 0 }}
                >
                  {layout.seller.crLabelAr}
                </span>
                <span
                  dir="ltr"
                  style={{
                    color: textColors.arabic,
                    unicodeBidi: "plaintext",
                    textAlign: "right",
                    ...CELL_NOWRAP,
                  }}
                >
                  {layout.seller.crValue}
                </span>
              </div>
            ) : null}
          </>
        ) : null}
        </FitHeaderTextBlock>
      </div>
    </div>
  );
}

function TitleSection({
  layout,
  language,
  logoDataUrl,
  titleUi,
}: {
  layout: LayoutPlan;
  language: LangMode;
  logoDataUrl: string | null;
  titleUi: TemplateUiSettings["title"];
  style: TemplateStyle;
}) {
  const en = layout.textColors.english;
  const ar = layout.textColors.arabic;
  const hb = layout.headerBlock;
  const logoInTitle = hb.structure === "two_column_logo_in_title";
  const enPxRaw = titleUi.enFontPx > 0 ? titleUi.enFontPx : 12;
  const arPxRaw = titleUi.arFontPx > 0 ? titleUi.arFontPx : 12;
  const enPx = enPxRaw;
  const arPx = arPxRaw;
  return (
    <div className="wsv2-wf-title">
      {logoInTitle ? (
        <div
          className="wsv2-wf-title-logo-wrap"
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 10,
            minHeight: hb.logoHeightPx,
            alignItems: "center",
          }}
        >
          {logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoDataUrl}
              alt=""
              style={{
                maxWidth: hb.logoWidthPx,
                maxHeight: hb.logoHeightPx,
                objectFit: "contain",
                display: "block",
              }}
            />
          ) : (
            <div
              className="wsv2-wf-logo-box"
              style={{
                width: hb.logoWidthPx,
                height: hb.logoHeightPx,
                boxSizing: "border-box",
                borderStyle: "dashed",
                opacity: 0.6,
              }}
              aria-label="Logo placeholder"
            />
          )}
        </div>
      ) : null}
      {language !== "arabic" ? (
        <div
          className="wsv2-wf-title-en"
          style={{
            color: en,
            fontSize: enPx,
            lineHeight: 1.2,
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box",
            textAlign: "center",
            ...CELL_WRAP_SAFE,
          }}
        >
          {layout.title.en}
        </div>
      ) : null}
      {language !== "english" ? (
        <div
          className="wsv2-wf-title-ar"
          dir="rtl"
          lang="ar"
          style={{
            color: ar,
            fontSize: arPx,
            unicodeBidi: "plaintext",
            textAlign: "center",
            lineHeight: 1.2,
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box",
            ...CELL_WRAP_SAFE,
          }}
        >
          {layout.title.ar}
        </div>
      ) : null}
    </div>
  );
}

function infoInnerWidthPx(layout: LayoutPlan, sectionId: "customer" | "docInfo"): number {
  const sec = layout.sections.find((s) => s.id === sectionId);
  const il = layout.infoLayout;
  if (!sec) return il.englishColumnWidthPx + il.valueColumnWidthPx + il.arabicColumnWidthPx + 32;
  return Math.max(200, sec.widthPx - 2 * il.cardPaddingPx);
}

function InfoTable({
  rows,
  language,
  textColors,
  infoLayout,
  bodyFonts,
  innerWidthPx,
}: {
  rows: LayoutInfoRow[];
  language: LangMode;
  textColors: { english: string; arabic: string };
  infoLayout: LayoutPlan["infoLayout"];
  bodyFonts: LayoutPlan["bodyFonts"];
  innerWidthPx: number;
}) {
  if (rows.length === 0) {
    return <div className="wsv2-wf-empty">No fields to display</div>;
  }
  const colGap = 8;
  const rawSum =
    infoLayout.englishColumnWidthPx +
    infoLayout.valueColumnWidthPx +
    infoLayout.arabicColumnWidthPx +
    2 * colGap;
  const avail = Math.max(220, innerWidthPx);
  const scale = rawSum > avail ? avail / rawSum : 1;
  const enW = Math.max(56, Math.round(infoLayout.englishColumnWidthPx * scale));
  const valMin = Math.max(72, Math.round(infoLayout.valueColumnWidthPx * scale));
  const arW = Math.max(56, Math.round(infoLayout.arabicColumnWidthPx * scale));
  /** Middle track grows so the grid always spans the card — no empty “fourth” slack column on the right. */
  const gridTemplateColumns = `minmax(0px, ${enW}px) minmax(${valMin}px, 1fr) minmax(0px, ${arW}px)`;

  return (
    <div
      className="wsv2-wf-info-grid"
      style={{
        padding: `0 ${infoLayout.cardPaddingPx}px ${infoLayout.cardPaddingPx}px`,
        gap: infoLayout.rowGapPx,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
      }}
    >
      <div
        className="wsv2-info-table-pad"
        style={{ padding: "4px 6px", boxSizing: "border-box", flex: "1 1 auto", minWidth: 0 }}
      >
      {rows.map((row) => (
        <div
          key={row.field}
          className="wsv2-info-row-3col"
          style={{
            display: "grid",
            gridTemplateColumns,
            columnGap: colGap,
            alignItems: "start",
            paddingBlock: infoLayout.rowPaddingYPx,
          }}
        >
          <div
            className="wsv2-info-cell-en wsv2-wf-info-label-en"
            dir="ltr"
            lang="en"
            style={{
              textAlign: infoLayout.englishAlign,
              color: textColors.english,
              fontFamily: bodyFonts.english,
              fontSize: 9,
              padding: "2px 4px",
              lineHeight: 1.3,
              justifySelf: "stretch",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
              whiteSpace: "normal",
              boxSizing: "border-box",
            }}
          >
            {language === "arabic" ? "\u00A0" : row.labelEn}
          </div>
          <div
            className="wsv2-info-cell-value wsv2-wf-info-value"
            dir={containsArabic(row.value || "") ? "rtl" : "ltr"}
            lang={containsArabic(row.value || "") ? "ar" : "en"}
            style={{
              textAlign: infoLayout.valueAlign,
              color: textColors.english,
              fontFamily: containsArabic(row.value || "") ? undefined : bodyFonts.english,
              fontSize: 9,
              padding: "2px 4px",
              lineHeight: 1.3,
              justifySelf: "stretch",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
              whiteSpace: "normal",
              boxSizing: "border-box",
              unicodeBidi: "plaintext",
            }}
          >
            {row.value || "—"}
          </div>
          <div
            className="wsv2-info-cell-ar wsv2-wf-info-label-ar wsv2-wf-type-ar"
            dir="rtl"
            lang="ar"
            style={{
              textAlign: infoLayout.arabicAlign,
              color: textColors.arabic,
              fontSize: 9,
              padding: "2px 4px",
              lineHeight: 1.3,
              justifySelf: "stretch",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
              whiteSpace: "normal",
              boxSizing: "border-box",
            }}
          >
            {language === "english" ? "\u00A0" : row.labelAr}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

function InfoCardHeaderBar({
  titleEn,
  titleAr,
  language,
  headerBg,
  enColor,
  arColor,
}: {
  titleEn: string;
  titleAr: string;
  language: LangMode;
  headerBg: string;
  enColor: string;
  arColor: string;
}) {
  return (
    <div
      className="wsv2-wf-info-card-header-bar"
      style={{
        flexShrink: 0,
        backgroundColor: headerBg,
        borderRadius: "4px 4px 0 0",
        paddingInline: "6px",
        paddingBlock: "4px",
        minHeight: 26,
      }}
    >
      <div className="wsv2-wf-info-card-header-title" style={{ fontSize: 9 }}>
        {language === "english" ? (
          <span style={{ color: enColor }}>{titleEn}</span>
        ) : language === "arabic" ? (
          <span className="wsv2-wf-type-ar" style={{ color: arColor, ...rtlPlaintextBlockStyle("right") }}>
            {titleAr || titleEn}
          </span>
        ) : titleAr ? (
          <>
            <span style={{ color: enColor }}>{titleEn}</span>
            <span style={{ color: enColor }}> / </span>
            <span
              className="wsv2-wf-type-ar"
              style={{ color: arColor, ...rtlPlaintextBlockStyle("right"), display: "inline-block" }}
            >
              {titleAr}
            </span>
          </>
        ) : (
          <span style={{ color: enColor }}>{titleEn}</span>
        )}
      </div>
    </div>
  );
}

function CustomerSection({
  layout,
  language,
  studioControls,
}: {
  layout: LayoutPlan;
  language: LangMode;
  studioControls?: RendererOptions["studioControls"];
}) {
  return (
    <div
      className="wsv2-wf-section-body wsv2-wf-naked-section"
      style={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "visible", position: "relative" }}
    >
      {studioControls?.enabled && studioControls.openCustomerFields ? (
        <button
          type="button"
          data-testid="studio-customer-fields-eye"
          className="wsv2-studio-side-eye wsv2-studio-side-eye--info"
          aria-label="Customer field visibility"
          onClick={(event) => {
            event.stopPropagation();
            studioControls.openCustomerFields?.(event);
          }}
        >
          <Eye size={14} strokeWidth={2} />
        </button>
      ) : null}
      <InfoCardHeaderBar
        titleEn={layout.customerLabel.en}
        titleAr={layout.customerLabel.ar}
        language={language}
        headerBg={layout.headerRowColor}
        enColor={layout.textColors.english}
        arColor={layout.textColors.arabic}
      />
      <InfoTable
        rows={layout.customerRows}
        language={language}
        textColors={layout.textColors}
        infoLayout={layout.infoLayout}
        bodyFonts={layout.bodyFonts}
        innerWidthPx={infoInnerWidthPx(layout, "customer")}
      />
    </div>
  );
}

function DocInfoSection({
  layout,
  language,
  studioControls,
}: {
  layout: LayoutPlan;
  language: LangMode;
  studioControls?: RendererOptions["studioControls"];
}) {
  const dl = SECTION_LABELS.docInfo;
  return (
    <div
      className="wsv2-wf-section-body wsv2-wf-naked-section"
      style={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "visible", position: "relative" }}
    >
      {studioControls?.enabled && studioControls.openDocumentFields ? (
        <button
          type="button"
          data-testid="studio-document-fields-eye"
          className="wsv2-studio-side-eye wsv2-studio-side-eye--info"
          aria-label="Document field visibility"
          onClick={(event) => {
            event.stopPropagation();
            studioControls.openDocumentFields?.(event);
          }}
        >
          <Eye size={14} strokeWidth={2} />
        </button>
      ) : null}
      <InfoCardHeaderBar
        titleEn={dl.en}
        titleAr={dl.ar}
        language={language}
        headerBg={layout.headerRowColor}
        enColor={layout.textColors.english}
        arColor={layout.textColors.arabic}
      />
      <InfoTable
        rows={layout.documentInfoRows}
        language={language}
        textColors={layout.textColors}
        infoLayout={layout.infoLayout}
        bodyFonts={layout.bodyFonts}
        innerWidthPx={infoInnerWidthPx(layout, "docInfo")}
      />
    </div>
  );
}

function ItemsSection({
  layout,
  language,
  density,
  resizable,
  onWidthChange,
  schema,
  tableTargetPx,
  textColors,
  studioControls,
  ui,
}: {
  layout: LayoutPlan;
  language: LangMode;
  density: "compact" | "normal" | "wide";
  resizable?: boolean;
  onWidthChange?: (widths: Partial<Record<ColumnKey, number>>) => void;
  schema: DocumentTemplateSchema;
  tableTargetPx: number;
  textColors: { english: string; arabic: string };
  bodyFonts: LayoutPlan["bodyFonts"];
  studioControls?: RendererOptions["studioControls"];
  ui: TemplateUiSettings;
}) {
  void schema;
  const studioCo = studioControls;
  const colsSrc = layout.itemColumns;
  const keys = useMemo(() => colsSrc.map((c) => c.key), [colsSrc]);

  const budgetCap =
    layout.itemTableTargetWidthPx ??
    getItemsTableInnerTargetPx(ui.margins, { sectionPaddingPx: 8, borderPx: 1 });
  const [tableTargetWidthPx, setTableTargetWidthPx] = useState(() =>
    Math.min(tableTargetPx, budgetCap),
  );
  const effectiveTableTargetWidthPx = Math.min(tableTargetWidthPx, budgetCap);

  const tableRef = useRef<HTMLTableElement | null>(null);
  const tableWrapRef = useRef<HTMLDivElement | null>(null);
  const [tableHeight, setTableHeight] = useState(0);

  const fittedWidths = useMemo(
    () =>
      fitItemColumnWidthsToTarget(
        keys,
        colsSrc.map((c) => c.widthPx),
        effectiveTableTargetWidthPx,
        itemColumnMinPx,
      ),
    [keys, colsSrc, effectiveTableTargetWidthPx],
  );

  const fittedCols = useMemo(
    () => colsSrc.map((c, i) => ({ ...c, widthPx: fittedWidths[i] ?? c.widthPx })),
    [colsSrc, fittedWidths],
  );

  const sumW = Math.max(1, fittedWidths.reduce((s, x) => s + x, 0));
  const descWp = fittedCols.find((c) => c.key === "description")?.widthPx ?? 0;
  const lineTotalWp = fittedCols.find((c) => c.key === "lineTotal")?.widthPx ?? 0;
  const tableOverflowFlag = sumW > effectiveTableTargetWidthPx + 1;

  const emitWidths = useCallback(
    (arr: number[]) => {
      const rec: Partial<Record<ColumnKey, number>> = {};
      keys.forEach((k, i) => {
        rec[k] = arr[i];
      });
      const clean = sanitizeItemColumnWidthRecord(keys, rec, effectiveTableTargetWidthPx);
      onWidthChange?.(clean);
    },
    [effectiveTableTargetWidthPx, keys, onWidthChange],
  );

  useLayoutEffect(() => {
    const wrap = tableWrapRef.current;
    const tbl = tableRef.current;
    if (!wrap || !tbl) return;
    const ro = new ResizeObserver(() => {
      const inner = Math.floor(wrap.clientWidth);
      setTableTargetWidthPx(Math.min(budgetCap, Math.max(100, inner)));
      setTableHeight(tbl.offsetHeight);
    });
    ro.observe(wrap);
    const inner = Math.floor(wrap.clientWidth);
    setTableTargetWidthPx(Math.min(budgetCap, Math.max(100, inner)));
    setTableHeight(tbl.offsetHeight);
    return () => ro.disconnect();
  }, [budgetCap, colsSrc, layout.itemRows, language, density, fittedWidths.length]);

  const onHandlePointerDown = (rightIndex: number, e: ReactPointerEvent<HTMLDivElement>) => {
    if (!onWidthChange) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.button !== 0) return;
    const startWidths = [...fittedWidths];
    const startX = e.clientX;
    const pointerId = e.pointerId;
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const delta = ev.clientX - startX;
      const next = applyBoundaryDragPx(keys, startWidths, rightIndex, delta, effectiveTableTargetWidthPx);
      emitWidths(next);
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const showHandles = resizable && onWidthChange;

  return (
    <div
      className="wsv2-wf-section-body wsv2-wf-naked-section wsv2-wf-items-outer wsv2-wf-items-studio-wrap"
      data-wsv2-resizable={showHandles ? "true" : undefined}
      data-items-target-width={effectiveTableTargetWidthPx}
      data-items-used-width={sumW}
      data-items-description-width={descWp}
      data-items-total-width={lineTotalWp}
      data-items-overflow={tableOverflowFlag ? "true" : "false"}
      data-numeric-nowrap="true"
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        position: "relative",
        overflow: "visible",
      }}
    >
      {studioCo?.enabled && studioCo.openItemColumns ? (
        <button
          type="button"
          data-testid="studio-item-columns-eye"
          className="wsv2-studio-side-eye wsv2-studio-side-eye--items"
          aria-label="Column visibility and width"
          onClick={(event) => {
            event.stopPropagation();
            studioCo.openItemColumns?.(event);
          }}
        >
          <Eye size={14} strokeWidth={2} />
        </button>
      ) : null}
      <div
        ref={tableWrapRef}
        className="wsv2-wf-items-resizable-wrap"
        data-wsv2-items-table-wrap=""
        style={{
          position: "relative",
          display: "block",
          maxWidth: "100%",
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <table
          ref={tableRef}
          className="wsv2-wf-items-table"
          data-density={density}
          data-items-target-width={effectiveTableTargetWidthPx}
          data-items-used-width={sumW}
          data-items-overflow={tableOverflowFlag ? "true" : "false"}
          style={{
            tableLayout: "fixed",
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <colgroup>
            {fittedCols.map((col) => (
              <col
                key={col.key}
                style={{ width: `${(col.widthPx / sumW) * 100}%` }}
              />
            ))}
          </colgroup>
          <thead style={{ backgroundColor: layout.headerRowColor }}>
            {language !== "arabic" ? (
              <tr className="wsv2-wf-hdr-en">
                {fittedCols.map((col) => {
                  const hdrLtr =
                    col.format === "money" ||
                    col.format === "percent" ||
                    col.format === "qty" ||
                    col.key === "index";
                  const descWrap = isWrappingItemColumn(col.key);
                  const hdrCell = descWrap ? CELL_DESC_WRAP : CELL_NOWRAP;
                  return (
                  <th
                    key={col.key}
                    data-col-key={col.key}
                    data-col-format={col.format ?? "text"}
                    dir={hdrLtr ? "ltr" : undefined}
                    style={{
                      textAlign: col.align,
                      color: textColors.english,
                      verticalAlign: "top",
                      lineHeight: 1.25,
                      ...hdrCell,
                    }}
                    className={`wsv2-wf-th hisab-item-th ${descWrap ? "hisab-item-desc" : "hisab-item-nowrap"} ${col.format === "money" ? "hisab-item-money" : ""} ${col.format === "percent" ? "hisab-item-percent" : ""} ${col.format === "qty" ? "hisab-item-qty" : ""}`}
                    scope="col"
                  >
                    {studioCo?.enabled && studioCo.openItemHeading ? (
                      <button
                        type="button"
                        data-testid={`studio-item-heading-${col.key}`}
                        className="wsv2-studio-th-btn"
                        style={{
                          margin: 0,
                          padding: 0,
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          font: "inherit",
                          color: "inherit",
                          textAlign: col.align,
                          width: "100%",
                          maxWidth: "100%",
                          minWidth: 0,
                          ...(descWrap
                            ? { overflowWrap: "anywhere", wordBreak: "normal", whiteSpace: "normal" }
                            : { whiteSpace: "nowrap", overflowWrap: "normal", wordBreak: "normal" }),
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          studioCo.openItemHeading?.(event, col.key);
                        }}
                      >
                        {col.labelEn}
                      </button>
                    ) : (
                      col.labelEn
                    )}
                  </th>
                  );
                })}
              </tr>
            ) : null}
            {language !== "english" ? (
              <tr className="wsv2-wf-hdr-ar">
                {fittedCols.map((col) => {
                  const hdrLtr =
                    col.format === "money" ||
                    col.format === "percent" ||
                    col.format === "qty" ||
                    col.key === "index";
                  const descWrap = isWrappingItemColumn(col.key);
                  const hdrCell = descWrap ? CELL_DESC_WRAP : CELL_NOWRAP;
                  return (
                  <th
                    key={`${col.key}-ar`}
                    data-col-key={col.key}
                    data-col-format={col.format ?? "text"}
                    style={{
                      textAlign: col.align,
                      color: textColors.arabic,
                      verticalAlign: "top",
                      lineHeight: 1.25,
                      ...hdrCell,
                    }}
                    className={`wsv2-wf-th wsv2-wf-type-ar hisab-item-th ${descWrap ? "hisab-item-desc" : "hisab-item-nowrap"} ${col.format === "money" ? "hisab-item-money" : ""} ${col.format === "percent" ? "hisab-item-percent" : ""} ${col.format === "qty" ? "hisab-item-qty" : ""}`}
                    dir={hdrLtr ? "ltr" : "rtl"}
                    lang="ar"
                    scope="col"
                  >
                    {studioCo?.enabled && studioCo.openItemHeading ? (
                      <button
                        type="button"
                        data-testid={`studio-item-heading-${col.key}`}
                        className="wsv2-studio-th-btn"
                        style={{
                          margin: 0,
                          padding: 0,
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          font: "inherit",
                          color: "inherit",
                          textAlign: col.align,
                          width: "100%",
                          maxWidth: "100%",
                          minWidth: 0,
                          ...(descWrap
                            ? { overflowWrap: "anywhere", wordBreak: "normal", whiteSpace: "normal" }
                            : { whiteSpace: "nowrap", overflowWrap: "normal", wordBreak: "normal" }),
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          studioCo.openItemHeading?.(event, col.key);
                        }}
                      >
                        {col.labelAr}
                      </button>
                    ) : (
                      col.labelAr
                    )}
                  </th>
                  );
                })}
              </tr>
            ) : null}
          </thead>
          <tbody>
            {layout.itemRows.map((row) => (
              <tr key={row.index}>
                {fittedCols.map((col) => {
                  const cellText = row.cells[col.key] || "";
                  const wrapCol = isWrappingItemColumn(col.key);
                  const arCell =
                    wrapCol &&
                    containsArabic(cellText);
                  const forceLtrNumeric =
                    !wrapCol &&
                    (col.format === "money" ||
                    col.format === "percent" ||
                    col.format === "qty" ||
                    col.key === "index");
                  const cellDir = forceLtrNumeric ? "ltr" : arCell ? "rtl" : "ltr";
                  const cellBase = wrapCol ? CELL_DESC_WRAP : CELL_NOWRAP;
                  const moneyCls = col.format === "money" ? "hisab-item-money" : "";
                  const pctCls = col.format === "percent" ? "hisab-item-percent" : "";
                  const qtyCls = col.format === "qty" ? "hisab-item-qty" : "";
                  return (
                  <td
                    key={col.key}
                    data-col-key={col.key}
                    data-col-format={col.format ?? "text"}
                    dir={cellDir}
                    lang={arCell && !forceLtrNumeric ? "ar" : undefined}
                    style={{
                      textAlign: col.align,
                      color: textColors.english,
                      unicodeBidi: forceLtrNumeric ? "isolate" : "plaintext",
                      verticalAlign: "top",
                      ...cellBase,
                    }}
                    className={[
                      "wsv2-wf-td",
                      "hisab-item-td",
                      wrapCol ? "hisab-item-desc" : "hisab-item-nowrap",
                      moneyCls,
                      pctCls,
                      qtyCls,
                      arCell ? "wsv2-wf-type-ar" : "",
                    ].filter(Boolean).join(" ")}
                  >
                    {cellText}
                  </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {showHandles && fittedCols.length > 1
          ? Array.from({ length: fittedCols.length - 1 }, (_, hIdx) => {
              const rightIndex = hIdx + 1;
              const cumPx = fittedCols.slice(0, rightIndex).reduce((s, c) => s + c.widthPx, 0);
              const leftPct = (cumPx / sumW) * 100;
              return (
                <div
                  key={`h-${rightIndex}`}
                  className="wsv2-wf-col-resize-handle"
                  style={{
                    top: 0,
                    left: `${leftPct}%`,
                    marginLeft: -4,
                    width: 8,
                    height: tableHeight > 0 ? tableHeight : undefined,
                    minHeight: tableHeight > 0 ? undefined : 120,
                    cursor: "col-resize",
                    touchAction: "none",
                  }}
                  onPointerDown={(e) => onHandlePointerDown(rightIndex, e)}
                  role="separator"
                  aria-orientation="vertical"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                    e.preventDefault();
                    const w = fittedCols.map((x) => x.widthPx);
                    const delta = e.key === "ArrowRight" ? 2 : -2;
                    const next = applyBoundaryDragPx(keys, w, rightIndex, delta, tableTargetWidthPx);
                    emitWidths(next);
                  }}
                />
              );
            })
          : null}
      </div>
    </div>
  );
}

function TotalsSection({
  layout,
  language,
  totalsBlock,
  textColors,
}: {
  layout: LayoutPlan;
  language: LangMode;
  totalsBlock: TotalsBlockSettings;
  textColors: { english: string; arabic: string };
}) {
  const tb = { ...DEFAULT_TOTALS_BLOCK, ...totalsBlock };
  const colGap = 10;
  const amtWBase = Math.max(48, tb.totals_amount_col_width_px);
  const curWBase = Math.max(22, tb.totals_currency_col_width_px);
  const descWBase = Math.max(80, tb.totals_desc_col_width_px);
  const totalsSection = layout.sections.find((s) => s.id === "totals");
  /** Section shell budget — proportional shrink when prefs exceed printable width */
  const innerBudget = totalsSection ? Math.max(120, totalsSection.widthPx - 28) : 560;
  let descW = descWBase;
  let curW = curWBase;
  let amtW = amtWBase;
  let sumPx = descW + curW + amtW + 2 * colGap;
  if (sumPx > innerBudget && innerBudget > 0 && sumPx > 0) {
    const scale = innerBudget / sumPx;
    descW = Math.max(72, Math.floor(descW * scale));
    curW = Math.max(20, Math.floor(curW * scale));
    amtW = Math.max(44, Math.floor(amtW * scale));
    sumPx = descW + curW + amtW + 2 * colGap;
    if (sumPx > innerBudget) {
      const s2 = innerBudget / Math.max(sumPx, 1);
      descW = Math.max(64, Math.floor(descW * s2));
      curW = Math.max(18, Math.floor(curW * s2));
      amtW = Math.max(40, Math.floor(amtW * s2));
    }
  }
  const gridTemplateColumns = `${descW}px ${curW}px ${amtW}px`;
  void tb.totals_desc_align;
  const cAlign = tb.totals_currency_align ?? "center";
  const aAlign = tb.totals_amount_align ?? "right";
  return (
    <div
      className="wsv2-wf-totals"
      style={{
        gap: tb.rowGapPx,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      {layout.totalsRows.map((row) => (
        <div
          className="wsv2-wf-totals-row wsv2-totals-row-3col"
          key={row.field}
          data-grand={row.emphasis ? "true" : "false"}
          style={{
            display: "grid",
            gridTemplateColumns,
            columnGap: colGap,
            alignItems: "center",
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <div
            className="wsv2-wf-totals-label wsv2-wf-totals-desc wsv2-totals-desc"
            dir="ltr"
            style={CELL_WRAP_SAFE}
          >
            {language === "english"
              ? <span style={{ color: textColors.english }}>{row.labelEn}</span>
              : language === "arabic"
                ? <span style={{ color: textColors.arabic }}>{row.labelAr}</span>
                : (
                  <>
                    <span className="wsv2-wf-totals-desc-en" style={{ color: textColors.english }}>{row.labelEn}</span>
                    <span className="wsv2-wf-totals-desc-sep" style={{ color: textColors.english }}> / </span>
                    <span
                      className="wsv2-wf-totals-desc-ar wsv2-wf-type-ar"
                      dir="rtl"
                      lang="ar"
                      style={{ color: textColors.arabic, unicodeBidi: "plaintext" }}
                    >
                      {row.labelAr}
                    </span>
                  </>
                )}
          </div>
          <div
            className="wsv2-wf-totals-currency wsv2-totals-currency wsv2-wf-type-ar"
            style={{
              textAlign: cAlign,
              color: row.emphasis ? textColors.english : textColors.english,
              fontWeight: row.emphasis ? 700 : 400,
              ...CELL_NOWRAP,
            }}
          >
            {row.currencySymbol}
          </div>
          <div
            className="wsv2-wf-totals-value wsv2-totals-amount"
            style={{
              textAlign: aAlign,
              color: textColors.english,
              fontWeight: row.emphasis ? 700 : 400,
              ...CELL_NOWRAP,
            }}
          >
            {row.amountOnly}
          </div>
        </div>
      ))}
    </div>
  );
}

function QrSection({
  layout,
  language,
  qrImageDataUrl,
  qrBlock: qrBlockProp,
  textColors,
}: {
  layout: LayoutPlan;
  language: LangMode;
  qrImageDataUrl: string | null | undefined;
  qrBlock: QrBlockSettings;
  textColors: { english: string; arabic: string };
}) {
  if (!layout.qr.applicable) return null;
  const qb = { ...DEFAULT_QR_BLOCK, ...qrBlockProp };
  const alignItems: "flex-end" | "center" | "flex-start" =
    qb.align === "right" ? "flex-end" : qb.align === "left" ? "flex-start" : "center";
  const textAlign: "right" | "left" | "center" =
    qb.align === "right" ? "right" : qb.align === "left" ? "left" : "center";
  return (
    <div
      className="wsv2-wf-qr wsv2-wf-qr-stack"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems,
        width: "100%",
        minHeight: qb.cardMinHeightPx,
        height: qb.cardHeightPx && qb.cardHeightPx > 0 ? qb.cardHeightPx : undefined,
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <div
        className="wsv2-wf-qr-figure"
        style={{
          width: qb.imageSizePx,
          height: qb.imageSizePx,
          flexShrink: 0,
          maxWidth: "100%",
        }}
      >
        {qrImageDataUrl ? (
          <Image
            src={qrImageDataUrl}
            alt="ZATCA QR"
            className="wsv2-wf-qr-image"
            width={Math.round(qb.imageSizePx)}
            height={Math.round(qb.imageSizePx)}
            unoptimized
            style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <div
            className="wsv2-wf-qr-image wsv2-wf-qr-placeholder"
            style={{ width: "100%", height: "100%" }}
            aria-hidden="true"
          />
        )}
      </div>
      {qb.showCaptions ? (
        <div
          className="wsv2-wf-qr-captions"
          style={{ width: "100%", textAlign, marginTop: 6, minWidth: 0 }}
        >
          {language !== "arabic" ? (
            <div className="wsv2-wf-qr-caption-en" style={{ color: textColors.english }}>{layout.qr.captionEn}</div>
          ) : null}
          {language !== "english" ? (
            <div
              className="wsv2-wf-qr-caption-ar wsv2-wf-type-ar"
              dir="rtl"
              lang="ar"
              style={{ color: textColors.arabic, unicodeBidi: "plaintext", textAlign: "inherit" }}
            >
              {layout.qr.captionAr}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StampSignatureSection({
  layout,
  language,
  assets,
  textColors,
}: {
  layout: LayoutPlan;
  language: LangMode;
  assets: TemplateAssetState;
  textColors: { english: string; arabic: string };
}) {
  if (!layout.stampSignature.enabled) return null;
  const { showStamp, showSignature, showReceiverSignature } = layout.stampSignature;
  if (!showStamp && !showSignature && !showReceiverSignature) return null;
  const ssb = layout.stampSignatureBlock;
  const stampBox: CSSProperties = {
    width: ssb.stampImageWidthPx,
    height: ssb.stampImageHeightPx,
    maxWidth: "100%",
    objectFit: "contain",
    display: "block",
  };
  const signatureBox: CSSProperties = {
    width: ssb.signatureImageWidthPx,
    height: ssb.signatureImageHeightPx,
    maxWidth: "100%",
    objectFit: "contain",
    display: "block",
  };
  const stampCardMaxH = ssb.cardMaxHeightPx;

  return (
    <div className="wsv2-stamp-signature-section">
      <div className="wsv2-stamp-signature-grid">
      {showStamp ? (
        <div
          className="wsv2-stamp-card"
          style={{
            minHeight: 0,
            maxHeight: stampCardMaxH != null && stampCardMaxH > 0 ? stampCardMaxH : undefined,
            padding: ssb.cardPaddingPx,
            boxSizing: "border-box",
          }}
        >
          <div className="wsv2-stamp-signature-content">
            <div className="wsv2-stamp-signature-graphic wsv2-stamp-signature-graphic-main">
              {assets.stampDataUrl ? (
                <div className="wsv2-wf-asset-pad" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={assets.stampDataUrl}
                    alt=""
                    className="wsv2-wf-asset-img"
                    style={stampBox}
                  />
                </div>
              ) : (
                <div className="wsv2-wf-stamp-area" aria-hidden="true" />
              )}
            </div>
          </div>
          <div className="wsv2-stamp-signature-footer">
            {ssb.footerLineEnabled ? <div className="wsv2-stamp-signature-line" aria-hidden="true" /> : null}
            <div className="wsv2-stamp-signature-label">
              {biLabel("Company Stamp", "ختم الشركة", language)}
            </div>
          </div>
        </div>
      ) : null}
      {showSignature ? (
        <div
          className="wsv2-signature-card"
          style={{
            minHeight: 0,
            padding: ssb.cardPaddingPx,
            boxSizing: "border-box",
          }}
        >
          <div className="wsv2-stamp-signature-content">
            <div className="wsv2-stamp-signature-graphic wsv2-stamp-signature-graphic-main">
              {assets.signatureDataUrl ? (
                <div className="wsv2-wf-asset-pad" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={assets.signatureDataUrl}
                    alt=""
                    className="wsv2-wf-asset-img"
                    style={signatureBox}
                  />
                </div>
              ) : (
                <div className="wsv2-wf-stamp-area" aria-hidden="true" />
              )}
            </div>
            {assets.signatoryName ? (
              <div className="wsv2-wf-signatory-name" dir="ltr" style={{ color: textColors.english }}>
                {assets.signatoryName}
              </div>
            ) : null}
            {assets.signatoryDesignation ? (
              <div className="wsv2-wf-signatory-title-line" dir="ltr" style={{ color: textColors.english }}>
                {assets.signatoryDesignation}
              </div>
            ) : null}
          </div>
          <div className="wsv2-stamp-signature-footer">
            {ssb.footerLineEnabled ? <div className="wsv2-stamp-signature-line" aria-hidden="true" /> : null}
            <div className="wsv2-stamp-signature-label">
              {biLabel("Authorized Signature", "التوقيع المعتمد", language)}
            </div>
          </div>
        </div>
      ) : null}
      {showReceiverSignature ? (
        <div
          className="wsv2-signature-card"
          style={{
            minHeight: 0,
            padding: ssb.cardPaddingPx,
            boxSizing: "border-box",
          }}
        >
          <div className="wsv2-stamp-signature-content">
            <div className="wsv2-stamp-signature-graphic">
              <div className="wsv2-wf-stamp-area" aria-hidden="true" />
            </div>
          </div>
          <div className="wsv2-stamp-signature-footer">
            {ssb.footerLineEnabled ? <div className="wsv2-stamp-signature-line" aria-hidden="true" /> : null}
            <div className="wsv2-stamp-signature-label">
              {biLabel("Receiver Signature", "توقيع المستلم", language)}
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}

function FooterSection({ layout, language }: { layout: LayoutPlan; language: LangMode }) {
  const sellerEn = layout.seller.nameEn;
  const sellerAr = layout.seller.nameAr;
  const enC = layout.textColors.english;
  const arC = layout.textColors.arabic;
  return (
    <div className="wsv2-wf-footer-bar" style={{ width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
      <span className="wsv2-wf-footer-text" style={{ ...CELL_WRAP_SAFE }}>
        {language === "english" ? (
          <span style={{ color: enC }}>{sellerEn}</span>
        ) : language === "arabic" ? (
          <span style={{ color: arC }}>{sellerAr || sellerEn}</span>
        ) : sellerAr ? (
          <>
            <span style={{ color: enC }}>{sellerEn}</span>
            <span style={{ color: enC }}> · </span>
            <span className="wsv2-wf-type-ar" style={{ color: arC, ...rtlPlaintextBlockStyle("right"), display: "inline-block" }}>
              {sellerAr}
            </span>
          </>
        ) : (
          <span style={{ color: enC }}>{sellerEn}</span>
        )}
      </span>
      <span className="wsv2-wf-footer-page" style={{ color: enC }}>Page 1 / 1</span>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

type SectionShellProps = {
  section: LayoutSection;
  active: boolean;
  onSelect?: (id: SectionKey) => void;
  setRef?: (id: SectionKey, node: HTMLDivElement | null) => void;
  children: ReactNode;
  /** Override pixel x/width when laid out inside a split row. */
  styleOverride?: CSSProperties;
  /** Extra classes (e.g. info card client/document). */
  shellClass?: string;
};

function infoCardShellClassAndStyle(
  sectionId: "customer" | "docInfo",
  il: LayoutPlan["infoLayout"],
): { shellClass: string; style: CSSProperties } {
  const isClient = sectionId === "customer";
  const wPx = isClient ? il.clientCardWidthPx : il.documentCardWidthPx;
  const fixH = isClient ? il.clientCardHeightPx : il.documentCardHeightPx;
  const shellClass = [
    isClient ? "wsv2-info-card-client" : "wsv2-info-card-document",
    fixH > 0 ? "wsv2-info-card-fixed-height" : "wsv2-info-card-auto-height",
  ].join(" ");
  const style: CSSProperties = {};
  if (wPx > 0) {
    style.width = `min(${wPx}px, 100%)`;
    style.maxWidth = "100%";
  }
  if (fixH > 0) {
    style.height = fixH;
  }
  return { shellClass, style };
}

/** Modern template: place customer + document info shells on one row (side by side). */
function mergeModernInfoCardRows(
  rows: { rowKey: string; sectionId: SectionKey | null; node: ReactNode }[],
  style: TemplateStyle,
): { rowKey: string; sectionId: SectionKey | null; node: ReactNode }[] {
  if (style !== "modern") return rows;
  const out: { rowKey: string; sectionId: SectionKey | null; node: ReactNode }[] = [];
  let j = 0;
  while (j < rows.length) {
    const a = rows[j];
    const b = rows[j + 1];
    if (a.sectionId === "customer" && b?.sectionId === "docInfo") {
      out.push({
        rowKey: "customer+docInfo",
        sectionId: null,
        node: (
          <div
            key="customer+docInfo"
            className="wsv2-wf-info-cards-row"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: LAYOUT_STYLE_CONTRACT[style].sectionGapPx,
              width: "100%",
              minWidth: 0,
              flexShrink: 0,
            }}
          >
            {a.node}
            {b.node}
          </div>
        ),
      });
      j += 2;
    } else {
      out.push(a);
      j += 1;
    }
  }
  return out;
}

function SectionShell({ section, active, onSelect, setRef, children, styleOverride, shellClass }: SectionShellProps) {
  const computed: CSSProperties = {
    position: "relative",
    overflow: "visible",
    flexShrink: 0,
    ...(section.minHeightPx > 0 ? { minHeight: section.minHeightPx } : {}),
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    ...styleOverride,
  };
  return (
    <div
      ref={(node) => setRef?.(section.id, node)}
      data-section={section.id}
      data-section-active={active ? "true" : "false"}
      className={["wsv2-wf-section", shellClass].filter(Boolean).join(" ")}
      style={computed}
      onClick={(event) => {
        if (!onSelect) return;
        event.stopPropagation();
        onSelect(section.id);
      }}
      aria-current={active ? "true" : undefined}
    >
      {children}
    </div>
  );
}

export const WorkspaceDocumentRenderer = forwardRef<HTMLDivElement, RendererOptions>(
  function WorkspaceDocumentRenderer(props, ref) {
    const {
      schema,
      doc,
      seller,
      customer,
      language,
      style = "standard",
      hiddenSections,
      hiddenFields,
      hiddenColumns,
      columnOrder,
      density = "normal",
      activeSection,
      onSectionSelect,
      setSectionRef,
      qrImageDataUrl,
      ui: uiProp,
      templateAssets: assetsProp,
      resizableItemColumns: resizableItemColumns = false,
      onItemColumnWidthChange,
      templateId,
      studioControls,
    } = props;

    const ui = uiProp ?? defaultTemplateUi();
    const mergedQrBlock: QrBlockSettings = { ...DEFAULT_QR_BLOCK, ...ui.qrBlock };
    const mergedTotalsBlock: TotalsBlockSettings = { ...DEFAULT_TOTALS_BLOCK, ...ui.totalsBlock };

    const totalsShellStyle = (): CSSProperties => ({
      padding: mergedTotalsBlock.cardPaddingPx,
      boxSizing: "border-box",
      ...(mergedTotalsBlock.cardHeightPx && mergedTotalsBlock.cardHeightPx > 0
        ? { height: mergedTotalsBlock.cardHeightPx }
        : {}),
    });
    const templateAssets: TemplateAssetState = assetsProp ?? {
      logoDataUrl: null,
      stampDataUrl: null,
      signatureDataUrl: null,
      signatoryName: "",
      signatoryDesignation: "",
    };

    const layout = buildDocumentLayout({
      schema,
      doc,
      seller,
      customer,
      language,
      hiddenSections,
      hiddenFields,
      hiddenColumns,
      columnOrder,
      ui,
      templateId,
    });

    const innerRootRef = useRef<HTMLDivElement | null>(null);
    const [paperOverflow, setPaperOverflow] = useState(false);
    const overflowProbeKey = `${layout.sections.map((s) => s.id).join("|")}/${layout.itemColumns.map((c) => `${c.key}:${Math.round(c.widthPx)}`).join(",")}/${language}/${style}/${doc.lines?.length ?? 0}`;
    const setRootEl = useCallback(
      (node: HTMLDivElement | null) => {
        innerRootRef.current = node;
        assignForwardedRef(ref, node);
      },
      [ref],
    );
    useLayoutEffect(() => {
      const el = innerRootRef.current;
      if (!el) {
        return undefined;
      }
      const measure = () => {
        const ov =
          el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2;
        setPaperOverflow(ov);
      };
      measure();
      let ro: ResizeObserver | undefined;
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(measure);
        ro.observe(el);
      }
      return () => ro?.disconnect();
    }, [overflowProbeKey]);

    const dir = dirFor(language);
    const isRtl = dir === "rtl";

    // Walk sections in schema order; merge totals + qr into the same row when
    // both belong to a split row.
    type SectionRow = { rowKey: string; sectionId: SectionKey | null; node: ReactNode };
    const sectionRows: SectionRow[] = [];
    let i = 0;
    while (i < layout.sections.length) {
      const section = layout.sections[i];
      const next = layout.sections[i + 1];
      const isSplitTotalsQr = (
        (section.id === "qr" && section.splitRow === "totals_left_qr" && next && next.id === "totals" && next.splitRow === "totals_right") ||
        (section.id === "totals" && section.splitRow === "totals_right" && next && next.id === "qr" && next.splitRow === "totals_left_qr")
      );
      if (isSplitTotalsQr) {
        const qrSection = section.id === "qr" ? section : next!;
        const totalsSection = section.id === "totals" ? section : next!;
        const splitKey = `${section.id}+${next!.id}`;
        sectionRows.push({
          rowKey: splitKey,
          sectionId: null,
          node: (
            <div className="wsv2-wf-split-row" key={splitKey}>
              <SectionShell
                section={qrSection}
                active={activeSection === "qr"}
                onSelect={onSectionSelect}
                setRef={setSectionRef}
                styleOverride={{
                  width: "100%",
                  maxWidth: mergedQrBlock.cardWidthPx,
                  minWidth: 0,
                  flex: "0 1 auto",
                }}
              >
                <QrSection layout={layout} language={language} qrImageDataUrl={qrImageDataUrl} qrBlock={mergedQrBlock} textColors={layout.textColors} />
              </SectionShell>
              <SectionShell
                section={totalsSection}
                active={activeSection === "totals"}
                onSelect={onSectionSelect}
                setRef={setSectionRef}
                styleOverride={{
                  width: mergedTotalsBlock.cardWidthPx > 0 ? mergedTotalsBlock.cardWidthPx : totalsSection.widthPx,
                  maxWidth: mergedTotalsBlock.cardWidthPx > 0 ? mergedTotalsBlock.cardWidthPx : totalsSection.widthPx,
                  minWidth: 0,
                  flex: "0 0 auto",
                  alignSelf: "flex-start",
                  ...totalsShellStyle(),
                }}
              >
                <TotalsSection layout={layout} language={language} totalsBlock={mergedTotalsBlock} textColors={layout.textColors} />
              </SectionShell>
            </div>
          ),
        });
        i += 2;
        continue;
      }

      const body = (() => {
        switch (section.id) {
          case "header":         return <HeaderSection layout={layout} language={language} showHeaderAccent={ui.showHeaderGreenAccent} logoDataUrl={templateAssets.logoDataUrl} textColors={layout.textColors} cardBorder={ui.cardBorder} studioControls={studioControls} />;
          case "title":          return <TitleSection layout={layout} language={language} logoDataUrl={templateAssets.logoDataUrl} titleUi={ui.title} style={style} />;
          case "customer":       return <CustomerSection layout={layout} language={language} studioControls={studioControls} />;
          case "docInfo":        return <DocInfoSection layout={layout} language={language} studioControls={studioControls} />;
          case "items":          return (
            <ItemsSection
              layout={layout}
              language={language}
              density={density}
              resizable={resizableItemColumns}
              onWidthChange={onItemColumnWidthChange}
              schema={schema}
              tableTargetPx={getItemsTableInnerTargetPx(ui.margins, { sectionPaddingPx: 8, borderPx: 1 })}
              textColors={layout.textColors}
              bodyFonts={layout.bodyFonts}
              studioControls={studioControls}
              ui={ui}
            />
          );
          case "totals":         return <TotalsSection layout={layout} language={language} totalsBlock={mergedTotalsBlock} textColors={layout.textColors} />;
          case "qr":             return <QrSection layout={layout} language={language} qrImageDataUrl={qrImageDataUrl} qrBlock={mergedQrBlock} textColors={layout.textColors} />;
          case "stampSignature": return <StampSignatureSection layout={layout} language={language} assets={templateAssets} textColors={layout.textColors} />;
          case "footer":         return <FooterSection layout={layout} language={language} />;
          default:               return null;
        }
      })();

      if (!body) {
        i += 1;
        continue;
      }

      const isFooter = section.id === "footer";
      const isTotals = section.id === "totals";
      const isStampSig = section.id === "stampSignature";
      const isCustomer = section.id === "customer";
      const isDocInfo = section.id === "docInfo";
      const infoExtras =
        isCustomer || isDocInfo
          ? infoCardShellClassAndStyle(isCustomer ? "customer" : "docInfo", layout.infoLayout)
          : null;
      const baseOverride: CSSProperties | undefined = isFooter
        ? { padding: 0, border: "none" }
        : isTotals
          ? totalsShellStyle()
          : isStampSig
            ? {
                display: "flex",
                flexDirection: "column",
                minHeight: section.minHeightPx,
              }
            : undefined;
      const mergedOverride: CSSProperties | undefined =
        infoExtras && Object.keys(infoExtras.style).length > 0
          ? (() => {
              const merged: CSSProperties = {};
              if (baseOverride) Object.assign(merged, baseOverride);
              Object.assign(merged, infoExtras.style);
              return merged;
            })()
          : baseOverride;
      sectionRows.push({
        rowKey: section.id,
        sectionId: section.id,
        node: (
          <SectionShell
            key={section.id}
            section={section}
            active={activeSection === section.id}
            onSelect={onSectionSelect}
            setRef={setSectionRef}
            shellClass={infoExtras?.shellClass}
            styleOverride={mergedOverride}
          >
            {body}
          </SectionShell>
        ),
      });
      i += 1;
    }

    const mergedSectionRows = mergeModernInfoCardRows(sectionRows, style);

    /** True A4 portrait — avoid flex spacer that stretches content past one page. */
    const rowsWithSpacer = mergedSectionRows;

    const m = ui.margins;
    const padT = (m.topMm * 96) / 25.4;
    const padR = (m.rightMm * 96) / 25.4;
    const padB = (m.bottomMm * 96) / 25.4;
    const padL = (m.leftMm * 96) / 25.4;
    const typoScale = Math.min(2, Math.max(0.5, ui.typography.enSizeScale));
    const englishBodyPx = ui.typography.english?.fontSize ?? TYPOGRAPHY.bodyPx;
    const compactLineBoost = style === "compact" ? -1 : style === "modern" ? 1 : 0;
    const basePx = Math.max(7, Math.min(14, Math.round(englishBodyPx * typoScale)));
    const linePx = Math.max(
      11,
      Math.round((TYPOGRAPHY.lineHeightBodyPx + compactLineBoost) * typoScale),
    );

    return (
      <div
        ref={setRootEl}
        className="wsv2-root wsv2-doc-paper-inner wsv2-doc-with-ui"
        data-style={style}
        data-lang={language}
        data-a4-overflow={paperOverflow ? "true" : "false"}
        data-a4-fixed="true"
        dir={dir}
        lang={isRtl ? "ar" : "en"}
        style={{
          width: "100%",
          maxWidth: PAGE_GEOMETRY.widthPx,
          height: "100%",
          minHeight: PAGE_GEOMETRY.heightPx,
          maxHeight: PAGE_GEOMETRY.heightPx,
          boxSizing: "border-box",
          margin: 0,
          padding: `${padT}px ${padR}px ${padB}px ${padL}px`,
          fontSize: basePx,
          lineHeight: `${linePx}px`,
          gap: SPACING.sectionGapPx,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          ["--wsv2-en-fg" as string]: layout.textColors.english,
          ["--wsv2-ar-fg" as string]: layout.textColors.arabic,
          ["--wsv2-en-ff" as string]: ui.typography.enFontStack,
          ["--wsv2-ar-ff" as string]: ui.typography.arFontStack,
        }}
      >
        {rowsWithSpacer.map((r) => (
          <Fragment key={r.rowKey}>{r.node}</Fragment>
        ))}
      </div>
    );
  },
);

// ─── Convenience: defaults from preview-company / customer ──────────────────

export function makeRendererSeller(): RendererSeller {
  return {
    name: previewCompany.sellerName,
    nameAr: previewCompany.sellerNameAr,
    vatNumber: previewCompany.vatNumber,
    registrationNumber: previewCompany.registrationNumber,
    addressEn: previewCompany.sellerAddressEn,
    addressAr: previewCompany.sellerAddressAr,
    email: previewCompany.sellerEmail,
    phone: previewCompany.sellerPhone,
  };
}

export function makeRendererCustomer(c: Customer | undefined): RendererCustomer {
  if (!c) {
    return { name: "—" };
  }
  return {
    name: c.legalName ?? "—",
    nameAr: c.legalNameAr,
    vatNumber: c.vatNumber,
    city: c.city,
    country: undefined,
    addressEn: c.addressEn ?? c.city,
    addressAr: c.addressAr,
    email: c.email,
    phone: c.phone,
  };
}

// Re-export bilingualLabel for callers that previously imported it from this file.
export { bilingualLabel };
