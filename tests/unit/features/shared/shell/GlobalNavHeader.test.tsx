/**
 * Name-mirror: features/shared/shell/GlobalNavHeader
 */

import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlobalNavHeader } from "@/features/shared/shell/GlobalNavHeader";

const mockUsePathname = vi.fn(() => "/dashboard");

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("GlobalNavHeader", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/dashboard");
  });

  it("renders suite branding and main nav links", () => {
    render(<GlobalNavHeader />);
    expect(
      screen.getByLabelText(/One&Only workspace - Go to dashboard/i),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      screen.getByRole("img", { name: /One&Only Furniture/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: "Portal" })).toHaveAttribute(
      "href",
      "/portal",
    );
    expect(screen.getByRole("link", { name: "Planner" })).toHaveAttribute(
      "href",
      "/ooplanner",
    );
  });

  it("marks Dashboard as current on /dashboard", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Portal" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks Portal as current on /portal routes", () => {
    mockUsePathname.mockReturnValue("/portal/plans");
    render(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Portal" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks Planner as current on planner canvas paths", () => {
    mockUsePathname.mockReturnValue("/planner/canvas");
    render(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Planner" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks Planner as current on live /ooplanner paths", () => {
    mockUsePathname.mockReturnValue("/ooplanner/projects/demo");
    render(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Planner" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
