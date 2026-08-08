import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pathname } = vi.hoisted(() => ({
  pathname: { current: "/dashboard" as string | null },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

import { GlobalNavHeader } from "@/features/shared/shell/GlobalNavHeader";

describe("GlobalNavHeader", () => {
  beforeEach(() => {
    pathname.current = "/dashboard";
  });

  it("marks the dashboard link active on the dashboard route", () => {
    render(<GlobalNavHeader />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Portal" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks portal and planner links active on their routes", () => {
    pathname.current = "/portal";
    const { rerender } = render(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Portal" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    pathname.current = "/planner/canvas";
    rerender(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Planner" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("does not surface admin or CRM links", () => {
    render(<GlobalNavHeader />);

    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Clients" })).not.toBeInTheDocument();
  });

  it("marks choose-product active and treats legacy dashboard paths as dashboard", () => {
    pathname.current = "/choose-product";
    const { rerender } = render(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Choose Product" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    pathname.current = "/oando-planner/dashboard";
    rerender(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks planner active on /ooplanner routes", () => {
    pathname.current = "/ooplanner/projects/demo";
    render(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Planner" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
