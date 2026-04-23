"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { DirectoryImportPanel } from "@/components/workspace/DirectoryImportPanel";
import { StandardActionBar } from "@/components/workspace/StandardActionBar";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import { validateCustomerDraft, type FieldErrors } from "@/lib/business-form-validation";
import {
  buildCustomerImportPreview,
  buildDirectoryImportMapping,
  getCustomerImportFields,
  getDirectoryImportRequiredFields,
} from "@/lib/directory-import";
import { createContactInBackend, getWorkspaceDirectory } from "@/lib/workspace-api";
import type { ContactRecord } from "@/components/workflow/types";
import { exportRowsToCsv } from "@/lib/spreadsheet";

const emptyContact = {
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
  defaultTax: "VAT 15%",
};

export function CustomersRegister() {
  const [customers, setCustomers] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState(emptyContact);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    getWorkspaceDirectory()
      .then((directory) => {
        setCustomers(directory?.customers ?? []);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredCustomers = useMemo(
    () => customers.filter((row) => `${row.displayName} ${row.email} ${row.phone} ${row.city}`.toLowerCase().includes(query.toLowerCase())),
    [customers, query],
  );
  const selectedCustomer = filteredCustomers.find((row) => row.id === selectedCustomerId) ?? filteredCustomers[0] ?? null;
  const draftDirty = JSON.stringify(draft) !== JSON.stringify(emptyContact);

  function getVisibleErrors(nextDraft: typeof emptyContact, nextTouched = touchedFields, forceAll = false) {
    const errors = validateCustomerDraft(nextDraft);
    if (forceAll) {
      return errors;
    }

    return Object.fromEntries(
      Object.entries(errors).filter(([key]) => nextTouched[key] || (key === "address" && (nextTouched.street || nextTouched.city || nextTouched.country))),
    );
  }

  function updateDraftField<Key extends keyof typeof emptyContact>(key: Key, value: (typeof emptyContact)[Key]) {
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
    const nextErrors = validateCustomerDraft(draft);
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
      setError("Customer was not saved. Fix the highlighted fields, then try again.");
      return;
    }

    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const created = await createContactInBackend({
        kind: "customer",
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
        defaultTax: draft.defaultTax.trim(),
      });

      if (!created) {
        setError("Customer was not saved. Sign in to a backend-backed workspace or reconnect the backend, then try again.");
        return;
      }

      setCustomers((current) => [created, ...current]);
      setSelectedCustomerId(created.id);
      setDraft(emptyContact);
      setFieldErrors({});
      setTouchedFields({});
      setShowCreate(false);
      setFeedback(`${created.displayName} was created and is ready for invoicing.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleImportRows(rows: Array<Parameters<typeof createContactInBackend>[0]>) {
    const created: ContactRecord[] = [];
    const generatedRecords: string[] = [];
    const errors: string[] = [];

    for (const row of rows) {
      const result = await createContactInBackend(row);
      if (result) {
        created.push(result);
        generatedRecords.push(result.displayName);
      } else {
        errors.push(`Failed to import customer ${row.displayName}.`);
      }
    }

    return {
      created,
      summary: {
        totalRows: rows.length,
        validRows: rows.length,
        invalidRows: 0,
        importedRows: created.length,
        skippedRows: 0,
        failedRows: errors.length,
        generatedRecords,
        warnings: [],
        errors,
      },
    };
  }

  return (
    <div className="space-y-4" data-inspector-real-register="customers">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Customers</h1>
          <p className="text-sm text-muted">Invoice-ready customer register with direct creation and searchable contact data.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setShowCreate((current) => !current)}>{showCreate ? "Close" : "Add Customer"}</Button>
          <StandardActionBar
            compact
            actions={[
              { label: "Edit", onClick: () => setShowCreate(true), disabled: !selectedCustomer },
              { label: "Save", onClick: () => void handleCreate(), disabled: !showCreate || saving },
              { label: "Delete", onClick: () => { setDraft(emptyContact); setShowCreate(false); }, disabled: !showCreate },
              { label: "Export", onClick: () => exportRowsToCsv(filteredCustomers.map((row) => ({ customer: row.displayName, email: row.email, phone: row.phone, city: row.city })), [
                { label: "Customer", value: (row) => row.customer },
                { label: "Email", value: (row) => row.email },
                { label: "Phone", value: (row) => row.phone },
                { label: "City", value: (row) => row.city },
              ], "customers.csv") },
            ]}
          />
        </div>
      </div>

      <WorkspaceModeNotice
        title="Backend-backed customer register"
        detail="This register reads only company-owned customer records. If the backend is unavailable, it shows an empty state instead of demo contacts."
      />

      <DirectoryImportPanel
        entity="customer"
        title="Customer Import"
        description="Upload or paste customer rows, review field mapping, inspect validation, and post customers directly into the active workspace register."
        exampleSource={"customer,email,phone,city,country,vat_number\nAl Waha Stores,ops@alwaha.sa,966500000001,Riyadh,Saudi Arabia,300123456700003"}
        sourceLabelDefault="customers-import.csv"
        fields={getCustomerImportFields()}
        requiredFields={getDirectoryImportRequiredFields("customer")}
        storageKey="customer-import-logs"
        importActorLabel="workspace user"
        buildPreview={(table, currentMapping) => {
          const mapping = Object.values(currentMapping).some(Boolean)
            ? currentMapping
            : buildDirectoryImportMapping(table.headers, getCustomerImportFields());
          return buildCustomerImportPreview(table, mapping, customers.map((row) => row.displayName));
        }}
        previewColumns={[
          { label: "Customer", value: (row) => row.displayName },
          { label: "Email", value: (row) => row.email || "-" },
          { label: "Phone", value: (row) => row.phone || "-" },
          { label: "City", value: (row) => row.city || "-" },
        ]}
        importRows={handleImportRows}
        onCreated={(rows) => {
          setCustomers((current) => [...rows, ...current]);
          if (rows[0]) {
            setSelectedCustomerId(rows[0].id);
            setFeedback(`${rows.length} customer ${rows.length === 1 ? "record was" : "records were"} imported into the register.`);
          }
        }}
      />

      {showCreate ? (
        <Card className="rounded-[1.25rem] bg-white/95 p-4" data-inspector-form="customer-create">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-soft/35 px-3 py-2 text-sm text-muted">
            <div>
              <p className="font-semibold text-ink">{draftDirty ? "Draft in progress" : "New customer draft"}</p>
              <p className="mt-1">Complete the highlighted required fields so the customer can be saved and used immediately in invoicing.</p>
            </div>
            <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">{draftDirty ? "Unsaved changes" : "Ready to start"}</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <Input label="Customer name" required value={draft.displayName} error={fieldErrors.displayName} onBlur={() => markTouched("displayName")} onChange={(event) => updateDraftField("displayName", event.target.value)} />
            <Input label="Email" type="email" required hint="Use a business address such as billing@customer.sa" value={draft.email} error={fieldErrors.email} onBlur={() => markTouched("email")} onChange={(event) => updateDraftField("email", event.target.value)} />
            <Input label="Phone" type="tel" required hint="Use 9 to 15 digits, for example +966512345678" value={draft.phone} error={fieldErrors.phone} onBlur={() => markTouched("phone")} onChange={(event) => updateDraftField("phone", event.target.value)} />
            <Input label="City" required value={draft.city} error={fieldErrors.city} onBlur={() => markTouched("city")} onChange={(event) => updateDraftField("city", event.target.value)} />
            <Input label="Country" required hint="Use SA for Saudi records" value={draft.country} error={fieldErrors.country} onBlur={() => markTouched("country")} onChange={(event) => updateDraftField("country", event.target.value.toUpperCase())} />
            <Input label="VAT number" required hint="15 digits, starts with 3, ends with 3" value={draft.vatNumber} error={fieldErrors.vatNumber} onBlur={() => markTouched("vatNumber")} onChange={(event) => updateDraftField("vatNumber", event.target.value)} />
            <Input label="Building number" required hint="4 digits" value={draft.buildingNumber} error={fieldErrors.buildingNumber} onBlur={() => markTouched("buildingNumber")} onChange={(event) => updateDraftField("buildingNumber", event.target.value)} />
            <Input label="Street" required hint="Saudi national address street name" value={draft.street} error={fieldErrors.street ?? fieldErrors.streetName ?? fieldErrors.address} onBlur={() => markTouched("street")} onChange={(event) => updateDraftField("street", event.target.value)} />
            <Input label="District" required value={draft.district} error={fieldErrors.district} onBlur={() => markTouched("district")} onChange={(event) => updateDraftField("district", event.target.value)} />
            <Input label="Postal code" required hint="5 digits" value={draft.postalCode} error={fieldErrors.postalCode} onBlur={() => markTouched("postalCode")} onChange={(event) => updateDraftField("postalCode", event.target.value)} />
            <Input label="Secondary number" required hint="4 digits" value={draft.secondaryNumber} error={fieldErrors.secondaryNumber} onBlur={() => markTouched("secondaryNumber")} onChange={(event) => updateDraftField("secondaryNumber", event.target.value)} />
            <Input label="Default tax" value={draft.defaultTax} onChange={(event) => updateDraftField("defaultTax", event.target.value)} />
          </div>
          {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          {feedback ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{feedback}</div> : null}
          <div className="mt-4 flex gap-3">
            <Button onClick={() => void handleCreate()} disabled={saving}>{saving ? "Saving" : "Create Customer"}</Button>
            <Button variant="secondary" onClick={() => { setShowCreate(false); setError(null); }}>Cancel</Button>
          </div>
        </Card>
      ) : null}

      {!showCreate && feedback ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <Card className="rounded-[1.25rem] bg-white/95 p-0 overflow-hidden">
        <div className="border-b border-line px-4 py-4">
          <div className="max-w-sm">
            <Input label="Search customers" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, phone, or city" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-surface-soft/70">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">City</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-muted" colSpan={4}>Loading customers...</td>
                </tr>
              ) : filteredCustomers.length ? filteredCustomers.map((customer) => (
                <tr key={customer.id} className={["border-t border-line/70 cursor-pointer", selectedCustomer?.id === customer.id ? "bg-primary-soft/20" : "hover:bg-surface-soft/40"].join(" ")} onClick={() => setSelectedCustomerId(customer.id)}>
                  <td className="px-4 py-3 font-semibold text-ink">{customer.displayName}</td>
                  <td className="px-4 py-3 text-muted">{customer.email || "-"}</td>
                  <td className="px-4 py-3 text-muted">{customer.phone || "-"}</td>
                  <td className="px-4 py-3 text-muted">{customer.city || "-"}</td>
                </tr>
              )) : (
                <tr>
                  <td className="px-4 py-6" colSpan={4}>
                    <div className="rounded-lg border border-dashed border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                      <p className="font-semibold text-ink">No customers are ready for invoicing yet.</p>
                      <p className="mt-1">Add the first customer here, then move straight into invoice creation without leaving the sales workflow.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="rounded-[1.25rem] bg-white/95 p-0 overflow-hidden" data-inspector-detail-card="customer">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Customer Detail</p>
            <h2 className="text-base font-semibold text-ink">{selectedCustomer?.displayName ?? "Select a customer"}</h2>
          </div>
          <StandardActionBar compact actions={[
            { label: "Edit", onClick: () => setShowCreate(true), disabled: !selectedCustomer },
            { label: "Save", onClick: () => void handleCreate(), disabled: true },
            { label: "Delete", onClick: () => setSelectedCustomerId(null), disabled: !selectedCustomer },
            { label: "Export", onClick: () => exportRowsToCsv(selectedCustomer ? [{ customer: selectedCustomer.displayName, city: selectedCustomer.city, vat: selectedCustomer.vatNumber ?? "" }] : [], [
              { label: "Customer", value: (row) => row.customer },
              { label: "City", value: (row) => row.city },
              { label: "VAT", value: (row) => row.vat },
            ], `${selectedCustomer?.displayName ?? "customer"}.csv`), disabled: !selectedCustomer },
          ]} />
        </div>
        {selectedCustomer ? (
          <div className="space-y-3 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface-soft/30 p-3 text-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Identity</p>
                <div className="mt-2 space-y-1.5 text-muted">
                  <p><span className="font-semibold text-ink">Email:</span> {selectedCustomer.email || "-"}</p>
                  <p><span className="font-semibold text-ink">Phone:</span> {selectedCustomer.phone || "-"}</p>
                  <p><span className="font-semibold text-ink">VAT:</span> {selectedCustomer.vatNumber || "-"}</p>
                </div>
              </div>
              <div className="rounded-lg border border-line bg-surface-soft/30 p-3 text-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Address</p>
                <div className="mt-2 space-y-1.5 text-muted">
                  <p><span className="font-semibold text-ink">City:</span> {selectedCustomer.city || "-"}</p>
                  <p><span className="font-semibold text-ink">Country:</span> {selectedCustomer.country || "-"}</p>
                  <p><span className="font-semibold text-ink">Street:</span> {selectedCustomer.street || "-"}</p>
                  <p><span className="font-semibold text-ink">Building:</span> {selectedCustomer.buildingNumber || "-"}</p>
                  <p><span className="font-semibold text-ink">District:</span> {selectedCustomer.district || "-"}</p>
                  <p><span className="font-semibold text-ink">Postal:</span> {selectedCustomer.postalCode || "-"}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-line bg-white p-3 text-sm text-muted">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">Next actions</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="xs" variant="secondary" href="/workspace/invoices/new?documentType=tax_invoice">Create Invoice</Button>
                <Button size="xs" variant="secondary" href="/workspace/user/payments">Record Payment</Button>
              </div>
            </div>
          </div>
        ) : <div className="p-4 text-sm text-muted">Select a customer row to review contact, tax, and next-action context.</div>}
      </Card>
      </div>
    </div>
  );
}