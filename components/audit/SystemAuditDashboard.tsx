"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { getDictionaryEntry, terminologyRouteProfiles } from "@/data/corporate-dictionary";
import {
  getAgentDashboard,
  getBooksSnapshot,
  getDashboardSnapshot,
  getDocumentPreview,
  getReportsSnapshot,
  listDocuments,
  listPlatformCustomers,
} from "@/lib/workspace-api";

type Severity = "Critical" | "High" | "Medium" | "Low";
type Engine = "Audit Engine" | "QA/QC Engine";

type AuditIssue = {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
  engine: Engine;
};

const severityWeight: Record<Severity, number> = {
  Critical: 20,
  High: 12,
  Medium: 6,
  Low: 3,
};

function parseRgb(value: string) {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])] as const;
}

function luminance([red, green, blue]: readonly [number, number, number]) {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

function contrastRatio(foreground: readonly [number, number, number], background: readonly [number, number, number]) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

export function SystemAuditDashboard() {
  const [issues, setIssues] = useState<AuditIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [checksRun, setChecksRun] = useState(0);

  useEffect(() => {
    let active = true;

    async function runAudit() {
      const nextIssues: AuditIssue[] = [];
      let completedChecks = 0;

      const routeChecks = await Promise.all([
        "/workspace/user",
        "/workspace/admin",
        "/workspace/assistant",
        "/workspace/agent",
      ].map(async (route) => ({ route, response: await fetch(route, { method: "GET" }).catch(() => null) })));
      completedChecks += routeChecks.length;

      routeChecks.forEach(({ route, response }) => {
        if (!response || !response.ok) {
          nextIssues.push({
            id: `route-${route}`,
            title: `Route Fails: ${route}`,
            detail: "Workspace route returned a non-success response or could not be fetched.",
            severity: "Critical",
            engine: "Audit Engine",
          });
        }
      });

      const terminologyChecks = await Promise.all(
        terminologyRouteProfiles.map(async (profile) => {
          const response = await fetch(profile.route, { method: "GET" }).catch(() => null);
          const html = response && response.ok ? await response.text().catch(() => "") : "";

          return {
            profile,
            response,
            text: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase(),
          };
        }),
      );
      completedChecks += terminologyChecks.length;

      terminologyChecks.forEach(({ profile, response, text }) => {
        if (!response || !response.ok) {
          nextIssues.push({
            id: `terminology-route-${profile.route}`,
            title: `Route Content Unavailable: ${profile.label}`,
            detail: "The audit engine could not inspect this route for dictionary-backed terminology checks.",
            severity: "High",
            engine: "Audit Engine",
          });
          return;
        }

        if (text.length < 300) {
          nextIssues.push({
            id: `empty-surface-${profile.route}`,
            title: `Surface Looks Empty: ${profile.label}`,
            detail: "The rendered page content is unusually short, which suggests an empty or incomplete experience.",
            severity: "High",
            engine: "QA/QC Engine",
          });
        }

        profile.requirements.forEach((requirement) => {
          completedChecks += 1;

          if (!text.includes(requirement.requiredText.toLowerCase())) {
            const entry = getDictionaryEntry(requirement.contextKey);
            nextIssues.push({
              id: `term-missing-${profile.route}-${requirement.contextKey}`,
              title: `Canonical Term Missing: ${entry?.english ?? requirement.requiredText}`,
              detail: `${profile.label} should expose the workbook-backed term \"${entry?.english ?? requirement.requiredText}\" (${entry?.arabic ?? "-"}).`,
              severity: "Medium",
              engine: "QA/QC Engine",
            });
          }
        });

        profile.discouraged.forEach((discouraged) => {
          completedChecks += 1;

          if (text.includes(discouraged.phrase.toLowerCase())) {
            const preferred = getDictionaryEntry(discouraged.preferredContextKey);
            nextIssues.push({
              id: `term-discouraged-${profile.route}-${discouraged.phrase}`,
              title: `Terminology Drift: ${discouraged.phrase}`,
              detail: `${discouraged.note} Preferred term: \"${preferred?.english ?? discouraged.phrase}\" (${preferred?.arabic ?? "-"}).`,
              severity: "Low",
              engine: "Audit Engine",
            });
          }
        });
      });

      const [dashboard, reports, books, customers, agent, documents] = await Promise.all([
        getDashboardSnapshot().catch(() => null),
        getReportsSnapshot().catch(() => null),
        getBooksSnapshot().catch(() => null),
        listPlatformCustomers({}).catch(() => []),
        getAgentDashboard().catch(() => null),
        listDocuments({ group: "sales" }).catch(() => []),
      ]);
      completedChecks += 6;

      if (!dashboard?.backendReady) {
        nextIssues.push({
          id: "dashboard-binding",
          title: "Dashboard Data Binding Missing",
          detail: "Dashboard summary is not reading backend data successfully.",
          severity: "Critical",
          engine: "Audit Engine",
        });
      }

      if ((customers?.length ?? 0) < 3) {
        nextIssues.push({
          id: "customers-demo",
          title: "Platform Customer Volume Too Low",
          detail: "Platform customer list does not yet expose the expected live customer companies.",
          severity: "High",
          engine: "Audit Engine",
        });
      }

      if ((agent?.referrals.length ?? 0) < 3) {
        nextIssues.push({
          id: "agent-referrals",
          title: "Agent Referral Data Incomplete",
          detail: "Agent workspace is missing the minimum seeded referral activity.",
          severity: "High",
          engine: "Audit Engine",
        });
      }

      if (!reports?.vatDetail.length) {
        nextIssues.push({
          id: "vat-detail",
          title: "VAT Detail Is Empty",
          detail: "VAT review currently has no rows, which means workspace compliance review is incomplete.",
          severity: "High",
          engine: "QA/QC Engine",
        });
      }

      if (books) {
        const debitTotal = books.trialBalance.reduce((total, row) => total + row.debitTotal, 0);
        const creditTotal = books.trialBalance.reduce((total, row) => total + row.creditTotal, 0);
        const imbalance = Math.abs(debitTotal - creditTotal);

        if (imbalance > 0.01) {
          nextIssues.push({
            id: "trial-balance-imbalance",
            title: "Accounting Imbalance Detected",
            detail: `Trial balance is out by ${imbalance.toFixed(2)} SAR.`,
            severity: "Critical",
            engine: "QA/QC Engine",
          });
        }
      }

      if (!documents.length) {
        nextIssues.push({
          id: "documents-empty",
          title: "Document Register Is Empty",
          detail: "Sales document center does not yet expose seeded documents.",
          severity: "Critical",
          engine: "Audit Engine",
        });
      } else {
        const preview = await getDocumentPreview(documents[0].id).catch(() => null);

        if (!preview?.html.includes(documents[0].number)) {
          nextIssues.push({
            id: "preview-mismatch",
            title: "Register And Preview Mismatch",
            detail: "Document preview did not include the register reference for the selected document.",
            severity: "Medium",
            engine: "QA/QC Engine",
          });
        }
      }

      if (document.querySelectorAll('a[href="#"]').length > 0) {
        completedChecks += 1;
        nextIssues.push({
          id: "dead-links",
          title: "Dead Link Pattern Found",
          detail: "One or more anchors still point to # instead of a working route.",
          severity: "Medium",
          engine: "QA/QC Engine",
        });
      }

      const navLinks = Array.from(new Set(
        Array.from(document.querySelectorAll<HTMLAnchorElement>('nav a[href]'))
          .map((anchor) => anchor.getAttribute("href") ?? "")
          .filter((href) => href.startsWith("/")),
      ));
      const navChecks = await Promise.all(navLinks.map(async (href) => ({ href, response: await fetch(href, { method: "GET" }).catch(() => null) })));
      completedChecks += navChecks.length;

      navChecks.forEach(({ href, response }) => {
        if (!response || !response.ok) {
          nextIssues.push({
            id: `nav-broken-${href}`,
            title: `Broken Navigation Link: ${href}`,
            detail: "A visible navigation link resolves to a failing route.",
            severity: "Critical",
            engine: "QA/QC Engine",
          });
        }
      });

      const emptyButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).filter((button) => {
        const label = button.textContent?.trim() ?? "";
        const ariaLabel = button.getAttribute("aria-label")?.trim() ?? "";
        return !label && !ariaLabel && !button.disabled;
      });
      completedChecks += 1;

      if (emptyButtons.length > 0) {
        nextIssues.push({
          id: "empty-buttons",
          title: "Fake Or Empty Buttons Found",
          detail: "One or more interactive buttons have no visible text or accessible label.",
          severity: "High",
          engine: "QA/QC Engine",
        });
      }

      const loginButton = document.querySelector<HTMLAnchorElement>('a[href="/login"]');
      completedChecks += 1;
      if (loginButton) {
        const styles = window.getComputedStyle(loginButton);
        const text = parseRgb(styles.color);
        const background = parseRgb(styles.backgroundColor || "rgb(255,255,255)") ?? [255, 255, 255] as const;

        if (text && contrastRatio(text, background) < 4.5) {
          nextIssues.push({
            id: "login-contrast",
            title: "Login Button Contrast Too Low",
            detail: "The public login button does not meet accessible contrast rules.",
            severity: "High",
            engine: "Audit Engine",
          });
        }
      }

      const primaryNav = document.querySelector<HTMLElement>('nav[aria-label="Primary"]');
      completedChecks += 1;
      if (primaryNav) {
        const navBounds = primaryNav.getBoundingClientRect();
        const viewportCenter = window.innerWidth / 2;
        const navCenter = navBounds.left + (navBounds.width / 2);

        if (Math.abs(navCenter - viewportCenter) > 96) {
          nextIssues.push({
            id: "navbar-alignment",
            title: "Navbar Alignment Drift",
            detail: "Primary navigation is visibly offset from the page center.",
            severity: "Medium",
            engine: "Audit Engine",
          });
        }
      }

      const logos = document.querySelectorAll('img[alt="Gulf Hisab"], img[alt="Gulf Hisab icon"]');
      completedChecks += 1;
      if (logos.length > 3) {
        nextIssues.push({
          id: "duplicate-logos",
          title: "Duplicate Logo Usage",
          detail: "More brand marks are visible than expected for the current page frame.",
          severity: "Low",
          engine: "Audit Engine",
        });
      }

      if (active) {
        setIssues(nextIssues);
        setChecksRun(completedChecks);
        setLoading(false);
      }
    }

    void runAudit();

    return () => {
      active = false;
    };
  }, []);

  const score = useMemo(() => Math.max(0, 100 - issues.reduce((total, issue) => total + severityWeight[issue.severity], 0)), [issues]);
  const criticalCount = issues.filter((issue) => issue.severity === "Critical").length;
  const highCount = issues.filter((issue) => issue.severity === "High").length;
  const grouped = useMemo(() => ({
    audit: issues.filter((issue) => issue.engine === "Audit Engine"),
    qc: issues.filter((issue) => issue.engine === "QA/QC Engine"),
  }), [issues]);

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Audit Dashboard</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Audit Engine And QA/QC Engine</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">This dashboard checks route availability, navigation wiring, UI visibility, backend bindings, VAT readiness, and accounting balance from the live workspace.</p>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["System score", `${score}/100`, "Live audit score across routing, UI, and backend binding checks"],
          ["Critical issues", String(criticalCount), "Must be cleared before workspace sign-off"],
          ["High issues", String(highCount), "Important issues that still affect trust or workflow quality"],
          ["Checks run", loading ? "Running" : String(checksRun), "Combined audit, navigation, and dictionary-backed QA/QC checks in the current page session"],
        ].map(([title, value, caption]) => (
          <Card key={title} className="rounded-[1.8rem] bg-white/92 p-5">
            <p className="text-sm font-semibold text-muted">{title}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{caption}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <WorkspaceDataTable
          title="Audit Engine"
          caption="Route, navigation, layout, and visibility findings."
          rows={grouped.audit}
          emptyMessage={loading ? "Audit checks are still running..." : "No audit findings detected."}
          columns={[
            { header: "Severity", render: (row) => row.severity },
            { header: "Issue", render: (row) => row.title },
            { header: "Detail", render: (row) => row.detail },
          ]}
        />

        <WorkspaceDataTable
          title="QA/QC Engine"
          caption="Data, logic, preview, VAT, and balance findings."
          rows={grouped.qc}
          emptyMessage={loading ? "QA/QC checks are still running..." : "No QA/QC findings detected."}
          columns={[
            { header: "Severity", render: (row) => row.severity },
            { header: "Issue", render: (row) => row.title },
            { header: "Detail", render: (row) => row.detail },
          ]}
        />
      </div>
    </div>
  );
}