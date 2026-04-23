"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import { previewBranches } from "@/data/operational-entities";
import { currency } from "@/components/workflow/utils";

export function BranchesRegister() {
  return (
    <div className="space-y-4" data-inspector-real-register="branches">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Branches</h1>
          <p className="text-sm text-muted">Operational branches tied to projects, receivables follow-up, and field delivery ownership.</p>
        </div>
        <Button onClick={() => {}}>Add Branch</Button>
      </div>

      <WorkspaceModeNotice
        title="Preview branch register"
        detail="Branch creation is not wired to a backend endpoint yet. The register is still exposed so project and branch relationships stay visible during inspection."
      />

      <Card className="rounded-[1.1rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Branch write actions are blocked until a real branch endpoint exists. This route stays honest and read-first instead of pretending branch setup is complete.
      </Card>

      <Card className="rounded-[1.25rem] bg-white/95 p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-surface-soft/70">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Branch</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">City</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Manager</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">Projects</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">Receivables</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {previewBranches.map((branch) => (
                <tr key={branch.id} className="border-t border-line/70">
                  <td className="px-4 py-3 font-semibold text-ink">{branch.code}</td>
                  <td className="px-4 py-3 text-ink">{branch.name}</td>
                  <td className="px-4 py-3 text-muted">{branch.city}</td>
                  <td className="px-4 py-3 text-muted">{branch.manager}</td>
                  <td className="px-4 py-3 text-right text-muted">{branch.projects}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{currency(branch.receivables)} SAR</td>
                  <td className="px-4 py-3 text-muted capitalize">{branch.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}