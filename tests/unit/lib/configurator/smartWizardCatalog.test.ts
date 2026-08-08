/**
 * Name-mirror coverage for lib/configurator/smartWizardCatalog.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_ELEMENT_LIBRARY,
  ELEMENT_LIBRARY_DESCRIPTIONS,
  getElementLibraryCatalog,
  getElementLibraryDescriptions,
} from "@/lib/configurator/smartWizardCatalog";

describe("smartWizardCatalog", () => {
  it("returns the default catalog through the getter seam", () => {
    expect(getElementLibraryCatalog()).toBe(DEFAULT_ELEMENT_LIBRARY);
    expect(DEFAULT_ELEMENT_LIBRARY.length).toBeGreaterThan(10);
  });

  it("includes shaped desk variants and room elements", () => {
    const keys = getElementLibraryCatalog().map((item) =>
      item.shape ? `${item.type}/${item.shape}` : item.type,
    );
    expect(keys).toContain("desk");
    expect(keys).toContain("desk/l-shape");
    expect(keys).toContain("conference-room");
    expect(keys).toContain("workstation");
  });

  it("preserves first-seen category ordering for sidebar sections", () => {
    const categories = getElementLibraryCatalog().map((item) => item.category);
    expect(categories.indexOf("Tables")).toBeLessThan(
      categories.indexOf("Desks"),
    );
    expect(categories.indexOf("Desks")).toBeLessThan(
      categories.indexOf("Rooms"),
    );
  });

  it("returns descriptions through the getter seam", () => {
    expect(getElementLibraryDescriptions()).toBe(ELEMENT_LIBRARY_DESCRIPTIONS);
    expect(ELEMENT_LIBRARY_DESCRIPTIONS.workstation).toMatch(/bench/i);
    expect(ELEMENT_LIBRARY_DESCRIPTIONS["desk/l-shape"]).toMatch(/L-shaped/i);
  });
});
