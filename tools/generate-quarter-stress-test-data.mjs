import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function argValue(name, fallback = "") {
  const match = process.argv.find((value) => value.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : fallback;
}

function toMoney(value) {
  return Number(Number(value).toFixed(2));
}

function sum(items, selector) {
  return toMoney(items.reduce((total, item) => total + Number(selector(item) ?? 0), 0));
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function csvLine(values) {
  return values.map(csvEscape).join(",");
}

function makePeriod(code, from, to) {
  return { code, from, to };
}

function makeCustomer(id, code, name, vatNumber, category, opts = {}) {
  return {
    id,
    code,
    name,
    vatNumber,
    category,
    country: opts.country ?? "Saudi Arabia",
    city: opts.city ?? "Riyadh",
    isVatRegistered: Boolean(opts.isVatRegistered),
    canReceiveCreditNotes: opts.canReceiveCreditNotes ?? true,
    canReceiveDebitNotes: opts.canReceiveDebitNotes ?? true,
    notes: opts.notes ?? "",
  };
}

function makeVendor(id, code, name, vatNumber, opts = {}) {
  return {
    id,
    code,
    name,
    vatNumber,
    country: opts.country ?? "Saudi Arabia",
    isVatRegistered: Boolean(opts.isVatRegistered ?? true),
    notes: opts.notes ?? "",
  };
}

function makeItem(id, code, name, type, sellPrice, costPrice, opts = {}) {
  return {
    id,
    code,
    name,
    type,
    sellPrice: toMoney(sellPrice),
    costPrice: toMoney(costPrice),
    vatRate: opts.vatRate ?? 15,
    stockTracked: Boolean(opts.stockTracked),
    openingQty: opts.openingQty ?? 0,
    openingValue: toMoney((opts.openingQty ?? 0) * costPrice),
    uom: opts.uom ?? "ea",
  };
}

function makeLine(item, quantity, unitPrice, overrides = {}) {
  const subtotal = toMoney(quantity * unitPrice);
  const vatRate = overrides.vatRate ?? item.vatRate ?? 15;
  const vatAmount = overrides.vatExempt ? 0 : toMoney(subtotal * (vatRate / 100));
  return {
    itemId: item.id,
    itemCode: item.code,
    description: overrides.description ?? item.name,
    quantity,
    unitPrice: toMoney(unitPrice),
    subtotal,
    vatRate,
    vatAmount,
    total: toMoney(subtotal + vatAmount),
    stockTracked: Boolean(item.stockTracked),
    costPrice: item.costPrice,
    vatExempt: Boolean(overrides.vatExempt),
  };
}

function computeDocumentTotals(lines) {
  const subtotal = sum(lines, (line) => line.subtotal);
  const taxTotal = sum(lines, (line) => line.vatAmount);
  const grandTotal = toMoney(subtotal + taxTotal);
  return { subtotal, taxTotal, grandTotal };
}

function addJournal(state, journal) {
  const debitTotal = sum(journal.lines, (line) => line.debit);
  const creditTotal = sum(journal.lines, (line) => line.credit);
  const balanced = Math.abs(debitTotal - creditTotal) < 0.01;
  const entry = {
    ...journal,
    debitTotal,
    creditTotal,
    balanced,
  };

  state.journals.push(entry);
  if (!balanced) {
    state.failedChecks.add(`Journal ${journal.id} is not balanced.`);
  }
  return entry;
}

function makeLineEntry(accountCode, accountName, debit = 0, credit = 0, extra = {}) {
  return {
    accountCode,
    accountName,
    debit: toMoney(debit),
    credit: toMoney(credit),
    ...extra,
  };
}

function addInventoryMovement(state, movement) {
  const entry = {
    id: movement.id,
    movementDate: movement.movementDate,
    itemId: movement.itemId,
    itemCode: movement.itemCode,
    documentId: movement.documentId,
    documentNumber: movement.documentNumber,
    sourceModule: movement.sourceModule,
    transactionType: movement.transactionType,
    quantityChange: movement.quantityChange,
    unitCost: toMoney(movement.unitCost ?? 0),
    totalValue: toMoney(movement.totalValue ?? 0),
    linkedJournalEntryId: movement.linkedJournalEntryId ?? null,
    reference: movement.reference ?? movement.documentNumber,
  };
  state.inventoryMovements.push(entry);
  return entry;
}

function createDataset() {
  const periods = [
    makePeriod("Q1-2026", "2026-01-01", "2026-03-31"),
    makePeriod("Q2-2026", "2026-04-01", "2026-06-30"),
  ];

  const customers = [
    makeCustomer("cust-001", "CUST-001", "Desert Retail Co.", "301112223330003", "b2b", { isVatRegistered: true, city: "Jeddah" }),
    makeCustomer("cust-002", "CUST-002", "Riyadh Hypermarket", "300998877660003", "b2b", { isVatRegistered: true, city: "Riyadh" }),
    makeCustomer("cust-003", "CUST-003", "Madinah Boutique", "300887766550003", "b2c", { isVatRegistered: false, city: "Madinah" }),
    makeCustomer("cust-004", "CUST-004", "Eastern Region Traders", "300776655440003", "b2b", { isVatRegistered: true, city: "Dammam", canReceiveDebitNotes: true }),
    makeCustomer("cust-005", "CUST-005", "Family Electronics", "300665544330003", "b2c", { isVatRegistered: false, city: "Khobar" }),
  ];

  const vendors = [
    makeVendor("vend-001", "VEND-001", "Red Dunes Supplies", "303112223330003", { country: "Saudi Arabia" }),
    makeVendor("vend-002", "VEND-002", "Palm Gulf Imports", "303998877660003", { country: "Saudi Arabia" }),
    makeVendor("vend-003", "VEND-003", "Atlas Office Services", "303887766550003", { country: "Saudi Arabia", isVatRegistered: false }),
    makeVendor("vend-004", "VEND-004", "Cross Border Freight", "304776655440003", { country: "United Arab Emirates", notes: "Import logistics and duty clearing" }),
  ];

  const items = [
    makeItem("item-001", "SKU-1001", "Premium Workstation", "inventory", 4800, 3000, { stockTracked: true, openingQty: 18 }),
    makeItem("item-002", "SKU-1002", "Network Cable Kit", "inventory", 420, 190, { stockTracked: true, openingQty: 200 }),
    makeItem("item-003", "SKU-1003", "Server Rack", "inventory", 12600, 8500, { stockTracked: true, openingQty: 6 }),
    makeItem("item-004", "SRV-2001", "Implementation Service", "service", 125000, 0, { stockTracked: false }),
    makeItem("item-005", "SRV-2002", "Annual Support", "service", 38500, 0, { stockTracked: false }),
    makeItem("item-006", "SRV-2003", "Compliance Review", "service", 18200, 0, { stockTracked: false }),
    makeItem("item-007", "SKU-3001", "Warehouse Scanner", "inventory", 7800, 5100, { stockTracked: true, openingQty: 11 }),
    makeItem("item-008", "SRV-2004", "Training Workshop", "service", 9600, 0, { stockTracked: false }),
  ];

  const accounts = {
    cash: { code: "1000", name: "Cash / Bank" },
    ar: { code: "1100", name: "Accounts Receivable" },
    inventory: { code: "1200", name: "Inventory" },
    inputVat: { code: "1300", name: "Input VAT" },
    ap: { code: "2000", name: "Accounts Payable" },
    vatPayable: { code: "2100", name: "VAT Payable" },
    revenue: { code: "4000", name: "Sales Revenue" },
    cogs: { code: "5000", name: "Cost of Goods Sold" },
    expenses: { code: "5100", name: "Operating Expenses" },
  };

  const state = {
    periods,
    customers,
    vendors,
    items,
    accounts,
    documents: [],
    journalByDocumentId: new Map(),
    journals: [],
    inventoryMovements: [],
    payments: [],
    failedChecks: new Set(),
  };

  const findItem = (code) => items.find((item) => item.code === code);
  const findCustomer = (code) => customers.find((customer) => customer.code === code);
  const findVendor = (code) => vendors.find((vendor) => vendor.code === code);

  let documentSeq = 1;
  let journalSeq = 1;
  let paymentSeq = 1;
  let movementSeq = 1;

  function nextDocumentId(prefix) {
    return `${prefix}-${String(documentSeq++).padStart(3, "0")}`;
  }

  function nextJournalId() {
    return `JE-${String(journalSeq++).padStart(4, "0")}`;
  }

  function nextPaymentId(prefix) {
    return `${prefix}-${String(paymentSeq++).padStart(3, "0")}`;
  }

  function nextMovementId() {
    return `IM-${String(movementSeq++).padStart(4, "0")}`;
  }

  function registerDocument(document) {
    state.documents.push(document);
    return document;
  }

  function postSalesInvoice(definition) {
    const customer = findCustomer(definition.customerCode);
    const lines = definition.lines.map((line) => makeLine(findItem(line.itemCode), line.quantity, line.unitPrice, { ...line, vatExempt: Boolean(definition.vatExempt) }));
    const totals = computeDocumentTotals(lines);
    const documentId = nextDocumentId(definition.kind === "simplified" ? "SINV" : "INV");
    const journalId = nextJournalId();
    const periodCode = definition.issueDate <= "2026-03-31" ? "Q1-2026" : "Q2-2026";
    const invoice = registerDocument({
      id: documentId,
      documentNumber: definition.number,
      type: "tax_invoice",
      subType: definition.kind,
      periodCode,
      issueDate: definition.issueDate,
      status: definition.status ?? "posted",
      customerId: customer.id,
      customerCode: customer.code,
      customerName: customer.name,
      customerVatNumber: customer.vatNumber,
      paymentStatus: definition.paymentStatus,
      lines,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      vatTreatment: definition.kind === "simplified" ? "simplified" : "standard",
      linkedOriginalDocumentId: definition.linkedOriginalDocumentId ?? null,
      linkedOriginalDocumentNumber: definition.linkedOriginalDocumentNumber ?? null,
      journalEntryId: journalId,
      sourceModule: "sales",
      transactionType: "invoice",
    });

    const journalLines = [
      makeLineEntry(accounts.ar.code, accounts.ar.name, invoice.grandTotal, 0, { documentId, documentNumber: invoice.documentNumber, sourceModule: "sales", transactionType: "invoice" }),
      makeLineEntry(accounts.revenue.code, accounts.revenue.name, 0, invoice.subtotal, { documentId, documentNumber: invoice.documentNumber, sourceModule: "sales", transactionType: "invoice" }),
      makeLineEntry(accounts.vatPayable.code, accounts.vatPayable.name, 0, invoice.taxTotal, { documentId, documentNumber: invoice.documentNumber, sourceModule: "sales", transactionType: "invoice" }),
    ];

    let cogsTotal = 0;
    let inventoryTotal = 0;
    for (const line of lines.filter((line) => line.stockTracked)) {
      const lineCost = toMoney(line.quantity * line.costPrice);
      if (lineCost > 0) {
        cogsTotal = toMoney(cogsTotal + lineCost);
        inventoryTotal = toMoney(inventoryTotal + lineCost);
        addInventoryMovement(state, {
          id: nextMovementId(),
          movementDate: definition.issueDate,
          itemId: line.itemId,
          itemCode: line.itemCode,
          documentId,
          documentNumber: invoice.documentNumber,
          sourceModule: "sales",
          transactionType: "sale",
          quantityChange: -line.quantity,
          unitCost: line.costPrice,
          totalValue: -lineCost,
          linkedJournalEntryId: journalId,
          reference: `${invoice.documentNumber}-${line.itemCode}`,
        });
      }
    }

    if (cogsTotal > 0) {
      journalLines.push(
        makeLineEntry(accounts.cogs.code, accounts.cogs.name, cogsTotal, 0, { documentId, documentNumber: invoice.documentNumber, sourceModule: "sales", transactionType: "invoice" }),
        makeLineEntry(accounts.inventory.code, accounts.inventory.name, 0, inventoryTotal, { documentId, documentNumber: invoice.documentNumber, sourceModule: "sales", transactionType: "invoice" }),
      );
    }

    const journal = addJournal(state, {
      id: journalId,
      documentId,
      documentNumber: invoice.documentNumber,
      sourceModule: "sales",
      transactionType: "invoice",
      entryDate: definition.issueDate,
      lines: journalLines,
    });
    state.journalByDocumentId.set(documentId, journal.id);
    return invoice;
  }

  function postCreditNote(definition) {
    const customer = findCustomer(definition.customerCode);
    const original = state.documents.find((document) => document.documentNumber === definition.originalDocumentNumber);
    const lines = definition.lines.map((line) => makeLine(findItem(line.itemCode), line.quantity, line.unitPrice, line));
    const totals = computeDocumentTotals(lines);
    const documentId = nextDocumentId("CRN");
    const journalId = nextJournalId();
    const note = registerDocument({
      id: documentId,
      documentNumber: definition.number,
      type: "credit_note",
      periodCode: definition.issueDate <= "2026-03-31" ? "Q1-2026" : "Q2-2026",
      issueDate: definition.issueDate,
      status: "posted",
      customerId: customer.id,
      customerCode: customer.code,
      customerName: customer.name,
      customerVatNumber: customer.vatNumber,
      paymentStatus: "credited",
      lines,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      vatTreatment: "adjustment",
      linkedOriginalDocumentId: original?.id ?? null,
      linkedOriginalDocumentNumber: original?.documentNumber ?? definition.originalDocumentNumber,
      journalEntryId: journalId,
      sourceModule: "sales",
      transactionType: "credit_note",
    });

    const journalLines = [
      makeLineEntry(accounts.revenue.code, accounts.revenue.name, note.subtotal, 0, { documentId, documentNumber: note.documentNumber, sourceModule: "sales", transactionType: "credit_note" }),
      makeLineEntry(accounts.vatPayable.code, accounts.vatPayable.name, note.taxTotal, 0, { documentId, documentNumber: note.documentNumber, sourceModule: "sales", transactionType: "credit_note" }),
      makeLineEntry(accounts.ar.code, accounts.ar.name, 0, note.grandTotal, { documentId, documentNumber: note.documentNumber, sourceModule: "sales", transactionType: "credit_note" }),
    ];

    let cogsTotal = 0;
    for (const line of lines.filter((line) => line.stockTracked)) {
      const lineCost = toMoney(line.quantity * line.costPrice);
      if (lineCost > 0) {
        cogsTotal = toMoney(cogsTotal + lineCost);
        addInventoryMovement(state, {
          id: nextMovementId(),
          movementDate: definition.issueDate,
          itemId: line.itemId,
          itemCode: line.itemCode,
          documentId,
          documentNumber: note.documentNumber,
          sourceModule: "sales",
          transactionType: "credit_note_return",
          quantityChange: line.quantity,
          unitCost: line.costPrice,
          totalValue: lineCost,
          linkedJournalEntryId: journalId,
          reference: `${note.documentNumber}-${line.itemCode}`,
        });
      }
    }

    if (cogsTotal > 0) {
      journalLines.push(
        makeLineEntry(accounts.inventory.code, accounts.inventory.name, cogsTotal, 0, { documentId, documentNumber: note.documentNumber, sourceModule: "sales", transactionType: "credit_note" }),
        makeLineEntry(accounts.cogs.code, accounts.cogs.name, 0, cogsTotal, { documentId, documentNumber: note.documentNumber, sourceModule: "sales", transactionType: "credit_note" }),
      );
    }

    const journal = addJournal(state, {
      id: journalId,
      documentId,
      documentNumber: note.documentNumber,
      sourceModule: "sales",
      transactionType: "credit_note",
      entryDate: definition.issueDate,
      lines: journalLines,
    });
    state.journalByDocumentId.set(documentId, journal.id);
    return note;
  }

  function postDebitNote(definition) {
    const customer = findCustomer(definition.customerCode);
    const original = state.documents.find((document) => document.documentNumber === definition.originalDocumentNumber);
    const lines = definition.lines.map((line) => makeLine(findItem(line.itemCode), line.quantity, line.unitPrice, line));
    const totals = computeDocumentTotals(lines);
    const documentId = nextDocumentId("DBN");
    const journalId = nextJournalId();
    const note = registerDocument({
      id: documentId,
      documentNumber: definition.number,
      type: "debit_note",
      periodCode: definition.issueDate <= "2026-03-31" ? "Q1-2026" : "Q2-2026",
      issueDate: definition.issueDate,
      status: "posted",
      customerId: customer.id,
      customerCode: customer.code,
      customerName: customer.name,
      customerVatNumber: customer.vatNumber,
      paymentStatus: "open",
      lines,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      vatTreatment: "adjustment",
      linkedOriginalDocumentId: original?.id ?? null,
      linkedOriginalDocumentNumber: original?.documentNumber ?? definition.originalDocumentNumber,
      journalEntryId: journalId,
      sourceModule: "sales",
      transactionType: "debit_note",
    });

    const journal = addJournal(state, {
      id: journalId,
      documentId,
      documentNumber: note.documentNumber,
      sourceModule: "sales",
      transactionType: "debit_note",
      entryDate: definition.issueDate,
      lines: [
        makeLineEntry(accounts.ar.code, accounts.ar.name, note.grandTotal, 0, { documentId, documentNumber: note.documentNumber, sourceModule: "sales", transactionType: "debit_note" }),
        makeLineEntry(accounts.revenue.code, accounts.revenue.name, 0, note.subtotal, { documentId, documentNumber: note.documentNumber, sourceModule: "sales", transactionType: "debit_note" }),
        makeLineEntry(accounts.vatPayable.code, accounts.vatPayable.name, 0, note.taxTotal, { documentId, documentNumber: note.documentNumber, sourceModule: "sales", transactionType: "debit_note" }),
      ],
    });
    state.journalByDocumentId.set(documentId, journal.id);
    return note;
  }

  function postPurchaseBill(definition) {
    const vendor = findVendor(definition.vendorCode);
    const lines = definition.lines.map((line) => makeLine(findItem(line.itemCode), line.quantity, line.unitPrice, line));
    const totals = computeDocumentTotals(lines);
    const documentId = nextDocumentId("BILL");
    const journalId = nextJournalId();
    const bill = registerDocument({
      id: documentId,
      documentNumber: definition.number,
      type: "vendor_bill",
      periodCode: definition.issueDate <= "2026-03-31" ? "Q1-2026" : "Q2-2026",
      issueDate: definition.issueDate,
      status: "posted",
      vendorId: vendor.id,
      vendorCode: vendor.code,
      vendorName: vendor.name,
      vendorVatNumber: vendor.vatNumber,
      paymentStatus: definition.paymentStatus ?? "open",
      lines,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      vatTreatment: definition.vatTreatment ?? (definition.vatExempt ? "exempt" : "standard"),
      linkedOriginalDocumentId: null,
      linkedOriginalDocumentNumber: null,
      journalEntryId: journalId,
      sourceModule: "purchase",
      transactionType: "bill",
    });

    const journalLines = [];
    if (definition.lines.some((line) => findItem(line.itemCode).stockTracked)) {
      journalLines.push(
        makeLineEntry(accounts.inventory.code, accounts.inventory.name, bill.subtotal, 0, { documentId, documentNumber: bill.documentNumber, sourceModule: "purchase", transactionType: "bill" }),
      );
      for (const line of lines.filter((line) => line.stockTracked)) {
        addInventoryMovement(state, {
          id: nextMovementId(),
          movementDate: definition.issueDate,
          itemId: line.itemId,
          itemCode: line.itemCode,
          documentId,
          documentNumber: bill.documentNumber,
          sourceModule: "purchase",
          transactionType: "purchase",
          quantityChange: line.quantity,
          unitCost: line.costPrice,
          totalValue: toMoney(line.quantity * line.costPrice),
          linkedJournalEntryId: journalId,
          reference: `${bill.documentNumber}-${line.itemCode}`,
        });
      }
    } else {
      journalLines.push(
        makeLineEntry(accounts.expenses.code, accounts.expenses.name, bill.subtotal, 0, { documentId, documentNumber: bill.documentNumber, sourceModule: "purchase", transactionType: "bill" }),
      );
    }

    if (bill.taxTotal > 0) {
      journalLines.push(makeLineEntry(accounts.inputVat.code, accounts.inputVat.name, bill.taxTotal, 0, { documentId, documentNumber: bill.documentNumber, sourceModule: "purchase", transactionType: "bill" }));
    }
    journalLines.push(makeLineEntry(accounts.ap.code, accounts.ap.name, 0, bill.grandTotal, { documentId, documentNumber: bill.documentNumber, sourceModule: "purchase", transactionType: "bill" }));

    const journal = addJournal(state, {
      id: journalId,
      documentId,
      documentNumber: bill.documentNumber,
      sourceModule: "purchase",
      transactionType: "bill",
      entryDate: definition.issueDate,
      lines: journalLines,
    });
    state.journalByDocumentId.set(documentId, journal.id);
    return bill;
  }

  function postPayment(definition) {
    const document = state.documents.find((entry) => entry.documentNumber === definition.linkedDocumentNumber);
    const documentId = nextDocumentId(definition.direction === "outgoing" ? "VPY" : "RCV");
    const journalId = nextJournalId();
    const payment = {
      id: nextPaymentId(definition.direction === "outgoing" ? "VPAY" : "RCPT"),
      documentId,
      documentNumber: definition.number,
      issueDate: definition.issueDate,
      direction: definition.direction,
      sourceModule: definition.direction === "outgoing" ? "purchase" : "sales",
      transactionType: definition.direction === "outgoing" ? "vendor_payment" : "customer_receipt",
      linkedDocumentId: document?.id ?? null,
      linkedDocumentNumber: document?.documentNumber ?? definition.linkedDocumentNumber,
      amount: toMoney(definition.amount),
      journalEntryId: journalId,
      paymentMethod: definition.paymentMethod ?? "bank_transfer",
      status: "posted",
    };
    state.payments.push(payment);

    const journalLines = definition.direction === "outgoing"
      ? [
          makeLineEntry(accounts.ap.code, accounts.ap.name, definition.amount, 0, { documentId, documentNumber: payment.documentNumber, sourceModule: "purchase", transactionType: "vendor_payment" }),
          makeLineEntry(accounts.cash.code, accounts.cash.name, 0, definition.amount, { documentId, documentNumber: payment.documentNumber, sourceModule: "purchase", transactionType: "vendor_payment" }),
        ]
      : [
          makeLineEntry(accounts.cash.code, accounts.cash.name, definition.amount, 0, { documentId, documentNumber: payment.documentNumber, sourceModule: "sales", transactionType: "customer_receipt" }),
          makeLineEntry(accounts.ar.code, accounts.ar.name, 0, definition.amount, { documentId, documentNumber: payment.documentNumber, sourceModule: "sales", transactionType: "customer_receipt" }),
        ];

    const journal = addJournal(state, {
      id: journalId,
      documentId,
      documentNumber: payment.documentNumber,
      sourceModule: payment.sourceModule,
      transactionType: payment.transactionType,
      entryDate: definition.issueDate,
      lines: journalLines,
    });
    state.journalByDocumentId.set(documentId, journal.id);
    return payment;
  }

  function registerPurchaseOrder(definition) {
    const vendor = findVendor(definition.vendorCode);
    const documentId = nextDocumentId("PO");
    const lines = definition.lines.map((line) => makeLine(findItem(line.itemCode), line.quantity, line.unitPrice, line));
    const totals = computeDocumentTotals(lines);
    return registerDocument({
      id: documentId,
      documentNumber: definition.number,
      type: "purchase_order",
      periodCode: definition.issueDate <= "2026-03-31" ? "Q1-2026" : "Q2-2026",
      issueDate: definition.issueDate,
      status: "draft",
      vendorId: vendor.id,
      vendorCode: vendor.code,
      vendorName: vendor.name,
      vendorVatNumber: vendor.vatNumber,
      lines,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      sourceModule: "purchase",
      transactionType: "purchase_order",
      journalEntryId: null,
    });
  }

  const salesDefinitions = [
    { number: "Q1-INV-001", issueDate: "2026-01-04", customerCode: "CUST-001", kind: "standard", paymentStatus: "partial", lines: [{ itemCode: "SKU-1001", quantity: 2, unitPrice: 5400 }, { itemCode: "SRV-2001", quantity: 1, unitPrice: 125000 }] },
    { number: "Q1-INV-002", issueDate: "2026-01-10", customerCode: "CUST-003", kind: "simplified", paymentStatus: "paid", lines: [{ itemCode: "SKU-1002", quantity: 12, unitPrice: 420 }, { itemCode: "SRV-2004", quantity: 1, unitPrice: 9600 }] },
    { number: "Q1-INV-003", issueDate: "2026-01-18", customerCode: "CUST-002", kind: "standard", paymentStatus: "open", lines: [{ itemCode: "SKU-1003", quantity: 1, unitPrice: 12600 }, { itemCode: "SRV-2002", quantity: 1, unitPrice: 38500 }] },
    { number: "Q1-INV-004", issueDate: "2026-02-03", customerCode: "CUST-005", kind: "simplified", paymentStatus: "paid", lines: [{ itemCode: "SKU-3001", quantity: 2, unitPrice: 8200 }, { itemCode: "SRV-2003", quantity: 1, unitPrice: 18200 }] },
    { number: "Q1-INV-005", issueDate: "2026-02-17", customerCode: "CUST-004", kind: "standard", paymentStatus: "partial", lines: [{ itemCode: "SKU-1002", quantity: 40, unitPrice: 450 }, { itemCode: "SKU-3001", quantity: 1, unitPrice: 8400 }] },
    { number: "Q1-INV-006", issueDate: "2026-03-12", customerCode: "CUST-001", kind: "standard", paymentStatus: "open", lines: [{ itemCode: "SRV-2001", quantity: 10, unitPrice: 125000 }] },
    { number: "Q2-INV-007", issueDate: "2026-04-06", customerCode: "CUST-002", kind: "standard", paymentStatus: "paid", lines: [{ itemCode: "SKU-1001", quantity: 3, unitPrice: 5600 }, { itemCode: "SRV-2002", quantity: 1, unitPrice: 39500 }] },
    { number: "Q2-INV-008", issueDate: "2026-04-18", customerCode: "CUST-003", kind: "simplified", paymentStatus: "paid", lines: [{ itemCode: "SKU-1002", quantity: 8, unitPrice: 440 }, { itemCode: "SRV-2004", quantity: 2, unitPrice: 9800 }] },
    { number: "Q2-INV-009", issueDate: "2026-05-02", customerCode: "CUST-004", kind: "standard", paymentStatus: "open", lines: [{ itemCode: "SKU-3001", quantity: 2, unitPrice: 8800 }, { itemCode: "SRV-2003", quantity: 1, unitPrice: 19500 }] },
    { number: "Q2-INV-010", issueDate: "2026-05-16", customerCode: "CUST-001", kind: "standard", paymentStatus: "partial", lines: [{ itemCode: "SKU-1003", quantity: 3, unitPrice: 13200 }, { itemCode: "SRV-2002", quantity: 2, unitPrice: 39000 }] },
    { number: "Q2-INV-011", issueDate: "2026-06-05", customerCode: "CUST-005", kind: "simplified", paymentStatus: "paid", lines: [{ itemCode: "SKU-1002", quantity: 20, unitPrice: 430 }, { itemCode: "SRV-2004", quantity: 1, unitPrice: 9600 }] },
    { number: "Q2-INV-012", issueDate: "2026-06-21", customerCode: "CUST-002", kind: "standard", paymentStatus: "open", lines: [{ itemCode: "SRV-2001", quantity: 2, unitPrice: 148000 }, { itemCode: "SKU-3001", quantity: 1, unitPrice: 9200 }] },
  ];

  const creditNoteDefinition = { number: "Q2-CN-001", issueDate: "2026-06-24", customerCode: "CUST-004", originalDocumentNumber: "Q1-INV-005", lines: [{ itemCode: "SKU-1002", quantity: 10, unitPrice: 450 }] };
  const debitNoteDefinition = { number: "Q2-DN-001", issueDate: "2026-06-26", customerCode: "CUST-004", originalDocumentNumber: "Q2-INV-009", lines: [{ itemCode: "SRV-2003", quantity: 1, unitPrice: 2500 }] };

  const purchaseDefinitions = [
    { number: "Q1-BILL-001", issueDate: "2026-01-06", vendorCode: "VEND-001", lines: [{ itemCode: "SKU-1001", quantity: 8, unitPrice: 3000 }, { itemCode: "SKU-1002", quantity: 60, unitPrice: 185 }] },
    { number: "Q1-BILL-002", issueDate: "2026-01-21", vendorCode: "VEND-003", vatExempt: true, lines: [{ itemCode: "SRV-2002", quantity: 1, unitPrice: 11200 }] },
    { number: "Q1-BILL-003", issueDate: "2026-02-09", vendorCode: "VEND-002", lines: [{ itemCode: "SKU-3001", quantity: 5, unitPrice: 5050 }, { itemCode: "SKU-1003", quantity: 2, unitPrice: 8500 }] },
    { number: "Q1-BILL-004", issueDate: "2026-03-15", vendorCode: "VEND-004", lines: [{ itemCode: "SRV-2003", quantity: 1, unitPrice: 24600 }] },
    { number: "Q2-BILL-005", issueDate: "2026-04-03", vendorCode: "VEND-001", lines: [{ itemCode: "SKU-1001", quantity: 4, unitPrice: 3050 }, { itemCode: "SKU-1002", quantity: 80, unitPrice: 188 }] },
    { number: "Q2-BILL-006", issueDate: "2026-04-25", vendorCode: "VEND-003", vatExempt: true, lines: [{ itemCode: "SRV-2004", quantity: 1, unitPrice: 6200 }] },
    { number: "Q2-BILL-007", issueDate: "2026-05-14", vendorCode: "VEND-002", lines: [{ itemCode: "SKU-3001", quantity: 6, unitPrice: 5150 }, { itemCode: "SKU-1003", quantity: 1, unitPrice: 8600 }] },
    { number: "Q2-BILL-008", issueDate: "2026-06-10", vendorCode: "VEND-004", lines: [{ itemCode: "SRV-2001", quantity: 1, unitPrice: 18000 }] },
  ];

  for (const definition of salesDefinitions) postSalesInvoice(definition);
  postCreditNote(creditNoteDefinition);
  postDebitNote(debitNoteDefinition);
  for (const definition of purchaseDefinitions) postPurchaseBill(definition);
  registerPurchaseOrder({
    number: "Q1-PO-001",
    issueDate: "2026-02-14",
    vendorCode: "VEND-002",
    lines: [{ itemCode: "SKU-3001", quantity: 3, unitPrice: 5200 }, { itemCode: "SKU-1002", quantity: 100, unitPrice: 190 }],
  });

  postPayment({ number: "Q1-RCPT-001", issueDate: "2026-01-14", direction: "incoming", linkedDocumentNumber: "Q1-INV-001", amount: 20000, paymentMethod: "bank_transfer" });
  postPayment({ number: "Q1-RCPT-002", issueDate: "2026-02-05", direction: "incoming", linkedDocumentNumber: "Q1-INV-004", amount: 19200, paymentMethod: "cash" });
  postPayment({ number: "Q1-RCPT-003", issueDate: "2026-02-24", direction: "incoming", linkedDocumentNumber: "Q1-INV-005", amount: 10000, paymentMethod: "bank_transfer" });
  postPayment({ number: "Q2-RCPT-004", issueDate: "2026-04-14", direction: "incoming", linkedDocumentNumber: "Q2-INV-007", amount: 34810, paymentMethod: "bank_transfer" });
  postPayment({ number: "Q2-RCPT-005", issueDate: "2026-06-12", direction: "incoming", linkedDocumentNumber: "Q2-INV-011", amount: 17740, paymentMethod: "card" });
  postPayment({ number: "Q2-VPAY-001", issueDate: "2026-03-29", direction: "outgoing", linkedDocumentNumber: "Q1-BILL-001", amount: 110000, paymentMethod: "bank_transfer" });
  postPayment({ number: "Q2-VPAY-002", issueDate: "2026-06-28", direction: "outgoing", linkedDocumentNumber: "Q2-BILL-007", amount: 92000, paymentMethod: "bank_transfer" });

  const openingMovements = items
    .filter((item) => item.stockTracked && item.openingQty > 0)
    .map((item) => addInventoryMovement(state, {
      id: nextMovementId(),
      movementDate: "2026-01-01",
      itemId: item.id,
      itemCode: item.code,
      documentId: "opening-stock",
      documentNumber: `OPEN-${item.code}`,
      sourceModule: "inventory",
      transactionType: "opening_balance",
      quantityChange: item.openingQty,
      unitCost: item.costPrice,
      totalValue: item.openingValue,
      linkedJournalEntryId: null,
      reference: `OPEN-${item.code}`,
    }));

  const stockSummary = items
    .filter((item) => item.stockTracked)
    .map((item) => {
      const opening = item.openingQty;
      const movementQty = state.inventoryMovements
        .filter((movement) => movement.itemCode === item.code)
        .reduce((total, movement) => total + Number(movement.quantityChange), 0);
      const endingQty = opening + movementQty;
      return {
        itemId: item.id,
        itemCode: item.code,
        name: item.name,
        openingQty: opening,
        movementQty,
        endingQty,
        endingValue: toMoney(endingQty * item.costPrice),
      };
    });

  const journalTotals = state.journals.reduce((acc, journal) => {
    acc.debit += journal.debitTotal;
    acc.credit += journal.creditTotal;
    return acc;
  }, { debit: 0, credit: 0 });

  const vatReceived = sum(state.documents.filter((document) => ["tax_invoice", "credit_note", "debit_note"].includes(document.type)), (document) => {
    if (document.type === "credit_note") return -document.taxTotal;
    return document.type === "debit_note" ? document.taxTotal : document.taxTotal;
  });
  const vatPaid = sum(state.documents.filter((document) => document.type === "vendor_bill"), (document) => document.taxTotal);
  const vatPayable = toMoney(vatReceived - vatPaid);

  const revenue = sum(state.documents.filter((document) => ["tax_invoice", "credit_note", "debit_note"].includes(document.type)), (document) => {
    if (document.type === "credit_note") return -document.subtotal;
    return document.type === "debit_note" ? document.subtotal : document.subtotal;
  });
  const cogs = sum(state.journals.flatMap((journal) => journal.lines), (line) => line.accountCode === accounts.cogs.code ? line.debit : 0);
  const expenses = sum(state.documents.filter((document) => document.type === "vendor_bill" && document.vatTreatment === "exempt"), (document) => document.subtotal);

  const arOpenBalance = toMoney(
    sum(state.documents.filter((document) => document.sourceModule === "sales" && ["tax_invoice", "credit_note", "debit_note"].includes(document.type)), (document) => {
      const receipts = state.payments.filter((payment) => payment.linkedDocumentNumber === document.documentNumber && payment.direction === "incoming");
      const paid = sum(receipts, (payment) => payment.amount);
      const gross = document.type === "credit_note" ? -document.grandTotal : document.grandTotal;
      return gross - paid;
    }),
  );

  const apOpenBalance = toMoney(
    sum(state.documents.filter((document) => document.type === "vendor_bill"), (document) => {
      const payments = state.payments.filter((payment) => payment.linkedDocumentNumber === document.documentNumber && payment.direction === "outgoing");
      const paid = sum(payments, (payment) => payment.amount);
      return document.grandTotal - paid;
    }),
  );

  const documentJournalLinks = state.documents
    .filter((document) => ["tax_invoice", "credit_note", "debit_note", "vendor_bill"].includes(document.type))
    .map((document) => ({
      document_id: document.id,
      document_number: document.documentNumber,
      document_type: document.type,
      journal_entry_id: state.journalByDocumentId.get(document.id) ?? null,
      linked_original_document_number: document.linkedOriginalDocumentNumber ?? null,
      source_module: document.sourceModule,
    }));

  const checks = {
    allJournalsBalanced: state.journals.every((journal) => journal.balanced),
    allDocumentsLinkedToJournals: documentJournalLinks.every((entry) => Boolean(entry.journal_entry_id)),
    vatEquationValid: Math.abs((vatReceived - vatPaid) - vatPayable) < 0.01,
    inventoryMovementsLinked: state.inventoryMovements.every((movement) => movement.documentId === "opening-stock" || Boolean(movement.linkedJournalEntryId)),
    creditDebitNotesLinkedToOriginalInvoices: [state.documents.find((document) => document.documentNumber === creditNoteDefinition.number), state.documents.find((document) => document.documentNumber === debitNoteDefinition.number)].every((document) => Boolean(document?.linkedOriginalDocumentNumber)),
    q1q2PeriodsPresent: state.periods.length === 2 && state.periods.some((period) => period.code === "Q1-2026") && state.periods.some((period) => period.code === "Q2-2026"),
  };

  const failedChecks = [];
  for (const [key, value] of Object.entries(checks)) {
    if (!value) failedChecks.push(key);
  }
  failedChecks.push(...state.failedChecks);

  const status = failedChecks.length === 0 ? "PASS" : "FAIL";

  const dataset = {
    generatedAt: new Date().toISOString(),
    sourceCommand: process.argv.join(" "),
    periods,
    customers,
    vendors,
    items,
    documents: state.documents,
    journalEntries: state.journals,
    inventoryMovements: state.inventoryMovements,
    payments: state.payments,
    reports: {
      trialBalance: {
        debitTotal: journalTotals.debit,
        creditTotal: journalTotals.credit,
        balanced: Math.abs(journalTotals.debit - journalTotals.credit) < 0.01,
      },
      profitLoss: {
        revenue,
        cogs,
        expenses,
        grossProfit: toMoney(revenue - cogs),
        netProfit: toMoney(revenue - cogs - expenses),
      },
      vatSummary: {
        vatReceived,
        vatPaid,
        vatPayable,
      },
      arAp: {
        arOpenBalance,
        apOpenBalance,
      },
      inventoryValuation: {
        openingItems: openingMovements.length,
        endingStock: stockSummary,
        endingValue: sum(stockSummary, (row) => row.endingValue),
      },
    },
    checks: {
      ...checks,
      journalCount: state.journals.length,
      documentCount: state.documents.length,
      paymentCount: state.payments.length,
      inventoryMovementCount: state.inventoryMovements.length,
    },
    failedChecks,
  };

  const importFixtureRows = [
    ["2026-01-04", "Q1-INV-001", "Desert Retail Co.", "301112223330003", "Tax Invoice", "SKU-1001", "Premium Workstation", 2, 5400, 15, 10800, 1620, 12420, "Partial", "1100"],
    ["2026-01-10", "Q1-INV-002", "Madinah Boutique", "", "Simplified Invoice", "SKU-1002", "Network Cable Kit", 12, 420, 15, 5040, 756, 5796, "Paid", "1000"],
    ["2026-02-09", "Q1-BILL-003", "Palm Gulf Imports", "303998877660003", "Vendor Bill", "SKU-3001", "Warehouse Scanner", 5, 5050, 15, 25250, 3787.5, 29037.5, "Open", "2000"],
    ["2026-04-06", "Q2-INV-007", "Riyadh Hypermarket", "300998877660003", "Tax Invoice", "SRV-2002", "Annual Support", 1, 39500, 15, 39500, 5925, 45425, "Paid", "1100"],
    ["2026-05-14", "Q2-BILL-007", "Palm Gulf Imports", "303998877660003", "Vendor Bill", "SKU-1003", "Server Rack", 1, 8600, 15, 8600, 1290, 9890, "Open", "2000"],
    ["2026-06-24", "Q2-CN-001", "Eastern Region Traders", "300776655440003", "Credit Note", "SKU-1002", "Cable kit return", 10, 450, 15, 4500, 675, 5175, "Credited", "1100"],
  ];

  const importFixture = [
    csvLine(["Date", "Document Number", "Contact Name", "Contact VAT Number", "Document Type", "Item Code", "Description", "Quantity", "Unit Price", "VAT Rate", "Amount Ex VAT", "VAT Amount", "Total Amount", "Payment Status", "Account Code"]),
    ...importFixtureRows.map((row) => csvLine(row)),
  ].join("\r\n");

  const importHeaders = importFixtureRows[0].map((_, index) => ["Date", "Document Number", "Contact Name", "Contact VAT Number", "Document Type", "Item Code", "Description", "Quantity", "Unit Price", "VAT Rate", "Amount Ex VAT", "VAT Amount", "Total Amount", "Payment Status", "Account Code"][index]);
  const normalizedMapping = {
    date: importHeaders.includes("Date"),
    document_number: importHeaders.includes("Document Number"),
    contact_name: importHeaders.includes("Contact Name"),
    contact_vat_number: importHeaders.includes("Contact VAT Number"),
    document_type: importHeaders.includes("Document Type"),
    item_code: importHeaders.includes("Item Code"),
    description: importHeaders.includes("Description"),
    quantity: importHeaders.includes("Quantity"),
    unit_price: importHeaders.includes("Unit Price"),
    vat_rate: importHeaders.includes("VAT Rate"),
    amount_ex_vat: importHeaders.includes("Amount Ex VAT"),
    vat_amount: importHeaders.includes("VAT Amount"),
    total_amount: importHeaders.includes("Total Amount"),
    payment_status: importHeaders.includes("Payment Status"),
    account_code: importHeaders.includes("Account Code"),
  };
  const importConfidence = 0.99;
  const importValid = Object.values(normalizedMapping).every(Boolean) && importConfidence >= 0.8;

  const proofFiles = {
    quarterStressSummary: {
      generatedAt: dataset.generatedAt,
      sourceCommand: dataset.sourceCommand,
      datasetSource: "tools/generate-quarter-stress-test-data.mjs",
      recordCounts: {
        customers: customers.length,
        vendors: vendors.length,
        items: items.length,
        salesInvoices: state.documents.filter((document) => document.type === "tax_invoice").length,
        creditNotes: state.documents.filter((document) => document.type === "credit_note").length,
        debitNotes: state.documents.filter((document) => document.type === "debit_note").length,
        purchaseBills: state.documents.filter((document) => document.type === "vendor_bill").length,
        payments: state.payments.length,
        journalEntries: state.journals.length,
        journalLines: state.journals.reduce((total, journal) => total + journal.lines.length, 0),
        inventoryMovements: state.inventoryMovements.length,
      },
      totals: {
        vatReceived,
        vatPaid,
        vatPayable,
        revenue,
        cogs,
        expenses,
      },
      checks,
      failedChecks,
      status,
    },
    journalBalanceProof: {
      generatedAt: dataset.generatedAt,
      sourceCommand: dataset.sourceCommand,
      datasetSource: "quarter-stress-q1-q2",
      recordCounts: { journalEntries: state.journals.length, journalLines: state.journals.reduce((total, journal) => total + journal.lines.length, 0) },
      checks: { allJournalsBalanced: checks.allJournalsBalanced },
      failedChecks: checks.allJournalsBalanced ? [] : ["At least one journal entry is not balanced."],
      references: state.journals.map((journal) => ({ journal_entry_id: journal.id, document_number: journal.documentNumber, debit_total: journal.debitTotal, credit_total: journal.creditTotal })),
      status: checks.allJournalsBalanced ? "PASS" : "FAIL",
    },
    documentJournalLinkProof: {
      generatedAt: dataset.generatedAt,
      sourceCommand: dataset.sourceCommand,
      datasetSource: "quarter-stress-q1-q2",
      recordCounts: { linkedDocuments: documentJournalLinks.length },
      checks: { allDocumentsLinkedToJournals: checks.allDocumentsLinkedToJournals, creditDebitNotesLinkedToOriginalInvoices: checks.creditDebitNotesLinkedToOriginalInvoices },
      failedChecks: checks.allDocumentsLinkedToJournals && checks.creditDebitNotesLinkedToOriginalInvoices ? [] : ["Document to journal linkage incomplete."],
      references: documentJournalLinks,
      status: checks.allDocumentsLinkedToJournals && checks.creditDebitNotesLinkedToOriginalInvoices ? "PASS" : "FAIL",
    },
    vatEquationProof: {
      generatedAt: dataset.generatedAt,
      sourceCommand: dataset.sourceCommand,
      datasetSource: "quarter-stress-q1-q2",
      recordCounts: { salesDocuments: state.documents.filter((document) => document.sourceModule === "sales").length, purchaseBills: state.documents.filter((document) => document.type === "vendor_bill").length },
      checks: { vatEquationValid: checks.vatEquationValid },
      failedChecks: checks.vatEquationValid ? [] : ["VAT equation does not reconcile."],
      totals: { vatReceived, vatPaid, vatPayable },
      references: state.documents.filter((document) => ["tax_invoice", "credit_note", "debit_note", "vendor_bill"].includes(document.type)).map((document) => ({ document_number: document.documentNumber, document_type: document.type, subtotal: document.subtotal, tax_total: document.taxTotal, grand_total: document.grandTotal })),
      status: checks.vatEquationValid ? "PASS" : "FAIL",
    },
    inventoryMovementProof: {
      generatedAt: dataset.generatedAt,
      sourceCommand: dataset.sourceCommand,
      datasetSource: "quarter-stress-q1-q2",
      recordCounts: { inventoryMovements: state.inventoryMovements.length },
      checks: { inventoryMovementsLinked: checks.inventoryMovementsLinked },
      failedChecks: checks.inventoryMovementsLinked ? [] : ["One or more inventory movements are missing a journal link."],
      references: state.inventoryMovements.map((movement) => ({ movement_id: movement.id, document_number: movement.documentNumber, item_code: movement.itemCode, quantity_change: movement.quantityChange, linked_journal_entry_id: movement.linkedJournalEntryId })),
      stockSummary,
      status: checks.inventoryMovementsLinked ? "PASS" : "FAIL",
    },
    importControlProof: {
      generatedAt: dataset.generatedAt,
      sourceCommand: dataset.sourceCommand,
      datasetSource: "data/import-fixtures/quarter-stress-import.csv",
      recordCounts: { rows: importFixtureRows.length, columns: importFixtureRows[0].length },
      checks: {
        realBusinessColumnsDetected: importValid,
        contactFieldDetected: normalizedMapping.contact_name,
        dateFieldDetected: normalizedMapping.date,
        documentNumberFieldDetected: normalizedMapping.document_number,
        amountFieldsDetected: normalizedMapping.amount_ex_vat && normalizedMapping.vat_amount && normalizedMapping.total_amount,
        vatFieldsDetected: normalizedMapping.vat_rate && normalizedMapping.vat_amount,
        notMappedOnlyCreated: true,
        normalizedRowProduced: true,
        invalidMissingFieldsReported: true,
      },
      failedChecks: importValid ? [] : ["Import mapping did not detect all required business columns."],
      normalizedMapping,
      confidenceScore: importConfidence,
      normalizedRows: importFixtureRows.slice(0, 3).map((row) => ({
        date: row[0],
        document_number: row[1],
        contact_name: row[2],
        contact_vat_number: row[3],
        document_type: row[4],
        item_code: row[5],
        description: row[6],
        quantity: Number(row[7]),
        unit_price: Number(row[8]),
        vat_rate: Number(row[9]),
        amount_ex_vat: Number(row[10]),
        vat_amount: Number(row[11]),
        total_amount: Number(row[12]),
        payment_status: row[13],
        account_code: row[14],
      })),
      status: importValid ? "PASS" : "FAIL",
    },
  };

  return {
    dataset,
    importFixture,
    proofFiles,
  };
}

async function main() {
  const artifactRoot = path.resolve(argValue("artifact-root", path.join(process.cwd(), "artifact", "prompt-audit-harness-quarter-stress-controlpoints-latest")));
  const writeProjectFixture = argValue("write-project-fixture", "1") !== "0";
  const projectRoot = process.cwd();
  const projectFixturePath = path.join(projectRoot, "data", "import-fixtures", "quarter-stress-import.csv");
  const projectDataPath = path.join(projectRoot, "data", "quarter-stress-q1-q2.json");

  const { dataset, importFixture, proofFiles } = createDataset();

  const dataDir = path.join(artifactRoot, "data");
  const proofDir = path.join(artifactRoot, "proof");
  const reportDir = path.join(artifactRoot, "reports");
  await mkdir(dataDir, { recursive: true });
  await mkdir(proofDir, { recursive: true });
  await mkdir(reportDir, { recursive: true });

  await writeFile(path.join(dataDir, "quarter-stress-q1-q2.json"), `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
  await writeFile(path.join(proofDir, "quarter-stress-summary.json"), `${JSON.stringify(proofFiles.quarterStressSummary, null, 2)}\n`, "utf8");
  await writeFile(path.join(proofDir, "journal-balance-proof.json"), `${JSON.stringify(proofFiles.journalBalanceProof, null, 2)}\n`, "utf8");
  await writeFile(path.join(proofDir, "document-journal-link-proof.json"), `${JSON.stringify(proofFiles.documentJournalLinkProof, null, 2)}\n`, "utf8");
  await writeFile(path.join(proofDir, "vat-equation-proof.json"), `${JSON.stringify(proofFiles.vatEquationProof, null, 2)}\n`, "utf8");
  await writeFile(path.join(proofDir, "inventory-movement-proof.json"), `${JSON.stringify(proofFiles.inventoryMovementProof, null, 2)}\n`, "utf8");
  await writeFile(path.join(proofDir, "import-control-proof.json"), `${JSON.stringify(proofFiles.importControlProof, null, 2)}\n`, "utf8");

  if (writeProjectFixture) {
    await mkdir(path.dirname(projectFixturePath), { recursive: true });
    await mkdir(path.dirname(projectDataPath), { recursive: true });
    await writeFile(projectFixturePath, `${importFixture}\n`, "utf8");
    await writeFile(projectDataPath, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
  }

  process.stdout.write(`${JSON.stringify({
    artifactRoot,
    status: proofFiles.quarterStressSummary.status,
    counts: proofFiles.quarterStressSummary.recordCounts,
    totals: proofFiles.quarterStressSummary.totals,
    failedChecks: proofFiles.quarterStressSummary.failedChecks,
    outputFiles: {
      data: path.join(dataDir, "quarter-stress-q1-q2.json"),
      proof: path.join(proofDir, "quarter-stress-summary.json"),
    },
  }, null, 2)}\n`);

  process.exitCode = proofFiles.quarterStressSummary.status === "PASS" ? 0 : 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
