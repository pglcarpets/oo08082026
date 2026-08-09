import { describe, expect, it } from "vitest";
import { SITE_BRAND } from "@/features/site/data/brand";
import {
  BUSINESS_STATS_FETCH_TIMEOUT_MS,
  BUSINESS_STATS_REVALIDATE_SECONDS,
  BUSINESS_STATS_SAFE_DEFAULTS,
  CATALOG_REVALIDATE_SECONDS,
} from "@/features/site/data/fallbacks";
import { HERO_CAROUSEL_SLIDES } from "@/features/site/data/heroCarousel";
import { PRODUCT_CATEGORY_SECTION } from "@/features/site/data/marketing";
import { PRODUCT_SUITE, type ProductSuiteKey } from "@/features/site/data/productSuite";
import { TRUSTED_BY_CLIENTS, TRUSTED_BY_STATS } from "@/features/site/data/proof";
import { VISUAL_IVR_TREE } from "@/features/site/data/support";
import {
  SITE_NAV_LINKS,
  SITE_CTA_LINKS,
  SITE_NAV_FEATURED_CARDS,
  SITE_NAV_SEARCH_FALLBACK_LINKS,
  normalizeFooterHref,
  buildFooterNav,
} from "@/features/site/data/navigation";
import { resolveRouteChromeMode } from "@/features/site/data/routeChromeRules";
import { buildPageMetadata, LOCALE_HREFLANG } from "@/features/site/data/seo";

describe("SITE_BRAND", () => {
  it("defines company identity and OG image", () => {
    expect(SITE_BRAND.companyName).toBe("One&Only");
    expect(SITE_BRAND.defaultTitle).toContain("One&Only");
    expect(SITE_BRAND.ogImage).toMatch(/^\//);
    expect(SITE_BRAND.description).toMatch(/India/i);
  });
});

describe("business stats fallbacks", () => {
  it("exports safe defaults with positive counts", () => {
    expect(BUSINESS_STATS_SAFE_DEFAULTS.clientOrganisations).toBeGreaterThan(0);
    expect(BUSINESS_STATS_SAFE_DEFAULTS.projectsDelivered).toBeGreaterThan(0);
    expect(BUSINESS_STATS_SAFE_DEFAULTS.asOfDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("exports revalidate and timeout constants", () => {
    expect(BUSINESS_STATS_FETCH_TIMEOUT_MS).toBeGreaterThan(0);
    expect(BUSINESS_STATS_REVALIDATE_SECONDS).toBe(300);
    expect(CATALOG_REVALIDATE_SECONDS).toBe(300);
  });
});

describe("HERO_CAROUSEL_SLIDES", () => {
  it("includes Titan and TVS Patna slides with CTAs", () => {
    expect(HERO_CAROUSEL_SLIDES).toHaveLength(2);
    for (const slide of HERO_CAROUSEL_SLIDES) {
      expect(slide.ctas).toHaveLength(2);
      expect(slide.headline.trim().length).toBeGreaterThan(0);
      expect(slide.src).toMatch(/^\//);
    }
    expect(HERO_CAROUSEL_SLIDES[0].location).toContain("Titan");
    expect(HERO_CAROUSEL_SLIDES[1].location).toContain("TVS");
  });
});

describe("marketing content", () => {
  it("product category section has table rows and catalog items", () => {
    expect(PRODUCT_CATEGORY_SECTION.tableRows).toHaveLength(4);
    expect(PRODUCT_CATEGORY_SECTION.items.length).toBeGreaterThanOrEqual(6);
    expect(PRODUCT_CATEGORY_SECTION.cta.href).toBe("/products");
  });
});

describe("PRODUCT_SUITE", () => {
  it("defines planner, configurator, admin, and shared routes", () => {
    const keys: ProductSuiteKey[] = ["planner", "configurator", "admin", "shared"];
    for (const key of keys) {
      expect(PRODUCT_SUITE[key].routes).toBeDefined();
    }
    expect(PRODUCT_SUITE.planner.routes.canvas).toBe("/ooplanner");
    expect(PRODUCT_SUITE.shared.routes.login).toBe("/login");
  });
});

describe("proof data", () => {
  it("trusted-by stats show experience and client scale", () => {
    expect(TRUSTED_BY_STATS).toHaveLength(4);
    expect(TRUSTED_BY_STATS.some((s) => /years/i.test(s.label))).toBe(true);
  });

  it("trusted-by clients list has unique names", () => {
    const names = TRUSTED_BY_CLIENTS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    expect(TRUSTED_BY_CLIENTS.length).toBeGreaterThan(20);
  });
});

describe("VISUAL_IVR_TREE", () => {
  it("root menu exposes sales, support, and general branches", () => {
    expect(VISUAL_IVR_TREE.id).toBe("root");
    expect(VISUAL_IVR_TREE.options).toHaveLength(3);
    const ids = VISUAL_IVR_TREE.options!.map((n) => n.id);
    expect(ids).toEqual(["sales", "support", "general"]);
  });

  it("sales branch includes domestic and international contacts", () => {
    const sales = VISUAL_IVR_TREE.options!.find((n) => n.id === "sales");
    expect(sales?.options).toHaveLength(3);
    const domestic = sales?.options?.find((n) => n.id === "sales_de");
    expect(domestic?.action?.type).toBe("contact");
    expect(domestic?.action?.detail).toContain("@");
  });

  it("support branch includes order status info action", () => {
    const support = VISUAL_IVR_TREE.options!.find((n) => n.id === "support");
    const orderStatus = support?.options?.find((n) => n.id === "order_status");
    expect(orderStatus?.action?.type).toBe("info");
    expect(orderStatus?.action?.value).toMatch(/order confirmation/i);
  });

  it("general branch links careers route", () => {
    const general = VISUAL_IVR_TREE.options!.find((n) => n.id === "general");
    const careers = general?.options?.find((n) => n.id === "careers");
    expect(careers?.action?.type).toBe("link");
    expect(careers?.action?.value).toBe("/career");
  });
});
describe("site navigation data", () => {
  it("exports nav links and ctas", () => {
    expect(SITE_NAV_LINKS.length).toBeGreaterThan(5);
    expect(SITE_NAV_LINKS.some((l) => l.label === "Planner")).toBe(true);
    expect(SITE_CTA_LINKS.length).toBe(2);
    expect(SITE_CTA_LINKS[0].variant).toBe("primary");
  });

  it("featured cards have images and hrefs", () => {
    expect(SITE_NAV_FEATURED_CARDS.length).toBeGreaterThan(2);
    for (const card of SITE_NAV_FEATURED_CARDS) {
      expect(card.href).toMatch(/^\//);
      expect(card.image).toMatch(/\.webp$/);
    }
  });

  it("search fallback links include planner entry and help", () => {
    const hrefs = SITE_NAV_SEARCH_FALLBACK_LINKS.map((l) => l.href);
    // Guest chooser is public planner entry; help remains a search surface.
    // /access is intentionally absent (not marketing nav; AccessForm handles auth).
    expect(hrefs.some((h) => h.includes("choose-product") || h.includes("/planner"))).toBe(true);
    expect(hrefs.some((h) => h.includes("/planner/help"))).toBe(true);
    expect(hrefs.some((h) => h.includes("access"))).toBe(false);
  });

  it("normalizes footer hrefs by trimming trailing slash", () => {
    expect(normalizeFooterHref("/products/")).toBe("/products");
    expect(normalizeFooterHref("/contact")).toBe("/contact");
    expect(normalizeFooterHref("/")).toBe("/");
  });

  it("buildFooterNav dedupes links across sections", () => {
    const sections = [
      { heading: "A", links: [{ href: "/p", label: "P" }, { href: "/s", label: "S" }] },
      { heading: "B", links: [{ href: "/p", label: "P2" }, { href: "/x", label: "X" }] },
    ];
    const out = buildFooterNav(sections);
    expect(out).toHaveLength(2);
    expect(out[0].links).toHaveLength(2);
    expect(out[1].links).toHaveLength(1);
    expect(out[1].links[0].label).toBe("X");
  });
});

describe("route chrome rules", () => {
  it("resolves full for marketing routes", () => {
    const m = resolveRouteChromeMode("/products");
    expect(m.header).toBe("full");
    expect(m.footer).toBe("full");
  });

  it("hides chrome for workspace and cad routes", () => {
    expect(resolveRouteChromeMode("/ooplanner").header).toBe("hidden");
    expect(resolveRouteChromeMode("/admin/svg-editor").footer).toBe("hidden");
    expect(resolveRouteChromeMode("/planner/open3d").header).toBe("hidden");
  });

  it("uses login-tools for login paths", () => {
    const m1 = resolveRouteChromeMode("/login");
    expect(m1.header).toBe("hidden");
    expect(m1.footer).toBe("login-tools");
    const m2 = resolveRouteChromeMode("/login?next=/dashboard");
    expect(m2.header).toBe("full");
  });
});

describe("seo helpers", () => {
  it("exports locale hreflang map", () => {
    expect(LOCALE_HREFLANG.en).toBe("en-IN");
  });

  it("builds metadata with title and description", () => {
    const md = buildPageMetadata("https://example.com", { title: "Test", description: "Desc", path: "/t" });
    const titleText =
      typeof md.title === "string"
        ? md.title
        : md.title && typeof md.title === "object" && "absolute" in md.title
          ? String(md.title.absolute)
          : JSON.stringify(md.title);
    expect(titleText).toContain("Test");
    expect(md.description).toBe("Desc");
  });
});
