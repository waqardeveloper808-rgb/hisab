"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { mapWorkspaceHref } from "@/lib/workspace-path";

type CommandItem = {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void;
};

export function CommandPalette() {
  const router = useRouter();
  const { basePath } = useWorkspacePath();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const navigate = useCallback((path: string) => {
    router.push(mapWorkspaceHref(path, basePath));
    setOpen(false);
  }, [basePath, router]);

  const commands = useMemo<CommandItem[]>(() => [
    // Navigation
    { id: "nav-dashboard", label: "Go to Dashboard", category: "Navigation", shortcut: "G D", action: () => navigate("/workspace/dashboard") },
    { id: "nav-invoices", label: "Go to Invoices", category: "Navigation", shortcut: "G I", action: () => navigate("/workspace/user/invoices") },
    { id: "nav-quotations", label: "Go to Quotations", category: "Navigation", action: () => navigate("/workspace/user/quotations") },
    { id: "nav-proforma", label: "Go to Proforma Invoices", category: "Navigation", action: () => navigate("/workspace/user/proforma-invoices") },
    { id: "nav-credit-notes", label: "Go to Credit Notes", category: "Navigation", action: () => navigate("/workspace/user/credit-notes") },
    { id: "nav-debit-notes", label: "Go to Debit Notes", category: "Navigation", action: () => navigate("/workspace/user/debit-notes") },
    { id: "nav-bills", label: "Go to Bills", category: "Navigation", shortcut: "G B", action: () => navigate("/workspace/user/bills") },
    { id: "nav-expenses", label: "Go to Expenses", category: "Navigation", action: () => navigate("/workspace/user/expenses") },
    { id: "nav-payments", label: "Go to Payments", category: "Navigation", shortcut: "G P", action: () => navigate("/workspace/user/payments") },
    { id: "nav-customers", label: "Go to Customers", category: "Navigation", shortcut: "G C", action: () => navigate("/workspace/user/customers") },
    { id: "nav-vendors", label: "Go to Vendors", category: "Navigation", action: () => navigate("/workspace/user/vendors") },
    { id: "nav-products", label: "Go to Products & Services", category: "Navigation", action: () => navigate("/workspace/user/products") },
    { id: "nav-coa", label: "Go to Chart of Accounts", category: "Navigation", action: () => navigate("/workspace/user/chart-of-accounts") },
    { id: "nav-journal", label: "Go to Journal Entries", category: "Navigation", action: () => navigate("/workspace/user/journal-entries") },
    { id: "nav-ledger", label: "Go to Ledger", category: "Navigation", action: () => navigate("/workspace/user/ledger") },
    { id: "nav-vat", label: "Go to VAT Summary", category: "Navigation", shortcut: "G V", action: () => navigate("/workspace/user/vat") },
    { id: "nav-reports", label: "Go to Reports", category: "Navigation", shortcut: "G R", action: () => navigate("/workspace/user/reports") },
    { id: "nav-templates", label: "Go to Invoice Templates", category: "Navigation", shortcut: "G T", action: () => navigate("/workspace/user/invoice-templates") },
    { id: "nav-settings", label: "Go to Settings", category: "Navigation", shortcut: "G S", action: () => navigate("/workspace/settings/company") },
    { id: "nav-users", label: "Go to Users", category: "Navigation", action: () => navigate("/workspace/settings/users") },
    { id: "nav-help", label: "Go to Help Center", category: "Navigation", shortcut: "G H", action: () => navigate("/workspace/help") },
    // Creation
    { id: "create-invoice", label: "Create New Invoice", category: "Create", shortcut: "N I", action: () => navigate("/workspace/invoices/new?documentType=tax_invoice") },
    { id: "create-bill", label: "Create New Bill", category: "Create", shortcut: "N B", action: () => navigate("/workspace/bills/new") },
    { id: "create-quotation", label: "Create New Quotation", category: "Create", action: () => navigate("/workspace/invoices/new?documentType=quotation") },
    { id: "create-proforma", label: "Create New Proforma Invoice", category: "Create", action: () => navigate("/workspace/invoices/new?documentType=proforma_invoice") },
    { id: "create-credit-note", label: "Create Credit Note", category: "Create", action: () => navigate("/workspace/invoices/new?documentType=credit_note") },
    { id: "create-debit-note", label: "Create Debit Note", category: "Create", action: () => navigate("/workspace/invoices/new?documentType=debit_note") },
  ], [navigate]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const terms = query.toLowerCase().split(/\s+/);
    return commands.filter((cmd) => {
      const haystack = `${cmd.label} ${cmd.category}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Cmd/Ctrl+K to open
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      // Shift+? to open shortcuts help
      if (event.shiftKey && event.key === "?") {
        const target = event.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        event.preventDefault();
        setOpen(true);
        setQuery("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
    }
  }, [open]);

  const executeSelected = useCallback(() => {
    const cmd = filteredCommands[selectedIndex];
    if (cmd) {
      cmd.action();
      setOpen(false);
      setQuery("");
    }
  }, [filteredCommands, selectedIndex]);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      executeSelected();
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  // Scroll selected into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.querySelector("[data-selected='true']");
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!open) return null;

  const groupedCommands = filteredCommands.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    (acc[cmd.category] ??= []).push(cmd);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" role="dialog" aria-label="Command palette">
      <button type="button" className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close command palette" />
      <div className="relative w-full max-w-lg rounded-xl border border-line bg-white shadow-overlay">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <span className="text-[11px] font-semibold text-muted">⌘K</span>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted/60"
            placeholder="Type a command or search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Command search"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="rounded border border-line bg-surface-soft px-1.5 py-0.5 text-[10px] font-semibold text-muted">Esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1" role="listbox">
          {filteredCommands.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted">No commands match &quot;{query}&quot;</p>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category}>
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{category}</p>
                {items.map((cmd) => {
                  const idx = filteredCommands.indexOf(cmd);
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-selected={isSelected}
                      className={[
                        "flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm",
                        isSelected ? "bg-primary-soft text-primary" : "text-ink hover:bg-surface-soft",
                      ].join(" ")}
                      onClick={() => { cmd.action(); setOpen(false); setQuery(""); }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <span className="truncate">{cmd.label}</span>
                      {cmd.shortcut ? (
                        <kbd className="shrink-0 rounded border border-line bg-surface-soft px-1.5 py-0.5 text-[10px] font-semibold text-muted">{cmd.shortcut}</kbd>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t border-line px-3 py-1.5 text-[10px] text-muted">
          <span>↑↓ navigate · ↵ select · Esc close</span>
          <span>Shift+? shortcuts</span>
        </div>
      </div>
    </div>
  );
}
