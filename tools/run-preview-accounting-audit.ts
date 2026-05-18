/**
 * Preview accounting audit + safe rounding fix loop.
 * Output: artifacts/accounting_audit_report/
 * Run: npm run audit:preview-accounting
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import {
  applyRoundingFixToManualJournalStore,
  runPreviewAccountingAudit,
} from "@/lib/accounting-preview-audit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const OUT = path.join(REPO, "artifacts", "accounting_audit_report");

const MAX_LOOPS = 5;

async function main() {
  await mkdir(OUT, { recursive: true });
  let loop = 0;
  let fixCount = 0;
  let report = await runPreviewAccountingAudit();

  while (!report.success && loop < MAX_LOOPS) {
    const r = await applyRoundingFixToManualJournalStore(REPO);
    fixCount += r.fixed;
    if (r.fixed === 0) {
      break;
    }
    report = await runPreviewAccountingAudit();
    loop += 1;
  }

  const summary = {
    totalJournalEntriesChecked: report.journalsChecked,
    invalidEntriesCount: report.journalImbalances.length,
    ledgerVsTbMismatches: report.ledgerVsTbByAccount.length,
    trialBalanceMatch: report.trialBalanceTotals.tbMatchLedger,
    globalDebitCreditMatch: report.trialBalanceTotals.globalDebitCreditMatch,
    brokenDocumentLinks: report.documentLinkIssues.length,
    brokenAuditTrails: report.auditTrailIssues.length,
    unknownChartCodesSample: report.chartOfAccounts.unknownLedgerCodes.slice(0, 30),
    fixLoops: loop,
    roundingFixesApplied: fixCount,
    success: report.success,
    remainingImbalances: report.journalImbalances,
    remainingDocumentIssues: report.documentLinkIssues,
    remainingAuditTrailIssues: report.auditTrailIssues,
  };

  await writeFile(path.join(OUT, "audit_summary.json"), JSON.stringify(summary, null, 2), "utf-8");
  await writeFile(path.join(OUT, "full_report.json"), JSON.stringify(report, null, 2), "utf-8");
  await writeFile(
    path.join(OUT, "README.md"),
    `# Accounting audit (preview workspace)

- **Journals checked:** ${report.journalsChecked}
- **Journal imbalances:** ${report.journalImbalances.length}
- **Ledger vs TB mismatches (by account):** ${report.ledgerVsTbByAccount.length}
- **TB vs ledger totals match:** ${report.trialBalanceTotals.tbMatchLedger}
- **Global Dr = Cr (ledger):** ${report.trialBalanceTotals.globalDebitCreditMatch}
- **Document / payment link issues:** ${report.documentLinkIssues.length}
- **Audit trail issues:** ${report.auditTrailIssues.length}
- **Rounding fixes applied (manual file):** ${fixCount}
- **SUCCESS:** ${report.success}

Unknown COA codes (preview uses short codes like 110 vs 1100 in engine): see \`unknownChartCodesSample\` in audit_summary.json.

`,
    "utf-8",
  );

  console.log(JSON.stringify(summary, null, 2));
  process.exit(report.success ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
