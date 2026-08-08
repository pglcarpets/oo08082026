import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const usePathname = vi.fn(() => "/admin/crm");

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-current"?: "page";
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { CrmSubnav } from "@/features/crm/CrmSubnav";
import {
  CRM_ADMIN_BASE,
  CRM_CLIENTS_PATH,
  CRM_PROJECTS_PATH,
  CRM_QUOTES_PATH,
} from "@/features/crm/crmRoutes";

describe("CrmSubnav (name-mirror)", () => {
  it("renders CRM section links with hub active on exact base path", () => {
    usePathname.mockReturnValue(CRM_ADMIN_BASE);
    render(<CrmSubnav />);
    const nav = screen.getByRole("navigation", { name: /crm sections/i });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hub" })).toHaveAttribute(
      "href",
      CRM_ADMIN_BASE,
    );
    expect(screen.getByRole("link", { name: "Clients" })).toHaveAttribute(
      "href",
      CRM_CLIENTS_PATH,
    );
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      CRM_PROJECTS_PATH,
    );
    expect(screen.getByRole("link", { name: "Quotes" })).toHaveAttribute(
      "href",
      CRM_QUOTES_PATH,
    );
    expect(screen.getByRole("link", { name: "Queries" })).toHaveAttribute(
      "href",
      "/admin/customer-queries",
    );
    expect(screen.getByRole("link", { name: "Hub" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Clients" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks prefix matches active for nested CRM routes", () => {
    usePathname.mockReturnValue(`${CRM_CLIENTS_PATH}/acme`);
    render(<CrmSubnav />);
    expect(screen.getByRole("link", { name: "Clients" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Hub" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
