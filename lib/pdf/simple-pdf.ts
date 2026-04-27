import { chromium } from "playwright";

export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await chromium.launch({
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "load",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
