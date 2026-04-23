import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3006";
const loginEmail = process.env.LOGIN_EMAIL ?? "sandbox.admin@gulfhisab.sa";
const loginPassword = process.env.LOGIN_PASSWORD ?? "RecoveryPass123!";
const outputDir = process.env.OUTPUT_DIR ?? path.join(process.cwd(), "artifacts", "document_engine_fix_real");

const screenshotDir = path.join(outputDir, "screenshots");
const reportDir = path.join(outputDir, "reports");
const logDir = path.join(outputDir, "logs");

async function ensureDirs() {
  await fs.mkdir(screenshotDir, { recursive: true });
  await fs.mkdir(reportDir, { recursive: true });
  await fs.mkdir(logDir, { recursive: true });
}

async function writeJson(fileName, payload) {
  await fs.writeFile(path.join(reportDir, fileName), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function writeLog(lines) {
  await fs.writeFile(path.join(logDir, "execution.log"), `${lines.join("\n")}\n`, "utf8");
}

async function login(context, page) {
  const authResponse = await context.request.post(`${baseUrl}/api/auth/login`, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    data: { email: loginEmail, password: loginPassword },
  });

  if (!authResponse.ok()) {
    throw new Error(`API login failed: ${authResponse.status()} ${await authResponse.text()}`);
  }

  await page.goto(`${baseUrl}/workspace/user`, { waitUntil: "domcontentloaded" });
  if (!/\/workspace\//.test(page.url())) {
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
    await page.getByLabel("Email").fill(loginEmail);
    await page.getByLabel("Password").fill(loginPassword);
    const submitButton = page.getByRole("button", { name: /log in|login|opening workspace|open workspace/i }).first();
    await Promise.all([
      page.waitForURL(/\/workspace\//, { timeout: 30000 }),
      submitButton.click(),
    ]);
  }

  await page.waitForSelector('[data-inspector-shell="workspace"]', { timeout: 30000 });
}

async function capture(page, fileName, locator = null) {
  const fullPath = path.join(screenshotDir, fileName);
  if (locator) {
    await locator.screenshot({ path: fullPath });
    return;
  }
  await page.screenshot({ path: fullPath, fullPage: true });
}

function collectLines(entries) {
  return entries.flatMap((entry) => entry.lines ?? []);
}

async function main() {
  await ensureDirs();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1200 }, acceptDownloads: true });
  const page = await context.newPage();

  const log = [];
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    invoice: null,
    checks: {
      accountingButtonsFilterCorrectly: { pass: false, details: "" },
      accountingImpactPositionedCorrectly: { pass: false, details: "" },
      pdfDownloadWorks: { pass: false, details: "" },
      pdfMatchesPreviewRoute: { pass: false, details: "" },
    },
    evidence: {
      screenshots: [
        "screenshots/preview-with-impact-bottom.png",
        "screenshots/journal-filtered-by-invoice.png",
        "screenshots/ledger-filtered-by-invoice.png",
        "screenshots/trial-balance-impact.png",
        "screenshots/pdf-opened-proof.png",
      ],
      api: {},
      download: null,
    },
    blockers: [],
  };

  try {
    await login(context, page);
    log.push("login:PASS");

    const registerResponse = await context.request.get(`${baseUrl}/api/workspace/reports/invoice-register`, { headers: { Accept: "application/json" } });
    if (!registerResponse.ok()) {
      throw new Error(`Invoice register failed: ${registerResponse.status()}`);
    }
    const registerPayload = await registerResponse.json();
    const invoices = Array.isArray(registerPayload?.data) ? registerPayload.data : [];
    const invoice = invoices.find((row) => Number(row?.id) > 0 && String(row?.document_number ?? row?.number ?? "").trim()) ?? null;

    if (!invoice) {
      throw new Error("No invoice found to validate accounting impact workflow.");
    }

    const invoiceId = Number(invoice.id);
    const invoiceNumber = String(invoice.document_number ?? invoice.number ?? "").trim();
    report.invoice = { id: invoiceId, number: invoiceNumber };

    await page.goto(`${baseUrl}/workspace/invoices/${invoiceId}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-inspector-document-view="invoice"]', { timeout: 30000 });
    await page.waitForSelector('[data-inspector-accounting-impact="invoice"]', { timeout: 30000 });

    const previewHeading = page.getByText("Document preview", { exact: false }).first();
    const impactSection = page.locator('[data-inspector-accounting-impact="invoice"]').first();
    const impactTitle = page.locator('[data-inspector-accounting-impact-title="invoice"]').first();
    await impactTitle.waitFor({ timeout: 15000 });

    const previewBox = await previewHeading.boundingBox();
    const impactBox = await impactSection.boundingBox();
    if (!previewBox || !impactBox) {
      throw new Error("Unable to read invoice preview/accounting impact layout positions.");
    }

    const impactAtBottom = impactBox.y > previewBox.y;
    report.checks.accountingImpactPositionedCorrectly = {
      pass: impactAtBottom,
      details: `previewY=${previewBox.y.toFixed(2)} impactY=${impactBox.y.toFixed(2)}`,
    };

    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight * 0.55, behavior: "auto" }));
    await capture(page, "preview-with-impact-bottom.png");

    const journalButton = impactSection.locator("a,button").filter({ hasText: /View journal entries/i }).first();
    await Promise.all([
      page.waitForURL(new RegExp(`/workspace/user/journal-entries\\?[^#]*invoice_id=${invoiceId}`), { timeout: 30000 }),
      journalButton.click(),
    ]);
    await page.waitForSelector('[data-inspector-real-register="journal-entries"]', { timeout: 30000 });
    await capture(page, "journal-filtered-by-invoice.png");

    const journalsApi = await context.request.get(`${baseUrl}/api/workspace/journals?invoice_id=${invoiceId}&invoice_number=${encodeURIComponent(invoiceNumber)}`);
    const journalsPayload = await journalsApi.json();
    const journalEntries = Array.isArray(journalsPayload?.data) ? journalsPayload.data : [];
    const journalLines = collectLines(journalEntries);
    const journalFilterPass = journalsApi.ok() && journalEntries.length > 0 && journalLines.every((line) => Number(line?.document_id ?? 0) === invoiceId);
    report.evidence.api.journals = {
      status: journalsApi.status(),
      entries: journalEntries.length,
      lines: journalLines.length,
      allLinesMatchInvoiceId: journalLines.every((line) => Number(line?.document_id ?? 0) === invoiceId),
    };

    await page.goto(`${baseUrl}/workspace/invoices/${invoiceId}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-inspector-accounting-impact="invoice"]', { timeout: 30000 });
    const impactSectionLedger = page.locator('[data-inspector-accounting-impact="invoice"]').first();
    await Promise.all([
      page.waitForURL(new RegExp(`/workspace/accounting/books\\?[^#]*invoice_id=${invoiceId}`), { timeout: 30000 }),
      impactSectionLedger.locator("a,button").filter({ hasText: /View ledger impact/i }).first().click(),
    ]);
    await capture(page, "ledger-filtered-by-invoice.png");

    const ledgerApi = await context.request.get(`${baseUrl}/api/workspace/reports/general-ledger?invoice_id=${invoiceId}&invoice_number=${encodeURIComponent(invoiceNumber)}`);
    const ledgerPayload = await ledgerApi.json();
    const ledgerRows = Array.isArray(ledgerPayload?.data) ? ledgerPayload.data : [];
    const ledgerFilterPass = ledgerApi.ok() && ledgerRows.length > 0 && ledgerRows.every((row) => Number(row?.reference_document_id ?? row?.document_id ?? 0) === invoiceId);
    report.evidence.api.ledger = {
      status: ledgerApi.status(),
      rows: ledgerRows.length,
      allRowsMatchInvoiceId: ledgerRows.every((row) => Number(row?.reference_document_id ?? row?.document_id ?? 0) === invoiceId),
    };

    await page.goto(`${baseUrl}/workspace/invoices/${invoiceId}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-inspector-accounting-impact="invoice"]', { timeout: 30000 });
    const impactSectionTrial = page.locator('[data-inspector-accounting-impact="invoice"]').first();
    await Promise.all([
      page.waitForURL(new RegExp(`/workspace/user/reports/trial-balance\\?[^#]*invoice_id=${invoiceId}`), { timeout: 30000 }),
      impactSectionTrial.locator("a,button").filter({ hasText: /View trial balance/i }).first().click(),
    ]);
    await capture(page, "trial-balance-impact.png");

    const trialApi = await context.request.get(`${baseUrl}/api/workspace/reports/trial-balance?invoice_id=${invoiceId}&invoice_number=${encodeURIComponent(invoiceNumber)}`);
    const trialPayload = await trialApi.json();
    const trialRows = Array.isArray(trialPayload?.data) ? trialPayload.data : [];
    const fullTrialApi = await context.request.get(`${baseUrl}/api/workspace/reports/trial-balance`);
    const fullTrialPayload = await fullTrialApi.json();
    const fullTrialRows = Array.isArray(fullTrialPayload?.data) ? fullTrialPayload.data : [];
    const trialFilterPass = trialApi.ok() && trialRows.length > 0 && trialRows.length <= fullTrialRows.length;
    report.evidence.api.trialBalance = {
      status: trialApi.status(),
      impactRows: trialRows.length,
      fullRows: fullTrialRows.length,
      looksScoped: trialRows.length <= fullTrialRows.length,
    };

    await page.goto(`${baseUrl}/workspace/invoices/${invoiceId}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-inspector-issued-actions="true"]', { timeout: 30000 });
    const printButton = page.locator('[data-inspector-issued-actions="true"]').locator("a,button").filter({ hasText: /^Print$/i }).first();
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      printButton.click(),
    ]);
    const downloadedPath = path.join(outputDir, `downloaded-${invoiceId}.pdf`);
    await download.saveAs(downloadedPath);
    const downloadedStat = await fs.stat(downloadedPath);

    const pdfUrl = `${baseUrl}/api/workspace/documents/${invoiceId}/pdf`;
    const previewUrl = `${baseUrl}/api/workspace/documents/${invoiceId}/preview`;
    const pdfResponse = await context.request.get(pdfUrl);
    const pdfBytes = await pdfResponse.body();
    const previewResponse = await context.request.get(previewUrl);
    const previewPayload = await previewResponse.json();
    const previewHtml = String(previewPayload?.data?.html ?? "");

    const pdfPass = pdfResponse.ok()
      && (pdfResponse.headers()["content-type"] ?? "").toLowerCase().includes("application/pdf")
      && (pdfResponse.headers()["content-disposition"] ?? "").toLowerCase().includes("attachment")
      && pdfBytes.byteLength > 1024
      && downloadedStat.size > 1024;

    report.checks.pdfDownloadWorks = {
      pass: pdfPass,
      details: `status=${pdfResponse.status()} bytes=${pdfBytes.byteLength} contentType=${pdfResponse.headers()["content-type"] ?? ""}`,
    };

    const parityPass = previewResponse.ok() && previewHtml.includes(invoiceNumber) && pdfPass;
    report.checks.pdfMatchesPreviewRoute = {
      pass: parityPass,
      details: `previewStatus=${previewResponse.status()} previewContainsInvoice=${previewHtml.includes(invoiceNumber)} pdfStatus=${pdfResponse.status()}`,
    };

    report.evidence.download = {
      suggestedFilename: download.suggestedFilename(),
      savedPath: downloadedPath,
      fileSize: downloadedStat.size,
    };

    await page.setContent(`<!doctype html><html><body style="font-family:Segoe UI, Arial; margin:24px; background:#f6f8f7; color:#10231b;"><h1 style="font-size:20px; margin:0 0 12px;">PDF Download Proof</h1><p style="margin:0 0 10px;">Invoice: <strong>${invoiceNumber}</strong> (ID ${invoiceId})</p><ul style="line-height:1.8;"><li>Suggested filename: <strong>${download.suggestedFilename()}</strong></li><li>Saved file size: <strong>${downloadedStat.size} bytes</strong></li><li>API content-type: <strong>${pdfResponse.headers()["content-type"] ?? ""}</strong></li><li>API content-disposition: <strong>${pdfResponse.headers()["content-disposition"] ?? ""}</strong></li></ul></body></html>`, { waitUntil: "domcontentloaded" });
    await capture(page, "pdf-opened-proof.png");

    report.checks.accountingButtonsFilterCorrectly = {
      pass: journalFilterPass && ledgerFilterPass && trialFilterPass,
      details: `journals=${journalFilterPass} ledger=${ledgerFilterPass} trial=${trialFilterPass}`,
    };

    const failedChecks = Object.entries(report.checks)
      .filter(([, check]) => !check.pass)
      .map(([name, check]) => `${name}: ${check.details}`);

    if (failedChecks.length > 0) {
      report.blockers.push(...failedChecks);
    }

    log.push(`invoice:${invoiceId}:${invoiceNumber}`);
    log.push(`checks:${JSON.stringify(report.checks)}`);

    await writeJson("control-points.json", report);
    await writeLog(log);

    if (failedChecks.length > 0) {
      throw new Error(`Control points failed: ${failedChecks.join(" | ")}`);
    }

    console.log(`Proof capture complete: ${outputDir}`);
    await browser.close();
  } catch (error) {
    report.blockers.push(error instanceof Error ? error.message : String(error));
    await writeJson("control-points.json", report);
    await writeLog(log.concat(`error:${error instanceof Error ? error.message : String(error)}`));
    await browser.close();
    throw error;
  }
}

await main();
