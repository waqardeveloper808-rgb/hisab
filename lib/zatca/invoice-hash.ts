import { createHash } from "node:crypto";
import { canonicalizeXml } from "./xml-canonicalizer";

export function computeInvoiceHashBase64(xml: string): string {
  const digest = createHash("sha256").update(canonicalizeXml(xml)).digest("base64");
  return digest;
}

export function computeInvoiceHashHex(xml: string): string {
  return createHash("sha256").update(canonicalizeXml(xml)).digest("hex");
}
