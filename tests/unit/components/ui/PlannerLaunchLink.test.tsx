/**
 * Name-mirror: components/ui/PlannerLaunchLink
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PlannerLaunchLink } from "@/components/ui/PlannerLaunchLink";
import { handlePlannerEntryNavigation } from "@/lib/analytics/siteEvents";

vi.mock("next/navigation", () => ({
  usePathname: () => "/products/seating/super-chair",
}));

vi.mock("@/lib/analytics/siteEvents", () => ({
  handlePlannerEntryNavigation: vi.fn(),
}));

describe("PlannerLaunchLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = "oando_seo_source=; Max-Age=0; path=/";
    document.cookie = "oando_seo_medium=; Max-Age=0; path=/";
    document.cookie = "oando_seo_campaign=; Max-Age=0; path=/";
  });

  it("SSR-safe href carries siteProduct/siteCategory/siteSource without cookie utm", () => {
    document.cookie = "oando_seo_source=google; path=/";
    document.cookie = "oando_seo_medium=cpc; path=/";
    document.cookie = "oando_seo_campaign=spring; path=/";

    render(
      <PlannerLaunchLink
        href="/ooplanner"
        surface="pdp"
        label="Design in Planner"
        productSlug="super-chair"
        categoryId="seating"
        data-testid="pdp-planner-launch"
      >
        Design in Planner
      </PlannerLaunchLink>,
    );

    const link = screen.getByTestId("pdp-planner-launch");
    const href = link.getAttribute("href") ?? "";
    expect(href.startsWith("/ooplanner")).toBe(true);
    expect(href).toContain("siteProduct=super-chair");
    expect(href).toContain("siteCategory=seating");
    expect(href).toContain("siteSource=%2Fproducts%2Fseating%2Fsuper-chair");
    expect(href).not.toContain("utm_source=");
    expect(href).not.toContain("utm_medium=");
  });

  it("upgrades bare /planner to guest when productSlug is set", () => {
    render(
      <PlannerLaunchLink
        href="/planner"
        surface="pdp"
        label="Design in Planner"
        productSlug="super-chair"
        categoryId="seating"
        data-testid="pdp-planner-launch"
      >
        Design in Planner
      </PlannerLaunchLink>,
    );

    const href = screen.getByTestId("pdp-planner-launch").getAttribute("href") ?? "";
    expect(href.startsWith("/ooplanner")).toBe(true);
    expect(href).toContain("siteProduct=super-chair");
    expect(href).toContain("siteCategory=seating");
  });

  it("click path tracks with attribution on the navigation href", () => {
    document.cookie = "oando_seo_source=google; path=/";
    document.cookie = "oando_seo_medium=cpc; path=/";
    document.cookie = "oando_seo_campaign=spring; path=/";

    render(
      <PlannerLaunchLink
        href="/ooplanner"
        surface="pdp"
        label="Design in Planner"
        productSlug="super-chair"
        categoryId="seating"
        data-testid="pdp-planner-launch"
      >
        Design in Planner
      </PlannerLaunchLink>,
    );

    fireEvent.click(screen.getByTestId("pdp-planner-launch"));

    expect(handlePlannerEntryNavigation).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Design in Planner",
        pathname: "/products/seating/super-chair",
        surface: "pdp",
        productSlug: "super-chair",
        categoryId: "seating",
        href: expect.stringContaining("utm_source=google"),
      }),
    );
  });

  it("passes non-planner href through without site params or tracking", () => {
    render(
      <PlannerLaunchLink
        href="/planner/help"
        surface="nav"
        label="Help"
        data-testid="help-link"
      >
        Help
      </PlannerLaunchLink>,
    );

    const link = screen.getByTestId("help-link");
    expect(link).toHaveAttribute("href", "/planner/help");
    fireEvent.click(link);
    expect(handlePlannerEntryNavigation).not.toHaveBeenCalled();
  });
});
