import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Input } from "@/components/ui/Input";

describe("Input Component", () => {
  it("renders input element with correct props", () => {
    const handleChange = vi.fn();
    render(
      <Input
        type="email"
        placeholder="Enter your email"
        value="test@example.com"
        onChange={handleChange}
        data-testid="test-input"
      />,
    );

    const input = screen.getByTestId("test-input");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("placeholder", "Enter your email");
    expect(input).toHaveValue("test@example.com");
    expect(input).toHaveAttribute("data-slot", "input");
  });

  it("applies default styles and merges custom className", () => {
    render(<Input className="custom-class" data-testid="test-input" />);
    const input = screen.getByTestId("test-input");
    expect(input.className).toContain("custom-class");
    expect(input.className).toContain("admin-field__control");
  });

  it("forwards refs correctly", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} data-testid="test-input" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByTestId("test-input"));
  });
});
