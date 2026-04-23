export type HelpArticle = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  sections: Array<{
    heading: string;
    body: string[];
  }>;
};

export const helpArticles: HelpArticle[] = [
  {
    slug: "first-invoice",
    category: "Sales",
    title: "Create the first invoice with templates and dynamic fields",
    summary: "Start the invoice flow, pick the customer, assign the document type, and understand what changes the final rendered output.",
    sections: [
      {
        heading: "Start with the customer",
        body: [
          "Use the customer picker first. If the customer does not exist yet, add them inline without leaving the editor.",
          "The invoice draft stays intact while the new customer is saved.",
        ],
      },
      {
        heading: "Choose the right document type and template",
        body: [
          "Document type controls which template set and custom fields are relevant for the invoice.",
          "Templates control branding, header and footer layout, logo placement, VAT sections, totals styling, and the final PDF output.",
        ],
      },
      {
        heading: "Use dynamic fields deliberately",
        body: [
          "Reference, project, and PO fields can be shown or hidden centrally from the template studio.",
          "Active document-level fields appear in the editor and flow into the live preview and PDF output.",
        ],
      },
    ],
  },
  {
    slug: "first-purchase",
    category: "Purchases",
    title: "Capture the first bill with purchase intelligence",
    summary: "Post a bill or purchase invoice with purpose, category, cost center, and immediate payment context intact.",
    sections: [
      {
        heading: "Capture supplier and draft data together",
        body: [
          "Choose or create the supplier inline, then continue the same bill draft without losing any work.",
          "Draft save and reopen preserve template choice, cost center, notes, and purchase context.",
        ],
      },
      {
        heading: "Use purchase context for reporting",
        body: [
          "Type, purpose, category, and cost center become part of downstream purchase analysis and expense reporting.",
          "Use document and line custom fields when procurement teams need more operational detail.",
        ],
      },
      {
        heading: "Handle payment intentionally",
        body: [
          "Record payment immediately only if the bill is settled now.",
          "Leave payment blank when the document should remain open for later settlement and aging review.",
        ],
      },
    ],
  },
  {
    slug: "vat-and-reporting",
    category: "Control",
    title: "Review VAT, dashboards, and business intelligence outputs",
    summary: "Use the reporting layer for statutory review and the BI layer for customer, product, and expense insight.",
    sections: [
      {
        heading: "Statutory review",
        body: [
          "Use VAT summary, VAT detail, trial balance, profit and loss, and balance sheet for core accounting review.",
          "Use the audit trail when you need to explain exactly what changed and when.",
        ],
      },
      {
        heading: "Business intelligence",
        body: [
          "Use profit by customer to see which customer relationships are actually creating margin.",
          "Use profit by product and expense breakdown to find the operational drivers behind your margins.",
        ],
      },
    ],
  },
];

export const faqGroups = [
  {
    category: "Sales",
    questions: [
      {
        question: "How do I create an invoice without leaving the page to add a customer?",
        answer: "Use the customer picker in the invoice editor. If the customer is missing, select the inline create action, save the customer, and continue the same draft.",
      },
      {
        question: "Where do I switch templates before sending the invoice?",
        answer: "Use the template selector in the editor. The matching document center preview can also switch templates live before export or sending.",
      },
    ],
  },
  {
    category: "Purchases",
    questions: [
      {
        question: "How do I enter a bill and keep purchase context for reporting?",
        answer: "Capture purchase type, purpose, category, cost center, and any document custom fields in the bill editor. These values persist with the draft and appear again when reopened.",
      },
      {
        question: "Where do supplier payments and bill balances appear?",
        answer: "Use the purchase document center for the rendered register view and the reporting area for aging and expense analysis.",
      },
    ],
  },
  {
    category: "Control",
    questions: [
      {
        question: "Where do I review VAT before filing?",
        answer: "Open the reports area and use VAT summary and VAT detail for the filing review flow.",
      },
      {
        question: "Where do I see profit by customer, product, and expense breakdown?",
        answer: "Use the dashboard intelligence cards for the headline view, then open the reports screen for the full BI breakdown tables.",
      },
    ],
  },
];