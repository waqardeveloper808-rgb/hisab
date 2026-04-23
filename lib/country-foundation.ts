export type CountryCode = "SA" | "AE" | "QA" | "KW" | "BH" | "OM" | "FR";

export type CountryProfile = {
  code: CountryCode;
  name: string;
  currency: string;
  taxSystem: string;
  standardVatRate: number;
  eInvoicingModel: "zatca" | "peppol" | "generic";
  requiresInvoiceHashChain: boolean;
  requiresDigitalSignature: boolean;
  locale: string;
};

const COUNTRY_PROFILES: Record<CountryCode, CountryProfile> = {
  SA: {
    code: "SA",
    name: "Saudi Arabia",
    currency: "SAR",
    taxSystem: "VAT",
    standardVatRate: 15,
    eInvoicingModel: "zatca",
    requiresInvoiceHashChain: true,
    requiresDigitalSignature: true,
    locale: "en-SA",
  },
  AE: {
    code: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    taxSystem: "VAT",
    standardVatRate: 5,
    eInvoicingModel: "generic",
    requiresInvoiceHashChain: false,
    requiresDigitalSignature: false,
    locale: "en-AE",
  },
  QA: {
    code: "QA",
    name: "Qatar",
    currency: "QAR",
    taxSystem: "VAT-ready",
    standardVatRate: 0,
    eInvoicingModel: "generic",
    requiresInvoiceHashChain: false,
    requiresDigitalSignature: false,
    locale: "en-QA",
  },
  KW: {
    code: "KW",
    name: "Kuwait",
    currency: "KWD",
    taxSystem: "VAT-ready",
    standardVatRate: 0,
    eInvoicingModel: "generic",
    requiresInvoiceHashChain: false,
    requiresDigitalSignature: false,
    locale: "en-KW",
  },
  BH: {
    code: "BH",
    name: "Bahrain",
    currency: "BHD",
    taxSystem: "VAT",
    standardVatRate: 10,
    eInvoicingModel: "generic",
    requiresInvoiceHashChain: false,
    requiresDigitalSignature: false,
    locale: "en-BH",
  },
  OM: {
    code: "OM",
    name: "Oman",
    currency: "OMR",
    taxSystem: "VAT",
    standardVatRate: 5,
    eInvoicingModel: "generic",
    requiresInvoiceHashChain: false,
    requiresDigitalSignature: false,
    locale: "en-OM",
  },
  FR: {
    code: "FR",
    name: "France",
    currency: "EUR",
    taxSystem: "TVA",
    standardVatRate: 20,
    eInvoicingModel: "peppol",
    requiresInvoiceHashChain: false,
    requiresDigitalSignature: true,
    locale: "fr-FR",
  },
};

export type MultiCountryReadiness = {
  sellerCountry: CountryProfile;
  buyerCountry: CountryProfile;
  documentCurrency: string;
  crossBorder: boolean;
  warnings: string[];
  requiredCapabilities: string[];
};

export function listSupportedCountryProfiles() {
  return Object.values(COUNTRY_PROFILES);
}

export function resolveCountryProfile(countryCode?: string | null): CountryProfile {
  const normalized = (countryCode ?? "SA").trim().toUpperCase() as CountryCode;
  return COUNTRY_PROFILES[normalized] ?? COUNTRY_PROFILES.SA;
}

export function assessMultiCountryReadiness(input: {
  sellerCountryCode?: string | null;
  buyerCountryCode?: string | null;
  currency?: string | null;
}): MultiCountryReadiness {
  const sellerCountry = resolveCountryProfile(input.sellerCountryCode);
  const buyerCountry = resolveCountryProfile(input.buyerCountryCode ?? input.sellerCountryCode);
  const documentCurrency = (input.currency ?? sellerCountry.currency).trim().toUpperCase();
  const crossBorder = sellerCountry.code !== buyerCountry.code;
  const warnings: string[] = [];
  const requiredCapabilities = [
    `tax:${sellerCountry.taxSystem}`,
    `currency:${documentCurrency}`,
    `compliance:${sellerCountry.eInvoicingModel}`,
  ];

  if (documentCurrency !== sellerCountry.currency) {
    warnings.push(`Document currency ${documentCurrency} differs from seller base currency ${sellerCountry.currency}.`);
    requiredCapabilities.push("multi-currency-revaluation");
  }

  if (crossBorder) {
    warnings.push(`Cross-border flow detected between ${sellerCountry.code} and ${buyerCountry.code}.`);
    requiredCapabilities.push("cross-border-tax-rules");
    requiredCapabilities.push("country-specific-buyer-validation");
  }

  if (sellerCountry.requiresInvoiceHashChain) {
    requiredCapabilities.push("invoice-hash-chain");
  }

  if (sellerCountry.requiresDigitalSignature) {
    requiredCapabilities.push("digital-signature-readiness");
  }

  return {
    sellerCountry,
    buyerCountry,
    documentCurrency,
    crossBorder,
    warnings,
    requiredCapabilities,
  };
}