export type ProductConfig = {
  supportWhatsappNumber: string;
  freeTrialDays: number;
  freeInvoiceLimit: number;
  paidPlanMonthlyPriceSar: number;
  defaultAgentCommissionRate: number;
};

export const defaultProductConfig: ProductConfig = {
  supportWhatsappNumber: "966500000000",
  freeTrialDays: 45,
  freeInvoiceLimit: 1,
  paidPlanMonthlyPriceSar: 40,
  defaultAgentCommissionRate: 20,
};

function getBackendBaseUrl() {
  const baseUrl = process.env.GULF_HISAB_API_BASE_URL ?? process.env.NEXT_PUBLIC_GULF_HISAB_API_BASE_URL;
  return baseUrl?.replace(/\/$/, "") ?? null;
}

export async function getProductConfig(): Promise<ProductConfig> {
  const baseUrl = getBackendBaseUrl();

  if (!baseUrl) {
    return defaultProductConfig;
  }

  try {
    const response = await fetch(`${baseUrl}/api/public/product-config`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return defaultProductConfig;
    }

    const payload = await response.json() as {
      data?: {
        support_whatsapp_number?: string;
        free_trial_days?: number;
        free_invoice_limit?: number;
        paid_plan_monthly_price_sar?: number;
        default_agent_commission_rate?: number;
      };
    };

    return {
      supportWhatsappNumber: payload.data?.support_whatsapp_number ?? defaultProductConfig.supportWhatsappNumber,
      freeTrialDays: payload.data?.free_trial_days ?? defaultProductConfig.freeTrialDays,
      freeInvoiceLimit: payload.data?.free_invoice_limit ?? defaultProductConfig.freeInvoiceLimit,
      paidPlanMonthlyPriceSar: payload.data?.paid_plan_monthly_price_sar ?? defaultProductConfig.paidPlanMonthlyPriceSar,
      defaultAgentCommissionRate: payload.data?.default_agent_commission_rate ?? defaultProductConfig.defaultAgentCommissionRate,
    };
  } catch {
    return defaultProductConfig;
  }
}

export function buildWhatsAppHref(number: string, message = "Hi, I need help with invoicing") {
  const sanitized = number.replace(/[^\d]/g, "");
  return `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
}