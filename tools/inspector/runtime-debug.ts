import { chromium } from "playwright";

const baseUrl = process.env.INSPECTOR_BASE_URL ?? "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  const screenshotPath = "qa_reports/runtime-debug-invoices.png";
  const calls: Array<{ method: string; url: string; status?: number }> = [];
  const failures: string[] = [];

  page.on("response", (response) => {
    const url = response.url();
    if (!url.startsWith(baseUrl) || !url.includes("/api/workspace/")) {
      return;
    }
    calls.push({ method: response.request().method(), url, status: response.status() });
  });

  page.on("console", (message) => {
    const text = message.text();
    if (/error|warning|hydration|failed/i.test(text)) {
      failures.push(text);
    }
  });

  await page.goto(`${baseUrl}/workspace/user/invoices`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  const registerRowButton = page.locator("button[data-inspector-row-clickable='true']").first();
  await registerRowButton.waitFor({ state: "visible", timeout: 30000 });

  const initialRows = await page.locator("button[data-inspector-row-clickable='true']").count();
  const layoutMetrics = await page.evaluate(() => {
    const documentWidth = document.documentElement.scrollWidth;
    const viewportWidth = window.innerWidth;
    const worklistButton = document.querySelector("button[data-inspector-row-clickable='true']") as HTMLElement | null;
    const firstRow = worklistButton?.closest("div[class]") as HTMLElement | null;
    const splitRoot = document.querySelector("[data-inspector-split-view='true']") as HTMLElement | null;
    const splitLayout = document.querySelector("[data-inspector-layout='invoice-workspace']") as HTMLElement | null;
    let scrollParent: HTMLElement | null = firstRow?.parentElement ?? null;

    while (scrollParent && scrollParent !== document.body) {
      const style = window.getComputedStyle(scrollParent);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        break;
      }
      scrollParent = scrollParent.parentElement;
    }

    const rowHeight = firstRow?.getBoundingClientRect().height ?? 0;
    const containerHeight = scrollParent?.clientHeight ?? 0;
    const splitColumns = splitRoot ? window.getComputedStyle(splitRoot).gridTemplateColumns : "unavailable";

    return {
      rowHeight,
      containerHeight,
      estimatedVisibleRows: rowHeight > 0 ? Math.floor(containerHeight / rowHeight) : 0,
      splitColumns,
      workspaceColumns: splitLayout ? window.getComputedStyle(splitLayout).gridTemplateColumns : "unavailable",
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      documentWidth,
      horizontalOverflow: Math.max(0, documentWidth - viewportWidth),
    };
  });
  await registerRowButton.click();
  await page.waitForTimeout(1200);

  const previewSurface = page.locator("[data-inspector-preview-surface='true']").first();
  const previewText = await previewSurface.textContent();
  await page.waitForTimeout(1600);
  const previewTextAfterSettle = await previewSurface.textContent();
  const qrVisible = await page.locator("[data-zatca-qr='true']").count();
  const qrUnavailable = await page.getByText("QR unavailable", { exact: false }).count();

  const pdfButton = page.getByRole("link", { name: /download pdf|starting pdf/i }).first();
  let downloadInfo: Record<string, unknown> = {};
  if (await pdfButton.count()) {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      pdfButton.click(),
    ]);
    const stream = await download.createReadStream();
    let size = 0;
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk) => {
        size += chunk.length;
      });
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });
    downloadInfo = {
      suggestedFilename: download.suggestedFilename(),
      size,
      url: download.url(),
    };
  }
  const successFeedbackVisible = await page.getByText("PDF download started.", { exact: false }).count();

  const grouped = new Map<string, number>();
  for (const call of calls) {
    grouped.set(`${call.method} ${call.url}`, (grouped.get(`${call.method} ${call.url}`) ?? 0) + 1);
  }

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const result = {
    initialRows,
    layoutMetrics,
    previewText: previewText?.replace(/\s+/g, " ").trim().slice(0, 300),
    previewStable: previewText?.replace(/\s+/g, " ").trim().slice(0, 180) === previewTextAfterSettle?.replace(/\s+/g, " ").trim().slice(0, 180),
    qrVisible,
    qrUnavailable,
    successFeedbackVisible,
    repeatedCalls: [...grouped.entries()].filter(([, count]) => count > 1).map(([key, count]) => ({ key, count })),
    calls,
    failures,
    downloadInfo,
    screenshotPath,
  };

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
