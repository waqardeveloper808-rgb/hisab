export const sharedPlatformRules = [
  "Authentication, workspace shell, API transport, and tenant scoping may remain shared across country products.",
  "Business rules are country-owned by default and must not be shared unless explicitly proven generic.",
  "Preview or demo data may exist only when the client explicitly requests preview (?mode=preview or X-Workspace-Mode: preview) or the session is an unauthenticated guest using that explicit preview contract.",
  "Preview or demo stores must not be served as authenticated production responses and must not be counted as production evidence or KSA Phase 1 completion.",
  "The control system must report shared infrastructure separately from country-product completion.",
];