"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import type { ContactKind, ContactPayload, ContactRecord } from "@/components/workflow/types";

type QuickCreateContactFormProps = {
  kind: ContactKind;
  initialName: string;
  onSubmit: (payload: ContactPayload) => Promise<ContactRecord>;
  onComplete: (contact: ContactRecord) => void;
};

export function QuickCreateContactForm({ kind, initialName, onSubmit, onComplete }: QuickCreateContactFormProps) {
  const [displayName, setDisplayName] = useState(initialName);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Riyadh");
  const [country, setCountry] = useState("Saudi Arabia");
  const [origin, setOrigin] = useState<"inside_ksa" | "outside_ksa">("inside_ksa");
  const [vatNumber, setVatNumber] = useState("");
  const [street, setStreet] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [additionalDocumentNumbers, setAdditionalDocumentNumbers] = useState("");
  const [defaultRevenueAccount, setDefaultRevenueAccount] = useState("4000");
  const [defaultCostCenter, setDefaultCostCenter] = useState("OPS");
  const [defaultTax, setDefaultTax] = useState("VAT 15%");
  const [purchasingDefaults, setPurchasingDefaults] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryBank, setBeneficiaryBank] = useState("");
  const [beneficiaryIban, setBeneficiaryIban] = useState("");
  const [beneficiaryReference, setBeneficiaryReference] = useState("");
  const [customFields, setCustomFields] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (origin === "inside_ksa" && !vatNumber.trim()) {
      return;
    }

    setSaving(true);
    const contact = await onSubmit({
      kind,
      displayName,
      email,
      phone,
      city,
      country,
      origin,
      vatNumber,
      street,
      buildingNumber,
      district,
      postalCode,
      crNumber,
      additionalDocumentNumbers,
      defaultRevenueAccount,
      defaultCostCenter,
      defaultTax,
      purchasingDefaults,
      beneficiaryName,
      beneficiaryBank,
      beneficiaryIban,
      beneficiaryReference,
      customFields,
    });
    setSaving(false);
    onComplete(contact);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <section className="rounded-2xl border border-line bg-surface-soft/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Section 1 - Basic</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input label="Company Name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.sa" />
          <Input label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+966 5X XXX XXXX" />
          <Input label="Country" value={country} onChange={(event) => setCountry(event.target.value)} />
          <div>
            <label className="mb-2.5 block text-sm font-semibold text-ink">Origin</label>
            <select value={origin} onChange={(event) => setOrigin(event.target.value === "outside_ksa" ? "outside_ksa" : "inside_ksa")} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
              <option value="inside_ksa">Inside KSA</option>
              <option value="outside_ksa">Outside KSA</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface-soft/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Section 2 - VAT Logic</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <Input label={origin === "inside_ksa" ? "VAT Number" : "VAT Number (optional)"} value={vatNumber} onChange={(event) => setVatNumber(event.target.value)} required={origin === "inside_ksa"} />
          <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-muted">
            <p className="font-semibold text-ink">Compliance behavior</p>
            <p className="mt-1">{origin === "inside_ksa" ? "VAT is mandatory and ZATCA rules apply." : "VAT is optional for outside-KSA customers."}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface-soft/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Section 3 - Address</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input label="City" value={city} onChange={(event) => setCity(event.target.value)} />
          <Input label="Street" value={street} onChange={(event) => setStreet(event.target.value)} />
          <Input label="Building Number" value={buildingNumber} onChange={(event) => setBuildingNumber(event.target.value)} />
          <Input label="District" value={district} onChange={(event) => setDistrict(event.target.value)} />
          <Input label="Postal Code" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface-soft/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Section 4 - Commercial Details</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <Input label="CR Number" value={crNumber} onChange={(event) => setCrNumber(event.target.value)} />
          <Input label="Additional document numbers" value={additionalDocumentNumbers} onChange={(event) => setAdditionalDocumentNumbers(event.target.value)} />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface-soft/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Section 5 - Selling Defaults</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <Input label="Default revenue account" value={defaultRevenueAccount} onChange={(event) => setDefaultRevenueAccount(event.target.value)} />
          <Input label="Default cost center" value={defaultCostCenter} onChange={(event) => setDefaultCostCenter(event.target.value)} />
          <Input label="Default tax" value={defaultTax} onChange={(event) => setDefaultTax(event.target.value)} />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface-soft/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Section 6 - Purchasing Defaults</p>
        <Input label="Purchasing defaults" value={purchasingDefaults} onChange={(event) => setPurchasingDefaults(event.target.value)} placeholder="Default expense flow, payment terms, or buyer note" />
      </section>

      <section className="rounded-2xl border border-line bg-surface-soft/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Section 7 - Beneficiary</p>
          <button type="button" className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink">Add Beneficiary</button>
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input label="Beneficiary name" value={beneficiaryName} onChange={(event) => setBeneficiaryName(event.target.value)} />
          <Input label="Bank / payment provider" value={beneficiaryBank} onChange={(event) => setBeneficiaryBank(event.target.value)} />
          <Input label="IBAN / account" value={beneficiaryIban} onChange={(event) => setBeneficiaryIban(event.target.value)} />
          <Input label="Payment details" value={beneficiaryReference} onChange={(event) => setBeneficiaryReference(event.target.value)} />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface-soft/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Section 8 - Custom Fields</p>
        <label className="mb-2.5 block text-sm font-semibold text-ink">Operational notes</label>
        <textarea value={customFields} onChange={(event) => setCustomFields(event.target.value)} rows={4} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" placeholder="Custom fields, internal tags, delivery notes, or beneficiary notes" />
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !displayName.trim()}>
          {saving ? "Saving…" : kind === "customer" ? "Save customer" : "Save supplier"}
        </Button>
      </div>
    </form>
  );
}