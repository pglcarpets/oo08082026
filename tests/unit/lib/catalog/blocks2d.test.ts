import { describe, expect, it } from "vitest";

import {
  BLOCK_STYLE,
  buildBlock2D,
  buildGenericBlock2D,
  buildMeetingRoomBlock,
  blockToSvg,
} from "@/lib/catalog/blocks2d";
import type { Product } from "@/lib/catalog/types";

function baseProduct(overrides: Partial<Product> & Pick<Product, "category_id" | "name">): Product {
  return {
    id: "test-product",
    series: "test",
    slug: "test-product",
    images: [],
    specs: { dimensions: "", materials: [], features: [] },
    series_id: "test",
    series_name: "Test",
    created_at: "",
    sizingType: "fixed",
    defaultFootprint: { L: 1200, D: 600, H: 750 },
    ...overrides,
  };
}

describe("catalog blocks2d extras", () => {
  it("builds generic decorative blocks and falls back to a surface rect", () => {
    expect(buildGenericBlock2D("plant", 500, 500)?.label).toBe("plant");
    expect(buildGenericBlock2D("sofa", 1800, 900)?.prims.length).toBeGreaterThan(0);
    expect(buildGenericBlock2D("printer", 600, 600)?.label).toBe("printer");
    expect(buildGenericBlock2D("whiteboard", 1200, 100)?.label).toBe("whiteboard");
    expect(buildGenericBlock2D("vending-machine", 800, 700)?.label).toBe("vending-machine");
    const fallback = buildGenericBlock2D("unknown", 400, 300);
    expect(fallback?.prims[0]).toMatchObject({ kind: "rect", w: 400, h: 300 });
  });

  it("renders equipment, lounge, and soft seating categories", () => {
    const printer = buildBlock2D(
      baseProduct({
        name: "Office Printer",
        category_id: "printer",
        defaultFootprint: { L: 600, D: 600, H: 900 },
      }),
    );
    expect(printer?.prims.some((prim) => prim.kind === "circle")).toBe(true);

    const whiteboard = buildBlock2D(
      baseProduct({
        name: "Wall Whiteboard",
        category_id: "whiteboard",
        defaultFootprint: { L: 1800, D: 80, H: 1200 },
      }),
    );
    expect(whiteboard?.prims.length).toBeGreaterThan(1);

    const vending = buildBlock2D(
      baseProduct({
        name: "Snack Vending",
        category_id: "vending",
        defaultFootprint: { L: 800, D: 700, H: 1800 },
      }),
    );
    expect(vending?.prims.length).toBeGreaterThan(1);

    const lounge = buildBlock2D(
      baseProduct({
        name: "Soft Lounge Chair",
        category_id: "soft-seating",
        defaultFootprint: { L: 700, D: 700, H: 900 },
      }),
    );
    expect(lounge?.prims.length).toBeGreaterThan(0);

    const cabinet = buildBlock2D(
      baseProduct({
        name: "Tall Cabinet",
        category_id: "cabinet",
        defaultFootprint: { L: 900, D: 450, H: 1800 },
      }),
    );
    expect(cabinet?.label).toBe("Tall Cabinet");
  });

  it("renders L-shape, storage, and accessory categories", () => {
    const lShape = buildBlock2D(
      baseProduct({
        name: "L Workstation",
        category_id: "workstations",
        sizingType: "parametric",
        workstation: {
          shape: "l-shape",
          system: "partition",
          wireManagement: [],
          sharing: "non-sharing",
          seaterOptions: [2],
          lengthOptions: [1500],
          depthOptions: [600],
          heightMm: 750,
          armOptions: [1200],
        },
      }),
      { selection: { seaters: 2, length: 1500, depth: 600, armLength: 1200 } },
    );
    expect(lShape?.label).toContain("L-workstation");

    const pedestal = buildBlock2D(
      baseProduct({
        name: "Pedestal",
        category_id: "storage",
        defaultFootprint: { L: 400, D: 500, H: 750 },
      }),
    );
    expect(pedestal?.label).toBe("Pedestal");

    const cabinet = buildBlock2D(
      baseProduct({
        name: "Tall Cabinet",
        category_id: "cabinet",
        defaultFootprint: { L: 900, D: 450, H: 1800 },
      }),
    );
    expect(cabinet?.prims.length).toBeGreaterThan(2);

    const plant = buildBlock2D(
      baseProduct({
        name: "Floor Plant",
        category_id: "plant",
        defaultFootprint: { L: 500, D: 500, H: 1200 },
      }),
    );
    expect(plant?.prims.some((prim) => prim.kind === "circle")).toBe(true);
  });

  it("builds meeting room shells for solo and group layouts", () => {
    const solo = buildMeetingRoomBlock({ L: 2400, D: 1800, H: 2700 }, 1, "Phone booth");
    expect(solo.label).toContain("Phone booth");
    expect(solo.prims.some((prim) => prim.kind === "arc")).toBe(true);

    const group = buildMeetingRoomBlock({ L: 4800, D: 3600, H: 2700 }, 12, "Boardroom");
    expect(group.prims.filter((prim) => prim.kind === "rect" && prim.radius === 64).length).toBeGreaterThan(0);
  });

  it("parses pax labels and lays out large meeting rooms with side chairs", () => {
    const labeled = buildBlock2D(
      baseProduct({
        name: "Boardroom Table (12 pax)",
        category_id: "tables",
        defaultFootprint: { L: 4200, D: 1500, H: 750 },
      }),
    );
    expect(labeled?.prims.filter((prim) => prim.kind === "rect" && prim.radius === 64).length).toBeGreaterThanOrEqual(12);

    const room = buildMeetingRoomBlock({ L: 5200, D: 4000, H: 2700 }, 12, "Large boardroom");
    expect(room.prims.filter((prim) => prim.kind === "rect" && prim.radius === 64).length).toBeGreaterThanOrEqual(12);
  });

  it("falls back to a generic surface block for unknown categories", () => {
    const block = buildBlock2D(
      baseProduct({
        name: "Misc Item",
        category_id: "misc",
        defaultFootprint: { L: 1000, D: 500, H: 750 },
      }),
    );
    expect(block?.prims).toHaveLength(1);
    expect(block?.prims[0]).toMatchObject({ kind: "rect", w: 1000, h: 500 });
  });

  it("renders straight partition workstations and leg-system sharing benches", () => {
    const partition = buildBlock2D(
      baseProduct({
        name: "Panel Desk",
        category_id: "workstations",
        sizingType: "parametric",
        workstation: {
          shape: "straight",
          system: "partition",
          wireManagement: [],
          sharing: "non-sharing",
          seaterOptions: [2],
          lengthOptions: [1200],
          depthOptions: [600],
          heightMm: 750,
        },
      }),
      { selection: { seaters: 2, length: 1200, depth: 600 } },
    );
    expect(partition?.prims.some((prim) => prim.kind === "rect" && prim.fill === BLOCK_STYLE.panel)).toBe(true);

    const sharing = buildBlock2D(
      baseProduct({
        name: "Sharing Bench",
        category_id: "workstations",
        sizingType: "parametric",
        workstation: {
          shape: "straight",
          system: "leg",
          wireManagement: [],
          sharing: "sharing",
          seaterOptions: [2],
          lengthOptions: [1200],
          depthOptions: [1200],
          heightMm: 750,
        },
      }),
      { selection: { seaters: 2, length: 1200, depth: 1200 } },
    );
    expect(sharing?.label).toContain("4-seat sharing");
  });

  it("renders pedestals, round tables, and cabin tables by slug", () => {
    const pedestal = buildBlock2D(
      baseProduct({
        name: "Compact Pedestal",
        category_id: "storage",
        defaultFootprint: { L: 400, D: 450, H: 750 },
      }),
    );
    expect(pedestal?.label).toBe("Pedestal");

    const round900 = buildBlock2D(
      baseProduct({
        name: "Discussion 900",
        category_id: "tables",
        defaultFootprint: { L: 900, D: 900, H: 750 },
      }),
    );
    expect(round900?.prims.filter((prim) => prim.kind === "circle").length).toBeGreaterThan(0);

    const round1200 = buildBlock2D(
      baseProduct({
        name: "Discussion 1200",
        category_id: "tables",
        defaultFootprint: { L: 1200, D: 1200, H: 750 },
      }),
    );
    expect(round1200?.prims.filter((prim) => prim.kind === "circle").length).toBeGreaterThan(3);

    const cabin = buildBlock2D(
      baseProduct({
        name: "Executive Desk",
        slug: "exec-cabin-desk",
        category_id: "tables",
        defaultFootprint: { L: 2100, D: 750, H: 750 },
      }),
    );
    expect(cabin?.prims.filter((prim) => prim.kind === "rect" && prim.radius === 72).length).toBeGreaterThanOrEqual(2);
  });

  it("serializes arc primitives in meeting-room SVG output", () => {
    const room = buildMeetingRoomBlock({ L: 3000, D: 2400, H: 2700 }, 6, "Huddle");
    const svg = blockToSvg(room);
    expect(svg).toContain("<path");
    expect(room.prims.some((prim) => prim.kind === "arc")).toBe(true);
  });

  it("serializes primitives with gradients, shadows, and custom CSS", () => {
    const block = buildGenericBlock2D("unknown", 800, 600);
    expect(block).not.toBeNull();

    const svg = blockToSvg(block!, 120, ":root { --block-surface: var(--color-dark-midnight-blue-500); }");
    expect(svg).toContain("<svg");
    expect(svg).toContain('fill="var(--color-dark-midnight-blue-500)"');
    expect(svg).not.toContain('fill="var(--block-surface)"');
    expect(BLOCK_STYLE.surface).toBe("var(--block-surface)");
  });
});
