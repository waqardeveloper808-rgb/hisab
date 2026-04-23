export type KsaAddressInput = {
  buildingNumber?: string;
  streetName?: string;
  district?: string;
  city?: string;
  postalCode?: string;
  secondaryNumber?: string;
  country?: string;
};

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeVatNumber(value: string) {
  return digitsOnly(value.trim());
}

export function isValidKsaVatNumber(value: string) {
  const normalized = normalizeVatNumber(value);
  return /^3\d{13}3$/.test(normalized);
}

export function normalizeSaudiPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  let digits = digitsOnly(trimmed);
  if (digits.startsWith("00966")) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("966") && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `+966${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `+966${digits}`;
  }
  return trimmed.startsWith("+") ? `+${digits}` : trimmed;
}

export function isValidSaudiPhone(value: string) {
  return /^\+966\d{9}$/.test(normalizeSaudiPhone(value));
}

export function normalizeCountryCode(value: string) {
  const normalized = value.trim().toUpperCase();
  if (["SAUDI ARABIA", "KSA", "SA"].includes(normalized)) {
    return "SA";
  }
  return normalized;
}

export function validateSaudiNationalAddress(address: KsaAddressInput) {
  const errors: Record<string, string> = {};

  if (!/^\d{4}$/.test(digitsOnly(address.buildingNumber ?? ""))) {
    errors.buildingNumber = "Building number must contain exactly 4 digits.";
  }
  if (!(address.streetName ?? "").trim()) {
    errors.streetName = "Street name is required.";
  }
  if (!(address.district ?? "").trim()) {
    errors.district = "District is required.";
  }
  if (!(address.city ?? "").trim()) {
    errors.city = "City is required.";
  }
  if (!/^\d{5}$/.test(digitsOnly(address.postalCode ?? ""))) {
    errors.postalCode = "Postal code must contain exactly 5 digits.";
  }
  if (!/^\d{4}$/.test(digitsOnly(address.secondaryNumber ?? ""))) {
    errors.secondaryNumber = "Secondary number must contain exactly 4 digits.";
  }
  if (normalizeCountryCode(address.country ?? "") !== "SA") {
    errors.country = "Country must be SA for Saudi master data.";
  }

  return errors;
}