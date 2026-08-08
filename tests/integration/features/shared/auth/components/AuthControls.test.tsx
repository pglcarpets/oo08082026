import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, Input } from "@/features/shared/auth/components/AuthControls";

describe("AuthControls", () => {
  it("renders button variants with optional icons", () => {
    render(
      <>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary" size="sm">
          Secondary
        </Button>
        <Button variant="danger" leftIcon={<span data-testid="left" />}>
          Danger
        </Button>
        <Button variant="ghost" rightIcon={<span data-testid="right" />}>
          Ghost
        </Button>
      </>,
    );

    expect(screen.getByRole("button", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Secondary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Danger" })).toBeInTheDocument();
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ghost" })).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });

  it("renders inputs with size and invalid states", () => {
    render(
      <>
        <Input aria-label="default" />
        <Input aria-label="small" size="sm" />
        <Input aria-label="invalid" invalid />
      </>,
    );

    expect(screen.getByLabelText("default")).not.toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText("invalid")).toHaveAttribute("aria-invalid", "true");
  });
});