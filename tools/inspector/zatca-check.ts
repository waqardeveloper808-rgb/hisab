import path from "node:path";
import { PNG } from "pngjs";
import jsQR from "jsqr";
import type { BrowserContext, Page } from "playwright";
import type { InspectRouteConfig, ZatcaDetails, ZatcaStatus } from "./route-catalog";

type ZatcaResult = {
  status: ZatcaStatus;
  details?: ZatcaDetails;
};

const tlvFieldNames: Record<number, string> = {
  1: "Seller Name",
  2: "VAT Number",
  3: "Timestamp",
  4: "Invoice Total",
  5: "VAT Total",
};

export async function runZatcaCheck(
  page: Page,
  context: BrowserContext,
  baseUrl: string,
  route: InspectRouteConfig,
  screenshotsDir: string,
): Promise<ZatcaResult> {
  if (!route.supportsZatca) {
    return {
      status: "NOT_AVAILABLE",
      details: {
        issues: ["ZATCA verification is only attempted on invoice routes."],
      },
    };
  }

  const currentCandidate = await findQrCandidate(page);
  const invoiceDetailHref = await firstInvoiceDetailHref(page);

  if (!currentCandidate && !invoiceDetailHref) {
    return {
      status: "NOT_AVAILABLE",
      details: {
        issues: ["No invoice QR candidate was exposed on the inspected page."],
      },
    };
  }

  const qrPage = currentCandidate ? page : await context.newPage();
  let navigated = false;

  try {
    if (!currentCandidate && invoiceDetailHref) {
      navigated = true;
      await qrPage.goto(`${baseUrl}${invoiceDetailHref}`, { waitUntil: "domcontentloaded" });
      await qrPage.waitForTimeout(1200);
    }

    const candidate = currentCandidate ?? await findQrCandidate(qrPage);

    if (!candidate) {
      return {
        status: "NOT_AVAILABLE",
        details: {
          source_route: invoiceDetailHref ?? route.path,
          issues: ["Invoice route did not expose a QR element that could be inspected."],
        },
      };
    }

    const locator = qrPage.locator(candidate.selector).first();
    const screenshotPath = path.join(screenshotsDir, `${route.key}-zatca-qr.png`);
    const qrBase64 = await extractQrBase64(qrPage, candidate.selector);
    const imageBuffer = await locator.screenshot({ path: screenshotPath });
    const decodedPayload = await extractPayloadFromElement(qrPage, candidate.selector) ?? decodeQrBuffer(imageBuffer);

    if (!decodedPayload) {
      return {
        status: "INVALID",
        details: {
          source_route: invoiceDetailHref ?? route.path,
          qr_selector: candidate.selector,
          qr_screenshot_path: screenshotPath,
          qr_base64: qrBase64 ?? undefined,
          issues: ["QR image was captured but could not be decoded."],
        },
      };
    }

    const extractedFields = parseTlvPayload(decodedPayload);
    const pageFields = await extractPageFields(qrPage);
    const comparisons = Object.entries(tlvFieldNames).flatMap(([tag, field]) => {
      const qrValue = extractedFields[field];
      const pageValue = pageFields[field];

      if (!qrValue || !pageValue) {
        return [];
      }

      return [{
        field,
        qrValue,
        pageValue,
        matches: normalizeComparisonValue(qrValue) === normalizeComparisonValue(pageValue),
      }];
    });

    if (comparisons.length === 0) {
      return {
        status: "NOT_AVAILABLE",
        details: {
          source_route: invoiceDetailHref ?? route.path,
          qr_selector: candidate.selector,
          qr_screenshot_path: screenshotPath,
          qr_base64: qrBase64 ?? undefined,
          decoded_payload: decodedPayload,
          extracted_fields: extractedFields,
          issues: ["QR was decoded, but the page did not expose comparable invoice fields for verification."],
        },
      };
    }

    const invalidComparisons = comparisons.filter((comparison) => !comparison.matches);

    return {
      status: invalidComparisons.length > 0 ? "INVALID" : "VALID",
      details: {
        source_route: invoiceDetailHref ?? route.path,
        qr_selector: candidate.selector,
        qr_screenshot_path: screenshotPath,
        qr_base64: qrBase64 ?? undefined,
        decoded_payload: decodedPayload,
        extracted_fields: extractedFields,
        comparisons,
        issues: invalidComparisons.map((comparison) => `${comparison.field} mismatch: QR="${comparison.qrValue}" page="${comparison.pageValue}".`),
      },
    };
  } finally {
    if (navigated) {
      await qrPage.close();
    }
  }
}

async function findQrCandidate(page: Page) {
  const candidates = [
    "[data-zatca-qr='true']",
    "img[data-zatca-qr]",
    "canvas[data-zatca-qr]",
    "img[alt*='QR' i]",
    "img[alt*='zatca' i]",
    "img[src*='qr' i]",
    "canvas[aria-label*='qr' i]",
    "svg[aria-label*='qr' i]",
  ];

  for (const selector of candidates) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      return { selector };
    }
  }

  return null;
}

async function firstInvoiceDetailHref(page: Page) {
  const href = await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll("main a[href]")).find((anchor) => /\/workspace\/invoices\/\d+/.test(anchor.getAttribute("href") ?? ""));
    return link?.getAttribute("href") ?? null;
  });

  return href;
}

function decodeQrBuffer(buffer: Buffer) {
  try {
    const image = PNG.sync.read(buffer);
    const decoded = jsQR(new Uint8ClampedArray(image.data), image.width, image.height);
    return decoded?.data ?? null;
  } catch {
    return null;
  }
}

function parseTlvPayload(base64Payload: string) {
  const bytes = Buffer.from(base64Payload, "base64");
  const fields: Record<string, string> = {};

  let index = 0;

  while (index + 2 <= bytes.length) {
    const tag = bytes[index];
    const length = bytes[index + 1];
    const valueStart = index + 2;
    const valueEnd = valueStart + length;

    if (valueEnd > bytes.length) {
      break;
    }

    const key = tlvFieldNames[tag] ?? `Tag ${tag}`;
    fields[key] = bytes.subarray(valueStart, valueEnd).toString("utf8");
    index = valueEnd;
  }

  return fields;
}

async function extractPageFields(page: Page) {
  return page.evaluate(() => {
    const text = (document.querySelector("main")?.textContent ?? document.body.textContent ?? "").replace(/\s+/g, " ").trim();
    const moneyMatches = Array.from(text.matchAll(/(total|vat|tax total)\s*([0-9,.]+)\s*(sar)?/gi));
    const fields: Record<string, string> = {};

    const vatNumberMatch = text.match(/(VAT|Tax)\s*(Number|No\.?|#)?\s*[:\-]?\s*([0-9]{8,})/i);
    if (vatNumberMatch) {
      fields["VAT Number"] = vatNumberMatch[3];
    }

    const sellerMatch = text.match(/(Seller|Company|Legal name)\s*[:\-]?\s*([A-Za-z0-9&.,'\- ]{4,})/i);
    if (sellerMatch) {
      fields["Seller Name"] = sellerMatch[2].trim();
    }

    const timestampMatch = text.match(/(Issue date|Issued at|Timestamp)\s*[:\-]?\s*([0-9T:\- ]{8,})/i);
    if (timestampMatch) {
      fields["Timestamp"] = timestampMatch[2].trim();
    }

    for (const match of moneyMatches) {
      const label = match[1].toLowerCase();
      const value = match[2];
      if (label.includes("vat") || label.includes("tax")) {
        fields["VAT Total"] = value;
      } else if (label.includes("total")) {
        fields["Invoice Total"] = value;
      }
    }

    return fields;
  });
}

function normalizeComparisonValue(value: string) {
  return value.replace(/\s+/g, " ").replace(/,/g, "").trim().toLowerCase();
}

async function extractPayloadFromElement(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((element) => {
    return element.getAttribute("data-zatca-payload")
      ?? element.getAttribute("data-qr-payload")
      ?? null;
  }).catch(() => null);
}

async function extractQrBase64(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((element) => {
    if (element instanceof HTMLImageElement && element.src.startsWith("data:image/")) {
      return element.src.split(",")[1] ?? null;
    }

    if (element instanceof HTMLCanvasElement) {
      return element.toDataURL("image/png").split(",")[1] ?? null;
    }

    return null;
  }).catch(() => null);
}