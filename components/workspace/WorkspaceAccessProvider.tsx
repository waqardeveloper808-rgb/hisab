"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { WorkspaceAccessProfile } from "@/lib/workspace-api";
import type { WorkspaceAccessStatus } from "@/lib/workspace-session";

const WorkspaceAccessContext = createContext<WorkspaceAccessProfile | null>(null);
const WorkspaceSessionContext = createContext<{
  id: number;
  userId: number;
  name: string;
  email: string;
  authToken?: string;
  companyId?: number;
  platformRole?: string;
  activeCompanyId?: number | null;
  activeCompanyLegalName?: string | null;
  accessStatus?: WorkspaceAccessStatus;
} | null>(null);

export function WorkspaceAccessProvider({
  value,
  session,
  accessStatus,
  children,
}: {
  value: WorkspaceAccessProfile | null;
  session: {
    id: number;
    userId: number;
    name: string;
    email: string;
    authToken?: string;
    companyId?: number;
    platformRole?: string;
    activeCompanyId?: number | null;
    activeCompanyLegalName?: string | null;
    accessStatus?: WorkspaceAccessStatus;
  };
  accessStatus?: WorkspaceAccessStatus;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [resolvedSession, setResolvedSession] = useState({
    ...session,
    accessStatus: session.accessStatus ?? accessStatus,
  });
  const isGuestPreview = (resolvedSession.id ?? 0) <= 0 || resolvedSession.accessStatus === "guest";

  useEffect(() => {
    setResolvedSession((current) => ({
      ...current,
      ...session,
      accessStatus: session.accessStatus ?? accessStatus,
    }));
  }, [accessStatus, session]);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/session", { cache: "no-store", credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error(`session:${response.status}`);
          }

          return;
        }

        const payload = await response.json() as {
          data?: {
            id: number;
            userId?: number;
            user_id?: number;
            name: string;
            email: string;
            authToken?: string;
            auth_token?: string;
            companyId?: number;
            company_id?: number;
            platformRole?: string;
          access_status?: WorkspaceAccessStatus;
          active_company_id?: number | null;
          workspaceContext?: {
            activeCompany?: {
              legalName?: string;
            };
          };
          workspace_context?: {
            active_company?: {
              legal_name?: string;
            };
          };
          } | null;
        active_company_id?: number | null;
        access_status?: WorkspaceAccessStatus;
        };

        if (!active || !payload.data) {
          return;
        }

        setResolvedSession({
          id: payload.data.id,
          userId: payload.data.userId ?? payload.data.user_id ?? payload.data.id,
          name: payload.data.name,
          email: payload.data.email,
          authToken: payload.data.authToken ?? payload.data.auth_token,
          companyId: payload.data.companyId ?? payload.data.company_id,
          platformRole: payload.data.platformRole,
          activeCompanyId: payload.active_company_id ?? payload.data.active_company_id ?? null,
          activeCompanyLegalName: payload.data.workspaceContext?.activeCompany?.legalName ?? payload.data.workspace_context?.active_company?.legal_name ?? null,
          accessStatus: payload.access_status ?? payload.data.access_status ?? accessStatus,
        });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "";

        if (!message.startsWith("session:")) {
          return;
        }

        if (!active) {
          return;
        }

        router.replace(`/login?next=${encodeURIComponent(pathname || "/workspace/user")}`);
      });

    return () => {
      active = false;
    };
  }, [pathname, router]);

  useLayoutEffect(() => {
    if (typeof window === "undefined" || !isGuestPreview) {
      return;
    }

    const nativeFetch = window.fetch.bind(window);
    const previewIntelligencePayload = {
      data: {
        suggestions: [
          {
            label: "Preview workspace",
            reason: "The current session is using controlled demo data and keeps changes inside the preview store.",
            confidence: 100,
          },
        ],
        anomalies: [],
        reminders: [
          {
            label: "Sign in for live company data",
            reason: "Preview mode lets you explore the full workspace safely, but live posting still requires authentication.",
            priority: "medium",
          },
        ],
        confidenceScore: 100,
        patterns: {
          source: "preview",
        },
        metrics: {
          preview: true,
        },
      },
    };
    const previewHeaders = {
      "Content-Type": "application/json",
      "X-Workspace-Mode": "preview",
    };

    function isWorkspaceApiRequest(input: string | URL | Request) {
      const rawUrl = typeof input === "string" || input instanceof URL ? String(input) : input.url;
      const resolvedUrl = new URL(rawUrl, window.location.origin);
      return resolvedUrl.origin === window.location.origin && resolvedUrl.pathname.startsWith("/api/workspace");
    }

    function resolveWorkspaceUrl(input: string | URL | Request) {
      const rawUrl = typeof input === "string" || input instanceof URL ? String(input) : input.url;
      return new URL(rawUrl, window.location.origin);
    }

    function buildPreviewUrl(url: URL) {
      const previewUrl = new URL(url.toString());
      previewUrl.searchParams.set("mode", "preview");
      return previewUrl;
    }

    function buildBlockedPreviewResponse() {
      return new Response(JSON.stringify({
        message: "Sign in to save changes. Preview mode blocks destructive actions.",
        access_status: "guest",
      }), {
        status: 403,
        headers: previewHeaders,
      });
    }

    function buildWorkspaceDataResponse(payload: unknown, status = 200, headers?: HeadersInit) {
      return new Response(JSON.stringify(payload), {
        status,
        headers: {
          "Content-Type": "application/json",
          "X-Workspace-Mode": "backend",
          ...headers,
        },
      });
    }

    async function buildDashboardSummaryResponse(baseUrl: URL) {
      const [invoiceRegister, billsRegister, paymentsRegister, vatDetail] = await Promise.all([
        nativeFetch(buildPreviewUrl(new URL("/api/workspace/reports/invoice-register", baseUrl)), { headers: previewHeaders, credentials: "include", cache: "no-store" }),
        nativeFetch(buildPreviewUrl(new URL("/api/workspace/reports/bills-register", baseUrl)), { headers: previewHeaders, credentials: "include", cache: "no-store" }),
        nativeFetch(buildPreviewUrl(new URL("/api/workspace/reports/payments-register", baseUrl)), { headers: previewHeaders, credentials: "include", cache: "no-store" }),
        nativeFetch(buildPreviewUrl(new URL("/api/workspace/reports/vat-detail", baseUrl)), { headers: previewHeaders, credentials: "include", cache: "no-store" }),
      ]);

      const [invoicePayload, billsPayload, paymentsPayload, vatPayload] = await Promise.all([
        invoiceRegister.json() as Promise<{ data?: Array<Record<string, unknown>> }>,
        billsRegister.json() as Promise<{ data?: Array<Record<string, unknown>> }>,
        paymentsRegister.json() as Promise<{ data?: Array<Record<string, unknown>> }>,
        vatDetail.json() as Promise<{ data?: Array<Record<string, unknown>> }>,
      ]);

      const recentInvoices = Array.isArray(invoicePayload.data) ? invoicePayload.data : [];
      const recentBills = Array.isArray(billsPayload.data) ? billsPayload.data : [];
      const recentPayments = Array.isArray(paymentsPayload.data) ? paymentsPayload.data : [];
      const vatLines = Array.isArray(vatPayload.data) ? vatPayload.data.length : 0;
      const receivablesTotal = recentInvoices.reduce((total, row) => total + Number(row.balance_due ?? 0), 0);
      const payablesTotal = recentBills.reduce((total, row) => total + Number(row.balance_due ?? 0), 0);
      const openInvoices = recentInvoices.filter((row) => Number(row.balance_due ?? 0) > 0).length;
      const openBills = recentBills.filter((row) => Number(row.balance_due ?? 0) > 0).length;

      return buildWorkspaceDataResponse({
        data: {
          open_invoices: openInvoices,
          open_bills: openBills,
          receivables_total: receivablesTotal,
          payables_total: payablesTotal,
          vat_lines: vatLines,
          recent_invoices: recentInvoices,
          recent_bills: recentBills,
          recent_payments: recentPayments,
        },
      });
    }

    async function forwardPreviewResponse(previewUrl: URL, init?: RequestInit) {
      const response = await nativeFetch(previewUrl, {
        ...init,
        credentials: init?.credentials ?? "include",
        cache: "no-store",
        headers: (() => {
          const nextHeaders = new Headers(init?.headers);
          nextHeaders.set("X-Workspace-Mode", "preview");
          return nextHeaders;
        })(),
      });
      const body = await response.text();
      const headers = new Headers(response.headers);
      headers.set("X-Workspace-Mode", "backend");
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (!isWorkspaceApiRequest(input)) {
        return nativeFetch(input, init);
      }

      const workspaceUrl = resolveWorkspaceUrl(input);
      const previewUrl = buildPreviewUrl(workspaceUrl);
      const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
      if (method === "DELETE") {
        return buildBlockedPreviewResponse();
      }

      if (workspaceUrl.pathname === "/api/workspace/reports/dashboard-summary") {
        return buildDashboardSummaryResponse(workspaceUrl);
      }
      if (workspaceUrl.pathname === "/api/workspace/intelligence/overview") {
        return buildWorkspaceDataResponse(previewIntelligencePayload);
      }

      return forwardPreviewResponse(previewUrl, { ...init, method });
    };

    return () => {
      window.fetch = nativeFetch;
    };
  }, [isGuestPreview]);

  return (
    <WorkspaceSessionContext.Provider value={resolvedSession}>
      <WorkspaceAccessContext.Provider value={value}>
        {children}
      </WorkspaceAccessContext.Provider>
    </WorkspaceSessionContext.Provider>
  );
}

export function useWorkspaceAccess() {
  return useContext(WorkspaceAccessContext);
}

export function useWorkspaceSession() {
  return useContext(WorkspaceSessionContext);
}

export function useWorkspaceMode() {
  const session = useWorkspaceSession();
  const isPreview = (session?.id ?? 0) <= 0;

  return {
    isPreview,
    isAuthenticated: !isPreview,
  };
}
