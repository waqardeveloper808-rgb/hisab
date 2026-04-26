export type DocumentStatus =
  | "draft"
  | "issued"
  | "sent"
  | "viewed"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "void"
  | "accepted"
  | "rejected"
  | "expired"
  | "applied"
  | "cleared"
  | "pending"
  | "low_stock"
  | "out_of_stock"
  | "in_stock";

export type DocumentKind =
  | "invoice"
  | "quotation"
  | "proforma"
  | "credit_note"
  | "debit_note"
  | "payment"
  | "stock_movement"
  | "product";

export type CurrencyCode = "SAR";

export type Customer = {
  id: string;
  legalName: string;
  legalNameAr?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  city?: string;
  /** Full street / multi-line address for template preview when set. */
  addressEn?: string;
  addressAr?: string;
  vatNumber?: string;
  outstandingBalance: number;
};

export type DocumentLine = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

export type DocumentRecord = {
  id: string;
  number: string;
  kind: DocumentKind;
  customerId: string;
  issueDate: string;
  dueDate: string;
  status: DocumentStatus;
  currency: CurrencyCode;
  subtotal: number;
  vat: number;
  total: number;
  balance: number;
  lines: DocumentLine[];
  notes?: string;
  templateId?: string;
};

export type PaymentRecord = {
  id: string;
  number: string;
  date: string;
  customerId: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  method: "bank_transfer" | "card" | "cash" | "wallet";
  reference: string;
  status: "cleared" | "pending";
};

export type StockItem = {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  onHand: number;
  reorderLevel: number;
  costPrice: number;
  /** Average unit cost (preview data — same as cost basis for this demo). */
  avgUnitCost: number;
  /** Positive or negative value vs prior period; demo field. */
  inventoryValueDelta: number;
  salePrice: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  lastMovement: string;
  inventoryTracking: boolean;
  /** Warehouse or bin label when applicable. */
  warehouse?: string;
};

export type Product = {
  id: string;
  /** Product or service code */
  sku: string;
  name: string;
  type: "product" | "service";
  category: string;
  /** Sale price / base price */
  salePrice: number;
  status: "active" | "archived";
  description?: string;
  /** When true, quantities follow stock levels; services may be false. */
  inventoryTracking: boolean;
  /** Quantity on hand when tracking; null when not applicable. */
  qtyOnHand: number | null;
  avgUnitCost: number | null;
  /** Inventory value change indicator for the period (demo). */
  inventoryValueDelta: number | null;
};

export type VendorRecord = {
  id: string;
  vendorCode: string;
  legalName: string;
  status: "active" | "on_hold" | "archived";
  vatNumber?: string;
  city: string;
  lastActivity: string;
};

export type SupplierPaymentRecord = {
  id: string;
  number: string;
  date: string;
  vendorId: string;
  billNumber: string;
  amount: number;
  method: "bank_transfer" | "card" | "cash" | "wallet";
  reference: string;
  status: "cleared" | "pending";
};

export type TemplateDocumentType =
  | "invoice"
  | "simplified_invoice"
  | "quotation"
  | "proforma"
  | "credit_note"
  | "debit_note"
  | "delivery_note"
  | "purchase_order";

export type TemplateRecord = {
  id: string;
  name: string;
  documentType: TemplateDocumentType;
  style: "standard" | "modern" | "compact";
  language: "english" | "arabic" | "bilingual";
  isDefault: boolean;
  updatedAt: string;
  /**
   * Studio presentation: `zatca_standard` applies ZATCA-oriented defaults
   * (A4, 10mm margins, clean QR for tax types). Foundation only — not clearance.
   */
  presentation?: "default" | "zatca_standard";
};

export type ActivityEntry = {
  id: string;
  at: string;
  actor: string;
  description: string;
  target?: string;
  kind: "create" | "update" | "send" | "payment" | "system";
};
