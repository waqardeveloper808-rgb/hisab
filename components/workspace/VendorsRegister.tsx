"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import { createContactInBackend, getWorkspaceDirectory } from "@/lib/workspace-api";
import type { ContactRecord } from "@/components/workflow/types";

const emptyVendor = {
  displayName: "",
  email: "",
  phone: "",
  city: "",
};

export function VendorsRegister() {
  const [vendors, setVendors] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState(emptyVendor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleCreate() {
    if (!draft.displayName.trim()) {
      setError("Vendor name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const created = await createContactInBackend({
        kind: "supplier",
        displayName: draft.displayName.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        city: draft.city.trim(),
      });

      if (!created) {
        setError("Vendor could not be created in the current mode.");
        return;
      }

      setVendors((current) => [created, ...current]);
      setDraft(emptyVendor);
      setShowCreate(false);
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input label="Vendor name" value={draft.displayName} onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))} />
            <Input label="Email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} />
            <Input label="Phone" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
            <Input label="City" value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} />
          </div>
          {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          <div className="mt-4 flex gap-3">
            <Button onClick={() => void handleCreate()} disabled={saving}>{saving ? "Saving" : "Create Vendor"}</Button>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </Card>
      ) : null}

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
                    <div className="rounded-[1.2rem] border border-dashed border-line bg-surface-soft px-4 py-4 text-sm text-muted">
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