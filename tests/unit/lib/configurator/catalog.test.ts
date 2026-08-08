import { describe, expect, it } from "vitest";
import {
  DEFAULT_ELEMENT_LIBRARY,
  ELEMENT_LIBRARY_DESCRIPTIONS,
  getElementLibraryCatalog,
  getElementLibraryDescriptions,
} from "@/lib/configurator/smartWizardCatalog";

describe("element library catalog", () => {
  it("returns the default catalog through the getter seam", () => {
    expect(getElementLibraryCatalog()).toBe(DEFAULT_ELEMENT_LIBRARY);
  });

  it("includes shaped desk variants and room elements", () => {
    const catalog = getElementLibraryCatalog();
    const keys = catalog.map((item) =>
      item.shape ? `${item.type}/${item.shape}` : item.type,
    );

    expect(keys).toContain("desk");
    expect(keys).toContain("desk/l-shape");
    expect(keys).toContain("conference-room");
    expect(keys).toContain("workstation");
  });

  it("preserves first-seen category ordering for sidebar sections", () => {
    const categories = getElementLibraryCatalog().map((item) => item.category);
    expect(categories.indexOf("Tables")).toBeLessThan(categories.indexOf("Desks"));
    expect(categories.indexOf("Desks")).toBeLessThan(categories.indexOf("Rooms"));
  });
});

describe("element library descriptions", () => {
  it("returns the description map through the getter seam", () => {
    expect(getElementLibraryDescriptions()).toBe(ELEMENT_LIBRARY_DESCRIPTIONS);
  });

  it("describes common catalog keys used by the smart wizard", () => {
    const descriptions = getElementLibraryDescriptions();
    expect(descriptions.workstation).toMatch(/bench/i);
    expect(descriptions["desk/l-shape"]).toMatch(/L-shaped desk/i);
    expect(descriptions["conference-room"]).toMatch(/meeting room/i);
    expect(descriptions.plant).toMatch(/plant/i);
  });
});