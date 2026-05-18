/** Phase 2 planning only; must not gate KSA Phase 1 completion. */
export const franceReadinessPhase = "Phase 2 — planned (metadata-only until executed)" as const;

export const franceReadinessRequirements = [
  "Separate France document, tax, compliance, and reporting rule packs from KSA business logic.",
  "France must own TVA handling, invoice legal output, and PEPPOL-oriented compliance boundaries.",
  "France must have a dedicated proof suite rather than inheriting KSA workflow evidence.",
  "Public product, onboarding, and company profile requirements must be country-product specific.",
];