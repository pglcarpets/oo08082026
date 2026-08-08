/**
 * Name-mirror: features/shared/components/RestrictedActionButton
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RestrictedActionButton } from "@/features/shared/components/RestrictedActionButton";

describe("RestrictedActionButton", () => {
  it("renders children as a disabled-looking control", () => {
    render(<RestrictedActionButton>Export BOQ</RestrictedActionButton>);
    const label = screen.getByText("Export BOQ");
    expect(label).toBeInTheDocument();

    const disabledControl = label.closest("[aria-disabled='true']");
    expect(disabledControl).not.toBeNull();
    expect(disabledControl?.getAttribute("tabindex")).toBe("-1");
  });

  it("includes a lock affordance for restricted actions", () => {
    const { container } = render(
      <RestrictedActionButton>Save plan</RestrictedActionButton>,
    );
    const lock = container.querySelector("svg");
    expect(lock).not.toBeNull();
    expect(lock?.getAttribute("aria-hidden")).toBe("true");
  });
});
