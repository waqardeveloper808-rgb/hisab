"use client";

import {
  createContext,
  useEffect,
  startTransition,
  useContext,
  useMemo,
  useOptimistic,
  useState,
} from "react";
import type {
  ContactKind,
  ContactPayload,
  ContactRecord,
  ItemPayload,
  ItemRecord,
} from "@/components/workflow/types";
import { createContactInBackend, createItemInBackend, getWorkspaceDirectory } from "@/lib/workspace-api";
import { contactToOption, createId, itemToOption, sleep } from "@/components/workflow/utils";

type WorkspaceDataContextValue = {
  customers: ContactRecord[];
  suppliers: ContactRecord[];
  items: ItemRecord[];
  searchContacts: (kind: ContactKind, query: string) => Promise<ContactRecord[]>;
  searchItems: (query: string) => Promise<ItemRecord[]>;
  createContact: (payload: ContactPayload) => Promise<ContactRecord>;
  createItem: (payload: ItemPayload) => Promise<ItemRecord>;
  recordItemSelection: (itemId: string) => void;
};

const WorkspaceDataContext = createContext<WorkspaceDataContextValue | null>(null);

const seededContacts: ContactRecord[] = [
  { id: "cust-1", kind: "customer", displayName: "Al Noor Trading", email: "accounts@alnoor.sa", phone: "+966 50 000 1111", city: "Riyadh" },
  { id: "cust-2", kind: "customer", displayName: "Red Sea Projects", email: "finance@redsea.sa", phone: "+966 55 111 2000", city: "Jeddah" },
  { id: "supp-1", kind: "supplier", displayName: "Najd Office Supply", email: "orders@najd.sa", phone: "+966 53 400 2200", city: "Riyadh" },
  { id: "supp-2", kind: "supplier", displayName: "Eastern Services Co", email: "billing@eastern.sa", phone: "+966 54 880 9000", city: "Dammam" },
];

const seededItems: ItemRecord[] = [
  { id: "item-1", kind: "service", name: "Monthly bookkeeping", sku: "SRV-100", salePrice: 1500, purchasePrice: 900, taxLabel: "VAT 15%" },
  { id: "item-2", kind: "service", name: "VAT filing support", sku: "SRV-220", salePrice: 800, purchasePrice: 500, taxLabel: "VAT 15%" },
  { id: "item-3", kind: "product", name: "Receipt printer", sku: "PRD-410", salePrice: 650, purchasePrice: 460, taxLabel: "VAT 15%" },
];

export function WorkspaceDataProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<ContactRecord[]>(seededContacts);
  const [items, setItems] = useState<ItemRecord[]>(seededItems);
  const [recentItemIds, setRecentItemIds] = useState<string[]>([]);
  const [optimisticItems, addOptimisticItem] = useOptimistic(items, (state, nextItem: ItemRecord) => [nextItem, ...state]);
  const [optimisticContacts, addOptimisticContact] = useOptimistic(contacts, (state, nextContact: ContactRecord) => [nextContact, ...state]);

  useEffect(() => {
    let active = true;

    getWorkspaceDirectory().then((directory) => {
      if (! active || ! directory) {
        return;
      }

      const nextContacts = [...directory.customers, ...directory.suppliers];

      if (nextContacts.length) {
        setContacts(nextContacts);
      }

      if (directory.items.length) {
        setItems(directory.items);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const customers = useMemo(
    () => optimisticContacts.filter((contact) => contact.kind === "customer"),
    [optimisticContacts],
  );

  const suppliers = useMemo(
    () => optimisticContacts.filter((contact) => contact.kind === "supplier"),
    [optimisticContacts],
  );

  async function searchContacts(kind: ContactKind, query: string) {
    await sleep(180);

    const list = (kind === "customer" ? customers : suppliers).filter((contact) => {
      const haystack = `${contact.displayName} ${contact.email} ${contact.phone} ${contact.city}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });

    return list;
  }

  async function searchItems(query: string) {
    await sleep(180);

    const normalizedQuery = query.trim().toLowerCase();
    const recentRank = new Map(recentItemIds.map((id, index) => [id, index]));

    return [...optimisticItems]
      .filter((item) => {
        if (!normalizedQuery) {
          return true;
        }

        const haystack = `${item.name} ${item.sku} ${item.taxLabel}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((left, right) => {
        const leftRecent = recentRank.has(left.id) ? recentRank.get(left.id)! : Number.MAX_SAFE_INTEGER;
        const rightRecent = recentRank.has(right.id) ? recentRank.get(right.id)! : Number.MAX_SAFE_INTEGER;

        if (leftRecent !== rightRecent) {
          return leftRecent - rightRecent;
        }

        const leftSeed = seededItems.findIndex((item) => item.id === left.id);
        const rightSeed = seededItems.findIndex((item) => item.id === right.id);

        if (leftSeed !== rightSeed) {
          return (leftSeed === -1 ? Number.MAX_SAFE_INTEGER : leftSeed) - (rightSeed === -1 ? Number.MAX_SAFE_INTEGER : rightSeed);
        }

        return left.name.localeCompare(right.name);
      });
  }

  function recordItemSelection(itemId: string) {
    setRecentItemIds((current) => [itemId, ...current.filter((id) => id !== itemId)].slice(0, 5));
  }

  async function createContact(payload: ContactPayload) {
    const fallbackContact: ContactRecord = {
      id: createId(payload.kind),
      ...payload,
    };

    const nextContact = (await createContactInBackend(payload)) ?? fallbackContact;

    startTransition(() => addOptimisticContact(nextContact));
    await sleep(220);
    setContacts((current) => [nextContact, ...current]);
    return nextContact;
  }

  async function createItem(payload: ItemPayload) {
    const fallbackItem: ItemRecord = {
      id: createId("item"),
      ...payload,
    };

    const nextItem = (await createItemInBackend(payload)) ?? fallbackItem;

    startTransition(() => addOptimisticItem(nextItem));
    await sleep(220);
    setItems((current) => [nextItem, ...current]);
    recordItemSelection(nextItem.id);
    return nextItem;
  }

  const value: WorkspaceDataContextValue = {
    customers,
    suppliers,
    items: optimisticItems,
    searchContacts,
    searchItems,
    createContact,
    createItem,
    recordItemSelection,
  };

  return <WorkspaceDataContext value={value}>{children}</WorkspaceDataContext>;
}

export function useWorkspaceData() {
  const context = useContext(WorkspaceDataContext);

  if (! context) {
    throw new Error("useWorkspaceData must be used inside WorkspaceDataProvider.");
  }

  return context;
}

export { contactToOption, itemToOption };