import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionForm } from "@/components/workflow/TransactionForm";
import { WorkspaceDataProvider } from "@/components/workflow/WorkspaceDataProvider";

function renderTransactionForm(kind: "invoice" | "bill") {
  return render(
    <WorkspaceDataProvider>
      <TransactionForm kind={kind} />
    </WorkspaceDataProvider>,
  );
}

describe("transaction workflow layer", () => {
  it("creates a customer inside the invoice flow and keeps draft values", async () => {
    const user = userEvent.setup();
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

    expect(await screen.findByText("Add a customer")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Email"), "finance@future.sa");
    await user.type(screen.getByLabelText("Phone"), "+966500001122");
    await user.click(screen.getByRole("button", { name: "Save customer" }));

    await waitFor(() => {
      expect(screen.getAllByText("Future Retail Group").length).toBeGreaterThan(0);
    });

    expect(reference).toHaveValue("INV-2026-0042");
    expect(notes).toHaveValue("Keep this note while adding the customer.");
  });

  it("creates a supplier inside the bill flow and auto-selects it", async () => {
    const user = userEvent.setup();
    renderTransactionForm("bill");

    await user.click(screen.getByRole("button", { name: "Supplier" }));
    const searchInput = await screen.findByPlaceholderText("Search supplier name, city, phone, or email");
    await user.type(searchInput, "Desert Facility Services");
    await user.click(await screen.findByRole("button", { name: /Add a new supplier/i }));

    await user.type(screen.getByLabelText("Email"), "ops@desert.sa");
    await user.type(screen.getByLabelText("Phone"), "+966511223344");
    await user.click(screen.getByRole("button", { name: "Save supplier" }));

    await waitFor(() => {
      expect(screen.getAllByText("Desert Facility Services").length).toBeGreaterThan(0);
    });
  });

  it("creates an item inside a line and keeps quantity flow intact", async () => {
    const user = userEvent.setup();
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
      expect(screen.getByLabelText("Description")).toHaveValue("On-site stock count");
    });

    expect(quantityInput).toHaveValue(3);
    expect(screen.getAllByText("660.00 SAR").length).toBeGreaterThan(0);
  });

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