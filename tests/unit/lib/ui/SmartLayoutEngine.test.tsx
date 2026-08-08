import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { SmartLayoutPanel, LAYOUT_TEMPLATES } from "@/lib/ui/SmartLayoutEngine";

describe("SmartLayoutPanel Component", () => {
  it("should render collapsed floating button initially", () => {
    render(<SmartLayoutPanel />);
    expect(screen.getByRole("button", { name: "Smart Layout Generator" })).toBeDefined();
    expect(screen.queryByText("Smart Layout Generator")).toBeNull();
  });

  it("should open the generator panel when clicking the collapsed button", () => {
    render(<SmartLayoutPanel />);
    const button = screen.getByRole("button", { name: "Smart Layout Generator" });
    fireEvent.click(button);

    // Now it should be open
    expect(screen.getByText("Smart Layout Generator")).toBeDefined();
    expect(screen.getByText("Open Plan (Small Team)")).toBeDefined();
  });

  it("should calculate and render the room area if width and depth are provided", () => {
    // 5m x 4m = 20 m2
    render(<SmartLayoutPanel roomWidthMm={5000} roomDepthMm={4000} />);
    const button = screen.getByRole("button", { name: "Smart Layout Generator" });
    fireEvent.click(button);

    expect(screen.getByText("20 m²")).toBeDefined();
  });

  it("should call onApplyTemplate and change button text to 'Applied!' when applied", () => {
    vi.useFakeTimers();
    const onApplyTemplate = vi.fn();
    render(<SmartLayoutPanel onApplyTemplate={onApplyTemplate} />);

    // Open panel
    fireEvent.click(screen.getByRole("button", { name: "Smart Layout Generator" }));

    // Select first template
    const templateButton = screen.getByText("Open Plan (Small Team)");
    fireEvent.click(templateButton);

    // Apply template
    const applyButton = screen.getByRole("button", { name: "Apply Layout" });
    fireEvent.click(applyButton);

    expect(onApplyTemplate).toHaveBeenCalledWith(LAYOUT_TEMPLATES[0]);
    expect(screen.getByText("Applied!")).toBeDefined();

    // Fast-forward timers to check if it resets back to "Apply Layout"
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText("Applied!")).toBeNull();
    vi.useRealTimers();
  });

  it("should close the panel when clicking close (×) button", () => {
    render(<SmartLayoutPanel />);
    // Open
    fireEvent.click(screen.getByRole("button", { name: "Smart Layout Generator" }));
    expect(screen.getByText("Smart Layout Generator")).toBeDefined();

    // Close
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("Smart Layout Generator")).toBeNull();
  });
});
