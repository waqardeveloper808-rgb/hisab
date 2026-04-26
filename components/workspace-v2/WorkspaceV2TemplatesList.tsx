"use client";

import Link from "next/link";
import { Eye, FilePlus, Pencil, Settings2 } from "lucide-react";
import { templates } from "@/data/workspace-v2/templates";
import { formatDateTime } from "@/lib/workspace-v2/format";
import { V2_BASE } from "@/lib/workspace-v2/navigation";
import { WorkspaceV2Suggestion } from "./WorkspaceV2Suggestion";
import { WorkspaceV2MoreActions } from "./WorkspaceV2MoreActions";

const STYLE_LABELS = {
  standard: "Standard",
  modern: "Modern",
  compact: "Compact",
} as const;

const LANG_LABELS = {
  english: "English",
  arabic: "Arabic",
  bilingual: "Bilingual",
} as const;

const TYPE_LABELS = {
  invoice: "Tax invoice",
  simplified_invoice: "Simplified tax invoice",
  quotation: "Quotation",
  proforma: "Proforma invoice",
  credit_note: "Credit note",
  debit_note: "Debit note",
  delivery_note: "Delivery note",
  purchase_order: "Purchase order",
} as const;

export function WorkspaceV2TemplatesList() {
  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Document templates</h1>
          <p className="wsv2-page-subtitle">
            Reusable layouts for invoices, quotations, and credit/debit notes.
          </p>
        </div>
        <div className="wsv2-page-actions">
          <Link href={`${V2_BASE}/templates/studio`} className="wsv2-btn-secondary wsv2-icon-btn">
            <Pencil size={13} /> Open studio
          </Link>
          <button type="button" className="wsv2-btn">
            <FilePlus size={13} /> New template
          </button>
        </div>
      </div>

      <WorkspaceV2Suggestion
        id="templates-tip-default"
        tone="info"
        title="One default template per document type"
        description="Default templates are used when creating new documents of that type. Tax invoice, quotation, proforma, credit note, and debit note each can have a different default. In Workspace V2 preview, default selection is shown but not persisted to the backend."
      />

      <div className="wsv2-card" style={{ marginTop: 14 }}>
        <div className="wsv2-table-scroll">
          <table className="wsv2-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Document type</th>
                <th>Style</th>
                <th>Language</th>
                <th>Default</th>
                <th>Updated</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tmpl) => (
                <tr key={tmpl.id}>
                  <td style={{ fontWeight: 600 }}>{tmpl.name}</td>
                  <td>{TYPE_LABELS[tmpl.documentType] ?? tmpl.documentType}</td>
                  <td>{STYLE_LABELS[tmpl.style]}</td>
                  <td>{LANG_LABELS[tmpl.language]}</td>
                  <td>
                    {tmpl.isDefault ? (
                      <span className="wsv2-pill" data-tone="primary">
                        <span className="wsv2-status-dot" /> Default
                      </span>
                    ) : (
                      <span className="wsv2-pill" data-tone="neutral">
                        Available
                      </span>
                    )}
                  </td>
                  <td>{formatDateTime(tmpl.updatedAt)}</td>
                  <td>
                    <div className="actions">
                      <Link
                        href={`${V2_BASE}/templates/studio?template=${tmpl.id}`}
                        className="wsv2-icon-btn"
                        aria-label={`Open ${tmpl.name} in studio`}
                      >
                        <Eye size={13} />
                      </Link>
                      <WorkspaceV2MoreActions
                        actions={[
                          { id: "edit", label: "Edit in studio", icon: <Pencil size={13} /> },
                          { id: "set-default", label: "Set as default", icon: <Settings2 size={13} /> },
                          { id: "duplicate", label: "Duplicate template" },
                          { id: "archive", label: "Archive template" },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
