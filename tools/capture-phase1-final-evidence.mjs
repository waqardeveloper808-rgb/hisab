import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PHASE1_EVIDENCE_BASE_URL ?? "http://127.0.0.1:3006";
const outDir = path.join(process.cwd(), "qa_reports", "phase1_final_control_20260418");

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function saveBuffer(filePath, buffer) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, buffer);
}

async function fetchJson(page, relativePath, init) {
  const response = await page.request.fetch(`${baseUrl}${relativePath}`, init);
  if (!response.ok()) {
    throw new Error(`Request failed for ${relativePath}: ${response.status()} ${response.statusText()}`);
  }
  return response.json();
}

async function fetchBuffer(page, relativePath) {
  const response = await page.request.fetch(`${baseUrl}${relativePath}`);
  if (!response.ok()) {
    throw new Error(`Request failed for ${relativePath}: ${response.status()} ${response.statusText()}`);
  }
  return response.body();
}

async function createSalesPreviewDocument(page, payload) {
  const response = await fetchJson(page, "/api/workspace/sales-documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: payload,
  });
  return response.data;
}

async function finalizePreviewDocument(page, documentId) {
  const response = await fetchJson(page, `/api/workspace/sales-documents/${documentId}/finalize`, {
    method: "POST",
  });
  return response.data;
}

async function captureScreenshot(page, relativePath, fileName, options = {}) {
  await page.goto(`${baseUrl}${relativePath}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, fileName), fullPage: true, ...options });
}

async function main() {
  await ensureDir(outDir);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

  await captureScreenshot(page, "/workspace/user/reports/profit-loss", "01-profit-loss-report.png");
  await captureScreenshot(page, "/workspace/user/reports/vat-summary", "02-vat-summary-report.png");

  let reconciliationEvidence = {
    importPanelAvailable: false,
    blocker: "Preview mode does not expose live bank-account context, so reconciliation import stays disabled without workspace backend credentials.",
  };
  await page.goto(`${baseUrl}/workspace/user/reconciliation?import=1`, { waitUntil: "networkidle" });
  await page.locator("h1").first().waitFor();
  const importButton = page.getByRole("button", { name: "Import Statement", exact: true });
  const importButtonDisabled = await importButton.isDisabled().catch(() => true);
  if (!importButtonDisabled && await page.locator("textarea").count() === 0) {
    await importButton.click();
  }
  if (await page.locator("textarea").count() > 0) {
    reconciliationEvidence = { importPanelAvailable: true, blocker: null };
    await page.locator("textarea").first().fill([
      "date,customer,reference,amount,vat,balance",
      "2026-04-18,Al Noor Trading,REC-1001,1250,187.5,1250",
      "2026-04-19,Al Waha Stores,REC-1002,-420,63,830",
      ",Broken Row,REC-1003,0,0,830",
    ].join("\n"));
    await page.getByRole("button", { name: "Preview Import", exact: true }).click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(outDir, "03-reconciliation-import-preview.png"), fullPage: true });

  const importLogs = await page.evaluate(() => {
    const stored = window.localStorage.getItem("reconciliation-import-logs");
    return stored ? JSON.parse(stored) : [];
  });

  await captureScreenshot(page, "/workspace/user/journal-entries", "04-journal-linking-register.png");

  const previewDocumentMap = {
    proforma: 2150,
    delivery: 2151,
    invoice: 2149,
  };

  const creditNote = await createSalesPreviewDocument(page, {
    type: "credit_note",
    title: "Phase 1 Preview Credit Note",
    contact_id: 101,
    issue_date: "2026-04-18",
    due_date: "2026-04-18",
    notes: "Automated Phase 1 evidence credit note.",
    custom_fields: {
      source_invoice_number: "AHN-INV-QMS-5021",
      adjustment_reason: "Returned sample stock",
      supply_date: "2026-04-18",
      buyer_name_en: "Al Noor Trading",
      buyer_vat_number: "300998877660003",
    },
    lines: [
      {
        item_id: 302,
        description: "Returned thermal invoice paper",
        quantity: 1,
        unit_price: 85,
        custom_fields: { vat_rate: 15, item_code: "PRD-PAPER-02" },
      },
    ],
  });
  const debitNote = await createSalesPreviewDocument(page, {
    type: "debit_note",
    title: "Phase 1 Preview Debit Note",
    contact_id: 101,
    issue_date: "2026-04-18",
    due_date: "2026-04-18",
    notes: "Automated Phase 1 evidence debit note.",
    custom_fields: {
      source_invoice_number: "AHN-INV-QMS-5021",
      adjustment_reason: "Post-delivery surcharge",
      supply_date: "2026-04-18",
      buyer_name_en: "Al Noor Trading",
      buyer_vat_number: "300998877660003",
    },
    lines: [
      {
        item_id: 301,
        description: "Additional bookkeeping support",
        quantity: 1,
        unit_price: 120,
        custom_fields: { vat_rate: 15, item_code: "SRV-BOOK-01" },
      },
    ],
  });

  await finalizePreviewDocument(page, creditNote.id);
  await finalizePreviewDocument(page, debitNote.id);

  const pdfTargets = {
    "invoice-output.pdf": previewDocumentMap.invoice,
    "proforma-output.pdf": previewDocumentMap.proforma,
    "delivery-note-output.pdf": previewDocumentMap.delivery,
    "credit-note-output.pdf": creditNote.id,
    "debit-note-output.pdf": debitNote.id,
  };

  for (const [fileName, documentId] of Object.entries(pdfTargets)) {
    const pdfBuffer = await fetchBuffer(page, `/api/workspace/documents/${documentId}/export-pdf`);
    await saveBuffer(path.join(outDir, fileName), pdfBuffer);
  }

  const reportSnapshot = {
    profitLoss: await fetchJson(page, "/api/workspace/reports/profit-loss"),
    vatSummary: await fetchJson(page, "/api/workspace/reports/vat-summary"),
    vatDetail: await fetchJson(page, "/api/workspace/reports/vat-detail"),
    vatReceived: await fetchJson(page, "/api/workspace/reports/vat-received-details"),
    vatPaid: await fetchJson(page, "/api/workspace/reports/vat-paid-details"),
    trialBalance: await fetchJson(page, "/api/workspace/reports/trial-balance"),
  };

  const evidence = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    screenshots: [
      "01-profit-loss-report.png",
      "02-vat-summary-report.png",
      "03-reconciliation-import-preview.png",
      "04-journal-linking-register.png",
    ],
    pdfs: Object.keys(pdfTargets),
    previewDocuments: {
      ...previewDocumentMap,
      creditNote: creditNote.id,
      debitNote: debitNote.id,
    },
    importLogs,
    reconciliationEvidence,
    reportSnapshot,
    realWorkflowProof: "../phase1_closure_20260418/phase1-workflow-proof.json",
  };

  await fs.writeFile(path.join(outDir, "phase1-final-evidence.json"), JSON.stringify(evidence, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});