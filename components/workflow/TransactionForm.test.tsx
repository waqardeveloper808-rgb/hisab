import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { createNextNavigationModuleMock } from "@/tests/helpers/mock-next-navigation";
import { installAuthSessionFetchMock } from "@/tests/helpers/mock-auth-session";
import { installWorkspaceApiFetchMock } from "@/tests/helpers/mock-workspace-api-fetch";

const workspaceMocks = vi.hoisted(() => {
  let nextContactBackendId = 1000;
  let nextItemBackendId = 2000;

  const redSeaCustomer = {
    id: "cust-red-sea",
    backendId: 101,
    kind: "customer" as const,
    displayName: "Red Sea Projects",
    email: "info@redsea.test",
    phone: "+966500000001",
    city: "Jeddah",
    country: "SA",
    origin: "inside_ksa" as const,
    vatNumber: "",
    street: "",
    buildingNumber: "",
    district: "",
    postalCode: "",
    secondaryNumber: "",
    crNumber: "",
    additionalDocumentNumbers: "",
    defaultRevenueAccount: "",
    defaultCostCenter: "",
    defaultTax: "",
    purchasingDefaults: "",
    beneficiaryName: "",
    beneficiaryBank: "",
    beneficiaryIban: "",
    beneficiaryReference: "",
    customFields: "",
  };

  const alNoorCustomer = {
    ...redSeaCustomer,
    id: "cust-al-noor",
    backendId: 102,
    displayName: "Al Noor Trading",
    email: "info@alnoor.test",
    phone: "+966500000002",
    city: "Riyadh",
  };

  const seedSupplier = {
    id: "sup-seed",
    backendId: 201,
    kind: "supplier" as const,
    displayName: "Seed Supplier Co",
    email: "sup@seed.test",
    phone: "+966511111111",
    city: "Dammam",
    country: "SA",
    origin: "inside_ksa" as const,
    vatNumber: "",
    street: "",
    buildingNumber: "",
    district: "",
    postalCode: "",
    secondaryNumber: "",
    crNumber: "",
    additionalDocumentNumbers: "",
    defaultRevenueAccount: "",
    defaultCostCenter: "",
    defaultTax: "",
    purchasingDefaults: "",
    beneficiaryName: "",
    beneficiaryBank: "",
    beneficiaryIban: "",
    beneficiaryReference: "",
    customFields: "",
  };

  const seedItem = {
    id: "item-seed",
    backendId: 301,
    kind: "service" as const,
    inventoryClassification: undefined as string | undefined,
    name: "Consulting hours",
    sku: "CNS-1",
    description: "",
    category: "Services",
    salePrice: 100,
    purchasePrice: 50,
    taxLabel: "Standard VAT 15%",
    isActive: true,
  };

  function contactFromPayload(payload: {
    kind: "customer" | "supplier";
    displayName: string;
    email: string;
    phone: string;
    city: string;
    country?: string;
    origin?: "inside_ksa" | "outside_ksa";
    vatNumber?: string;
    street?: string;
    buildingNumber?: string;
    district?: string;
    postalCode?: string;
    secondaryNumber?: string;
    crNumber?: string;
    additionalDocumentNumbers?: string;
    defaultRevenueAccount?: string;
    defaultCostCenter?: string;
    defaultTax?: string;
    purchasingDefaults?: string;
    beneficiaryName?: string;
    beneficiaryBank?: string;
    beneficiaryIban?: string;
    beneficiaryReference?: string;
    customFields?: string;
  }) {
    nextContactBackendId += 1;
    return {
      id: `new-c-${nextContactBackendId}`,
      backendId: nextContactBackendId,
      kind: payload.kind,
      displayName: payload.displayName,
      email: payload.email,
      phone: payload.phone,
      city: payload.city,
      country: payload.country ?? "",
      origin: payload.origin ?? ("inside_ksa" as const),
      vatNumber: payload.vatNumber ?? "",
      street: payload.street ?? "",
      buildingNumber: payload.buildingNumber ?? "",
      district: payload.district ?? "",
      postalCode: payload.postalCode ?? "",
      secondaryNumber: payload.secondaryNumber ?? "",
      crNumber: payload.crNumber ?? "",
      additionalDocumentNumbers: payload.additionalDocumentNumbers ?? "",
      defaultRevenueAccount: payload.defaultRevenueAccount ?? "",
      defaultCostCenter: payload.defaultCostCenter ?? "",
      defaultTax: payload.defaultTax ?? "",
      purchasingDefaults: payload.purchasingDefaults ?? "",
      beneficiaryName: payload.beneficiaryName ?? "",
      beneficiaryBank: payload.beneficiaryBank ?? "",
      beneficiaryIban: payload.beneficiaryIban ?? "",
      beneficiaryReference: payload.beneficiaryReference ?? "",
      customFields: payload.customFields ?? "",
    };
  }

  function itemFromPayload(payload: {
    kind: "product" | "service" | "raw_material" | "finished_good";
    inventoryClassification?: string;
    name: string;
    sku: string;
    description?: string;
    category?: string;
    salePrice: number;
    purchasePrice: number;
    taxLabel: string;
    isActive?: boolean;
  }) {
    nextItemBackendId += 1;
    return {
      id: `new-i-${nextItemBackendId}`,
      backendId: nextItemBackendId,
      kind: payload.kind,
      inventoryClassification: payload.inventoryClassification,
      name: payload.name,
      sku: payload.sku,
      description: payload.description ?? "",
      category: payload.category ?? (payload.kind === "product" ? "Products" : "Services"),
      salePrice: payload.salePrice,
      purchasePrice: payload.purchasePrice,
      taxLabel: payload.taxLabel,
      isActive: payload.isActive ?? true,
    };
  }

  return {
    getWorkspaceDirectory: vi.fn(async () => ({
      customers: [redSeaCustomer, alNoorCustomer],
      suppliers: [seedSupplier],
      items: [seedItem],
    })),
    createContactInBackend: vi.fn(async (payload: Parameters<typeof contactFromPayload>[0]) => contactFromPayload(payload)),
    createItemInBackend: vi.fn(async (payload: Parameters<typeof itemFromPayload>[0]) => itemFromPayload(payload)),
    resetMockIds: () => {
      nextContactBackendId = 1000;
      nextItemBackendId = 2000;
    },
  };
});

vi.mock("next/navigation", () => createNextNavigationModuleMock({ pathname: "/workspace/user/invoices/new" }));

vi.mock("@/lib/workspace-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/workspace-api")>();
  return {
    ...actual,
    getWorkspaceDirectory: workspaceMocks.getWorkspaceDirectory,
    createContactInBackend: workspaceMocks.createContactInBackend,
    createItemInBackend: workspaceMocks.createItemInBackend,
  };
});

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionForm } from "@/components/workflow/TransactionForm";
import { WorkspaceDataProvider } from "@/components/workflow/WorkspaceDataProvider";
import { WorkspaceAccessProvider } from "@/components/workspace/WorkspaceAccessProvider";

function renderTransactionForm(kind: "invoice" | "bill") {
  const session = {
    id: 1,
    userId: 1,
    name: "Tester",
    email: "tester@example.com",
    accessStatus: "ready" as const,
    activeCompanyId: 1,
  };

  return render(
    <WorkspaceAccessProvider value={null} session={session}>
      <WorkspaceDataProvider>
        <TransactionForm kind={kind} />
      </WorkspaceDataProvider>
    </WorkspaceAccessProvider>,
  );
}

let restoreFetch: null | (() => void) = null;

beforeEach(() => {
  workspaceMocks.resetMockIds();
  const restoreAuthSessionFetch = installAuthSessionFetchMock();
  const restoreWorkspaceFetch = installWorkspaceApiFetchMock([
    {
      path: "/api/workspace/settings",
      body: {
        data: {
          company: {
            legal_name: "Vitest Trading Co",
            tax_number: "300000000000001",
            base_currency: "SAR",
          },
          settings: {
            default_language: "en",
          },
        },
      },
    },
    {
      path: "/api/workspace/templates",
      body: { data: [] },
    },
    {
      path: "/api/workspace/custom-fields",
      body: { data: [] },
    },
    {
      path: "/api/workspace/cost-centers",
      body: { data: [] },
    },
    {
      path: "/api/workspace/inventory/stock",
      body: { data: [] },
    },
    {
      path: /^\/api\/workspace\/documents(?:\/.*)?$/,
      body: { data: [] },
    },
    {
      method: "POST",
      path: "/api/workspace/intelligence/transaction",
      body: {
        data: {
          suggestions: [],
          anomalies: [],
          reminders: [],
          confidenceScore: 0,
          patterns: {},
          metrics: {},
        },
      },
    },
  ]);

  restoreFetch = () => {
    restoreWorkspaceFetch();
    restoreAuthSessionFetch();
  };
});

afterEach(() => {
  restoreFetch?.();
  restoreFetch = null;
});

describe("transaction workflow layer", () => {
  it("creates a customer inside the invoice flow and keeps draft values", async () => {
    const user = userEvent.setup({ delay: null });
    renderTransactionForm("invoice");

    const reference = screen.getByLabelText("Invoice reference");
    const notes = screen.getByLabelText("Notes");

    await user.clear(reference);
    await user.type(reference, "INV-2026-0042");
    await user.type(notes, "Keep this note while adding the customer.");

    await user.click(screen.getByRole("button", { name: "Customer" }));
    const searchInput = await screen.findByPlaceholderText("Search customer name, city, phone, or email");
    await user.type(searchInput, "Future Retail Group");
    await user.click(await screen.findByRole("button", { name: /Add a new customer/i }));

    expect(await screen.findByRole("heading", { name: "Create customer" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Email"), "finance@future.sa");
    await user.type(screen.getByLabelText("Phone"), "+966500001122");
    await user.type(screen.getByLabelText(/VAT Number/), "300000000000099");
    await user.click(screen.getByRole("button", { name: "Save customer" }));

    await waitFor(() => {
      expect(screen.getAllByText("Future Retail Group").length).toBeGreaterThan(0);
    });

    expect(reference).toHaveValue("INV-2026-0042");
    expect(notes).toHaveValue("Keep this note while adding the customer.");
  }, 20_000);

  it("creates a supplier inside the bill flow and auto-selects it", async () => {
    const user = userEvent.setup({ delay: null });
    renderTransactionForm("bill");

    await user.click(screen.getByRole("button", { name: "Supplier" }));
    const searchInput = await screen.findByPlaceholderText("Search supplier name, city, phone, or email");
    await user.type(searchInput, "Desert Facility Services");
    await user.click(await screen.findByRole("button", { name: /Add a new supplier/i }));

    await user.type(screen.getByLabelText("Email"), "ops@desert.sa");
    await user.type(screen.getByLabelText("Phone"), "+966511223344");
    await user.type(screen.getByLabelText(/VAT Number/), "300000000000088");
    await user.click(screen.getByRole("button", { name: "Save supplier" }));

    await waitFor(() => {
      expect(screen.getAllByText("Desert Facility Services").length).toBeGreaterThan(0);
    });
  }, 20_000);

  it("creates an item inside a line and keeps quantity flow intact", async () => {
    const user = userEvent.setup({ delay: null });
    renderTransactionForm("invoice");

    const quantityInput = screen.getByLabelText("Qty");
    fireEvent.change(quantityInput, { target: { value: "3" } });

    await user.click(screen.getByRole("button", { name: "Product or service" }));
    const searchInput = await screen.findByPlaceholderText("Search item name or code");
    await user.type(searchInput, "On-site stock count");
    await user.click(await screen.findByRole("button", { name: /Add a new product or service/i }));

    await user.type(screen.getByLabelText("Code"), "SRV-510");
    await user.clear(screen.getByLabelText("Sales price"));
    await user.type(screen.getByLabelText("Sales price"), "220");
    await user.click(screen.getByRole("button", { name: "Save item" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Description").value).toMatch(/On-site stock count/);
    });

    expect(quantityInput).toHaveValue(3);
    expect(screen.getAllByText("660.00 SAR").length).toBeGreaterThan(0);
  }, 20_000);

  it("searchable pickers open and filter real options", async () => {
    const user = userEvent.setup();
    renderTransactionForm("invoice");

    await user.click(screen.getByRole("button", { name: "Customer" }));
    const searchInput = await screen.findByPlaceholderText("Search customer name, city, phone, or email");
    await user.type(searchInput, "Red Sea");

    await waitFor(() => {
      const listbox = screen.getByRole("listbox");
      expect(within(listbox).getByText("Red Sea Projects")).toBeInTheDocument();
      expect(within(listbox).queryByText("Al Noor Trading")).not.toBeInTheDocument();
    });
  });
});
