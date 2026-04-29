/**
 * KSA default VAT / tax rate catalog (Wafeq-style catalog for UI; backend may override).
 * Status: static reference data — not the ledger source of truth.
 */

export type KsaTaxRateType = "sales" | "purchases" | "reverse" | "out_of_scope" | "customs";

export type KsaTaxRate = {
  id: string;
  nameEn: string;
  nameAr: string;
  ratePercent: number;
  type: KsaTaxRateType;
  linkedVatAccountCodeHint: string;
  reportingBucket: "output" | "input" | "none" | "customs";
  isActive: boolean;
};

export const KSA_VAT_TAX_RATES: KsaTaxRate[] = [
  { id: "oos", nameEn: "Out of Scope", nameAr: "خارج النطاق", ratePercent: 0, type: "out_of_scope", linkedVatAccountCodeHint: "—", reportingBucket: "none", isActive: true },
  { id: "rc", nameEn: "Reverse Charge", nameAr: "التحويل الضريبي", ratePercent: 15, type: "reverse", linkedVatAccountCodeHint: "130/220", reportingBucket: "input", isActive: true },
  { id: "ex-p", nameEn: "Exempt Purchases", nameAr: "مشتريات معفاة", ratePercent: 0, type: "purchases", linkedVatAccountCodeHint: "130", reportingBucket: "input", isActive: true },
  { id: "zr-p", nameEn: "Zero-rated Purchases", nameAr: "مشتريات بنسبة صفر", ratePercent: 0, type: "purchases", linkedVatAccountCodeHint: "130", reportingBucket: "input", isActive: true },
  { id: "vat-c", nameEn: "VAT at Customs", nameAr: "ضريبة في الجمرك", ratePercent: 15, type: "customs", linkedVatAccountCodeHint: "130", reportingBucket: "customs", isActive: true },
  { id: "vp", nameEn: "VAT on Purchases", nameAr: "ضريبة على المشتريات", ratePercent: 15, type: "purchases", linkedVatAccountCodeHint: "130", reportingBucket: "input", isActive: true },
  { id: "ex-s", nameEn: "Exempt Sales", nameAr: "مبيعات معفاة", ratePercent: 0, type: "sales", linkedVatAccountCodeHint: "220", reportingBucket: "output", isActive: true },
  { id: "zr-e", nameEn: "Zero-Rated Exports", nameAr: "صادرات معفاة", ratePercent: 0, type: "sales", linkedVatAccountCodeHint: "220", reportingBucket: "output", isActive: true },
  { id: "zr-d", nameEn: "Zero-Rated Domestic Sales", nameAr: "مبيعات محلية معفاة", ratePercent: 0, type: "sales", linkedVatAccountCodeHint: "220", reportingBucket: "output", isActive: true },
  { id: "vs", nameEn: "VAT on Sales (standard)", nameAr: "ضريبة على المبيعات ١٥٪", ratePercent: 15, type: "sales", linkedVatAccountCodeHint: "220", reportingBucket: "output", isActive: true },
];
