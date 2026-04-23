import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const workspaceRoot = process.cwd();
const sourceDir = process.env.SOURCE_DIR ?? path.join(workspaceRoot, "artifacts", "phase1_freeze_baseline_20260419_02_recovery", "proof", "document_validation");
const outputDir = process.env.OUTPUT_DIR ?? path.join(workspaceRoot, "artifacts", `document_engine_final_resume_${timestampLabel()}`);

function timestampLabel() {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ];
  const time = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  return `${parts.join("")}_${time}`;
}

function relative(filePath) {
  return path.relative(workspaceRoot, filePath).replaceAll("\\", "/");
}

function safeRead(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

async function readCapturedHtml(routeResult) {
  if (!routeResult.html) {
    return routeResult.htmlExcerpt ?? "";
  }

  try {
    return await fs.readFile(path.join(workspaceRoot, routeResult.html), "utf8");
  } catch {
    return routeResult.htmlExcerpt ?? "";
  }
}

function buildControlPoints(routeResult, html) {
  const previewIssues = routeResult.previewIssues ?? [];
  const pdfIssues = routeResult.pdfIssues ?? [];
  const parity = routeResult.parity;
  const affected = [{ documentId: routeResult.documentId, type: routeResult.type }];
  const sellerVatPresent = safeRead(routeResult.zatca?.sellerVatPresent, false);
  const logoPresent = html.includes('data-company-logo-present="true"');
  const noSystemLogo = !/gulf hisab/i.test(html);
  const lineItemsTable = html.includes('data-line-items-table="true"');
  const vatMathOk = /^taxable .*\(delta 0\.00\)$/.test(routeResult.aiValidation?.imbalanceBlocked?.evidence ?? "") || (routeResult.aiValidation?.imbalanceBlocked?.status === "PASS");
  const totalsMathOk = routeResult.aiValidation?.imbalanceBlocked?.status === "PASS";
  const arabicOk = /فاتورة|إشعار|عرض سعر|تسليم/.test(html) && !/[ØÙ╪┘]/.test(html);
  const zatcaFieldsOk = routeResult.zatca?.status === "PASS";
  const pdfReadable = (routeResult.pdfEvidence?.pageCount ?? 0) >= 1 && pdfIssues.length === 0;
  const titlePair = {
    tax_invoice: ["Tax Invoice", "فاتورة ضريبية"],
    quotation: ["Quotation", "عرض سعر"],
    proforma_invoice: ["Proforma Invoice", "فاتورة مبدئية"],
    credit_note: ["Credit Note", "إشعار دائن"],
    debit_note: ["Debit Note", "إشعار مدين"],
    delivery_note: ["Delivery Note", "إشعار تسليم"],
  }[routeResult.type] ?? [];
  const labelsOk = titlePair.every((label) => html.includes(label));

  return [
    {
      name: "Preview equals PDF",
      status: parity?.status ?? "FAIL",
      evidence: parity ? `similarity=${parity.similarity}, averageDiff=${parity.averageDiff}` : `missing parity evidence; pdfIssues=${pdfIssues.join("; ") || "none"}`,
      affected,
    },
    {
      name: "Company logo comes from company profile / uploaded asset",
      status: logoPresent ? "PASS" : "FAIL",
      evidence: logoPresent ? "shared engine rendered company-logo marker" : "shared engine rendered placeholder logo",
      affected,
    },
    {
      name: "No Gulf Hisab system logo present",
      status: noSystemLogo ? "PASS" : "FAIL",
      evidence: noSystemLogo ? "no system-brand text found in html excerpt" : "system logo text detected",
      affected,
    },
    {
      name: "Line items rendered as table",
      status: lineItemsTable ? "PASS" : "FAIL",
      evidence: lineItemsTable ? "data-line-items-table marker present" : `previewIssues=${previewIssues.join("; ") || "none"}`,
      affected,
    },
    {
      name: "VAT math correct",
      status: vatMathOk ? "PASS" : "FAIL",
      evidence: routeResult.aiValidation?.imbalanceBlocked?.evidence ?? "missing vat math evidence",
      affected,
    },
    {
      name: "Totals math correct",
      status: totalsMathOk ? "PASS" : "FAIL",
      evidence: routeResult.aiValidation?.imbalanceBlocked?.evidence ?? "missing totals evidence",
      affected,
    },
    {
      name: "Arabic/RTL labels render correctly",
      status: arabicOk ? "PASS" : "FAIL",
      evidence: arabicOk ? "Arabic labels present without mojibake markers" : "Arabic label text is missing or mojibake-like",
      affected,
    },
    {
      name: "Required ZATCA fields present",
      status: zatcaFieldsOk ? "PASS" : "FAIL",
      evidence: JSON.stringify(routeResult.zatca),
      affected,
    },
    {
      name: "PDF export valid and readable",
      status: pdfReadable ? "PASS" : "FAIL",
      evidence: pdfReadable ? `pages=${routeResult.pdfEvidence.pageCount}` : `pdfIssues=${pdfIssues.join("; ") || "none"}`,
      affected,
    },
    {
      name: "Template type-specific labels correct",
      status: labelsOk ? "PASS" : "FAIL",
      evidence: labelsOk ? `title pair found for ${routeResult.type}` : `expected labels missing for ${routeResult.type}`,
      affected,
    },
  ];
}

function buildAuditItems(routeResults) {
  return routeResults.flatMap((result) => {
    const items = [];
    if (!safeRead(result.zatca?.sellerVatPresent, false)) {
      items.push({ type: "missing seller VAT", status: "FAIL", evidence: JSON.stringify(result.zatca), documentId: result.documentId, documentType: result.type });
    }
    if ((result.htmlExcerpt ?? "").includes('data-company-logo-present="false"')) {
      items.push({ type: "missing logo", status: "FAIL", evidence: "shared engine rendered placeholder logo", documentId: result.documentId, documentType: result.type });
    }
    if (!result.htmlExcerpt) {
      items.push({ type: "empty preview html", status: "FAIL", evidence: "htmlExcerpt empty", documentId: result.documentId, documentType: result.type });
    }
    if ((result.parity?.status ?? "FAIL") !== "PASS") {
      items.push({ type: "preview/PDF mismatch", status: "FAIL", evidence: JSON.stringify(result.parity), documentId: result.documentId, documentType: result.type });
    }
    if ((result.pdfIssues ?? []).length > 0) {
      items.push({ type: "invalid PDF", status: "FAIL", evidence: result.pdfIssues.join("; "), documentId: result.documentId, documentType: result.type });
    }
    if ((result.previewIssues ?? []).some((issue) => issue.toLowerCase().includes("expected bilingual title missing") || issue.toLowerCase().includes("document kind marker mismatch"))) {
      items.push({ type: "wrong template label/type mapping", status: "FAIL", evidence: result.previewIssues.join("; "), documentId: result.documentId, documentType: result.type });
    }
    return items;
  });
}

async function copyIfExists(fromPath, toPath) {
  try {
    await fs.copyFile(fromPath, toPath);
    return true;
  } catch {
    return false;
  }
}

async function renderDashboard(title, records, targetPath) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  try {
    const rows = records.map((record) => {
      const columns = Object.entries(record).map(([key, value]) => `<td>${String(value)}</td>`).join("");
      return `<tr>${columns}</tr>`;
    }).join("");
    const headers = records[0] ? Object.keys(records[0]).map((key) => `<th>${key}</th>`).join("") : "<th>empty</th>";
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#f3f0e8;font-family:Georgia,serif;color:#1f2a22;padding:24px}h1{margin:0 0 16px;font-size:28px}table{width:100%;border-collapse:collapse;background:#fff;box-shadow:0 12px 30px rgba(0,0,0,.08)}th,td{border:1px solid #d7d0c2;padding:10px 12px;font-size:13px;vertical-align:top}th{background:#e7ddca;text-align:left}tr:nth-child(even){background:#faf7f1}</style></head><body><h1>${title}</h1><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`, { waitUntil: "load" });
    await page.screenshot({ path: targetPath, fullPage: true });
  } finally {
    await browser.close();
  }
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const sourceReportPath = path.join(sourceDir, "document-validation-report.json");
  const report = JSON.parse(await fs.readFile(sourceReportPath, "utf8"));
  const routeResults = report.routeResults ?? [];
  const routeHtmlEntries = await Promise.all(routeResults.map(async (result) => ({ result, html: await readCapturedHtml(result) })));

  const parityReport = {
    generatedAt: new Date().toISOString(),
    results: routeHtmlEntries.map(({ result }) => ({
      documentId: result.documentId,
      documentType: result.type,
      status: result.parity?.status ?? "FAIL",
      similarity: result.parity?.similarity ?? null,
      averageDiff: result.parity?.averageDiff ?? null,
      previewProof: result.previewProof,
      pdfProof: result.pdfEvidence?.screenshot ?? null,
    })),
  };

  const controlPointReport = {
    generatedAt: new Date().toISOString(),
    results: routeHtmlEntries.flatMap(({ result, html }) => buildControlPoints(result, html)),
  };

  const auditItems = buildAuditItems(routeHtmlEntries.map(({ result, html }) => ({ ...result, htmlExcerpt: html })));
  const auditReport = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: auditItems.length,
      fail: auditItems.filter((item) => item.status === "FAIL").length,
      pass: auditItems.filter((item) => item.status === "PASS").length,
    },
    results: auditItems,
  };

  const aiValidationReport = {
    generatedAt: new Date().toISOString(),
    results: routeHtmlEntries.map(({ result }) => ({
      documentId: result.documentId,
      documentType: result.type,
      missingRequiredFields: result.aiValidation?.missingRequiredFieldWarning ?? null,
      invalidVat: result.aiValidation?.invalidVatBlocked ?? null,
      suspiciousTotals: result.aiValidation?.suspiciousValueFlagged ?? null,
      parityIssueReported: (result.parity?.status ?? "FAIL") !== "PASS",
    })),
  };

  const templateCoverage = routeHtmlEntries.map(({ result, html }) => ({
    documentId: result.documentId,
    documentType: result.type,
    sharedEngine: html.includes('data-document-engine="invoice-template"'),
    previewHtmlGenerated: Boolean(html),
    pdfGenerated: Boolean(result.pdfEvidence?.pdf),
    typeLabelsCorrect: controlPointReport.results.find((entry) => entry.name === "Template type-specific labels correct" && entry.affected[0]?.documentId === result.documentId)?.status === "PASS",
    vatVisibilityCorrect: ["tax_invoice", "credit_note", "debit_note"].includes(result.type)
      ? html.includes('data-zatca-qr-required="true"')
      : !html.includes('data-zatca-qr-required="true"') || html.includes('data-zatca-qr-required="false"'),
    logoFromCompanyProfile: html.includes('data-company-logo-present="true"'),
    legacyPathDetected: !html.includes('data-document-engine="invoice-template"'),
  }));

  const outputFiles = {
    validation: path.join(outputDir, "document-validation-report.json"),
    parity: path.join(outputDir, "document-parity-report.json"),
    controlPoints: path.join(outputDir, "control-point-report.json"),
    audit: path.join(outputDir, "audit-report.json"),
    ai: path.join(outputDir, "ai-validation-report.json"),
    coverage: path.join(outputDir, "template-coverage-report.json"),
  };

  await fs.writeFile(outputFiles.validation, JSON.stringify(report, null, 2));
  await fs.writeFile(outputFiles.parity, JSON.stringify(parityReport, null, 2));
  await fs.writeFile(outputFiles.controlPoints, JSON.stringify(controlPointReport, null, 2));
  await fs.writeFile(outputFiles.audit, JSON.stringify(auditReport, null, 2));
  await fs.writeFile(outputFiles.ai, JSON.stringify(aiValidationReport, null, 2));
  await fs.writeFile(outputFiles.coverage, JSON.stringify({ generatedAt: new Date().toISOString(), results: templateCoverage }, null, 2));

  const mappings = [
    ["invoice-preview-page.png", "invoice-preview.png"],
    ["invoice-pdf-proof.png", "invoice-pdf-proof.png"],
    ["quotation-preview-page.png", "quotation-preview.png"],
    ["proforma-preview-page.png", "proforma-preview.png"],
    ["credit-note-preview-page.png", "credit-note-preview.png"],
    ["debit-note-preview-page.png", "debit-note-preview.png"],
    ["delivery-note-preview-page.png", "delivery-note-preview.png"],
  ];

  for (const [fromName, toName] of mappings) {
    await copyIfExists(path.join(sourceDir, fromName), path.join(outputDir, toName));
  }

  for (const result of routeResults) {
    if (result.pdfEvidence?.pdf) {
      await copyIfExists(path.join(workspaceRoot, result.pdfEvidence.pdf), path.join(outputDir, path.basename(result.pdfEvidence.pdf)));
    }
    if (result.html) {
      await copyIfExists(path.join(workspaceRoot, result.html), path.join(outputDir, path.basename(result.html)));
    }
  }

  await copyIfExists(path.join(workspaceRoot, "artifacts", "document_resume_check", "preview-162-response.json"), path.join(outputDir, "preview-162-response.json"));
  await copyIfExists(path.join(workspaceRoot, "artifacts", "document_resume_check", "preview-162.html"), path.join(outputDir, "preview-162.html"));
  await copyIfExists(path.join(workspaceRoot, "artifacts", "document_resume_check", "pdf-162-response.txt"), path.join(outputDir, "pdf-162-response.txt"));
  await copyIfExists(path.join(workspaceRoot, "artifacts", "document_resume_check", "document-162.pdf"), path.join(outputDir, "document-162.pdf"));
  await copyIfExists(path.join(workspaceRoot, "artifacts", "document_resume_check", "execution-log.txt"), path.join(outputDir, "execution-log.txt"));
  await copyIfExists(path.join(workspaceRoot, "artifacts", "phase1_freeze_baseline_20260419_02_recovery", "logs", "document-validation.log"), path.join(outputDir, "document-validation.log"));

  const controlDashboard = path.join(outputDir, "control-point-dashboard.png");
  const auditDashboard = path.join(outputDir, "audit-results-dashboard.png");
  await renderDashboard("Document Control Points", controlPointReport.results.map((entry) => ({ status: entry.status, name: entry.name, document: `${entry.affected[0]?.documentId}:${entry.affected[0]?.type}`, evidence: entry.evidence })), controlDashboard);
  await renderDashboard("Document Audit Results", auditReport.results.map((entry) => ({ status: entry.status, type: entry.type, document: `${entry.documentId}:${entry.documentType}`, evidence: entry.evidence })), auditDashboard);

  const manifest = {
    generatedAt: new Date().toISOString(),
    outputDir: relative(outputDir),
    files: Object.values(outputFiles).map(relative).concat([
      relative(controlDashboard),
      relative(auditDashboard),
      ...mappings.map(([, toName]) => relative(path.join(outputDir, toName))),
    ]),
  };
  await fs.writeFile(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  process.stdout.write(`${JSON.stringify({ outputDir, manifest }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});