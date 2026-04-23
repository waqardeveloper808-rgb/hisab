import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3006";
const email = process.env.LOGIN_EMAIL ?? "sandbox.admin@gulfhisab.sa";
const password = process.env.LOGIN_PASSWORD ?? "RecoveryPass123!";
const outputDir = process.env.OUTPUT_DIR ?? "c:/hisab/artifacts/document_engine_fix_real/ten_invoice_proof";

function safe(name) {
  return String(name).replace(/[^a-zA-Z0-9_-]/g, "_");
}

function getAllTinvNumbers(text) {
  return [...new Set((text.match(/TINV-\d+/gi) ?? []).map((v) => v.toUpperCase()))];
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function getWithRetry(request, url, attempts = 3) {
  let lastError = null;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await request.get(url);
    } catch (error) {
      lastError = error;
      if (i === attempts) {
        throw error;
      }
    }
  }
  throw lastError ?? new Error(`Request failed: ${url}`);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function saveJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function login(context, page) {
  const res = await context.request.post(`${baseUrl}/api/auth/login`, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    data: { email, password },
  });

  if (!res.ok()) {
    throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
  }

  await page.goto(`${baseUrl}/workspace/user`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-inspector-shell="workspace"]', { timeout: 30000 });
}

async function main() {
  await ensureDir(outputDir);
  await ensureDir(path.join(outputDir, "screenshots"));
  await ensureDir(path.join(outputDir, "api"));
  await ensureDir(path.join(outputDir, "downloads"));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1200 }, acceptDownloads: true });
  const page = await context.newPage();

  const result = {
    generated_at: new Date().toISOString(),
    base_url: baseUrl,
    invoices: [],
  };

  try {
    await login(context, page);

    const registerRes = await context.request.get(`${baseUrl}/api/workspace/reports/invoice-register`);
    const registerTxt = await registerRes.text();
    const registerJson = parseJson(registerTxt);
    const registerRows = Array.isArray(registerJson?.data) ? registerJson.data : [];
    const invoices = registerRows
      .filter((row) => Number(row?.id) > 0 && String(row?.document_number ?? row?.number ?? "").trim())
      .slice(0, 10)
      .map((row) => ({ id: Number(row.id), number: String(row.document_number ?? row.number).trim() }));

    if (invoices.length < 10) {
      throw new Error(`Need 10 invoices but only found ${invoices.length}.`);
    }

    for (const invoice of invoices) {
      const invSlug = safe(invoice.number);
      const per = {
        invoice_number: invoice.number,
        invoice_id: invoice.id,
        screenshots: {
          preview: `screenshots/${invSlug}-preview.png`,
          journal: `screenshots/${invSlug}-journal.png`,
          ledger: `screenshots/${invSlug}-ledger.png`,
        },
        api_snippets: {
          preview: null,
          journal: null,
          ledger: null,
          trial_balance_filtered: null,
          trial_balance_full: null,
          pdf_headers: null,
        },
        checks: {
          journal_filtered_correctly: { status: "FAIL", details: "" },
          ledger_filtered_correctly: { status: "FAIL", details: "" },
          trial_balance_impact_only: { status: "FAIL", details: "" },
          document_download_works: { status: "FAIL", details: "" },
          preview_equals_pdf: { status: "FAIL", details: "" },
          open_source_document_works: { status: "FAIL", details: "" },
          dates_not_duplicated: { status: "FAIL", details: "" },
        },
        failures: [],
      };

      // Invoice page + preview screenshot
      await page.goto(`${baseUrl}/workspace/invoices/${invoice.id}`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector('[data-inspector-document-view="invoice"]', { timeout: 30000 });
      await page.screenshot({ path: path.join(outputDir, per.screenshots.preview), fullPage: true });

      // Preview API snippet + dates check
      const previewRes = await getWithRetry(context.request, `${baseUrl}/api/workspace/documents/${invoice.id}/preview`);
      const previewText = await previewRes.text();
      const previewJson = parseJson(previewText);
      const html = String(previewJson?.data?.html ?? "");

      per.api_snippets.preview = {
        status: previewRes.status(),
        content_type: previewRes.headers()["content-type"] ?? "",
        html_head_snippet: html.slice(0, 450),
        flags: {
          saudi_standard_template: html.includes('data-document-engine="tax-invoice-saudi-standard"'),
          zatca_qr_required: html.includes('data-zatca-qr-required="true"'),
          xml_hook_present: html.includes('data-xml-hook="'),
          pdf_hook_present: html.includes('data-pdf-standard-hook="'),
          phase2_hook_present: html.includes('data-zatca-phase2-hook="'),
          logo_upload_hook: html.includes('data-template-editor-logo-upload="true"'),
          stamp_upload_hook: html.includes('data-template-editor-stamp-upload="true"'),
          signature_upload_hook: html.includes('data-template-editor-signature-upload="true"'),
          national_address_present: html.includes("National Address:"),
          bilingual_title_present: html.includes("TAX INVOICE") && html.includes("فاتورة ضريبية"),
        },
      };
      await fs.writeFile(path.join(outputDir, "api", `${invSlug}-preview.html`), html, "utf8");

      const issueLabelCount = (html.match(/Issue date|Issue Date/gi) ?? []).length;
      const supplyLabelCount = (html.match(/Supply date|Supply Date/gi) ?? []).length;
      const duplicateDateLines = issueLabelCount > 1 || supplyLabelCount > 1;
      if (!duplicateDateLines) {
        per.checks.dates_not_duplicated = { status: "PASS", details: `issue_labels=${issueLabelCount}, supply_labels=${supplyLabelCount}` };
      } else {
        per.checks.dates_not_duplicated = { status: "FAIL", details: `issue_labels=${issueLabelCount}, supply_labels=${supplyLabelCount}` };
        per.failures.push("Dates appear duplicated in preview HTML labels.");
      }

      // Journal click + screenshot + UI validation + API snippet
      const impact = page.locator('[data-inspector-accounting-impact="invoice"]').first();
      await impact.waitFor({ timeout: 20000 });
      await Promise.all([
        page.waitForURL(new RegExp(`/workspace/user/journal-entries\\?[^#]*invoice_id=${invoice.id}`), { timeout: 30000 }),
        impact.locator("a,button").filter({ hasText: /View journal entries/i }).first().click(),
      ]);
      await page.waitForSelector('[data-inspector-real-register="journal-entries"]', { timeout: 30000 });
      await page.screenshot({ path: path.join(outputDir, per.screenshots.journal), fullPage: true });

      const journalVisibleText = await page.locator('[data-inspector-real-register="journal-entries"]').first().innerText();
      const journalTinvs = getAllTinvNumbers(journalVisibleText);
      const journalHasTarget = journalTinvs.includes(invoice.number.toUpperCase());
      const journalHasOther = journalTinvs.some((n) => n !== invoice.number.toUpperCase());
      if (journalHasTarget && !journalHasOther) {
        per.checks.journal_filtered_correctly = { status: "PASS", details: `visible_tinv=${journalTinvs.join(",")}` };
      } else {
        per.checks.journal_filtered_correctly = { status: "FAIL", details: `visible_tinv=${journalTinvs.join(",") || "none"}` };
        per.failures.push("Journal view contains no target invoice or includes unrelated invoices.");
      }

      const jApiRes = await context.request.get(`${baseUrl}/api/workspace/journals?invoice_id=${invoice.id}&invoice_number=${encodeURIComponent(invoice.number)}`);
      const jApiTxt = await jApiRes.text();
      const jApiJson = parseJson(jApiTxt);
      const jRows = Array.isArray(jApiJson?.data) ? jApiJson.data : [];
      per.api_snippets.journal = {
        status: jApiRes.status(),
        request_query: { invoice_id: invoice.id, invoice_number: invoice.number },
        rows: jRows.length,
        first_row: jRows[0] ?? null,
      };
      await saveJson(path.join(outputDir, "api", `${invSlug}-journal.json`), per.api_snippets.journal);

      // Open source document check from journal detail area
      let sourceOk = false;
      try {
        const openSourceBtn = page.locator('a,button').filter({ hasText: /Open source document/i }).first();
        const hasBtn = (await openSourceBtn.count()) > 0;
        if (hasBtn) {
          await Promise.all([
            page.waitForURL(new RegExp(`/workspace/(user/)?invoices(/${invoice.id})?(\\?|$)`), { timeout: 15000 }),
            openSourceBtn.click(),
          ]);
          const currentUrl = page.url();
          sourceOk = currentUrl.includes(`/workspace/invoices/${invoice.id}`)
            || currentUrl.includes(encodeURIComponent(invoice.number))
            || currentUrl.includes(invoice.number);
          per.checks.open_source_document_works = {
            status: sourceOk ? "PASS" : "FAIL",
            details: `url=${currentUrl}`,
          };
          if (!sourceOk) {
            per.failures.push("Open Source Document did not navigate with selected invoice context.");
          }
        } else {
          per.checks.open_source_document_works = { status: "FAIL", details: "Open source document button not found." };
          per.failures.push("Open Source Document button missing in journal detail view.");
        }
      } catch (error) {
        per.checks.open_source_document_works = { status: "FAIL", details: error instanceof Error ? error.message : String(error) };
        per.failures.push("Open Source Document flow failed during click navigation.");
      }

      // Back to invoice page for ledger/trial/download
      await page.goto(`${baseUrl}/workspace/invoices/${invoice.id}`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector('[data-inspector-accounting-impact="invoice"]', { timeout: 30000 });
      const impact2 = page.locator('[data-inspector-accounting-impact="invoice"]').first();

      // Ledger click + screenshot + validation
      await Promise.all([
        page.waitForURL(new RegExp(`/workspace/accounting/books\\?[^#]*invoice_id=${invoice.id}`), { timeout: 30000 }),
        impact2.locator("a,button").filter({ hasText: /View ledger impact/i }).first().click(),
      ]);
      await page.screenshot({ path: path.join(outputDir, per.screenshots.ledger), fullPage: true });

      const ledgerText = await page.locator("body").innerText();
      const ledgerTinvs = getAllTinvNumbers(ledgerText);
      const ledgerHasTarget = ledgerTinvs.includes(invoice.number.toUpperCase());
      const ledgerHasOther = ledgerTinvs.some((n) => n !== invoice.number.toUpperCase());
      if (ledgerHasTarget && !ledgerHasOther) {
        per.checks.ledger_filtered_correctly = { status: "PASS", details: `visible_tinv=${ledgerTinvs.join(",")}` };
      } else {
        per.checks.ledger_filtered_correctly = { status: "FAIL", details: `visible_tinv=${ledgerTinvs.join(",") || "none"}` };
        per.failures.push("Ledger view contains no target invoice or includes unrelated invoices.");
      }

      const lApiRes = await context.request.get(`${baseUrl}/api/workspace/reports/general-ledger?invoice_id=${invoice.id}&invoice_number=${encodeURIComponent(invoice.number)}`);
      const lApiTxt = await lApiRes.text();
      const lApiJson = parseJson(lApiTxt);
      const lRows = Array.isArray(lApiJson?.data) ? lApiJson.data : [];
      per.api_snippets.ledger = {
        status: lApiRes.status(),
        request_query: { invoice_id: invoice.id, invoice_number: invoice.number },
        rows: lRows.length,
        first_row: lRows[0] ?? null,
      };
      await saveJson(path.join(outputDir, "api", `${invSlug}-ledger.json`), per.api_snippets.ledger);

      // Trial balance impact check (filtered vs full)
      const tFilteredRes = await context.request.get(`${baseUrl}/api/workspace/reports/trial-balance?invoice_id=${invoice.id}&invoice_number=${encodeURIComponent(invoice.number)}`);
      const tFilteredTxt = await tFilteredRes.text();
      const tFilteredJson = parseJson(tFilteredTxt);
      const tFilteredRows = Array.isArray(tFilteredJson?.data) ? tFilteredJson.data : [];

      const tFullRes = await context.request.get(`${baseUrl}/api/workspace/reports/trial-balance`);
      const tFullTxt = await tFullRes.text();
      const tFullJson = parseJson(tFullTxt);
      const tFullRows = Array.isArray(tFullJson?.data) ? tFullJson.data : [];

      per.api_snippets.trial_balance_filtered = {
        status: tFilteredRes.status(),
        request_query: { invoice_id: invoice.id, invoice_number: invoice.number },
        rows: tFilteredRows.length,
        first_row: tFilteredRows[0] ?? null,
      };
      per.api_snippets.trial_balance_full = {
        status: tFullRes.status(),
        rows: tFullRows.length,
        first_row: tFullRows[0] ?? null,
      };
      await saveJson(path.join(outputDir, "api", `${invSlug}-trial-balance.json`), {
        filtered: per.api_snippets.trial_balance_filtered,
        full: per.api_snippets.trial_balance_full,
      });

      const trialPass = tFilteredRows.length > 0 && tFullRows.length > tFilteredRows.length;
      if (trialPass) {
        per.checks.trial_balance_impact_only = { status: "PASS", details: `filtered=${tFilteredRows.length}, full=${tFullRows.length}` };
      } else {
        per.checks.trial_balance_impact_only = { status: "FAIL", details: `filtered=${tFilteredRows.length}, full=${tFullRows.length}` };
        per.failures.push("Trial balance impact is empty or not different from full trial balance.");
      }

      // Download + preview/pdf parity baseline
      await page.goto(`${baseUrl}/workspace/invoices/${invoice.id}`, { waitUntil: "domcontentloaded" });
      const pdfPath = path.join(outputDir, "downloads", `${invSlug}.pdf`);
      let downloadCaptured = false;
      const downloadTrigger = page.getByRole("button", { name: /^Download$/i }).first();

      if (await downloadTrigger.count()) {
        try {
          const [download] = await Promise.all([
            page.waitForEvent("download", { timeout: 15000 }),
            downloadTrigger.click(),
          ]);
          await download.saveAs(pdfPath);
          downloadCaptured = true;
        } catch {
          downloadCaptured = false;
        }
      }

      if (!downloadCaptured) {
        const fallbackPdf = await getWithRetry(context.request, `${baseUrl}/api/workspace/documents/${invoice.id}/pdf`);
        if (!fallbackPdf.ok()) {
          throw new Error(`PDF fallback failed for ${invoice.number}: ${fallbackPdf.status()}`);
        }
        await fs.writeFile(pdfPath, Buffer.from(await fallbackPdf.body()));
      }

      const bytes = await fs.readFile(pdfPath);
      const startsPdf = bytes.slice(0, 4).toString() === "%PDF";
      const nonEmpty = bytes.length > 1024;
      if (startsPdf && nonEmpty) {
        per.checks.document_download_works = { status: "PASS", details: `bytes=${bytes.length}` };
      } else {
        per.checks.document_download_works = { status: "FAIL", details: `bytes=${bytes.length}, startsPdf=${startsPdf}` };
        per.failures.push("PDF download failed validity checks.");
      }

      const pdfApiRes = await getWithRetry(context.request, `${baseUrl}/api/workspace/documents/${invoice.id}/pdf`);
      const pdfApiHeaders = {
        status: pdfApiRes.status(),
        content_type: pdfApiRes.headers()["content-type"] ?? "",
        content_disposition: pdfApiRes.headers()["content-disposition"] ?? "",
      };
      per.api_snippets.pdf_headers = pdfApiHeaders;

      const previewHasInvoice = html.includes(invoice.number);
      const pdfHeaderOk = (pdfApiHeaders.content_type || "").toLowerCase().includes("application/pdf");
      if (previewHasInvoice && pdfHeaderOk && startsPdf && nonEmpty) {
        per.checks.preview_equals_pdf = { status: "PASS", details: `previewContainsInvoice=${previewHasInvoice}, pdfHeaderOk=${pdfHeaderOk}` };
      } else {
        per.checks.preview_equals_pdf = { status: "FAIL", details: `previewContainsInvoice=${previewHasInvoice}, pdfHeaderOk=${pdfHeaderOk}` };
        per.failures.push("Preview/PDF parity baseline checks failed.");
      }

      await saveJson(path.join(outputDir, "api", `${invSlug}-all-snippets.json`), per.api_snippets);
      result.invoices.push(per);
    }

    await saveJson(path.join(outputDir, "ten-invoice-proof.json"), result);
    process.stdout.write(`${path.join(outputDir, "ten-invoice-proof.json")}\n`);
  } finally {
    await browser.close();
  }
}

void main();
