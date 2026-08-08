/**
 * Name-mirror: features/shared/entry/OpenAssistantButton
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { OpenAssistantButton } from "@/features/shared/entry/OpenAssistantButton";

describe("OpenAssistantButton", () => {
  it("renders the provided label", () => {
    render(<OpenAssistantButton label="Ask AI which path fits" />);
    expect(screen.getByRole("button", { name: /Ask AI which path fits/i })).toBeInTheDocument();
  });

  it("dispatches oando-assistant:open on click", () => {
    const handler = vi.fn();
    window.addEventListener("oando-assistant:open", handler);
    render(<OpenAssistantButton label="Open assistant" className="btn" />);

    fireEvent.click(screen.getByRole("button", { name: /Open assistant/i }));
    expect(handler).toHaveBeenCalledTimes(1);

    window.removeEventListener("oando-assistant:open", handler);
  });
});
