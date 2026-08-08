import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { RouteActionCard } from "@/components/shared/RouteActionCard";

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

describe("RouteActionCard Component", () => {
  const props = {
    kicker: "Special Offer",
    title: "Design Consultation",
    description: "Get free advice on your layout.",
    actions: [
      { href: "/contact", label: "Consult Now", variant: "primary" as const },
      { href: "/products", label: "Browse Workstations" }, // defaults to outline
    ],
  };

  it("renders all copy and kicker if provided", () => {
    render(<RouteActionCard {...props} />);

    expect(screen.getByText("Special Offer")).toBeInTheDocument();
    expect(screen.getByText("Design Consultation")).toBeInTheDocument();
    expect(screen.getByText("Get free advice on your layout.")).toBeInTheDocument();
  });

  it("omits kicker if not provided", () => {
    const { kicker: _, ...propsWithoutKicker } = props;
    render(<RouteActionCard {...propsWithoutKicker} kicker={undefined} />);

    expect(screen.queryByText("Special Offer")).toBeNull();
    expect(screen.getByText("Design Consultation")).toBeInTheDocument();
  });

  it("renders all action buttons with corresponding variants", () => {
    render(<RouteActionCard {...props} />);

    const link1 = screen.getByRole("link", { name: "Consult Now" });
    expect(link1).toHaveAttribute("href", "/contact");
    expect(link1).toHaveAttribute("data-label", "Consult Now");
    expect(link1).toHaveClass("btn-primary");

    const link2 = screen.getByRole("link", { name: "Browse Workstations" });
    expect(link2).toHaveAttribute("href", "/products");
    expect(link2).toHaveAttribute("data-label", "Browse Workstations");
    expect(link2).toHaveClass("btn-outline"); // default variant
  });

  it("declares ≥44px tap floor and stacks actions full-width on phone", () => {
    const { container } = render(<RouteActionCard {...props} />);

    const link1 = screen.getByRole("link", { name: "Consult Now" });
    const link2 = screen.getByRole("link", { name: "Browse Workstations" });
    expect(link1.className).toMatch(/min-h-11/);
    expect(link1.className).toMatch(/w-full/);
    expect(link2.className).toMatch(/min-h-11/);
    expect(link2.className).toMatch(/w-full/);

    const actionRow = container.querySelector(".mt-6");
    expect(actionRow?.className).toMatch(/flex-col/);
    expect(actionRow?.className).toMatch(/sm:flex-row/);
  });
});
