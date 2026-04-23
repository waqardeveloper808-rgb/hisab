import fs from "node:fs/promises";
import path from "node:path";

async function readDotEnvValue(filePath, key) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
    return match ? match[1].trim().replace(/^"|"$/g, "") : null;
  } catch {
    return null;
  }
}

const backendBaseUrl = process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8000";
const companyId = process.env.COMPANY_ID ?? "2";
const invoiceNumber = process.env.INVOICE_NUMBER;
const paymentReference = process.env.PAYMENT_REFERENCE;
const backendEnvPath = path.join(process.cwd(), "backend", ".env");
const apiToken = process.env.API_TOKEN ?? process.env.WORKSPACE_API_TOKEN ?? await readDotEnvValue(backendEnvPath, "WORKSPACE_API_TOKEN") ?? "";
const actorId = process.env.ACTOR_ID ?? process.env.WORKSPACE_API_USER_ID ?? await readDotEnvValue(backendEnvPath, "WORKSPACE_API_USER_ID") ?? "";

if (!invoiceNumber) {
  throw new Error("INVOICE_NUMBER is required");
}

async function backendJson(apiPath) {
  const response = await fetch(`${backendBaseUrl}/api/companies/${companyId}/${apiPath}`, {
    headers: {
      Accept: "application/json",
      "X-Gulf-Hisab-Workspace-Token": apiToken,
      "X-Gulf-Hisab-Actor-Id": actorId,
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed for ${apiPath}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

const journalsPayload = await backendJson(`journals?document_number=${encodeURIComponent(invoiceNumber)}`);
const generalLedgerPayload = await backendJson(`reports/general-ledger?document_number=${encodeURIComponent(invoiceNumber)}&limit=2000`);
const trialBalancePayload = await backendJson("reports/trial-balance");

const result = {
  invoiceNumber,
  paymentReference,
  journals: journalsPayload.data ?? journalsPayload,
  generalLedger: generalLedgerPayload.data ?? generalLedgerPayload,
  paymentMatches: paymentReference
    ? (generalLedgerPayload.data ?? []).filter((row) => String(row.description ?? "").includes(paymentReference) || String(row.reference ?? "").includes(paymentReference))
    : [],
  trialBalance: trialBalancePayload.data ?? trialBalancePayload,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
