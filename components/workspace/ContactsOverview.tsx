"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { mapWorkspaceHref } from "@/lib/workspace-path";
import { getWorkspaceDirectory } from "@/lib/workspace-api";
import type { ContactRecord, ItemRecord } from "@/components/workflow/types";

type ViewMode = "customers" | "suppliers" | "items";

type ContactsOverviewProps = {
  initialViewMode?: ViewMode;
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function ContactsOverview({
  initialViewMode = "customers",
  eyebrow = "Contacts",
  title = "Customers, suppliers, and saved items stay searchable from one directory home.",
}: ContactsOverviewProps) {
  const { basePath } = useWorkspacePath();
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<ContactRecord[]>([]);
  const [suppliers, setSuppliers] = useState<ContactRecord[]>([]);
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    getWorkspaceDirectory().then((directory) => {
      if (!directory) {
        setConnected(false);
        return;
      }

      setCustomers(directory.customers);
      setSuppliers(directory.suppliers);
      setItems(directory.items);
      setConnected(true);
    });
  }, []);

  const filteredCustomers = useMemo(
    () => customers.filter((row) => `${row.displayName} ${row.email} ${row.phone} ${row.city}`.toLowerCase().includes(query.toLowerCase())),
    [customers, query],
  );
  const filteredSuppliers = useMemo(
    () => suppliers.filter((row) => `${row.displayName} ${row.email} ${row.phone} ${row.city}`.toLowerCase().includes(query.toLowerCase())),
    [suppliers, query],
  );
  const filteredItems = useMemo(
    () => items.filter((row) => `${row.name} ${row.sku} ${row.taxLabel}`.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
          <h1 className="text-lg font-semibold tracking-tight text-ink">{title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" href={mapWorkspaceHref("/workspace/invoices/new", basePath)}>New invoice</Button>
          <Button size="sm" href={mapWorkspaceHref("/workspace/bills/new", basePath)} variant="secondary">New bill</Button>
        </div>
      </div>

      <Card className="rounded-xl bg-white/95 p-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {([
              ["customers", `Customers ${customers.length}`],
              ["suppliers", `Suppliers ${suppliers.length}`],
              ["items", `Items ${items.length}`],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setViewMode(value)}
                className={[
                  "rounded-2xl px-4 py-2.5 text-sm font-semibold",
                  viewMode === value ? "bg-primary text-white" : "bg-surface-soft text-ink hover:bg-primary-soft hover:text-primary",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="w-full lg:max-w-sm">
            <Input label="Search directory" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, phone, city, or code" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>{connected ? "Connected to company directory data" : "No company directory data available yet"}</span>
          <Link href={mapWorkspaceHref("/workspace/help/faq", basePath)} className="font-semibold text-primary hover:text-primary-hover">Directory guidance</Link>
        </div>
      </Card>

      {viewMode === "customers" ? (
        <WorkspaceDataTable
          registerTableId="directory-customers"
          title="Customers"
          caption="People and businesses you invoice."
          rows={filteredCustomers}
          emptyMessage="Customer records will appear here as soon as they are created from the invoice flow."
          columns={[
            { id: "name", header: "Name", defaultWidth: 200, render: (row) => row.displayName },
            { id: "email", header: "Email", defaultWidth: 180, render: (row) => row.email || "-" },
            { id: "phone", header: "Phone", defaultWidth: 120, render: (row) => row.phone || "-" },
            { id: "city", header: "City", defaultWidth: 120, render: (row) => row.city || "-" },
          ]}
        />
      ) : null}

      {viewMode === "suppliers" ? (
        <WorkspaceDataTable
          registerTableId="directory-suppliers"
          title="Suppliers"
          caption="Businesses you buy from and pay through the purchases flow."
          rows={filteredSuppliers}
          emptyMessage="Supplier records will appear here as soon as they are created from the vendor bill flow."
          columns={[
            { id: "name", header: "Name", defaultWidth: 200, render: (row) => row.displayName },
            { id: "email", header: "Email", defaultWidth: 180, render: (row) => row.email || "-" },
            { id: "phone", header: "Phone", defaultWidth: 120, render: (row) => row.phone || "-" },
            { id: "city", header: "City", defaultWidth: 120, render: (row) => row.city || "-" },
          ]}
        />
      ) : null}

      {viewMode === "items" ? (
        <WorkspaceDataTable
          registerTableId="directory-items"
          title="Products and services"
          caption="Saved line-item records used in sales and purchases."
          rows={filteredItems}
          emptyMessage="Saved products and services will appear here as they are created from transaction entry."
          columns={[
            { id: "name", header: "Name", defaultWidth: 200, render: (row) => row.name },
            { id: "code", header: "Code", defaultWidth: 120, render: (row) => row.sku || "-" },
            { id: "type", header: "Type", defaultWidth: 100, render: (row) => row.kind },
            { id: "tax", header: "Tax", defaultWidth: 120, render: (row) => row.taxLabel },
          ]}
        />
      ) : null}
    </div>
  );
}