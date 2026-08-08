import { describe, it, expect } from "vitest";
import {
  PLANNER_THEME_PACKS,
  countTokensByCategory,
  getDefaultPlannerThemePack,
  getPlannerThemePackByName,
  tokensForCategory,
} from "@/lib/theme/plannerThemePacks";

describe("lib/theme/plannerThemePacks", () => {
  it("ships premium-light as the default starter pack", () => {
    const def = getDefaultPlannerThemePack();
    expect(def.name).toBe("premium-light");
    expect(def.is_active).toBe(true);
    expect(Object.keys(def.tokens).length).toBeGreaterThan(20);
  });

  it("finds packs by name", () => {
    expect(getPlannerThemePackByName("executive-dark")?.id).toBe(
      "starter-executive-dark",
    );
    expect(getPlannerThemePackByName("missing")).toBeUndefined();
  });

  it("filters tokens by material category", () => {
    const pack = getDefaultPlannerThemePack();
    const woods = tokensForCategory(pack.tokens, "woods");
    const metals = tokensForCategory(pack.tokens, "metals");
    const fabrics = tokensForCategory(pack.tokens, "fabrics");
    const lighting = tokensForCategory(pack.tokens, "lighting");

    expect(woods.every((r) => r.key.includes("wood") || r.key.includes("ws-surface") || r.key.includes("ws-edge"))).toBe(true);
    expect(metals.length).toBeGreaterThan(0);
    expect(fabrics.length).toBeGreaterThan(0);
    expect(lighting.length).toBeGreaterThan(0);

    const counts = countTokensByCategory(pack.tokens);
    expect(counts.woods).toBe(woods.length);
    expect(counts.metals).toBe(metals.length);
  });

  it("keeps only planner material keys (no site chrome fonts/radius)", () => {
    for (const pack of PLANNER_THEME_PACKS) {
      for (const key of Object.keys(pack.tokens)) {
        expect(key.startsWith("block-")).toBe(true);
        expect(key.includes("font")).toBe(false);
        expect(key).not.toBe("block-radius");
      }
    }
  });
});
