"use client";

import { useState } from "react";
import { ImageIcon, Stamp, UploadCloud } from "lucide-react";
import { previewCompany } from "@/data/preview-company";
import { WorkspaceV2Suggestion } from "./WorkspaceV2Suggestion";

export function WorkspaceV2CompanySettings() {
  const [legalName, setLegalName] = useState(previewCompany.sellerName);
  const [legalNameAr, setLegalNameAr] = useState(previewCompany.sellerNameAr);
  const [vatNumber, setVatNumber] = useState(previewCompany.vatNumber);
  const [crNumber, setCrNumber] = useState(previewCompany.registrationNumber);
  const [country, setCountry] = useState("Saudi Arabia");
  const [addressEn, setAddressEn] = useState(previewCompany.sellerAddressEn);
  const [addressAr, setAddressAr] = useState(previewCompany.sellerAddressAr);
  const [email, setEmail] = useState(previewCompany.sellerEmail);
  const [phone, setPhone] = useState(previewCompany.sellerPhone);

  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Company profile</h1>
          <p className="wsv2-page-subtitle">
            Identity used on every invoice, quotation, credit note, and ZATCA payload.
          </p>
        </div>
      </div>

      <WorkspaceV2Suggestion
        id="company-readonly"
        tone="info"
        title="Preview mode — sign in to save"
        description="Edits are local to your browser session. Sign in to your real workspace to persist company identity."
      />

      <div className="wsv2-grid wsv2-grid-cols-2" style={{ marginTop: 14 }}>
        <section className="wsv2-card wsv2-card-tight" aria-label="Legal information">
          <h2 className="wsv2-card-title">Legal information</h2>
          <p className="wsv2-card-subtitle">Required for ZATCA-compliant invoicing.</p>
          <div className="wsv2-form-row" style={{ marginTop: 12 }}>
            <div className="wsv2-form-field">
              <label>Legal name (English)</label>
              <input value={legalName} onChange={(event) => setLegalName(event.target.value)} />
            </div>
            <div className="wsv2-form-field">
              <label>Legal name (Arabic)</label>
              <input value={legalNameAr} onChange={(event) => setLegalNameAr(event.target.value)} dir="rtl" />
            </div>
            <div className="wsv2-form-field">
              <label>VAT registration number</label>
              <input value={vatNumber} onChange={(event) => setVatNumber(event.target.value)} />
            </div>
            <div className="wsv2-form-field">
              <label>Commercial registration (CR)</label>
              <input value={crNumber} onChange={(event) => setCrNumber(event.target.value)} />
            </div>
            <div className="wsv2-form-field">
              <label>Country</label>
              <select value={country} onChange={(event) => setCountry(event.target.value)}>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
                <option value="Bahrain">Bahrain</option>
                <option value="Kuwait">Kuwait</option>
                <option value="Oman">Oman</option>
                <option value="Qatar">Qatar</option>
              </select>
            </div>
            <div className="wsv2-form-field">
              <label>Phone</label>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
            <div className="wsv2-form-field">
              <label>Email</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </div>
        </section>

        <section className="wsv2-card wsv2-card-tight" aria-label="National address">
          <h2 className="wsv2-card-title">National address</h2>
          <p className="wsv2-card-subtitle">Used in printed documents and ZATCA submissions.</p>
          <div className="wsv2-form-row" style={{ marginTop: 12 }}>
            <div className="wsv2-form-field" style={{ gridColumn: "1 / -1" }}>
              <label>Address (English)</label>
              <textarea
                rows={3}
                value={addressEn}
                onChange={(event) => setAddressEn(event.target.value)}
              />
            </div>
            <div className="wsv2-form-field" style={{ gridColumn: "1 / -1" }}>
              <label>Address (Arabic)</label>
              <textarea
                rows={3}
                value={addressAr}
                onChange={(event) => setAddressAr(event.target.value)}
                dir="rtl"
              />
            </div>
          </div>
        </section>
      </div>

      <section className="wsv2-card wsv2-card-tight" style={{ marginTop: 14 }} aria-label="Brand assets">
        <h2 className="wsv2-card-title">Brand assets</h2>
        <p className="wsv2-card-subtitle">
          Replace the placeholders to brand exported documents and the workspace.
        </p>
        <div className="wsv2-grid wsv2-grid-cols-2" style={{ marginTop: 12 }}>
          <UploadTile
            icon={<ImageIcon size={16} />}
            label="Company logo"
            hint="PNG / SVG, transparent background recommended"
          />
          <UploadTile
            icon={<Stamp size={16} />}
            label="Stamp"
            hint="Used on stamped print copies"
          />
          <UploadTile
            icon={<ImageIcon size={16} />}
            label="Authorized signature"
            hint="PNG with transparent background, max 480px wide"
          />
        </div>
      </section>
    </div>
  );
}

function UploadTile({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div
      style={{
        border: "1px dashed var(--wsv2-line-strong)",
        borderRadius: "var(--wsv2-radius-md)",
        padding: "16px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "var(--wsv2-surface-alt)",
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "var(--wsv2-surface)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--wsv2-primary)",
          border: "1px solid var(--wsv2-line)",
        }}
      >
        {icon}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: "var(--wsv2-ink-subtle)" }}>{hint}</div>
      </div>
      <button
        type="button"
        className="wsv2-icon-btn"
        style={{ marginLeft: "auto" }}
        aria-label={`Upload ${label.toLowerCase()}`}
      >
        <UploadCloud size={14} /> Upload
      </button>
    </div>
  );
}
