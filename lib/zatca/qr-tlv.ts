import QRCode from "qrcode";

export type ZatcaQrTlvInput = {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  invoiceTotal: string;
  vatTotal: string;
  invoiceHash?: string | null;
  publicKey?: string | null;
  certificateSignature?: string | null;
};

function encodeField(tag: number, value: string): Uint8Array {
  const bytes = new TextEncoder().encode(value);
  return new Uint8Array([tag, bytes.length, ...bytes]);
}

export function buildZatcaQrTlvBase64(input: ZatcaQrTlvInput): string {
  const fields = [
    encodeField(1, input.sellerName),
    encodeField(2, input.vatNumber),
    encodeField(3, input.timestamp),
    encodeField(4, input.invoiceTotal),
    encodeField(5, input.vatTotal),
  ];

  if (input.invoiceHash) {
    fields.push(encodeField(6, input.invoiceHash));
  }

  if (input.publicKey) {
    fields.push(encodeField(7, input.publicKey));
  }

  if (input.certificateSignature) {
    fields.push(encodeField(8, input.certificateSignature));
  }

  const totalLength = fields.reduce((sum, field) => sum + field.length, 0);
  const payload = new Uint8Array(totalLength);
  let offset = 0;
  for (const field of fields) {
    payload.set(field, offset);
    offset += field.length;
  }

  return Buffer.from(payload).toString("base64");
}

export function decodeZatcaQrTlvBase64(base64: string): Record<string, string> {
  const bytes = Buffer.from(base64, "base64");
  const decoded: Record<string, string> = {};
  let offset = 0;

  while (offset < bytes.length) {
    const tag = bytes[offset++];
    const length = bytes[offset++] ?? 0;
    const value = bytes.slice(offset, offset + length).toString("utf8");
    offset += length;
    decoded[String(tag)] = value;
  }

  return decoded;
}

export async function buildZatcaQrImageDataUrl(base64Payload: string): Promise<string> {
  return QRCode.toDataURL(base64Payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 256,
    color: { dark: "#0B0B0B", light: "#FFFFFF" },
  });
}
