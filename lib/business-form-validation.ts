export type FieldErrors = Record<string, string>;

import { vatGuard } from "@/lib/ai-action-engine";
import {
  digitsOnly,
  isValidKsaVatNumber,
  isValidSaudiPhone,
  normalizeCountryCode,
  validateSaudiNationalAddress,
} from "@/lib/ksa-business-validation";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function isValidPhone(value: string) {
  return isValidSaudiPhone(value);
}

function isValidVatNumber(value: string) {
  return isValidKsaVatNumber(value);
}

function isValidCrNumber(value: string) {
  return /^\d{10}$/.test(digitsOnly(value));
}

function isValidPostalCode(value: string) {
  return /^\d{5}$/.test(digitsOnly(value));
}

function isValidFax(value: string) {
  const digits = digitsOnly(value);
  return digits.length >= 9 && digits.length <= 15;
}

function isValidPoBox(value: string) {
  return /^\d{4}$/.test(digitsOnly(value));
}

function hasStructuredAddress(parts: string[]) {
  return parts.every((part) => part.trim().length >= 2);
}

function setError(errors: FieldErrors, key: string, message: string) {
  errors[key] = message;
}

export function validateCustomerDraft(draft: {
  displayName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  vatNumber: string;
  street: string;
  buildingNumber: string;
  district: string;
  postalCode: string;
  secondaryNumber: string;
}) {
  const errors: FieldErrors = {};

  if (!draft.displayName.trim()) {
    setError(errors, "displayName", "Enter the customer name before saving.");
  }

  if (!draft.email.trim()) {
    setError(errors, "email", "Enter an email so invoices and reminders have a delivery address.");
  } else if (!isValidEmail(draft.email)) {
    setError(errors, "email", "Use a valid email address such as name@company.sa.");
  }

  if (!draft.phone.trim()) {
    setError(errors, "phone", "Enter a phone number so the contact can be reached.");
  } else if (!isValidPhone(draft.phone)) {
    setError(errors, "phone", "Use a phone number with 9 to 15 digits, for example +966512345678.");
  }

  if (!draft.vatNumber.trim()) {
    setError(errors, "vatNumber", "Enter the VAT number for invoice-ready compliance.");
  } else if (!isValidVatNumber(draft.vatNumber)) {
    setError(errors, "vatNumber", "VAT number must be 15 digits, start with 3, end with 3, and contain numbers only.");
  }

  vatGuard(draft.vatNumber).forEach((action) => {
    if (action.type === "block") {
      setError(errors, action.field, action.message);
    }
  });

  if (!draft.street.trim()) {
    setError(errors, "street", "Enter the street so the address stays document-ready.");
  }

  if (!draft.city.trim()) {
    setError(errors, "city", "Enter the city so the customer address is complete.");
  }

  if (!draft.country.trim()) {
    setError(errors, "country", "Enter the country so the address is complete.");
  }

  Object.assign(errors, validateSaudiNationalAddress({
    buildingNumber: draft.buildingNumber,
    streetName: draft.street,
    district: draft.district,
    city: draft.city,
    postalCode: draft.postalCode,
    secondaryNumber: draft.secondaryNumber,
    country: normalizeCountryCode(draft.country),
  }));

  if (!hasStructuredAddress([draft.street, draft.city, draft.country])) {
    setError(errors, "address", "Complete street, city, and country so the address is structured before saving.");
  }

  return errors;
}

export function validateVendorDraft(draft: {
  displayName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  vatNumber: string;
  street: string;
  buildingNumber: string;
  district: string;
  postalCode: string;
  secondaryNumber: string;
}) {
  const errors: FieldErrors = {};

  if (!draft.displayName.trim()) {
    setError(errors, "displayName", "Enter the vendor name before saving.");
  }

  if (!draft.email.trim()) {
    setError(errors, "email", "Enter the vendor email so bill and payment communication has a target.");
  } else if (!isValidEmail(draft.email)) {
    setError(errors, "email", "Use a valid email address such as supplier@company.sa.");
  }

  if (!draft.phone.trim()) {
    setError(errors, "phone", "Enter the vendor phone number before saving.");
  } else if (!isValidPhone(draft.phone)) {
    setError(errors, "phone", "Use a Saudi phone number such as +966512345678.");
  }

  if (!draft.vatNumber.trim()) {
    setError(errors, "vatNumber", "Enter the supplier VAT number before saving.");
  } else if (!isValidVatNumber(draft.vatNumber)) {
    setError(errors, "vatNumber", "VAT number must be 15 digits, start with 3, end with 3, and contain numbers only.");
  }

  vatGuard(draft.vatNumber).forEach((action) => {
    if (action.type === "block") {
      setError(errors, action.field, action.message);
    }
  });

  if (!draft.city.trim()) {
    setError(errors, "city", "Enter the vendor city so the supplier profile is complete.");
  }

  Object.assign(errors, validateSaudiNationalAddress({
    buildingNumber: draft.buildingNumber,
    streetName: draft.street,
    district: draft.district,
    city: draft.city,
    postalCode: draft.postalCode,
    secondaryNumber: draft.secondaryNumber,
    country: normalizeCountryCode(draft.country),
  }));

  return errors;
}

export function validateCompanyProfile(company: {
  taxNumber: string;
  registrationNumber: string;
  phone: string;
  email: string;
  fax: string;
  addressStreet: string;
  addressCity: string;
  addressPostalCode: string;
  addressAdditionalNumber: string;
  addressCountry: string;
  shortAddress: string;
}) {
  const errors: FieldErrors = {};

  if (!company.taxNumber.trim()) {
    setError(errors, "taxNumber", "Enter the VAT number before saving settings.");
  } else if (!isValidVatNumber(company.taxNumber)) {
    setError(errors, "taxNumber", "VAT number must be 15 digits, start with 3, end with 3, and contain numbers only.");
  }

  vatGuard(company.taxNumber, "taxNumber").forEach((action) => {
    if (action.type === "block") {
      setError(errors, action.field, action.message);
    }
  });

  if (!company.registrationNumber.trim()) {
    setError(errors, "registrationNumber", "Enter the CR number before saving settings.");
  } else if (!isValidCrNumber(company.registrationNumber)) {
    setError(errors, "registrationNumber", "CR number must contain exactly 10 digits.");
  }

  if (!company.phone.trim()) {
    setError(errors, "phone", "Enter the company phone number before saving settings.");
  } else if (!isValidPhone(company.phone)) {
    setError(errors, "phone", "Use a Saudi phone number such as +966112345678.");
  }

  if (!company.email.trim()) {
    setError(errors, "email", "Enter the company email before saving settings.");
  } else if (!isValidEmail(company.email)) {
    setError(errors, "email", "Use a valid email address such as finance@company.sa.");
  }

  if (company.fax.trim() && !isValidFax(company.fax)) {
    setError(errors, "fax", "Use a fax number with 9 to 15 digits when fax is provided.");
  }

  if (!company.addressPostalCode.trim()) {
    setError(errors, "addressPostalCode", "Enter the postal code before saving settings.");
  } else if (!isValidPostalCode(company.addressPostalCode)) {
    setError(errors, "addressPostalCode", "Postal code must contain exactly 5 digits.");
  }

  if (!company.addressAdditionalNumber.trim()) {
    setError(errors, "addressAdditionalNumber", "Enter the secondary number before saving settings.");
  } else if (!isValidPoBox(company.addressAdditionalNumber)) {
    setError(errors, "addressAdditionalNumber", "Secondary number must contain exactly 4 digits.");
  }

  if (!/^\d{4}$/.test(digitsOnly(company.addressBuildingNumber))) {
    setError(errors, "addressBuildingNumber", "Building number must contain exactly 4 digits.");
  }

  if (!company.addressArea.trim()) {
    setError(errors, "addressArea", "Enter the district before saving settings.");
  }

  if (normalizeCountryCode(company.addressCountry) !== "SA") {
    setError(errors, "addressCountry", "Use SA as the country code for the Saudi company profile.");
  }

  if (!hasStructuredAddress([company.addressStreet, company.addressCity, company.addressCountry])) {
    setError(errors, "address", "Complete street, city, and country so the company address is structured before saving.");
  }

  if (!company.shortAddress.trim()) {
    setError(errors, "shortAddress", "Enter the short address so document headers have a compact location reference.");
  }

  return errors;
}