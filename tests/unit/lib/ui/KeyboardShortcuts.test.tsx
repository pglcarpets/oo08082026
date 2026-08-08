import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { KeyboardShortcuts, useKeyboardShortcutsModal } from "@/lib/ui/KeyboardShortcuts";

describe("KeyboardShortcuts Component", () => {
  it("should render null when isOpen is false", () => {
    const { container } = render(<KeyboardShortcuts isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render the shortcuts modal when isOpen is true", () => {
    render(<KeyboardShortcuts isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Keyboard Shortcuts")).toBeDefined();
    expect(screen.getByPlaceholderText("Search shortcuts...")).toBeDefined();
  });

  it("should filter shortcuts based on search term", () => {
    render(<KeyboardShortcuts isOpen={true} onClose={vi.fn()} />);
    const searchInput = screen.getByPlaceholderText("Search shortcuts...");

    // Search for "Wall tool"
    fireEvent.change(searchInput, { target: { value: "Wall" } });
    expect(screen.getByText("Wall tool")).toBeDefined();
    expect(screen.queryByText("Door tool")).toBeNull();

    // Search for non-existent shortcut
    fireEvent.change(searchInput, { target: { value: "NonExistentKey" } });
    expect(screen.getByText(/No shortcuts match/)).toBeDefined();
  });

  it("should trigger onClose when clicking close button or backdrop", () => {
    const onClose = vi.fn();
    const { container } = render(<KeyboardShortcuts isOpen={true} onClose={onClose} />);

    // Click close button
    const closeBtn = screen.getByLabelText("Close");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Click backdrop
    const backdrop = container.querySelector(".bg-black\\/50");
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("useKeyboardShortcutsModal hook", () => {
  it("should toggle isOpen on '?' keypress", () => {
    const { result } = renderHook(() => useKeyboardShortcutsModal());
    expect(result.current.isOpen).toBe(false);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("should not toggle isOpen on '?' keypress if focused in input", () => {
    const { result } = renderHook(() => useKeyboardShortcutsModal());
    expect(result.current.isOpen).toBe(false);

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    act(() => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
    });
    expect(result.current.isOpen).toBe(false);

    input.remove();
  });

  it("should close on Escape keypress when open", () => {
    const { result } = renderHook(() => useKeyboardShortcutsModal());
    act(() => {
      result.current.setIsOpen(true);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.isOpen).toBe(false);
  });
});
