import { describe, expect, it } from "vitest";

import {
  ADMIN_HUB_CARDS,
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_ITEMS,
  resolveAdminNavItem,
} from "@/features/admin/ui/adminNav";

describe("adminNav", () => {
  it("defines ordered groups and critical planner/catalog routes", () => {
    expect(ADMIN_NAV_GROUPS.map((g) => g.title)).toEqual([
      "Overview",
      "Planner",
      "Catalog",
      "CRM",
      "System",
    ]);

    const planner = ADMIN_NAV_GROUPS.find((g) => g.title === "Planner");
    expect(planner?.items.map((i) => i.href)).toEqual([
      "/admin/plans",
      "/admin/features",
      "/admin/analytics",
    ]);

    const catalog = ADMIN_NAV_GROUPS.find((g) => g.title === "Catalog");
    expect(catalog?.items.map((i) => i.href)).toEqual(
      expect.arrayContaining([
        "/admin/catalog",
        "/oostudio",
        "/admin/price-books",
      ]),
    );

    expect(ADMIN_NAV_ITEMS.length).toBeGreaterThan(5);
    expect(ADMIN_HUB_CARDS.length).toBeGreaterThan(0);
    expect(resolveAdminNavItem("/admin")).toMatchObject({ label: "Dashboard" });
    // Legacy admin studio URLs resolve to the forked Furniture Studio surface
    expect(resolveAdminNavItem("/admin/product-studio")).toMatchObject({
      href: "/oostudio",
    });
    expect(resolveAdminNavItem("/admin/svg-editor")).toMatchObject({
      href: "/oostudio",
    });
    expect(resolveAdminNavItem("/admin/product-studio/desk-a")).toMatchObject({
      href: "/oostudio",
    });
  });

  it("keeps every non-studio admin surface from 20072026 nav IA", () => {
    const hrefs = ADMIN_NAV_ITEMS.map((i) => i.href);
    for (const required of [
      "/admin",
      "/admin/plans",
      "/admin/features",
      "/admin/analytics",
      "/admin/catalog",
      "/admin/planner-catalog",
      "/admin/workspace-catalog",
      "/admin/price-books",
      "/admin/crm",
      "/admin/customer-queries",
      "/admin/settings",
      "/admin/themes",
      "/admin/inventory",
      "/admin/design-kit",
      "/oostudio",
    ]) {
      expect(hrefs).toContain(required);
    }
    // Product Studio UI is retired; Furniture Studio is the working replacement
    expect(hrefs).not.toContain("/admin/product-studio");
    expect(hrefs).not.toContain("/admin/product-studio/");
  });

  it("links Architecture docs externally (dev :3001 or prod subdomain)", () => {
    const system = ADMIN_NAV_GROUPS.find((g) => g.title === "System");
    const docs = system?.items.find((i) => i.label === "Architecture docs");
    expect(docs).toBeDefined();
    expect(docs?.external).toBe(true);
    expect(docs?.href).toMatch(/^https?:\/\//);
    // Vitest runs with NODE_ENV=test → dev default localhost:3001
    expect(docs?.href).toBe("http://localhost:3001");
    // External links must never steal active state from admin routes
    expect(resolveAdminNavItem("/admin/settings")).toMatchObject({
      href: "/admin/settings",
    });
  });
});


