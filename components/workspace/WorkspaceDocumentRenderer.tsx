"use client";

// Workspace — schema-driven document renderer (Wafeq Format 2).
//
// Reads the layout from `buildDocumentLayout()` so the browser preview, the
// Template Studio canvas, and the PDF export all share the same coordinate
// system. Section dimensions, customer/document info rows, items column
// widths, totals/QR split, stamp/signature blocks and footer are ALL derived
// from the schema — none of it is invented here.

import { forwardRef, Fragment, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent } from "react";
import type { DocumentRecord, Customer } from "@/lib/workspace/types";
import { previewCompany } from "@/data/preview-company";
import {
  PAGE_GEOMETRY,
  SPACING,
  type ColumnKey,
  type DocumentTemplateSchema,
  type FieldKey,
  type ItemColumnSpec,
  type LangMode,
  type SectionKey,
  type TemplateStyle,
} from "@/lib/workspace/document-template-schemas";
import {
  applyBoundaryDragPx,
  buildMinWidthGetter,
  fitItemColumnWidthsToTarget,
  getItemsTableInnerTargetPx,
  widthsArrayToRecord,
} from "@/lib/workspace/item-column-resize";
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
  ltrIsolateStyle,
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
      <span className="wsv2-bi-ar"> {ar}</span>
    </>
  );
}

// ─── Section renderers ──────────────────────────────────────────────────────

function HeaderSection({
  layout,
  language,
  showHeaderAccent,
  logoDataUrl,
  textColors,
  cardBorder,
}: {
  layout: LayoutPlan;
  language: LangMode;
  showHeaderAccent: boolean;
  logoDataUrl: string | null;
  textColors: { english: string; arabic: string };
  cardBorder: TemplateUiSettings["cardBorder"];
}) {
  const hb = layout.headerBlock;
  const headerSec = layout.sections.find((s) => s.id === "header");
  const avail = headerSec ? Math.max(200, headerSec.widthPx - 28) : 640;
  const gap = hb.cardGapPx;
  let gridTemplateColumns: string;
  if (hb.columnWidthMode === "custom") {
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
  const arFont = layout.bodyFonts.arabic;

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
    overflowWrap: "anywhere",
    wordBreak: "break-word",
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
          display: "flex",
          flexDirection: "column",
          gap: 3,
          alignItems: enAlignItems,
          textAlign: hb.englishAlign,
          fontFamily: enFont,
          color: textColors.english,
        }}
      >
        {showEn ? (
          <>
            <div
              className="wsv2-wf-seller-name"
              style={{
                color: textColors.english,
                ...(nameEnIsArabic
                  ? { ...rtlPlaintextBlockStyle("right"), fontFamily: arFont }
                  : {}),
              }}
            >
              {layout.seller.nameEn}
            </div>
            {layout.seller.addressEn ? (
              <div
                className="wsv2-wf-line"
                style={{
                  color: textColors.english,
                  ...(addrEnIsArabic
                    ? { ...rtlPlaintextBlockStyle("right"), fontFamily: arFont }
                    : {}),
                }}
              >
                {layout.seller.addressEn}
              </div>
            ) : null}
            {layout.seller.email ? (
              <div className="wsv2-wf-line" dir="ltr" style={{ color: textColors.english, unicodeBidi: "plaintext" }}>
                {layout.seller.email}
              </div>
            ) : null}
            {layout.seller.vatValue ? (
              <div className="wsv2-wf-line" style={{ color: textColors.english }}>
                <span className="wsv2-wf-line-label" style={{ color: textColors.english }}>
                  {layout.seller.vatLabelEn}
                </span>{" "}
                {layout.seller.vatValue}
              </div>
            ) : null}
            {layout.seller.crValue ? (
              <div className="wsv2-wf-line" style={{ color: textColors.english }}>
                <span className="wsv2-wf-line-label" style={{ color: textColors.english }}>
                  {layout.seller.crLabelEn}
                </span>{" "}
                {layout.seller.crValue}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

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
              width: hb.logoWidthPx,
              height: hb.logoHeightPx,
              objectFit: "contain",
              flexShrink: 0,
              display: "block",
            }}
          />
        ) : (
          <div
            className="wsv2-wf-logo-box"
            style={{ width: hb.logoWidthPx, height: hb.logoHeightPx, boxSizing: "border-box" }}
            aria-hidden="true"
          />
        )}
      </div>

      <div
        className="wsv2-header-card-ar"
        dir="rtl"
        lang="ar"
        style={{
          ...cardShell(),
          ...arBlockBidi,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          alignItems: arAlignItems,
          textAlign: hb.arabicAlign,
          fontFamily: arFont,
          color: textColors.arabic,
        }}
      >
        {showAr ? (
          <>
            {layout.seller.nameAr || layout.seller.nameEn ? (
              <div
                className="wsv2-wf-seller-name"
                style={{ color: textColors.arabic, ...rtlPlaintextBlockStyle(arAlignKey) }}
              >
                {layout.seller.nameAr || layout.seller.nameEn}
              </div>
            ) : null}
            {layout.seller.addressAr ? (
              <div className="wsv2-wf-line" style={{ color: textColors.arabic, ...rtlPlaintextBlockStyle(arAlignKey) }}>
                {layout.seller.addressAr}
              </div>
            ) : null}
            {layout.seller.email ? (
              <div
                className="wsv2-wf-line"
                dir="ltr"
                style={{ color: textColors.arabic, unicodeBidi: "plaintext", textAlign: arAlignKey === "left" ? "left" : "right", width: "100%" }}
              >
                {layout.seller.email}
              </div>
            ) : null}
            {layout.seller.vatValue ? (
              <div
                className="wsv2-wf-line"
                style={{ color: textColors.arabic, ...rtlPlaintextBlockStyle(arAlignKey) }}
              >
                <span className="wsv2-wf-line-label" style={{ color: textColors.arabic }}>
                  {layout.seller.vatLabelAr}
                </span>
                <span style={ltrIsolateStyle()}>{"\u200e "}{layout.seller.vatValue}</span>
              </div>
            ) : null}
            {layout.seller.crValue ? (
              <div
                className="wsv2-wf-line"
                style={{ color: textColors.arabic, ...rtlPlaintextBlockStyle(arAlignKey) }}
              >
                <span className="wsv2-wf-line-label" style={{ color: textColors.arabic }}>
                  {layout.seller.crLabelAr}
                </span>
                <span style={ltrIsolateStyle()}>{"\u200e "}{layout.seller.crValue}</span>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function TitleSection({ layout, language }: { layout: LayoutPlan; language: LangMode }) {
  const en = layout.textColors.english;
  const ar = layout.textColors.arabic;
  const arFont = layout.bodyFonts.arabic;
  return (
    <div className="wsv2-wf-title">
      {language !== "arabic" ? (
        <div className="wsv2-wf-title-en" style={{ color: en }}>{layout.title.en}</div>
      ) : null}
      {language !== "english" ? (
        <div
          className="wsv2-wf-title-ar"
          dir="rtl"
          lang="ar"
          style={{ color: ar, fontFamily: arFont, unicodeBidi: "plaintext", textAlign: "center" }}
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
  const gridTemplateColumns = `${enW}px minmax(${valMin}px, 1fr) ${arW}px`;

  return (
    <div
      className="wsv2-wf-info-grid"
      style={{
        padding: infoLayout.cardPaddingPx,
        gap: infoLayout.rowGapPx,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
      }}
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
            style={{
              textAlign: infoLayout.englishAlign,
              color: textColors.english,
              fontFamily: bodyFonts.english,
              lineHeight: 1.3,
              justifySelf: "stretch",
              width: "100%",
            }}
          >
            {language === "arabic" ? "\u00A0" : row.labelEn}
          </div>
          <div
            className="wsv2-info-cell-value wsv2-wf-info-value"
            dir={containsArabic(row.value || "") ? "rtl" : "ltr"}
            style={{
              textAlign: infoLayout.valueAlign,
              color: textColors.english,
              fontFamily: containsArabic(row.value || "") ? bodyFonts.arabic : bodyFonts.english,
              lineHeight: 1.3,
              justifySelf: "stretch",
              width: "100%",
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
              fontFamily: bodyFonts.arabic,
              lineHeight: 1.3,
              justifySelf: "stretch",
              width: "100%",
            }}
          >
            {language === "english" ? "\u00A0" : row.labelAr}
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomerSection({ layout, language }: { layout: LayoutPlan; language: LangMode }) {
  return (
    <div className="wsv2-wf-section-body wsv2-wf-naked-section">
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

function DocInfoSection({ layout, language }: { layout: LayoutPlan; language: LangMode }) {
  return (
    <div className="wsv2-wf-section-body wsv2-wf-naked-section">
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
  bodyFonts,
}: {
  layout: LayoutPlan;
  language: LangMode;
  density: "compact" | "normal" | "wide";
  resizable?: boolean;
  onWidthChange?: (widths: Partial<Record<ColumnKey, number>>) => void;
  schema: DocumentTemplateSchema;
  /** Canonical max inner width (card); live resize uses measured wrap when available. */
  tableTargetPx: number;
  textColors: { english: string; arabic: string };
  bodyFonts: LayoutPlan["bodyFonts"];
}) {
  const cols = layout.itemColumns;
  const keys = useMemo(() => cols.map((c) => c.key), [cols]);
  const minGetter = useMemo(
    () => buildMinWidthGetter(schema.itemColumns as ItemColumnSpec[]),
    [schema.itemColumns],
  );
  const tableRef = useRef<HTMLTableElement | null>(null);
  const tableWrapRef = useRef<HTMLDivElement | null>(null);
  const [tableHeight, setTableHeight] = useState(0);
  const [wrapW, setWrapW] = useState(0);

  const sumW = useMemo(
    () => Math.max(1, cols.reduce((s, c) => s + c.widthPx, 0)),
    [cols],
  );
  const colPcts = useMemo(() => {
    if (cols.length === 0) return [] as number[];
    const p: number[] = [];
    let acc = 0;
    for (let i = 0; i < cols.length; i++) {
      if (i === cols.length - 1) {
        p.push(100 - acc);
      } else {
        const t = (100 * cols[i]!.widthPx) / sumW;
        p.push(t);
        acc += t;
      }
    }
    return p;
  }, [cols, sumW]);

  const emitWidths = useCallback(
    (arr: number[]) => {
      const cap = wrapW > 0 ? Math.round(wrapW) : tableTargetPx;
      const r = fitItemColumnWidthsToTarget(keys, arr, cap, minGetter);
      onWidthChange?.(widthsArrayToRecord(keys, r));
    },
    [keys, onWidthChange, tableTargetPx, wrapW, minGetter],
  );

  useLayoutEffect(() => {
    const wrap = tableWrapRef.current;
    const tbl = tableRef.current;
    if (!wrap || !tbl) return;
    const ro = new ResizeObserver(() => {
      setWrapW(wrap.clientWidth);
      setTableHeight(tbl.offsetHeight);
    });
    ro.observe(wrap);
    setWrapW(wrap.clientWidth);
    setTableHeight(tbl.offsetHeight);
    return () => ro.disconnect();
  }, [layout.itemColumns, layout.itemRows, language, density, colPcts]);

  const onHandlePointerDown = (rightIndex: number, e: ReactPointerEvent<HTMLDivElement>) => {
    if (!onWidthChange) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.button !== 0) return;
    const startWidths = cols.map((c) => c.widthPx);
    const startX = e.clientX;
    const pointerId = e.pointerId;
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const delta = ev.clientX - startX;
      const next = applyBoundaryDragPx(keys, startWidths, rightIndex, delta, minGetter);
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
    <div className="wsv2-wf-section-body wsv2-wf-naked-section wsv2-wf-items-outer" data-wsv2-resizable={showHandles ? "true" : undefined}>
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
          style={{
            tableLayout: "fixed",
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <colgroup>
            {cols.map((col, i) => (
              <col
                key={col.key}
                style={{ width: `${colPcts[i]!}%` }}
              />
            ))}
          </colgroup>
          <thead>
            {language !== "arabic" ? (
              <tr className="wsv2-wf-hdr-en">
                {cols.map((col) => {
                  const hdrLtr =
                    col.format === "money" ||
                    col.format === "percent" ||
                    col.format === "qty" ||
                    col.key === "index";
                  return (
                  <th
                    key={col.key}
                    dir={hdrLtr ? "ltr" : undefined}
                    style={{
                      textAlign: col.align,
                      color: textColors.english,
                      whiteSpace: hdrLtr ? "nowrap" : undefined,
                    }}
                    className="wsv2-wf-th"
                    scope="col"
                  >
                    {col.labelEn}
                  </th>
                  );
                })}
              </tr>
            ) : null}
            {language !== "english" ? (
              <tr className="wsv2-wf-hdr-ar">
                {cols.map((col) => {
                  const hdrLtr =
                    col.format === "money" ||
                    col.format === "percent" ||
                    col.format === "qty" ||
                    col.key === "index";
                  return (
                  <th
                    key={`${col.key}-ar`}
                    style={{
                      textAlign: col.align,
                      color: textColors.arabic,
                      whiteSpace: hdrLtr ? "nowrap" : undefined,
                    }}
                    className="wsv2-wf-th wsv2-wf-type-ar"
                    dir={hdrLtr ? "ltr" : "rtl"}
                    lang="ar"
                    scope="col"
                  >
                    {col.labelAr}
                  </th>
                  );
                })}
              </tr>
            ) : null}
          </thead>
          <tbody>
            {layout.itemRows.map((row) => (
              <tr key={row.index}>
                {cols.map((col) => {
                  const cellText = row.cells[col.key] || "";
                  const arCell =
                    containsArabic(cellText) &&
                    (col.key === "description" || col.key === "remarks" || col.key === "unit");
                  const forceLtrNumeric =
                    col.format === "money" ||
                    col.format === "percent" ||
                    col.format === "qty" ||
                    col.key === "index";
                  const cellDir = forceLtrNumeric ? "ltr" : arCell ? "rtl" : "ltr";
                  return (
                  <td
                    key={col.key}
                    dir={cellDir}
                    lang={arCell && !forceLtrNumeric ? "ar" : undefined}
                    style={{
                      textAlign: col.align,
                      color: textColors.english,
                      unicodeBidi: "plaintext",
                      fontFamily: arCell ? bodyFonts.arabic : undefined,
                      whiteSpace: forceLtrNumeric ? "nowrap" : undefined,
                    }}
                    className={["wsv2-wf-td", arCell ? "wsv2-wf-type-ar" : ""].filter(Boolean).join(" ")}
                  >
                    {cellText}
                  </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {showHandles && cols.length > 1
          ? Array.from({ length: cols.length - 1 }, (_, hIdx) => {
              const rightIndex = hIdx + 1;
              const leftFrac = cols.slice(0, rightIndex).reduce((s, c) => s + c.widthPx, 0) / sumW;
              const leftPx = (wrapW > 0 ? leftFrac * wrapW : 0) - 4;
              return (
                <div
                  key={`h-${rightIndex}`}
                  className="wsv2-wf-col-resize-handle"
                  style={{
                    top: 0,
                    left: leftPx,
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
                    const w = cols.map((x) => x.widthPx);
                    const delta = e.key === "ArrowRight" ? 2 : -2;
                    const next = applyBoundaryDragPx(keys, w, rightIndex, delta, minGetter);
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
  const amtW = Math.max(48, tb.totals_amount_col_width_px);
  const curW = Math.max(22, tb.totals_currency_col_width_px);
  const gridTemplateColumns = `${tb.totals_desc_col_width_px}px ${curW}px ${amtW}px`;
  const dAlign = tb.totals_desc_align ?? "left";
  const cAlign = tb.totals_currency_align ?? "center";
  const aAlign = tb.totals_amount_align ?? "right";
  return (
    <div className="wsv2-wf-totals" style={{ gap: tb.rowGapPx }}>
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
          }}
        >
          <div
            className="wsv2-wf-totals-label wsv2-wf-totals-desc wsv2-totals-desc"
            dir="ltr"
            style={{ textAlign: dAlign }}
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
            }}
          >
            {row.currencySymbol}
          </div>
          <div
            className="wsv2-wf-totals-value wsv2-totals-amount"
            style={{
              textAlign: aAlign,
              fontVariantNumeric: "tabular-nums",
              color: textColors.english,
              fontWeight: row.emphasis ? 700 : 400,
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
          <img
            src={qrImageDataUrl}
            alt="ZATCA QR"
            className="wsv2-wf-qr-image"
            width={Math.round(qb.imageSizePx)}
            height={Math.round(qb.imageSizePx)}
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
    <div className="wsv2-wf-footer-bar">
      <span className="wsv2-wf-footer-text">
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
    style.width = wPx;
    style.maxWidth = wPx;
  }
  if (fixH > 0) {
    style.height = fixH;
  }
  return { shellClass, style };
}

function SectionShell({ section, active, onSelect, setRef, children, styleOverride, shellClass }: SectionShellProps) {
  const computed: CSSProperties = {
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
                  width: "100%",
                  maxWidth: totalsSection.widthPx,
                  minWidth: 0,
                  flex: "0 0 auto",
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
          case "header":         return <HeaderSection layout={layout} language={language} showHeaderAccent={ui.showHeaderGreenAccent} logoDataUrl={templateAssets.logoDataUrl} textColors={layout.textColors} cardBorder={ui.cardBorder} />;
          case "title":          return <TitleSection layout={layout} language={language} />;
          case "customer":       return <CustomerSection layout={layout} language={language} />;
          case "docInfo":        return <DocInfoSection layout={layout} language={language} />;
          case "items":          return (
            <ItemsSection
              layout={layout}
              language={language}
              density={density}
              resizable={resizableItemColumns}
              onWidthChange={onItemColumnWidthChange}
              schema={schema}
              tableTargetPx={getItemsTableInnerTargetPx(ui.margins)}
              textColors={layout.textColors}
              bodyFonts={layout.bodyFonts}
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

    const stampIdx = sectionRows.findIndex((r) => r.sectionId === "stampSignature");
    const preferBottom =
      stampIdx >= 0 && layout.stampSignatureBlock.preferBottomWhenSpaceAvailable !== false;
    const rowsWithSpacer: SectionRow[] =
      preferBottom && stampIdx >= 0
        ? [
            ...sectionRows.slice(0, stampIdx),
            {
              rowKey: "wsv2-stamp-bottom-spacer",
              sectionId: null,
              node: (
                <div
                  key="wsv2-stamp-bottom-spacer"
                  className="wsv2-stamp-signature-page-spacer"
                  style={{ flex: "1 1 auto", minHeight: 1, width: "100%", minWidth: 0 }}
                  aria-hidden
                />
              ),
            },
            ...sectionRows.slice(stampIdx),
          ]
        : sectionRows;

    const m = ui.margins;
    const padT = (m.topMm * 96) / 25.4;
    const padB = (m.bottomMm * 96) / 25.4;
    const innerMinH = PAGE_GEOMETRY.heightPx - padT - padB;

    return (
      <div
        ref={ref}
        className="wsv2-doc-paper-inner wsv2-doc-with-ui"
        data-style={style}
        data-lang={language}
        data-stamp-bottom-fill={preferBottom ? "true" : undefined}
        dir={dir}
        lang={isRtl ? "ar" : "en"}
        style={{
          width: "100%",
          maxWidth: PAGE_GEOMETRY.widthPx,
          boxSizing: "border-box",
          margin: 0,
          padding: `${padT}px ${(m.rightMm * 96) / 25.4}px ${padB}px ${(m.leftMm * 96) / 25.4}px`,
          ["--wsv2-en-fg" as string]: layout.textColors.english,
          ["--wsv2-ar-fg" as string]: layout.textColors.arabic,
          ["--wsv2-en-ff" as string]: ui.typography.enFontStack,
          ["--wsv2-ar-ff" as string]: ui.typography.arFontStack,
          ...(preferBottom
            ? {
                display: "flex",
                flexDirection: "column",
                minHeight: innerMinH,
              }
            : {}),
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
