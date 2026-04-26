import type { DocumentStatus } from "./types";

const sarFormatter = new Intl.NumberFormat("en-SA", {
  style: "currency",
  currency: "SAR",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-SA", {
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatCurrency(amount: number): string {
  return sarFormatter.format(amount);
}

export function formatNumber(amount: number): string {
  return numberFormatter.format(amount);
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateFormatter.format(date);
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateTimeFormatter.format(date);
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(iso);
}

const statusLabels: Record<DocumentStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  sent: "Sent",
  viewed: "Viewed",
  partially_paid: "Partial",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  applied: "Applied",
  cleared: "Cleared",
  pending: "Pending",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
  in_stock: "In stock",
};

export function statusLabel(status: DocumentStatus): string {
  return statusLabels[status] ?? status;
}

export type StatusTone = "neutral" | "primary" | "info" | "success" | "warning" | "danger";

export function statusTone(status: DocumentStatus): StatusTone {
  switch (status) {
    case "paid":
    case "accepted":
    case "cleared":
    case "in_stock":
      return "success";
    case "issued":
    case "sent":
    case "viewed":
    case "applied":
      return "primary";
    case "draft":
      return "neutral";
    case "partially_paid":
    case "pending":
    case "low_stock":
      return "warning";
    case "overdue":
    case "rejected":
    case "expired":
    case "out_of_stock":
    case "void":
      return "danger";
    default:
      return "info";
  }
}
