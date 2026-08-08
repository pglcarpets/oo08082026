import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { Tooltip, HelpTip } from "@/lib/ui/Tooltip";

describe("Tooltip Component", () => {
  it("should show tooltip content on mouse enter after delay", () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Tooltip text" delay={300}>
        <span>Hover me</span>
      </Tooltip>
    );

    const trigger = screen.getByText("Hover me");
    expect(screen.queryByRole("tooltip")).toBeNull();

    // Mouse enter
    fireEvent.mouseEnter(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull(); // not visible yet

    // Fast-forward delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole("tooltip").textContent).toBe("Tooltip text");

    // Mouse leave
    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();

    vi.useRealTimers();
  });

  it("should support rich variant and custom positions", () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Rich text" variant="rich" position="right" delay={0}>
        <span>Hover me</span>
      </Tooltip>
    );

    const trigger = screen.getByText("Hover me");
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(0);
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("left-full"); // right position style class
    expect(tooltip.className).toContain("shadow-lg"); // rich variant style class

    vi.useRealTimers();
  });

  it("should show/hide tooltip content on focus/blur", () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Focus text" delay={0}>
        <button>Focus me</button>
      </Tooltip>
    );

    const trigger = screen.getByText("Focus me");
    fireEvent.focus(trigger);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole("tooltip").textContent).toBe("Focus text");

    fireEvent.blur(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();

    vi.useRealTimers();
  });
});

describe("HelpTip Component", () => {
  it("should render help button and show rich tooltip on hover", () => {
    vi.useFakeTimers();
    render(<HelpTip content="Helpful information" />);

    const button = screen.getByRole("button", { name: "Help" });
    expect(button.textContent).toBe("?");

    fireEvent.mouseEnter(button);
    act(() => {
      vi.advanceTimersByTime(200); // HelpTip default delay is 200ms
    });

    expect(screen.getByRole("tooltip").textContent).toBe("Helpful information");

    vi.useRealTimers();
  });
});
