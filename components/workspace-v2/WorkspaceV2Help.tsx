"use client";

import { ArrowRight, BookOpenText, MessageCircleMore, ShieldCheck, Sparkles } from "lucide-react";
import { WorkspaceV2Suggestion } from "./WorkspaceV2Suggestion";

const TOPICS = [
  {
    title: "Issue your first ZATCA-ready invoice",
    description: "Set up the company profile, choose a default template, and create the first compliant tax invoice.",
    icon: ShieldCheck,
  },
  {
    title: "Track outstanding receivables",
    description: "Use the dashboard, the invoice register filters, and the customer balances widget to chase open balances.",
    icon: BookOpenText,
  },
  {
    title: "Manage credit and debit notes",
    description: "Apply credit notes against partial refunds and debit notes for additional charges, with full audit history.",
    icon: Sparkles,
  },
  {
    title: "Customize document templates",
    description: "Use the template studio to control accent color, language mode, sections, and ZATCA QR visibility.",
    icon: BookOpenText,
  },
];

export function WorkspaceV2Help() {
  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Help center</h1>
          <p className="wsv2-page-subtitle">
            Operational guidance for invoicing, VAT, payments, and document management.
          </p>
        </div>
        <div className="wsv2-page-actions">
          <a href="https://wa.me/" className="wsv2-btn-secondary wsv2-icon-btn" target="_blank" rel="noreferrer">
            <MessageCircleMore size={13} /> WhatsApp support
          </a>
        </div>
      </div>

      <WorkspaceV2Suggestion
        id="help-suggestions"
        title="Need a quicker answer?"
        description="Ask the in-product assistant any time using the help icon in the topbar."
      />

      <div className="wsv2-grid wsv2-grid-cols-2" style={{ marginTop: 14 }}>
        {TOPICS.map((topic) => (
          <article key={topic.title} className="wsv2-card wsv2-card-tight">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "var(--wsv2-primary-soft)",
                  color: "var(--wsv2-primary-strong)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <topic.icon size={15} />
              </span>
              <h2 className="wsv2-card-title">{topic.title}</h2>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--wsv2-ink-muted)", margin: "8px 0 12px" }}>
              {topic.description}
            </p>
            <button type="button" className="wsv2-btn-ghost" style={{ padding: 0, height: "auto" }}>
              Read the guide <ArrowRight size={13} />
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
