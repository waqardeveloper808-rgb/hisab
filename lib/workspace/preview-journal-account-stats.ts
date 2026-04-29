import previewJournalStore from "@/data/preview-journal-store.json";

type PreviewLine = {
  account_id?: number;
  debit?: number;
  credit?: number;
};

type PreviewEntry = { lines?: PreviewLine[] };

const entries = previewJournalStore as PreviewEntry[];

/** Net posting (debit − credit) per account from preview journal JSON. */
export function previewJournalBalanceByAccountId(): Map<number, number> {
  const m = new Map<number, number>();
  for (const entry of entries) {
    for (const line of entry.lines ?? []) {
      const id = line.account_id;
      if (id == null) continue;
      const dr = Number(line.debit) || 0;
      const cr = Number(line.credit) || 0;
      m.set(id, (m.get(id) ?? 0) + (dr - cr));
    }
  }
  return m;
}

/** Number of journal lines touching an account in preview data. */
export function previewJournalLineCountByAccountId(): Map<number, number> {
  const m = new Map<number, number>();
  for (const entry of entries) {
    for (const line of entry.lines ?? []) {
      const id = line.account_id;
      if (id == null) continue;
      m.set(id, (m.get(id) ?? 0) + 1);
    }
  }
  return m;
}
