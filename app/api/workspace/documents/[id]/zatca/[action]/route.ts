import { NextRequest, NextResponse } from "next/server";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getDocumentPreview } from "@/lib/workspace-api";
import {
  buildZatcaPackage,
  buildZatcaPdfA3Candidate,
  runPdfA3Validation,
  runXmlSignatureValidation,
  runZatcaSdkValidation,
} from "@/lib/zatca";
import { resolveZatcaRuntimeDocument } from "../_shared";

type ZatcaRuntimeMode = "preview" | "backend";

function readMode(request: NextRequest): ZatcaRuntimeMode {
  const mode = request.nextUrl.searchParams.get("mode")?.toLowerCase() ?? request.headers.get("X-Workspace-Mode")?.toLowerCase();
  return mode === "preview" ? "preview" : "backend";
}

function readTemplateId(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("template_id");
  if (!raw) {
    return null;
  }

  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
}

async function buildContext(request: NextRequest, documentId: number) {
  const mode = readMode(request);
  const templateId = readTemplateId(request);
  const runtime = await resolveZatcaRuntimeDocument({ mode, documentId });

  if (!runtime) {
    return null;
  }

  const packageResult = await buildZatcaPackage(runtime.zatcaDocument, { advanceSequence: false });
  let previewHtml = runtime.previewHtml ?? "";

  if (request.nextUrl.searchParams.get("render") !== "xml" && request.nextUrl.searchParams.get("render") !== "qr") {
    try {
      const preview = await getDocumentPreview(documentId, { templateId, mode });
      previewHtml = preview.html;
    } catch {
      // Keep the resolver honest: the PDF path will fail explicitly if HTML cannot be resolved.
    }
  }

  return {
    mode,
    templateId,
    runtime,
    packageResult,
    previewHtml,
  };
}

async function runValidatorCommands(xmlPath: string, pdfPath: string, body: Record<string, unknown>) {
  const zatcaSdkCommand = typeof body.zatcaSdkCommand === "string" ? body.zatcaSdkCommand : process.env.ZATCA_SDK_COMMAND ?? null;
  const veraPdfCommand = typeof body.veraPdfCommand === "string" ? body.veraPdfCommand : process.env.ZATCA_VERA_PDF_COMMAND ?? null;
  const xmlSecCommand = typeof body.xmlSecCommand === "string" ? body.xmlSecCommand : process.env.ZATCA_XMLSEC_COMMAND ?? null;

  const [sdk, pdfa3, signature] = await Promise.all([
    runZatcaSdkValidation(xmlPath, zatcaSdkCommand),
    runPdfA3Validation(pdfPath, veraPdfCommand),
    runXmlSignatureValidation(xmlPath, xmlSecCommand),
  ]);

  return { sdk, pdfa3, signature };
}

async function withTempFiles(prefix: string, fn: (paths: { dir: string; xmlPath: string; pdfPath: string }) => Promise<NextResponse>) {
  const dir = await mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
  const xmlPath = path.join(dir, "invoice.xml");
  const pdfPath = path.join(dir, "invoice.pdf");

  try {
    return await fn({ dir, xmlPath, pdfPath });
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

async function handleXml(request: NextRequest, documentId: number) {
  const context = await buildContext(request, documentId);
  if (!context) {
    return NextResponse.json({ message: "ZATCA document not found." }, { status: 404 });
  }

  const fileName = `${sanitizeFileName(context.runtime.zatcaDocument.documentNumber)}-tax-invoice.xml`;
  const response = new NextResponse(context.packageResult.xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
      "X-ZATCA-Status": context.packageResult.status,
      "X-ZATCA-Mode": context.mode,
    },
  });
  return response;
}

async function handleQr(request: NextRequest, documentId: number) {
  const context = await buildContext(request, documentId);
  if (!context) {
    return NextResponse.json({ message: "ZATCA document not found." }, { status: 404 });
  }

  const fileName = `${sanitizeFileName(context.runtime.zatcaDocument.documentNumber)}-qr.txt`;
  return new NextResponse(context.packageResult.qrBase64, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
      "X-ZATCA-Mode": context.mode,
    },
  });
}

async function handlePdfA3(request: NextRequest, documentId: number) {
  const context = await buildContext(request, documentId);
  if (!context) {
    return NextResponse.json({ message: "ZATCA document not found." }, { status: 404 });
  }

  if (!context.previewHtml.trim()) {
    return NextResponse.json({ message: "Unable to resolve HTML for ZATCA PDF/A-3 export." }, { status: 422 });
  }

  const pdf = await buildZatcaPdfA3Candidate({
    html: context.previewHtml,
    xml: context.packageResult.xml,
    documentNumber: context.runtime.zatcaDocument.documentNumber,
    issueDate: context.runtime.zatcaDocument.issueDate,
    status: context.packageResult.status,
    blockers: context.packageResult.blockers,
    warnings: context.packageResult.warnings,
  });

  const fileName = `${sanitizeFileName(context.runtime.zatcaDocument.documentNumber)}-tax-invoice-pdfa3.pdf`;
  return new NextResponse(Buffer.from(pdf.bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
      "X-ZATCA-Status": context.packageResult.status,
      "X-ZATCA-Mode": context.mode,
    },
  });
}

async function handleProof(request: NextRequest, documentId: number) {
  const context = await buildContext(request, documentId);
  if (!context) {
    return NextResponse.json({ message: "ZATCA document not found." }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      documentId: context.runtime.zatcaDocument.documentId,
      documentNumber: context.runtime.zatcaDocument.documentNumber,
      documentKind: context.runtime.zatcaDocument.documentKind,
      mode: context.mode,
      templateId: context.templateId,
      status: context.packageResult.status,
      validation: context.packageResult.validation,
      qrBase64: context.packageResult.qrBase64,
      qrDecoded: context.packageResult.qrDecoded,
      invoiceHashBase64: context.packageResult.invoiceHashBase64,
      sequence: context.packageResult.sequence,
      blockers: context.packageResult.blockers,
      warnings: context.packageResult.warnings,
      xmlLength: context.packageResult.xml.length,
    },
  }, {
    headers: {
      "X-ZATCA-Mode": context.mode,
      "X-ZATCA-Status": context.packageResult.status,
    },
  });
}

async function handleValidate(request: NextRequest, documentId: number) {
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const context = await buildContext(request, documentId);
  if (!context) {
    return NextResponse.json({ message: "ZATCA document not found." }, { status: 404 });
  }

  if (!context.previewHtml.trim()) {
    return NextResponse.json({ message: "Unable to resolve HTML for ZATCA validation." }, { status: 422 });
  }

  return await withTempFiles(`zatca-${documentId}`, async ({ xmlPath, pdfPath }) => {
    await writeFile(xmlPath, context.packageResult.xml, "utf8");
    const pdf = await buildZatcaPdfA3Candidate({
      html: context.previewHtml || "<html><body></body></html>",
      xml: context.packageResult.xml,
      documentNumber: context.runtime.zatcaDocument.documentNumber,
      issueDate: context.runtime.zatcaDocument.issueDate,
      status: context.packageResult.status,
      blockers: context.packageResult.blockers,
      warnings: context.packageResult.warnings,
    });
    await writeFile(pdfPath, Buffer.from(pdf.bytes));

    const external = await runValidatorCommands(xmlPath, pdfPath, body);
    const signaturePresent = context.packageResult.validation.details?.signature;
    const response = {
      data: {
      documentId: context.runtime.zatcaDocument.documentId,
      documentNumber: context.runtime.zatcaDocument.documentNumber,
        mode: context.mode,
        templateId: context.templateId,
        localValidation: context.packageResult.validation,
        externalValidation: external,
        xmlPath,
        pdfPath,
        signaturePresent,
      },
    };
    return NextResponse.json(response, {
      headers: {
        "X-ZATCA-Mode": context.mode,
        "X-ZATCA-Status": context.packageResult.status,
      },
    });
  });
}

async function handleSandbox(request: NextRequest, documentId: number, operation: "clearance" | "reporting") {
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const context = await buildContext(request, documentId);
  if (!context) {
    return NextResponse.json({ message: "ZATCA document not found." }, { status: 404 });
  }

  const enabled = String(process.env.ZATCA_ENABLE_SANDBOX_SUBMISSION ?? "").toLowerCase() === "true";
  const blockers = [
    !enabled ? "sandbox-submission-disabled" : "",
    !process.env.ZATCA_CSID ? "ZATCA_CSID-missing" : "",
    !process.env.ZATCA_PCSID ? "ZATCA_PCSID-missing" : "",
    !process.env.ZATCA_EGS_PRIVATE_KEY_PATH ? "ZATCA_EGS_PRIVATE_KEY_PATH-missing" : "",
    !process.env.ZATCA_EGS_CERTIFICATE_PATH ? "ZATCA_EGS_CERTIFICATE_PATH-missing" : "",
  ].filter(Boolean);

  const payload = {
    operation,
    documentId: context.runtime.zatcaDocument.documentId,
    documentNumber: context.runtime.zatcaDocument.documentNumber,
    mode: context.mode,
    templateId: context.templateId,
    request: body,
  };

  if (blockers.length > 0) {
    return NextResponse.json({
      data: {
        status: "blocked",
        blockers,
        payload,
      },
    }, { status: 409 });
  }

  return NextResponse.json({
    data: {
      status: "blocked",
      blockers: ["sandbox-transport-not-implemented"],
      payload,
    },
  }, { status: 501 });
}

async function handleAction(request: NextRequest, params: { id: string; action: string }) {
  const documentId = Number(params.id);
  if (!Number.isFinite(documentId) || documentId <= 0) {
    return NextResponse.json({ message: "Invalid ZATCA document id." }, { status: 400 });
  }

  switch (params.action) {
    case "xml":
      return await handleXml(request, documentId);
    case "pdf-a3":
      return await handlePdfA3(request, documentId);
    case "qr":
      return await handleQr(request, documentId);
    case "proof":
      return await handleProof(request, documentId);
    case "validate":
      return await handleValidate(request, documentId);
    case "sandbox-clearance":
      return await handleSandbox(request, documentId, "clearance");
    case "sandbox-reporting":
      return await handleSandbox(request, documentId, "reporting");
    default:
      return NextResponse.json({ message: `Unsupported ZATCA action: ${params.action}` }, { status: 404 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string; action: string }> | { id: string; action: string } }) {
  const params = await Promise.resolve(context.params);
  return handleAction(request, params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string; action: string }> | { id: string; action: string } }) {
  const params = await Promise.resolve(context.params);
  return handleAction(request, params);
}
