/**
 * Name-mirror: features/shared/auth/components/AuthControls
 */

import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button, Input } from "@/features/shared/auth/components/AuthControls";

describe("Button", () => {
  it("renders children and fires click handlers", () => {
    const onClick = vi.fn();
    render(
      <Button variant="primary" onClick={onClick}>
        Save
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("supports left/right icons and disabled state", () => {
    render(
      <Button
        disabled
        leftIcon={<span data-testid="left">L</span>}
        rightIcon={<span data-testid="right">R</span>}
      >
        Busy
      </Button>,
    );
    expect(screen.getByRole("button", { name: /Busy/ })).toBeDisabled();
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });

  it("forwards ref to the underlying button element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

describe("Input", () => {
  it("marks invalid inputs for assistive tech", () => {
    render(<Input aria-label="Email" invalid defaultValue="x" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("forwards ref to the underlying input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label="Name" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
