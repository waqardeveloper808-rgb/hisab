/**
 * Appends synthetic preview documents linked to GJ-COV journals (batch tag coverage).
 * Idempotent: skips if COV-LNK documents already exist.
 * Run: npx tsx tools/append-coverage-preview-documents.ts
 */
import fs from "node:fs";
import path from "node:path";

const BATCH = "coa_full_account_coverage_2026_04_27";
const DOC_PATH = path.join(process.cwd(), "data", "preview-document-store.json");

type Doc = Record<string, unknown>;

function main() {
  const docs = JSON.parse(fs.readFileSync(DOC_PATH, "utf8")) as Doc[];
  if (docs.some((d) => String(d.document_number ?? "").startsWith("COV-LNK-"))) {
    console.log("Coverage-linked documents already present; skipping.");
    return;
  }

  const maxId = Math.max(...docs.map((d) => Number(d.id) || 0));
  const journals = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "preview-journal-store.json"), "utf8")) as Array<{
    id: number;
    entry_number: string;
    entry_date: string;
    metadata?: { batch_tag?: string };
  }>;

  const cov = journals.filter((j) => j.entry_number?.startsWith("GJ-COV")).slice(0, 15);
  if (cov.length === 0) {
    console.error("No GJ-COV journals found.");
    process.exit(1);
  }

  const types = ["tax_invoice", "credit_note", "debit_note", "delivery_note", "proforma_invoice"] as const;
  const created: Doc[] = [];

  cov.forEach((je, i) => {
    const id = maxId + i + 1;
    const typ = types[i % types.length];
    const num = `COV-LNK-${String(i + 1).padStart(4, "0")}`;
    const taxable = 1000 + i * 50;
    const tax = Math.round(taxable * 0.15 * 100) / 100;
    const grand = taxable + tax;

    created.push({
      id,
      type: typ,
      status: typ === "proforma_invoice" ? "finalized" : "posted",
      contact_id: 101,
      document_number: num,
      issue_date: je.entry_date,
      supply_date: je.entry_date,
      due_date: je.entry_date,
      grand_total: grand,
      balance_due: grand,
      paid_total: 0,
      tax_total: tax,
      taxable_total: taxable,
      contact: { display_name: "Coverage Linked Customer Ltd." },
      title: `Coverage batch ${BATCH}`,
      language_code: "en",
      sent_at: null,
      sent_to_email: "finance@coverage.local",
      custom_fields: {
        batch_tag: BATCH,
        linked_journal_entry_number: je.entry_number,
        linked_journal_id: je.id,
        reference: num,
      },
      template: null,
      notes: `Linked narrative for ${je.entry_number}`,
      compliance_metadata: { zatca: { seller_name: "Hisabix Preview LLC", vat_number: "300123456700003" } },
      source_document_id: null,
      reversal_of_document_id: null,
      version: 1,
      status_reason: null,
      lines: [
        {
          id: id * 100 + 1,
          item_id: 303,
          ledger_account_id: 46,
          cost_center_id: null,
          description: `Coverage line ${je.entry_number}`,
          quantity: 1,
          unit_price: taxable,
          gross_amount: taxable,
          metadata: { custom_fields: { vat_rate: 15, batch_tag: BATCH } },
        },
      ],
    });
  });

  fs.writeFileSync(DOC_PATH, JSON.stringify([...created, ...docs], null, 2) + "\n", "utf8");
  console.log("Appended", created.length, "documents at front of preview-document-store.json");
}

main();
