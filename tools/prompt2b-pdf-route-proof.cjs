/**
 * Prompt 2B — PDF route HTTP proof (production server assumed running).
 *
 * ENV:
 *   PROMPT2B_BASE   default http://127.0.0.1:3000
 *   PROMPT2B_OUT    artifact root
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const base = process.env.PROMPT2B_BASE ?? "http://127.0.0.1:3000";
const outRoot =
  process.env.PROMPT2B_OUT ||
  path.join(__dirname, "..", "storage", "app", "agent-output", "prompt2b-unknown");

const repoRoot = path.join(__dirname, "..");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const exportsDir = path.join(outRoot, "exports");
const screenshotsDir = path.join(outRoot, "screenshots");
ensureDir(exportsDir);
ensureDir(screenshotsDir);
ensureDir(path.join(outRoot, "reports"));
ensureDir(path.join(outRoot, "logs"));

function writeTemplateStudioPayloadJson(destPath) {
  const snippet = `
import * as fs from "node:fs";
import { buildInvoicePdf } from "./lib/workspace/exports/pdf";
import { DOCUMENT_TEMPLATE_SCHEMAS } from "./lib/workspace/document-template-schemas";
import { invoices } from "./data/workspace/invoices";
import { previewCompany } from "./data/preview-company";
import { customers } from "./data/workspace/customers";

void (async () => {
  const doc = invoices[0];
  if (!doc) throw new Error("no invoices fixture");
  const schema = DOCUMENT_TEMPLATE_SCHEMAS.tax_invoice;
  const c = customers.find((x) => x.id === doc.customerId);
  const body = {
    doc,
    schema,
    language: "bilingual",
    seller: {
      name: previewCompany.sellerName,
      nameAr: previewCompany.sellerNameAr,
      vatNumber: previewCompany.vatNumber,
      registrationNumber: previewCompany.registrationNumber,
      addressEn: previewCompany.sellerAddressEn,
      addressAr: previewCompany.sellerAddressAr,
      email: previewCompany.sellerEmail,
      phone: previewCompany.sellerPhone,
    },
    customer: {
      name: c?.legalName ?? "—",
      nameAr: c?.legalNameAr,
      vatNumber: c?.vatNumber,
      city: c?.city,
      addressEn: c?.addressEn ?? c?.city ?? "",
      addressAr: c?.addressAr,
      email: c?.email,
      phone: c?.phone,
    },
    attachFoundationUblXml: false,
  };
  fs.writeFileSync(${JSON.stringify(destPath)}, JSON.stringify(body));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
`;
  const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsx", "-e", snippet], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    /** Windows: resolve npx.cmd through shell when OneDrive / path quoting breaks direct spawn. */
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    throw new Error(
      [
        "tsx failed",
        "status=" + r.status,
        (r.stderr || "").slice(0, 2000),
        (r.stdout || "").slice(0, 2000),
      ].join("\n"),
    );
  }
}

function isPdfMagic(buf) {
  return buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
}

async function probe(name, { url, init, savePdf }) {
  let res;
  try {
    res = await fetch(url, init ?? {});
  } catch (e) {
    return {
      name,
      url,
      error: String(e && e.message ? e.message : e),
      status: null,
      contentType: null,
      bytes: 0,
      looksPdfMagic: false,
    };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "";
  let savedPdf = false;
  if (savePdf) {
    if (isPdfMagic(buf)) {
      fs.writeFileSync(path.join(exportsDir, savePdf), buf);
      savedPdf = true;
    } else if (buf.length > 0) {
      fs.writeFileSync(
        path.join(exportsDir, `${savePdf}.txt`),
        buf.toString("utf8").slice(0, 8000),
        "utf8",
      );
    }
  }
  return {
    name,
    url,
    status: res.status,
    ok: res.ok,
    contentType,
    bytes: buf.byteLength,
    firstBytesSigHex:
      buf.length >= 8 ? buf.subarray(0, 8).toString("hex") : buf.toString("hex"),
    looksPdfMagic: isPdfMagic(buf),
    savedPdfAsPdfBinary: savedPdf,
    snippetIfNotPdf: !isPdfMagic(buf) && buf.length > 0 && buf.length <= 8192 ? buf.toString("utf8") : undefined,
    snippetUtf8TruncatedLarge:
      !isPdfMagic(buf) && buf.length > 8192 ? buf.subarray(0, 800).toString("utf8") : undefined,
  };
}

(async () => {
  const results = [];

  /** Build POST body for template-studio */
  try {
    const bodyPath = path.join(exportsDir, "template-studio-buildpdf-body.json");
    writeTemplateStudioPayloadJson(bodyPath);
    results.push({
      step: "writeTemplateStudioPayloadJson",
      ok: fs.existsSync(bodyPath),
      path: bodyPath,
      stat: fs.statSync(bodyPath).size,
    });
  } catch (e) {
    results.push({ step: "writeTemplateStudioPayloadJson", ok: false, error: String(e.message || e) });
  }

  const bodyJsonPath = path.join(exportsDir, "template-studio-buildpdf-body.json");

  if (fs.existsSync(bodyJsonPath)) {
    const raw = fs.readFileSync(bodyJsonPath);
    results.push(
      await probe("POST /api/workspace/template-studio/pdf", {
        url: `${base}/api/workspace/template-studio/pdf`,
        init: {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/pdf,*/*" },
          body: raw,
        },
        savePdf: "http-template-studio-tax-invoice.pdf",
      }),
    );
  }

  const exportPayload = {
    name: "Prompt2bExport",
    document_type: "tax_invoice",
    document_types: ["tax_invoice"],
    locale_mode: "bilingual",
    accent_color: "#1f7a53",
    settings: { show_qr: true },
  };

  results.push(
    await probe("POST preview /api/workspace/templates/export-pdf (X-Workspace-Mode)", {
      url: `${base}/api/workspace/templates/export-pdf`,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/pdf,*/*",
          "X-Workspace-Mode": "preview",
        },
        body: JSON.stringify(exportPayload),
      },
      savePdf: "http-preview-templates-export-pdf.pdf",
    }),
  );

  results.push(
    await probe("GET preview /api/workspace/documents/1/export-pdf", {
      url: `${base}/api/workspace/documents/1/export-pdf`,
      savePdf: "http-preview-document-1-export-pdf.pdf",
    }),
  );

  results.push(
    await probe("GET preview /api/workspace/documents/1/pdf", {
      url: `${base}/api/workspace/documents/1/pdf`,
      savePdf: "http-preview-document-1.pdf",
    }),
  );

  results.push(
    await probe("GET /api/workspace/documents/2/pdf without session (auth probe)", {
      url: `${base}/api/workspace/documents/2/pdf`,
      savePdf: "http-authenticated-shape.pdf",
    }),
  );

  fs.writeFileSync(
    path.join(outRoot, "reports", "pdf-route-proof.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        base,
        outRoot,
        note: "Evaluate status, content-type, looksPdfMagic, savedPdfAsPdfBinary manually.",
        results,
      },
      null,
      2,
    ),
    "utf8",
  );

  try {
    const { chromium } = require("playwright");
    const browser = await chromium.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.goto(`${base}/`, { waitUntil: "load", timeout: 45000 }).catch(() => {});
    await page.screenshot({ path: path.join(screenshotsDir, "home-root.png") });
    await page
      .goto(`${base}/api/workspace/templates`, { waitUntil: "load", timeout: 45000 })
      .catch(() => {});
    await page.screenshot({ path: path.join(screenshotsDir, "api-workspace-templates.png") });
    await browser.close();
  } catch (e) {
    fs.writeFileSync(
      path.join(screenshotsDir, "playwright-screenshot-blocker.txt"),
      String(e && e.stack ? e.stack : e),
      "utf8",
    );
  }

  console.log(JSON.stringify(results, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
