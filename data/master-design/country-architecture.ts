/**
 * Canonical Phase 1 vs future-country truth for Master Design and System Monitor.
 * KSA is the active Phase 1 product; France and other locales are Phase 2 metadata until executed.
 */
export const phase1CountryArchitecture = {
  activePhase1Product: "KSA" as const,
  phase1Label: "Phase 1 (active)",
  ksaServiceBoundary: [
    "KSA VAT logic, summaries, and detail datasets",
    "KSA sales and purchase document lifecycle and registers",
    "KSA ZATCA / e-invoicing foundation and compliance boundary",
    "KSA company profile and legal identity validation for outputs",
  ],
  futureCountryReadiness: [
    {
      id: "france",
      displayName: "France",
      phase: "Phase 2 — planned",
      evaluationScope: "metadata-only" as const,
      gatesKsaPhase1: false as const,
      notes: "TVA, PEPPOL-oriented packs, and France proof suites are out of KSA Phase 1 scope.",
    },
    {
      id: "future-country-slot",
      displayName: "Future country slots",
      phase: "Phase 2+ — planned",
      evaluationScope: "metadata-only" as const,
      gatesKsaPhase1: false as const,
      notes: "Reserved product slots; no execution requirement for KSA Phase 1.",
    },
  ],
} as const;

export type Phase1CountryArchitecture = typeof phase1CountryArchitecture;
