import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.INSPECTOR_BASE_URL ?? "http://127.0.0.1:3012";
const invoiceIds = String(process.env.INSPECTOR_INVOICE_IDS ?? process.env.INSPECTOR_INVOICE_ID ?? "1101,1102")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 0);
const reportsDir = process.env.INSPECTOR_REPORTS_DIR
  ? path.resolve(process.cwd(), process.env.INSPECTOR_REPORTS_DIR)
  : path.join(process.cwd(), "qa_reports");

type CaptureCase = {
  invoiceId: number;
  documentNumber: string;
  selectedTemplate: { value: string; label: string } | null;
  templateOptions: Array<{ value: string; label: string }>;
  previewTextExcerpt: string;
  previewScreenshotPath: string;
  pdfHref: string | null;
  downloadInfo: { path: string; suggestedFilename: string; url: string } | null;
  pdfRouteScreenshotPath: string | null;
};

function safeSegment(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "default";
}

async function main() {
  await mkdir(reportsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 1080 },
  });

  try {
    const cases: CaptureCase[] = [];

    for (const invoiceId of invoiceIds) {
      const page = await context.newPage();

      try {
        await page.goto(`${baseUrl}/workspace/invoices/${invoiceId}`, { waitUntil: "networkidle" });
        await page.locator("[data-inspector-document-view='invoice']").waitFor({ state: "visible", timeout: 30000 });

        const templateSelect = page.locator("select").first();
        const templateOptions = await templateSelect.locator("option").evaluateAll((options) => options.map((option) => ({
          value: (option as HTMLOptionElement).value,
          label: option.textContent?.trim() ?? "",
        })));
        const explicitTemplates = templateOptions.filter((option) => option.value);
        const targets = explicitTemplates.length ? explicitTemplates : [templateOptions[0] ?? { value: "", label: "Default template" }];

        for (const chosenTemplate of targets) {
          if (chosenTemplate.value) {
            await templateSelect.selectOption(chosenTemplate.value);
            await page.waitForLoadState("networkidle");
          }

          await page.waitForTimeout(1000);

          const previewCard = page.locator("[data-inspector-preview-surface='true']").first();
          const previewText = (await previewCard.textContent())?.replace(/\s+/g, " ").trim() ?? "";
          const documentNumberMatch = previewText.match(/(?:INV|AHN-INV|UI-VALID)[A-Z0-9-]*/i);
          const documentNumber = documentNumberMatch?.[0] ?? `invoice-${invoiceId}`;
          const templateLabel = chosenTemplate?.label ?? "default-template";
          const artifactStem = `${safeSegment(documentNumber)}-${safeSegment(templateLabel)}`;
          const previewScreenshotPath = path.join(reportsDir, `${artifactStem}-preview.png`);
          const pdfPath = path.join(reportsDir, `${artifactStem}.pdf`);
          const pdfScreenshotPath = path.join(reportsDir, `${artifactStem}-pdf-route.png`);

          await page.screenshot({ path: previewScreenshotPath, fullPage: true });

          const printLink = page.getByRole("link", { name: /print|starting pdf/i }).first();
          const pdfHref = await printLink.getAttribute("href");

          let downloadInfo: { path: string; suggestedFilename: string; url: string } | null = null;
          if (await printLink.count()) {
            const [download] = await Promise.all([
              page.waitForEvent("download"),
              printLink.click(),
            ]);
            await download.saveAs(pdfPath);
            downloadInfo = {
              path: pdfPath,
              suggestedFilename: download.suggestedFilename(),
              url: download.url(),
            };
          }

          let pdfRouteScreenshotPath: string | null = null;
          if (pdfHref) {
            const pdfPage = await context.newPage();
            try {
              const resolvedPdfUrl = new URL(pdfHref, baseUrl).toString();
              await pdfPage.setContent(`<!doctype html><html><body style="margin:0;background:#d7ddd8;"><embed src="${resolvedPdfUrl}" type="application/pdf" style="width:100vw;height:100vh;" /></body></html>`, { waitUntil: "domcontentloaded" });
              await pdfPage.waitForTimeout(2000);
              await pdfPage.screenshot({ path: pdfScreenshotPath, fullPage: true });
              pdfRouteScreenshotPath = pdfScreenshotPath;
            } catch {
              pdfRouteScreenshotPath = null;
            } finally {
              await pdfPage.close();
            }
          }

          cases.push({
            invoiceId,
            documentNumber,
            selectedTemplate: chosenTemplate,
            templateOptions,
            previewTextExcerpt: previewText.slice(0, 600),
            previewScreenshotPath,
            pdfHref,
            downloadInfo,
            pdfRouteScreenshotPath,
          });
        }
      } finally {
        await page.close();
      }
    }

    const reportPath = path.join(reportsDir, "document-parity-matrix.json");
    const fs = await import("node:fs/promises");
    await fs.writeFile(reportPath, JSON.stringify({ baseUrl, invoiceIds, cases }, null, 2), "utf8");
    console.log(JSON.stringify({ reportPath, cases }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});