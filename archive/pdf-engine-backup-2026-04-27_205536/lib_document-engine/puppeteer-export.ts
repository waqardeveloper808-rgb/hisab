/**
 * Playwright + Chromium settings for `page.pdf()` Arabic shaping.
 * Uses **system** Noto / OS fonts (no embedded base64 @font-face) so HarfBuzz + fontconfig
 * resolve glyphs. On Linux install:
 *   `bash scripts/install-noto-fonts-debian.sh`
 * Use full Playwright browser: `npm run playwright:install` / `npx playwright install chromium`.
 */
import { execFileSync } from "node:child_process";
import { release } from "node:os";
import type { Browser, LaunchOptions, Page } from "playwright";

/** Pass to `chromium.launch(chromiumLaunchOptionsForPdf)`. */
export const chromiumLaunchOptionsForPdf: LaunchOptions = {
  headless: true,
  args: [
    "--font-render-hinting=medium",
    "--enable-font-antialiasing",
    "--disable-skia-runtime-opts",
    "--no-sandbox",
  ],
};

const SYSTEM_ARABIC_PDF_STYLE = `
  html, body, [data-wsv2] {
    font-family: "Noto Sans Arabic", Arial, sans-serif !important;
  }
  [dir="rtl"], [dir=rtl], .arabic, [lang="ar"] {
    font-family: "Noto Sans Arabic", Arial, sans-serif !important;
    direction: rtl;
    text-align: right;
  }
`;

export async function logChromiumOsAndNotoFonts(browser: Browser): Promise<void> {
  const v = await browser.version();
  // eslint-disable-next-line no-console
  console.error(`[renderDocumentPdf] Chromium version: ${v}`);
  // eslint-disable-next-line no-console
  console.error(`[renderDocumentPdf] OS: ${process.platform} ${release()}`);

  if (process.platform === "linux") {
    try {
      const noto = execFileSync("sh", ["-c", "fc-list : family | sort -u | grep -i noto | head -40 || true"], {
        encoding: "utf8",
        timeout: 8000,
        maxBuffer: 512 * 1024,
      });
      // eslint-disable-next-line no-console
      console.error(
        noto.trim()
          ? `[renderDocumentPdf] fc-list (noto subset):\n${noto.trim()}`
          : "[renderDocumentPdf] fc-list: no 'noto' families — install fonts-noto (scripts/install-noto-fonts-debian.sh).",
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[renderDocumentPdf] fc-list failed (fontconfig missing?)", e);
    }
  }
}

/**
 * Injects system-font-family CSS, waits for `document.fonts`, logs body `font-family`.
 * If the stack does not reference Noto Sans Arabic, logs Chromium version, OS, and Linux `fc-list`.
 */
export async function applyArabicFontBeforePdfRender(page: Page, browser: Browser): Promise<void> {
  await page.addStyleTag({ content: SYSTEM_ARABIC_PDF_STYLE });
  await page.evaluate(async () => {
    if (document.fonts) {
      await document.fonts.ready;
    }
  });
  await new Promise((r) => setTimeout(r, 50));

  const fontFamily = await page.evaluate(() => {
    const f = getComputedStyle(document.body).fontFamily;
    // eslint-disable-next-line no-console
    console.log(f);
    return f;
  });
  // eslint-disable-next-line no-console
  console.log(`[renderDocumentPdf] getComputedStyle(document.body).fontFamily: ${fontFamily}`);

  const looksLikeNoto = /noto.*arabic|noto sans arabic/i.test(fontFamily);
  if (!looksLikeNoto) {
    // eslint-disable-next-line no-console
    console.error(
      "[renderDocumentPdf] Arabic: body font stack does not mention Noto Sans Arabic — check system fonts.",
    );
    await logChromiumOsAndNotoFonts(browser);
  }
}
