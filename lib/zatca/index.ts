import { buildZatcaQrTlvBase64, buildZatcaQrImageDataUrl, decodeZatcaQrTlvBase64 } from "./qr-tlv";
import { computeInvoiceHashBase64 } from "./invoice-hash";
import { loadZatcaCertificateBundle, certificateFingerprint } from "./certificate-store";
import { nextZatcaInvoiceCounter, getCurrentZatcaSequenceState } from "./sequence-store";
import { buildZatcaUblXml } from "./ubl-builder";
import { signZatcaXml } from "./xml-signer";
import { buildZatcaValidationResult } from "./compliance-validator";
import { buildZatcaPdfA3FromHtml } from "./pdf-a3";
import type {
  ZatcaBuildResult,
  ZatcaDocumentInput,
  ZatcaPdfA3Result,
  ZatcaSandboxResult,
  ZatcaValidationResult,
} from "./types";
import { runExternalComplianceCommand } from "./fatoora-client";

export * from "./types";
export { canonicalizeXml } from "./xml-canonicalizer";

export async function buildZatcaPackage(
  document: ZatcaDocumentInput,
  options?: { advanceSequence?: boolean },
): Promise<ZatcaBuildResult> {
  const bundle = await loadZatcaCertificateBundle();
  const sequence = options?.advanceSequence
    ? await nextZatcaInvoiceCounter(document.previousInvoiceHash ?? null)
    : await getCurrentZatcaSequenceState();
  const preSignXml = buildZatcaUblXml({
    document: {
      ...document,
      invoiceCounterValue: sequence.icv,
      previousInvoiceHash: sequence.previousInvoiceHash,
    },
    invoiceHashBase64: "",
    icv: sequence.icv,
  });
  const invoiceHashBase64 = computeInvoiceHashBase64(preSignXml);
  const qrBase64 = buildZatcaQrTlvBase64({
    sellerName: document.seller.name,
    vatNumber: document.seller.vatNumber ?? "",
    timestamp: `${document.issueDate}T${document.issueTime ?? "00:00:00"}Z`,
    invoiceTotal: document.grandTotal.toFixed(2),
    vatTotal: document.vatTotal.toFixed(2),
    invoiceHash: invoiceHashBase64,
    publicKey: bundle.csid ?? bundle.pcsid ?? null,
    certificateSignature: bundle.available ? certificateFingerprint(bundle.certificatePem) : null,
  });
  const qrDecoded = decodeZatcaQrTlvBase64(qrBase64);
  const signedCandidate = signZatcaXml(
    buildZatcaUblXml({
      document: {
        ...document,
        invoiceCounterValue: sequence.icv,
        previousInvoiceHash: sequence.previousInvoiceHash,
      },
      invoiceHashBase64,
      icv: sequence.icv,
    }),
    bundle,
  );
  const xml = signedCandidate.available ? signedCandidate.xml : preSignXml;
  const signature = signedCandidate;
  const validation = buildZatcaValidationResult({
    status: bundle.available ? "ready" : "simulation",
    document: {
      ...document,
      invoiceCounterValue: sequence.icv,
      previousInvoiceHash: sequence.previousInvoiceHash,
    },
    xml,
    canonicalXml: xml,
    invoiceHashBase64,
    qrBase64,
    qrDecoded,
    signature,
    validation: {} as ZatcaValidationResult,
    sequence,
    blockers: bundle.blockers,
    warnings: [],
  });

  return {
    status: bundle.available ? "ready" : "simulation",
    document: {
      ...document,
      invoiceCounterValue: sequence.icv,
      previousInvoiceHash: sequence.previousInvoiceHash,
    },
    xml,
    canonicalXml: xml,
    invoiceHashBase64,
    qrBase64,
    qrDecoded,
    signature,
    validation,
    sequence,
    blockers: bundle.blockers,
    warnings: validation.warnings,
  };
}

export async function buildZatcaPdfA3Candidate(params: {
  html: string;
  xml: string;
  documentNumber: string;
  issueDate?: string | null;
  status: ZatcaPdfA3Result["status"];
  blockers?: string[];
  warnings?: string[];
}) {
  return buildZatcaPdfA3FromHtml({
    html: params.html,
    xml: params.xml,
    xmlFileName: `${params.documentNumber}-zatca.xml`,
    fileName: `${params.documentNumber}-zatca-pdfa3.pdf`,
    status: params.status,
    blockers: params.blockers,
    warnings: params.warnings,
    issueDate: params.issueDate,
  });
}

export async function runZatcaSdkValidation(xmlPath: string, commandTemplate?: string | null): Promise<ZatcaSandboxResult> {
  if (!commandTemplate?.trim()) {
    return { status: "blocked", blockers: ["ZATCA_SDK_COMMAND-missing"] };
  }
  return await runExternalComplianceCommand(commandTemplate, xmlPath);
}

export async function runPdfA3Validation(pdfPath: string, commandTemplate?: string | null): Promise<ZatcaSandboxResult> {
  if (!commandTemplate?.trim()) {
    return { status: "blocked", blockers: ["VeraPdfCommand-missing"] };
  }
  return await runExternalComplianceCommand(commandTemplate, pdfPath);
}

export async function runXmlSignatureValidation(xmlPath: string, commandTemplate?: string | null): Promise<ZatcaSandboxResult> {
  if (!commandTemplate?.trim()) {
    return { status: "blocked", blockers: ["XmlSecCommand-missing"] };
  }
  return await runExternalComplianceCommand(commandTemplate, xmlPath);
}

export {
  buildZatcaQrTlvBase64 as buildZatcaQrBase64,
  buildZatcaQrImageDataUrl,
  decodeZatcaQrTlvBase64,
  getCurrentZatcaSequenceState,
  loadZatcaCertificateBundle,
  nextZatcaInvoiceCounter,
};
