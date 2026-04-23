"use client";

import { AuditEngineDashboard } from "@/components/audit/AuditEngineDashboard";

/**
 * Legacy review routes now render the canonical audit engine dashboard.
 * The old localStorage-based review surface was retired in favor of the
 * deterministic registry-backed audit engine.
 */
export function ReviewDashboard() {
  return <AuditEngineDashboard />;
}
