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
  description = "The transaction flow still owns quick creation, while this page gives finance a calm place to review the records behind daily work.",
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
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">{title}</h1>
            <p className="mt-4 text-base leading-7 text-muted">{description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={mapWorkspaceHref("/workspace/invoices/new", basePath)}>New invoice</Button>
            <Button href={mapWorkspaceHref("/workspace/bills/new", basePath)} variant="secondary">New vendor bill</Button>
          </div>
        </div>
      </Card>

      <Card className="rounded-[1.8rem] bg-white/92 p-5">
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
          title="Customers"
          caption="People and businesses you invoice."
          rows={filteredCustomers}
          emptyMessage="Customer records will appear here as soon as they are created from the invoice flow."
          columns={[
            { header: "Name", render: (row) => row.displayName },
            { header: "Email", render: (row) => row.email || "-" },
            { header: "Phone", render: (row) => row.phone || "-" },
            { header: "City", render: (row) => row.city || "-" },
          ]}
        />
      ) : null}

      {viewMode === "suppliers" ? (
        <WorkspaceDataTable
          title="Suppliers"
          caption="Businesses you buy from and pay through the purchases flow."
          rows={filteredSuppliers}
          emptyMessage="Supplier records will appear here as soon as they are created from the vendor bill flow."
          columns={[
            { header: "Name", render: (row) => row.displayName },
            { header: "Email", render: (row) => row.email || "-" },
            { header: "Phone", render: (row) => row.phone || "-" },
            { header: "City", render: (row) => row.city || "-" },
          ]}
        />
      ) : null}

      {viewMode === "items" ? (
        <WorkspaceDataTable
          title="Products and services"
          caption="Saved line-item records used in sales and purchases."
          rows={filteredItems}
          emptyMessage="Saved products and services will appear here as they are created from transaction entry."
          columns={[
            { header: "Name", render: (row) => row.name },
            { header: "Code", render: (row) => row.sku || "-" },
            { header: "Type", render: (row) => row.kind },
            { header: "Tax", render: (row) => row.taxLabel },
          ]}
        />
      ) : null}
    </div>
  );
}