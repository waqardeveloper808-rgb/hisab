/**
 * Local copy of `lib/workspace-preview` document/template/contact shapes — avoid circular import.
 */
export type GuestPreviewContact = {
  id: number;
  type: "customer" | "supplier";
  display_name: string;
  display_name_ar?: string | null;
  email?: string | null;
  phone?: string | null;
  vat_number?: string | null;
  billing_address?: {
    city?: string | null;
    line_1?: string | null;
    line_1_ar?: string | null;
  } | null;
};

export type GuestPreviewTemplate = {
  id: number;
  name: string;
  document_types?: string[] | null;
  locale_mode: string;
  accent_color: string;
  watermark_text?: string | null;
  header_html?: string | null;
  footer_html?: string | null;
  settings?: Record<string, string | number | boolean | null> | null;
  logo_asset_id?: number | null;
  logo_asset?: { id: number; public_url: string; original_name: string } | null;
  is_default: boolean;
  is_active: boolean;
};

export type GuestPreviewLine = {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  gross_amount: number;
  metadata?: { custom_fields?: Record<string, string | number | boolean | null> | null } | null;
};

export type GuestPreviewDocument = {
  id: number;
  type: string;
  status: string;
  contact_id: number;
  document_number: string;
  issue_date: string;
  due_date: string;
  grand_total: number;
  balance_due: number;
  paid_total: number;
  tax_total: number;
  taxable_total: number;
  contact: { display_name: string };
  title: string;
  language_code: string;
  custom_fields?: Record<string, string | number | boolean | null>;
  template?: { id: number; name: string } | null;
  notes?: string;
  lines?: GuestPreviewLine[];
  supply_date?: string | null;
};
