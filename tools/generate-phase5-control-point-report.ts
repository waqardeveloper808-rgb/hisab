import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { phase5DocumentEngineControlPoints } from "@/backend/app/Support/Standards/document-engine-phase5-control-points";

type VerificationReport = {
  accounting_position?: string;
  journal_filtering?: string;
  ledger_filtering?: string;
  trial_balance_filtering?: string;
  pdf_download?: string;
  multi_invoice_consistency?: string;
  preview_layout?: string;
  details?: {
    checks?: Record<string, unknown>;
    sampleInvoices?: Array<{ id: number; number: string }>;
  };
};

type ControlPointOutput = {
  control_point: string;
  status: "PASS" | "FAIL";
  tested_documents: string[];
  failures: string[];
  evidence: string[];
};

const artifactsRoot = path.join(process.cwd(), "artifacts", "document_engine_fix_real");
const reportPath = path.join(artifactsRoot, "real-verification-report.json");
const outputPath = path.join(artifactsRoot, "phase5-control-point-results.json");

function statusFromVerification(controlPoint: string, verification: VerificationReport): ControlPointOutput["status"] {
  const checks = verification.details?.checks ?? {};
  const filteredRows = Number(checks.filteredRows ?? 0);
  const fullRows = Number(checks.fullRows ?? 0);
  switch (controlPoint) {
    case "CP-01":
      return verification.journal_filtering === "PASS" && (verification.details?.sampleInvoices?.length ?? 0) >= 10 ? "PASS" : "FAIL";
    case "CP-02":
      return verification.ledger_filtering === "PASS" ? "PASS" : "FAIL";
    case "CP-03":
      return verification.trial_balance_filtering === "PASS" && filteredRows > 0 && fullRows > filteredRows ? "PASS" : "FAIL";
    case "CP-05":
      return "FAIL";
    case "CP-19":
      return verification.multi_invoice_consistency === "PASS" && (verification.details?.sampleInvoices?.length ?? 0) >= 10 ? "PASS" : "FAIL";
    default:
      return "FAIL";
  }
}

function failuresFor(controlPoint: string, verification: VerificationReport): string[] {
  const sampleCount = verification.details?.sampleInvoices?.length ?? 0;
  switch (controlPoint) {
    case "CP-01":
      return statusFromVerification(controlPoint, verification) === "PASS"
        ? []
        : [
            verification.journal_filtering === "PASS" ? "10-invoice coverage was not completed." : "Journal UI verification did not visually prove invoice-only rows.",
            "Fresh API payload and DB snapshot for 10 invoices are not yet attached.",
          ];
    case "CP-02":
      return verification.ledger_filtering === "PASS" ? [] : ["Ledger UI verification did not visually prove invoice-only rows.", "DB snapshot for filtered ledger impact is not attached."];
    case "CP-03":
      return statusFromVerification(controlPoint, verification) === "PASS" ? [] : ["Impact trial balance was not proven distinct from full trial balance with matching journal totals."];
    case "CP-04":
      return ["Open Source Document click path has not been freshly verified in Phase 5 evidence."];
    case "CP-05":
      return ["Preview-vs-PDF visual parity screenshot is still missing for this control."];
    case "CP-06":
      return ["Date rendering uniqueness has not been freshly validated with dedicated evidence."];
    case "CP-07":
      return ["Close Preview action has not been freshly validated."];
    case "CP-08":
      return ["WhatsApp widget non-blocking behavior has not been freshly validated."];
    case "CP-09":
      return ["Ledger density row-count evidence has not been captured."];
    case "CP-10":
      return ["Audit trail density evidence has not been captured."];
    case "CP-11":
      return ["Alternate row shading evidence has not been captured across major tables."];
    case "CP-12":
      return ["Debit/credit visual semantic evidence has not been captured."];
    case "CP-13":
      return ["Dedicated bilingual compliance evidence has not been captured for Phase 5."];
    case "CP-14":
      return ["User-uploaded asset rendering was not executed in Phase 5."];
    case "CP-15":
      return ["Preview-vs-PDF parity comparison was not captured as a dedicated artifact."];
    case "CP-16":
      return ["ZATCA field presence was not fully validated with dedicated evidence."];
    case "CP-17":
      return ["Structured Saudi national address evidence is not attached."];
    case "CP-18":
      return ["QR and XML hooks are not proven in current Phase 5 evidence."];
    case "CP-19":
      return sampleCount >= 10 && verification.multi_invoice_consistency === "PASS" ? [] : [`Only ${sampleCount} invoices have fresh multi-invoice evidence; 10 are required.`];
    default:
      return [];
  }
}

function evidenceFor(controlPoint: string): string[] {
  const commonBase = "artifacts/document_engine_fix_real";
  const map: Record<string, string[]> = {
    "CP-01": [`${commonBase}/journal-filter-test.png`, `${commonBase}/real-verification-report.json`],
    "CP-02": [`${commonBase}/ledger-filter-test.png`, `${commonBase}/real-verification-report.json`],
    "CP-03": [`${commonBase}/trial-balance-filter-test.png`, `${commonBase}/real-verification-report.json`],
    "CP-04": [],
    "CP-05": [`${commonBase}/pdf-open-test.png`, `${commonBase}/reality-check-151.pdf`, `${commonBase}/real-verification-report.json`],
    "CP-06": [],
    "CP-07": [],
    "CP-08": [],
    "CP-09": [`${commonBase}/ledger-filter-test.png`],
    "CP-10": [],
    "CP-11": [`${commonBase}/journal-filter-test.png`, `${commonBase}/ledger-filter-test.png`, `${commonBase}/trial-balance-filter-test.png`],
    "CP-12": [`${commonBase}/ledger-filter-test.png`, `${commonBase}/journal-filter-test.png`],
    "CP-13": [`${commonBase}/accounting-impact-position.png`],
    "CP-14": [],
    "CP-15": [`${commonBase}/pdf-open-test.png`, `${commonBase}/accounting-impact-position.png`],
    "CP-16": [`${commonBase}/accounting-impact-position.png`],
    "CP-17": [],
    "CP-18": [`${commonBase}/reality-check-151.pdf`],
    "CP-19": [`${commonBase}/real-verification-report.json`],
  };
  return map[controlPoint] ?? [];
}

async function main() {
  const verification = JSON.parse(await readFile(reportPath, "utf8")) as VerificationReport;
  const testedDocuments = (verification.details?.sampleInvoices ?? []).map((entry) => entry.number);
  const outputs: ControlPointOutput[] = phase5DocumentEngineControlPoints.map((controlPoint) => ({
    control_point: controlPoint.control_point,
    status: statusFromVerification(controlPoint.control_point, verification),
    tested_documents: controlPoint.control_point === "CP-01" || controlPoint.control_point === "CP-19"
      ? testedDocuments
      : verification.details?.sampleInvoices?.[0]?.number
        ? [verification.details.sampleInvoices[0].number]
        : [],
    failures: failuresFor(controlPoint.control_point, verification),
    evidence: evidenceFor(controlPoint.control_point),
  }));

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(outputs, null, 2)}\n`, "utf8");
  process.stdout.write(`${outputPath}\n`);
}

void main();