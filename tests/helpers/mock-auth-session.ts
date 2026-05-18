import { vi } from "vitest";

const DEFAULT_ORIGIN = "http://127.0.0.1:3000";

type AuthSessionPayload = {
  data: {
    id: number;
    userId: number;
    name: string;
    email: string;
    authToken?: string;
    companyId?: number;
    platformRole?: string;
  };
  access_status: "ready" | "guest" | "blocked";
  active_company_id: number | null;
};

function resolveUrl(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return new URL(input, DEFAULT_ORIGIN);
  }

  if (input instanceof URL) {
    return input;
  }

  return new URL(input.url, DEFAULT_ORIGIN);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function installAuthSessionFetchMock(payload?: Partial<AuthSessionPayload>) {
  const nativeFetch = globalThis.fetch.bind(globalThis);
  const sessionPayload: AuthSessionPayload = {
    data: {
      id: 1,
      userId: 1,
      name: "Vitest",
      email: "vitest@localhost",
      ...payload?.data,
    },
    access_status: payload?.access_status ?? "ready",
    active_company_id: payload?.active_company_id ?? 1,
  };

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = resolveUrl(input);

    if (url.pathname === "/api/auth/session") {
      return jsonResponse(sessionPayload);
    }

    return nativeFetch(input, init);
  });

  globalThis.fetch = fetchMock as typeof fetch;

  return () => {
    globalThis.fetch = nativeFetch;
  };
}