import type { ContactPayload, ContactRecord, ItemPayload, ItemRecord, TransactionKind, TransactionLine } from "@/components/workflow/types";
import type { Attachment } from "@/lib/accounting-engine";
import type { ImportExecutionSummary, StatementImportLineInput } from "@/lib/reconciliation-import";

export type { ContactPayload, ContactRecord, ItemPayload, ItemRecord, TransactionKind, TransactionLine } from "@/components/workflow/types";

type ApiEnvelope<T> = {
  data: T;
};

type BackendContact = {
  id: number;
  type: "customer" | "supplier";
  display_name: string;
  email?: string | null;
  phone?: string | null;
  tax_number?: string | null;
  vat_number?: string | null;
  custom_fields?: Record<string, unknown> | null;
  billing_address?: {
    city?: string | null;
    country?: string | null;
    line_1?: string | null;
    street_name?: string | null;
    district?: string | null;
    building_number?: string | null;
    postal_code?: string | null;
    secondary_number?: string | null;
  } | null;
};

type BackendItem = {
  id: number;
  type: "product" | "service";
  inventory_classification?: string | null;
  name: string;
  sku?: string | null;
  description?: string | null;
  default_sale_price?: string | number | null;
  default_purchase_price?: string | number | null;
  is_active: boolean;
  tax_category?: {
    name?: string | null;
    rate?: string | number | null;
  } | null;
};

type BackendContactSummary = {
  display_name?: string | null;
};

type BackendDocument = {
  id: number;
  type: string;
  status: string;
  contact_id?: number | null;
  source_document_id?: number | null;
  reversal_of_document_id?: number | null;
  template_id?: number | null;
  cost_center_id?: number | null;
  document_number?: string | null;
  issue_date?: string | null;
  supply_date?: string | null;
  due_date?: string | null;
  notes?: string | null;
  status_reason?: string | null;
  version?: number | null;
  grand_total?: string | number | null;
  balance_due?: string | number | null;
  paid_total?: string | number | null;
  tax_total?: string | number | null;
  taxable_total?: string | number | null;
  contact?: BackendContactSummary | null;
  custom_fields?: Record<string, unknown> | null;
  compliance_metadata?: Record<string, unknown> | null;
};

type BackendPayment = {
  id: number;
  direction: "incoming" | "outgoing";
  status: string;
  payment_number?: string | null;
  payment_date?: string | null;
  amount?: string | number | null;
  allocated_total?: string | number | null;
  unallocated_amount?: string | number | null;
  method?: string | null;
  reference?: string | null;
};

type BackendSettings = {
  default_language: string;
  invoice_prefix: string;
  credit_note_prefix: string;
  payment_prefix: string;
  vendor_bill_prefix: string;
  purchase_invoice_prefix: string;
  purchase_credit_note_prefix: string;
  default_receivable_account_code: string;
  default_payable_account_code: string;
  default_revenue_account_code: string;
  default_expense_account_code: string;
  default_cash_account_code: string;
  default_customer_advance_account_code: string;
  default_supplier_advance_account_code: string;
  default_vat_payable_account_code: string;
  default_vat_receivable_account_code: string;
  zatca_environment: string;
  numbering_rules?: Record<string, string> | null;
};

type BackendCompanySettingsEnvelope = {
  company: {
    legal_name: string;
    trade_name?: string | null;
    tax_number?: string | null;
    registration_number?: string | null;
    base_currency: string;
    locale: string;
    timezone: string;
  };
  settings: BackendSettings;
};

type BackendWorkspaceAccessProfile = {
  user: {
    id: number;
    name: string;
    email: string;
    platform_role?: string | null;
    is_platform_active: boolean;
  };
  platform_abilities: string[];
  company: {
    id: number;
    legal_name: string;
    is_active: boolean;
  };
  membership: {
    role: string;
    is_active: boolean;
    permissions?: string[] | null;
    abilities: string[];
  } | null;
  subscription: {
    id: number;
    status: string;
    plan_code: string;
    plan_name: string;
    monthly_price_sar: string | number;
    trial_days: number;
    trial_ends_at?: string | null;
    started_at?: string | null;
    plan?: {
      invoice_limit?: number | null;
      customer_limit?: number | null;
      accountant_seat_limit?: number | null;
      feature_flags?: Record<string, boolean | number | string | null> | null;
    } | null;
  } | null;
  referral: {
    referral_code: string;
    agent_name?: string | null;
  } | null;
};

type BackendSubscriptionPlan = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  monthly_price_sar: string | number;
  annual_price_sar?: string | number | null;
  trial_days: number;
  invoice_limit?: number | null;
  customer_limit?: number | null;
  accountant_seat_limit?: number | null;
  feature_flags?: Record<string, boolean | number | string | null> | null;
  marketing_points?: string[] | null;
  is_visible: boolean;
  is_free: boolean;
  is_paid: boolean;
  is_active: boolean;
  sort_order?: number | null;
};

type BackendProductConfig = {
  support_display_name: string;
  support_whatsapp_number: string;
  support_email: string;
  free_trial_days: number;
  free_invoice_limit: number;
  paid_plan_monthly_price_sar: string | number;
  default_agent_commission_rate: string | number;
};

type BackendPlatformAgent = {
  id: number;
  name?: string | null;
  email?: string | null;
  referral_code: string;
  commission_rate: string | number;
  is_active: boolean;
  referrals_count: number;
  pending_commission: string | number;
  earned_commission: string | number;
};

type BackendPlatformCustomer = {
  id: number;
  legal_name: string;
  trade_name?: string | null;
  tax_number?: string | null;
  registration_number?: string | null;
  base_currency: string;
  locale: string;
  timezone: string;
  is_active: boolean;
  suspended_reason?: string | null;
  owner?: {
    name?: string | null;
    email?: string | null;
  } | null;
  users: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
  }>;
  subscription?: {
    plan_id?: number | null;
    status: string;
    plan_code: string;
    plan_name: string;
    monthly_price_sar: string | number;
  } | null;
  referral_source?: {
    referral_code: string;
    agent_name?: string | null;
  } | null;
};

type BackendSupportAccount = {
  id: number;
  name: string;
  email: string;
  platform_role: string;
  support_permissions?: string[] | null;
  is_platform_active: boolean;
};

type BackendCompanyUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  permissions?: string[] | null;
  joined_at?: string | null;
};

type BackendCompanyUsersEnvelope = {
  seat_limit?: number | null;
  users: BackendCompanyUser[];
};

type BackendDocumentLineDetail = {
  id: number;
  item_id?: number | null;
  ledger_account_id?: number | null;
  cost_center_id?: number | null;
  description: string;
  quantity: string | number;
  unit_price: string | number;
  gross_amount: string | number;
  metadata?: {
    custom_fields?: Record<string, string | number | boolean | null> | null;
  } | null;
};

type BackendDocumentCenterRecord = BackendDocument & {
  title?: string | null;
  language_code?: string | null;
  sent_at?: string | null;
  sent_to_email?: string | null;
  custom_fields?: Record<string, string | number | boolean | null> | null;
  template?: {
    id: number;
    name: string;
  } | null;
};

type BackendDocumentDetail = BackendDocumentCenterRecord & {
  lines: BackendDocumentLineDetail[];
};

type BackendDocumentPreview = {
  html: string;
};

type BackendDocumentTemplate = {
  id: number;
  name: string;
  document_types?: string[] | null;
  locale_mode: string;
  accent_color: string;
  watermark_text?: string | null;
  header_html?: string | null;
  footer_html?: string | null;
  settings?: Record<string, string> | null;
  logo_asset_id?: number | null;
  logo_asset?: {
    id: number;
    public_url: string;
    original_name: string;
  } | null;
  is_default: boolean;
  is_active: boolean;
};

type BackendCompanyAsset = {
  id: number;
  type: string;
  usage?: string | null;
  original_name: string;
  mime_type?: string | null;
  extension?: string | null;
  size_bytes: number;
  public_url: string;
  is_active: boolean;
  metadata?: {
    dominant_colors?: string[] | null;
    generated_theme?: Record<string, string> | null;
    transparent_background?: boolean | null;
    width?: number | null;
    height?: number | null;
  } | null;
};

type BackendCustomFieldDefinition = {
  id: number;
  name: string;
  slug: string;
  field_type: string;
  placement: string;
  applies_to?: string[] | null;
  options?: string[] | null;
  is_active: boolean;
};

type BackendCostCenter = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
};

export type WorkspaceDocumentRecord = {
  id: number;
  type: string;
  status: string;
  number: string;
  issueDate: string;
  supplyDate: string;
  dueDate: string;
  grandTotal: number;
  balanceDue: number;
  paidTotal: number;
  taxableTotal: number;
  taxTotal: number;
  contactName: string;
  sourceDocumentId: number | null;
  reversalOfDocumentId: number | null;
  statusReason: string;
  version: number;
  customFields: Record<string, unknown>;
};

export type WorkspacePaymentRecord = {
  id: number;
  direction: "incoming" | "outgoing";
  status: string;
  number: string;
  paymentDate: string;
  amount: number;
  allocatedTotal: number;
  unallocatedAmount: number;
  method: string;
  reference: string;
};

export type DashboardSnapshot = {
  openInvoices: number;
  openBills: number;
  receivablesTotal: number;
  payablesTotal: number;
  vatLines: number;
  recentInvoices: WorkspaceDocumentRecord[];
  recentBills: WorkspaceDocumentRecord[];
  recentPayments: WorkspacePaymentRecord[];
  backendReady: boolean;
};

export type RegistersSnapshot = {
  invoiceRegister: WorkspaceDocumentRecord[];
  billsRegister: WorkspaceDocumentRecord[];
  paymentsRegister: WorkspacePaymentRecord[];
  backendReady: boolean;
};

export type VatSummaryRow = {
  code: string;
  name: string;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
};

export type VatDetailRow = {
  code: string;
  name: string;
  rate: number;
  outputTaxableAmount: number;
  outputTaxAmount: number;
  inputTaxableAmount: number;
  inputTaxAmount: number;
};

export type VatReceivedDetailRecord = {
  id: number;
  invoiceNumber: string;
  date: string;
  customer: string;
  taxableAmount: number;
  vatAmount: number;
};

export type VatPaidDetailRecord = {
  id: number;
  reference: string;
  date: string;
  vendor: string;
  vatAmount: number;
  category: string;
};

export type IntelligenceSuggestionRecord = {
  label: string;
  reason: string;
  confidence: number;
};

export type IntelligenceAnomalyRecord = {
  severity: "info" | "warning" | "critical";
  message: string;
  confidence: number;
};

export type IntelligenceReminderRecord = {
  label: string;
  reason: string;
  priority: "low" | "medium" | "high";
};

export type IntelligenceSnapshot = {
  suggestions: IntelligenceSuggestionRecord[];
  anomalies: IntelligenceAnomalyRecord[];
  reminders: IntelligenceReminderRecord[];
  confidenceScore: number;
  patterns?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
};

export type InventoryStockRecord = {
  id: number;
  itemId: number | null;
  productName: string;
  material: string;
  inventoryType: string;
  size: string;
  source: "production" | "purchase";
  code: string;
  onHand: number;
  committed: number;
  available: number;
  reorderLevel: number;
  batchNumber: string;
  productionDate: string;
  recordedBy: string;
  journalEntryNumber: string;
  inventoryAccountCode: string;
  inventoryAccountName: string;
  attachments: Attachment[];
  documentLinks: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;
  lastUpdated: string;
};

export type InventoryAdjustmentRecord = {
  id: number;
  date: string;
  reference: string;
  reason: string;
  itemCount: number;
  status: "draft" | "posted";
  code: string;
  productName: string;
  quantity: number;
  source: "production" | "purchase";
  recordedBy: string;
  journalEntryNumber: string;
  inventoryAccountCode: string;
  inventoryAccountName: string;
  attachments: Attachment[];
  documentLinks: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;
  transactionType?: string;
};

export type InventoryCreatePayload = {
  itemId?: number | null;
  productName: string;
  material: string;
  inventoryType: string;
  size: string;
  source: "production" | "purchase";
  code: string;
  quantity: number;
  committed?: number;
  reorderLevel?: number;
  batchNumber?: string;
  productionDate?: string;
  recordedBy?: string;
  journalEntryNumber?: string;
  inventoryAccountCode?: string;
  inventoryAccountName?: string;
  attachments?: Attachment[];
  documentLinks?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;
  unitCost?: number;
  offsetAccountCode?: string;
  revenueAccountCode?: string;
  cogsAccountCode?: string;
  transactionDate?: string;
};

export type InventoryAdjustmentPayload = {
  inventoryItemId: number;
  quantityDelta: number;
  unitCost?: number;
  reason: string;
  reference?: string;
  transactionDate?: string;
  adjustmentAccountCode?: string;
  attachments?: Attachment[];
  documentLinks?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;
  notes?: string;
};

export type InventorySalePayload = {
  inventoryItemId: number;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  taxRate?: number;
  cashAccountCode?: string;
  reference?: string;
  transactionDate?: string;
  proformaInvoice?: string;
  taxInvoice?: string;
  deliveryNote?: string;
  attachments?: Attachment[];
  documentLinks?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;
};

export type AgingRow = {
  documentNumber: string;
  balanceDue: number;
  bucket: string;
};

export type TrialBalanceRow = {
  code: string;
  name: string;
  type: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
};

export type ProfitLossLine = {
  code: string;
  name: string;
  type: string;
  netAmount: number;
};

export type BalanceSheetLine = {
  code: string;
  name: string;
  type: string;
  balance: number;
};

export type AuditTrailRow = {
  id: number;
  event: string;
  auditableType: string;
  auditableId: number;
  createdAt: string;
};

export type ReportsSnapshot = {
  vatSummary: VatSummaryRow[];
  vatDetail: VatDetailRow[];
  vatReceivedDetails: VatReceivedDetailRecord[];
  vatPaidDetails: VatPaidDetailRecord[];
  receivablesAging: AgingRow[];
  payablesAging: AgingRow[];
  trialBalance: TrialBalanceRow[];
  profitLoss: {
    lines: ProfitLossLine[];
    revenueTotal: number;
    expenseTotal: number;
    netProfit: number;
  };
  balanceSheet: {
    assets: BalanceSheetLine[];
    liabilities: BalanceSheetLine[];
    equity: BalanceSheetLine[];
    assetTotal: number;
    liabilityTotal: number;
    equityTotal: number;
  };
  profitByCustomer: Array<{
    contactId: number;
    contactName: string;
    revenue: number;
    estimatedCost: number;
    profit: number;
  }>;
  profitByProduct: Array<{
    itemId: number;
    itemName: string;
    quantity: number;
    revenue: number;
    estimatedCost: number;
    profit: number;
  }>;
  expenseBreakdown: Array<{
    categoryCode: string;
    categoryName: string;
    total: number;
  }>;
  auditTrail: AuditTrailRow[];
  backendReady: boolean;
};

type BackendIntelligenceEnvelope = {
  suggestions: Array<{ label: string; reason: string; confidence: string | number }>;
  anomalies: Array<{ severity: "info" | "warning" | "critical"; message: string; confidence: string | number }>;
  reminders: Array<{ label: string; reason: string; priority: "low" | "medium" | "high" }>;
  confidenceScore: string | number;
  patterns?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
};

export type GeneralLedgerRow = {
  id: number;
  entryNumber: string;
  entryDate: string;
  accountCode: string;
  accountName: string;
  contactName: string;
  documentNumber: string;
  costCenterCode: string;
  costCenterName: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
};

export type BooksSnapshot = {
  trialBalance: TrialBalanceRow[];
  generalLedger: GeneralLedgerRow[];
  auditTrail: AuditTrailRow[];
  backendReady: boolean;
};

export type CompanySettingsSnapshot = {
  company: {
    legalName: string;
    tradeName: string;
    arabicName: string;
    englishName: string;
    taxNumber: string;
    registrationNumber: string;
    phone: string;
    email: string;
    fax: string;
    baseCurrency: string;
    locale: string;
    timezone: string;
    addressBuildingNumber: string;
    addressStreet: string;
    addressArea: string;
    addressCity: string;
    addressPostalCode: string;
    addressAdditionalNumber: string;
    addressCountry: string;
    shortAddress: string;
    industry: string;
    organizationSize: string;
  };
  settings: {
    defaultLanguage: string;
    invoicePrefix: string;
    creditNotePrefix: string;
    paymentPrefix: string;
    vendorBillPrefix: string;
    purchaseInvoicePrefix: string;
    purchaseCreditNotePrefix: string;
    defaultReceivableAccountCode: string;
    defaultPayableAccountCode: string;
    defaultRevenueAccountCode: string;
    defaultExpenseAccountCode: string;
    defaultCashAccountCode: string;
    defaultCustomerAdvanceAccountCode: string;
    defaultSupplierAdvanceAccountCode: string;
    defaultVatPayableAccountCode: string;
    defaultVatReceivableAccountCode: string;
    zatcaEnvironment: string;
    numberingRules: Record<string, string>;
  };
};

const settingsMetadataKeys = {
  arabicName: "company_arabic_name",
  englishName: "company_english_name",
  phone: "company_phone",
  email: "company_email",
  fax: "company_fax",
  addressBuildingNumber: "company_address_building_number",
  addressStreet: "company_address_street",
  addressArea: "company_address_area",
  addressCity: "company_address_city",
  addressPostalCode: "company_address_postal_code",
  addressAdditionalNumber: "company_address_additional_number",
  addressCountry: "company_address_country",
  shortAddress: "company_short_address",
  industry: "company_industry",
  organizationSize: "company_organization_size",
} as const;

function readSettingsMetadata(rules: Record<string, string>, key: keyof typeof settingsMetadataKeys) {
  return rules[settingsMetadataKeys[key]] ?? "";
}

function mergeCompanyMetadataIntoRules(snapshot: CompanySettingsSnapshot) {
  return {
    ...snapshot.settings.numberingRules,
    [settingsMetadataKeys.arabicName]: snapshot.company.arabicName,
    [settingsMetadataKeys.englishName]: snapshot.company.englishName,
    [settingsMetadataKeys.phone]: snapshot.company.phone,
    [settingsMetadataKeys.email]: snapshot.company.email,
    [settingsMetadataKeys.fax]: snapshot.company.fax,
    [settingsMetadataKeys.addressBuildingNumber]: snapshot.company.addressBuildingNumber,
    [settingsMetadataKeys.addressStreet]: snapshot.company.addressStreet,
    [settingsMetadataKeys.addressArea]: snapshot.company.addressArea,
    [settingsMetadataKeys.addressCity]: snapshot.company.addressCity,
    [settingsMetadataKeys.addressPostalCode]: snapshot.company.addressPostalCode,
    [settingsMetadataKeys.addressAdditionalNumber]: snapshot.company.addressAdditionalNumber,
    [settingsMetadataKeys.addressCountry]: snapshot.company.addressCountry,
    [settingsMetadataKeys.shortAddress]: snapshot.company.shortAddress,
    [settingsMetadataKeys.industry]: snapshot.company.industry,
    [settingsMetadataKeys.organizationSize]: snapshot.company.organizationSize,
  };
}

export type AgentReferralRecord = {
  id: number;
  name: string;
  email: string;
  signedUpAt: string;
  commissionAmount: number;
  commissionStatus: string;
  subscription: {
    planName: string;
    status: string;
    monthlyPriceSar: number;
    trialEndsAt: string;
    activatedAt: string;
  } | null;
};

export type AgentDashboardSnapshot = {
  agent: {
    referralCode: string;
    commissionRate: number;
    isActive: boolean;
  };
  summary: {
    totalReferrals: number;
    totalSignups: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    pendingCommission: number;
    earnedCommission: number;
  };
  referrals: AgentReferralRecord[];
  backendReady: boolean;
};

export type WorkspaceAccessProfile = {
  user: {
    id: number;
    name: string;
    email: string;
    platformRole: string;
    isPlatformActive: boolean;
  };
  platformAbilities: string[];
  company: {
    id: number;
    legalName: string;
    isActive: boolean;
  };
  membership: {
    role: string;
    isActive: boolean;
    permissions: string[];
    abilities: string[];
  } | null;
  subscription: {
    id: number;
    status: string;
    planCode: string;
    planName: string;
    monthlyPriceSar: number;
    trialDays: number;
    trialEndsAt: string;
    startedAt: string;
    limits: {
      invoiceLimit: number | null;
      customerLimit: number | null;
      accountantSeatLimit: number | null;
    };
    featureFlags: Record<string, boolean | number | string | null>;
  } | null;
  referral: {
    referralCode: string;
    agentName: string;
  } | null;
};

export type SubscriptionPlanRecord = {
  id: number;
  code: string;
  name: string;
  description: string;
  monthlyPriceSar: number;
  annualPriceSar: number;
  trialDays: number;
  invoiceLimit: number | null;
  customerLimit: number | null;
  accountantSeatLimit: number | null;
  featureFlags: Record<string, boolean | number | string | null>;
  marketingPoints: string[];
  isVisible: boolean;
  isFree: boolean;
  isPaid: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type PlatformConfigRecord = {
  supportDisplayName: string;
  supportWhatsappNumber: string;
  supportEmail: string;
  freeTrialDays: number;
  freeInvoiceLimit: number;
  paidPlanMonthlyPriceSar: number;
  defaultAgentCommissionRate: number;
};

export type PlatformAgentRecord = {
  id: number;
  name: string;
  email: string;
  referralCode: string;
  commissionRate: number;
  isActive: boolean;
  referralsCount: number;
  pendingCommission: number;
  earnedCommission: number;
};

export type PlatformCustomerRecord = {
  id: number;
  legalName: string;
  tradeName: string;
  taxNumber: string;
  registrationNumber: string;
  baseCurrency: string;
  locale: string;
  timezone: string;
  isActive: boolean;
  suspendedReason: string;
  owner: {
    name: string;
    email: string;
  };
  users: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  }>;
  subscription: {
    planId: number | null;
    status: string;
    planCode: string;
    planName: string;
    monthlyPriceSar: number;
  } | null;
  referralSource: {
    referralCode: string;
    agentName: string;
  } | null;
};

export type SupportAccountRecord = {
  id: number;
  name: string;
  email: string;
  platformRole: string;
  supportPermissions: string[];
  isPlatformActive: boolean;
};

export type CompanyUserRecord = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  permissions: string[];
  joinedAt: string;
};

export type CompanyUsersSnapshot = {
  seatLimit: number | null;
  users: CompanyUserRecord[];
};

export type DocumentLineDetailRecord = {
  id: number;
  itemBackendId: number | null;
  ledgerAccountId: number | null;
  costCenterId: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  customFields: Record<string, string | number | boolean | null>;
};

export type DocumentCenterRecord = WorkspaceDocumentRecord & {
  title: string;
  languageCode: string;
  sentAt: string;
  sentToEmail: string;
  templateName: string;
  customFields: Record<string, string | number | boolean | null>;
};

export type DocumentDetailRecord = DocumentCenterRecord & {
  contactBackendId: number | null;
  templateId: number | null;
  costCenterId: number | null;
  notes: string;
  purchaseContext: {
    type: string;
    purpose: string;
    category: string;
  };
  lines: DocumentLineDetailRecord[];
};

export type DocumentPreviewRecord = {
  html: string;
};

export type TemplatePdfDownloadRecord = {
  fileName: string;
  url: string;
};

export type DocumentTemplateRecord = {
  id: number;
  name: string;
  documentTypes: string[];
  localeMode: string;
  accentColor: string;
  watermarkText: string;
  headerHtml: string;
  footerHtml: string;
  settings: Record<string, string | number | boolean | null>;
  logoAssetId: number | null;
  logoAssetUrl: string;
  isDefault: boolean;
  isActive: boolean;
};

type BackendCommunicationAttempt = {
  id: number;
  attempt_number: number;
  channel: string;
  transport?: string | null;
  status: string;
  target_address?: string | null;
  subject?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  attempted_at?: string | null;
  completed_at?: string | null;
};

type BackendCommunicationTemplate = {
  id: number;
  code: string;
  name: string;
  channel: string;
  source_type?: string | null;
  subject_template?: string | null;
  body_html_template?: string | null;
  body_text_template?: string | null;
  variables?: string[] | null;
  is_default: boolean;
  is_active: boolean;
  last_used_at?: string | null;
};

type BackendCommunication = {
  id: number;
  source_type?: string | null;
  source_id?: number | null;
  source_record_type?: string | null;
  channel: string;
  direction: string;
  status: string;
  target_address?: string | null;
  target_name?: string | null;
  subject?: string | null;
  body_text?: string | null;
  retry_count?: number | null;
  metadata?: Record<string, unknown> | null;
  learning_snapshot?: Record<string, unknown> | null;
  queued_at?: string | null;
  last_attempt_at?: string | null;
  dispatched_at?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  cancelled_at?: string | null;
  created_at?: string | null;
  template?: BackendCommunicationTemplate | null;
  attempts?: BackendCommunicationAttempt[] | null;
};

export type CommunicationAttemptRecord = {
  id: number;
  attemptNumber: number;
  channel: string;
  transport: string;
  status: string;
  targetAddress: string;
  subject: string;
  errorCode: string;
  errorMessage: string;
  attemptedAt: string;
  completedAt: string;
};

export type CommunicationTemplateOptionRecord = {
  id: number;
  code: string;
  name: string;
  channel: string;
  sourceType: string;
  subjectTemplate: string;
  bodyHtmlTemplate: string;
  bodyTextTemplate: string;
  variables: string[];
  isDefault: boolean;
  isActive: boolean;
  lastUsedAt: string;
};

export type CommunicationRecord = {
  id: number;
  sourceType: string;
  sourceId: number | null;
  sourceRecordType: string;
  channel: string;
  direction: string;
  status: string;
  targetAddress: string;
  targetName: string;
  subject: string;
  bodyText: string;
  retryCount: number;
  metadata: Record<string, unknown>;
  learningSnapshot: Record<string, unknown>;
  queuedAt: string;
  lastAttemptAt: string;
  dispatchedAt: string;
  deliveredAt: string;
  failedAt: string;
  cancelledAt: string;
  createdAt: string;
  template: CommunicationTemplateOptionRecord | null;
  attempts: CommunicationAttemptRecord[];
};

export type CompanyAssetRecord = {
  id: number;
  type: string;
  usage: string;
  originalName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  publicUrl: string;
  isActive: boolean;
  metadata: {
    dominantColors: string[];
    generatedTheme: Record<string, string>;
    transparentBackground: boolean;
    width: number;
    height: number;
  } | null;
};

export type CustomFieldDefinitionRecord = {
  id: number;
  name: string;
  slug: string;
  fieldType: string;
  placement: string;
  appliesTo: string[];
  options: string[];
  isActive: boolean;
};

export type CostCenterRecord = {
  id: number;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
};

export type DirectorySnapshot = {
  customers: ContactRecord[];
  suppliers: ContactRecord[];
  items: ItemRecord[];
};

type TransactionSubmissionPayload = {
  kind: TransactionKind;
  documentId?: number;
  documentType?: string;
  title?: string;
  templateId?: number | null;
  costCenterId?: number | null;
  languageCode?: "en" | "ar";
  customFields?: Record<string, string | number | boolean | null>;
  purchaseContext?: {
    type?: string;
    purpose?: string;
    category?: string;
  };
  attachments?: Array<{ name: string; url: string }>;
  contact: ContactRecord;
  sourceDocumentId?: number | null;
  supplyDate?: string;
  statusReason?: string;
  reference: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  lines: TransactionLine[];
  items: ItemRecord[];
  paymentAmount?: number;
  paymentMethod?: string;
  paymentReference?: string;
};

export type TransactionSubmissionResult = {
  document: WorkspaceDocumentRecord;
  payment: WorkspacePaymentRecord | null;
};

export type TranslationResult = {
  prompt: string;
  translatedText: string;
};

const workspaceApiBase = "/api/workspace";
const companySettingsStorageKey = "gulf-hisab:preview-company-settings";

const inflightWorkspaceReads = new Map<string, Promise<unknown>>();
export type WorkspaceResponseMode = "backend" | "preview";
type WorkspaceRequestInit = RequestInit & {
  expectedMode?: WorkspaceResponseMode | "any";
};

const fallbackCompanySettingsSnapshot: CompanySettingsSnapshot = {
  company: {
    legalName: "",
    tradeName: "",
    arabicName: "",
    englishName: "",
    taxNumber: "",
    registrationNumber: "",
    phone: "",
    email: "",
    fax: "",
    baseCurrency: "SAR",
    locale: "en-SA",
    timezone: "Asia/Riyadh",
    addressBuildingNumber: "7421",
    addressStreet: "King Fahd Road",
    addressArea: "Al Olaya District",
    addressCity: "Riyadh",
    addressPostalCode: "12214",
    addressAdditionalNumber: "3184",
    addressCountry: "Saudi Arabia",
    shortAddress: "Riyadh 12214",
    industry: "Trading",
    organizationSize: "SME",
  },
  settings: {
    defaultLanguage: "en",
    invoicePrefix: "INV",
    creditNotePrefix: "CRN",
    paymentPrefix: "PAY",
    vendorBillPrefix: "BIL",
    purchaseInvoicePrefix: "PINV",
    purchaseCreditNotePrefix: "PCRN",
    defaultReceivableAccountCode: "1100",
    defaultPayableAccountCode: "2000",
    defaultRevenueAccountCode: "4000",
    defaultExpenseAccountCode: "6900",
    defaultCashAccountCode: "1200",
    defaultCustomerAdvanceAccountCode: "2300",
    defaultSupplierAdvanceAccountCode: "1410",
    defaultVatPayableAccountCode: "2200",
    defaultVatReceivableAccountCode: "1300",
    zatcaEnvironment: "sandbox",
    numberingRules: {},
  },
};

function getWorkspaceApiBase() {
  return workspaceApiBase;
}
const platformApiBase = "/api/platform";

function getPlatformApiBase() {
  return platformApiBase;
}

function cloneCompanySettingsSnapshot(snapshot: CompanySettingsSnapshot): CompanySettingsSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as CompanySettingsSnapshot;
}

function readStoredCompanySettings(): CompanySettingsSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(companySettingsStorageKey);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as CompanySettingsSnapshot;
  } catch {
    return null;
  }
}

function writeStoredCompanySettings(snapshot: CompanySettingsSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(companySettingsStorageKey, JSON.stringify(snapshot));
  } catch {
    // Ignore storage failures in restricted browser contexts.
  }
}

function getFallbackCompanySettingsSnapshot() {
  return cloneCompanySettingsSnapshot(readStoredCompanySettings() ?? fallbackCompanySettingsSnapshot);
}

async function request<T>(path: string, init?: WorkspaceRequestInit): Promise<T> {
  const { expectedMode = "backend", ...fetchInit } = init ?? {};
  const headers = new Headers(fetchInit.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${getWorkspaceApiBase()}/${path}`, {
      ...fetchInit,
      credentials: fetchInit.credentials ?? "include",
      cache: "no-store",
      headers,
    });
  } catch (fetchError) {
    if (fetchInit.signal?.aborted || (fetchError instanceof Error && fetchError.name === "AbortError")) {
      throw fetchError;
    }
    const message = fetchError instanceof Error ? fetchError.message : "Failed to fetch from workspace API";
    throw new Error(`Workspace API fetch failed: ${message}`);
  }

  const responseMode = response.headers.get("X-Workspace-Mode")?.toLowerCase();

  if (response.ok && expectedMode !== "any" && responseMode && responseMode !== expectedMode) {
    throw new Error(`Workspace API mode mismatch: expected ${expectedMode}, received ${responseMode}.`);
  }

  if (! response.ok) {
    throw new Error(await extractErrorMessage(response, `Request failed for ${path}`));
  }

  let jsonData: T;
  try {
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.warn(`[workspace-api] non-JSON response for ${path}: ${contentType}`);
    }
    jsonData = await response.json() as T;
  } catch (parseError) {
    const message = parseError instanceof Error ? parseError.message : "Failed to parse JSON response";
    console.error(`[workspace-api] JSON parse error for ${path}:`, message);
    throw new Error(`Workspace API response parse failed for ${path}: ${message}`);
  }

  return jsonData;
}

async function ensureTemplateId(templateId: number | null | undefined, documentType: string): Promise<number> {
  if (typeof templateId === "number") {
    return templateId;
  }

  const templates = await listDocumentTemplates();
  const selected = templates.find((template) => template.isDefault && template.isActive && (template.documentTypes.length === 0 || template.documentTypes.includes(documentType)))
    ?? templates.find((template) => template.isActive && (template.documentTypes.length === 0 || template.documentTypes.includes(documentType)))
    ?? null;

  if (!selected) {
    throw new Error("A real active template is required before creating or updating a document.");
  }

  return selected.id;
}

function dedupeWorkspaceRead<T>(key: string, factory: () => Promise<T>) {
  const currentRequest = inflightWorkspaceReads.get(key) as Promise<T> | undefined;

  if (currentRequest) {
    return currentRequest;
  }

  const nextRequest = factory().finally(() => {
    if (inflightWorkspaceReads.get(key) === nextRequest) {
      inflightWorkspaceReads.delete(key);
    }
  });

  inflightWorkspaceReads.set(key, nextRequest);
  return nextRequest;
}

async function platformRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getPlatformApiBase()}/${path}`, {
    ...init,
    credentials: init?.credentials ?? "same-origin",
    cache: "no-store",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (! response.ok) {
    throw new Error(await extractErrorMessage(response, `Request failed for platform/${path}`));
  }

  return response.json() as Promise<T>;
}

async function extractErrorMessage(response: Response, fallback: string) {
  const payload = await response.text();

  if (! payload) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(payload) as {
      message?: string;
      errors?: Record<string, string[] | string>;
    };

    if (parsed.message) {
      return parsed.message;
    }

    const firstErrorGroup = parsed.errors ? Object.values(parsed.errors)[0] : null;

    if (Array.isArray(firstErrorGroup) && firstErrorGroup.length) {
      return firstErrorGroup[0];
    }

    if (typeof firstErrorGroup === "string" && firstErrorGroup) {
      return firstErrorGroup;
    }
  } catch {
    return payload;
  }

  return payload;
}

function numberValue(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

function mapContact(contact: BackendContact): ContactRecord {
  const customFields = contact.custom_fields ?? {};

  return {
    id: String(contact.id),
    backendId: contact.id,
    kind: contact.type,
    displayName: contact.display_name,
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    city: contact.billing_address?.city ?? "",
    country: contact.billing_address?.country ?? String(customFields.country ?? ""),
    origin: String(customFields.origin ?? "inside_ksa") === "outside_ksa" ? "outside_ksa" : "inside_ksa",
    vatNumber: contact.tax_number ?? contact.vat_number ?? String(customFields.vat_number ?? ""),
    street: contact.billing_address?.line_1 ?? String(customFields.street ?? ""),
    buildingNumber: contact.billing_address?.building_number ?? String(customFields.building_number ?? ""),
    district: contact.billing_address?.district ?? String(customFields.district ?? ""),
    postalCode: contact.billing_address?.postal_code ?? String(customFields.postal_code ?? ""),
    secondaryNumber: contact.billing_address?.secondary_number ?? String(customFields.secondary_number ?? ""),
    crNumber: String(customFields.cr_number ?? ""),
    additionalDocumentNumbers: String(customFields.additional_document_numbers ?? ""),
    defaultRevenueAccount: String(customFields.default_revenue_account ?? ""),
    defaultCostCenter: String(customFields.default_cost_center ?? ""),
    defaultTax: String(customFields.default_tax ?? ""),
    purchasingDefaults: String(customFields.purchasing_defaults ?? ""),
    beneficiaryName: String(customFields.beneficiary_name ?? ""),
    beneficiaryBank: String(customFields.beneficiary_bank ?? ""),
    beneficiaryIban: String(customFields.beneficiary_iban ?? ""),
    beneficiaryReference: String(customFields.beneficiary_reference ?? ""),
    customFields: String(customFields.notes ?? ""),
  };
}

function mapItem(item: BackendItem): ItemRecord {
  const taxName = item.tax_category?.name?.trim();
  const taxRate = item.tax_category?.rate;
  const numericRate = taxRate !== undefined && taxRate !== null ? numberValue(taxRate) : null;
  const normalizedTaxName = taxName ? taxName.replace(/\s+/g, " ") : "";
  const taxNameAlreadyIncludesRate = normalizedTaxName
    ? /\b\d+(?:\.\d+)?\s*%\b/.test(normalizedTaxName)
      || (numericRate !== null && normalizedTaxName.toLowerCase().includes(String(numericRate).toLowerCase()))
    : false;
  const taxLabel = taxName
    ? numericRate !== null && !taxNameAlreadyIncludesRate
      ? `${normalizedTaxName} ${numericRate}%`
      : normalizedTaxName
    : "Standard VAT";

  return {
    id: String(item.id),
    backendId: item.id,
    kind: item.type,
    inventoryClassification: item.inventory_classification ?? undefined,
    name: item.name,
    sku: item.sku ?? "",
    description: item.description ?? "",
    category: item.type === "product" ? "Products" : "Services",
    salePrice: numberValue(item.default_sale_price),
    purchasePrice: numberValue(item.default_purchase_price),
    taxLabel,
    isActive: item.is_active,
  };
}

function mapDocument(document: BackendDocument): WorkspaceDocumentRecord {
  return {
    id: document.id,
    type: document.type,
    status: document.status,
    number: document.document_number ?? "Draft",
    issueDate: document.issue_date ?? "",
    supplyDate: document.supply_date ?? document.issue_date ?? "",
    dueDate: document.due_date ?? "",
    grandTotal: numberValue(document.grand_total),
    balanceDue: numberValue(document.balance_due),
    paidTotal: numberValue(document.paid_total),
    taxableTotal: numberValue(document.taxable_total),
    taxTotal: numberValue(document.tax_total),
    contactName: document.contact?.display_name ?? "",
    sourceDocumentId: document.source_document_id ?? null,
    reversalOfDocumentId: document.reversal_of_document_id ?? null,
    statusReason: document.status_reason ?? "",
    version: document.version ?? 1,
    customFields: document.custom_fields ?? {},
  };
}

function mapPayment(payment: BackendPayment): WorkspacePaymentRecord {
  return {
    id: payment.id,
    direction: payment.direction,
    status: payment.status,
    number: payment.payment_number ?? "Payment",
    paymentDate: payment.payment_date ?? "",
    amount: numberValue(payment.amount),
    allocatedTotal: numberValue(payment.allocated_total),
    unallocatedAmount: numberValue(payment.unallocated_amount),
    method: payment.method ?? "",
    reference: payment.reference ?? "",
  };
}

function mapCompanySettings(payload: BackendCompanySettingsEnvelope): CompanySettingsSnapshot {
  const numberingRules = payload.settings.numbering_rules ?? {};

  return {
    company: {
      legalName: payload.company.legal_name,
      tradeName: payload.company.trade_name ?? "",
      arabicName: readSettingsMetadata(numberingRules, "arabicName"),
      englishName: readSettingsMetadata(numberingRules, "englishName"),
      taxNumber: payload.company.tax_number ?? "",
      registrationNumber: payload.company.registration_number ?? "",
      phone: readSettingsMetadata(numberingRules, "phone"),
      email: readSettingsMetadata(numberingRules, "email"),
      fax: readSettingsMetadata(numberingRules, "fax"),
      baseCurrency: payload.company.base_currency,
      locale: payload.company.locale,
      timezone: payload.company.timezone,
      addressBuildingNumber: readSettingsMetadata(numberingRules, "addressBuildingNumber"),
      addressStreet: readSettingsMetadata(numberingRules, "addressStreet"),
      addressArea: readSettingsMetadata(numberingRules, "addressArea"),
      addressCity: readSettingsMetadata(numberingRules, "addressCity"),
      addressPostalCode: readSettingsMetadata(numberingRules, "addressPostalCode"),
      addressAdditionalNumber: readSettingsMetadata(numberingRules, "addressAdditionalNumber"),
      addressCountry: readSettingsMetadata(numberingRules, "addressCountry"),
      shortAddress: readSettingsMetadata(numberingRules, "shortAddress"),
      industry: readSettingsMetadata(numberingRules, "industry"),
      organizationSize: readSettingsMetadata(numberingRules, "organizationSize"),
    },
    settings: {
      defaultLanguage: payload.settings.default_language,
      invoicePrefix: payload.settings.invoice_prefix,
      creditNotePrefix: payload.settings.credit_note_prefix,
      paymentPrefix: payload.settings.payment_prefix,
      vendorBillPrefix: payload.settings.vendor_bill_prefix,
      purchaseInvoicePrefix: payload.settings.purchase_invoice_prefix,
      purchaseCreditNotePrefix: payload.settings.purchase_credit_note_prefix,
      defaultReceivableAccountCode: payload.settings.default_receivable_account_code,
      defaultPayableAccountCode: payload.settings.default_payable_account_code,
      defaultRevenueAccountCode: payload.settings.default_revenue_account_code,
      defaultExpenseAccountCode: payload.settings.default_expense_account_code,
      defaultCashAccountCode: payload.settings.default_cash_account_code,
      defaultCustomerAdvanceAccountCode: payload.settings.default_customer_advance_account_code,
      defaultSupplierAdvanceAccountCode: payload.settings.default_supplier_advance_account_code,
      defaultVatPayableAccountCode: payload.settings.default_vat_payable_account_code,
      defaultVatReceivableAccountCode: payload.settings.default_vat_receivable_account_code,
      zatcaEnvironment: payload.settings.zatca_environment,
      numberingRules,
    },
  };
}

export function mapWorkspaceAccessProfile(payload: BackendWorkspaceAccessProfile): WorkspaceAccessProfile {
  return {
    user: {
      id: payload.user.id,
      name: payload.user.name,
      email: payload.user.email,
      platformRole: payload.user.platform_role ?? "customer",
      isPlatformActive: payload.user.is_platform_active,
    },
    platformAbilities: payload.platform_abilities ?? [],
    company: {
      id: payload.company.id,
      legalName: payload.company.legal_name,
      isActive: payload.company.is_active,
    },
    membership: payload.membership ? {
      role: payload.membership.role,
      isActive: payload.membership.is_active,
      permissions: payload.membership.permissions ?? [],
      abilities: payload.membership.abilities ?? [],
    } : null,
    subscription: payload.subscription ? {
      id: payload.subscription.id,
      status: payload.subscription.status,
      planCode: payload.subscription.plan_code,
      planName: payload.subscription.plan_name,
      monthlyPriceSar: numberValue(payload.subscription.monthly_price_sar),
      trialDays: payload.subscription.trial_days,
      trialEndsAt: payload.subscription.trial_ends_at ?? "",
      startedAt: payload.subscription.started_at ?? "",
      limits: {
        invoiceLimit: payload.subscription.plan?.invoice_limit ?? null,
        customerLimit: payload.subscription.plan?.customer_limit ?? null,
        accountantSeatLimit: payload.subscription.plan?.accountant_seat_limit ?? null,
      },
      featureFlags: payload.subscription.plan?.feature_flags ?? {},
    } : null,
    referral: payload.referral ? {
      referralCode: payload.referral.referral_code,
      agentName: payload.referral.agent_name ?? "",
    } : null,
  };
}

function mapSubscriptionPlan(plan: BackendSubscriptionPlan): SubscriptionPlanRecord {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: plan.description ?? "",
    monthlyPriceSar: numberValue(plan.monthly_price_sar),
    annualPriceSar: numberValue(plan.annual_price_sar),
    trialDays: plan.trial_days,
    invoiceLimit: plan.invoice_limit ?? null,
    customerLimit: plan.customer_limit ?? null,
    accountantSeatLimit: plan.accountant_seat_limit ?? null,
    featureFlags: plan.feature_flags ?? {},
    marketingPoints: plan.marketing_points ?? [],
    isVisible: plan.is_visible,
    isFree: plan.is_free,
    isPaid: plan.is_paid,
    isActive: plan.is_active,
    sortOrder: plan.sort_order ?? 0,
  };
}

function mapPlatformConfig(config: BackendProductConfig): PlatformConfigRecord {
  return {
    supportDisplayName: config.support_display_name,
    supportWhatsappNumber: config.support_whatsapp_number,
    supportEmail: config.support_email,
    freeTrialDays: config.free_trial_days,
    freeInvoiceLimit: config.free_invoice_limit,
    paidPlanMonthlyPriceSar: numberValue(config.paid_plan_monthly_price_sar),
    defaultAgentCommissionRate: numberValue(config.default_agent_commission_rate),
  };
}

function mapPlatformAgent(agent: BackendPlatformAgent): PlatformAgentRecord {
  return {
    id: agent.id,
    name: agent.name ?? "",
    email: agent.email ?? "",
    referralCode: agent.referral_code,
    commissionRate: numberValue(agent.commission_rate),
    isActive: agent.is_active,
    referralsCount: agent.referrals_count,
    pendingCommission: numberValue(agent.pending_commission),
    earnedCommission: numberValue(agent.earned_commission),
  };
}

function mapPlatformCustomer(customer: BackendPlatformCustomer): PlatformCustomerRecord {
  return {
    id: customer.id,
    legalName: customer.legal_name,
    tradeName: customer.trade_name ?? "",
    taxNumber: customer.tax_number ?? "",
    registrationNumber: customer.registration_number ?? "",
    baseCurrency: customer.base_currency,
    locale: customer.locale,
    timezone: customer.timezone,
    isActive: customer.is_active,
    suspendedReason: customer.suspended_reason ?? "",
    owner: {
      name: customer.owner?.name ?? "",
      email: customer.owner?.email ?? "",
    },
    users: customer.users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
    })),
    subscription: customer.subscription ? {
      planId: customer.subscription.plan_id ?? null,
      status: customer.subscription.status,
      planCode: customer.subscription.plan_code,
      planName: customer.subscription.plan_name,
      monthlyPriceSar: numberValue(customer.subscription.monthly_price_sar),
    } : null,
    referralSource: customer.referral_source ? {
      referralCode: customer.referral_source.referral_code,
      agentName: customer.referral_source.agent_name ?? "",
    } : null,
  };
}

function mapSupportAccount(account: BackendSupportAccount): SupportAccountRecord {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    platformRole: account.platform_role,
    supportPermissions: account.support_permissions ?? [],
    isPlatformActive: account.is_platform_active,
  };
}

function mapCompanyUser(user: BackendCompanyUser): CompanyUserRecord {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.is_active,
    permissions: user.permissions ?? [],
    joinedAt: user.joined_at ?? "",
  };
}

function mapDocumentCenterRecord(document: BackendDocumentCenterRecord): DocumentCenterRecord {
  return {
    ...mapDocument(document),
    title: document.title ?? "",
    languageCode: document.language_code ?? "en",
    sentAt: document.sent_at ?? "",
    sentToEmail: document.sent_to_email ?? "",
    templateName: document.template?.name ?? "",
    customFields: document.custom_fields ?? {},
  };
}

function mapDocumentDetail(document: BackendDocumentDetail): DocumentDetailRecord {
  const purchaseContext = (document.compliance_metadata?.purchase_context ?? {}) as Record<string, string | undefined>;

  return {
    ...mapDocumentCenterRecord(document),
    contactBackendId: document.contact_id ?? null,
    templateId: document.template_id ?? null,
    costCenterId: document.cost_center_id ?? null,
    notes: document.notes ?? "",
    purchaseContext: {
      type: purchaseContext.type ?? "",
      purpose: purchaseContext.purpose ?? "",
      category: purchaseContext.category ?? "",
    },
    lines: document.lines.map((line) => ({
      id: line.id,
      itemBackendId: line.item_id ?? null,
      ledgerAccountId: line.ledger_account_id ?? null,
      costCenterId: line.cost_center_id ?? null,
      description: line.description,
      quantity: numberValue(line.quantity),
      unitPrice: numberValue(line.unit_price),
      grossAmount: numberValue(line.gross_amount),
      customFields: line.metadata?.custom_fields ?? {},
    })),
  };
}

function mapDocumentTemplate(template: BackendDocumentTemplate): DocumentTemplateRecord {
  const normalizedName = (() => {
    const layout = typeof template.settings?.layout === "string" ? template.settings.layout : "";
    if (layout === "classic_corporate" || template.name === "Classic Corporate") {
      return "Standard";
    }
    if (layout === "modern_carded" || template.name === "Modern Carded") {
      return "Modern";
    }
    if (layout === "industrial_supply" || template.name === "Industrial / Supply Chain") {
      return "Compact";
    }
    return template.name;
  })();

  return {
    id: template.id,
    name: normalizedName,
    documentTypes: template.document_types ?? [],
    localeMode: template.locale_mode,
    accentColor: template.accent_color,
    watermarkText: template.watermark_text ?? "",
    headerHtml: template.header_html ?? "",
    footerHtml: template.footer_html ?? "",
    settings: template.settings ?? {},
    logoAssetId: template.logo_asset_id ?? null,
    logoAssetUrl: template.logo_asset?.public_url ?? "",
    isDefault: template.is_default,
    isActive: template.is_active,
  };
}

function mapCommunicationTemplate(template: BackendCommunicationTemplate): CommunicationTemplateOptionRecord {
  return {
    id: template.id,
    code: template.code,
    name: template.name,
    channel: template.channel,
    sourceType: template.source_type ?? "",
    subjectTemplate: template.subject_template ?? "",
    bodyHtmlTemplate: template.body_html_template ?? "",
    bodyTextTemplate: template.body_text_template ?? "",
    variables: Array.isArray(template.variables) ? template.variables.map(String) : [],
    isDefault: Boolean(template.is_default),
    isActive: Boolean(template.is_active),
    lastUsedAt: template.last_used_at ?? "",
  };
}

function mapCommunicationAttempt(attempt: BackendCommunicationAttempt): CommunicationAttemptRecord {
  return {
    id: attempt.id,
    attemptNumber: attempt.attempt_number,
    channel: attempt.channel,
    transport: attempt.transport ?? "",
    status: attempt.status,
    targetAddress: attempt.target_address ?? "",
    subject: attempt.subject ?? "",
    errorCode: attempt.error_code ?? "",
    errorMessage: attempt.error_message ?? "",
    attemptedAt: attempt.attempted_at ?? "",
    completedAt: attempt.completed_at ?? "",
  };
}

function mapCommunication(record: BackendCommunication): CommunicationRecord {
  return {
    id: record.id,
    sourceType: record.source_type ?? "",
    sourceId: typeof record.source_id === "number" ? record.source_id : null,
    sourceRecordType: record.source_record_type ?? "",
    channel: record.channel,
    direction: record.direction,
    status: record.status,
    targetAddress: record.target_address ?? "",
    targetName: record.target_name ?? "",
    subject: record.subject ?? "",
    bodyText: record.body_text ?? "",
    retryCount: typeof record.retry_count === "number" ? record.retry_count : 0,
    metadata: record.metadata ?? {},
    learningSnapshot: record.learning_snapshot ?? {},
    queuedAt: record.queued_at ?? "",
    lastAttemptAt: record.last_attempt_at ?? "",
    dispatchedAt: record.dispatched_at ?? "",
    deliveredAt: record.delivered_at ?? "",
    failedAt: record.failed_at ?? "",
    cancelledAt: record.cancelled_at ?? "",
    createdAt: record.created_at ?? "",
    template: record.template ? mapCommunicationTemplate(record.template) : null,
    attempts: Array.isArray(record.attempts) ? record.attempts.map(mapCommunicationAttempt) : [],
  };
}

function mapCompanyAsset(asset: BackendCompanyAsset): CompanyAssetRecord {
  return {
    id: asset.id,
    type: asset.type,
    usage: asset.usage ?? "",
    originalName: asset.original_name,
    mimeType: asset.mime_type ?? "",
    extension: asset.extension ?? "",
    sizeBytes: asset.size_bytes,
    publicUrl: asset.public_url,
    isActive: asset.is_active,
    metadata: asset.metadata ? {
      dominantColors: asset.metadata.dominant_colors ?? [],
      generatedTheme: asset.metadata.generated_theme ?? {},
      transparentBackground: Boolean(asset.metadata.transparent_background),
      width: numberValue(asset.metadata.width),
      height: numberValue(asset.metadata.height),
    } : null,
  };
}

function mapCustomFieldDefinition(field: BackendCustomFieldDefinition): CustomFieldDefinitionRecord {
  return {
    id: field.id,
    name: field.name,
    slug: field.slug,
    fieldType: field.field_type,
    placement: field.placement,
    appliesTo: field.applies_to ?? [],
    options: field.options ?? [],
    isActive: field.is_active,
  };
}

function mapCostCenter(costCenter: BackendCostCenter): CostCenterRecord {
  return {
    id: costCenter.id,
    name: costCenter.name,
    code: costCenter.code,
    description: costCenter.description ?? "",
    isActive: costCenter.is_active,
  };
}

export async function getWorkspaceDirectory(): Promise<DirectorySnapshot | null> {
  try {
    const [customers, suppliers, items] = await Promise.all([
      request<ApiEnvelope<BackendContact[]>>("contacts?type=customer"),
      request<ApiEnvelope<BackendContact[]>>("contacts?type=supplier"),
      request<ApiEnvelope<BackendItem[]>>("items"),
    ]);

    return {
      customers: customers.data.map(mapContact),
      suppliers: suppliers.data.map(mapContact),
      items: items.data.map(mapItem),
    };
  } catch {
    return null;
  }
}

export async function createContactInBackend(payload: ContactPayload): Promise<ContactRecord | null> {
  try {
    const result = await request<ApiEnvelope<BackendContact>>("contacts", {
      method: "POST",
      body: JSON.stringify({
        type: payload.kind,
        display_name: payload.displayName,
        email: payload.email || null,
        phone: payload.phone || null,
        tax_number: payload.vatNumber || null,
        billing_address: payload.city || payload.street || payload.country ? {
          city: payload.city || null,
          country: payload.country || null,
          line_1: payload.street || null,
          street_name: payload.street || null,
          district: payload.district || null,
          building_number: payload.buildingNumber || null,
          postal_code: payload.postalCode || null,
          secondary_number: payload.secondaryNumber || null,
        } : null,
        custom_fields: {
          origin: payload.origin || "inside_ksa",
          vat_number: payload.vatNumber || null,
          country: payload.country || null,
          street: payload.street || null,
          building_number: payload.buildingNumber || null,
          district: payload.district || null,
          postal_code: payload.postalCode || null,
          secondary_number: payload.secondaryNumber || null,
          cr_number: payload.crNumber || null,
          additional_document_numbers: payload.additionalDocumentNumbers || null,
          default_revenue_account: payload.defaultRevenueAccount || null,
          default_cost_center: payload.defaultCostCenter || null,
          default_tax: payload.defaultTax || null,
          purchasing_defaults: payload.purchasingDefaults || null,
          beneficiary_name: payload.beneficiaryName || null,
          beneficiary_bank: payload.beneficiaryBank || null,
          beneficiary_iban: payload.beneficiaryIban || null,
          beneficiary_reference: payload.beneficiaryReference || null,
          notes: payload.customFields || null,
        },
      }),
    });

    return mapContact(result.data);
  } catch {
    return null;
  }
}

export async function createItemInBackend(payload: ItemPayload): Promise<ItemRecord | null> {
  try {
    const result = await request<ApiEnvelope<BackendItem>>("items", {
      method: "POST",
      body: JSON.stringify({
        type: payload.kind,
        inventory_classification: payload.inventoryClassification || null,
        name: payload.name,
        sku: payload.sku || null,
        description: payload.description || null,
        default_sale_price: payload.salePrice,
        default_purchase_price: payload.purchasePrice,
        is_active: payload.isActive ?? true,
      }),
    });

    return mapItem(result.data);
  } catch {
    return null;
  }
}

export async function getItemFromBackend(itemId: number): Promise<ItemRecord | null> {
  try {
    const result = await request<ApiEnvelope<BackendItem>>(`items/${itemId}`);
    return mapItem(result.data);
  } catch {
    return null;
  }
}

export async function updateItemInBackend(itemId: number, payload: ItemPayload): Promise<ItemRecord | null> {
  try {
    const result = await request<ApiEnvelope<BackendItem>>(`items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({
        type: payload.kind,
        inventory_classification: payload.inventoryClassification || null,
        name: payload.name,
        sku: payload.sku || null,
        description: payload.description || null,
        default_sale_price: payload.salePrice,
        default_purchase_price: payload.purchasePrice,
        is_active: payload.isActive ?? true,
      }),
    });

    return mapItem(result.data);
  } catch {
    return null;
  }
}

export async function submitTransaction(payload: TransactionSubmissionPayload): Promise<TransactionSubmissionResult> {
  const documentPath = payload.kind === "invoice" ? "sales-documents" : "purchase-documents";
  const paymentPath = payload.kind === "invoice" ? "sales-documents" : "purchase-documents";
  const documentType = payload.documentType ?? (payload.kind === "invoice" ? "tax_invoice" : "vendor_bill");
  const ensuredTemplateId = await ensureTemplateId(payload.templateId, documentType);

  const lines = payload.lines.map((line) => {
    const item = payload.items.find((candidate) => candidate.id === line.itemId);
    const itemBackendId = line.backendItemId ?? item?.backendId;

    if (! itemBackendId) {
      throw new Error("Each line must use a saved product or service before posting.");
    }

    return {
      item_id: itemBackendId,
      description: line.description || item?.name || "Line item",
      quantity: line.quantity,
      unit_price: line.price,
      cost_center_id: line.costCenterId ?? null,
      custom_fields: line.customFields ?? {},
    };
  });

  if (! payload.contact.backendId) {
    throw new Error("Choose a saved customer or supplier before posting.");
  }

  const created = await request<ApiEnvelope<BackendDocument>>(documentPath, {
    method: "POST",
    body: JSON.stringify({
      type: documentType,
      title: payload.title || null,
      template_id: ensuredTemplateId,
      cost_center_id: payload.costCenterId ?? null,
      language_code: payload.languageCode ?? "en",
      custom_fields: {
        ...(payload.customFields ?? {}),
        reference: payload.reference || null,
      },
      purchase_context: payload.kind === "bill" ? {
        type: payload.purchaseContext?.type || null,
        purpose: payload.purchaseContext?.purpose || null,
        category: payload.purchaseContext?.category || null,
      } : undefined,
      attachments: payload.attachments ?? [],
      contact_id: payload.contact.backendId,
      issue_date: payload.issueDate,
      supply_date: payload.supplyDate ?? payload.issueDate,
      due_date: payload.dueDate,
      source_document_id: payload.sourceDocumentId ?? null,
      reversal_of_document_id: payload.sourceDocumentId ?? null,
      status_reason: payload.statusReason || null,
      notes: [payload.reference, payload.notes].filter(Boolean).join("\n"),
      lines,
    }),
  });

  const finalized = await request<ApiEnvelope<BackendDocument>>(`${documentPath}/${created.data.id}/finalize`, {
    method: "POST",
  });

  let payment: WorkspacePaymentRecord | null = null;

  if ((payload.paymentAmount ?? 0) > 0 && !['proforma_invoice', 'delivery_note'].includes(documentType)) {
    const paymentResult = await request<ApiEnvelope<BackendPayment>>(`${paymentPath}/${created.data.id}/payments`, {
      method: "POST",
      body: JSON.stringify({
        amount: payload.paymentAmount,
        payment_date: payload.issueDate,
        method: payload.paymentMethod || null,
        reference: payload.paymentReference || null,
      }),
    });

    payment = mapPayment(paymentResult.data);
  }

  return {
    document: mapDocument(finalized.data),
    payment,
  };
}

export async function saveTransactionDraft(payload: TransactionSubmissionPayload): Promise<WorkspaceDocumentRecord> {
  const documentPath = payload.kind === "invoice" ? "sales-documents" : "purchase-documents";
  const documentType = payload.documentType ?? (payload.kind === "invoice" ? "tax_invoice" : "vendor_bill");
  const ensuredTemplateId = await ensureTemplateId(payload.templateId, documentType);

  const lines = payload.lines.map((line) => {
    const item = payload.items.find((candidate) => candidate.id === line.itemId);
    const itemBackendId = line.backendItemId ?? item?.backendId;

    if (! itemBackendId) {
      throw new Error("Each line must use a saved product or service before saving the draft.");
    }

    return {
      item_id: itemBackendId,
      description: line.description || item?.name || "Line item",
      quantity: line.quantity,
      unit_price: line.price,
      cost_center_id: line.costCenterId ?? null,
      custom_fields: line.customFields ?? {},
    };
  });

  if (! payload.contact.backendId) {
    throw new Error("Choose a saved customer or supplier before saving the draft.");
  }

  const created = await request<ApiEnvelope<BackendDocument>>(documentPath, {
    method: "POST",
    body: JSON.stringify({
      type: documentType,
      title: payload.title || null,
      template_id: ensuredTemplateId,
      cost_center_id: payload.costCenterId ?? null,
      language_code: payload.languageCode ?? "en",
      custom_fields: {
        ...(payload.customFields ?? {}),
        reference: payload.reference || null,
      },
      purchase_context: payload.kind === "bill" ? {
        type: payload.purchaseContext?.type || null,
        purpose: payload.purchaseContext?.purpose || null,
        category: payload.purchaseContext?.category || null,
      } : undefined,
      attachments: payload.attachments ?? [],
      contact_id: payload.contact.backendId,
      issue_date: payload.issueDate,
      supply_date: payload.supplyDate ?? payload.issueDate,
      due_date: payload.dueDate,
      source_document_id: payload.sourceDocumentId ?? null,
      reversal_of_document_id: payload.sourceDocumentId ?? null,
      status_reason: payload.statusReason || null,
      notes: [payload.reference, payload.notes].filter(Boolean).join("\n"),
      lines,
    }),
  });

  return mapDocument(created.data);
}

export async function updateTransactionDraft(payload: TransactionSubmissionPayload): Promise<WorkspaceDocumentRecord> {
  if (!payload.documentId) {
    throw new Error("A draft document id is required before updating.");
  }

  const documentPath = payload.kind === "invoice" ? "sales-documents" : "purchase-documents";
  const documentType = payload.documentType ?? (payload.kind === "invoice" ? "tax_invoice" : "vendor_bill");
  const ensuredTemplateId = await ensureTemplateId(payload.templateId, documentType);

  const lines = payload.lines.map((line) => {
    const item = payload.items.find((candidate) => candidate.id === line.itemId);
    const itemBackendId = line.backendItemId ?? item?.backendId;

    if (!itemBackendId) {
      throw new Error("Each line must use a saved product or service before saving the draft.");
    }

    return {
      item_id: itemBackendId,
      description: line.description || item?.name || "Line item",
      quantity: line.quantity,
      unit_price: line.price,
      cost_center_id: line.costCenterId ?? null,
      custom_fields: line.customFields ?? {},
    };
  });

  if (!payload.contact.backendId) {
    throw new Error("Choose a saved customer or supplier before saving the draft.");
  }

  const updated = await request<ApiEnvelope<BackendDocument>>(`${documentPath}/${payload.documentId}`, {
    method: "PUT",
    body: JSON.stringify({
      title: payload.title || null,
      template_id: ensuredTemplateId,
      cost_center_id: payload.costCenterId ?? null,
      language_code: payload.languageCode ?? "en",
      custom_fields: {
        ...(payload.customFields ?? {}),
        reference: payload.reference || null,
      },
      purchase_context: payload.kind === "bill" ? {
        type: payload.purchaseContext?.type || null,
        purpose: payload.purchaseContext?.purpose || null,
        category: payload.purchaseContext?.category || null,
      } : undefined,
      attachments: payload.attachments ?? [],
      contact_id: payload.contact.backendId,
      issue_date: payload.issueDate,
      supply_date: payload.supplyDate ?? payload.issueDate,
      due_date: payload.dueDate,
      source_document_id: payload.sourceDocumentId ?? null,
      reversal_of_document_id: payload.sourceDocumentId ?? null,
      status_reason: payload.statusReason || null,
      notes: [payload.reference, payload.notes].filter(Boolean).join("\n"),
      lines,
    }),
  });

  return mapDocument(updated.data);
}

export async function finalizeTransactionDraft(kind: TransactionKind, documentId: number): Promise<WorkspaceDocumentRecord> {
  const documentPath = kind === "invoice" ? "sales-documents" : "purchase-documents";
  const result = await request<ApiEnvelope<BackendDocument>>(`${documentPath}/${documentId}/finalize`, {
    method: "POST",
  });

  return mapDocument(result.data);
}

export async function issueSalesCreditNote(payload: {
  sourceDocumentId: number;
  issueDate: string;
  supplyDate: string;
  notes: string;
  lines: TransactionLine[];
}): Promise<WorkspaceDocumentRecord> {
  const lines = payload.lines.map((line, index) => {
    const sourceLineId = Number(line.customFields?.source_line_id ?? 0);

    if (!sourceLineId) {
      throw new Error(`Credit note line ${index + 1} is missing a source invoice line reference.`);
    }

    return {
      source_line_id: sourceLineId,
      quantity: line.quantity,
      description: line.description || null,
      unit_price: line.price,
      discount_amount: 0,
    };
  });

  const result = await request<ApiEnvelope<BackendDocument>>(`sales-documents/${payload.sourceDocumentId}/credit-notes`, {
    method: "POST",
    body: JSON.stringify({
      issue_date: payload.issueDate,
      supply_date: payload.supplyDate,
      notes: payload.notes || null,
      lines,
    }),
  });

  return mapDocument(result.data);
}

export async function issueSalesDebitNote(payload: {
  sourceDocumentId: number;
  issueDate: string;
  supplyDate: string;
  notes: string;
  statusReason?: string;
  lines: TransactionLine[];
}): Promise<WorkspaceDocumentRecord> {
  const lines = payload.lines.map((line, index) => {
    const sourceLineId = Number(line.customFields?.source_line_id ?? 0);

    if (!sourceLineId) {
      throw new Error(`Debit note line ${index + 1} is missing a source invoice line reference.`);
    }

    return {
      source_line_id: sourceLineId,
      quantity: line.quantity,
      description: line.description || null,
      unit_price: line.price,
      discount_amount: 0,
    };
  });

  const result = await request<ApiEnvelope<BackendDocument>>(`sales-documents/${payload.sourceDocumentId}/debit-notes`, {
    method: "POST",
    body: JSON.stringify({
      issue_date: payload.issueDate,
      supply_date: payload.supplyDate,
      notes: payload.notes || null,
      status_reason: payload.statusReason || null,
      lines,
    }),
  });

  return mapDocument(result.data);
}

export async function recordDocumentPayment(payload: {
  direction: "incoming" | "outgoing";
  documentId: number;
  amount: number;
  paymentDate: string;
  method: string;
  reference: string;
}): Promise<WorkspacePaymentRecord> {
  const basePath = payload.direction === "incoming" ? "sales-documents" : "purchase-documents";
  const result = await request<ApiEnvelope<BackendPayment>>(`${basePath}/${payload.documentId}/payments`, {
    method: "POST",
    body: JSON.stringify({
      amount: payload.amount,
      payment_date: payload.paymentDate,
      method: payload.method || null,
      reference: payload.reference || null,
    }),
  });

  return mapPayment(result.data);
}

export async function getDashboardSnapshot(signal?: AbortSignal): Promise<DashboardSnapshot> {
  try {
    const result = await request<ApiEnvelope<{
      open_invoices: number;
      open_bills: number;
      receivables_total: string;
      payables_total: string;
      vat_lines: number;
      recent_invoices: BackendDocument[];
      recent_bills: BackendDocument[];
      recent_payments: BackendPayment[];
    }>>("reports/dashboard-summary", { signal });

    return {
      openInvoices: result.data.open_invoices,
      openBills: result.data.open_bills,
      receivablesTotal: numberValue(result.data.receivables_total),
      payablesTotal: numberValue(result.data.payables_total),
      vatLines: result.data.vat_lines,
      recentInvoices: result.data.recent_invoices.map(mapDocument),
      recentBills: result.data.recent_bills.map(mapDocument),
      recentPayments: result.data.recent_payments.map(mapPayment),
      backendReady: true,
    };
  } catch (err) {
    throw err;
  }
}

export async function getRegistersSnapshot(): Promise<RegistersSnapshot> {
  try {
    const [invoiceRegister, billsRegister, paymentsRegister] = await Promise.all([
      request<ApiEnvelope<BackendDocument[]>>("reports/invoice-register"),
      request<ApiEnvelope<BackendDocument[]>>("reports/bills-register"),
      request<ApiEnvelope<BackendPayment[]>>("reports/payments-register"),
    ]);

    return {
      invoiceRegister: invoiceRegister.data.map(mapDocument),
      billsRegister: billsRegister.data.map(mapDocument),
      paymentsRegister: paymentsRegister.data.map(mapPayment),
      backendReady: true,
    };
  } catch (err) {
    throw err;
  }
}

export async function getReportsSnapshot(filters?: { invoiceId?: number; invoiceNumber?: string }, signal?: AbortSignal): Promise<ReportsSnapshot> {
  try {
    const impactQuery = new URLSearchParams();
    if (typeof filters?.invoiceId === "number" && Number.isFinite(filters.invoiceId) && filters.invoiceId > 0) {
      impactQuery.set("invoice_id", String(filters.invoiceId));
    }
    if (filters?.invoiceNumber) {
      impactQuery.set("invoice_number", filters.invoiceNumber);
    }
    const trialBalancePath = impactQuery.size > 0
      ? `reports/trial-balance?${impactQuery.toString()}`
      : "reports/trial-balance";

    const [vatSummary, vatDetail, vatReceivedDetails, vatPaidDetails, receivablesAging, payablesAging, trialBalance, profitLoss, balanceSheet, profitByCustomer, profitByProduct, expenseBreakdown, auditTrail] = await Promise.all([
      request<ApiEnvelope<Array<{ code: string; name: string; tax_rate: string | number; taxable_amount: string | number; tax_amount: string | number }>>>("reports/vat-summary", { signal }),
      request<ApiEnvelope<Array<{ code: string; name: string; tax_rate: string | number; output_taxable_amount: string | number; output_tax_amount: string | number; input_taxable_amount: string | number; input_tax_amount: string | number }>>>("reports/vat-detail", { signal }),
      request<ApiEnvelope<Array<{ id: number; document_number: string; issue_date: string; customer: string; taxable_amount: string | number; vat_amount: string | number }>>>("reports/vat-received-details", { signal }),
      request<ApiEnvelope<Array<{ id: number; reference: string; issue_date: string; vendor: string; vat_amount: string | number; category: string }>>>("reports/vat-paid-details", { signal }),
      request<ApiEnvelope<Array<{ document_number: string; balance_due: string | number; bucket: string }>>>("reports/receivables-aging", { signal }),
      request<ApiEnvelope<Array<{ document_number: string; balance_due: string | number; bucket: string }>>>("reports/payables-aging", { signal }),
      request<ApiEnvelope<Array<{ code: string; name: string; type: string; debit_total: string | number; credit_total: string | number; balance: string | number }>>>(trialBalancePath, { signal }),
      request<ApiEnvelope<{ lines: Array<{ code: string; name: string; type: string; net_amount: string | number }>; revenue_total: string | number; expense_total: string | number; net_profit: string | number }>>("reports/profit-loss", { signal }),
      request<ApiEnvelope<{ assets: Array<{ code: string; name: string; type: string; balance: string | number }>; liabilities: Array<{ code: string; name: string; type: string; balance: string | number }>; equity: Array<{ code: string; name: string; type: string; balance: string | number }>; asset_total: string | number; liability_total: string | number; equity_total: string | number }>>("reports/balance-sheet", { signal }),
      request<ApiEnvelope<Array<{ contact_id: number; contact_name: string; revenue: string | number; estimated_cost: string | number; profit: string | number }>>>("reports/profit-by-customer", { signal }),
      request<ApiEnvelope<Array<{ item_id: number; item_name: string; quantity: string | number; revenue: string | number; estimated_cost: string | number; profit: string | number }>>>("reports/profit-by-product", { signal }),
      request<ApiEnvelope<Array<{ category_code: string; category_name: string; total: string | number }>>>("reports/expense-breakdown", { signal }),
      request<ApiEnvelope<Array<{ id: number; event: string; auditable_type: string; auditable_id: number; created_at: string }>>>("reports/audit-trail", { signal }),
    ]);

    const toArray = <T>(val: T | T[]): T[] => (Array.isArray(val) ? val : []);

    return {
      vatSummary: toArray(vatSummary.data).map((row) => ({
        code: row.code,
        name: row.name,
        rate: numberValue(row.tax_rate),
        taxableAmount: numberValue(row.taxable_amount),
        taxAmount: numberValue(row.tax_amount),
      })),
      vatDetail: toArray(vatDetail.data).map((row) => ({
        code: row.code,
        name: row.name,
        rate: numberValue(row.tax_rate),
        outputTaxableAmount: numberValue(row.output_taxable_amount),
        outputTaxAmount: numberValue(row.output_tax_amount),
        inputTaxableAmount: numberValue(row.input_taxable_amount),
        inputTaxAmount: numberValue(row.input_tax_amount),
      })),
      vatReceivedDetails: toArray(vatReceivedDetails.data).map((row) => ({
        id: row.id,
        invoiceNumber: row.document_number,
        date: row.issue_date,
        customer: row.customer,
        taxableAmount: numberValue(row.taxable_amount),
        vatAmount: numberValue(row.vat_amount),
      })),
      vatPaidDetails: toArray(vatPaidDetails.data).map((row) => ({
        id: row.id,
        reference: row.reference,
        date: row.issue_date,
        vendor: row.vendor,
        vatAmount: numberValue(row.vat_amount),
        category: row.category,
      })),
      receivablesAging: toArray(receivablesAging.data).map((row) => ({
        documentNumber: row.document_number,
        balanceDue: numberValue(row.balance_due),
        bucket: row.bucket,
      })),
      payablesAging: toArray(payablesAging.data).map((row) => ({
        documentNumber: row.document_number,
        balanceDue: numberValue(row.balance_due),
        bucket: row.bucket,
      })),
      trialBalance: toArray(trialBalance.data).map((row) => ({
        code: row.code,
        name: row.name,
        type: row.type,
        debitTotal: numberValue(row.debit_total),
        creditTotal: numberValue(row.credit_total),
        balance: numberValue(row.balance),
      })),
      profitLoss: {
        lines: toArray(profitLoss.data.lines).map((row) => ({
          code: row.code,
          name: row.name,
          type: row.type,
          netAmount: numberValue(row.net_amount),
        })),
        revenueTotal: numberValue(profitLoss.data.revenue_total),
        expenseTotal: numberValue(profitLoss.data.expense_total),
        netProfit: numberValue(profitLoss.data.net_profit),
      },
      balanceSheet: {
        assets: toArray(balanceSheet.data.assets).map((row) => ({ ...row, balance: numberValue(row.balance) })),
        liabilities: toArray(balanceSheet.data.liabilities).map((row) => ({ ...row, balance: numberValue(row.balance) })),
        equity: toArray(balanceSheet.data.equity).map((row) => ({ ...row, balance: numberValue(row.balance) })),
        assetTotal: numberValue(balanceSheet.data.asset_total),
        liabilityTotal: numberValue(balanceSheet.data.liability_total),
        equityTotal: numberValue(balanceSheet.data.equity_total),
      },
      profitByCustomer: toArray(profitByCustomer.data).map((row) => ({
        contactId: row.contact_id,
        contactName: row.contact_name,
        revenue: numberValue(row.revenue),
        estimatedCost: numberValue(row.estimated_cost),
        profit: numberValue(row.profit),
      })),
      profitByProduct: toArray(profitByProduct.data).map((row) => ({
        itemId: row.item_id,
        itemName: row.item_name,
        quantity: numberValue(row.quantity),
        revenue: numberValue(row.revenue),
        estimatedCost: numberValue(row.estimated_cost),
        profit: numberValue(row.profit),
      })),
      expenseBreakdown: toArray(expenseBreakdown.data).map((row) => ({
        categoryCode: row.category_code,
        categoryName: row.category_name,
        total: numberValue(row.total),
      })),
      auditTrail: toArray(auditTrail.data).map((row) => ({
        id: row.id,
        event: row.event,
        auditableType: row.auditable_type,
        auditableId: row.auditable_id,
        createdAt: row.created_at,
      })),
      backendReady: true,
    };
  } catch (err) {
    throw err;
  }
}

function mapIntelligenceEnvelope(payload: BackendIntelligenceEnvelope): IntelligenceSnapshot {
  return {
    suggestions: payload.suggestions.map((row) => ({
      label: row.label,
      reason: row.reason,
      confidence: numberValue(row.confidence),
    })),
    anomalies: payload.anomalies.map((row) => ({
      severity: row.severity,
      message: row.message,
      confidence: numberValue(row.confidence),
    })),
    reminders: payload.reminders.map((row) => ({
      label: row.label,
      reason: row.reason,
      priority: row.priority,
    })),
    confidenceScore: numberValue(payload.confidenceScore),
    patterns: payload.patterns,
    metrics: payload.metrics,
  };
}

export async function getIntelligenceOverview(): Promise<IntelligenceSnapshot> {
  const result = await request<ApiEnvelope<BackendIntelligenceEnvelope>>("intelligence/overview");
  return mapIntelligenceEnvelope(result.data);
}

export async function getReportIntelligence(): Promise<IntelligenceSnapshot> {
  const result = await request<ApiEnvelope<BackendIntelligenceEnvelope>>("intelligence/reports");
  return mapIntelligenceEnvelope(result.data);
}

export async function getTransactionIntelligence(payload: {
  contactId?: number | null;
  documentType: string;
  issueDate?: string;
  dueDate?: string;
  paymentAmount?: number;
  lines: Array<{ description: string; quantity: number; unitPrice: number }>;
}): Promise<IntelligenceSnapshot> {
  const result = await request<ApiEnvelope<BackendIntelligenceEnvelope>>("intelligence/transaction", {
    method: "POST",
    body: JSON.stringify({
      contact_id: payload.contactId ?? null,
      document_type: payload.documentType,
      issue_date: payload.issueDate,
      due_date: payload.dueDate,
      payment_amount: payload.paymentAmount ?? 0,
      lines: payload.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unitPrice,
      })),
    }),
  });
  return mapIntelligenceEnvelope(result.data);
}

export async function getOpenDocumentsForPayments() {
  const registers = await getRegistersSnapshot();

  return {
    backendReady: registers.backendReady,
    incoming: registers.invoiceRegister.filter((row) => row.balanceDue > 0),
    outgoing: registers.billsRegister.filter((row) => row.balanceDue > 0),
  };
}

export async function getBooksSnapshot(filters?: { accountCode?: string; documentNumber?: string; invoiceId?: number; invoiceNumber?: string }): Promise<BooksSnapshot> {
  try {
    const trialBalanceQuery = new URLSearchParams();
    if (filters?.accountCode) {
      trialBalanceQuery.set("account_code", filters.accountCode);
    }
    if (typeof filters?.invoiceId === "number" && Number.isFinite(filters.invoiceId) && filters.invoiceId > 0) {
      trialBalanceQuery.set("invoice_id", String(filters.invoiceId));
    }
    if (filters?.invoiceNumber) {
      trialBalanceQuery.set("invoice_number", filters.invoiceNumber);
    }
    const trialBalancePath = trialBalanceQuery.size > 0
      ? `reports/trial-balance?${trialBalanceQuery.toString()}`
      : "reports/trial-balance";

    const generalLedgerQuery = new URLSearchParams();
    if (filters?.accountCode) {
      generalLedgerQuery.set("account_code", filters.accountCode);
    }
    if (filters?.documentNumber) {
      generalLedgerQuery.set("document_number", filters.documentNumber);
    }
    if (typeof filters?.invoiceId === "number" && Number.isFinite(filters.invoiceId) && filters.invoiceId > 0) {
      generalLedgerQuery.set("invoice_id", String(filters.invoiceId));
    }
    if (filters?.invoiceNumber) {
      generalLedgerQuery.set("invoice_number", filters.invoiceNumber);
    }
    const generalLedgerPath = generalLedgerQuery.size > 0
      ? `reports/general-ledger?${generalLedgerQuery.toString()}`
      : "reports/general-ledger";

    const [trialBalance, generalLedger, auditTrail] = await Promise.all([
      request<ApiEnvelope<Array<{ code: string; name: string; type: string; debit_total: string | number; credit_total: string | number; balance: string | number }>>>(trialBalancePath),
      request<ApiEnvelope<Array<{ id: number; entry_number: string; entry_date: string; account_code: string; account_name: string; contact_name?: string | null; document_number?: string | null; cost_center_code?: string | null; cost_center_name?: string | null; description?: string | null; debit: string | number; credit: string | number; running_balance: string | number }>>>(generalLedgerPath),
      request<ApiEnvelope<Array<{ id: number; event: string; auditable_type: string; auditable_id: number; created_at: string }>>>("reports/audit-trail"),
    ]);

    return {
      trialBalance: trialBalance.data.map((row) => ({
        code: row.code,
        name: row.name,
        type: row.type,
        debitTotal: numberValue(row.debit_total),
        creditTotal: numberValue(row.credit_total),
        balance: numberValue(row.balance),
      })),
      generalLedger: generalLedger.data.map((row) => ({
        id: row.id,
        entryNumber: row.entry_number,
        entryDate: row.entry_date,
        accountCode: row.account_code,
        accountName: row.account_name,
        contactName: row.contact_name ?? "",
        documentNumber: row.document_number ?? "",
        costCenterCode: row.cost_center_code ?? "",
        costCenterName: row.cost_center_name ?? "",
        description: row.description ?? "",
        debit: numberValue(row.debit),
        credit: numberValue(row.credit),
        runningBalance: numberValue(row.running_balance),
      })),
      auditTrail: auditTrail.data.map((row) => ({
        id: row.id,
        event: row.event,
        auditableType: row.auditable_type,
        auditableId: row.auditable_id,
        createdAt: row.created_at,
      })),
      backendReady: true,
    };
  } catch (err) {
    throw err;
  }
}

export async function getCompanySettings(options?: { mode?: WorkspaceResponseMode }): Promise<CompanySettingsSnapshot | null> {
  const mode = options?.mode ?? "backend";
  const path = mode === "preview" ? "settings?mode=preview" : "settings";

  try {
    const result = await request<ApiEnvelope<BackendCompanySettingsEnvelope>>(path, { expectedMode: mode });
    return mapCompanySettings(result.data);
  } catch (error) {
    if (mode === "preview") {
      return getFallbackCompanySettingsSnapshot();
    }

    throw error;
  }
}

export async function updateCompanySettings(snapshot: CompanySettingsSnapshot, options?: { mode?: WorkspaceResponseMode }): Promise<CompanySettingsSnapshot> {
  const mode = options?.mode ?? "backend";
  const numberingRules = mergeCompanyMetadataIntoRules(snapshot);
  const path = mode === "preview" ? "settings?mode=preview" : "settings";

  try {
    const result = await request<ApiEnvelope<BackendCompanySettingsEnvelope>>(path, {
      method: "PUT",
      expectedMode: mode,
      body: JSON.stringify({
        company: {
          legal_name: snapshot.company.legalName,
          trade_name: snapshot.company.tradeName || null,
          tax_number: snapshot.company.taxNumber || null,
          registration_number: snapshot.company.registrationNumber || null,
          base_currency: snapshot.company.baseCurrency,
          locale: snapshot.company.locale,
          timezone: snapshot.company.timezone,
        },
        settings: {
          default_language: snapshot.settings.defaultLanguage,
          invoice_prefix: snapshot.settings.invoicePrefix,
          credit_note_prefix: snapshot.settings.creditNotePrefix,
          payment_prefix: snapshot.settings.paymentPrefix,
          vendor_bill_prefix: snapshot.settings.vendorBillPrefix,
          purchase_invoice_prefix: snapshot.settings.purchaseInvoicePrefix,
          purchase_credit_note_prefix: snapshot.settings.purchaseCreditNotePrefix,
          default_receivable_account_code: snapshot.settings.defaultReceivableAccountCode,
          default_payable_account_code: snapshot.settings.defaultPayableAccountCode,
          default_revenue_account_code: snapshot.settings.defaultRevenueAccountCode,
          default_expense_account_code: snapshot.settings.defaultExpenseAccountCode,
          default_cash_account_code: snapshot.settings.defaultCashAccountCode,
          default_customer_advance_account_code: snapshot.settings.defaultCustomerAdvanceAccountCode,
          default_supplier_advance_account_code: snapshot.settings.defaultSupplierAdvanceAccountCode,
          default_vat_payable_account_code: snapshot.settings.defaultVatPayableAccountCode,
          default_vat_receivable_account_code: snapshot.settings.defaultVatReceivableAccountCode,
          zatca_environment: snapshot.settings.zatcaEnvironment,
          numbering_rules: numberingRules,
        },
      }),
    });

    const mapped = mapCompanySettings(result.data);
    if (mode === "preview") {
      writeStoredCompanySettings(mapped);
    }
    return mapped;
  } catch (error) {
    if (mode !== "preview") {
      throw error;
    }

    const fallback = {
      company: {
        ...snapshot.company,
      },
      settings: {
        ...snapshot.settings,
        numberingRules,
      },
    };
    writeStoredCompanySettings(fallback);
    return fallback;
  }
}

export function isBackendConfigured() {
  throw new Error("Backend configuration is server-side only; use a workspace API request to validate backend availability.");
}

export async function getAgentDashboard(): Promise<AgentDashboardSnapshot> {
  try {
    const result = await request<ApiEnvelope<{
      agent: { referral_code: string; commission_rate: string | number; is_active: boolean };
      summary: {
        total_referrals: number;
        total_signups: number;
        total_subscriptions: number;
        active_subscriptions: number;
        pending_commission: string | number;
        earned_commission: string | number;
      };
      referrals: Array<{
        id: number;
        name?: string | null;
        email?: string | null;
        signed_up_at?: string | null;
        commission_amount: string | number;
        commission_status: string;
        subscription?: {
          plan_name: string;
          status: string;
          monthly_price_sar: string | number;
          trial_ends_at?: string | null;
          activated_at?: string | null;
        } | null;
      }>;
    }>>("agents/dashboard");

    return {
      agent: {
        referralCode: result.data.agent.referral_code,
        commissionRate: numberValue(result.data.agent.commission_rate),
        isActive: result.data.agent.is_active,
      },
      summary: {
        totalReferrals: result.data.summary.total_referrals,
        totalSignups: result.data.summary.total_signups,
        totalSubscriptions: result.data.summary.total_subscriptions,
        activeSubscriptions: result.data.summary.active_subscriptions,
        pendingCommission: numberValue(result.data.summary.pending_commission),
        earnedCommission: numberValue(result.data.summary.earned_commission),
      },
      referrals: result.data.referrals.map((referral) => ({
        id: referral.id,
        name: referral.name ?? "Pending contact",
        email: referral.email ?? "",
        signedUpAt: referral.signed_up_at ?? "",
        commissionAmount: numberValue(referral.commission_amount),
        commissionStatus: referral.commission_status,
        subscription: referral.subscription ? {
          planName: referral.subscription.plan_name,
          status: referral.subscription.status,
          monthlyPriceSar: numberValue(referral.subscription.monthly_price_sar),
          trialEndsAt: referral.subscription.trial_ends_at ?? "",
          activatedAt: referral.subscription.activated_at ?? "",
        } : null,
      })),
      backendReady: true,
    };
  } catch (err) {
    throw err;
  }
}

export async function getWorkspaceAccessProfile(): Promise<WorkspaceAccessProfile | null> {
  try {
    const result = await request<ApiEnvelope<BackendWorkspaceAccessProfile>>("access-profile");
    return mapWorkspaceAccessProfile(result.data);
  } catch {
    return null;
  }
}

export async function getPlatformConfig(): Promise<PlatformConfigRecord | null> {
  try {
    const result = await platformRequest<ApiEnvelope<BackendProductConfig>>("config");
    return mapPlatformConfig(result.data);
  } catch {
    return null;
  }
}

export async function updatePlatformConfig(config: PlatformConfigRecord): Promise<PlatformConfigRecord> {
  const result = await platformRequest<ApiEnvelope<BackendProductConfig>>("config", {
    method: "PUT",
    body: JSON.stringify({
      support_display_name: config.supportDisplayName,
      support_whatsapp_number: config.supportWhatsappNumber,
      support_email: config.supportEmail,
      free_trial_days: config.freeTrialDays,
      free_invoice_limit: config.freeInvoiceLimit,
      paid_plan_monthly_price_sar: config.paidPlanMonthlyPriceSar,
      default_agent_commission_rate: config.defaultAgentCommissionRate,
    }),
  });

  return mapPlatformConfig(result.data);
}

export async function listSubscriptionPlans(): Promise<SubscriptionPlanRecord[]> {
  const result = await platformRequest<ApiEnvelope<BackendSubscriptionPlan[]>>("plans");
  return result.data.map(mapSubscriptionPlan);
}

export async function createSubscriptionPlan(plan: SubscriptionPlanRecord): Promise<SubscriptionPlanRecord> {
  const result = await platformRequest<ApiEnvelope<BackendSubscriptionPlan>>("plans", {
    method: "POST",
    body: JSON.stringify({
      code: plan.code,
      name: plan.name,
      description: plan.description || null,
      monthly_price_sar: plan.monthlyPriceSar,
      annual_price_sar: plan.annualPriceSar,
      trial_days: plan.trialDays,
      invoice_limit: plan.invoiceLimit,
      customer_limit: plan.customerLimit,
      accountant_seat_limit: plan.accountantSeatLimit,
      feature_flags: plan.featureFlags,
      marketing_points: plan.marketingPoints,
      is_visible: plan.isVisible,
      is_free: plan.isFree,
      is_paid: plan.isPaid,
      is_active: plan.isActive,
      sort_order: plan.sortOrder,
    }),
  });

  return mapSubscriptionPlan(result.data);
}

export async function updateSubscriptionPlan(plan: SubscriptionPlanRecord): Promise<SubscriptionPlanRecord> {
  const result = await platformRequest<ApiEnvelope<BackendSubscriptionPlan>>(`plans/${plan.id}`, {
    method: "PUT",
    body: JSON.stringify({
      code: plan.code,
      name: plan.name,
      description: plan.description || null,
      monthly_price_sar: plan.monthlyPriceSar,
      annual_price_sar: plan.annualPriceSar,
      trial_days: plan.trialDays,
      invoice_limit: plan.invoiceLimit,
      customer_limit: plan.customerLimit,
      accountant_seat_limit: plan.accountantSeatLimit,
      feature_flags: plan.featureFlags,
      marketing_points: plan.marketingPoints,
      is_visible: plan.isVisible,
      is_free: plan.isFree,
      is_paid: plan.isPaid,
      is_active: plan.isActive,
      sort_order: plan.sortOrder,
    }),
  });

  return mapSubscriptionPlan(result.data);
}

export async function listPlatformAgents(filters?: { search?: string; status?: "active" | "inactive" | "" }): Promise<PlatformAgentRecord[]> {
  const searchParams = new URLSearchParams();

  if (filters?.search) {
    searchParams.set("search", filters.search);
  }

  if (filters?.status) {
    searchParams.set("status", filters.status);
  }

  const query = searchParams.size ? `agents?${searchParams.toString()}` : "agents";
  const result = await platformRequest<ApiEnvelope<BackendPlatformAgent[]>>(query);
  return result.data.map(mapPlatformAgent);
}

export async function updatePlatformAgent(agent: PlatformAgentRecord): Promise<PlatformAgentRecord> {
  const result = await platformRequest<ApiEnvelope<BackendPlatformAgent>>(`agents/${agent.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: agent.name,
      email: agent.email,
      commission_rate: agent.commissionRate,
      is_active: agent.isActive,
    }),
  });

  return mapPlatformAgent(result.data);
}

export async function listPlatformCustomers(filters?: { search?: string; status?: "active" | "suspended" | "" }): Promise<PlatformCustomerRecord[]> {
  const searchParams = new URLSearchParams();

  if (filters?.search) {
    searchParams.set("search", filters.search);
  }

  if (filters?.status) {
    searchParams.set("status", filters.status);
  }

  const query = searchParams.size ? `customers?${searchParams.toString()}` : "customers";
  const result = await platformRequest<ApiEnvelope<BackendPlatformCustomer[]>>(query);
  return result.data.map(mapPlatformCustomer);
}

export async function getPlatformCustomer(customerId: number): Promise<PlatformCustomerRecord> {
  const result = await platformRequest<ApiEnvelope<BackendPlatformCustomer>>(`customers/${customerId}`);
  return mapPlatformCustomer(result.data);
}

export async function updatePlatformCustomer(customer: PlatformCustomerRecord): Promise<PlatformCustomerRecord> {
  const result = await platformRequest<ApiEnvelope<BackendPlatformCustomer>>(`customers/${customer.id}`, {
    method: "PUT",
    body: JSON.stringify({
      legal_name: customer.legalName,
      trade_name: customer.tradeName || null,
      tax_number: customer.taxNumber || null,
      registration_number: customer.registrationNumber || null,
      base_currency: customer.baseCurrency,
      locale: customer.locale,
      timezone: customer.timezone,
      is_active: customer.isActive,
      suspended_reason: customer.isActive ? null : (customer.suspendedReason || null),
      plan_id: customer.subscription?.planId ?? null,
      subscription_status: customer.subscription?.status ?? null,
    }),
  });

  return mapPlatformCustomer(result.data);
}

export async function listSupportAccounts(): Promise<SupportAccountRecord[]> {
  const result = await platformRequest<ApiEnvelope<BackendSupportAccount[]>>("support-accounts");
  return result.data.map(mapSupportAccount);
}

export async function createSupportAccount(account: Omit<SupportAccountRecord, "id"> & { password: string }): Promise<SupportAccountRecord> {
  const result = await platformRequest<ApiEnvelope<BackendSupportAccount>>("support-accounts", {
    method: "POST",
    body: JSON.stringify({
      name: account.name,
      email: account.email,
      password: account.password,
      platform_role: account.platformRole,
      is_platform_active: account.isPlatformActive,
      support_permissions: account.supportPermissions,
    }),
  });

  return mapSupportAccount(result.data);
}

export async function updateSupportAccount(account: SupportAccountRecord & { password?: string }): Promise<SupportAccountRecord> {
  const result = await platformRequest<ApiEnvelope<BackendSupportAccount>>(`support-accounts/${account.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: account.name,
      email: account.email,
      password: account.password || null,
      platform_role: account.platformRole,
      is_platform_active: account.isPlatformActive,
      support_permissions: account.supportPermissions,
    }),
  });

  return mapSupportAccount(result.data);
}

export async function getCompanyUsers(): Promise<CompanyUsersSnapshot | null> {
  try {
    const result = await request<ApiEnvelope<BackendCompanyUsersEnvelope>>("users");
    return {
      seatLimit: result.data.seat_limit ?? null,
      users: result.data.users.map(mapCompanyUser),
    };
  } catch {
    return null;
  }
}

export async function createCompanyUser(user: Omit<CompanyUserRecord, "id" | "joinedAt"> & { password: string }): Promise<CompanyUserRecord> {
  const result = await request<ApiEnvelope<BackendCompanyUser>>("users", {
    method: "POST",
    body: JSON.stringify({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      permissions: user.permissions,
      is_active: user.isActive,
    }),
  });

  return mapCompanyUser(result.data);
}

export async function updateCompanyUser(user: CompanyUserRecord & { password?: string }): Promise<CompanyUserRecord> {
  const result = await request<ApiEnvelope<BackendCompanyUser>>(`users/${user.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: user.name,
      email: user.email,
      password: user.password || null,
      role: user.role,
      permissions: user.permissions,
      is_active: user.isActive,
    }),
  });

  return mapCompanyUser(result.data);
}

export async function listDocuments(filters?: {
  group?: "all" | "sales" | "purchase";
  type?: string;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  minTotal?: number;
  maxTotal?: number;
  sort?: "issue_date" | "document_number" | "grand_total" | "status";
  direction?: "asc" | "desc";
}): Promise<DocumentCenterRecord[]> {
  const searchParams = new URLSearchParams();

  if (filters?.group) searchParams.set("group", filters.group);
  if (filters?.type) searchParams.set("type", filters.type);
  if (filters?.status) searchParams.set("status", filters.status);
  if (filters?.search) searchParams.set("search", filters.search);
  if (filters?.fromDate) searchParams.set("from_date", filters.fromDate);
  if (filters?.toDate) searchParams.set("to_date", filters.toDate);
  if (typeof filters?.minTotal === "number") searchParams.set("min_total", String(filters.minTotal));
  if (typeof filters?.maxTotal === "number") searchParams.set("max_total", String(filters.maxTotal));
  if (filters?.sort) searchParams.set("sort", filters.sort);
  if (filters?.direction) searchParams.set("direction", filters.direction);

  const path = searchParams.size ? `documents?${searchParams.toString()}` : "documents";
  const result = await request<ApiEnvelope<BackendDocumentCenterRecord[]>>(path);
  return result.data.map(mapDocumentCenterRecord);
}

export async function getDocument(documentId: number): Promise<DocumentDetailRecord> {
  const result = await dedupeWorkspaceRead(`document:${documentId}`, () => request<ApiEnvelope<BackendDocumentDetail>>(`documents/${documentId}`));
  return mapDocumentDetail(result.data);
}

export async function getDocumentPreview(documentId: number, options?: { templateId?: number | null }): Promise<DocumentPreviewRecord> {
  const searchParams = new URLSearchParams();

  if (typeof options?.templateId === "number") {
    searchParams.set("template_id", String(options.templateId));
  }

  const path = searchParams.size ? `documents/${documentId}/preview?${searchParams.toString()}` : `documents/${documentId}/preview`;
  const cacheKey = searchParams.size ? `document-preview:${documentId}:${searchParams.toString()}` : `document-preview:${documentId}`;
  const result = await dedupeWorkspaceRead(cacheKey, () => request<ApiEnvelope<BackendDocumentPreview>>(path));
  return result.data;
}

export async function previewDocumentTemplate(template: Omit<DocumentTemplateRecord, "id" | "logoAssetUrl">, documentType: string): Promise<DocumentPreviewRecord> {
  const result = await request<ApiEnvelope<BackendDocumentPreview>>("templates/preview", {
    method: "POST",
    body: JSON.stringify({
      name: template.name,
      document_types: template.documentTypes,
      locale_mode: template.localeMode,
      accent_color: template.accentColor,
      watermark_text: template.watermarkText || null,
      header_html: template.headerHtml || null,
      footer_html: template.footerHtml || null,
      settings: template.settings,
      logo_asset_id: template.logoAssetId,
      is_default: template.isDefault,
      is_active: template.isActive,
      document_type: documentType,
    }),
  });

  return result.data;
}

export async function exportDocumentTemplatePdf(template: Omit<DocumentTemplateRecord, "id" | "logoAssetUrl">, documentType: string): Promise<TemplatePdfDownloadRecord> {
  const response = await fetch(`${getWorkspaceApiBase()}/templates/export-pdf`, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: {
      Accept: "application/pdf",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: template.name,
      document_types: template.documentTypes,
      locale_mode: template.localeMode,
      accent_color: template.accentColor,
      watermark_text: template.watermarkText || null,
      header_html: template.headerHtml || null,
      footer_html: template.footerHtml || null,
      settings: template.settings,
      logo_asset_id: template.logoAssetId,
      is_default: template.isDefault,
      is_active: template.isActive,
      document_type: documentType,
    }),
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Template PDF export failed.");
  }

  const blob = await response.blob();
  const fileNameHeader = response.headers.get("Content-Disposition") ?? "";
  const match = /filename="?([^"]+)"?/i.exec(fileNameHeader);
  const fileName = match?.[1] ?? `${template.name || "document-template"}.pdf`;

  return {
    fileName,
    url: URL.createObjectURL(blob),
  };
}

export async function sendDocument(documentId: number, payload?: { email?: string; subject?: string }): Promise<DocumentDetailRecord> {
  const result = await request<ApiEnvelope<BackendDocumentDetail>>(`documents/${documentId}/send`, {
    method: "POST",
    body: JSON.stringify({
      email: payload?.email || null,
      subject: payload?.subject || null,
    }),
  });

  return mapDocumentDetail(result.data);
}

export async function listCommunications(filters?: { sourceType?: string; sourceId?: number; channel?: string; status?: string; limit?: number }): Promise<CommunicationRecord[]> {
  const searchParams = new URLSearchParams();

  if (filters?.sourceType) searchParams.set("source_type", filters.sourceType);
  if (typeof filters?.sourceId === "number") searchParams.set("source_id", String(filters.sourceId));
  if (filters?.channel) searchParams.set("channel", filters.channel);
  if (filters?.status) searchParams.set("status", filters.status);
  if (typeof filters?.limit === "number") searchParams.set("limit", String(filters.limit));

  const path = searchParams.size ? `communications?${searchParams.toString()}` : "communications";
  const result = await request<ApiEnvelope<BackendCommunication[]>>(path);
  return result.data.map(mapCommunication);
}

export async function listCommunicationTimeline(sourceType: string, sourceId: number): Promise<CommunicationRecord[]> {
  const result = await request<ApiEnvelope<BackendCommunication[]>>(`communications/source/${sourceType}/${sourceId}`);
  return result.data.map(mapCommunication);
}

export async function listCommunicationTemplates(): Promise<CommunicationTemplateOptionRecord[]> {
  const result = await request<ApiEnvelope<BackendCommunicationTemplate[]>>("communications/templates");
  return result.data.map(mapCommunicationTemplate);
}

export async function createCommunication(payload: {
  channel: "email" | "in_app";
  sourceType?: string;
  sourceId?: number;
  sourceRecordType?: string;
  contactId?: number | null;
  templateId?: number | null;
  email?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  variables?: Record<string, string | number | boolean | null>;
}): Promise<CommunicationRecord> {
  const result = await request<ApiEnvelope<BackendCommunication>>("communications", {
    method: "POST",
    body: JSON.stringify({
      channel: payload.channel,
      source_type: payload.sourceType ?? null,
      source_id: payload.sourceId ?? null,
      source_record_type: payload.sourceRecordType ?? null,
      contact_id: payload.contactId ?? null,
      template_id: payload.templateId ?? null,
      email: payload.email ?? null,
      subject: payload.subject ?? null,
      body_html: payload.bodyHtml ?? null,
      body_text: payload.bodyText ?? null,
      variables: payload.variables ?? {},
    }),
  });

  return mapCommunication(result.data);
}

export async function retryCommunication(communicationId: number): Promise<CommunicationRecord> {
  const result = await request<ApiEnvelope<BackendCommunication>>(`communications/${communicationId}/retry`, {
    method: "POST",
  });
  return mapCommunication(result.data);
}

export function getDocumentPdfUrl(documentId: number, options?: { templateId?: number | null }) {
  const searchParams = new URLSearchParams();

  if (typeof options?.templateId === "number") {
    searchParams.set("template_id", String(options.templateId));
  }

  return searchParams.size
    ? `${getWorkspaceApiBase()}/documents/${documentId}/pdf?${searchParams.toString()}`
    : `${getWorkspaceApiBase()}/documents/${documentId}/pdf`;
}

export async function listDocumentTemplates(): Promise<DocumentTemplateRecord[]> {
  const result = await request<ApiEnvelope<BackendDocumentTemplate[]>>("templates");
  return result.data.map(mapDocumentTemplate);
}

export async function createDocumentTemplate(template: Omit<DocumentTemplateRecord, "id" | "logoAssetUrl">): Promise<DocumentTemplateRecord> {
  const result = await request<ApiEnvelope<BackendDocumentTemplate>>("templates", {
    method: "POST",
    body: JSON.stringify({
      name: template.name,
      document_types: template.documentTypes,
      locale_mode: template.localeMode,
      accent_color: template.accentColor,
      watermark_text: template.watermarkText || null,
      header_html: template.headerHtml || null,
      footer_html: template.footerHtml || null,
      settings: template.settings,
      logo_asset_id: template.logoAssetId,
      is_default: template.isDefault,
      is_active: template.isActive,
    }),
  });
  return mapDocumentTemplate(result.data);
}

export async function updateDocumentTemplate(template: Omit<DocumentTemplateRecord, "logoAssetUrl">): Promise<DocumentTemplateRecord> {
  const result = await request<ApiEnvelope<BackendDocumentTemplate>>(`templates/${template.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: template.name,
      document_types: template.documentTypes,
      locale_mode: template.localeMode,
      accent_color: template.accentColor,
      watermark_text: template.watermarkText || null,
      header_html: template.headerHtml || null,
      footer_html: template.footerHtml || null,
      settings: template.settings,
      logo_asset_id: template.logoAssetId,
      is_default: template.isDefault,
      is_active: template.isActive,
    }),
  });
  return mapDocumentTemplate(result.data);
}

export async function listCompanyAssets(options?: { mode?: WorkspaceResponseMode }): Promise<CompanyAssetRecord[]> {
  const mode = options?.mode ?? "backend";
  const path = mode === "preview" ? "assets?mode=preview" : "assets";
  const result = await request<ApiEnvelope<BackendCompanyAsset[]>>(path, { expectedMode: mode });
  return result.data.map(mapCompanyAsset);
}

export async function uploadCompanyAsset(payload: { type: string; usage?: string; file: File }): Promise<CompanyAssetRecord> {
  const formData = new FormData();
  formData.set("type", payload.type);
  if (payload.usage) {
    formData.set("usage", payload.usage);
  }
  formData.set("file", payload.file);

  const response = await fetch(`${getWorkspaceApiBase()}/assets`, {
    method: "POST",
    cache: "no-store",
    body: formData,
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Asset upload failed.");
  }

  const result = await response.json() as ApiEnvelope<BackendCompanyAsset>;
  return mapCompanyAsset(result.data);
}

export async function listCustomFieldDefinitions(): Promise<CustomFieldDefinitionRecord[]> {
  const result = await request<ApiEnvelope<BackendCustomFieldDefinition[]>>("custom-fields");
  return result.data.map(mapCustomFieldDefinition);
}

export async function listCostCenters(active?: boolean): Promise<CostCenterRecord[]> {
  const path = typeof active === "boolean" ? `cost-centers?active=${active ? 1 : 0}` : "cost-centers";
  const result = await request<ApiEnvelope<BackendCostCenter[]>>(path);
  return result.data.map(mapCostCenter);
}

export async function createCostCenter(payload: Omit<CostCenterRecord, "id">): Promise<CostCenterRecord> {
  const result = await request<ApiEnvelope<BackendCostCenter>>("cost-centers", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      code: payload.code,
      description: payload.description || null,
      is_active: payload.isActive,
    }),
  });

  return mapCostCenter(result.data);
}

export async function updateCostCenter(payload: CostCenterRecord): Promise<CostCenterRecord> {
  const result = await request<ApiEnvelope<BackendCostCenter>>(`cost-centers/${payload.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: payload.name,
      code: payload.code,
      description: payload.description || null,
      is_active: payload.isActive,
    }),
  });

  return mapCostCenter(result.data);
}

export async function createCustomFieldDefinition(field: Omit<CustomFieldDefinitionRecord, "id">): Promise<CustomFieldDefinitionRecord> {
  const result = await request<ApiEnvelope<BackendCustomFieldDefinition>>("custom-fields", {
    method: "POST",
    body: JSON.stringify({
      name: field.name,
      slug: field.slug || null,
      field_type: field.fieldType,
      placement: field.placement,
      applies_to: field.appliesTo,
      options: field.options,
      is_active: field.isActive,
    }),
  });

  return mapCustomFieldDefinition(result.data);
}

export async function updateCustomFieldDefinition(field: CustomFieldDefinitionRecord): Promise<CustomFieldDefinitionRecord> {
  const result = await request<ApiEnvelope<BackendCustomFieldDefinition>>(`custom-fields/${field.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: field.name,
      slug: field.slug,
      field_type: field.fieldType,
      placement: field.placement,
      applies_to: field.appliesTo,
      options: field.options,
      is_active: field.isActive,
    }),
  });

  return mapCustomFieldDefinition(result.data);
}

/* ================================================================
   CHART OF ACCOUNTS API
   ================================================================ */

export type AccountRecord = {
  id: number;
  code: string;
  name: string;
  nameAr: string | null;
  accountClass: string;
  group: string;
  subtype: string;
  normalBalance: string;
  parentCode: string | null;
  isActive: boolean;
  isPostingAllowed: boolean;
  isSystem: boolean;
  balance: number;
};

export async function listAccounts(filters?: {
  class?: string;
  active?: boolean;
  search?: string;
}): Promise<AccountRecord[]> {
  const params = new URLSearchParams();
  if (filters?.class) params.set("class", filters.class);
  if (filters?.active !== undefined) params.set("active", filters.active ? "1" : "0");
  if (filters?.search) params.set("search", filters.search);
  const qs = params.toString();
  const result = await request<ApiEnvelope<Array<{
    id: number; code: string; name: string; name_ar?: string | null;
    account_class: string; group: string; subtype: string; normal_balance: string;
    parent_code?: string | null; is_active: boolean; allows_posting: boolean; is_system: boolean;
    balance: string | number;
  }>>>(`accounts${qs ? `?${qs}` : ""}`);
  return result.data.map((a) => ({
    id: a.id, code: a.code, name: a.name, nameAr: a.name_ar ?? null,
    accountClass: a.account_class, group: a.group, subtype: a.subtype,
    normalBalance: a.normal_balance, parentCode: a.parent_code ?? null,
    isActive: a.is_active, isPostingAllowed: a.allows_posting, isSystem: a.is_system,
    balance: numberValue(a.balance),
  }));
}

export async function createAccount(payload: {
  code: string; name: string; nameAr?: string;
  accountClass: string; group: string; subtype: string;
  normalBalance: string; parentCode?: string;
  isPostingAllowed?: boolean;
}): Promise<AccountRecord> {
  const result = await request<ApiEnvelope<{
    id: number; code: string; name: string; name_ar?: string | null;
    account_class: string; group: string; subtype: string; normal_balance: string;
    parent_code?: string | null; is_active: boolean; allows_posting: boolean; is_system: boolean;
    balance: string | number;
  }>>("accounts", {
    method: "POST",
    body: JSON.stringify({
      code: payload.code, name: payload.name, name_ar: payload.nameAr ?? null,
      account_class: payload.accountClass, group: payload.group, subtype: payload.subtype,
      normal_balance: payload.normalBalance, parent_code: payload.parentCode ?? null,
      allows_posting: payload.isPostingAllowed ?? true,
    }),
  });
  const a = result.data;
  return {
    id: a.id, code: a.code, name: a.name, nameAr: a.name_ar ?? null,
    accountClass: a.account_class, group: a.group, subtype: a.subtype,
    normalBalance: a.normal_balance, parentCode: a.parent_code ?? null,
    isActive: a.is_active, isPostingAllowed: a.allows_posting, isSystem: a.is_system,
    balance: numberValue(a.balance),
  };
}

export async function updateAccount(id: number, payload: {
  name?: string; nameAr?: string; subtype?: string; group?: string;
  isPostingAllowed?: boolean; isActive?: boolean; notes?: string;
}): Promise<AccountRecord> {
  const result = await request<ApiEnvelope<{
    id: number; code: string; name: string; name_ar?: string | null;
    account_class: string; group: string; subtype: string; normal_balance: string;
    parent_code?: string | null; is_active: boolean; allows_posting: boolean; is_system: boolean;
    balance: string | number;
  }>>(`accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: payload.name, name_ar: payload.nameAr,
      subtype: payload.subtype, group: payload.group,
      allows_posting: payload.isPostingAllowed,
      is_active: payload.isActive, notes: payload.notes,
    }),
  });
  const a = result.data;
  return {
    id: a.id, code: a.code, name: a.name, nameAr: a.name_ar ?? null,
    accountClass: a.account_class, group: a.group, subtype: a.subtype,
    normalBalance: a.normal_balance, parentCode: a.parent_code ?? null,
    isActive: a.is_active, isPostingAllowed: a.allows_posting, isSystem: a.is_system,
    balance: numberValue(a.balance),
  };
}

/* ================================================================
   JOURNAL ENTRIES API
   ================================================================ */

export type JournalEntryRecord = {
  id: number;
  entryNumber: string;
  entryDate: string;
  postingDate: string;
  /** Entry-level description from the backend (distinct from line descriptions). */
  description: string;
  reference: string;
  memo: string;
  sourceType: string | null;
  sourceId: number | null;
  status: string;
  createdByName?: string;
  /** When the entry was posted (ISO), if provided by API. */
  postedAt?: string | null;
  metadata?: Record<string, unknown> | null;
  lines: Array<{
    id?: number;
    lineNo: number;
    accountId?: number;
    accountCode: string;
    accountName: string;
    documentId?: number | null;
    documentNumber?: string | null;
    documentType?: string | null;
    documentStatus?: string | null;
    inventoryItemId?: number | null;
    debit: number;
    credit: number;
    description: string | null;
  }>;
};

export async function listJournals(filters?: {
  status?: string;
  sourceType?: string;
  fromDate?: string;
  toDate?: string;
  invoiceId?: number;
  invoiceNumber?: string;
}): Promise<JournalEntryRecord[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.sourceType) params.set("source_type", filters.sourceType);
  if (filters?.fromDate) params.set("from_date", filters.fromDate);
  if (filters?.toDate) params.set("to_date", filters.toDate);
  if (typeof filters?.invoiceId === "number" && Number.isFinite(filters.invoiceId) && filters.invoiceId > 0) params.set("invoice_id", String(filters.invoiceId));
  if (filters?.invoiceNumber) params.set("invoice_number", filters.invoiceNumber);
  const qs = params.toString();
  const result = await request<ApiEnvelope<Array<{
    id: number; entry_number: string; entry_date: string; posting_date?: string | null;
    reference?: string | null; description?: string | null; memo?: string | null;
    source_type?: string | null; source_id?: number | null; status: string; created_by_name?: string | null;
    posted_at?: string | null;
    metadata?: Record<string, unknown> | null;
    lines: Array<{ id: number; line_no: number; account_id?: number; account_code?: string | null; account_name?: string | null; debit: string | number; credit: string | number; description?: string | null; document_id?: number | null; document_number?: string | null; document_type?: string | null; document_status?: string | null; inventory_item_id?: number | null }>;
  }>>>(`journals${qs ? `?${qs}` : ""}`);
  return result.data.map((j) => ({
    id: j.id, entryNumber: j.entry_number, entryDate: j.entry_date,
    postingDate: j.posting_date ?? j.entry_date, reference: j.reference ?? "",
    description: j.description ?? "",
    memo: j.memo ?? "", sourceType: j.source_type ?? null, sourceId: j.source_id ?? null,
    status: j.status, createdByName: j.created_by_name ?? "", postedAt: j.posted_at ?? null, metadata: j.metadata ?? null,
    lines: j.lines.map((l) => ({
      id: l.id,
      lineNo: l.line_no,
      accountId: l.account_id,
      accountCode: l.account_code ?? "",
      accountName: l.account_name ?? "",
      documentId: l.document_id ?? null,
      documentNumber: l.document_number ?? null,
      documentType: l.document_type ?? null,
      documentStatus: l.document_status ?? null,
      inventoryItemId: l.inventory_item_id ?? null,
      debit: numberValue(l.debit), credit: numberValue(l.credit), description: l.description ?? null,
    })),
  }));
}

export async function createJournal(payload: {
  entryDate: string; postingDate?: string; reference?: string; description?: string; memo?: string; metadata?: Record<string, unknown> | null;
  lines: Array<{ accountId: number; debit: number; credit: number; description?: string; documentId?: number | null; inventoryItemId?: number | null }>;
}): Promise<JournalEntryRecord> {
  const result = await request<ApiEnvelope<{
    id: number; entry_number: string; entry_date: string; posting_date?: string | null;
    reference?: string | null; description?: string | null; memo?: string | null;
    source_type?: string | null; source_id?: number | null; status: string; created_by_name?: string | null;
    posted_at?: string | null;
    metadata?: Record<string, unknown> | null;
    lines: Array<{ id: number; line_no: number; account_id?: number; account_code?: string | null; account_name?: string | null; debit: string | number; credit: string | number; description?: string | null; document_id?: number | null; document_number?: string | null; document_type?: string | null; document_status?: string | null; inventory_item_id?: number | null }>;
  }>>("journals", {
    method: "POST",
    body: JSON.stringify({
      entry_date: payload.entryDate,
      posting_date: payload.postingDate ?? payload.entryDate,
      reference: payload.reference ?? "",
      description: payload.description ?? "",
      memo: payload.memo ?? "",
      metadata: payload.metadata ?? null,
      lines: payload.lines.map((l) => ({
        account_id: l.accountId, debit: l.debit, credit: l.credit, description: l.description ?? "", document_id: l.documentId ?? null, inventory_item_id: l.inventoryItemId ?? null,
      })),
    }),
  });
  const j = result.data;
  return {
    id: j.id, entryNumber: j.entry_number, entryDate: j.entry_date,
    postingDate: j.posting_date ?? j.entry_date, reference: j.reference ?? "",
    description: j.description ?? "",
    memo: j.memo ?? "", sourceType: j.source_type ?? null, sourceId: j.source_id ?? null,
    status: j.status, createdByName: j.created_by_name ?? "", postedAt: j.posted_at ?? null, metadata: j.metadata ?? null,
    lines: j.lines.map((l) => ({
      id: l.id,
      lineNo: l.line_no,
      accountId: l.account_id,
      accountCode: l.account_code ?? "",
      accountName: l.account_name ?? "",
      documentId: l.document_id ?? null,
      documentNumber: l.document_number ?? null,
      documentType: l.document_type ?? null,
      documentStatus: l.document_status ?? null,
      inventoryItemId: l.inventory_item_id ?? null,
      debit: numberValue(l.debit), credit: numberValue(l.credit), description: l.description ?? null,
    })),
  };
}

export async function postJournal(id: number): Promise<JournalEntryRecord> {
  const result = await request<ApiEnvelope<{
    id: number; entry_number: string; entry_date: string; posting_date?: string | null;
    reference?: string | null; memo?: string | null;
    source_type?: string | null; source_id?: number | null; status: string;
    lines: Array<{ line_no: number; account: { code: string; name: string }; debit: string | number; credit: string | number; description?: string | null }>;
  }>>(`journals/${id}/post`, { method: "POST" });
  const j = result.data;
  return {
    id: j.id, entryNumber: j.entry_number, entryDate: j.entry_date,
    postingDate: j.posting_date ?? j.entry_date, reference: j.reference ?? "",
    description: "",
    memo: j.memo ?? "", sourceType: j.source_type ?? null, sourceId: j.source_id ?? null,
    status: j.status, postedAt: null, metadata: null,
    lines: j.lines.map((l) => ({
      lineNo: l.line_no, accountCode: l.account.code, accountName: l.account.name,
      debit: numberValue(l.debit), credit: numberValue(l.credit), description: l.description ?? null,
    })),
  };
}

export async function reverseJournal(id: number): Promise<JournalEntryRecord> {
  const result = await request<ApiEnvelope<{
    id: number; entry_number: string; entry_date: string; posting_date?: string | null;
    reference?: string | null; memo?: string | null;
    source_type?: string | null; source_id?: number | null; status: string;
    lines: Array<{ line_no: number; account: { code: string; name: string }; debit: string | number; credit: string | number; description?: string | null }>;
  }>>(`journals/${id}/reverse`, { method: "POST" });
  const j = result.data;
  return {
    id: j.id, entryNumber: j.entry_number, entryDate: j.entry_date,
    postingDate: j.posting_date ?? j.entry_date, reference: j.reference ?? "",
    description: "",
    memo: j.memo ?? "", sourceType: j.source_type ?? null, sourceId: j.source_id ?? null,
    status: j.status, postedAt: null, metadata: null,
    lines: j.lines.map((l) => ({
      lineNo: l.line_no, accountCode: l.account.code, accountName: l.account.name,
      debit: numberValue(l.debit), credit: numberValue(l.credit), description: l.description ?? null,
    })),
  };
}

/* ================================================================
   RECONCILIATION API
   ================================================================ */

export type BankAccountRecord = {
  id: number;
  code: string;
  name: string;
  balance: number;
  normalBalance: "debit" | "credit" | null;
};

export type StatementLineRecord = {
  id: number;
  transactionDate: string;
  valueDate: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  status: "unmatched" | "matched" | "reconciled";
  matchedJournalLineId: number | null;
};

export type { StatementImportLineInput } from "@/lib/reconciliation-import";

export type StatementImportResult = {
  lines: StatementLineRecord[];
  summary: ImportExecutionSummary;
};

export type StatementLineCandidateRecord = {
  id: number;
  description: string;
  debit: number;
  credit: number;
  journalEntryNumber: string;
  journalEntryDate: string;
  journalEntryDescription: string;
};

export async function listBankAccounts(): Promise<BankAccountRecord[]> {
  const result = await request<ApiEnvelope<Array<{
    id: number; code: string; name: string; balance: string | number; normal_balance?: "debit" | "credit" | null;
  }>>>("reconciliation/bank-accounts");
  return result.data.map((account) => ({
    id: account.id,
    code: account.code,
    name: account.name,
    balance: numberValue(account.balance),
    normalBalance: account.normal_balance ?? null,
  }));
}

export async function listStatementLines(accountId: number, filters?: {
  status?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<StatementLineRecord[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.fromDate) params.set("from_date", filters.fromDate);
  if (filters?.toDate) params.set("to_date", filters.toDate);
  const qs = params.toString();
  const result = await request<{
    data: Array<{
    id: number; transaction_date: string; reference?: string | null; description?: string | null;
    value_date?: string | null; debit: string | number; credit: string | number; running_balance: string | number;
    status: "unmatched" | "matched" | "reconciled"; matched_journal_line_id?: number | null;
  }> }>(`reconciliation/${accountId}/statements${qs ? `?${qs}` : ""}`);
  return result.data.map((s) => ({
    id: s.id, transactionDate: s.transaction_date, valueDate: s.value_date ?? "", reference: s.reference ?? "",
    description: s.description ?? "", debit: numberValue(s.debit), credit: numberValue(s.credit),
    runningBalance: numberValue(s.running_balance), status: s.status,
    matchedJournalLineId: s.matched_journal_line_id ?? null,
  }));
}

export async function importStatementLines(accountId: number, lines: StatementImportLineInput[]): Promise<StatementImportResult> {
  const result = await request<{
    data: Array<{
    id: number; transaction_date: string; value_date?: string | null; reference?: string | null; description?: string | null;
    debit: string | number; credit: string | number; running_balance: string | number;
    status: "unmatched" | "matched" | "reconciled"; matched_journal_line_id?: number | null;
  }>;
    summary?: ImportExecutionSummary;
  }>(`reconciliation/${accountId}/statements/import`, {
    method: "POST",
    body: JSON.stringify({
      lines: lines.map((line) => ({
        transaction_date: line.transactionDate,
        value_date: line.valueDate || null,
        reference: line.reference || null,
        description: line.description || null,
        debit: line.debit ?? 0,
        credit: line.credit ?? 0,
        running_balance: line.runningBalance ?? null,
      })),
    }),
  });

  return {
    lines: result.data.map((line) => ({
      id: line.id,
      transactionDate: line.transaction_date,
      valueDate: line.value_date ?? "",
      reference: line.reference ?? "",
      description: line.description ?? "",
      debit: numberValue(line.debit),
      credit: numberValue(line.credit),
      runningBalance: numberValue(line.running_balance),
      status: line.status,
      matchedJournalLineId: line.matched_journal_line_id ?? null,
    })),
    summary: result.summary ?? {
      totalRows: lines.length,
      validRows: lines.length,
      invalidRows: 0,
      importedRows: lines.length,
      skippedRows: 0,
      failedRows: 0,
      generatedRecords: [],
      warnings: [],
      errors: [],
    },
  };
}

export async function listStatementLineCandidates(accountId: number, statementLineId: number): Promise<StatementLineCandidateRecord[]> {
  const result = await request<ApiEnvelope<Array<{
    id: number;
    description?: string | null;
    debit: string | number;
    credit: string | number;
    journal_entry?: {
      entry_number?: string | null;
      entry_date?: string | null;
      description?: string | null;
    } | null;
  }>>>(`reconciliation/${accountId}/statements/${statementLineId}/candidates`);

  return result.data.map((candidate) => ({
    id: candidate.id,
    description: candidate.description ?? "",
    debit: numberValue(candidate.debit),
    credit: numberValue(candidate.credit),
    journalEntryNumber: candidate.journal_entry?.entry_number ?? "-",
    journalEntryDate: candidate.journal_entry?.entry_date ?? "",
    journalEntryDescription: candidate.journal_entry?.description ?? "",
  }));
}

export async function matchStatementLine(accountId: number, statementLineId: number, journalLineId: number): Promise<void> {
  await request(`reconciliation/${accountId}/statements/${statementLineId}/match`, {
    method: "POST",
    body: JSON.stringify({ journal_line_id: journalLineId }),
  });
}

export async function reconcileStatementLines(accountId: number, statementLineIds: number[]): Promise<void> {
  await request(`reconciliation/${accountId}/reconcile`, {
    method: "POST",
    body: JSON.stringify({ statement_line_ids: statementLineIds }),
  });
}

/* ================================================================
   CASH FLOW REPORT API
   ================================================================ */

export type CashFlowReport = {
  operating: Array<{ accountCode: string; accountName: string; debit: number; credit: number; net: number }>;
  investing: Array<{ accountCode: string; accountName: string; debit: number; credit: number; net: number }>;
  financing: Array<{ accountCode: string; accountName: string; debit: number; credit: number; net: number }>;
  operatingTotal: number;
  investingTotal: number;
  financingTotal: number;
  netChange: number;
};

export async function getCashFlowReport(filters?: { fromDate?: string; toDate?: string }): Promise<CashFlowReport> {
  const params = new URLSearchParams();
  if (filters?.fromDate) params.set("from_date", filters.fromDate);
  if (filters?.toDate) params.set("to_date", filters.toDate);
  const qs = params.toString();
  const result = await request<ApiEnvelope<{
    operating: Array<{ account_code: string; account_name: string; debit: string | number; credit: string | number; net: string | number }>;
    investing: Array<{ account_code: string; account_name: string; debit: string | number; credit: string | number; net: string | number }>;
    financing: Array<{ account_code: string; account_name: string; debit: string | number; credit: string | number; net: string | number }>;
    operating_total: string | number; investing_total: string | number; financing_total: string | number; net_change: string | number;
  }>>(`reports/cash-flow${qs ? `?${qs}` : ""}`);
  const d = result.data;
  const mapRow = (r: { account_code: string; account_name: string; debit: string | number; credit: string | number; net: string | number }) => ({
    accountCode: r.account_code, accountName: r.account_name, debit: numberValue(r.debit), credit: numberValue(r.credit), net: numberValue(r.net),
  });
  return {
    operating: d.operating.map(mapRow), investing: d.investing.map(mapRow), financing: d.financing.map(mapRow),
    operatingTotal: numberValue(d.operating_total), investingTotal: numberValue(d.investing_total),
    financingTotal: numberValue(d.financing_total), netChange: numberValue(d.net_change),
  };
}

export async function listVatReceivedDetails(filters?: {
  fromDate?: string;
  toDate?: string;
}): Promise<VatReceivedDetailRecord[]> {
  const searchParams = new URLSearchParams();
  if (filters?.fromDate) searchParams.set("from_date", filters.fromDate);
  if (filters?.toDate) searchParams.set("to_date", filters.toDate);

  const path = searchParams.size ? `reports/vat-received-details?${searchParams.toString()}` : "reports/vat-received-details";
  const result = await request<ApiEnvelope<Array<{ id: number; document_number: string; issue_date: string; customer?: string | null; taxable_amount: string | number; vat_amount: string | number }>>>(path);

  return result.data.map((row) => ({
    id: row.id,
    invoiceNumber: row.document_number,
    date: row.issue_date,
    customer: row.customer ?? "-",
    taxableAmount: numberValue(row.taxable_amount),
    vatAmount: numberValue(row.vat_amount),
  }));
}

export async function listVatPaidDetails(filters?: {
  fromDate?: string;
  toDate?: string;
}): Promise<VatPaidDetailRecord[]> {
  const searchParams = new URLSearchParams();
  if (filters?.fromDate) searchParams.set("from_date", filters.fromDate);
  if (filters?.toDate) searchParams.set("to_date", filters.toDate);

  const path = searchParams.size ? `reports/vat-paid-details?${searchParams.toString()}` : "reports/vat-paid-details";
  const result = await request<ApiEnvelope<Array<{ id: number; reference: string; issue_date: string; vendor?: string | null; vat_amount: string | number; category?: string | null }>>>(path);

  return result.data.map((row) => ({
    id: row.id,
    reference: row.reference,
    date: row.issue_date,
    vendor: row.vendor ?? "-",
    vatAmount: numberValue(row.vat_amount),
    category: row.category ?? "purchase",
  }));
}

export async function listInventoryStock(): Promise<InventoryStockRecord[]> {
  const result = await request<ApiEnvelope<Array<{
    id: number;
    item_id?: number | null;
    product_name: string;
    material: string;
    inventory_type: string;
    size: string;
    source: "production" | "purchase";
    code: string;
    quantity_on_hand: string | number;
    committed_quantity: string | number;
    reorder_level: string | number;
    batch_number?: string | null;
    production_date?: string | null;
    recorded_by?: string | null;
    journal_entry_number?: string | null;
    inventory_account_code?: string | null;
    inventory_account_name?: string | null;
    attachments?: Attachment[] | null;
    document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }> | null;
    updated_at: string;
  }>>>("inventory/stock");

  return result.data.map((row) => ({
    id: row.id,
    itemId: row.item_id ?? null,
    productName: row.product_name,
    material: row.material,
    inventoryType: row.inventory_type,
    size: row.size,
    source: row.source,
    code: row.code,
    onHand: numberValue(row.quantity_on_hand),
    committed: numberValue(row.committed_quantity),
    available: numberValue(row.quantity_on_hand) - numberValue(row.committed_quantity),
    reorderLevel: numberValue(row.reorder_level),
    batchNumber: row.batch_number ?? "",
    productionDate: row.production_date ?? "",
    recordedBy: row.recorded_by ?? "Workspace User",
    journalEntryNumber: row.journal_entry_number ?? "Pending",
    inventoryAccountCode: row.inventory_account_code ?? "1300",
    inventoryAccountName: row.inventory_account_name ?? "VAT Receivable",
    attachments: row.attachments ?? [],
    documentLinks: row.document_links ?? [],
    lastUpdated: row.updated_at,
  }));
}

export async function createInventoryStockRecord(payload: InventoryCreatePayload): Promise<InventoryStockRecord> {
  const result = await request<ApiEnvelope<{
    id: number;
    item_id?: number | null;
    product_name: string;
    material: string;
    inventory_type: string;
    size: string;
    source: "production" | "purchase";
    code: string;
    quantity_on_hand: string | number;
    committed_quantity: string | number;
    reorder_level: string | number;
    batch_number?: string | null;
    production_date?: string | null;
    recorded_by?: string | null;
    journal_entry_number?: string | null;
    inventory_account_code?: string | null;
    inventory_account_name?: string | null;
    attachments?: Attachment[] | null;
    document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }> | null;
    updated_at: string;
  }>>("inventory/stock", {
    method: "POST",
    body: JSON.stringify({
      item_id: payload.itemId ?? null,
      product_name: payload.productName,
      material: payload.material,
      inventory_type: payload.inventoryType,
      size: payload.size,
      source: payload.source,
      code: payload.code,
      quantity_on_hand: payload.quantity,
      committed_quantity: payload.committed ?? 0,
      reorder_level: payload.reorderLevel ?? 0,
      batch_number: payload.batchNumber ?? null,
      production_date: payload.productionDate ?? null,
      recorded_by: payload.recordedBy ?? "Workspace User",
      journal_entry_number: payload.journalEntryNumber ?? null,
      inventory_account_code: payload.inventoryAccountCode ?? null,
      inventory_account_name: payload.inventoryAccountName ?? null,
      attachments: payload.attachments ?? [],
      document_links: payload.documentLinks ?? [],
      unit_cost: payload.unitCost ?? 0,
      offset_account_code: payload.offsetAccountCode ?? null,
      revenue_account_code: payload.revenueAccountCode ?? null,
      cogs_account_code: payload.cogsAccountCode ?? null,
      transaction_date: payload.transactionDate ?? null,
    }),
  });

  const row = result.data;
  return {
    id: row.id,
    itemId: row.item_id ?? null,
    productName: row.product_name,
    material: row.material,
    inventoryType: row.inventory_type,
    size: row.size,
    source: row.source,
    code: row.code,
    onHand: numberValue(row.quantity_on_hand),
    committed: numberValue(row.committed_quantity),
    available: numberValue(row.quantity_on_hand) - numberValue(row.committed_quantity),
    reorderLevel: numberValue(row.reorder_level),
    batchNumber: row.batch_number ?? "",
    productionDate: row.production_date ?? "",
    recordedBy: row.recorded_by ?? "Workspace User",
    journalEntryNumber: row.journal_entry_number ?? "Pending",
    inventoryAccountCode: row.inventory_account_code ?? "1300",
    inventoryAccountName: row.inventory_account_name ?? "VAT Receivable",
    attachments: row.attachments ?? [],
    documentLinks: row.document_links ?? [],
    lastUpdated: row.updated_at,
  };
}

export async function createInventoryAdjustment(payload: InventoryAdjustmentPayload): Promise<InventoryAdjustmentRecord> {
  const result = await request<ApiEnvelope<{
    id: number; date: string; reference: string; reason: string; item_count: number; status: "draft" | "posted";
    code: string; product_name: string; quantity: string | number; source: "production" | "purchase"; recorded_by?: string | null;
    journal_entry_number?: string | null; inventory_account_code?: string | null; inventory_account_name?: string | null; attachments?: Attachment[] | null;
    document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }> | null; transaction_type?: string | null;
  }>>("inventory/adjustments", {
    method: "POST",
    body: JSON.stringify({
      inventory_item_id: payload.inventoryItemId,
      quantity_delta: payload.quantityDelta,
      unit_cost: payload.unitCost ?? null,
      reason: payload.reason,
      reference: payload.reference ?? null,
      transaction_date: payload.transactionDate ?? null,
      adjustment_account_code: payload.adjustmentAccountCode ?? null,
      attachments: payload.attachments ?? [],
      document_links: payload.documentLinks ?? [],
      notes: payload.notes ?? null,
    }),
  });
  const row = result.data;
  return {
    id: row.id,
    date: row.date,
    reference: row.reference,
    reason: row.reason,
    itemCount: row.item_count,
    status: row.status,
    code: row.code,
    productName: row.product_name,
    quantity: numberValue(row.quantity),
    source: row.source,
    recordedBy: row.recorded_by ?? "Workspace User",
    journalEntryNumber: row.journal_entry_number ?? "Pending",
    inventoryAccountCode: row.inventory_account_code ?? "1150",
    inventoryAccountName: row.inventory_account_name ?? "Inventory",
    attachments: row.attachments ?? [],
    documentLinks: row.document_links ?? [],
    transactionType: row.transaction_type ?? undefined,
  };
}

export async function createInventorySale(payload: InventorySalePayload): Promise<InventoryAdjustmentRecord> {
  const result = await request<ApiEnvelope<{
    id: number; date: string; reference: string; reason: string; item_count: number; status: "draft" | "posted";
    code: string; product_name: string; quantity: string | number; source: "production" | "purchase"; recorded_by?: string | null;
    journal_entry_number?: string | null; inventory_account_code?: string | null; inventory_account_name?: string | null; attachments?: Attachment[] | null;
    document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }> | null; transaction_type?: string | null;
  }>>("inventory/sales", {
    method: "POST",
    body: JSON.stringify({
      inventory_item_id: payload.inventoryItemId,
      quantity: payload.quantity,
      unit_price: payload.unitPrice,
      unit_cost: payload.unitCost ?? null,
      tax_rate: payload.taxRate ?? 15,
      cash_account_code: payload.cashAccountCode ?? null,
      reference: payload.reference ?? null,
      transaction_date: payload.transactionDate ?? null,
      proforma_invoice: payload.proformaInvoice ?? null,
      tax_invoice: payload.taxInvoice ?? null,
      delivery_note: payload.deliveryNote ?? null,
      attachments: payload.attachments ?? [],
      document_links: payload.documentLinks ?? [],
    }),
  });
  const row = result.data;
  return {
    id: row.id,
    date: row.date,
    reference: row.reference,
    reason: row.reason,
    itemCount: row.item_count,
    status: row.status,
    code: row.code,
    productName: row.product_name,
    quantity: numberValue(row.quantity),
    source: row.source,
    recordedBy: row.recorded_by ?? "Workspace User",
    journalEntryNumber: row.journal_entry_number ?? "Pending",
    inventoryAccountCode: row.inventory_account_code ?? "1150",
    inventoryAccountName: row.inventory_account_name ?? "Inventory",
    attachments: row.attachments ?? [],
    documentLinks: row.document_links ?? [],
    transactionType: row.transaction_type ?? undefined,
  };
}

export async function listInventoryAdjustments(): Promise<InventoryAdjustmentRecord[]> {
  const result = await request<ApiEnvelope<Array<{
    id: number;
    date: string;
    reference: string;
    reason: string;
    item_count: number;
    status: "draft" | "posted";
    code: string;
    product_name: string;
    quantity: string | number;
    source: "production" | "purchase";
    recorded_by?: string | null;
    journal_entry_number?: string | null;
    inventory_account_code?: string | null;
    inventory_account_name?: string | null;
    attachments?: Attachment[] | null;
    document_links?: Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }> | null;
    transaction_type?: string | null;
  }>>>("inventory/adjustments");

  return result.data.map((row) => ({
    id: row.id,
    date: row.date,
    reference: row.reference,
    reason: row.reason,
    itemCount: row.item_count,
    status: row.status,
    code: row.code,
    productName: row.product_name,
    quantity: numberValue(row.quantity),
    source: row.source,
    recordedBy: row.recorded_by ?? "Workspace User",
    journalEntryNumber: row.journal_entry_number ?? "Pending",
    inventoryAccountCode: row.inventory_account_code ?? "1300",
    inventoryAccountName: row.inventory_account_name ?? "VAT Receivable",
    attachments: row.attachments ?? [],
    documentLinks: row.document_links ?? [],
    transactionType: row.transaction_type ?? undefined,
  }));
}

export async function translateBusinessDescription(text: string): Promise<TranslationResult> {
  const result = await platformRequest<ApiEnvelope<TranslationResult>>("translate", {
    method: "POST",
    body: JSON.stringify({ text }),
  });

  return result.data;
}

export type AuditTrailEventRecord = {
  id: number | string;
  event: string;
  auditableType: string;
  auditableId: number;
  createdAt: string;
  detail: string;
  metadata: Record<string, unknown> | null;
};

export async function listAuditTrail(): Promise<AuditTrailEventRecord[]> {
  const result = await request<ApiEnvelope<Array<{
    id: number | string;
    event: string;
    auditable_type: string;
    auditable_id: number;
    created_at: string;
    detail: string;
    metadata?: Record<string, unknown> | null;
  }>>>("reports/audit-trail");

  return result.data.map((row) => ({
    id: row.id,
    event: row.event,
    auditableType: row.auditable_type,
    auditableId: row.auditable_id,
    createdAt: row.created_at,
    detail: row.detail,
    metadata: row.metadata ?? null,
  }));
}

export async function duplicateDocument(documentId: number): Promise<WorkspaceDocumentRecord> {
  const result = await request<ApiEnvelope<BackendDocument>>(`documents/${documentId}/duplicate`, {
    method: "POST",
  });

  return mapDocument(result.data);
}
