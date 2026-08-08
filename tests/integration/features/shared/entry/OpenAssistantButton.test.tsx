import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OpenAssistantButton } from "@/features/shared/entry/OpenAssistantButton";

describe("OpenAssistantButton", () => {
  it("dispatches the assistant open event when clicked", () => {
    const handler = vi.fn();
    window.addEventListener("oando-assistant:open", handler);

    render(<OpenAssistantButton label="Ask AI" className="test-class" />);

    fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener("oando-assistant:open", handler);
  });
});