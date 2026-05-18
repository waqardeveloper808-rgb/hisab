import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type SequenceState = {
  icv: number;
  previousInvoiceHash: string | null;
  updatedAt: string;
};

const statePath = path.join(process.cwd(), "data", "zatca-sequence-store.json");

async function readState(): Promise<SequenceState> {
  try {
    const raw = await readFile(statePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<SequenceState> | null;
    return {
      icv: typeof parsed?.icv === "number" ? parsed.icv : 0,
      previousInvoiceHash: typeof parsed?.previousInvoiceHash === "string" ? parsed.previousInvoiceHash : null,
      updatedAt: typeof parsed?.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return {
      icv: 0,
      previousInvoiceHash: null,
      updatedAt: new Date().toISOString(),
    };
  }
}

async function writeState(value: SequenceState) {
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(statePath, JSON.stringify(value, null, 2));
}

export async function getCurrentZatcaSequenceState() {
  return await readState();
}

export async function nextZatcaInvoiceCounter(previousInvoiceHash?: string | null) {
  const current = await readState();
  const next = {
    icv: current.icv + 1,
    previousInvoiceHash: previousInvoiceHash ?? current.previousInvoiceHash ?? null,
    updatedAt: new Date().toISOString(),
  };
  await writeState(next);
  return next;
}

export async function seedZatcaSequenceState(icv: number, previousInvoiceHash: string | null = null) {
  const next = {
    icv: Math.max(0, Math.floor(icv)),
    previousInvoiceHash,
    updatedAt: new Date().toISOString(),
  };
  await writeState(next);
  return next;
}
