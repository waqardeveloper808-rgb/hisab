"use client";

import { KSA_VAT_TAX_RATES } from "@/lib/workspace/ksa-tax-rates";
import { WAFEQ_STYLE_COA_HIERARCHY } from "@/lib/workspace/coa-wafeq-groups";
import { WorkspaceSuggestion } from "@/components/workspace/WorkspaceSuggestion";
import { Card } from "@/components/Card";

export function WorkspaceTaxRatesPage() {
  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Tax rates (KSA)</h1>
          <p className="wsv2-page-subtitle">
            <span className="wsv2-accounting-badge wsv2-accounting-badge--live" style={{ marginRight: 8 }}>LIVE</span>
            Default catalog for UI and mapping hints; final posting still uses your chart and backend tax engine.
          </p>
        </div>
      </div>
      <WorkspaceSuggestion
        id="tax-rates"
        tone="info"
        title="Wafeq-style catalog"
        description="Each row is a KSA tax category with a suggested VAT control account (1300/2200 series) — align with your chart of accounts."
      />
      <div className="wsv2-card" style={{ marginTop: 12 }}>
        <div className="wsv2-table-scroll">
          <table className="wsv2-table">
            <thead>
              <tr>
                <th>English</th>
                <th>Arabic</th>
                <th>Type</th>
                <th>Rate</th>
                <th>Account hint</th>
                <th>Bucket</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {KSA_VAT_TAX_RATES.map((r) => (
                <tr key={r.id}>
                  <td>{r.nameEn}</td>
                  <td dir="rtl">{r.nameAr}</td>
                  <td>{r.type}</td>
                  <td>{r.ratePercent}%</td>
                  <td className="font-mono text-xs">{r.linkedVatAccountCodeHint}</td>
                  <td>{r.reportingBucket}</td>
                  <td>{r.isActive ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="wsv2-reports-section__title" style={{ marginTop: 24 }}>COA — Wafeq-style sections (metadata)</h2>
      <p className="text-sm text-muted" style={{ maxWidth: 52 * 16 }}>
        Groups below are labels; Hisabix account <strong>codes</strong> in the live chart are not renamed by this view.
      </p>
      <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
        {WAFEQ_STYLE_COA_HIERARCHY.map((section) => (
          <Card key={section.id} className="p-3">
            <p className="font-semibold text-ink">{section.label}</p>
            <ul className="mt-1 list-inside list-disc text-xs text-muted">
              {section.subgroups.map((sg) => (
                <li key={sg.id}>{sg.label} — {sg.accountGroupHints.join(", ")}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
