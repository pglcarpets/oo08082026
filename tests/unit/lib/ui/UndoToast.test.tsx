import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { UndoToast } from "@/lib/ui/UndoToast";

describe("UndoToast Component", () => {
  it("should render null when message is null", () => {
    const { container } = render(<UndoToast message={null} onDismiss={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render text and action label correctly for undo type", () => {
    const message = { id: "1", text: "Item deleted", type: "undo" as const };
    render(<UndoToast message={message} onDismiss={vi.fn()} />);

    expect(screen.getByText("Item deleted")).toBeDefined();
    expect(screen.getByRole("button", { name: "Undo" })).toBeDefined();
  });

  it("should render text and action label correctly for redo type", () => {
    const message = { id: "1", text: "Action undone", type: "redo" as const };
    render(<UndoToast message={message} onDismiss={vi.fn()} />);

    expect(screen.getByText("Action undone")).toBeDefined();
    expect(screen.getByRole("button", { name: "Redo" })).toBeDefined();
  });

  it("should call onDismiss automatically after duration", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const message = { id: "1", text: "Item deleted", type: "undo" as const };

    render(<UndoToast message={message} onDismiss={onDismiss} duration={3000} />);

    // Fast forward just before dismiss
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    // Fast forward past the 300ms transition time
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("should trigger onAction and call onDismiss when button is clicked", () => {
    vi.useFakeTimers();
    const onAction = vi.fn();
    const onDismiss = vi.fn();
    const message = { id: "1", text: "Item deleted", type: "undo" as const, onAction };

    render(<UndoToast message={message} onDismiss={onDismiss} />);

    const button = screen.getByRole("button", { name: "Undo" });
    fireEvent.click(button);

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled(); // not yet, waits for 300ms transition

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
