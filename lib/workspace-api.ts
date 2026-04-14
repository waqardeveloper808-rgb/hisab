import type { ContactPayload, ContactRecord, ItemPayload, ItemRecord, TransactionKind, TransactionLine } from "@/components/workflow/types";

type ApiEnvelope<T> = {
  data: T;
};

type BackendContact = {
  id: number;
  type: "customer" | "supplier";
  display_name: string;
  email?: string | null;
  phone?: string | null;
  billing_address?: {
    city?: string | null;
  } | null;
};

type BackendItem = {
  id: number;
  type: "product" | "service";
  name: string;
  sku?: string | null;
  default_sale_price?: string | number | null;
  default_purchase_price?: string | number | null;
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
  template_id?: number | null;
  cost_center_id?: number | null;
  document_number?: string | null;
  issue_date?: string | null;
  due_date?: string | null;
  notes?: string | null;
  grand_total?: string | number | null;
  balance_due?: string | number | null;
  paid_total?: string | number | null;
  tax_total?: string | number | null;
  taxable_total?: string | number | null;
  contact?: BackendContactSummary | null;
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
  dueDate: string;
  grandTotal: number;
  balanceDue: number;
  paidTotal: number;
  taxableTotal: number;
  taxTotal: number;
  contactName: string;
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
    taxNumber: string;
    registrationNumber: string;
    baseCurrency: string;
    locale: string;
    timezone: string;
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

const workspaceApiBase = "/api/workspace";

function getWorkspaceApiBase() {
  return workspaceApiBase;
}
const platformApiBase = "/api/platform";

function getPlatformApiBase() {
  return platformApiBase;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getWorkspaceApiBase()}/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (! response.ok) {
    throw new Error(await extractErrorMessage(response, `Request failed for ${path}`));
  }

  return response.json() as Promise<T>;
}

async function platformRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getPlatformApiBase()}/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
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
  return {
    id: String(contact.id),
    backendId: contact.id,
    kind: contact.type,
    displayName: contact.display_name,
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    city: contact.billing_address?.city ?? "",
  };
}

function mapItem(item: BackendItem): ItemRecord {
  const taxName = item.tax_category?.name?.trim();
  const taxRate = item.tax_category?.rate;
  const taxLabel = taxName
    ? taxRate !== undefined && taxRate !== null
      ? `${taxName} ${numberValue(taxRate)}%`
      : taxName
    : "Standard VAT";

  return {
    id: String(item.id),
    backendId: item.id,
    kind: item.type,
    name: item.name,
    sku: item.sku ?? "",
    salePrice: numberValue(item.default_sale_price),
    purchasePrice: numberValue(item.default_purchase_price),
    taxLabel,
  };
}

function mapDocument(document: BackendDocument): WorkspaceDocumentRecord {
  return {
    id: document.id,
    type: document.type,
    status: document.status,
    number: document.document_number ?? "Draft",
    issueDate: document.issue_date ?? "",
    dueDate: document.due_date ?? "",
    grandTotal: numberValue(document.grand_total),
    balanceDue: numberValue(document.balance_due),
    paidTotal: numberValue(document.paid_total),
    taxableTotal: numberValue(document.taxable_total),
    taxTotal: numberValue(document.tax_total),
    contactName: document.contact?.display_name ?? "",
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
  return {
    company: {
      legalName: payload.company.legal_name,
      tradeName: payload.company.trade_name ?? "",
      taxNumber: payload.company.tax_number ?? "",
      registrationNumber: payload.company.registration_number ?? "",
      baseCurrency: payload.company.base_currency,
      locale: payload.company.locale,
      timezone: payload.company.timezone,
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
      numberingRules: payload.settings.numbering_rules ?? {},
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
  return {
    id: template.id,
    name: template.name,
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
        billing_address: payload.city ? { city: payload.city } : null,
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
        name: payload.name,
        sku: payload.sku || null,
        default_sale_price: payload.salePrice,
        default_purchase_price: payload.purchasePrice,
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
      template_id: payload.templateId ?? null,
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
      due_date: payload.dueDate,
      notes: [payload.reference, payload.notes].filter(Boolean).join("\n"),
      lines,
    }),
  });

  const finalized = await request<ApiEnvelope<BackendDocument>>(`${documentPath}/${created.data.id}/finalize`, {
    method: "POST",
  });

  let payment: WorkspacePaymentRecord | null = null;

  if ((payload.paymentAmount ?? 0) > 0) {
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
      template_id: payload.templateId ?? null,
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
      due_date: payload.dueDate,
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
      template_id: payload.templateId ?? null,
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
      due_date: payload.dueDate,
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

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
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
    }>>("reports/dashboard-summary");

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
  } catch {
    return {
      openInvoices: 0,
      openBills: 0,
      receivablesTotal: 0,
      payablesTotal: 0,
      vatLines: 0,
      recentInvoices: [],
      recentBills: [],
      recentPayments: [],
      backendReady: false,
    };
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
  } catch {
    return {
      invoiceRegister: [],
      billsRegister: [],
      paymentsRegister: [],
      backendReady: false,
    };
  }
}

export async function getReportsSnapshot(): Promise<ReportsSnapshot> {
  try {
    const [vatSummary, vatDetail, receivablesAging, payablesAging, trialBalance, profitLoss, balanceSheet, profitByCustomer, profitByProduct, expenseBreakdown, auditTrail] = await Promise.all([
      request<ApiEnvelope<Array<{ code: string; name: string; tax_rate: string | number; taxable_amount: string | number; tax_amount: string | number }>>>("reports/vat-summary"),
      request<ApiEnvelope<Array<{ code: string; name: string; tax_rate: string | number; output_taxable_amount: string | number; output_tax_amount: string | number; input_taxable_amount: string | number; input_tax_amount: string | number }>>>("reports/vat-detail"),
      request<ApiEnvelope<Array<{ document_number: string; balance_due: string | number; bucket: string }>>>("reports/receivables-aging"),
      request<ApiEnvelope<Array<{ document_number: string; balance_due: string | number; bucket: string }>>>("reports/payables-aging"),
      request<ApiEnvelope<Array<{ code: string; name: string; type: string; debit_total: string | number; credit_total: string | number; balance: string | number }>>>("reports/trial-balance"),
      request<ApiEnvelope<{ lines: Array<{ code: string; name: string; type: string; net_amount: string | number }>; revenue_total: string | number; expense_total: string | number; net_profit: string | number }>>("reports/profit-loss"),
      request<ApiEnvelope<{ assets: Array<{ code: string; name: string; type: string; balance: string | number }>; liabilities: Array<{ code: string; name: string; type: string; balance: string | number }>; equity: Array<{ code: string; name: string; type: string; balance: string | number }>; asset_total: string | number; liability_total: string | number; equity_total: string | number }>>("reports/balance-sheet"),
      request<ApiEnvelope<Array<{ contact_id: number; contact_name: string; revenue: string | number; estimated_cost: string | number; profit: string | number }>>>("reports/profit-by-customer"),
      request<ApiEnvelope<Array<{ item_id: number; item_name: string; quantity: string | number; revenue: string | number; estimated_cost: string | number; profit: string | number }>>>("reports/profit-by-product"),
      request<ApiEnvelope<Array<{ category_code: string; category_name: string; total: string | number }>>>("reports/expense-breakdown"),
      request<ApiEnvelope<Array<{ id: number; event: string; auditable_type: string; auditable_id: number; created_at: string }>>>("reports/audit-trail"),
    ]);

    return {
      vatSummary: vatSummary.data.map((row) => ({
        code: row.code,
        name: row.name,
        rate: numberValue(row.tax_rate),
        taxableAmount: numberValue(row.taxable_amount),
        taxAmount: numberValue(row.tax_amount),
      })),
      vatDetail: vatDetail.data.map((row) => ({
        code: row.code,
        name: row.name,
        rate: numberValue(row.tax_rate),
        outputTaxableAmount: numberValue(row.output_taxable_amount),
        outputTaxAmount: numberValue(row.output_tax_amount),
        inputTaxableAmount: numberValue(row.input_taxable_amount),
        inputTaxAmount: numberValue(row.input_tax_amount),
      })),
      receivablesAging: receivablesAging.data.map((row) => ({
        documentNumber: row.document_number,
        balanceDue: numberValue(row.balance_due),
        bucket: row.bucket,
      })),
      payablesAging: payablesAging.data.map((row) => ({
        documentNumber: row.document_number,
        balanceDue: numberValue(row.balance_due),
        bucket: row.bucket,
      })),
      trialBalance: trialBalance.data.map((row) => ({
        code: row.code,
        name: row.name,
        type: row.type,
        debitTotal: numberValue(row.debit_total),
        creditTotal: numberValue(row.credit_total),
        balance: numberValue(row.balance),
      })),
      profitLoss: {
        lines: profitLoss.data.lines.map((row) => ({
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
        assets: balanceSheet.data.assets.map((row) => ({ ...row, balance: numberValue(row.balance) })),
        liabilities: balanceSheet.data.liabilities.map((row) => ({ ...row, balance: numberValue(row.balance) })),
        equity: balanceSheet.data.equity.map((row) => ({ ...row, balance: numberValue(row.balance) })),
        assetTotal: numberValue(balanceSheet.data.asset_total),
        liabilityTotal: numberValue(balanceSheet.data.liability_total),
        equityTotal: numberValue(balanceSheet.data.equity_total),
      },
      profitByCustomer: profitByCustomer.data.map((row) => ({
        contactId: row.contact_id,
        contactName: row.contact_name,
        revenue: numberValue(row.revenue),
        estimatedCost: numberValue(row.estimated_cost),
        profit: numberValue(row.profit),
      })),
      profitByProduct: profitByProduct.data.map((row) => ({
        itemId: row.item_id,
        itemName: row.item_name,
        quantity: numberValue(row.quantity),
        revenue: numberValue(row.revenue),
        estimatedCost: numberValue(row.estimated_cost),
        profit: numberValue(row.profit),
      })),
      expenseBreakdown: expenseBreakdown.data.map((row) => ({
        categoryCode: row.category_code,
        categoryName: row.category_name,
        total: numberValue(row.total),
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
  } catch {
    return {
      vatSummary: [],
      vatDetail: [],
      receivablesAging: [],
      payablesAging: [],
      trialBalance: [],
      profitLoss: { lines: [], revenueTotal: 0, expenseTotal: 0, netProfit: 0 },
      balanceSheet: { assets: [], liabilities: [], equity: [], assetTotal: 0, liabilityTotal: 0, equityTotal: 0 },
      profitByCustomer: [],
      profitByProduct: [],
      expenseBreakdown: [],
      auditTrail: [],
      backendReady: false,
    };
  }
}

export async function getOpenDocumentsForPayments() {
  const registers = await getRegistersSnapshot();

  return {
    backendReady: registers.backendReady,
    incoming: registers.invoiceRegister.filter((row) => row.balanceDue > 0),
    outgoing: registers.billsRegister.filter((row) => row.balanceDue > 0),
  };
}

export async function getBooksSnapshot(): Promise<BooksSnapshot> {
  try {
    const [trialBalance, generalLedger, auditTrail] = await Promise.all([
      request<ApiEnvelope<Array<{ code: string; name: string; type: string; debit_total: string | number; credit_total: string | number; balance: string | number }>>>("reports/trial-balance"),
      request<ApiEnvelope<Array<{ id: number; entry_number: string; entry_date: string; account_code: string; account_name: string; contact_name?: string | null; document_number?: string | null; cost_center_code?: string | null; cost_center_name?: string | null; description?: string | null; debit: string | number; credit: string | number; running_balance: string | number }>>>("reports/general-ledger"),
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
  } catch {
    return {
      trialBalance: [],
      generalLedger: [],
      auditTrail: [],
      backendReady: false,
    };
  }
}

export async function getCompanySettings(): Promise<CompanySettingsSnapshot | null> {
  try {
    const result = await request<ApiEnvelope<BackendCompanySettingsEnvelope>>("settings");
    return mapCompanySettings(result.data);
  } catch {
    return null;
  }
}

export async function updateCompanySettings(snapshot: CompanySettingsSnapshot): Promise<CompanySettingsSnapshot> {
  const result = await request<ApiEnvelope<BackendCompanySettingsEnvelope>>("settings", {
    method: "PUT",
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
        numbering_rules: snapshot.settings.numberingRules,
      },
    }),
  });

  return mapCompanySettings(result.data);
}

export function isBackendConfigured() {
  return true;
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
  } catch {
    return {
      agent: {
        referralCode: "",
        commissionRate: 20,
        isActive: true,
      },
      summary: {
        totalReferrals: 0,
        totalSignups: 0,
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        pendingCommission: 0,
        earnedCommission: 0,
      },
      referrals: [],
      backendReady: false,
    };
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
  const result = await request<ApiEnvelope<BackendDocumentDetail>>(`documents/${documentId}`);
  return mapDocumentDetail(result.data);
}

export async function getDocumentPreview(documentId: number, options?: { templateId?: number | null }): Promise<DocumentPreviewRecord> {
  const searchParams = new URLSearchParams();

  if (typeof options?.templateId === "number") {
    searchParams.set("template_id", String(options.templateId));
  }

  const path = searchParams.size ? `documents/${documentId}/preview?${searchParams.toString()}` : `documents/${documentId}/preview`;
  const result = await request<ApiEnvelope<BackendDocumentPreview>>(path);
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

export async function duplicateDocument(documentId: number): Promise<DocumentDetailRecord> {
  const result = await request<ApiEnvelope<BackendDocumentDetail>>(`documents/${documentId}/duplicate`, {
    method: "POST",
  });
  return mapDocumentDetail(result.data);
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

export function getDocumentPdfUrl(documentId: number) {
  return `${getWorkspaceApiBase()}/documents/${documentId}/export-pdf`;
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

export async function listCompanyAssets(): Promise<CompanyAssetRecord[]> {
  const result = await request<ApiEnvelope<BackendCompanyAsset[]>>("assets");
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