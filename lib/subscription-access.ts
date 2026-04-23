import type { WorkspaceAccessProfile } from "@/lib/workspace-api";

type ModuleAccessState = {
  blocked: boolean;
  tone: "warning" | "critical" | "info";
  title: string;
  detail: string;
};

function readNumericFlag(value: boolean | number | string | null | undefined, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function diffInDays(fromDate: string) {
  const started = new Date(fromDate);
  if (Number.isNaN(started.getTime())) {
    return 0;
  }

  const now = new Date();
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((now.getTime() - started.getTime()) / millisecondsPerDay));
}

export function getInvoiceAccessState(access: WorkspaceAccessProfile | null): ModuleAccessState | null {
  const subscription = access?.subscription;
  if (!subscription) {
    return null;
  }

  const trialStart = subscription.startedAt || subscription.trialEndsAt;
  const invoicingTrialDays = readNumericFlag(subscription.featureFlags?.invoicing_trial_days, 60);
  const elapsed = trialStart ? diffInDays(trialStart) : 0;

  if (trialStart && elapsed >= invoicingTrialDays) {
    return {
      blocked: true,
      tone: "critical",
      title: "E-Invoicing locked",
      detail: `The ${invoicingTrialDays}-day invoicing trial window has ended. Activate a paid plan to issue more invoices.`,
    };
  }

  if (trialStart && elapsed >= Math.max(invoicingTrialDays - 7, 1)) {
    return {
      blocked: false,
      tone: "warning",
      title: "E-Invoicing trial nearing lock",
      detail: `${Math.max(invoicingTrialDays - elapsed, 0)} day${invoicingTrialDays - elapsed === 1 ? "" : "s"} left before invoice issuing is blocked.`,
    };
  }

  return null;
}

export function getAccountingAccessState(access: WorkspaceAccessProfile | null): ModuleAccessState | null {
  const subscription = access?.subscription;
  if (!subscription) {
    return null;
  }

  const trialStart = subscription.startedAt || subscription.trialEndsAt;
  const accountingTrialDays = readNumericFlag(subscription.featureFlags?.accounting_trial_days, 120);
  const printLimit = readNumericFlag(subscription.featureFlags?.accounting_print_limit_per_day, 1);
  const elapsed = trialStart ? diffInDays(trialStart) : 0;

  if (trialStart && elapsed >= accountingTrialDays) {
    return {
      blocked: false,
      tone: "warning",
      title: "Accounting print mode active",
      detail: `The ${accountingTrialDays}-day accounting trial has ended. Reporting stays available, but PDF printing is limited to ${printLimit} document${printLimit === 1 ? "" : "s"} per day.`,
    };
  }

  if (trialStart && elapsed >= Math.max(accountingTrialDays - 14, 1)) {
    return {
      blocked: false,
      tone: "info",
      title: "Accounting trial nearing limit",
      detail: `${Math.max(accountingTrialDays - elapsed, 0)} day${accountingTrialDays - elapsed === 1 ? "" : "s"} left before accounting moves to daily print limits.`,
    };
  }

  return null;
}