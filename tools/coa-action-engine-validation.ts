/**
 * Writes validation JSON for COA action-engine fix (default COA vs preview journals).
 * Run: npx tsx tools/coa-action-engine-validation.ts
 */
import fs from "node:fs";
import path from "node:path";
import previewJournalStore from "../data/preview-journal-store.json";
import { cloneDefaultChartOfAccounts, findAccountById } from "../lib/accounting-engine";

const OUT = path.join(process.cwd(), "artifacts/coa_action_engine_fix_2026-04-27", "validation");

type Line = {
  account_id?: number;
  debit?: number;
  credit?: number;
};
type Entry = {
  entry_number?: string;
  lines?: Line[];
  metadata?: { batch_tag?: string };
};

function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const coa = cloneDefaultChartOfAccounts();
  const entries = previewJournalStore as Entry[];

  const gjTest = entries.filter((e) => String(e.entry_number ?? "").startsWith("GJ-TEST"));
  const numbers = gjTest.map((e) => e.entry_number ?? "");
  const dup = numbers.filter((n, i) => numbers.indexOf(n) !== i);

  const accountRefs: { line: string; ok: boolean; detail?: string }[] = [];
  let totalDr = 0;
  let totalCr = 0;

  for (const e of gjTest) {
    for (const ln of e.lines ?? []) {
      const id = ln.account_id;
      const dr = Number(ln.debit) || 0;
      const cr = Number(ln.credit) || 0;
      totalDr += dr;
      totalCr += cr;
      if (id == null) {
        accountRefs.push({ line: `${e.entry_number}:?`, ok: false, detail: "missing account_id" });
        continue;
      }
      const acc = findAccountById(id);
      if (!acc) {
        accountRefs.push({
          line: `${e.entry_number}:acct ${id}`,
          ok: false,
          detail: "account id not in active COA snapshot (use defaults)",
        });
        continue;
      }
      accountRefs.push({ line: `${e.entry_number}:${id}`, ok: true });
    }
  }

  const tbBalanced = Math.abs(totalDr - totalCr) < 0.01;

  const coaValidation = {
    generatedAt: new Date().toISOString(),
    defaultCoaAccountCount: coa.length,
    pettyCash102: coa.find((a) => a.code === "102") ?? null,
    cashFolder100: coa.find((a) => a.code === "100") ?? null,
  };

  const journalValidation = {
    generatedAt: new Date().toISOString(),
    gjTestEntryCount: gjTest.length,
    gjTestUniqueEntryNumbers: new Set(numbers).size,
    duplicateEntryNumbers: dup,
    accountReferenceLinesChecked: accountRefs.length,
    accountReferenceFailures: accountRefs.filter((x) => !x.ok),
    allAccountReferencesOk: accountRefs.every((x) => x.ok),
  };

  const tbValidation = {
    generatedAt: new Date().toISOString(),
    totalDebits: totalDr,
    totalCredits: totalCr,
    difference: totalDr - totalCr,
    trialBalanceBalanced: tbBalanced,
    note: "Aggregated from preview-journal-store.json line amounts.",
  };

  fs.writeFileSync(path.join(OUT, "coa-validation.json"), JSON.stringify(coaValidation, null, 2), "utf8");
  fs.writeFileSync(path.join(OUT, "journal-account-reference-validation.json"), JSON.stringify(journalValidation, null, 2), "utf8");
  fs.writeFileSync(path.join(OUT, "trial-balance-validation.json"), JSON.stringify(tbValidation, null, 2), "utf8");

  console.log("Wrote validation JSON to", OUT);
  if (!journalValidation.allAccountReferencesOk || !tbBalanced || gjTest.length !== 100) {
    console.error("VALIDATION ISSUES:", {
      gjCount: gjTest.length,
      refsOk: journalValidation.allAccountReferencesOk,
      tbBalanced,
    });
    process.exitCode = 1;
  }
}

main();
