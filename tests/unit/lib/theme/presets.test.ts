import { describe, it, expect } from "vitest";
import { THEME_PRESETS, getPresetById, getDefaultPreset } from "@/lib/theme/presets";

describe("presets theme registry", () => {
  it("should contain default premium-light theme", () => {
    expect(THEME_PRESETS.length).toBeGreaterThan(0);
    const first = THEME_PRESETS[0];
    expect(first.id).toBe("premium-light");
    expect(first.tokens).toBeDefined();
  });

  describe("getPresetById", () => {
    it("should return the matching preset if found", () => {
      const p = getPresetById("executive-dark");
      expect(p).toBeDefined();
      expect(p?.name).toBe("Executive Dark");
    });

    it("should return undefined if preset ID does not exist", () => {
      const p = getPresetById("non-existent");
      expect(p).toBeUndefined();
    });
  });

  describe("getDefaultPreset", () => {
    it("should return the first preset in registry", () => {
      const p = getDefaultPreset();
      expect(p).toEqual(THEME_PRESETS[0]);
    });
  });
});
