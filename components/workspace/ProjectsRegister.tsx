"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import { previewProjects } from "@/data/operational-entities";
import { currency } from "@/components/workflow/utils";

export function ProjectsRegister() {
  return (
    <div className="space-y-4" data-inspector-real-register="projects">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Projects</h1>
          <p className="text-sm text-muted">Project-level view of customer work, branch ownership, open documents, and gross margin direction.</p>
        </div>
        <Button onClick={() => {}}>Add Project</Button>
      </div>

      <WorkspaceModeNotice
        title="Preview project register"
        detail="Project creation is not wired to a backend endpoint yet. This route still exposes real cross-engine relationships for invoices, bills, and branches."
      />

      <Card className="rounded-[1.25rem] bg-white/95 p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-surface-soft/70">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted">Project</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Branch</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">Open invoices</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">Open bills</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">Margin</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {previewProjects.map((project) => (
                <tr key={project.id} className="border-t border-line/70">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{project.name}</p>
                    <p className="text-xs text-muted">{project.code}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{project.customerName}</td>
                  <td className="px-4 py-3 text-muted">{project.branchCode}</td>
                  <td className="px-4 py-3 text-right text-muted">{project.openInvoices}</td>
                  <td className="px-4 py-3 text-right text-muted">{project.openBills}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{currency(project.margin)} SAR</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3 text-xs font-semibold text-primary">
                      <Link href="/workspace/user/invoices">Invoices</Link>
                      <Link href="/workspace/user/bills">Bills</Link>
                      <Link href="/workspace/user/branches">Branch</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}