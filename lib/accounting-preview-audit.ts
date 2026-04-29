/**
 * Data-driven preview workspace accounting audit — double-entry, GL vs TB,
 * document linkage, audit trail timestamps. Safe fixes limited to rounding on manual journals.
 */
import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { defaultChartOfAccounts } from "@/lib/accounting-engine";
import {
  listPreviewAuditTrail,
  listPreviewGeneralLedger,
  listPreviewDocuments,
  listPreviewPayments,
  listPreviewJournals,
  listPreviewTrialBalance,
} from "@/lib/workspace-preview";

const ROUND = (n: number) => Math.round(n * 100) / 100;

/**
 * Mirrors `buildPreviewJournalEntries` in workspace-preview.ts: non-draft docs of these
 * types get synthetic journal lines (proforma, quotation, PO, etc. do not).
 */
const PREVIEW_DOC_TYPES_WITH_SYNTHETIC_JOURNAL = new Set([
  "delivery_note",
  "tax_invoice",
  "cash_invoice",
  "recurring_invoice",
  "api_invoice",
  "debit_note",
  "credit_note",
  "vendor_bill",
  "purchase_invoice",
]);

export type JournalLike = {
  id: number;
  entry_number: string;
  entry_date?: string;
  lines: Array<{ debit?: string | number | null; credit?: string | number | null; document_id?: number | null }>;
};

function num(v: unknown): number {
  if (typeof v === "number") {
    return v;
  }
  if (typeof v === "string") {
    return Number(v) || 0;
  }
  return 0;
}

/** Sum debits and credits per journal entry. */
export function journalTotals(entry: JournalLike): { debit: number; credit: number; delta: number } {
  let d = 0;
  let c = 0;
  for (const l of entry.lines ?? []) {
    d += ROUND(num(l.debit));
    c += ROUND(num(l.credit));
  }
  return { debit: ROUND(d), credit: ROUND(c), delta: ROUND(d - c) };
}

/** Aggregate ledger from journal lines by account_code (string identity). */
export function aggregateLedgerByAccount(
  journals: Array<{
    entry_number?: string;
    lines: Array<{
      account_code?: string | null;
      debit?: number | string;
      credit?: number | string;
    }>;
  }>,
): Map<string, { debit: number; credit: number }> {
  const m = new Map<string, { debit: number; credit: number }>();
  for (const j of journals) {
    for (const l of j.lines ?? []) {
      const code = String(l.account_code ?? "").trim() || "?";
      const cur = m.get(code) ?? { debit: 0, credit: 0 };
      cur.debit = ROUND(cur.debit + ROUND(num(l.debit)));
      cur.credit = ROUND(cur.credit + ROUND(num(l.credit)));
      m.set(code, cur);
    }
  }
  return m;
}

export type JournalImbalanceFinding = {
  entryId?: number;
  entryNumber?: string;
  debit: number;
  credit: number;
  delta: number;
};

export type AuditReport = {
  generatedAt: string;
  journalsChecked: number;
  journalImbalances: JournalImbalanceFinding[];
  trialBalanceTotals: {
    ledgerSumDebit: number;
    ledgerSumCredit: number;
    tbSumDebit: number;
    tbSumCredit: number;
    tbMatchLedger: boolean;
    globalDebitCreditMatch: boolean;
  };
  ledgerVsTbByAccount: Array<{ code: string; ledgerDrCr: string; tbDrCr: string; match: boolean }>;
  chartOfAccounts: { codesInLedger: number; codesInOfficialChart: number; unknownLedgerCodes: string[] };
  documentLinkIssues: Array<{ documentType: string; documentId: number; documentNumber: string; detail: string }>;
  auditTrailIssues: Array<{ id: unknown; detail: string }>;
  success: boolean;
};

export async function runPreviewAccountingAudit(): Promise<AuditReport> {
  const journals = await listPreviewJournals();
  const glRows = await listPreviewGeneralLedger();
  const tb = await listPreviewTrialBalance();
  const documents = await listPreviewDocuments({});
  const payments = await listPreviewPayments();
  let trail;
  try {
    trail = await listPreviewAuditTrail();
  } catch {
    trail = [];
  }

  const journalImbalances: JournalImbalanceFinding[] = [];
  for (const j of journals as JournalLike[]) {
    const { debit, credit, delta } = journalTotals(j);
    if (Math.abs(delta) > 0.005) {
      journalImbalances.push({
        entryId: j.id,
        entryNumber: j.entry_number,
        debit,
        credit,
        delta,
      });
    }
  }

  const ledgerAgg = aggregateLedgerByAccount(journals as never);
  let ledgerSumDebit = 0;
  let ledgerSumCredit = 0;
  for (const [, v] of ledgerAgg) {
    ledgerSumDebit += v.debit;
    ledgerSumCredit += v.credit;
  }
  ledgerSumDebit = ROUND(ledgerSumDebit);
  ledgerSumCredit = ROUND(ledgerSumCredit);

  let tbSumDebit = 0;
  let tbSumCredit = 0;
  for (const row of tb) {
    tbSumDebit += row.debit_total;
    tbSumCredit += row.credit_total;
  }
  tbSumDebit = ROUND(tbSumDebit);
  tbSumCredit = ROUND(tbSumCredit);

  const codesSet = new Set(defaultChartOfAccounts.map((a) => a.code));
  const ledgerCodes = [...ledgerAgg.keys()].filter((c) => c !== "?");
  const unknownLedgerCodes = ledgerCodes.filter((c) => !codesSet.has(c));

  const ledgerVsTbByAccount: AuditReport["ledgerVsTbByAccount"] = [];
  const allCodes = new Set<string>([...ledgerAgg.keys(), ...tb.map((r) => r.code)]);
  for (const code of [...allCodes].sort()) {
    if (!code || code === "?") {
      continue;
    }
    const lg = ledgerAgg.get(code);
    const tbr = tb.find((t) => t.code === code);
    const lt = lg ? `${ROUND(lg.debit)}/${ROUND(lg.credit)}` : "0/0";
    const tt = tbr ? `${ROUND(tbr.debit_total)}/${ROUND(tbr.credit_total)}` : "0/0";
    let match = false;
    if (!lg && !tbr) {
      match = true;
    } else if (lg && tbr) {
      match =
        ROUND(lg.debit) === ROUND(tbr.debit_total) && ROUND(lg.credit) === ROUND(tbr.credit_total);
    } else {
      match = false;
    }
    ledgerVsTbByAccount.push({
      code,
      ledgerDrCr: lt,
      tbDrCr: tt,
      match,
    });
  }
  const mismatchesFiltered = ledgerVsTbByAccount.filter((x) => !x.match);

  const documentLinkIssues: AuditReport["documentLinkIssues"] = [];
  const postedDocs = documents.filter((d) => String(d.status).toLowerCase() !== "draft");
  const docsRequiringJe = postedDocs.filter((d) => PREVIEW_DOC_TYPES_WITH_SYNTHETIC_JOURNAL.has(d.type));
  const journalIndex = journals as Array<{ entry_number?: string; source_type?: string | null; source_id?: number | null; lines: Array<{ document_id?: number | null }> }>;

  for (const doc of docsRequiringJe) {
    const hasLineLink = journalIndex.some((j) => j.lines.some((ln) => Number(ln.document_id) === doc.id));
    const hasSourceLink = journalIndex.some((j) => j.source_id === doc.id);

    if (!hasLineLink && !hasSourceLink) {
      documentLinkIssues.push({
        documentType: doc.type,
        documentId: doc.id,
        documentNumber: doc.document_number,
        detail: "No journal linking document_id line or journal source_id match",
      });
    }
  }

  for (const p of payments) {
    const ok =
      journalIndex.some((j) => String(j.entry_number ?? "").includes(`JE-PAY-${p.id}`))
      || journalIndex.some((j) => j.source_id === p.id && String(j.entry_number ?? "").startsWith("JE-PAY"));
    if (!ok) {
      documentLinkIssues.push({
        documentType: "payment",
        documentId: p.id,
        documentNumber: p.payment_number ?? "",
        detail: "No JE-PAY-* journal keyed to this payment id",
      });
    }
  }

  const auditTrailIssues: AuditReport["auditTrailIssues"] = [];
  for (const ev of trail) {
    const created = (ev as { created_at?: string }).created_at;
    const id = ev.id;
    if (created === undefined || created === null || created === "") {
      auditTrailIssues.push({ id, detail: "audit event missing created_at" });
    }
    if (id === undefined || id === null || id === "") {
      auditTrailIssues.push({ id, detail: "audit event missing id" });
    }
  }

  const tbMatchLedger =
    Math.abs(tbSumDebit - ledgerSumDebit) < 0.02 && Math.abs(tbSumCredit - ledgerSumCredit) < 0.02;
  const globalDebitCreditMatch = Math.abs(ledgerSumDebit - ledgerSumCredit) < 0.02;

  const success =
    journalImbalances.length === 0
    && mismatchesFiltered.length === 0
    && tbMatchLedger
    && globalDebitCreditMatch
    && documentLinkIssues.length === 0
    && auditTrailIssues.length === 0;

  return {
    generatedAt: new Date().toISOString(),
    journalsChecked: journals.length,
    journalImbalances,
    trialBalanceTotals: {
      ledgerSumDebit,
      ledgerSumCredit,
      tbSumDebit,
      tbSumCredit,
      tbMatchLedger,
      globalDebitCreditMatch,
    },
    ledgerVsTbByAccount: mismatchesFiltered,
    chartOfAccounts: {
      codesInLedger: ledgerCodes.length,
      codesInOfficialChart: ledgerCodes.filter((c) => codesSet.has(c)).length,
      unknownLedgerCodes: unknownLedgerCodes.slice(0, 200),
    },
    documentLinkIssues,
    auditTrailIssues,
    success,
  };
}

/** Apply ≤0.01 rounding fix to manual preview journals file only. Mutates disk. */
export async function applyRoundingFixToManualJournalStore(repoRoot: string): Promise<{ fixed: number; remaining: JournalImbalanceFinding[] }> {
  const p = path.join(repoRoot, "data", "preview-journal-store.json");
  let raw: Array<{
    id: number;
    entry_number?: string;
    lines: Array<{ debit?: number; credit?: number }>;
  }> = [];

  try {
    raw = JSON.parse(await readFile(p, "utf-8"));
  } catch {
    return { fixed: 0, remaining: [] };
  }

  let fixed = 0;
  const remaining: JournalImbalanceFinding[] = [];

  for (const entry of raw) {
    let { debit, credit, delta } = journalTotals(entry as JournalLike);
    if (Math.abs(delta) <= 0.0001) {
      continue;
    }
    if (Math.abs(delta) > 0.01) {
      remaining.push({
        entryId: entry.id,
        entryNumber: entry.entry_number,
        debit,
        credit,
        delta,
      });
      continue;
    }
    const lines = entry.lines ?? [];
    if (!lines.length) {
      remaining.push({
        entryId: entry.id,
        entryNumber: entry.entry_number,
        debit,
        credit,
        delta,
      });
      continue;
    }
    const tgt = ROUND(Math.abs(delta));
    if (delta > 0) {
      const li = [...lines].reverse().findIndex((ln) => ROUND(num(ln.debit)) >= tgt - 1e-9);
      const reverseIdx = li >= 0 ? lines.length - 1 - li : -1;
      if (reverseIdx >= 0) {
        const ln = lines[reverseIdx]!;
        ln.debit = ROUND(ROUND(num(ln.debit)) - tgt);
      } else {
        const cred = [...lines].reverse().find((ln) => ROUND(num(ln.credit)) > 1e-9);
        if (cred) {
          cred.credit = ROUND(ROUND(num(cred.credit)) + tgt);
        }
      }
    } else if (delta < 0) {
      const rev = [...lines].reverse().find((ln) => ROUND(num(ln.credit)) >= tgt - 1e-9);
      if (rev) {
        rev.credit = ROUND(ROUND(num(rev.credit)) - tgt);
      } else {
        const ded = [...lines].reverse().find((ln) => ROUND(num(ln.debit)) > 1e-9);
        if (ded) {
          ded.debit = ROUND(ROUND(num(ded.debit)) + tgt);
        }
      }
    }
    ({ debit, credit, delta } = journalTotals({ ...entry, lines } as JournalLike));
    if (Math.abs(delta) > 0.005) {
      remaining.push({ entryId: entry.id, entryNumber: entry.entry_number, debit, credit, delta });
    } else {
      fixed += 1;
    }
  }

  await writeFile(p, JSON.stringify(raw, null, 2), "utf-8");
  return { fixed, remaining };
}
