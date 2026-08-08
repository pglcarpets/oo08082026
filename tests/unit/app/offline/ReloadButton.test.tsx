import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import ReloadButton from "@/app/offline/ReloadButton";

describe("ReloadButton", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: vi.fn() },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("renders correctly and reloads the window on click", () => {
    const { getByRole } = render(<ReloadButton />);
    const button = getByRole("button", { name: "Try again" });
    expect(button).toBeDefined();
    
    fireEvent.click(button);
    expect(window.location.reload).toHaveBeenCalled();
  });
});
