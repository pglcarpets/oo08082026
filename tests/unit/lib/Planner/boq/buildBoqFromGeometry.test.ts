import { describe, it, expect } from "vitest";
import { buildBoqFromGeometry } from "@/lib/Planner/boq/buildBoqFromGeometry";
import { exportBoqCsv } from "@/lib/Planner/boq/exportBoqCsv";
import { exportBoqJson } from "@/lib/Planner/boq/exportBoqJson";

describe("buildBoqFromGeometry", () => {
  it("groups identical catalog ids and keeps unitPrice 0 without price book", () => {
    const boq = buildBoqFromGeometry({
      projectId: "p1",
      projectName: "Demo",
      furniture: [
        { id: "1", catalogId: "desk-a", name: "Desk A", widthMm: 1200, depthMm: 600 },
        { id: "2", catalogId: "desk-a", name: "Desk A", widthMm: 1200, depthMm: 600 },
        { id: "3", catalogId: "chair-b", name: "Chair B", widthMm: 500, depthMm: 500 },
      ],
      priceForSku: () => null,
    });
    expect(boq.lines).toHaveLength(2);
    const desk = boq.lines.find((l) => l.catalogId === "desk-a");
    expect(desk?.quantity).toBe(2);
    expect(desk?.priced).toBe(false);
    expect(desk?.unitPriceInr).toBe(0);
    expect(boq.calculationHash).toMatch(/^[a-f0-9]{64}$/i);
  });

  it("applies price book when sku resolves and pricing enabled", () => {
    const boq = buildBoqFromGeometry({
      projectId: "p1",
      projectName: "Demo",
      pricingEnabled: true,
      furniture: [
        { id: "1", catalogId: "desk-a", sku: "SKU-1", name: "Desk A", widthMm: 1200, depthMm: 600 },
      ],
      priceForSku: (sku) => (sku === "SKU-1" ? 10000 : null),
    });
    expect(boq.lines[0]?.priced).toBe(true);
    expect(boq.lines[0]?.unitPriceInr).toBe(10000);
    expect(boq.lines[0]?.lineTotalInr).toBe(10000);
    expect(boq.subtotalInr).toBe(10000);
  });
});

describe("exportBoq", () => {
  it("exports csv and json", () => {
    const boq = buildBoqFromGeometry({
      projectId: "p1",
      projectName: "Demo",
      furniture: [{ id: "1", catalogId: "desk-a", name: 'Desk "A"', widthMm: 1200, depthMm: 600 }],
    });
    const csv = exportBoqCsv(boq);
    expect(csv).toContain("Item");
    expect(csv).toContain("Desk");
    const json = exportBoqJson(boq);
    expect(json).toContain("oo-furniture-boq-v1");
  });
});
