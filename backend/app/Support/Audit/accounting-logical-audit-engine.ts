import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type AccountingProof = {
  invoice?: { number?: string | null } | null;
  payment?: { reference?: string | null } | null;
  uiValidation?: {
    invoiceNumber?: string;
    paymentReference?: string;
    journalEntryNumbers?: string[];
  };
  apiValidation?: {
    journalEntries?: Array<{
      entryNumber?: string;
      reference?: string | null;
      lines?: Array<{
        accountCode?: string | null;
        documentNumber?: string | null;
        debit?: number;
        credit?: number;
      }>;
      lines_total_debit?: number;
      lines_total_credit?: number;
    }>;
    ledgerRows?: Array<{
      accountCode?: string | null;
      documentNumber?: string | null;
      debit?: number;
      credit?: number;
    }>;
  };
};

export type AccountingLogicalCheck = {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
};

export type AccountingLogicalAuditReport = {
  generated_at: string;
  status: "PASS" | "PARTIAL" | "FAIL";
  invoice_number: string;
  payment_reference: string;
  checks: AccountingLogicalCheck[];
};

function statusFromChecks(checks: AccountingLogicalCheck[]): "PASS" | "PARTIAL" | "FAIL" {
  const passed = checks.filter((check) => check.pass).length;
  if (passed === checks.length) {
    return "PASS";
  }
  if (passed === 0) {
    return "FAIL";
  }
  return "PARTIAL";
}

export function runAccountingLogicalAudit(proof: AccountingProof): AccountingLogicalAuditReport {
  const invoiceNumber = proof.uiValidation?.invoiceNumber ?? proof.invoice?.number ?? "";
  const paymentReference = proof.uiValidation?.paymentReference ?? proof.payment?.reference ?? "";
  const journalEntries = proof.apiValidation?.journalEntries ?? [];
  const ledgerRows = proof.apiValidation?.ledgerRows ?? [];
  const allLines = journalEntries.flatMap((entry) => entry.lines ?? []);
  const invoiceLines = allLines.filter((line) => (line.documentNumber ?? "") === invoiceNumber);
  const paymentJournal = journalEntries.find((entry) => (entry.reference ?? "") === invoiceNumber || (entry.lines ?? []).some((line) => (line.documentNumber ?? "") === invoiceNumber && Number(line.credit ?? 0) > 0 && line.accountCode === "1100"));

  const debitTotal = allLines.reduce((sum, line) => sum + Number(line.debit ?? 0), 0);
  const creditTotal = allLines.reduce((sum, line) => sum + Number(line.credit ?? 0), 0);

  const checks: AccountingLogicalCheck[] = [
    {
      id: "ACC-LOG-001",
      label: "Debit equals credit",
      pass: Math.abs(debitTotal - creditTotal) < 0.005,
      detail: `debit=${debitTotal.toFixed(2)} credit=${creditTotal.toFixed(2)}`,
    },
    {
      id: "ACC-LOG-002",
      label: "Invoice revenue line exists",
      pass: invoiceLines.some((line) => line.accountCode === "4000" && Number(line.credit ?? 0) > 0),
      detail: `invoice=${invoiceNumber}`,
    },
    {
      id: "ACC-LOG-003",
      label: "Receivable line exists",
      pass: invoiceLines.some((line) => line.accountCode === "1100" && Number(line.debit ?? 0) > 0),
      detail: `invoice=${invoiceNumber}`,
    },
    {
      id: "ACC-LOG-004",
      label: "VAT output line exists",
      pass: invoiceLines.some((line) => line.accountCode === "2200" && Number(line.credit ?? 0) > 0),
      detail: `invoice=${invoiceNumber}`,
    },
    {
      id: "ACC-LOG-005",
      label: "Payment reduces receivable",
      pass: ledgerRows.some((row) => row.accountCode === "1100" && (row.documentNumber ?? "") === invoiceNumber && Number(row.credit ?? 0) > 0),
      detail: `payment=${paymentReference || invoiceNumber}`,
    },
    {
      id: "ACC-LOG-006",
      label: "Stock and COGS linkage exists",
      pass: invoiceLines.some((line) => line.accountCode === "5000" && Number(line.debit ?? 0) > 0) && invoiceLines.some((line) => line.accountCode === "1300" && Number(line.credit ?? 0) > 0),
      detail: `invoice=${invoiceNumber}`,
    },
    {
      id: "ACC-LOG-007",
      label: "Journal traceability exists",
      pass: journalEntries.every((entry) => (entry.lines ?? []).some((line) => (line.documentNumber ?? "") === invoiceNumber)),
      detail: `${journalEntries.length} journal entries traced to ${invoiceNumber}`,
    },
    {
      id: "ACC-LOG-008",
      label: "No orphan payment journal",
      pass: Boolean(paymentJournal),
      detail: paymentJournal ? `payment journal ${paymentJournal.entryNumber ?? "unknown"} linked` : "missing payment journal",
    },
    {
      id: "ACC-LOG-009",
      label: "Invoice finalization has journal evidence",
      pass: journalEntries.some((entry) => (entry.lines ?? []).some((line) => (line.documentNumber ?? "") === invoiceNumber)),
      detail: `invoice=${invoiceNumber}`,
    },
    {
      id: "ACC-LOG-010",
      label: "Ledger visibility under valid session",
      pass: ledgerRows.length > 0,
      detail: `${ledgerRows.length} ledger rows visible for ${invoiceNumber}`,
    },
  ];

  return {
    generated_at: new Date().toISOString(),
    status: statusFromChecks(checks),
    invoice_number: invoiceNumber,
    payment_reference: paymentReference,
    checks,
  };
}

export async function writeAccountingLogicalAuditReport(proof: AccountingProof, targetFilePath = path.join(process.cwd(), "artifacts", "accounting-logical-audit-report.json")) {
  const report = runAccountingLogicalAudit(proof);
  await mkdir(path.dirname(targetFilePath), { recursive: true });
  await writeFile(targetFilePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}