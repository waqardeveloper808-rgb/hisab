import { describe, expect, it } from "vitest";
import {
  applyTransition,
  buildInvoiceHashChain,
  buildSubmissionReadyPayload,
  canTransition,
  validateUblXmlStructure,
} from "@/lib/zatca-engine";

describe("zatca-engine", () => {
  it("supports the ready and submitted transition path", () => {
    expect(canTransition("issued", "ready_submit")).toBe(true);
    expect(applyTransition("issued", "ready_submit")).toBe("ready");
    expect(applyTransition("ready", "submit")).toBe("submitted");
  });

  it("builds a linked invoice hash chain", () => {
    const hash = buildInvoiceHashChain({
      uuid: "uuid-1",
      issueDate: "2026-04-18",
      issueTime: "12:00:00",
      invoiceTotal: "115.00",
      vatTotal: "15.00",
      sellerVatNumber: "300000000000003",
      previousInvoiceHash: "prev-hash",
    });

    expect(hash.previousHash).toBe("prev-hash");
    expect(hash.chainStatus).toBe("linked");
    expect(hash.currentHash).toMatch(/[0-9a-f]+/);
  });

  it("builds a submission-ready payload with valid XML scaffold", () => {
    const payload = buildSubmissionReadyPayload({
      xmlInput: {
        uuid: "uuid-1",
        invoiceNumber: "INV-001",
        issueDate: "2026-04-18",
        issueTime: "12:00:00",
        invoiceTypeCode: "388",
        currencyCode: "SAR",
        seller: {
          name: "Gulf Hisab",
          vatNumber: "300000000000003",
          address: { countryCode: "SA" },
        },
        buyer: {
          name: "Customer A",
          address: { countryCode: "SA" },
        },
        lines: [{ id: "1", description: "Line", quantity: 1, unitPrice: 100, taxableAmount: 100, taxAmount: 15, taxRate: 15 }],
        taxableTotal: 100,
        taxTotal: 15,
        grandTotal: 115,
      },
      hashInput: {
        uuid: "uuid-1",
        issueDate: "2026-04-18",
        issueTime: "12:00:00",
        invoiceTotal: "115.00",
        vatTotal: "15.00",
        sellerVatNumber: "300000000000003",
      },
      signingConfig: {
        certificatePem: "cert",
        privateKeyPem: "key",
        certificateSerialNumber: "cert-1",
        issuerName: "issuer",
      },
      qrPayloadInput: {
        sellerName: "Gulf Hisab",
        vatNumber: "300000000000003",
        timestamp: "2026-04-18T12:00:00",
        invoiceTotal: "115.00",
        vatTotal: "15.00",
      },
      mode: "reporting",
    });

    expect(payload.submissionEnvelope.status).toBe("ready");
    expect(validateUblXmlStructure(payload.xml).valid).toBe(true);
  });
});