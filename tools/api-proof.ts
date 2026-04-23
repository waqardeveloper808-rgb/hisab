import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const artifactRoot = process.env.ARTIFACT_DIR ?? path.join(repoRoot, "artifacts", "system_recovery_manual");
const apiSamplesDir = path.join(artifactRoot, "api_samples");
const reportPath = path.join(artifactRoot, "reports", "api_proof_summary.json");
const baseUrl = (process.env.BACKEND_BASE_URL ?? process.env.GULF_HISAB_API_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const companyId = process.env.COMPANY_ID ?? process.env.GULF_HISAB_COMPANY_ID ?? "2";
const apiToken = process.env.WORKSPACE_API_TOKEN ?? "diag-proxy-token";
const actorId = process.env.WORKSPACE_API_USER_ID ?? "2";

const endpoints = [
  { key: "invoices", path: `reports/invoice-register` },
  { key: "quotations", path: `documents?group=sales&type=quotation&limit=20` },
  { key: "proforma", path: `documents?group=sales&type=proforma_invoice&limit=20` },
  { key: "credit_notes", path: `documents?group=sales&type=credit_note&limit=20` },
  { key: "debit_notes", path: `documents?group=sales&type=debit_note&limit=20` },
  { key: "journals", path: `journals` },
  { key: "bills", path: `reports/bills-register` },
  { key: "dashboard", path: `reports/dashboard-summary` },
];

async function fetchJson(relativePath: string) {
  const response = await fetch(`${baseUrl}/api/companies/${companyId}/${relativePath}`, {
    headers: {
      Accept: "application/json",
      "X-Gulf-Hisab-Workspace-Token": apiToken,
      "X-Gulf-Hisab-Actor-Id": actorId,
    },
    cache: "no-store",
  });

  const text = await response.text();
  let parsed: unknown = null;

  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  return {
    status: response.status,
    ok: response.ok,
    payload: parsed,
  };
}

async function main() {
  await fs.mkdir(apiSamplesDir, { recursive: true });
  await fs.mkdir(path.dirname(reportPath), { recursive: true });

  const results: Array<Record<string, unknown>> = [];

  for (const endpoint of endpoints) {
    const result = await fetchJson(endpoint.path);
    const dataArray = Array.isArray((result.payload as { data?: unknown })?.data)
      ? ((result.payload as { data: unknown[] }).data)
      : null;

    const samplePath = path.join(apiSamplesDir, `${endpoint.key}.json`);
    await fs.writeFile(samplePath, `${JSON.stringify(result.payload, null, 2)}\n`, "utf8");

    results.push({
      endpoint: endpoint.key,
      path: endpoint.path,
      status: result.status,
      ok: result.ok,
      sample_path: samplePath,
      record_count: dataArray?.length ?? null,
    });
  }

  const summary = {
    generated_at: new Date().toISOString(),
    company_id: Number(companyId),
    base_url: baseUrl,
    endpoints: results,
  };

  await fs.writeFile(reportPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

void main();
