import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";

vi.mock("@/components/ui/TrackedLink", () => ({
  TrackedLink: ({
    href,
    label,
    className,
    children,
  }: {
    href: string;
    label: string;
    className?: string;
    children: ReactNode;
  }) => (
    <a href={href} className={className} data-label={label}>
      {children}
    </a>
  ),
}));

describe("RouteCtaBand Component", () => {
  const props = {
    kicker: "Special Promo",
    title: "Consultation Session",
    description: "Talk to an architect today.",
    actions: [
      { href: "/contact", label: "Consult Now", variant: "primary" as const },
      { href: "/portfolio", label: "View Portfolio" }, // defaults to outline-light
    ],
  };

  it("renders all copy and kicker if provided", () => {
    render(<RouteCtaBand {...props} />);

    expect(screen.getByText("Special Promo")).toBeInTheDocument();
    expect(screen.getByText("Consultation Session")).toBeInTheDocument();
    expect(screen.getByText("Talk to an architect today.")).toBeInTheDocument();
  });

  it("omits kicker if not provided", () => {
    const { kicker: _, ...propsWithoutKicker } = props;
    render(<RouteCtaBand {...propsWithoutKicker} kicker={undefined} />);

    expect(screen.queryByText("Special Promo")).toBeNull();
    expect(screen.getByText("Consultation Session")).toBeInTheDocument();
  });

  it("renders action links with appropriate styles", () => {
    render(<RouteCtaBand {...props} />);

    const link1 = screen.getByRole("link", { name: "Consult Now" });
    expect(link1).toHaveAttribute("href", "/contact");
    expect(link1).toHaveClass("btn-primary");

    const link2 = screen.getByRole("link", { name: "View Portfolio" });
    expect(link2).toHaveAttribute("href", "/portfolio");
    expect(link2).toHaveClass("btn-outline-light"); // default variant
  });

  it("declares ≥44px tap floor and stacks actions full-width on phone", () => {
    const { container } = render(<RouteCtaBand {...props} />);

    const link1 = screen.getByRole("link", { name: "Consult Now" });
    const link2 = screen.getByRole("link", { name: "View Portfolio" });
    expect(link1.className).toMatch(/min-h-11/);
    expect(link1.className).toMatch(/w-full/);
    expect(link2.className).toMatch(/min-h-11/);
    expect(link2.className).toMatch(/w-full/);

    const actionRow = container.querySelector(".flex.w-full");
    expect(actionRow?.className).toMatch(/flex-col/);
    expect(actionRow?.className).toMatch(/sm:flex-row/);
  });
});
