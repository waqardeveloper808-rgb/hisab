/** ZATCA Phase 1 TLV → base64 (no QR raster). Shared by `buildPhase1Qr` and document templates. */

function tlv(tag: number, value: string): Uint8Array {
  const bytes = new TextEncoder().encode(value);
  if (bytes.length > 255) {
    throw new Error(`ZATCA TLV tag ${tag} exceeds 255 bytes (got ${bytes.length})`);
  }
  const out = new Uint8Array(bytes.length + 2);
  out[0] = tag;
  out[1] = bytes.length;
  out.set(bytes, 2);
  return out;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function tlvBytesPhase1(parts: {
  sellerName: string;
  vatNumber: string;
  timestampIso: string;
  invoiceTotal: string;
  vatAmount: string;
}): Uint8Array {
  return concatBytes([
    tlv(1, parts.sellerName),
    tlv(2, parts.vatNumber),
    tlv(3, parts.timestampIso),
    tlv(4, parts.invoiceTotal),
    tlv(5, parts.vatAmount),
  ]);
}

function bytesToBase64(bytes: Uint8Array): string {
  const BufferCtor = (globalThis as { Buffer?: { from: (b: Uint8Array) => { toString: (enc: string) => string } } }).Buffer;
  if (BufferCtor) return BufferCtor.from(bytes).toString("base64");
  if (typeof btoa === "function") {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  throw new Error("No base64 encoder available");
}

export function phase1TlvUint8ArrayToBase64(bytes: Uint8Array): string {
  return bytesToBase64(bytes);
}

export type Phase1TlvNormalizedFields = {
  sellerName: string;
  vatNumber: string;
  timestampIsoUtc: string;
  invoiceTotal: string;
  vatAmount: string;
};

export function normalizePhase1Money(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(2);
}

/** Full simplified-invoice TLV as base64 (content of QR, before rasterization). */
export function encodePhase1TlvBase64(fields: Phase1TlvNormalizedFields): string {
  const bytes = tlvBytesPhase1({
    sellerName: fields.sellerName.trim(),
    vatNumber: fields.vatNumber.trim(),
    timestampIso: fields.timestampIsoUtc,
    invoiceTotal: fields.invoiceTotal,
    vatAmount: fields.vatAmount,
  });
  return phase1TlvUint8ArrayToBase64(bytes);
}
