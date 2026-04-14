export type ContactKind = "customer" | "supplier";
export type ItemKind = "product" | "service";
export type TransactionKind = "invoice" | "bill";

export type ContactRecord = {
  id: string;
  backendId?: number;
  kind: ContactKind;
  displayName: string;
  email: string;
  phone: string;
  city: string;
};

export type ItemRecord = {
  id: string;
  backendId?: number;
  kind: ItemKind;
  name: string;
  sku: string;
  salePrice: number;
  purchasePrice: number;
  taxLabel: string;
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
};

export type ItemPayload = {
  kind: ItemKind;
  name: string;
  sku: string;
  salePrice: number;
  purchasePrice: number;
  taxLabel: string;
};