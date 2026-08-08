import { describe, expect, it } from "vitest";
import {
  DEFAULT_AI_DIMENSIONS_MM,
  DEFAULT_FURNITURE_DIMS_MM,
} from "@studio/lib/studioTokens";

describe("studioTokens", () => {
  it("exposes furniture defaults for save and 3D preview", () => {
    expect(DEFAULT_FURNITURE_DIMS_MM).toEqual({
      width_mm: 600,
      depth_mm: 600,
      height_mm: 750,
    });
  });

  it("exposes neutral AI dimension fallback", () => {
    expect(DEFAULT_AI_DIMENSIONS_MM).toEqual({
      width_mm: 600,
      depth_mm: 600,
      height_mm: 600,
    });
  });
});
