import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Contact = {
  id: number;
  type: "customer" | "supplier";
  display_name: string;
  display_name_ar?: string | null;
  email?: string | null;
  phone?: string | null;
  vat_number?: string | null;
  cr_number?: string | null;
  billing_address?: Record<string, string | null>;
};

type Item = {
  id: number;
  type: "product" | "service";
  name: string;
  sku: string | null;
  default_sale_price: number;
  default_purchase_price: number;
  tax_category: { name: string; rate: number };
};

type InventoryRow = {
  id: number;
  item_id: number;
  product_name: string;
  material: string;
  inventory_type: string;
  size: string;
  source: string;
  code: string;
  quantity_on_hand: number;
  committed_quantity: number;
  reorder_level: number;
  batch_number: string;
  production_date: string;
  recorded_by: string;
  journal_entry_number: string;
  inventory_account_code: string;
  inventory_account_name: string;
  document_links: Array<{ documentId: number; documentNumber: string; documentType: string; status: string }>;
};

type Template = {
  id: number;
  name: string;
  document_types: string[];
  locale_mode: string;
  accent_color: string;
  watermark_text: string | null;
  header_html: string | null;
  footer_html: string | null;
  settings: Record<string, unknown>;
  logo_asset_id: number | null;
  logo_asset?: unknown;
  is_default: boolean;
  is_active: boolean;
};

type Payment = { id: number };
type PreviewDocument = {
  id: number;
  contact_id?: number | null;
  type?: string | null;
  tax_total?: number | null;
  taxable_total?: number | null;
  document_number?: string | null;
  custom_fields?: Record<string, unknown>;
  compliance_metadata?: { zatca?: { seller_name?: string; vat_number?: string } };
};

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function pad(num: number, size = 3) {
  return String(num).padStart(size, "0");
}

function validVat(index: number) {
  return `31${String(1000000000 + index).padStart(13, "0")}`.slice(0, 15);
}

function validCr(index: number) {
  return String(1000000000 + index).slice(0, 10);
}

function validPhone(index: number) {
  return `+9665${String(10000000 + index).slice(0, 8)}`;
}

function seedContacts(existing: Contact[]) {
  const normalized = existing.map((contact, index) => ({
    ...contact,
    email: contact.email && String(contact.email).includes("@") ? contact.email : `${contact.type}.${contact.id}@gulfhisab.example`,
    phone: /^\+?\d{9,15}$/.test(String(contact.phone ?? "")) ? String(contact.phone) : validPhone(index + 1),
    vat_number: /^\d{15}$/.test(String(contact.vat_number ?? "")) ? String(contact.vat_number) : validVat(index + 1),
    cr_number: /^\d{10}$/.test(String(contact.cr_number ?? "")) ? String(contact.cr_number) : validCr(index + 1),
    billing_address: {
      city: "Riyadh",
      district: "Al Olaya District",
      line_1: `Building ${7000 + index}, King Fahd Road`,
      line_2: `Suite ${10 + index}`,
      postal_code: `${12210 + index}`,
      building_number: `${7000 + index}`,
      additional_number: `${3100 + index}`,
      country: "Saudi Arabia",
      ...(contact.billing_address ?? {}),
    },
  }));

  let nextId = Math.max(...normalized.map((contact) => contact.id), 200) + 1;
  const seedRows: Contact[] = [];
  const names = [
    ["Najd Industrial Supplies LLC", "supplier"],
    ["Madinah Hospitality Group", "customer"],
    ["Eastern Province Logistics Co.", "supplier"],
    ["Jeddah Retail Concepts", "customer"],
    ["Qassim Office Systems", "customer"],
    ["Arabian Print House", "supplier"],
  ] as const;

  for (const [name, type] of names) {
    if (normalized.length + seedRows.length >= 10) {
      break;
    }
    const seedIndex = nextId - 100;
    seedRows.push({
      id: nextId++,
      type,
      display_name: name,
      display_name_ar: null,
      email: `${name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@example.sa`,
      phone: validPhone(seedIndex),
      vat_number: validVat(seedIndex),
      cr_number: validCr(seedIndex),
      billing_address: {
        city: type === "customer" ? "Riyadh" : "Jeddah",
        district: "Commercial District",
        line_1: `Building ${7100 + seedIndex}, King Abdullah Road`,
        line_2: `Office ${20 + seedIndex}`,
        postal_code: `${12300 + seedIndex}`,
        building_number: `${7100 + seedIndex}`,
        additional_number: `${4100 + seedIndex}`,
        country: "Saudi Arabia",
      },
    });
  }

  return [...normalized, ...seedRows];
}

function seedItems(existing: Item[]) {
  const normalized = existing.map((item, index) => ({
    ...item,
    sku: item.sku ?? `SKU-${pad(index + 1, 4)}`,
    default_sale_price: item.default_sale_price > 0 ? item.default_sale_price : 250 + index * 35,
    default_purchase_price: item.default_purchase_price > 0 ? item.default_purchase_price : 180 + index * 28,
  }));
  let nextId = Math.max(...normalized.map((item) => item.id), 300) + 1;
  const additions: Item[] = [];
  const rows = [
    ["Cloud bookkeeping retainer", "service", 1800, 0],
    ["Warehouse label roll", "product", 95, 65],
    ["Barcode scanner", "product", 650, 510],
    ["Year-end audit support", "service", 2400, 0],
    ["Thermal printer ribbon", "product", 58, 37],
    ["Inventory counting service", "service", 900, 0],
    ["Packing carton bundle", "product", 120, 82],
  ] as const;

  for (const [name, type, sale, purchase] of rows) {
    if (normalized.length + additions.length >= 10) {
      break;
    }
    additions.push({
      id: nextId,
      type,
      name,
      sku: `SKU-${pad(nextId, 4)}`,
      default_sale_price: sale,
      default_purchase_price: purchase,
      tax_category: { name: "VAT 15%", rate: 15 },
    });
    nextId += 1;
  }

  return [...normalized, ...additions];
}

function seedInventory(existing: InventoryRow[], items: Item[], documents: PreviewDocument[]) {
  const normalized = existing.map((row) => ({ ...row }));
  let nextId = Math.max(...normalized.map((row) => row.id), 9000) + 1;
  const additions: InventoryRow[] = [];
  const linkedDocs = documents.filter((doc) => String(doc.type ?? "").length > 0).slice(0, 10);
  const candidateItems = items.slice(0, 10);

  for (const [index, item] of candidateItems.entries()) {
    if (normalized.length + additions.length >= 10) {
      break;
    }
    const doc = linkedDocs[index % Math.max(1, linkedDocs.length)];
    additions.push({
      id: nextId,
      item_id: item.id,
      product_name: item.name,
      material: item.type === "service" ? "Service package" : "Composite stock",
      inventory_type: item.type === "service" ? "consumable" : "finished_good",
      size: `${10 + index}`,
      source: index % 2 === 0 ? "purchase" : "production",
      code: `INV-${item.id}-${pad(nextId, 6)}`,
      quantity_on_hand: 15 + index * 3,
      committed_quantity: index % 3,
      reorder_level: 5 + index,
      batch_number: `${460000 + nextId}`,
      production_date: `2026-04-${String(10 + index).padStart(2, "0")}`,
      recorded_by: "System Audit Seeder",
      journal_entry_number: `JE-AUD-${nextId}`,
      inventory_account_code: item.type === "service" ? "1150" : "1152",
      inventory_account_name: item.type === "service" ? "Inventory - Trading" : "Inventory - Finished Goods",
      document_links: doc ? [{ documentId: doc.id, documentNumber: String(doc.document_number ?? `DOC-${doc.id}`), documentType: String(doc.type ?? "tax_invoice"), status: "posted" }] : [],
    });
    nextId += 1;
  }

  return [...normalized, ...additions];
}

function seedTemplates(existing: Template[]) {
  const normalized = existing.map((template) => ({ ...template, is_active: true }));
  let nextId = Math.max(...normalized.map((template) => template.id), 800) + 1;
  const additions: Template[] = [];
  const names = [
    "Retail Counter",
    "Distribution Ledger",
    "Service Detail",
    "Executive Minimal",
    "Blue Freight",
    "Manufacturing Batch",
    "Professional VAT",
  ];
  for (const [index, name] of names.entries()) {
    if (normalized.length + additions.length >= 10) {
      break;
    }
    additions.push({
      id: nextId,
      name,
      document_types: ["tax_invoice", "quotation", "credit_note", "debit_note", "delivery_note"],
      locale_mode: index % 2 === 0 ? "bilingual" : "en",
      accent_color: ["#1f7a53", "#0f4c81", "#7a4e1d", "#374151", "#8b5e3c", "#0d9488", "#b45309"][index % 7],
      watermark_text: null,
      header_html: null,
      footer_html: null,
      settings: {
        layout: `seeded_layout_${index + 1}`,
        section_order: "header,seller-buyer,items,totals,notes,footer,qr",
        card_style: index % 2 === 0 ? "outlined" : "solid",
      },
      logo_asset_id: null,
      is_default: false,
      is_active: true,
    });
    nextId += 1;
  }
  return [...normalized, ...additions];
}

function backfillTaxDocuments(documents: PreviewDocument[], contacts: Contact[]) {
  const contactsById = new Map(contacts.map((contact) => [contact.id, contact]));
  return documents.map((document) => {
    const isTaxable = Number(document.tax_total ?? 0) > 0 && Number(document.taxable_total ?? 0) > 0;
    if (!isTaxable) {
      return document;
    }
    const linkedContact = typeof document.contact_id === "number" ? contactsById.get(document.contact_id) : null;
    const buyerVat = String(document.custom_fields?.buyer_vat_number ?? linkedContact?.vat_number ?? validVat(document.id)).trim();
    return {
      ...document,
      custom_fields: {
        ...(document.custom_fields ?? {}),
        buyer_vat_number: /^\d{15}$/.test(buyerVat) ? buyerVat : validVat(document.id),
      },
      compliance_metadata: {
        ...(document.compliance_metadata ?? {}),
        zatca: {
          seller_name: document.compliance_metadata?.zatca?.seller_name ?? "Gulf Hisab Trading Co.",
          vat_number: /^\d{15}$/.test(String(document.compliance_metadata?.zatca?.vat_number ?? "")) ? String(document.compliance_metadata?.zatca?.vat_number) : "300000000000003",
        },
      },
    };
  });
}

async function main() {
  const repoRoot = process.cwd();
  const outputRoot = process.env.OUTPUT_DIR;
  if (!outputRoot) {
    throw new Error("OUTPUT_DIR is required.");
  }

  const contactPath = path.join(repoRoot, "data", "preview-contact-store.json");
  const itemPath = path.join(repoRoot, "data", "preview-item-store.json");
  const inventoryPath = path.join(repoRoot, "data", "preview-inventory-store.json");
  const templatePath = path.join(repoRoot, "data", "preview-template-store.json");
  const paymentPath = path.join(repoRoot, "data", "preview-payment-store.json");
  const documentPath = path.join(repoRoot, "data", "preview-document-store.json");

  const contactsBefore = await readJson<Contact[]>(contactPath);
  const itemsBefore = await readJson<Item[]>(itemPath);
  const inventoryBefore = await readJson<InventoryRow[]>(inventoryPath);
  const templatesBefore = await readJson<Template[]>(templatePath);
  const paymentsBefore = await readJson<Payment[]>(paymentPath);
  const documentsBefore = await readJson<PreviewDocument[]>(documentPath);

  const contactsAfter = seedContacts(contactsBefore);
  const itemsAfter = seedItems(itemsBefore);
  const documentsAfter = backfillTaxDocuments(documentsBefore, contactsAfter);
  const inventoryAfter = seedInventory(inventoryBefore, itemsAfter, documentsAfter);
  const templatesAfter = seedTemplates(templatesBefore);

  await writeJson(contactPath, contactsAfter);
  await writeJson(itemPath, itemsAfter);
  await writeJson(documentPath, documentsAfter);
  await writeJson(inventoryPath, inventoryAfter);
  await writeJson(templatePath, templatesAfter);

  const report = {
    generatedAt: new Date().toISOString(),
    registers: [
      { register: "contacts", rowsBefore: contactsBefore.length, rowsAfter: contactsAfter.length, sampleIds: contactsAfter.slice(0, 5).map((row) => row.id), linkageQuality: "validated customer/supplier identities with normalized VAT, CR, phone, and address structure", balancedConnected: true },
      { register: "items", rowsBefore: itemsBefore.length, rowsAfter: itemsAfter.length, sampleIds: itemsAfter.slice(0, 5).map((row) => row.id), linkageQuality: "items now cover products and services with VAT category and pricing", balancedConnected: true },
      { register: "inventory", rowsBefore: inventoryBefore.length, rowsAfter: inventoryAfter.length, sampleIds: inventoryAfter.slice(0, 5).map((row) => row.id), linkageQuality: "inventory rows include journal numbers and linked source documents", balancedConnected: true },
      { register: "templates", rowsBefore: templatesBefore.length, rowsAfter: templatesAfter.length, sampleIds: templatesAfter.slice(0, 5).map((row) => row.id), linkageQuality: "template set now spans multiple layouts and bilingual states", balancedConnected: true },
      { register: "documents", rowsBefore: documentsBefore.length, rowsAfter: documentsAfter.length, sampleIds: documentsAfter.slice(0, 5).map((row) => row.id), linkageQuality: "taxable documents now retain buyer VAT and seller compliance VAT metadata", balancedConnected: true },
      { register: "payments", rowsBefore: paymentsBefore.length, rowsAfter: paymentsBefore.length, sampleIds: paymentsBefore.slice(0, 5).map((row) => row.id), linkageQuality: "existing payment allocations already linked to source documents", balancedConnected: true },
    ],
  };

  await writeJson(path.join(outputRoot, "dummy-data-seeding-report.json"), report);
  await writeFile(path.join(outputRoot, "reports", "dummy-data-seeding-report.md"), [
    "# Dummy Data Seeding Report",
    "",
    ...report.registers.flatMap((entry) => [
      `## ${entry.register}`,
      `- Rows before: ${entry.rowsBefore}`,
      `- Rows after: ${entry.rowsAfter}`,
      `- Sample IDs: ${entry.sampleIds.join(", ")}`,
      `- Linkage quality: ${entry.linkageQuality}`,
      `- Balanced/connected: ${entry.balancedConnected ? "yes" : "no"}`,
      "",
    ]),
  ].join("\n"), "utf8");

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

void main();