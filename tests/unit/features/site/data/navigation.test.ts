import { describe, it, expect } from "vitest";
import {
  SITE_NAV_LINKS,
  SITE_CTA_LINKS,
  SITE_NAV_FEATURED_CARDS,
  SITE_NAV_SEARCH_FALLBACK_LINKS,
  normalizeFooterHref,
  buildFooterNav,
  SITE_FOOTER_NAV,
} from "@/features/site/data/navigation";

describe("navigation site-data helper", () => {
  describe("normalizeFooterHref", () => {
    it("should strip trailing slashes", () => {
      expect(normalizeFooterHref("/about/")).toBe("/about");
      expect(normalizeFooterHref("/")).toBe("/");
      expect(normalizeFooterHref("/products/chairs/")).toBe("/products/chairs");
    });
  });

  describe("buildFooterNav", () => {
    it("should remove duplicate links across sections, keeping first", () => {
      const sections = [
        {
          heading: "Sec 1",
          links: [
            { href: "/home", label: "Home" },
            { href: "/about", label: "About" },
          ],
        },
        {
          heading: "Sec 2",
          links: [
            { href: "/about/", label: "About Us" }, // normalized duplicates /about
            { href: "/contact", label: "Contact" },
          ],
        },
      ];

      const nav = buildFooterNav(sections);
      expect(nav).toHaveLength(2);
      expect(nav[0].links).toHaveLength(2);
      expect(nav[1].links).toHaveLength(1); // /about/ is removed
      expect(nav[1].links[0]).toEqual({ href: "/contact", label: "Contact" });
    });

    it("should filter out empty sections", () => {
      const sections = [
        {
          heading: "Sec 1",
          links: [{ href: "/home", label: "Home" }],
        },
        {
          heading: "Sec 2",
          links: [{ href: "/home/", label: "Home Dupe" }],
        },
      ];
      const nav = buildFooterNav(sections);
      expect(nav).toHaveLength(1); // Sec 2 is empty and filtered out
    });
  });

  it("should have correct predefined navigation arrays", () => {
    expect(SITE_NAV_LINKS.length).toBeGreaterThan(0);
    expect(SITE_CTA_LINKS.length).toBeGreaterThan(0);
    expect(SITE_NAV_FEATURED_CARDS.length).toBeGreaterThan(0);
    expect(SITE_NAV_SEARCH_FALLBACK_LINKS.length).toBeGreaterThan(0);
    expect(SITE_FOOTER_NAV.length).toBeGreaterThan(0);
  });

  it("does not expose public Admin destinations in header or footer nav", () => {
    const all = [
      ...SITE_NAV_LINKS,
      ...SITE_CTA_LINKS,
      ...SITE_NAV_SEARCH_FALLBACK_LINKS,
      ...SITE_FOOTER_NAV.flatMap((section) => section.links),
    ];
    for (const link of all) {
      expect(link.href.toLowerCase()).not.toMatch(/^\/admin(\/|$)/);
      expect(link.label.toLowerCase()).not.toBe("admin");
    }
  });
});
