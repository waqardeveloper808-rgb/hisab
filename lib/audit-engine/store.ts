import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AuditSession, AuditStorePayload, AuditSummary, ControlEvaluationResult, RetestCandidate } from "./types";

const STORE_DIR = path.join(process.cwd(), "storage", "audit-engine");
const STORE_PATH = path.join(STORE_DIR, "audit-store.json");

function emptyStore(): AuditStorePayload {
  return {
    sessions: [],
    summaries: [],
    control_results: [],
    retest_queue: [],
    last_updated: new Date().toISOString(),
  };
}

async function readStoreFile(): Promise<AuditStorePayload> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as AuditStorePayload;
  } catch {
    return emptyStore();
  }
}

async function writeStoreFile(store: AuditStorePayload) {
  await mkdir(STORE_DIR, { recursive: true });
  store.last_updated = new Date().toISOString();
  await writeFile(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export async function saveAuditRun(session: AuditSession, summary: AuditSummary, controlResults: ControlEvaluationResult[], retestQueue: RetestCandidate[]) {
  const store = await readStoreFile();
  store.sessions = [session, ...store.sessions.filter((item) => item.audit_id !== session.audit_id)].slice(0, 100);
  store.summaries = [summary, ...store.summaries.filter((item) => item.audit_id !== summary.audit_id)].slice(0, 100);
  store.control_results = [...controlResults, ...store.control_results.filter((item) => !controlResults.some((result) => result.control_id === item.control_id && result.executed_at === item.executed_at))].slice(0, 1000);
  store.retest_queue = retestQueue;
  await writeStoreFile(store);
  return store;
}

export async function loadAuditStore() {
  return readStoreFile();
}

export async function getAuditSession(auditId: string) {
  const store = await readStoreFile();
  return store.sessions.find((session) => session.audit_id === auditId) ?? null;
}

export async function getAuditSummary(auditId: string) {
  const store = await readStoreFile();
  return store.summaries.find((summary) => summary.audit_id === auditId) ?? null;
}

export async function getControlResult(auditId: string, controlId: string) {
  const store = await readStoreFile();
  return store.control_results.find((result) => result.audit_id === auditId && result.control_id === controlId)
    ?? store.control_results.find((result) => result.control_id === controlId)
    ?? null;
}

export async function getRetestQueue() {
  const store = await readStoreFile();
  return store.retest_queue;
}
