// Workspace — schema-driven PDF export (Wafeq Format 2 coordinates).
//
// Draws on A4 portrait (595.92 × 841.92 pt) using the same `LayoutPlan` the
// browser preview reads, so the PDF and preview stay in lock-step.
// Coordinate convention:
//   - Schema declares positions in CSS pixels (page = 794 × 1123 px)
//   - PDF uses points; conversion is `px * 0.75`
//   - PDF y-axis is bottom-up; we use `topY(yPx)` to convert top-down y to PDF y
//
// Arabic: Noto Naskh is embedded; Arabic text uses `shapeArabicForPdf` (no full-line reverse).
// Riyal totals symbol (⃁) is drawn with the embedded font — Helvetica is WinAnsi-only.
// Not PDF/A-3 (no AFRelationship XML attachment, no ICC output intent).

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  DEFAULT_QR_BLOCK,
  DEFAULT_STAMP_SIGNATURE_BLOCK,
  DEFAULT_TOTALS_BLOCK,
  mmToPx,
  normalizeStampSignatureBlock,
  TOTALS_RIYAL_GLYPH,
  type TemplateUiSettings,
} from "@/lib/workspace/template-ui-settings";
import { containsArabic, shapeArabicForPdf } from "@/lib/workspace/arabic-pdf-text";
import type { DocumentRecord } from "@/lib/workspace/types";
import {
  COLORS,
  PAGE_GEOMETRY,
  SPACING,
  TYPOGRAPHY,
  type ColumnKey,
  type DocumentTemplateSchema,
  type FieldKey,
  type LangMode,
  type SectionKey,
} from "@/lib/workspace/document-template-schemas";
import {
  buildDocumentLayout,
  type LayoutInfoRow,
  type LayoutItemColumn,
  type LayoutPlan,
  type LayoutSection,
  type LayoutTotalsRow,
  type RenderCustomer,
  type RenderSeller,
} from "@/lib/workspace/document-template-renderer";
import { buildPhase1Qr } from "./qr";

export type PdfSeller = RenderSeller;
export type PdfCustomer = RenderCustomer;

export type BuildPdfInput = {
  doc: DocumentRecord;
  schema: DocumentTemplateSchema;
  language?: LangMode;
  seller: PdfSeller;
  customer: PdfCustomer;
  /** @deprecated Ignored; English typography color is used instead. */
  accentHex?: string;
  qrPngDataUrl?: string;
  /** Template Studio / preview: margins, borders, title, typography. */
  ui?: TemplateUiSettings;
  /** Match preview: section/field/column visibility and column order. */
  hiddenSections?: Partial<Record<SectionKey, boolean>>;
  hiddenFields?: Partial<Record<FieldKey, boolean>>;
  hiddenColumns?: Partial<Record<ColumnKey, boolean>>;
  columnOrder?: ColumnKey[];
  templateId?: string;
  /** localStorage-backed logo / stamp / signature (data URLs). */
  templateAssets?: {
    logoDataUrl?: string | null;
    stampDataUrl?: string | null;
    signatureDataUrl?: string | null;
    signatoryName?: string;
    signatoryDesignation?: string;
  };
};

async function loadNotoNaskhBytes(): Promise<Uint8Array> {
  if (typeof window !== "undefined") {
    const res = await fetch(
      new URL("/fonts/NotoNaskhArabic-Regular.ttf", window.location.origin).href,
    );
    if (!res.ok) throw new Error("Failed to load Arabic font");
    return new Uint8Array(await res.arrayBuffer());
  }
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  return new Uint8Array(
    readFileSync(join(process.cwd(), "public", "fonts", "NotoNaskhArabic-Regular.ttf")),
  );
}

export type BuildPdfResult = {
  bytes: Uint8Array;
  filename: string;
  warnings: string[];
};

// ─── Coordinate helpers (Wafeq Format 2) ────────────────────────────────────

const PT_PER_PX = PAGE_GEOMETRY.pxToPt;
const PAGE_W_PT = PAGE_GEOMETRY.widthPt;
const PAGE_H_PT = PAGE_GEOMETRY.heightPt;

const px = (n: number) => n * PT_PER_PX;
const topY = (yPx: number) => PAGE_H_PT - yPx * PT_PER_PX;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace("#", "");
  const value =
    cleaned.length === 3
      ? cleaned.split("").map((c) => c + c).join("")
      : cleaned;
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return { r, g, b };
}

const inkColor    = (() => { const c = hexToRgb(COLORS.ink); return rgb(c.r, c.g, c.b); })();
const subtleColor = (() => { const c = hexToRgb(COLORS.inkSubtle); return rgb(c.r, c.g, c.b); })();
const borderLight = (() => { const c = hexToRgb(COLORS.borderLight); return rgb(c.r, c.g, c.b); })();
const tableHeaderBg = (() => { const c = hexToRgb(COLORS.tableHeaderBg); return rgb(c.r, c.g, c.b); })();

/** WinAnsi-safe text. Arabic glyphs are stripped + flagged. */
function safeAscii(input: string | undefined | null, warnings: string[]): string {
  if (!input) return "";
  let strippedArabic = false;
  const out = Array.from(input)
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 32 && code <= 126) return ch;
      if (code >= 160 && code <= 255) return ch;
      if (code === 0x2019 || code === 0x2018) return "'";
      if (code === 0x201c || code === 0x201d) return '"';
      if (code === 0x2013 || code === 0x2014) return "-";
      if (code === 0x00b7) return "-";
      if (
        (code >= 0x0600 && code <= 0x06ff) ||
        (code >= 0xfb50 && code <= 0xfdff) ||
        (code >= 0xfe70 && code <= 0xfeff)
      ) {
        strippedArabic = true;
        return "";
      }
      return "?";
    })
    .join("")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (strippedArabic && !warnings.includes("arabic-glyphs-not-embedded")) {
    warnings.push("arabic-glyphs-not-embedded");
  }
  return out;
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const idx = dataUrl.indexOf(",");
  const base64 = dataUrl.slice(idx + 1);
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  const Buffer = (globalThis as { Buffer?: { from: (b: string, e: string) => Uint8Array } }).Buffer;
  if (Buffer) return new Uint8Array(Buffer.from(base64, "base64"));
  throw new Error("No base64 decoder available");
}

// Word-wrap by approximate width. Uses font.widthOfTextAtSize for accuracy.
function wrapByWidth(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidthPt: number,
  warnings: string[],
  skipAscii = false,
): string[] {
  const safe = skipAscii ? (text || "") : safeAscii(text, warnings);
  if (!safe) return [""];
  const words = safe.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidthPt) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      // If a single word is wider than max, hard-truncate.
      if (font.widthOfTextAtSize(word, fontSize) > maxWidthPt) {
        let chunk = "";
        for (const ch of word) {
          if (font.widthOfTextAtSize(chunk + ch, fontSize) > maxWidthPt) {
            lines.push(chunk);
            chunk = ch;
          } else chunk += ch;
        }
        current = chunk;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

type DrawCtx = {
  page: PDFPage;
  helv: PDFFont;
  helvBold: PDFFont;
  arFont: PDFFont;
  warnings: string[];
  accent: ReturnType<typeof rgb>;
  qrImage: PDFImage | null;
  logoImage: PDFImage | null;
  stampImage: PDFImage | null;
  signatureImage: PDFImage | null;
  signatoryName: string;
  signatoryDesignation: string;
  /** Shift X from Wafeq legacy 48px margin. */
  dlx: number;
  dty: number;
  ui?: TemplateUiSettings;
};

function rgbFromLayoutEn(layout: LayoutPlan): ReturnType<typeof rgb> {
  try {
    const c = hexToRgb(layout.textColors.english);
    return rgb(c.r, c.g, c.b);
  } catch {
    return inkColor;
  }
}

function rgbFromLayoutAr(layout: LayoutPlan): ReturnType<typeof rgb> {
  try {
    const c = hexToRgb(layout.textColors.arabic);
    return rgb(c.r, c.g, c.b);
  } catch {
    return inkColor;
  }
}

function advX(x: number, ctx: DrawCtx): number {
  return x + ctx.dlx;
}

function advY(y: number, ctx: DrawCtx): number {
  return y + ctx.dty;
}

function fontForString(ctx: DrawCtx, s: string, fallBack: PDFFont): PDFFont {
  return containsArabic(s) ? ctx.arFont : fallBack;
}

function drawText(
  ctx: DrawCtx,
  text: string,
  xPt: number,
  yPt: number,
  size: number,
  font: PDFFont,
  color = inkColor,
) {
  if (!text) return;
  const f = fontForString(ctx, text, font);
  const payload = f === ctx.arFont ? shapeArabicForPdf(text) : safeAscii(text, ctx.warnings);
  ctx.page.drawText(payload, { x: xPt, y: yPt, size, font: f, color });
}

function drawTextAlign(
  ctx: DrawCtx,
  text: string,
  align: "left" | "right" | "center",
  cellLeftPx: number,
  cellWidthPx: number,
  yPx: number,
  size: number,
  font: PDFFont,
  color = inkColor,
  /** Horizontal padding; default matches schema. */
  cellPaddingPx: number = Number(SPACING.tableCellPaddingXPx),
) {
  if (!text) return;
  const f = fontForString(ctx, text, font);
  const payload = f === ctx.arFont ? shapeArabicForPdf(text) : safeAscii(text, ctx.warnings);
  const widthPt = f.widthOfTextAtSize(payload, size);
  const cl = advX(cellLeftPx, ctx);
  const innerLeftPt = px(cl + cellPaddingPx);
  const innerRightPt = px(cl + cellWidthPx - cellPaddingPx);
  let xPt: number;
  if (align === "right") xPt = innerRightPt - widthPt;
  else if (align === "center") xPt = (innerLeftPt + innerRightPt) / 2 - widthPt / 2;
  else xPt = innerLeftPt;
  ctx.page.drawText(payload, { x: xPt, y: topY(advY(yPx, ctx)) - size, size, font: f, color });
}

/**
 * Arabic regulatory label (reshaped) flush-right inside the card; ASCII VAT/CR value
 * with Helvetica immediately to its visual left — matches preview `unicode-bidi` + LTR isolate.
 */
function drawArHeaderLabelPlusAsciiValue(
  ctx: DrawCtx,
  labelAr: string,
  valueAscii: string,
  innerRightEdgeXpx: number,
  yPx: number,
  fontSize: number,
  color: ReturnType<typeof rgb>,
) {
  const val = safeAscii(valueAscii, ctx.warnings);
  const shLabel = shapeArabicForPdf(labelAr.trim());
  const wVal = val ? ctx.helv.widthOfTextAtSize(val, fontSize) : 0;
  const wLab = shLabel ? ctx.arFont.widthOfTextAtSize(shLabel, fontSize) : 0;
  const gapPt = 2;
  const yDraw = topY(advY(yPx, ctx)) - fontSize;
  const rightEdgePt = px(innerRightEdgeXpx);
  if (!shLabel && !val) return;
  const xVal = rightEdgePt - (val ? wVal : 0);
  if (val) {
    ctx.page.drawText(val, { x: xVal, y: yDraw, size: fontSize, font: ctx.helv, color });
  }
  if (shLabel) {
    const xLab = xVal - (val ? gapPt + wLab : wLab);
    ctx.page.drawText(shLabel, { x: xLab, y: yDraw, size: fontSize, font: ctx.arFont, color });
  }
}

function drawTotalsRowLabel(
  ctx: DrawCtx,
  language: LangMode,
  row: LayoutTotalsRow,
  layout: LayoutPlan,
  secX: number,
  labelW: number,
  yPx: number,
  size: number,
  descAlign: "left" | "center" | "right",
) {
  const enRgb = rgbFromLayoutEn(layout);
  const arRgb = rgbFromLayoutAr(layout);
  const fallback = subtleColor;
  if (language === "english") {
    const f = row.emphasis ? ctx.helvBold : ctx.helv;
    const c = row.emphasis ? enRgb : fallback;
    drawTextAlign(ctx, row.labelEn, descAlign, secX, labelW, yPx, size, f, c, 0);
    return;
  }
  if (language === "arabic") {
    const sh = shapeArabicForPdf(row.labelAr);
    const c = row.emphasis ? arRgb : fallback;
    drawTextAlign(ctx, sh, descAlign, secX, labelW, yPx, size, ctx.arFont, c, 0);
    return;
  }
  const fEn = row.emphasis ? ctx.helvBold : ctx.helv;
  const prefix = `${row.labelEn} / `;
  const shAr = shapeArabicForPdf(row.labelAr);
  const xStart = px(advX(secX, ctx));
  const yDraw = topY(advY(yPx, ctx)) - size;
  const wP = fEn.widthOfTextAtSize(prefix, size);
  const cEn = row.emphasis ? enRgb : fallback;
  const cAr = row.emphasis ? arRgb : fallback;
  ctx.page.drawText(prefix, { x: xStart, y: yDraw, size, font: fEn, color: cEn });
  ctx.page.drawText(shAr, { x: xStart + wP, y: yDraw, size, font: ctx.arFont, color: cAr });
}

function drawSectionFrame(ctx: DrawCtx, section: LayoutSection, heightPx: number) {
  if (section.id === "footer") return; // Footer is a bare bar.
  if (section.id === "totals") return; // Totals has no border per schema.
  if (section.id === "qr") return; // QR card is borderless per schema.
  const xPt = px(section.xPx);
  const yPt = topY(0) - px(0); // upper edge — section.y is computed by caller; we accept as parameter via yPx
  void yPt; // unused; the actual y is provided through the `yPx` arg via the caller when drawing
  // We use a separate helper because the section y has to come from the
  // sequential y tracker — drawSectionFrameAt below.
}

function drawSectionFrameAt(ctx: DrawCtx, xPx: number, yPx: number, widthPx: number, heightPx: number) {
  const borderOn = ctx.ui?.cardBorder?.show !== false;
  if (!borderOn) {
    return;
  }
  const w = Math.max(0, ctx.ui?.cardBorder?.widthPx ?? 1);
  const bcol = (() => {
    try {
      return hexToRgb(ctx.ui?.cardBorder?.color ?? COLORS.borderLight);
    } catch {
      return hexToRgb(COLORS.borderLight);
    }
  })();
  const borderColorPdf = rgb(bcol.r, bcol.g, bcol.b);
  const x = advX(xPx, ctx);
  const y = advY(yPx, ctx);
  ctx.page.drawRectangle({
    x: px(x),
    y: topY(y + heightPx),
    width: px(widthPx),
    height: px(heightPx),
    borderColor: borderColorPdf,
    borderWidth: w,
    color: rgb(1, 1, 1),
  });
}

// ─── Section drawers (return the section height in px) ──────────────────────

function drawHeader(ctx: DrawCtx, layout: LayoutPlan, language: LangMode, sec: LayoutSection, yPx: number): number {
  const h = sec.minHeightPx;
  const y0 = advY(yPx, ctx);
  const x0 = advX(sec.xPx, ctx);
  const hb = layout.headerBlock;
  const showAccent = ctx.ui?.showHeaderGreenAccent === true;
  const topH = showAccent ? SPACING.topAccentPx : 0;
  const enStrip = rgbFromLayoutEn(layout);
  if (showAccent) {
    ctx.page.drawRectangle({
      x: px(x0),
      y: topY(y0 + topH),
      width: px(sec.widthPx),
      height: px(topH),
      color: enStrip,
    });
  }

  const bodyTop = y0 + topH;
  const bodyH = h - topH;
  const padX = 14;
  const innerPad = 6;
  const cardH = Math.max(40, bodyH - 2 * innerPad);
  const rowY = bodyTop + innerPad;
  const availW = sec.widthPx - 2 * padX;
  const g = hb.cardGapPx;
  let wEn: number;
  let wLogo: number;
  let wAr: number;
  if (hb.columnWidthMode !== "custom") {
    const inner = Math.max(0, availW - 2 * g);
    wEn = wLogo = wAr = inner / 3;
  } else {
    wEn = hb.englishCardWidthPx;
    wLogo = hb.logoCardWidthPx;
    wAr = hb.arabicCardWidthPx;
    const raw = wEn + wLogo + wAr + 2 * g;
    if (raw > availW && raw > 0) {
      const s = availW / raw;
      wEn *= s;
      wLogo *= s;
      wAr *= s;
    }
  }

  const enBody = rgbFromLayoutEn(layout);
  const arBody = rgbFromLayoutAr(layout);
  const showEn = language !== "arabic";
  const showAr = language !== "english";

  const drawCardRect = (leftPx: number, widthPx: number) => {
    ctx.page.drawRectangle({
      x: px(leftPx),
      y: topY(rowY + cardH),
      width: px(widthPx),
      height: px(cardH),
      borderColor: borderLight,
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });
  };

  let xCursor = x0 + padX;
  drawCardRect(xCursor, wEn);
  const enPad = hb.cardPaddingPx;
  const enInnerL = xCursor + enPad;
  const enInnerW = Math.max(40, wEn - 2 * enPad);
  let ty = rowY + enPad;
  if (showEn) {
    const nameFs = TYPOGRAPHY.sellerNamePx;
    const lineFs = TYPOGRAPHY.labelPx;
    if (layout.seller.nameEn) {
      const ne = layout.seller.nameEn;
      const nameFont = fontForString(ctx, ne, ctx.helvBold);
      const namePl = nameFont === ctx.arFont ? shapeArabicForPdf(ne) : safeAscii(ne, ctx.warnings);
      const nw = nameFont.widthOfTextAtSize(namePl, nameFs);
      const nameX =
        nameFont === ctx.arFont ? px(enInnerL + enInnerW) - nw : px(enInnerL);
      ctx.page.drawText(namePl, {
        x: nameX,
        y: topY(ty) - nameFs,
        size: nameFs,
        font: nameFont,
        color: enBody,
      });
      ty += 18;
    }
    if (layout.seller.addressEn) {
      const wrapFont = containsArabic(layout.seller.addressEn) ? ctx.arFont : ctx.helv;
      const wrapped = wrapByWidth(layout.seller.addressEn, wrapFont, TYPOGRAPHY.bodyPx - 1, px(enInnerW), ctx.warnings, wrapFont === ctx.arFont);
      for (const wv of wrapped.slice(0, 4)) {
        const wf = fontForString(ctx, wv, ctx.helv);
        const pl = wf === ctx.arFont ? shapeArabicForPdf(wv) : safeAscii(wv, ctx.warnings);
        const w = wf.widthOfTextAtSize(pl, lineFs);
        const xLine = wf === ctx.arFont ? px(enInnerL + enInnerW) - w : px(enInnerL);
        ctx.page.drawText(pl, { x: xLine, y: topY(ty) - lineFs, size: lineFs, font: wf, color: enBody });
        ty += 11;
      }
    }
    if (layout.seller.email) {
      drawText(ctx, layout.seller.email, px(enInnerL), topY(ty) - lineFs, lineFs, ctx.helv, enBody);
      ty += 11;
    }
    if (layout.seller.vatValue) {
      const line = `${layout.seller.vatLabelEn} ${layout.seller.vatValue}`;
      drawText(ctx, line, px(enInnerL), topY(ty) - lineFs, lineFs, ctx.helv, enBody);
      ty += 11;
    }
    if (layout.seller.crValue) {
      const line = `${layout.seller.crLabelEn} ${layout.seller.crValue}`;
      drawText(ctx, line, px(enInnerL), topY(ty) - lineFs, lineFs, ctx.helv, enBody);
    }
  }

  xCursor += wEn + g;
  drawCardRect(xCursor, wLogo);
  const logoPad = hb.cardPaddingPx;
  const logoInnerL = xCursor + logoPad;
  const logoInnerW = Math.max(20, wLogo - 2 * logoPad);
  const logoInnerH = Math.max(20, cardH - 2 * logoPad);
  const lw = hb.logoWidthPx;
  const lh = hb.logoHeightPx;
  const boxW = Math.min(lw, logoInnerW);
  const boxH = Math.min(lh, logoInnerH);
  let drawW = boxW;
  let drawH = boxH;
  if (ctx.logoImage) {
    const ar0 = ctx.logoImage.width / ctx.logoImage.height;
    drawW = boxW;
    drawH = drawW / ar0;
    if (drawH > boxH) {
      drawH = boxH;
      drawW = drawH * ar0;
    }
    const lx =
      hb.logoAlign === "right"
        ? logoInnerL + logoInnerW - drawW
        : hb.logoAlign === "center"
          ? logoInnerL + (logoInnerW - drawW) / 2
          : logoInnerL;
    const lyTop = rowY + logoPad + (logoInnerH - drawH) / 2;
    ctx.page.drawImage(ctx.logoImage, {
      x: px(lx),
      y: topY(lyTop + drawH),
      width: px(drawW),
      height: px(drawH),
    });
  }

  xCursor += wLogo + g;
  drawCardRect(xCursor, wAr);
  const arPad = hb.cardPaddingPx;
  const arInnerR = xCursor + wAr - arPad;
  const arInnerW = Math.max(40, wAr - 2 * arPad);
  let ry = rowY + arPad;
  const arLineFs = TYPOGRAPHY.labelPx;
  const arNameFs = TYPOGRAPHY.sellerNamePx;
  if (showAr && (layout.seller.nameAr || layout.seller.nameEn)) {
    const nameAr = layout.seller.nameAr || layout.seller.nameEn;
    const nameFont = fontForString(ctx, nameAr, ctx.arFont);
    const shaped = nameFont === ctx.arFont ? shapeArabicForPdf(nameAr) : safeAscii(nameAr, ctx.warnings);
    const nw = nameFont.widthOfTextAtSize(shaped, arNameFs);
    ctx.page.drawText(shaped, {
      x: px(arInnerR) - nw,
      y: topY(ry) - arNameFs,
      size: arNameFs,
      font: nameFont,
      color: arBody,
    });
    ry += 18;
  }
  if (showAr && layout.seller.addressAr) {
    const wrapped = wrapByWidth(
      layout.seller.addressAr,
      ctx.arFont,
      TYPOGRAPHY.bodyPx,
      px(arInnerW - 8),
      ctx.warnings,
      true,
    );
    for (const wv of wrapped.slice(0, 4)) {
      const sh = shapeArabicForPdf(wv);
      const nw = ctx.arFont.widthOfTextAtSize(sh, arLineFs);
      ctx.page.drawText(sh, {
        x: px(arInnerR) - nw,
        y: topY(ry) - arLineFs,
        size: arLineFs,
        font: ctx.arFont,
        color: arBody,
      });
      ry += 11;
    }
  }
  if (showAr && layout.seller.email) {
    const t = layout.seller.email;
    const w = ctx.helv.widthOfTextAtSize(t, arLineFs);
    drawText(ctx, t, px(arInnerR) - w, topY(ry) - arLineFs, arLineFs, ctx.helv, arBody);
    ry += 11;
  }
  if (showAr && layout.seller.vatValue) {
    drawArHeaderLabelPlusAsciiValue(
      ctx,
      layout.seller.vatLabelAr,
      layout.seller.vatValue,
      arInnerR,
      ry,
      arLineFs,
      arBody,
    );
    ry += 11;
  }
  if (showAr && layout.seller.crValue) {
    drawArHeaderLabelPlusAsciiValue(
      ctx,
      layout.seller.crLabelAr,
      layout.seller.crValue,
      arInnerR,
      ry,
      arLineFs,
      arBody,
    );
  }

  return h;
}

function drawTitle(ctx: DrawCtx, layout: LayoutPlan, language: LangMode, sec: LayoutSection, yPx: number): number {
  const h = sec.minHeightPx;
  const y0 = advY(yPx, ctx);
  const x0 = advX(sec.xPx, ctx);
  const enSize = Math.round(ctx.ui?.title?.enFontPx ?? TYPOGRAPHY.titleEnPx);
  const arSize = Math.round(ctx.ui?.title?.arFontPx ?? TYPOGRAPHY.titleArPx);
  const enHex = layout.textColors.english;
  const arHex = layout.textColors.arabic;
  const enColor = (() => {
    const c = hexToRgb(enHex);
    return rgb(c.r, c.g, c.b);
  })();
  const arColor = (() => {
    const c = hexToRgb(arHex);
    return rgb(c.r, c.g, c.b);
  })();

  ctx.page.drawRectangle({
    x: px(x0),
    y: topY(y0 + h),
    width: px(sec.widthPx),
    height: px(h),
    borderColor: borderLight,
    borderWidth: 0.5,
    color: rgb(1, 1, 1),
  });
  if (language !== "arabic") {
    const text = safeAscii(layout.title.en, ctx.warnings);
    const w = ctx.helvBold.widthOfTextAtSize(text, enSize);
    ctx.page.drawText(text, {
      x: px(x0) + (px(sec.widthPx) - w) / 2,
      y: topY(y0 + 12) - enSize,
      size: enSize,
      font: ctx.helvBold,
      color: enColor,
    });
  }
  if (language !== "english") {
    const raw = layout.title.ar || "";
    if (raw) {
      const shaped = shapeArabicForPdf(raw);
      const w = ctx.arFont.widthOfTextAtSize(shaped, arSize);
      ctx.page.drawText(shaped, {
        x: px(x0) + (px(sec.widthPx) - w) / 2,
        y: topY(y0 + 38) - arSize,
        size: arSize,
        font: ctx.arFont,
        color: arColor,
      });
    }
  }
  return h;
}

function drawInfoTable(
  ctx: DrawCtx,
  rows: LayoutInfoRow[],
  language: LangMode,
  sec: LayoutSection,
  _headingEn: string,
  _headingAr: string,
  yPx: number,
  layout: LayoutPlan,
): number {
  const il = layout.infoLayout;
  const rowContentH = 15 + il.rowPaddingYPx * 2;
  const betweenGap = il.rowGapPx;
  const topPad = il.cardPaddingPx;
  const n = Math.max(rows.length, 1);
  const computedHeight =
    topPad + n * rowContentH + Math.max(0, n - 1) * betweenGap + topPad;
  const fixedShellH =
    sec.id === "customer"
      ? il.clientCardHeightPx
      : sec.id === "docInfo"
        ? il.documentCardHeightPx
        : 0;
  const h =
    fixedShellH > 0
      ? Math.max(fixedShellH, sec.minHeightPx)
      : Math.max(sec.minHeightPx, computedHeight);
  drawSectionFrameAt(ctx, sec.xPx, yPx, sec.widthPx, h);
  const sidePad = il.cardPaddingPx;
  const tableX = sec.xPx + sidePad;
  const tableW = Math.max(0, sec.widthPx - 2 * sidePad);
  const gap = 8;
  let enW = il.englishColumnWidthPx;
  let valW = il.valueColumnWidthPx;
  let arW = il.arabicColumnWidthPx;
  const sumCols = enW + valW + arW + 2 * gap;
  if (sumCols > tableW && tableW > 0) {
    const sc = tableW / sumCols;
    enW *= sc;
    valW *= sc;
    arW *= sc;
  }
  // Match preview: value column absorbs remaining width so Arabic track is flush to the right edge.
  valW = Math.max(1, tableW - enW - arW - 2 * gap);
  const enRgb = rgbFromLayoutEn(layout);
  const arRgb = rgbFromLayoutAr(layout);
  let cursorY = yPx + topPad;
  let xEn = tableX;
  const xVal = xEn + enW + gap;
  const xAr = xVal + valW + gap;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    ctx.page.drawLine({
      start: { x: px(tableX), y: topY(advY(cursorY, ctx)) },
      end: { x: px(tableX + tableW), y: topY(advY(cursorY, ctx)) },
      thickness: 0.5,
      color: borderLight,
    });
    const leftLabel = language === "arabic" ? "" : row.labelEn;
    drawTextAlign(ctx, leftLabel, il.englishAlign, xEn, enW, cursorY + 4, TYPOGRAPHY.infoLabelPx, ctx.helv, enRgb, 0);
    drawTextAlign(ctx, row.value || "—", il.valueAlign, xVal, valW, cursorY + 4, TYPOGRAPHY.infoValuePx, ctx.helv, enRgb, 0);
    const rightLabel = language === "english" ? "" : row.labelAr;
    const rightFont = language === "english" ? ctx.helv : ctx.arFont;
    drawTextAlign(ctx, rightLabel, il.arabicAlign, xAr, arW, cursorY + 4, TYPOGRAPHY.infoLabelPx, rightFont, arRgb, 0);
    cursorY += rowContentH;
    if (i < rows.length - 1) cursorY += betweenGap;
  }
  return h;
}

function drawArCellHeader(
  ctx: DrawCtx,
  text: string,
  col: { widthPx: number; align: string },
  cellLeftPx: number,
  yLine: number,
  size: number,
  color: ReturnType<typeof rgb> = inkColor,
) {
  const sh = shapeArabicForPdf(text);
  const w = ctx.arFont.widthOfTextAtSize(sh, size);
  const leftP = advX(cellLeftPx, ctx);
  const rightP = advX(cellLeftPx + col.widthPx, ctx);
  let xDraw: number;
  if (col.align === "right") {
    xDraw = px(rightP) - 4 - w;
  } else if (col.align === "center") {
    xDraw = (px(leftP) + px(rightP)) / 2 - w / 2;
  } else {
    xDraw = px(leftP) + 4;
  }
  ctx.page.drawText(sh, {
    x: xDraw,
    y: topY(advY(yLine, ctx)) - size,
    size,
    font: ctx.arFont,
    color,
  });
}

function drawItems(ctx: DrawCtx, layout: LayoutPlan, language: LangMode, sec: LayoutSection, yPx: number): number {
  const topPad = 8;
  const enHeaderH = language === "arabic" ? 0 : 19;
  const arHeaderH = language === "english" ? 0 : 17;
  const headerBlockH = (language === "bilingual" ? enHeaderH + arHeaderH : Math.max(enHeaderH, arHeaderH)) || 20;
  const itemRowH = 28;
  const computedHeight = topPad + headerBlockH + layout.itemRows.length * itemRowH + 12;
  const h = Math.max(sec.minHeightPx, computedHeight);
  drawSectionFrameAt(ctx, sec.xPx, yPx, sec.widthPx, h);
  const cols = layout.itemColumns;
  const totalDeclaredWidth = cols.reduce((sum, c) => sum + c.widthPx, 0);
  const tableX = sec.xPx + 14;
  const tableW = sec.widthPx - 28;
  const scale = tableW / totalDeclaredWidth;
  const scaledCols = cols.map((c) => ({ ...c, widthPx: c.widthPx * scale }));
  const headerY = yPx + topPad;
  const tx0 = advX(tableX, ctx);
  const bandH = language === "bilingual" ? enHeaderH + arHeaderH : headerBlockH;
  ctx.page.drawRectangle({
    x: px(tx0),
    y: topY(advY(headerY + bandH, ctx)),
    width: px(tableW),
    height: px(bandH),
    color: tableHeaderBg,
  });
  const enRgb = rgbFromLayoutEn(layout);
  const arRgb = rgbFromLayoutAr(layout);
  if (language !== "arabic") {
    let cl = tableX;
    for (const col of scaledCols) {
      drawTextAlign(ctx, col.labelEn, col.align, cl, col.widthPx, headerY + 2, TYPOGRAPHY.itemsHeaderEnPx, ctx.helvBold, enRgb);
      cl += col.widthPx;
    }
  }
  if (language !== "english") {
    const arY = language === "bilingual" ? headerY + enHeaderH : headerY;
    let cl = tableX;
    for (const col of scaledCols) {
      drawArCellHeader(ctx, col.labelAr, col, cl, arY + 2, TYPOGRAPHY.itemsHeaderArPx, arRgb);
      cl += col.widthPx;
    }
  }
  let rowY = headerY + bandH;
  for (const row of layout.itemRows) {
    let cellLeftCursor = tableX;
    for (const col of scaledCols) {
      const text = row.cells[col.key] ?? "";
      drawTextAlign(
        ctx,
        text,
        col.align,
        cellLeftCursor,
        col.widthPx,
        rowY + 6,
        TYPOGRAPHY.itemsCellPx,
        col.key === "lineTotal" ? ctx.helvBold : ctx.helv,
        inkColor,
      );
      cellLeftCursor += col.widthPx;
    }
    ctx.page.drawLine({
      start: { x: px(tx0), y: topY(advY(rowY + itemRowH, ctx)) },
      end: { x: px(tx0 + tableW), y: topY(advY(rowY + itemRowH, ctx)) },
      thickness: 0.4,
      color: borderLight,
    });
    rowY += itemRowH;
  }
  return h;
}

function drawTotalsBlock(ctx: DrawCtx, layout: LayoutPlan, language: LangMode, sec: LayoutSection, yPx: number): number {
  const tb = { ...DEFAULT_TOTALS_BLOCK, ...ctx.ui?.totalsBlock };
  const pad = tb.cardPaddingPx;
  const innerX = sec.xPx + pad;
  const innerW = Math.max(0, sec.widthPx - 2 * pad);
  const colGap = 10;
  let dW = tb.totals_desc_col_width_px;
  let cW = Math.max(22, tb.totals_currency_col_width_px);
  let aW = Math.max(48, tb.totals_amount_col_width_px);
  const sumCols = dW + cW + aW + 2 * colGap;
  if (sumCols > innerW && innerW > 0) {
    const scale = innerW / sumCols;
    dW *= scale;
    cW *= scale;
    aW *= scale;
  }
  const dAlign = tb.totals_desc_align ?? "left";
  const cAlign = tb.totals_currency_align ?? "center";
  const aAlign = tb.totals_amount_align ?? "right";
  const enRgb = rgbFromLayoutEn(layout);

  let cursorY = yPx + pad;
  for (const row of layout.totalsRows) {
    const labelSize = row.emphasis ? TYPOGRAPHY.bodyPx + 1 : TYPOGRAPHY.bodyPx;
    const valueSize = row.emphasis ? TYPOGRAPHY.sellerNamePx : TYPOGRAPHY.bodyPx;
    const valueFont = row.emphasis ? ctx.helvBold : ctx.helv;
    const valueColor = row.emphasis ? enRgb : inkColor;
    if (row.emphasis) {
      ctx.page.drawLine({
        start: { x: px(advX(innerX, ctx)), y: topY(advY(cursorY, ctx)) },
        end: { x: px(advX(innerX + innerW, ctx)), y: topY(advY(cursorY, ctx)) },
        thickness: 0.6,
        color: borderLight,
      });
      cursorY += 4;
    }
    const lineY = cursorY + 4;
    drawTotalsRowLabel(ctx, language, row, layout, innerX, dW, lineY, labelSize, dAlign);

    const sym = (row.currencySymbol || "").trim();
    const symColor = row.emphasis ? enRgb : subtleColor;
    const symFont = sym.includes(TOTALS_RIYAL_GLYPH) ? ctx.arFont : ctx.helv;
    drawTextAlign(ctx, sym, cAlign, innerX + dW + colGap, cW, lineY, valueSize, symFont, symColor, 0);

    drawTextAlign(
      ctx,
      row.amountOnly,
      aAlign,
      innerX + dW + colGap + cW + colGap,
      aW,
      lineY,
      valueSize,
      valueFont,
      valueColor,
      0,
    );

    cursorY += row.emphasis ? 22 : 18;
    cursorY += tb.rowGapPx;
  }

  const contentH = cursorY - yPx + pad;
  const floorH = tb.cardHeightPx && tb.cardHeightPx > 0 ? tb.cardHeightPx : sec.minHeightPx;
  return Math.max(floorH, contentH);
}

function drawQrBlock(ctx: DrawCtx, layout: LayoutPlan, language: LangMode, sec: LayoutSection, yPx: number): number {
  if (!layout.qr.applicable) return sec.minHeightPx;
  const qb = { ...DEFAULT_QR_BLOCK, ...ctx.ui?.qrBlock };
  const imageSidePx = qb.imageSizePx;
  const pad = 10;
  const xImgBase =
    qb.align === "left"
      ? sec.xPx + pad
      : qb.align === "right"
        ? sec.xPx + sec.widthPx - imageSidePx - pad
        : sec.xPx + (sec.widthPx - imageSidePx) / 2;
  const xImg = advX(xImgBase, ctx);
  if (ctx.qrImage) {
    ctx.page.drawImage(ctx.qrImage, {
      x: px(xImg),
      y: topY(advY(yPx + pad + imageSidePx, ctx)),
      width: px(imageSidePx),
      height: px(imageSidePx),
    });
  } else {
    ctx.page.drawRectangle({
      x: px(xImg),
      y: topY(advY(yPx + pad + imageSidePx, ctx)),
      width: px(imageSidePx),
      height: px(imageSidePx),
      borderColor: borderLight,
      borderWidth: 0.6,
      color: rgb(1, 1, 1),
    });
  }
  if (!qb.showCaptions) {
    return Math.max(sec.minHeightPx, pad + imageSidePx + pad * 2);
  }
  const captionW = sec.widthPx - 24;
  const captionXLeftPt = px(advX(sec.xPx + pad, ctx));
  const captionXRightPt = px(advX(sec.xPx + sec.widthPx - pad, ctx));
  const captionXCenterPt = (px(advX(sec.xPx, ctx)) + px(advX(sec.xPx + sec.widthPx, ctx))) / 2;
  let ly = yPx + pad + imageSidePx + 8;
  if (language !== "arabic") {
    const capFs = TYPOGRAPHY.qrCaptionPx;
    const wrapped = wrapByWidth(
      layout.qr.captionEn,
      ctx.helv,
      capFs,
      px(captionW),
      ctx.warnings,
    );
    for (const wv of wrapped.slice(0, 4)) {
      const wpt = ctx.helv.widthOfTextAtSize(wv, capFs);
      let xPt: number;
      if (qb.align === "left") xPt = captionXLeftPt;
      else if (qb.align === "right") xPt = captionXRightPt - wpt;
      else xPt = captionXCenterPt - wpt / 2;
      ctx.page.drawText(wv, { x: xPt, y: topY(advY(ly, ctx)) - capFs, size: capFs, font: ctx.helv, color: subtleColor });
      ly += capFs + 2;
    }
  }
  if (language !== "english") {
    const capFs = TYPOGRAPHY.qrCaptionPx;
    const wrapped = wrapByWidth(layout.qr.captionAr, ctx.arFont, capFs, px(captionW), ctx.warnings, true);
    for (const wv of wrapped.slice(0, 4)) {
      const sh = shapeArabicForPdf(wv);
      const wpt = ctx.arFont.widthOfTextAtSize(sh, capFs);
      let xPt: number;
      if (qb.align === "left") xPt = captionXLeftPt;
      else if (qb.align === "right") xPt = captionXRightPt - wpt;
      else xPt = captionXCenterPt - wpt / 2;
      ctx.page.drawText(sh, { x: xPt, y: topY(advY(ly, ctx)) - capFs, size: capFs, font: ctx.arFont, color: subtleColor });
      ly += capFs + 3;
    }
  }
  return Math.max(sec.minHeightPx, ly - yPx + 8);
}

function drawStampSignature(ctx: DrawCtx, layout: LayoutPlan, language: LangMode, sec: LayoutSection, yPx: number): number {
  if (!layout.stampSignature.enabled) return 0;
  const ssb = normalizeStampSignatureBlock({
    ...DEFAULT_STAMP_SIGNATURE_BLOCK,
    ...(ctx.ui?.stampSignatureBlock ?? {}),
  });
  const padOuter = 14;
  const innerW = sec.widthPx - 2 * padOuter;
  const midGap = 28;
  type Block = { x: number; w: number; labelEn: string; labelAr: string; kind: "stamp" | "sig" | "recv" };
  const blocks: Block[] = [];
  if (layout.stampSignature.showStamp) {
    blocks.push({
      x: sec.xPx + padOuter,
      w: (innerW - midGap) / 2,
      labelEn: "Company Stamp",
      labelAr: "ختم الشركة",
      kind: "stamp",
    });
  }
  if (layout.stampSignature.showSignature) {
    const colW = (innerW - midGap) / 2;
    const xSig =
      layout.stampSignature.showStamp
        ? sec.xPx + padOuter + colW + midGap
        : sec.xPx + padOuter;
    const wSig = layout.stampSignature.showStamp ? colW : innerW;
    blocks.push({
      x: xSig,
      w: wSig,
      labelEn: "Authorized Signature",
      labelAr: "التوقيع المعتمد",
      kind: "sig",
    });
  }
  if (layout.stampSignature.showReceiverSignature) {
    blocks.length = 0;
    const colW = (innerW - midGap) / 2;
    blocks.push({
      x: sec.xPx + padOuter,
      w: colW,
      labelEn: "Authorized Signature",
      labelAr: "التوقيع المعتمد",
      kind: "sig",
    });
    blocks.push({
      x: sec.xPx + padOuter + colW + midGap,
      w: colW,
      labelEn: "Receiver Signature",
      labelAr: "توقيع المستلم",
      kind: "recv",
    });
  }

  const pad = ssb.cardPaddingPx;
  const footerBand = 26;
  let blockMinH = 0;
  for (const b of blocks) {
    const isStamp = b.kind === "stamp";
    const isSig = b.kind === "sig";
    const metaReserve = isSig && (ctx.signatoryName || ctx.signatoryDesignation) ? 22 : 0;
    const imgH = isStamp ? ssb.stampImageHeightPx : isSig ? ssb.signatureImageHeightPx : 72;
    const need = pad * 2 + imgH + metaReserve + footerBand;
    blockMinH = Math.max(blockMinH, need);
  }
  const h = Math.max(sec.minHeightPx, ssb.cardMinHeightPx, blockMinH);
  drawSectionFrameAt(ctx, sec.xPx, yPx, sec.widthPx, h);

  const lineY = yPx + h - 18;
  const labelY = yPx + h - 11;

  for (const b of blocks) {
    const isStamp = b.kind === "stamp";
    const isSignature = b.kind === "sig";
    const img = isStamp ? ctx.stampImage : isSignature ? ctx.signatureImage : null;
    ctx.page.drawRectangle({
      x: px(b.x),
      y: topY(yPx + h),
      width: px(b.w),
      height: px(h),
      borderColor: borderLight,
      borderWidth: 0.5,
      color: rgb(1, 1, 1),
    });

    const metaReserve =
      isSignature && (ctx.signatoryName || ctx.signatoryDesignation) ? 22 : 0;
    const imgBottom = lineY - 8 - metaReserve;
    const contentTop = yPx + pad;

    if (img) {
      const capW = isStamp ? ssb.stampImageWidthPx : isSignature ? ssb.signatureImageWidthPx : 100;
      const capH = isStamp ? ssb.stampImageHeightPx : isSignature ? ssb.signatureImageHeightPx : 100;
      const maxWPx = Math.min(b.w - 2 * pad, capW);
      const maxHPx = Math.min(capH, Math.max(24, imgBottom - contentTop));
      const ar0 = img.width / img.height;
      let drawWPx = maxWPx;
      let drawHPx = drawWPx / ar0;
      if (drawHPx > maxHPx) {
        drawHPx = maxHPx;
        drawWPx = drawHPx * ar0;
      }
      const ix = b.x + (b.w - drawWPx) / 2;
      const iyTop = Math.max(contentTop, imgBottom - drawHPx);
      ctx.page.drawImage(img, {
        x: px(ix),
        y: topY(iyTop + drawHPx),
        width: px(drawWPx),
        height: px(drawHPx),
      });
    }

    if (isSignature && ctx.signatoryName) {
      drawTextAlign(
        ctx,
        ctx.signatoryName,
        "center",
        b.x,
        b.w,
        lineY - 18,
        TYPOGRAPHY.stampMetaPx,
        ctx.helv,
        rgbFromLayoutEn(layout),
        0,
      );
    }
    if (isSignature && ctx.signatoryDesignation) {
      drawTextAlign(
        ctx,
        ctx.signatoryDesignation,
        "center",
        b.x,
        b.w,
        lineY - 9,
        TYPOGRAPHY.stampDesignationPx,
        ctx.helv,
        subtleColor,
        0,
      );
    }

    if (ssb.footerLineEnabled) {
      ctx.page.drawLine({
        start: { x: px(b.x + pad), y: topY(lineY) },
        end: { x: px(b.x + b.w - pad), y: topY(lineY) },
        thickness: 0.5,
        color: subtleColor,
      });
    }

    const capRgb = rgbFromLayoutEn(layout);
    const stampCap = TYPOGRAPHY.stampCaptionPx;
    if (language === "english") {
      drawTextAlign(ctx, b.labelEn, "center", b.x, b.w, labelY, stampCap, ctx.helv, capRgb, 0);
    } else if (language === "arabic") {
      const sh = shapeArabicForPdf(b.labelAr);
      drawTextAlign(ctx, sh, "center", b.x, b.w, labelY, stampCap, ctx.arFont, rgbFromLayoutAr(layout), 0);
    } else {
      const pre = `${b.labelEn} / `;
      const wP = ctx.helv.widthOfTextAtSize(pre, stampCap);
      const shA = shapeArabicForPdf(b.labelAr);
      const wA = ctx.arFont.widthOfTextAtSize(shA, stampCap);
      const totW = wP + wA;
      const mid = (px(advX(b.x, ctx)) + px(advX(b.x + b.w, ctx))) / 2;
      const yDraw = topY(advY(labelY, ctx)) - stampCap;
      const x0 = mid - totW / 2;
      ctx.page.drawText(pre, { x: x0, y: yDraw, size: stampCap, font: ctx.helv, color: capRgb });
      ctx.page.drawText(shA, { x: x0 + wP, y: yDraw, size: stampCap, font: ctx.arFont, color: rgbFromLayoutAr(layout) });
    }
  }
  return h;
}

function drawFooter(ctx: DrawCtx, layout: LayoutPlan, language: LangMode, sec: LayoutSection, _yPx: number): number {
  // Footer is a fixed bar at y=1060 (Wafeq Format 2).
  const yPx = 1060;
  const widthPx = sec.widthPx;
  // Top border line
  ctx.page.drawLine({
    start: { x: px(sec.xPx), y: topY(yPx) },
    end: { x: px(sec.xPx + widthPx), y: topY(yPx) },
    thickness: 0.5,
    color: borderLight,
  });
  // Allowed text only: company names + page number. Forbidden: any
  // "Generated with Hisabix..." text.
  const sellerEn = layout.seller.nameEn;
  const sellerAr = layout.seller.nameAr;
  const fs = TYPOGRAPHY.smallPx;
  const enRgb = rgbFromLayoutEn(layout);
  const arRgb = rgbFromLayoutAr(layout);
  if (language === "english" || (language === "bilingual" && !sellerAr)) {
    const text = language === "english" ? sellerEn : `${sellerEn}`.trim();
    drawTextAlign(ctx, text, "center", sec.xPx, widthPx, yPx + 12, fs, ctx.helv, enRgb, 0);
  } else if (language === "arabic") {
    const t = (sellerAr || sellerEn).trim();
    const sh = shapeArabicForPdf(t);
    drawTextAlign(ctx, sh, "center", sec.xPx, widthPx, yPx + 12, fs, ctx.arFont, arRgb, 0);
  } else {
    const pre = `${sellerEn}  ·  `;
    const wP = ctx.helv.widthOfTextAtSize(pre, fs);
    const shA = shapeArabicForPdf(sellerAr!);
    const wA = ctx.arFont.widthOfTextAtSize(shA, fs);
    const totW = wP + wA;
    const mid = (px(advX(sec.xPx, ctx)) + px(advX(sec.xPx + widthPx, ctx))) / 2;
    const yDraw = topY(advY(yPx + 12, ctx)) - fs;
    const x0 = mid - totW / 2;
    ctx.page.drawText(pre, { x: x0, y: yDraw, size: fs, font: ctx.helv, color: enRgb });
    ctx.page.drawText(shA, { x: x0 + wP, y: yDraw, size: fs, font: ctx.arFont, color: arRgb });
  }
  // Page number bottom-right
  drawTextAlign(ctx, "Page 1 / 1", "right", sec.xPx, widthPx, yPx + 24, TYPOGRAPHY.smallPx, ctx.helv, subtleColor, 0);
  return sec.minHeightPx;
}

// ─── Builder ────────────────────────────────────────────────────────────────

export async function buildInvoicePdf(input: BuildPdfInput): Promise<BuildPdfResult> {
  const { doc, schema, seller, customer } = input;
  const language: LangMode = input.language ?? "bilingual";
  const warnings: string[] = [];

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(`${schema.title.en} ${doc.number}`);
  pdf.setAuthor(seller.name);

  const page = pdf.addPage([PAGE_W_PT, PAGE_H_PT]);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let arFont: PDFFont;
  try {
    const noto = await loadNotoNaskhBytes();
    arFont = await pdf.embedFont(noto, { subset: true });
  } catch {
    arFont = helv;
    warnings.push("arabic-font-embed-failed");
  }

  // Pre-build the QR image once so it can be reused if the schema places it.
  let qrImage: PDFImage | null = null;
  if (schema.qr.applicable) {
    try {
      const qrDataUrl =
        input.qrPngDataUrl ??
        (await buildPhase1Qr({
          sellerName: seller.name,
          vatNumber: seller.vatNumber,
          invoiceTotal: doc.total,
          vatAmount: doc.vat,
          timestamp: new Date(doc.issueDate).toISOString(),
        })).imageDataUrl;
      const bytes = dataUrlToBytes(qrDataUrl);
      qrImage = await pdf.embedPng(bytes);
    } catch {
      qrImage = null;
      warnings.push("qr-generation-failed");
    }
  }

  let logoImage: PDFImage | null = null;
  const logoUrl = input.templateAssets?.logoDataUrl;
  if (logoUrl) {
    const lb = dataUrlToBytes(logoUrl);
    try {
      logoImage = await pdf.embedPng(lb);
    } catch {
      try {
        logoImage = await pdf.embedJpg(lb);
      } catch {
        logoImage = null;
        warnings.push("logo-embed-failed");
      }
    }
  }

  let stampImage: PDFImage | null = null;
  const stampUrl = input.templateAssets?.stampDataUrl;
  if (stampUrl) {
    const b = dataUrlToBytes(stampUrl);
    try {
      stampImage = await pdf.embedPng(b);
    } catch {
      try {
        stampImage = await pdf.embedJpg(b);
      } catch {
        stampImage = null;
        warnings.push("stamp-embed-failed");
      }
    }
  }

  let signatureImage: PDFImage | null = null;
  const sigUrl = input.templateAssets?.signatureDataUrl;
  if (sigUrl) {
    const b = dataUrlToBytes(sigUrl);
    try {
      signatureImage = await pdf.embedPng(b);
    } catch {
      try {
        signatureImage = await pdf.embedJpg(b);
      } catch {
        signatureImage = null;
        warnings.push("signature-embed-failed");
      }
    }
  }

  const ui = input.ui;
  const ml = ui ? mmToPx(ui.margins.leftMm) : PAGE_GEOMETRY.contentXPx;
  const mt = ui ? mmToPx(ui.margins.topMm) : PAGE_GEOMETRY.contentYStartPx;
  const dlx = ml - PAGE_GEOMETRY.contentXPx;
  const dty = mt - PAGE_GEOMETRY.contentYStartPx;

  const layout = buildDocumentLayout({
    schema,
    doc,
    seller,
    customer,
    language,
    hiddenSections: input.hiddenSections,
    hiddenFields: input.hiddenFields,
    hiddenColumns: input.hiddenColumns,
    columnOrder: input.columnOrder,
    templateId: input.templateId,
    ui: input.ui,
  });

  const ctx: DrawCtx = {
    page,
    helv,
    helvBold,
    arFont,
    warnings,
    accent: rgbFromLayoutEn(layout),
    qrImage,
    logoImage,
    stampImage,
    signatureImage,
    signatoryName: (input.templateAssets?.signatoryName ?? "").trim(),
    signatoryDesignation: (input.templateAssets?.signatoryDesignation ?? "").trim(),
    dlx,
    dty,
    ui,
  };

  // Track the running y-cursor in pixels (top-down).
  let cursorY = PAGE_GEOMETRY.contentYStartPx;

  // Walk schema sections; pair up totals + qr split row.
  let i = 0;
  while (i < layout.sections.length) {
    const sec = layout.sections[i];
    const next = layout.sections[i + 1];
    // Split row handling.
    const isSplit =
      (sec.id === "qr" && sec.splitRow === "totals_left_qr" && next?.id === "totals" && next.splitRow === "totals_right") ||
      (sec.id === "totals" && sec.splitRow === "totals_right" && next?.id === "qr" && next.splitRow === "totals_left_qr");
    if (isSplit) {
      const qrSec = sec.id === "qr" ? sec : next!;
      const totSec = sec.id === "totals" ? sec : next!;
      const qrH = drawQrBlock(ctx, layout, language, qrSec, cursorY);
      const totH = drawTotalsBlock(ctx, layout, language, totSec, cursorY);
      cursorY += Math.max(qrH, totH) + SPACING.sectionGapPx;
      i += 2;
      continue;
    }

    let drewHeight = 0;
    switch (sec.id) {
      case "header":
        cursorY = PAGE_GEOMETRY.safeMarginTopPx; // exact y=42
        drewHeight = drawHeader(ctx, layout, language, sec, cursorY);
        break;
      case "title":
        cursorY = 178; // exact y per Wafeq
        drewHeight = drawTitle(ctx, layout, language, sec, cursorY);
        break;
      case "customer":
        cursorY = 252; // exact y per Wafeq
        drewHeight = drawInfoTable(ctx, layout.customerRows, language, sec, "Client company information", "بيانات العميل", cursorY, layout);
        break;
      case "docInfo":
        drewHeight = drawInfoTable(ctx, layout.documentInfoRows, language, sec, "Document information", "بيانات المستند", cursorY, layout);
        break;
      case "items":
        drewHeight = drawItems(ctx, layout, language, sec, cursorY);
        break;
      case "totals":
        drewHeight = drawTotalsBlock(ctx, layout, language, sec, cursorY);
        break;
      case "qr":
        drewHeight = drawQrBlock(ctx, layout, language, sec, cursorY);
        break;
      case "stampSignature":
        drewHeight = drawStampSignature(ctx, layout, language, sec, cursorY);
        break;
      case "footer":
        drewHeight = drawFooter(ctx, layout, language, sec, cursorY);
        break;
    }
    cursorY += drewHeight + SPACING.sectionGapPx;
    i += 1;
  }

  const dedup = Array.from(new Set(warnings));
  const bytes = await pdf.save();
  return {
    bytes,
    filename: `${doc.number}.pdf`,
    warnings: dedup,
  };
}

// Exported for diagnostics/tests if ever needed.
export type { LayoutPlan, LayoutSection, LayoutInfoRow, LayoutItemColumn };
