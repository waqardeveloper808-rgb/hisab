/**
 * Canonical module groupings for the System Monitor module map (main categories).
 * Single source for backend state builders and UI.
 */
export const MONITOR_GROUP_DEFS = [
  {
    id: "core-system",
    name: "Core System",
    modules: ["identity-workspace", "company-profile", "contacts-counterparties", "product-item-service", "document-engine"] as const,
  },
  {
    id: "finance-engines",
    name: "Finance Engines",
    modules: ["accounting-engine", "inventory-engine", "tax-vat-engine", "reports-engine", "import-engine"] as const,
  },
  {
    id: "platform-layers",
    name: "Platform Layers",
    modules: [
      "communication-engine",
      "template-engine",
      "workflow-intelligence",
      "compliance-layer",
      "proof-layer",
      "ui-ux-shell",
      "country-service-architecture",
      "end-to-end-workflow-proof",
    ] as const,
  },
] as const;

export type MonitorGroupId = (typeof MONITOR_GROUP_DEFS)[number]["id"];

export function monitorGroupModuleIds(groupId: string): readonly string[] | null {
  const g = MONITOR_GROUP_DEFS.find((row) => row.id === groupId);
  return g ? g.modules : null;
}
