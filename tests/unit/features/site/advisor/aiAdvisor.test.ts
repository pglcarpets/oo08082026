import { describe, expect, it } from "vitest";
import {
  buildConfiguratorContextSummary,
  hasUnsupportedCurrency,
  sanitizeAdvisorPriceText,
  type ConfiguratorAdvisorContext,
} from "@/features/site/advisor/aiAdvisor";

describe("hasUnsupportedCurrency", () => {
  it("detects dollar signs and USD wording", () => {
    expect(hasUnsupportedCurrency("$1,200")).toBe(true);
    expect(hasUnsupportedCurrency("USD 500")).toBe(true);
    expect(hasUnsupportedCurrency("about 2 dollars each")).toBe(true);
    expect(hasUnsupportedCurrency("DOLLAR pricing")).toBe(true);
  });

  it("allows INR-style pricing text", () => {
    expect(hasUnsupportedCurrency("₹2.5L – ₹4L")).toBe(false);
    expect(hasUnsupportedCurrency("Rs 1,20,000")).toBe(false);
    expect(hasUnsupportedCurrency("On request")).toBe(false);
  });
});

describe("sanitizeAdvisorPriceText", () => {
  it("returns fallback for empty or unsupported values", () => {
    expect(sanitizeAdvisorPriceText(undefined)).toBe("On request");
    expect(sanitizeAdvisorPriceText("   ")).toBe("On request");
    expect(sanitizeAdvisorPriceText("$999")).toBe("On request");
    expect(sanitizeAdvisorPriceText("USD 1200", "Contact sales")).toBe("Contact sales");
  });

  it("returns trimmed supported pricing text unchanged", () => {
    expect(sanitizeAdvisorPriceText("  ₹3.2L – ₹5.8L  ")).toBe("₹3.2L – ₹5.8L");
    expect(sanitizeAdvisorPriceText("Rs 85,000 per seat")).toBe("Rs 85,000 per seat");
  });
});

describe("buildConfiguratorContextSummary", () => {
  it("returns an empty string when context is missing or not global", () => {
    expect(buildConfiguratorContextSummary(undefined)).toBe("");
    expect(
      buildConfiguratorContextSummary({
        source: "global",
      } as ConfiguratorAdvisorContext),
    ).toContain("Advisor context:");
    expect(
      buildConfiguratorContextSummary({
        source: "planner" as "global",
      }),
    ).toBe("");
  });

  it("summarizes populated global configurator context fields", () => {
    const summary = buildConfiguratorContextSummary({
      source: "global",
      mode: "technical-planner",
      sourcePath: "/workstations/configurator",
      projectType: "workstations",
      seatOrUnitCount: 48,
      moduleCount: 6,
      modulesPerRow: 3,
      workstationSeries: "Titan",
      layoutLabel: "6x8 cluster",
      storageLayout: "wall-run",
      roomWidthMm: 12000,
      roomLengthMm: 8000,
      roomClearanceMm: 900,
      fitStatus: "fits with minor adjustments",
      budgetBand: "mid",
      siteLocation: "Patna",
      estimatedBudget: "₹42L – ₹58L",
      keyOptions: ["mesh back", "cable tray"],
    });

    expect(summary).toContain("Advisor context:");
    expect(summary).toContain("Mode: technical-planner");
    expect(summary).toContain("Project type: workstations");
    expect(summary).toContain("Seats or units: 48");
    expect(summary).toContain("Series: Titan");
    expect(summary).toContain("Layout: 6x8 cluster");
    expect(summary).toContain("Storage layout: wall-run");
    expect(summary).toContain("Module count: 6");
    expect(summary).toContain("Modules per row: 3");
    expect(summary).toContain("Room size: 12000 x 8000 mm");
    expect(summary).toContain("Clearance: 900 mm");
    expect(summary).toContain("Fit status: fits with minor adjustments");
    expect(summary).toContain("Budget band: mid");
    expect(summary).toContain("Site location: Patna");
    expect(summary).toContain("Indicative budget: ₹42L – ₹58L");
    expect(summary).toContain("Selected options: mesh back, cable tray");
  });

  it("omits optional fields that are not provided", () => {
    const summary = buildConfiguratorContextSummary({
      source: "global",
      projectType: "storages",
    });
    expect(summary).toBe("Advisor context:\nProject type: storages");
  });
});