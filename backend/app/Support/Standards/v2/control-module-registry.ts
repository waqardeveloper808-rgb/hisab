export const controlModuleRegistry = [
  {
    "code": "UX",
    "name": "User Experience",
    "kind": "primary",
    "description": "Cross-workspace experience and navigation controls.",
    "legacyPrefixes": [
      "UIX"
    ]
  },
  {
    "code": "IVC",
    "name": "Invoice Control",
    "kind": "primary",
    "description": "Invoice document integrity and compliance controls.",
    "legacyPrefixes": [
      "DOC"
    ]
  },
  {
    "code": "ACC",
    "name": "Accounting Control",
    "kind": "primary",
    "description": "Accounting integrity and financial posting controls.",
    "legacyPrefixes": [
      "ACC"
    ]
  },
  {
    "code": "INV",
    "name": "Inventory Control",
    "kind": "primary",
    "description": "Inventory movement, costing, and valuation controls.",
    "legacyPrefixes": [
      "INV"
    ]
  },
  {
    "code": "TAX",
    "name": "VAT / Tax Control",
    "kind": "primary",
    "description": "VAT, tax, and e-invoicing compliance controls.",
    "legacyPrefixes": [
      "VAT"
    ]
  },
  {
    "code": "AUD",
    "name": "Audit Control",
    "kind": "primary",
    "description": "Audit traceability and review controls.",
    "legacyPrefixes": []
  },
  {
    "code": "USR",
    "name": "User Workspace Control",
    "kind": "primary",
    "description": "User workspace flow and usability controls.",
    "legacyPrefixes": []
  },
  {
    "code": "ADM",
    "name": "Admin Workspace Control",
    "kind": "primary",
    "description": "Admin workspace governance and review controls.",
    "legacyPrefixes": []
  },
  {
    "code": "AST",
    "name": "Assistant Workspace Control",
    "kind": "primary",
    "description": "Assistant workspace control surfaces.",
    "legacyPrefixes": []
  },
  {
    "code": "ACP",
    "name": "Accountant / Partner Workspace Control",
    "kind": "primary",
    "description": "Partner and accountant workspace controls.",
    "legacyPrefixes": []
  },
  {
    "code": "CPE",
    "name": "Control Point Engine",
    "kind": "supporting",
    "description": "Governance engine for control module registration, inventory, validation, and onboarding enforcement.",
    "legacyPrefixes": []
  },
  {
    "code": "DOC",
    "name": "Document Engine Control",
    "kind": "supporting",
    "description": "Document engine support controls outside invoice-specific migration scope.",
    "legacyPrefixes": []
  },
  {
    "code": "COM",
    "name": "Communication Control",
    "kind": "supporting",
    "description": "Communication orchestration, delivery, retries, templates, and timeline controls.",
    "legacyPrefixes": [
      "COM"
    ]
  },
  {
    "code": "TMP",
    "name": "Template Engine Control",
    "kind": "supporting",
    "description": "Template engine composition and rendering controls.",
    "legacyPrefixes": [
      "TMP"
    ]
  },
  {
    "code": "VAL",
    "name": "Validation Control",
    "kind": "supporting",
    "description": "Validation and master data quality controls.",
    "legacyPrefixes": [
      "VAL"
    ]
  },
  {
    "code": "SEC",
    "name": "Security Control",
    "kind": "supporting",
    "description": "Security enforcement controls outside audit review governance.",
    "legacyPrefixes": [
      "SEC"
    ]
  },
  {
    "code": "BRD",
    "name": "Branding Control",
    "kind": "supporting",
    "description": "Branding and identity layout controls.",
    "legacyPrefixes": [
      "BRD"
    ]
  },
  {
    "code": "XMD",
    "name": "Cross-Module Dependency Control",
    "kind": "supporting",
    "description": "Cross-module dependency and integrity controls.",
    "legacyPrefixes": [
      "XMD"
    ]
  },
  {
    "code": "FRM",
    "name": "Forms and Registers Control",
    "kind": "supporting",
    "description": "Forms and registers controls retained as a support module.",
    "legacyPrefixes": [
      "FRM"
    ]
  }
] as const;

export type ControlModuleCode = typeof controlModuleRegistry[number]["code"];

export const controlModuleRegistryMap = new Map(controlModuleRegistry.map((module) => [module.code, module]));
