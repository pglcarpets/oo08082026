import { describe, expect, it } from "vitest";
import {
  HOMEPAGE_HERO_CONTENT,
  HOMEPAGE_HERO_IMAGES,
  HOMEPAGE_COLLECTIONS_CONTENT,
  HOMEPAGE_PLANNER_SUITE_CONTENT,
  HOMEPAGE_SHOWCASE_CONTENT,
  HOMEPAGE_PARTNERSHIP_CONTENT,
  HOMEPAGE_CONTACT_CONTENT,
  HOMEPAGE_WHY_CHOOSE_US_CONTENT,
  joinAccessibleTitleLines,
  resolveHeroTitleLines,
} from "@/features/site/data/homepage";

describe("homepage data", () => {
  it("hero primary CTA is planner marketing landing; products secondary", () => {
    expect(HOMEPAGE_HERO_CONTENT.primaryCta.href).toBe("/planner");
    expect(HOMEPAGE_HERO_CONTENT.primaryCta.label).toMatch(/layout/i);
    expect(HOMEPAGE_HERO_CONTENT.secondaryCta.href).toBe("/products");
  });

  it("planner suite launch CTA is planner marketing landing", () => {
    expect(HOMEPAGE_PLANNER_SUITE_CONTENT.launchHref).toBe("/planner");
    expect(HOMEPAGE_PLANNER_SUITE_CONTENT.overviewHref).toBe("/planner");
    expect(HOMEPAGE_PLANNER_SUITE_CONTENT.launchLabel).toMatch(/launch planner/i);
  });

  it("hero glass proof links to trusted-by with badge and narrative copy", () => {
    expect(HOMEPAGE_HERO_CONTENT.glassProof.href).toBe("/trusted-by");
    expect(HOMEPAGE_HERO_CONTENT.glassProof.badge).toBe("Trusted by");
    expect(HOMEPAGE_HERO_CONTENT.glassProof.lead).toContain("120+");
    expect(HOMEPAGE_HERO_CONTENT.glassProof.support).toMatch(/BOQ|planner|India/i);
    expect(HOMEPAGE_HERO_CONTENT.glassProof.cta).toBe("View clients");
  });

  it("hero uses brand headline and pan-india kicker without subtitle", () => {
    expect(joinAccessibleTitleLines(HOMEPAGE_HERO_CONTENT.title)).toMatch(/harder/i);
    expect(HOMEPAGE_HERO_CONTENT.kicker).toMatch(/India/i);
    expect(HOMEPAGE_HERO_CONTENT.secondaryCta.label).toBe("Browse products");
    expect("description" in HOMEPAGE_HERO_CONTENT).toBe(false);
  });

  it("joinAccessibleTitleLines preserves spaces between animated lines (SF-01)", () => {
    const joined = joinAccessibleTitleLines(HOMEPAGE_HERO_CONTENT.title);
    expect(joined).toBe("Spaces that work harder");
    expect(joined).not.toMatch(/workas|asyour|workharder/);
    expect(joined).not.toBe(HOMEPAGE_HERO_CONTENT.title.join(""));
    expect(joinAccessibleTitleLines(["  Spaces that work  ", "", " harder "])).toBe(
      "Spaces that work harder",
    );
  });

  it("resolveHeroTitleLines accepts string arrays and falls back otherwise", () => {
    expect(resolveHeroTitleLines(["A", "B"])).toEqual(["A", "B"]);
    expect(resolveHeroTitleLines(null)).toEqual([...HOMEPAGE_HERO_CONTENT.title]);
    expect(resolveHeroTitleLines("not-an-array")).toEqual([...HOMEPAGE_HERO_CONTENT.title]);
    expect(resolveHeroTitleLines([])).toEqual([...HOMEPAGE_HERO_CONTENT.title]);
    expect(resolveHeroTitleLines([1, 2] as unknown as string[])).toEqual([
      ...HOMEPAGE_HERO_CONTENT.title,
    ]);
  });

  it("hero carousel excludes titan-patna-hero slide", () => {
    expect(HOMEPAGE_HERO_IMAGES.some((img) => img.src.includes("titan-patna-hero"))).toBe(
      false,
    );
    expect(HOMEPAGE_HERO_IMAGES.length).toBeGreaterThanOrEqual(5);
  });

  it("why choose us keeps the workspace systems headline", () => {
    expect(HOMEPAGE_WHY_CHOOSE_US_CONTENT.titleLead).toBe("We engineer");
    expect(HOMEPAGE_WHY_CHOOSE_US_CONTENT.titleAccent).toBe("workspaces");
  });

  it("collections shows six featured categories", () => {
    expect(HOMEPAGE_COLLECTIONS_CONTENT.items).toHaveLength(6);
    expect(HOMEPAGE_COLLECTIONS_CONTENT.catalogCta.href).toBe("/products");
    expect(HOMEPAGE_COLLECTIONS_CONTENT.catalogCta.label).toBe("Full catalog");
  });

  it("showcase carousel uses three client stories and clients CTA", () => {
    expect(HOMEPAGE_SHOWCASE_CONTENT.items).toHaveLength(3);
    expect(HOMEPAGE_SHOWCASE_CONTENT.items.map((item) => item.id)).toEqual([
      "dmrc",
      "titan",
      "tvs",
    ]);
    expect(HOMEPAGE_SHOWCASE_CONTENT.sectionTitleLead).toBe("Recent");
    expect(HOMEPAGE_SHOWCASE_CONTENT.sectionTitleAccent).toBe("installs");
    expect(HOMEPAGE_SHOWCASE_CONTENT.browseCta).toEqual({
      label: "View clients",
      href: "/clients",
    });
  });

  it("partnership content is One&Only only (no third-party partner brand)", () => {
    expect(HOMEPAGE_PARTNERSHIP_CONTENT.title).toEqual([
      "One&Only",
      "Office Furniture",
    ]);
    expect(HOMEPAGE_PARTNERSHIP_CONTENT.image.src).toBe("/logo.webp");
    expect(HOMEPAGE_PARTNERSHIP_CONTENT.image.alt).toMatch(/One&Only/i);
    const forbiddenPartner = String.fromCharCode(65, 70, 67); // historical third-party mark
    expect(HOMEPAGE_PARTNERSHIP_CONTENT.image.alt).not.toContain(forbiddenPartner);
    expect(JSON.stringify(HOMEPAGE_PARTNERSHIP_CONTENT)).not.toContain(forbiddenPartner);
  });

  it("contact teaser leads with brief headline and direct actions", () => {
    expect(HOMEPAGE_CONTACT_CONTENT.titleLead).toBe("Share a");
    expect(HOMEPAGE_CONTACT_CONTENT.titleAccent).toBe("brief");
    expect(HOMEPAGE_CONTACT_CONTENT.directActions).toHaveLength(2);
    expect(HOMEPAGE_CONTACT_CONTENT.directActions.map((a) => a.type)).toEqual([
      "whatsapp",
      "phone",
    ]);
    expect(HOMEPAGE_CONTACT_CONTENT.directActions[0].label).toBe("WhatsApp now");
    expect(HOMEPAGE_CONTACT_CONTENT.directActions[1].label).toBe("Call team");
  });
});