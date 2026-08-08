/**
 * Name-mirror: features/site/data/heroCarousel
 */

import { describe, expect, it } from "vitest";
import { HERO_CAROUSEL_SLIDES } from "@/features/site/data/heroCarousel";

describe("HERO_CAROUSEL_SLIDES", () => {
  it("includes Titan and TVS Patna slides with primary and secondary CTAs", () => {
    expect(HERO_CAROUSEL_SLIDES).toHaveLength(2);
    expect(HERO_CAROUSEL_SLIDES[0].location).toContain("Titan");
    expect(HERO_CAROUSEL_SLIDES[1].location).toContain("TVS");

    for (const slide of HERO_CAROUSEL_SLIDES) {
      expect(slide.src).toMatch(/^\//);
      expect(slide.headline.trim().length).toBeGreaterThan(0);
      expect(slide.sub.trim().length).toBeGreaterThan(0);
      expect(slide.ctas).toHaveLength(2);
      expect(slide.ctas[0].variant).toBe("primary");
      expect(slide.ctas[1].variant).toBe("secondary");
      expect(slide.ctas[0].href).toBe("/products");
      expect(slide.ctas[1].href).toBe("/contact");
    }
  });
});
