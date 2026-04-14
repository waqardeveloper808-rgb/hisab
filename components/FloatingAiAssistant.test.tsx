import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloatingAiAssistant } from "@/components/FloatingAiAssistant";

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspace/dashboard",
}));

describe("floating AI assistant", () => {
  it("opens without a manual close button and dismisses on outside click", async () => {
    const user = userEvent.setup();
    render(<FloatingAiAssistant />);

    await user.click(screen.getByRole("button", { name: /Dashboard Help/i }));

    expect(screen.getByRole("link", { name: "Open Help" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Open Help" })).not.toBeInTheDocument();
    });
  });

  it("dismisses on escape", async () => {
    const user = userEvent.setup();
    render(<FloatingAiAssistant />);

    await user.click(screen.getByRole("button", { name: /Dashboard Help/i }));
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Open Help" })).not.toBeInTheDocument();
    });
  });
});