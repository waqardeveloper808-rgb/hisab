import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import type { ZatcaCertificateBundle, ZatcaEnvironment } from "./types";

function env(key: string): string {
  return (process.env[key] ?? "").trim();
}

function guessEnvironment(): ZatcaEnvironment {
  const raw = env("ZATCA_ENV").toLowerCase();
  if (raw === "production" || raw === "sandbox" || raw === "simulation") {
    return raw;
  }
  return "simulation";
}

async function readMaybe(path: string): Promise<string | null> {
  if (!path) {
    return null;
  }
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

export async function loadZatcaCertificateBundle(): Promise<ZatcaCertificateBundle> {
  const environment = guessEnvironment();
  const blockers: string[] = [];

  const privateKeyPath = env("ZATCA_EGS_PRIVATE_KEY_PATH");
  const certificatePath = env("ZATCA_EGS_CERTIFICATE_PATH");
  const privateKeyPem = await readMaybe(privateKeyPath);
  const certificatePem = await readMaybe(certificatePath);
  const csid = env("ZATCA_CSID");
  const pcsid = env("ZATCA_PCSID");

  if (!privateKeyPem) blockers.push(privateKeyPath ? `private-key-not-found:${privateKeyPath}` : "private-key-path-missing");
  if (!certificatePem) blockers.push(certificatePath ? `certificate-not-found:${certificatePath}` : "certificate-path-missing");
  if (!csid) blockers.push("csid-missing");
  if (!pcsid) blockers.push("pcsid-missing");

  return {
    available: blockers.length === 0,
    privateKeyPem,
    certificatePem,
    csid: csid || null,
    pcsid: pcsid || null,
    environment,
    blockers,
  };
}

export function certificateFingerprint(certificatePem: string | null | undefined): string | null {
  if (!certificatePem) {
    return null;
  }
  return createHash("sha256").update(certificatePem).digest("hex");
}
