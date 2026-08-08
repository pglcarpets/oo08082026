import { describe, expect, it } from "vitest";
import {
  DEFAULT_ELEMENT_LIBRARY,
  type LibraryItem,
} from "@/lib/configurator/smartWizardCatalog";
import {
  buildFallbackWizardPlan,
  buildWizardSystemPrompt,
  clampPlacementToBounds,
  computeWizardPalette,
  findWizardCatalogItem,
  getWizardCatalog,
  parseWizardPlan,
  roomMmToCanvasUnits,
  type SmartWizardPlacement,
  type SmartWizardRequest,
} from "@/lib/configurator/smartWizard";

const baseRequest: SmartWizardRequest = {
  templateId: "tpl-office-01",
  roomType: "open-plan",
  roomWidthMm: 6000,
  roomLengthMm: 4000,
  style: "Modern",
};

describe("roomMmToCanvasUnits", () => {
  it("converts millimeters to canvas units (10 mm per unit)", () => {
    expect(roomMmToCanvasUnits(6000)).toBe(600);
    expect(roomMmToCanvasUnits(125)).toBe(13);
  });

  it("returns 0 for non-finite or non-positive values", () => {
    expect(roomMmToCanvasUnits(0)).toBe(0);
    expect(roomMmToCanvasUnits(-100)).toBe(0);
    expect(roomMmToCanvasUnits(Number.NaN)).toBe(0);
    expect(roomMmToCanvasUnits(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("getWizardCatalog and findWizardCatalogItem", () => {
  it("returns the default element library catalog", () => {
    expect(getWizardCatalog()).toBe(DEFAULT_ELEMENT_LIBRARY);
    expect(getWizardCatalog().length).toBeGreaterThan(10);
  });

  it("finds catalog items by type with case-insensitive matching", () => {
    const desk = findWizardCatalogItem("DESK");
    expect(desk?.type).toBe("desk");
    expect(desk?.shape).toBeUndefined();
  });

  it("finds shaped catalog items using type/shape keys", () => {
    const lShape = findWizardCatalogItem("desk/l-shape");
    expect(lShape?.type).toBe("desk");
    expect(lShape?.shape).toBe("l-shape");

    const normalized = findWizardCatalogItem("  Desk/L-Shape  ");
    expect(normalized?.label).toBe("L-Shape Desk");
  });

  it("returns null when the product id is unknown", () => {
    expect(findWizardCatalogItem("nonexistent-widget")).toBeNull();
    expect(findWizardCatalogItem("")).toBeNull();
  });
});

describe("parseWizardPlan", () => {
  const validPlan = {
    summary: "Open-plan layout with two workstations.",
    warnings: ["  ", "Tight clearance near the window", ""],
    placements: [
      { productId: "workstation", x: 120, y: 90, rotation: 0 },
      { productId: "plant", x: 40, y: 40, rotation: 45 },
    ],
  };

  it("parses valid JSON plans", () => {
    const plan = parseWizardPlan(JSON.stringify(validPlan));
    expect(plan).toEqual({
      summary: "Open-plan layout with two workstations.",
      warnings: ["Tight clearance near the window"],
      placements: [
        { productId: "workstation", x: 120, y: 90, rotation: 0 },
        { productId: "plant", x: 40, y: 40, rotation: 45 },
      ],
    });
  });

  it("strips markdown JSON code fences before parsing", () => {
    const fenced = `\`\`\`json\n${JSON.stringify(validPlan)}\n\`\`\``;
    expect(parseWizardPlan(fenced)?.summary).toBe(validPlan.summary);
  });

  it("returns null for empty, invalid, or incomplete payloads", () => {
    expect(parseWizardPlan("")).toBeNull();
    expect(parseWizardPlan("   ")).toBeNull();
    expect(parseWizardPlan("{not json")).toBeNull();
    expect(parseWizardPlan(JSON.stringify({ summary: 42, placements: [] }))).toBeNull();
    expect(parseWizardPlan(JSON.stringify({ summary: "Only summary" }))).toBeNull();
    expect(
      parseWizardPlan(
        JSON.stringify({
          summary: "Missing coords",
          placements: [{ productId: "desk" }],
        }),
      ),
    ).toBeNull();
  });

  it("filters invalid placement entries and defaults rotation", () => {
    const plan = parseWizardPlan(
      JSON.stringify({
        summary: "Mixed placements",
        placements: [
          null,
          { productId: "", x: 10, y: 10 },
          { productId: "desk", x: "bad", y: 20 },
          { productId: "desk", x: 50, y: 60 },
        ],
      }),
    );
    expect(plan?.placements).toEqual([{ productId: "desk", x: 50, y: 60, rotation: 0 }]);
  });
});

describe("clampPlacementToBounds", () => {
  const workstation = findWizardCatalogItem("workstation")!;

  it("clamps coordinates inside room bounds using element half-sizes", () => {
    const clamped = clampPlacementToBounds(
      { productId: "workstation", x: 5, y: 9999, rotation: 12.6 },
      workstation,
      { width: 200, height: 100 },
    );
    expect(clamped.productId).toBe("workstation");
    expect(clamped.x).toBeGreaterThanOrEqual(100);
    expect(clamped.y).toBeLessThanOrEqual(70);
    expect(clamped.rotation).toBe(13);
  });

  it("uses zero rotation when rotation is not finite", () => {
    const clamped = clampPlacementToBounds(
      { productId: "workstation", x: 100, y: 30, rotation: Number.NaN },
      workstation,
      { width: 200, height: 100 },
    );
    expect(clamped.rotation).toBe(0);
  });

  it("falls back to generic dimensions when catalog defaults are missing", () => {
    const unknownItem: LibraryItem = { type: "mystery-widget", label: "Mystery", category: "Other" };
    const clamped = clampPlacementToBounds(
      { productId: "mystery-widget", x: 10, y: 10, rotation: 0 },
      unknownItem,
      { width: 120, height: 80 },
    );
    expect(clamped.x).toBeGreaterThanOrEqual(30);
    expect(clamped.y).toBeGreaterThanOrEqual(30);
  });
});

describe("computeWizardPalette", () => {
  it("collects unique fill and stroke colors up to five entries", () => {
    const placements: SmartWizardPlacement[] = [
      { productId: "workstation", x: 100, y: 30, rotation: 0 },
      { productId: "plant", x: 40, y: 40, rotation: 0 },
      { productId: "conference-room", x: 120, y: 70, rotation: 0 },
    ];
    const palette = computeWizardPalette(placements);
    expect(palette.length).toBeGreaterThan(0);
    expect(palette.length).toBeLessThanOrEqual(5);
    expect(new Set(palette).size).toBe(palette.length);
  });

  it("skips unknown products when building the palette", () => {
    const palette = computeWizardPalette([
      { productId: "unknown-product", x: 10, y: 10, rotation: 0 },
      { productId: "plant", x: 20, y: 20, rotation: 0 },
    ]);
    expect(palette.length).toBeGreaterThan(0);
  });

  it("stops collecting palette colors after five unique entries", () => {
    const placements: SmartWizardPlacement[] = [
      "workstation",
      "conference-room",
      "private-office",
      "phone-booth",
      "common-area",
      "desk",
      "plant",
    ].map((productId, index) => ({
      productId,
      x: 40 + index * 20,
      y: 40,
      rotation: 0,
    }));
    expect(computeWizardPalette(placements)).toHaveLength(5);
  });
});

describe("buildFallbackWizardPlan", () => {
  const roomTypes = [
    "open-plan",
    "executive",
    "studio",
    "coworking",
    "blank",
  ] as const;

  it.each(roomTypes)("builds a deterministic fallback for %s rooms", (roomType) => {
    const plan = buildFallbackWizardPlan({ ...baseRequest, roomType });
    expect(plan.placements.length).toBeGreaterThan(0);
    expect(plan.warnings[0]).toMatch(/fallback layout/i);
    if (roomType === "blank") {
      expect(plan.summary).toMatch(/blank room/i);
    } else {
      expect(plan.summary).toMatch(new RegExp(roomType, "i"));
    }
  });

  it("falls back to the blank preset for unknown room types", () => {
    const plan = buildFallbackWizardPlan({
      ...baseRequest,
      roomType: "blank",
    });
    const unknownPlan = buildFallbackWizardPlan({
      ...baseRequest,
      roomType: "unknown-type" as SmartWizardRequest["roomType"],
    });
    expect(unknownPlan.placements.length).toBe(plan.placements.length);
  });

  it("alternates rotation and clamps every placement inside bounds", () => {
    const plan = buildFallbackWizardPlan(baseRequest);
    const bounds = {
      width: roomMmToCanvasUnits(baseRequest.roomWidthMm),
      height: roomMmToCanvasUnits(baseRequest.roomLengthMm),
    };
    for (const [index, placement] of plan.placements.entries()) {
      expect(placement.x).toBeGreaterThan(0);
      expect(placement.y).toBeGreaterThan(0);
      expect(placement.x).toBeLessThanOrEqual(bounds.width);
      expect(placement.y).toBeLessThanOrEqual(bounds.height);
      expect([0, 90]).toContain(placement.rotation);
      if (index % 2 === 0) expect(placement.rotation).toBe(0);
    }
  });
});

describe("buildWizardSystemPrompt", () => {
  it("includes room bounds, request metadata, and catalog lines", () => {
    const catalog = getWizardCatalog().slice(0, 4);
    const prompt = buildWizardSystemPrompt(baseRequest, catalog);

    expect(prompt).toMatch(/Oando Smart Wizard/i);
    expect(prompt).toMatch(/Return only valid JSON/i);
    expect(prompt).toMatch(/width=600/);
    expect(prompt).toMatch(/height=400/);
    expect(prompt).toMatch(/Template id: tpl-office-01/);
    expect(prompt).toMatch(/Room type: open-plan/);
    expect(prompt).toMatch(/Style: Modern/);
    expect(prompt).toMatch(/table-rect \| Rect Table \| Tables/);
  });

  it("uses a generic description when catalog metadata is missing", () => {
    const customCatalog: LibraryItem[] = [
      { type: "mystery-widget", label: "Mystery", category: "Other" },
    ];
    const prompt = buildWizardSystemPrompt(baseRequest, customCatalog);
    expect(prompt).toMatch(/mystery-widget \| Mystery \| Other \| Other element/);
  });
});