import { describe, it, expect } from "vitest";
import {
  validateFurnitureMetadata,
  isFurnitureMetadataValid,
} from "@/lib/Studio/validateFurnitureMetadata";

describe("validateFurnitureMetadata", () => {
  it("requires name and category", () => {
    expect(validateFurnitureMetadata({}).length).toBeGreaterThan(0);
    expect(isFurnitureMetadataValid({ name: "Desk", category: "Seating", width_mm: 1200 })).toBe(true);
  });

  it("rejects non-positive dimensions", () => {
    const issues = validateFurnitureMetadata({
      name: "x",
      category: "y",
      width_mm: 0,
    });
    expect(issues.some((i) => i.field === "width_mm")).toBe(true);
  });
});
