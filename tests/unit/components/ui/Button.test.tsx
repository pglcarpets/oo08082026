/**
 * Name-mirror: components/ui/Button (FOCSS, no Radix)
 */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders a button with FOCSS primary styles", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("data-slot", "button");
    expect(button).toHaveAttribute("data-variant", "default");
    expect(button.className).toContain("admin-btn");
    expect(button.className).toContain("admin-btn--primary");
  });

  it("applies outline, ghost, link, and primary alias variants", () => {
    const { rerender } = render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button", { name: "Outline" })).toHaveAttribute(
      "data-variant",
      "outline",
    );
    expect(screen.getByRole("button", { name: "Outline" }).className).toContain(
      "admin-btn--outline",
    );

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button", { name: "Ghost" }).className).toContain(
      "admin-btn--ghost",
    );

    rerender(<Button variant="link">Link</Button>);
    expect(screen.getByRole("button", { name: "Link" }).className).toContain(
      "admin-btn--link",
    );

    rerender(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole("button", { name: "Primary" })).toHaveAttribute(
      "data-variant",
      "primary",
    );
    expect(screen.getByRole("button", { name: "Primary" }).className).toContain(
      "admin-btn--primary",
    );
  });

  it("applies size classes including icon", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button", { name: "Small" })).toHaveAttribute(
      "data-size",
      "sm",
    );
    expect(screen.getByRole("button", { name: "Small" }).className).toContain(
      "admin-btn--sm",
    );

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button", { name: "Large" }).className).toContain(
      "admin-btn--lg",
    );

    rerender(
      <Button size="icon" aria-label="Icon action">
        +
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Icon action" }).className).toContain(
      "admin-btn--icon",
    );
  });

  it("merges custom className and forwards ref", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} className="extra-class">
        Ref
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Ref" });
    expect(button).toHaveClass("extra-class");
    expect(ref.current).toBe(button);
  });

  it("invokes onClick and respects disabled", () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Click" }));
    expect(onClick).toHaveBeenCalledTimes(1);

    onClick.mockClear();
    rerender(
      <Button onClick={onClick} disabled>
        Click
      </Button>,
    );
    const disabled = screen.getByRole("button", { name: "Click" });
    expect(disabled).toBeDisabled();
    fireEvent.click(disabled);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders asChild by merging props onto the child element", () => {
    render(
      <Button asChild variant="outline" className="from-button">
        <a href="/planner">Open planner</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Open planner" });
    expect(link).toHaveAttribute("href", "/planner");
    expect(link).toHaveAttribute("data-variant", "outline");
    expect(link).toHaveClass("from-button");
    expect(link.className).toContain("admin-btn--outline");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
