"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import { validateVendorDraft, type FieldErrors } from "@/lib/business-form-validation";
import { createContactInBackend, getWorkspaceDirectory } from "@/lib/workspace-api";
import type { ContactRecord } from "@/components/workflow/types";

const emptyVendor = {
  displayName: "",
  email: "",
  phone: "",
  city: "",
  country: "SA",
  vatNumber: "",
  street: "",
  buildingNumber: "",
  district: "",
  postalCode: "",
  secondaryNumber: "",
};

export function VendorsRegister() {
  const [vendors, setVendors] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState(emptyVendor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getWorkspaceDirectory()
      .then((directory) => {
        setVendors(directory?.suppliers ?? []);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredVendors = useMemo(
    () => vendors.filter((row) => `${row.displayName} ${row.email} ${row.phone} ${row.city}`.toLowerCase().includes(query.toLowerCase())),
    [vendors, query],
  );
  const draftDirty = JSON.stringify(draft) !== JSON.stringify(emptyVendor);

  function getVisibleErrors(nextDraft: typeof emptyVendor, nextTouched = touchedFields, forceAll = false) {
    const errors = validateVendorDraft(nextDraft);
    if (forceAll) {
      return errors;
    }

    return Object.fromEntries(Object.entries(errors).filter(([key]) => nextTouched[key]));
  }

  function updateDraftField<Key extends keyof typeof emptyVendor>(key: Key, value: (typeof emptyVendor)[Key]) {
    const nextDraft = { ...draft, [key]: value };
    setDraft(nextDraft);
    setError(null);
    setFeedback(null);
    setFieldErrors(getVisibleErrors(nextDraft));
  }

  function markTouched(field: string) {
    const nextTouched = { ...touchedFields, [field]: true };
    setTouchedFields(nextTouched);
    setFieldErrors(getVisibleErrors(draft, nextTouched));
  }

  async function handleCreate() {
    const nextErrors = validateVendorDraft(draft);
    if (Object.keys(nextErrors).length > 0) {
      setTouchedFields({
        displayName: true,
        email: true,
        phone: true,
        city: true,
        country: true,
        vatNumber: true,
        street: true,
        buildingNumber: true,
        district: true,
        postalCode: true,
        secondaryNumber: true,
      });
      setFieldErrors(nextErrors);
      setError("Vendor was not saved. Fix the highlighted fields, then try again.");
      return;
    }

    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const created = await createContactInBackend({
        kind: "supplier",
        displayName: draft.displayName.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        city: draft.city.trim(),
        country: draft.country.trim(),
        vatNumber: draft.vatNumber.trim(),
        street: draft.street.trim(),
        buildingNumber: draft.buildingNumber.trim(),
        district: draft.district.trim(),
        postalCode: draft.postalCode.trim(),
        secondaryNumber: draft.secondaryNumber.trim(),
      });

      if (!created) {
        setError("Vendor was not saved. Sign in to a backend-backed workspace or reconnect the backend, then try again.");
        return;
      }

      setVendors((current) => [created, ...current]);
      setDraft(emptyVendor);
      setFieldErrors({});
      setTouchedFields({});
      setShowCreate(false);
      setFeedback(`${created.displayName} was created and is ready for purchase workflows.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4" data-inspector-real-register="vendors">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Vendors</h1>
          <p className="text-sm text-muted">Supplier register for purchase-ready contacts, payment follow-up, and vendor bill ownership.</p>
        </div>
        <Button onClick={() => setShowCreate((current) => !current)}>{showCreate ? "Close" : "Add Vendor"}</Button>
      </div>

      <WorkspaceModeNotice
        title="Preview vendor register"
        detail="Guest mode loads controlled supplier data so purchases screens stay inspectable without backend auth."
      />

      {showCreate ? (
        <Card className="rounded-[1.25rem] bg-white/95 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-soft/35 px-3 py-2 text-sm text-muted">
            <div>
              <p className="font-semibold text-ink">{draftDirty ? "Draft in progress" : "New vendor draft"}</p>
              <p className="mt-1">Complete the highlighted required fields so the supplier can be saved and used immediately in bills and payments.</p>
            </div>
            <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">{draftDirty ? "Unsaved changes" : "Ready to start"}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input label="Vendor name" required value={draft.displayName} error={fieldErrors.displayName} onBlur={() => markTouched("displayName")} onChange={(event) => updateDraftField("displayName", event.target.value)} />
            <Input label="Email" type="email" required hint="Use a supplier email such as ap@supplier.sa" value={draft.email} error={fieldErrors.email} onBlur={() => markTouched("email")} onChange={(event) => updateDraftField("email", event.target.value)} />
            <Input label="Phone" type="tel" required hint="Use 9 to 15 digits, for example +966512345678" value={draft.phone} error={fieldErrors.phone} onBlur={() => markTouched("phone")} onChange={(event) => updateDraftField("phone", event.target.value)} />
            <Input label="City" required value={draft.city} error={fieldErrors.city} onBlur={() => markTouched("city")} onChange={(event) => updateDraftField("city", event.target.value)} />
            <Input label="Country" required hint="Use SA for Saudi records" value={draft.country} error={fieldErrors.country} onBlur={() => markTouched("country")} onChange={(event) => updateDraftField("country", event.target.value.toUpperCase())} />
            <Input label="VAT number" required hint="15 digits, starts with 3, ends with 3" value={draft.vatNumber} error={fieldErrors.vatNumber} onBlur={() => markTouched("vatNumber")} onChange={(event) => updateDraftField("vatNumber", event.target.value)} />
            <Input label="Building number" required hint="4 digits" value={draft.buildingNumber} error={fieldErrors.buildingNumber} onBlur={() => markTouched("buildingNumber")} onChange={(event) => updateDraftField("buildingNumber", event.target.value)} />
            <Input label="Street" required value={draft.street} error={fieldErrors.street ?? fieldErrors.streetName} onBlur={() => markTouched("street")} onChange={(event) => updateDraftField("street", event.target.value)} />
            <Input label="District" required value={draft.district} error={fieldErrors.district} onBlur={() => markTouched("district")} onChange={(event) => updateDraftField("district", event.target.value)} />
            <Input label="Postal code" required hint="5 digits" value={draft.postalCode} error={fieldErrors.postalCode} onBlur={() => markTouched("postalCode")} onChange={(event) => updateDraftField("postalCode", event.target.value)} />
            <Input label="Secondary number" required hint="4 digits" value={draft.secondaryNumber} error={fieldErrors.secondaryNumber} onBlur={() => markTouched("secondaryNumber")} onChange={(event) => updateDraftField("secondaryNumber", event.target.value)} />
          </div>
          {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          {feedback ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{feedback}</div> : null}
          <div className="mt-4 flex gap-3">
            <Button onClick={() => void handleCreate()} disabled={saving}>{saving ? "Saving" : "Create Vendor"}</Button>
            <Button variant="secondary" onClick={() => { setShowCreate(false); setError(null); }}>Cancel</Button>
          </div>
        </Card>
      ) : null}

      {!showCreate && feedback ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}

      <Card className="rounded-[1.25rem] bg-white/95 p-0 overflow-hidden">
        <div className="border-b border-line px-4 py-4">
          <div className="max-w-sm">
            <Input label="Search vendors" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by vendor, email, phone, or city" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-surface-soft/70">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted">Vendor</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">City</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-muted" colSpan={4}>Loading vendors...</td>
                </tr>
              ) : filteredVendors.length ? filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="border-t border-line/70">
                  <td className="px-4 py-3 font-semibold text-ink">{vendor.displayName}</td>
                  <td className="px-4 py-3 text-muted">{vendor.email || "-"}</td>
                  <td className="px-4 py-3 text-muted">{vendor.phone || "-"}</td>
                  <td className="px-4 py-3 text-muted">{vendor.city || "-"}</td>
                </tr>
              )) : (
                <tr>
                  <td className="px-4 py-6" colSpan={4}>
                    <div className="rounded-lg border border-dashed border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                      <p className="font-semibold text-ink">No suppliers are ready for bill entry yet.</p>
                      <p className="mt-1">Add the first vendor here so purchase documents and outgoing payments stay linked to a saved supplier record.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}