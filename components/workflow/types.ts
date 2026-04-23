export type ContactKind = "customer" | "supplier";
export type ItemKind = "product" | "service" | "raw_material" | "finished_good";
export type TransactionKind = "invoice" | "bill";

export type ContactRecord = {
  id: string;
  backendId?: number;
  kind: ContactKind;
  displayName: string;
  email: string;
  phone: string;
  city: string;
  country?: string;
  origin?: "inside_ksa" | "outside_ksa";
  vatNumber?: string;
  street?: string;
  buildingNumber?: string;
  district?: string;
  postalCode?: string;
  secondaryNumber?: string;
  crNumber?: string;
  additionalDocumentNumbers?: string;
  defaultRevenueAccount?: string;
  defaultCostCenter?: string;
  defaultTax?: string;
  purchasingDefaults?: string;
  beneficiaryName?: string;
  beneficiaryBank?: string;
  beneficiaryIban?: string;
  beneficiaryReference?: string;
  customFields?: string;
};

export type ItemRecord = {
  id: string;
  backendId?: number;
  kind: ItemKind;
  inventoryClassification?: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  salePrice: number;
  purchasePrice: number;
  taxLabel: string;
  isActive?: boolean;
};

export type TransactionLine = {
  id: string;
  itemId: string | null;
  backendItemId?: number | null;
  description: string;
  quantity: number;
  price: number;
  costCenterId?: number | null;
  customFields: Record<string, string | number | boolean | null>;
};

export type PickerOption = {
  id: string;
  label: string;
  caption?: string;
  meta?: string;
  group?: string;
};

export type ContactPayload = {
  kind: ContactKind;
  displayName: string;
  email: string;
  phone: string;
  city: string;
  country?: string;
  origin?: "inside_ksa" | "outside_ksa";
  vatNumber?: string;
  street?: string;
  buildingNumber?: string;
  district?: string;
  postalCode?: string;
  secondaryNumber?: string;
  crNumber?: string;
  additionalDocumentNumbers?: string;
  defaultRevenueAccount?: string;
  defaultCostCenter?: string;
  defaultTax?: string;
  purchasingDefaults?: string;
  beneficiaryName?: string;
  beneficiaryBank?: string;
  beneficiaryIban?: string;
  beneficiaryReference?: string;
  customFields?: string;
};

export type ItemPayload = {
  kind: ItemKind;
  inventoryClassification?: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  salePrice: number;
  purchasePrice: number;
  taxLabel: string;
  isActive?: boolean;
};