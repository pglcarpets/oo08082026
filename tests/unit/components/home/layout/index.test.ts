/**
 * Name-mirror: components/home/layout/index.ts
 */
import { describe, expect, it } from "vitest";

import * as layout from "@/components/home/layout";
import { HomeCatalogLayout } from "@/components/home/layout/HomeCatalogLayout";
import { HomeMarketingLayout } from "@/components/home/layout/HomeMarketingLayout";
import { HomeSection } from "@/components/home/layout/HomeSection";
import { HomeSectionInner } from "@/components/home/layout/HomeSectionInner";
import { SiteWorkspaceShell } from "@/components/home/layout/SiteWorkspaceShell";

describe("home/layout barrel exports", () => {
  it("re-exports layout components from the package index", () => {
    expect(layout.HomeMarketingLayout).toBe(HomeMarketingLayout);
    expect(layout.HomeCatalogLayout).toBe(HomeCatalogLayout);
    expect(layout.HomeSection).toBe(HomeSection);
    expect(layout.HomeSectionInner).toBe(HomeSectionInner);
    expect(layout.SiteWorkspaceShell).toBe(SiteWorkspaceShell);
  });

  it("exposes only the public layout component symbols", () => {
    const keys = Object.keys(layout).sort();
    expect(keys).toEqual(
      [
        "HomeCatalogLayout",
        "HomeMarketingLayout",
        "HomeSection",
        "HomeSectionInner",
        "SiteWorkspaceShell",
      ].sort(),
    );
  });
});
