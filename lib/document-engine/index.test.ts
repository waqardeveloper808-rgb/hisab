import { describe, expect, it } from "vitest";

import { buildDocumentHtml, buildInvoiceRenderModel } from "@/lib/document-engine/index";

function createModel(type: string) {
  return buildInvoiceRenderModel({
    company: {
      legalName: "Hisabix LLC",
      tradeName: "Hisabix",
      englishName: "Hisabix",
      arabicName: "جلف حساب",
      taxNumber: "300000000000003",
      registrationNumber: "1010101010",
      email: "finance@hisabix.sa",
      phone: "+966500000000",
      shortAddress: "Riyadh, Saudi Arabia",
      addressStreet: "King Fahd Road",
      addressArea: "Olaya",
      addressCity: "Riyadh",
      addressPostalCode: "12211",
      addressAdditionalNumber: "1234",
      addressCountry: "Saudi Arabia",
      baseCurrency: "SAR",
      logoUrl: "https://example.com/logo.png",
    },
    assets: [],
    document: {
      id: 1,
      type,
      documentNumber: "DOC-001",
      issueDate: "2026-04-22",
      dueDate: "2026-04-29",
      supplyDate: "2026-04-22",
      taxableTotal: 100,
      taxTotal: type === "delivery_note" ? 0 : 15,
      grandTotal: type === "delivery_note" ? 100 : 115,
      customFields: { source_invoice_number: "INV-2026-1101", reference: "QUO-2026-1401" },
      lines: [
        {
          id: 10,
          description: "Monthly bookkeeping",
          quantity: 1,
          unitPrice: 100,
          grossAmount: 100,
          metadata: { custom_fields: { description_ar: "خدمات مسك الدفاتر الشهرية" } },
        },
      ],
    },
    contact: {
      displayName: "Desert Retail Co.",
      displayNameAr: "شركة صحراء للتجزئة",
      vatNumber: "301112223330003",
      phone: "+966511111111",
      billingAddress: {
        line1: "Prince Sultan Street, Jeddah",
        line1Ar: "شارع الأمير سلطان، جدة",
        city: "Jeddah",
      },
    },
  });
}

describe("document engine", () => {
  it("renders document-specific titles and labels for quotation", () => {
    const html = buildDocumentHtml(createModel("quotation"));

    expect(html).toContain("Quotation");
    expect(html).toContain("عرض سعر");
    expect(html).toContain("Quotation Number");
    expect(html).toContain('data-document-kind="quotation"');
    expect(html).toContain('data-doc-root="true"');
  });

  it("hides VAT column and VAT total for delivery note", () => {
    const html = buildDocumentHtml(createModel("delivery_note"));

    expect(html).toContain("Delivery Note");
    expect(html).not.toContain(">VAT</th>");
    expect(html).not.toContain("><span>VAT</span><strong>");
  });

  it("renders source invoice reference for credit note", () => {
    const html = buildDocumentHtml(createModel("credit_note"));

    expect(html).toContain("Credit Note");
    expect(html).toContain("Source Invoice");
    expect(html).toContain("INV-2026-1101");
  });
});