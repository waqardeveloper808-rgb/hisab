import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloatingAiAssistant } from "@/components/FloatingAiAssistant";

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspace/dashboard",
}));

describe("floating AI assistant", () => {
  it("opens as a compact chat launcher and dismisses on outside click", async () => {
    const user = userEvent.setup();
    render(<FloatingAiAssistant />);

    await user.click(screen.getByRole("button", { name: /Chat/i }));

    expect(screen.getByRole("link", { name: "Open Chat" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Open Chat" })).not.toBeInTheDocument();
    });
  });

  it("dismisses on escape", async () => {
    const user = userEvent.setup();
    render(<FloatingAiAssistant />);

    await user.click(screen.getByRole("button", { name: /Chat/i }));
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Open Chat" })).not.toBeInTheDocument();
    });
  });
});