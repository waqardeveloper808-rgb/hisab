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
import { useWorkspaceSession } from "@/components/workspace/WorkspaceAccessProvider";
import { createContactInBackend, createItemInBackend, getWorkspaceDirectory } from "@/lib/workspace-api";
import { contactToOption, itemToOption, sleep } from "@/components/workflow/utils";

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

export function WorkspaceDataProvider({ children }: { children: React.ReactNode }) {
  const session = useWorkspaceSession();
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [recentItemIds, setRecentItemIds] = useState<string[]>([]);
  const [optimisticItems, addOptimisticItem] = useOptimistic(items, (state, nextItem: ItemRecord) => [nextItem, ...state]);
  const [optimisticContacts, addOptimisticContact] = useOptimistic(contacts, (state, nextContact: ContactRecord) => [nextContact, ...state]);
  const workspaceReady = session?.accessStatus === "ready";

  useEffect(() => {
    if (!workspaceReady) {
      setContacts([]);
      setItems([]);
      return;
    }

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
  }, [workspaceReady]);

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
      const haystack = `${contact.displayName} ${contact.email} ${contact.phone} ${contact.city} ${contact.country ?? ""} ${contact.vatNumber ?? ""} ${contact.crNumber ?? ""}`.toLowerCase();
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

        const haystack = `${item.name} ${item.sku} ${item.category ?? ""} ${item.taxLabel}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((left, right) => {
        const leftRecent = recentRank.has(left.id) ? recentRank.get(left.id)! : Number.MAX_SAFE_INTEGER;
        const rightRecent = recentRank.has(right.id) ? recentRank.get(right.id)! : Number.MAX_SAFE_INTEGER;

        if (leftRecent !== rightRecent) {
          return leftRecent - rightRecent;
        }

        return left.name.localeCompare(right.name);
      });
  }

  function recordItemSelection(itemId: string) {
    setRecentItemIds((current) => [itemId, ...current.filter((id) => id !== itemId)].slice(0, 5));
  }

  async function createContact(payload: ContactPayload) {
    const nextContact = await createContactInBackend(payload);

    if (!nextContact) {
      throw new Error("Customer or supplier could not be created because the backend did not accept the request.");
    }

    startTransition(() => addOptimisticContact(nextContact));
    await sleep(220);
    setContacts((current) => [nextContact, ...current]);
    return nextContact;
  }

  async function createItem(payload: ItemPayload) {
    const nextItem = await createItemInBackend(payload);

    if (!nextItem) {
      throw new Error("Item could not be created because the backend did not accept the request.");
    }

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