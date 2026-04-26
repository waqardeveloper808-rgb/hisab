export const productModules = [
  {
    slug: "invoice-creation",
    title: "Invoice Creation",
    shortDescription: "Create clean customer invoices in seconds with the right totals and invoice flow already in place.",
    benefit: "Move from draft to sent invoice without Excel templates or manual cleanup.",
    icon: "",
    features: [
      "Fast invoice flow",
      "Status visibility",
      "Customer-ready layouts",
    ],
  },
  {
    slug: "auto-vat",
    title: "Auto VAT",
    shortDescription: "VAT stays attached to each invoice and bill so totals are ready before filing time.",
    benefit: "Stop calculating VAT by hand or double-checking spreadsheet formulas.",
    icon: "",
    features: [
      "Automatic VAT totals",
      "Sales and purchase tax visibility",
      "Less manual review",
    ],
  },
  {
    slug: "zatca-compliance",
    title: "ZATCA Compliance",
    shortDescription: "Keep invoice output and compliance settings ready for Saudi invoicing expectations.",
    benefit: "Reduce penalty risk by using a product shaped around ZATCA-ready invoicing.",
    icon: "",
    features: [
      "Compliance-ready settings",
      "Clear invoice numbering",
      "Saudi-focused workflow",
    ],
  },
  {
    slug: "whatsapp-sending",
    title: "WhatsApp Sending",
    shortDescription: "Send invoice updates and customer-facing follow-up through a faster WhatsApp-ready workflow.",
    benefit: "Keep invoice delivery and customer follow-up inside the channel many Saudi businesses already use every day.",
    icon: "",
    features: [
      "Direct support access",
      "Share-ready workflow",
      "Faster customer follow-up",
    ],
  },
];

export const reportsModule = {
  title: "Reports",
  icon: "",
  shortDescription: "Review VAT, invoice status, payments, and business movement from one readable reporting home.",
  benefit: "Get the numbers you need without exporting data into separate files.",
  features: [
    "VAT reports",
    "Invoice and payment registers",
    "Business summaries",
  ],
};

export const trustSignals = [
  "Built for Saudi businesses",
  "ZATCA-ready invoice flow",
  "VAT reports without manual spreadsheets",
  "WhatsApp support built in",
];

export const businessStats = [
  { value: "45 days", label: "Free trial before you pay anything" },
  { value: "40 SAR", label: "Simple monthly paid plan when you are ready" },
  { value: "Saudi-ready", label: "ZATCA-focused invoicing and reporting flow" },
];

export const plans = [
  {
    name: "45-Day Trial",
    price: "0",
    description: "Try the full invoicing workflow before switching to the paid plan.",
    highlighted: false,
    bestFor: "Businesses moving away from Excel and manual VAT work",
    features: [
      "45 days of full access",
      "VAT reports and registers",
      "WhatsApp support and onboarding",
    ],
  },
  {
    name: "Plus Plan",
    price: "40",
    description: "A simple monthly plan for businesses that need regular invoicing and compliance support.",
    highlighted: true,
    bestFor: "Daily invoicing with VAT and reporting kept in one place",
    features: [
      "Unlimited invoicing flow",
      "VAT reports and business summaries",
      "Agent referral and WhatsApp support ready",
    ],
  },
];

export const comparisonRows = [
  {
    label: "Best fit",
    values: [
      "Evaluating the product",
      "Running invoicing every week",
    ],
  },
  {
    label: "Invoices",
    values: ["Full access during trial", "Ongoing monthly use"],
  },
  {
    label: "VAT reports",
    values: ["Included", "Included"],
  },
  {
    label: "WhatsApp support",
    values: ["Included", "Priority handling"],
  },
];

export const helpTopics = ["ZATCA", "Invoices", "VAT", "WhatsApp", "Free trial"];

export const helpCategories = [
  {
    title: "ZATCA-ready invoicing",
    description: "Start with invoice setup, numbering, and the basics of staying compliant without extra confusion.",
  },
  {
    title: "VAT",
    description: "See how VAT totals are prepared from invoices and bills before filing time.",
  },
  {
    title: "Support and onboarding",
    description: "Get answers fast through WhatsApp support, onboarding help, and sign-in guidance.",
  },
];

export const helpFaqs = [
  {
    title: "How do I start with ZATCA-compliant invoicing?",
    category: "ZATCA",
    description: "Create your account, confirm company settings, and issue your first invoice from the guided flow.",
  },
  {
    title: "How can I review VAT before filing?",
    category: "VAT",
    description: "Open the VAT reports area to review sales and purchase tax before you file.",
  },
  {
    title: "Can I get help on WhatsApp?",
    category: "WhatsApp",
    description: "Yes. Hisabix includes direct WhatsApp support for invoicing and setup questions.",
  },
  {
    title: "What happens after the 45-day trial?",
    category: "Free trial",
    description: "You move into the 40 SAR monthly Plus Plan when you want ongoing invoicing, VAT, and reporting access.",
  },
  {
    title: "How do I reset my password?",
    category: "Account",
    description: "Open account access steps and recover your sign-in details quickly.",
  },
];

export const supportEntries = [
  {
    title: "WhatsApp support",
    description: "Send a pre-filled WhatsApp message and get direct help with invoicing, VAT, and setup.",
  },
  {
    title: "Workspace help",
    description: "Use the in-product FAQ and AI assistant when the question is tied to a live invoice or report.",
  },
];