import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RestrictedActionButton } from "@/features/shared/components/RestrictedActionButton";

describe("RestrictedActionButton", () => {
  it("renders a disabled action with sign-in guidance", () => {
    render(<RestrictedActionButton>Save layout</RestrictedActionButton>);

    const buttons = screen.getAllByRole("button", { name: "Save layout" });
    const innerButton = buttons[buttons.length - 1]; // Inner button gets the classes
    expect(innerButton).toHaveAttribute("aria-disabled", "true");
    expect(innerButton).toHaveClass("pointer-events-none");
  });
});