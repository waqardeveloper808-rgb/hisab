import { AFRelationship, PDFDocument } from "pdf-lib";
import { generatePdfFromHtml } from "@/lib/pdf/simple-pdf";
import type { ZatcaPdfA3Result } from "./types";

export async function buildZatcaPdfA3FromHtml(params: {
  html: string;
  xml: string;
  xmlFileName: string;
  fileName: string;
  status: ZatcaPdfA3Result["status"];
  blockers?: string[];
  warnings?: string[];
  issueDate?: string | null;
}) {
  const basePdf = await generatePdfFromHtml(params.html);
  const pdf = await PDFDocument.load(basePdf);
  await pdf.attach(new TextEncoder().encode(params.xml), params.xmlFileName, {
    mimeType: "application/xml",
    description: "UBL 2.1 ZATCA XML",
    afRelationship: AFRelationship.Data,
    creationDate: params.issueDate ? new Date(params.issueDate) : new Date(),
    modificationDate: new Date(),
  });
  pdf.setProducer("Hisabix ZATCA compliance layer");
  pdf.setCreator("Hisabix");
  pdf.setTitle(params.fileName.replace(/\.pdf$/i, ""));
  pdf.setSubject("ZATCA compliance export with embedded XML");
  pdf.setKeywords(["ZATCA", "UBL", "PDF-A-3", "embedded-xml"]);
  pdf.setLanguage("en");
  const bytes = await pdf.save({ useObjectStreams: false });

  return {
    bytes,
    fileName: params.fileName,
    xmlFileName: params.xmlFileName,
    status: params.status,
    blockers: params.blockers ?? [],
    warnings: params.warnings ?? [],
  } satisfies ZatcaPdfA3Result;
}

