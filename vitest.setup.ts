import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/workspace/user/invoices/new",
}));

const VITEST_ORIGIN = "http://127.0.0.1:3000";

const workspaceJsonHeaders = {
  "Content-Type": "application/json",
  "X-Workspace-Mode": "backend",
};

function jsonWorkspaceEnvelope(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), { status, headers: workspaceJsonHeaders });
}

const stubCompanySettings = {
  company: {
    legal_name: "Vitest Trading Co",
    trade_name: "Vitest Trading",
    tax_number: "300000000000001",
    registration_number: "1010123456",
    base_currency: "SAR",
    locale: "en",
    timezone: "Asia/Riyadh",
  },
  settings: {
    default_language: "en",
    invoice_prefix: "INV",
    credit_note_prefix: "CN",
    payment_prefix: "PAY",
    vendor_bill_prefix: "VB",
    purchase_invoice_prefix: "PINV",
    purchase_credit_note_prefix: "PCRN",
    default_receivable_account_code: "110",
    default_payable_account_code: "200",
    default_revenue_account_code: "400",
    default_expense_account_code: "690",
    default_cash_account_code: "120",
    default_customer_advance_account_code: "230",
    default_supplier_advance_account_code: "125",
    default_vat_payable_account_code: "220",
    default_vat_receivable_account_code: "130",
    zatca_environment: "sandbox",
    numbering_rules: {
      company_address_country: "Saudi Arabia",
    },
  },
};

const stubAccessProfile = {
  user: {
    id: 1,
    name: "Vitest",
    email: "vitest@localhost",
    platform_role: "customer",
    is_platform_active: true,
  },
  platform_abilities: [] as string[],
  company: { id: 1, legal_name: "Vitest Trading Co", is_active: true },
  membership: {
    role: "owner",
    is_active: true,
    permissions: [] as string[] | null,
    abilities: ["*"],
  },
  subscription: {
    id: 1,
    status: "active",
    plan_code: "growth",
    plan_name: "Growth",
    monthly_price_sar: "299",
    trial_days: 0,
    trial_ends_at: null as string | null,
    started_at: "2026-04-29",
    plan: {
      invoice_limit: null as number | null,
      customer_limit: null as number | null,
      accountant_seat_limit: null as number | null,
      feature_flags: {
        invoicing_trial_days: 365,
        accounting_trial_days: 365,
      } as Record<string, boolean | number | string | null>,
    },
  },
  referral: null as { referral_code: string; agent_name?: string | null } | null,
};

const stubIntelligence = {
  suggestions: [] as Array<{ label: string; reason: string; confidence: string | number }>,
  anomalies: [] as Array<{ severity: "info" | "warning" | "critical"; message: string; confidence: string | number }>,
  reminders: [] as Array<{ label: string; reason: string; priority: "low" | "medium" | "high" }>,
  confidenceScore: 0,
  patterns: {} as Record<string, unknown>,
  metrics: {} as Record<string, unknown>,
};

const nativeFetch = globalThis.fetch.bind(globalThis);

function normalizeFetchInput(input: RequestInfo | URL, init?: RequestInit): { href: string; requestInput: RequestInfo; init?: RequestInit } {
  if (typeof input === "string") {
    const href = input.startsWith("http")
      ? input
      : `${VITEST_ORIGIN}${input.startsWith("/") ? input : `/${input}`}`;
    return { href, requestInput: href, init };
  }
  if (input instanceof URL) {
    return { href: input.href, requestInput: input.href, init };
  }
  const href = new URL(input.url, VITEST_ORIGIN).href;
  return { href, requestInput: new Request(href, input), init: undefined };
}

globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const { href, requestInput, init: resolvedInit } = normalizeFetchInput(input, init);
  const url = new URL(href);
  const method = ((input instanceof Request ? input.method : init?.method) ?? "GET").toUpperCase();

  if (url.pathname === "/api/auth/session") {
    return new Response(
      JSON.stringify({
        data: {
          id: 1,
          userId: 1,
          name: "Vitest",
          email: "vitest@localhost",
        },
        access_status: "ready",
        active_company_id: 1,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (url.pathname === "/api/workspace/settings" || url.pathname.startsWith("/api/workspace/settings")) {
    return jsonWorkspaceEnvelope(stubCompanySettings);
  }

  if (url.pathname === "/api/workspace/access-profile") {
    return jsonWorkspaceEnvelope(stubAccessProfile);
  }

  if (url.pathname === "/api/workspace/templates") {
    return jsonWorkspaceEnvelope([]);
  }

  if (url.pathname === "/api/workspace/custom-fields") {
    return jsonWorkspaceEnvelope([]);
  }

  if (url.pathname === "/api/workspace/cost-centers" || url.pathname.startsWith("/api/workspace/cost-centers")) {
    return jsonWorkspaceEnvelope([]);
  }

  if (url.pathname === "/api/workspace/inventory/stock") {
    return jsonWorkspaceEnvelope([]);
  }

  if (url.pathname === "/api/workspace/intelligence/transaction" && method === "POST") {
    return jsonWorkspaceEnvelope(stubIntelligence);
  }

  if (url.pathname === "/api/workspace/documents" || url.pathname.startsWith("/api/workspace/documents")) {
    if (method === "GET") {
      return jsonWorkspaceEnvelope([]);
    }
  }

  if (url.pathname.startsWith("/api/workspace")) {
    if (method === "GET") {
      return jsonWorkspaceEnvelope([]);
    }
    return jsonWorkspaceEnvelope({});
  }

  return nativeFetch(requestInput, resolvedInit);
}) as typeof fetch;
