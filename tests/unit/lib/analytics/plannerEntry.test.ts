import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildGuestPlannerDraftRedirectHref,
  buildGuestPlannerEntryHref,
  buildPlannerEntryCampaign,
  buildPlannerEntryHref,
  buildProductAwareGuestPlannerHref,
  formatSiteProductContinuityMessage,
  GUEST_PLANNER_CHOOSER_HREF,
  GUEST_PLANNER_WORKSPACE_HREF,
  humanizeSiteProductSlug,
  isBarePlannerLandingHref,
  isPlannerEntryHref,
  pickPlannerEntrySearchParams,
  readPlannerEntrySiteProduct,
} from "@/lib/analytics/plannerEntry";

describe("plannerEntry", () => {
  beforeEach(() => {
    document.cookie = "oando_seo_source=google; path=/";
    document.cookie = "oando_seo_medium=cpc; path=/";
    document.cookie = "oando_seo_campaign=spring; path=/";
  });

  afterEach(() => {
    document.cookie = "oando_seo_source=; Max-Age=0; path=/";
    document.cookie = "oando_seo_medium=; Max-Age=0; path=/";
    document.cookie = "oando_seo_campaign=; Max-Age=0; path=/";
  });

  it("detects planner workspace entry hrefs", () => {
    expect(isPlannerEntryHref("/planner")).toBe(false);
    expect(isPlannerEntryHref("/planner/guest")).toBe(true);
    expect(isPlannerEntryHref("/planner/canvas")).toBe(true);
    expect(isPlannerEntryHref(GUEST_PLANNER_WORKSPACE_HREF)).toBe(true);
    expect(isPlannerEntryHref("/ooplanner/projects")).toBe(true);
    expect(isPlannerEntryHref("/planner/help")).toBe(false);
    expect(isPlannerEntryHref("/planner/features/measure")).toBe(false);
    expect(isPlannerEntryHref("/products")).toBe(false);
    expect(isPlannerEntryHref(GUEST_PLANNER_CHOOSER_HREF)).toBe(false);
  });

  it("detects bare /planner marketing landing", () => {
    expect(isBarePlannerLandingHref("/planner")).toBe(true);
    expect(isBarePlannerLandingHref("/planner/")).toBe(true);
    expect(isBarePlannerLandingHref("/planner?x=1")).toBe(true);
    expect(isBarePlannerLandingHref(GUEST_PLANNER_WORKSPACE_HREF)).toBe(false);
    expect(isBarePlannerLandingHref("/planner/canvas")).toBe(false);
  });

  it("builds campaign strings with product, category, surface, and utm", () => {
    const campaign = buildPlannerEntryCampaign({
      sourcePage: "/products/seating/chair",
      surface: "pdp",
      productSlug: "chair",
      categoryId: "seating",
    });
    expect(campaign).toContain("product:chair");
    expect(campaign).toContain("category:seating");
    expect(campaign).toContain("surface:pdp");
    expect(campaign).toContain("utm:spring");
  });

  it("carries site product identity without cookie utm in default href (SSR-safe)", () => {
    const href = buildPlannerEntryHref(GUEST_PLANNER_WORKSPACE_HREF, {
      sourcePage: "/products/seating/chair",
      productSlug: "chair",
      categoryId: "seating",
    });
    expect(href).toContain("siteProduct=chair");
    expect(href).toContain("siteCategory=seating");
    expect(href).toContain("siteSource=%2Fproducts%2Fseating%2Fchair");
    expect(href).not.toContain("utm_source=");
    expect(href).not.toContain("utm_medium=");
  });

  it("product-aware helper deep-links guest with continuity (not chooser)", () => {
    const href = buildProductAwareGuestPlannerHref({
      sourcePage: "/products/seating/super-chair",
      productSlug: "super-chair",
      categoryId: "seating",
    });
    expect(href.startsWith(`${GUEST_PLANNER_WORKSPACE_HREF}?`)).toBe(true);
    expect(href).toContain("siteProduct=super-chair");
    expect(href).toContain("siteCategory=seating");
    expect(href).toContain("siteSource=%2Fproducts%2Fseating%2Fsuper-chair");
    expect(href).not.toContain("choose-product");
    expect(href).not.toMatch(/^\/planner\?/);
    expect(href).not.toMatch(/^\/planner\/\?/);
  });

  it("upgrades bare /planner to guest when productSlug is present", () => {
    const href = buildPlannerEntryHref("/planner", {
      sourcePage: "/products/seating/chair",
      productSlug: "chair",
      categoryId: "seating",
    });
    expect(href.startsWith(`${GUEST_PLANNER_WORKSPACE_HREF}?`)).toBe(true);
    expect(href).toContain("siteProduct=chair");
    expect(href).not.toMatch(/^\/planner\?/);
  });

  it("keeps bare /planner when no product context (marketing overview)", () => {
    const href = buildPlannerEntryHref("/planner", {
      sourcePage: "/",
    });
    expect(href.startsWith("/planner")).toBe(true);
    expect(href).not.toContain("/planner/guest");
    expect(href).toContain("siteSource=%2F");
  });

  it("adds cookie utm params only when includeAttribution is set", () => {
    const href = buildPlannerEntryHref(
      GUEST_PLANNER_WORKSPACE_HREF,
      { sourcePage: "/", productSlug: "chair", categoryId: "seating" },
      { includeAttribution: true },
    );
    expect(href).toContain("utm_source=google");
    expect(href).toContain("utm_medium=cpc");
    expect(href).toContain("utm_campaign=spring");
  });

  it("picks only Site continuity query keys and ignores empty/arrays", () => {
    const picked = pickPlannerEntrySearchParams({
      siteProduct: "chair",
      siteCategory: ["seating", "desks"],
      siteSource: "/products/seating/chair",
      utm_source: "google",
      utm_medium: "  ",
      utm_campaign: "",
      id: "should-not-copy",
      resume: "1",
    });
    expect(picked.get("siteProduct")).toBe("chair");
    expect(picked.get("siteCategory")).toBeNull();
    expect(picked.get("siteSource")).toBe("/products/seating/chair");
    expect(picked.get("utm_source")).toBe("google");
    expect(picked.get("utm_medium")).toBeNull();
    expect(picked.get("utm_campaign")).toBeNull();
    expect(picked.get("id")).toBeNull();
    expect(picked.get("resume")).toBeNull();
  });

  it("preserves Site params when minting a guest draft id redirect", () => {
    const href = buildGuestPlannerDraftRedirectHref("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", {
      siteProduct: "chair",
      siteCategory: "seating",
      siteSource: "/products/seating/chair",
      utm_campaign: "spring",
      id: "ignored-old",
    });
    expect(href.startsWith("/ooplanner/?")).toBe(true);
    const url = new URL(href, "https://oneonly.in");
    expect(url.searchParams.get("id")).toBe("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    expect(url.searchParams.get("siteProduct")).toBe("chair");
    expect(url.searchParams.get("siteCategory")).toBe("seating");
    expect(url.searchParams.get("siteSource")).toBe("/products/seating/chair");
    expect(url.searchParams.get("utm_campaign")).toBe("spring");
  });

  it("builds guest bounce from canvas via chooser step with continuity params", () => {
    expect(buildGuestPlannerEntryHref({})).toBe("/choose-product/?mode=guest");
    const withParams = buildGuestPlannerEntryHref({
      siteProduct: "desk",
      siteSource: "/choose-product",
    });
    expect(withParams).toContain("/choose-product/?");
    expect(withParams).toContain("mode=guest");
    expect(withParams).toContain("siteProduct=desk");
    expect(withParams).toContain("siteSource=%2Fchoose-product");
  });

  it("reads siteProduct for guest continuity banner", () => {
    expect(readPlannerEntrySiteProduct({ siteProduct: "super-chair" })).toBe(
      "super-chair",
    );
    expect(readPlannerEntrySiteProduct({ siteProduct: "  " })).toBeUndefined();
    expect(readPlannerEntrySiteProduct({ siteProduct: ["a", "b"] })).toBeUndefined();
    expect(readPlannerEntrySiteProduct({})).toBeUndefined();
  });

  it("humanizes siteProduct slug and formats Designing with message", () => {
    expect(humanizeSiteProductSlug("super-chair-001")).toBe("Super Chair");
    expect(humanizeSiteProductSlug("fluid-x")).toBe("Fluid X");
    expect(formatSiteProductContinuityMessage("super-chair")).toBe(
      "Designing with Super Chair",
    );
  });
});