/**
 * HTML → PDF using Chromium print.
 *
 * This keeps the exported file vector-based and crisp. The earlier raster
 * fallback made the studio text fuzzy; the direct print path is the sharp one.
 */

export async function generatePdfFromHtml(html: string, _options?: unknown): Promise<Buffer> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage({
      viewport: {
        width: 794,
        height: 1123,
      },
      deviceScaleFactor: 1,
    });

    await page.setContent(html, {
      waitUntil: "networkidle",
    });

    await page.emulateMedia({ media: "print" });
    await page.evaluate(async () => {
      const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
      if (fonts?.ready) {
        await fonts.ready.catch(() => void 0);
      }
    });

    const bytes = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return Buffer.from(bytes);
  } finally {
    await browser.close();
  }
}
