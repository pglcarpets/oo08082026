/**
 * Name-mirror coverage for lib/configurator/smartWizard.impl.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_ELEMENT_LIBRARY,
  type LibraryItem,
} from "@/lib/configurator/smartWizardCatalog";
import {
  SMART_WIZARD_ROOM_TYPES,
  SMART_WIZARD_STYLE_PRESETS,
  buildFallbackWizardPlan,
  buildWizardSystemPrompt,
  clampPlacementToBounds,
  computeWizardPalette,
  findWizardCatalogItem,
  getWizardCatalog,
  normalizeWizardProductId,
  parseWizardPlan,
  roomMmToCanvasUnits,
  wizardProductKey,
  type SmartWizardRequest,
} from "@/lib/configurator/smartWizard.impl";

const baseRequest: SmartWizardRequest = {
  templateId: "tpl-office-01",
  roomType: "open-plan",
  roomWidthMm: 6000,
  roomLengthMm: 4000,
  style: "Modern",
};

describe("smartWizard.impl constants", () => {
  it("exports room types and style presets", () => {
    expect(SMART_WIZARD_ROOM_TYPES).toContain("open-plan");
    expect(SMART_WIZARD_ROOM_TYPES).toContain("blank");
    expect(SMART_WIZARD_STYLE_PRESETS).toContain("Modern");
  });
});

describe("roomMmToCanvasUnits and product ids", () => {
  it("converts mm to canvas units and normalizes product ids", () => {
    expect(roomMmToCanvasUnits(6000)).toBe(600);
    expect(roomMmToCanvasUnits(0)).toBe(0);
    expect(normalizeWizardProductId("  Desk/L-Shape  ")).toBe("desk/l-shape");
  });

  it("builds product keys from library items", () => {
    expect(wizardProductKey({ type: "desk", label: "Desk", category: "Desks" })).toBe(
      "desk",
    );
    expect(
      wizardProductKey({
        type: "desk",
        label: "L",
        category: "Desks",
        shape: "l-shape",
      }),
    ).toBe("desk/l-shape");
  });
});

describe("getWizardCatalog and findWizardCatalogItem", () => {
  it("returns default catalog and finds shaped items", () => {
    expect(getWizardCatalog()).toBe(DEFAULT_ELEMENT_LIBRARY);
    expect(findWizardCatalogItem("desk/l-shape")?.label).toBe("L-Shape Desk");
    expect(findWizardCatalogItem("missing")).toBeNull();
  });
});

describe("parseWizardPlan", () => {
  it("parses valid JSON and rejects empty or invalid plans", () => {
    const plan = parseWizardPlan(
      JSON.stringify({
        summary: "Layout",
        warnings: ["ok", "  "],
        placements: [{ productId: "desk", x: 10, y: 20, rotation: 0 }],
      }),
    );
    expect(plan?.summary).toBe("Layout");
    expect(plan?.warnings).toEqual(["ok"]);
    expect(plan?.placements).toHaveLength(1);

    expect(parseWizardPlan("")).toBeNull();
    expect(parseWizardPlan("{bad")).toBeNull();
    expect(
      parseWizardPlan(JSON.stringify({ summary: "", placements: [] })),
    ).toBeNull();
  });

  it("strips markdown code fences around JSON", () => {
    const raw = '```json\n{"summary":"S","warnings":[],"placements":[{"productId":"plant","x":1,"y":2,"rotation":0}]}\n```';
    const plan = parseWizardPlan(raw);
    expect(plan?.summary).toBe("S");
    expect(plan?.placements[0]?.productId).toBe("plant");
  });
});

describe("clampPlacementToBounds and palette", () => {
  it("clamps placements inside room bounds and builds palette colors", () => {
    const item: LibraryItem = {
      type: "desk",
      label: "Desk",
      category: "Desks",
    };
    const clamped = clampPlacementToBounds(
      { productId: "desk", x: -50, y: 9999, rotation: 12.4 },
      item,
      { width: 200, height: 100 },
    );
    expect(clamped.x).toBeGreaterThan(0);
    expect(clamped.y).toBeLessThanOrEqual(100);
    expect(clamped.rotation).toBe(12);

    const palette = computeWizardPalette([
      { productId: "desk", x: 40, y: 40, rotation: 0 },
      { productId: "plant", x: 10, y: 10, rotation: 0 },
    ]);
    expect(palette.length).toBeGreaterThan(0);
    expect(palette.length).toBeLessThanOrEqual(5);
  });
});

describe("buildFallbackWizardPlan and system prompt", () => {
  it("builds a deterministic fallback with placements", () => {
    const plan = buildFallbackWizardPlan(baseRequest);
    expect(plan.placements.length).toBeGreaterThan(0);
    expect(plan.warnings[0]).toMatch(/fallback/i);
    expect(plan.summary).toMatch(/open-plan|Fallback/i);
  });

  it("builds a system prompt that lists catalog keys and bounds", () => {
    const prompt = buildWizardSystemPrompt(baseRequest, getWizardCatalog());
    expect(prompt).toContain("Oando Smart Wizard");
    expect(prompt).toContain("width=600");
    expect(prompt).toContain("height=400");
    expect(prompt).toContain("workstation");
    expect(prompt).toContain("Required JSON shape");
  });
});
