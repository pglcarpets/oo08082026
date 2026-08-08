import { describe, expect, it } from "vitest";

import { resolveFootprint } from "@/lib/catalog/geometry";
import {
  buildOandoSeedProducts,
  STORAGE,
  TABLES,
  WORKSTATIONS,
} from "@/lib/catalog/seed/oandoCatalog";

describe("oando catalog seed", () => {
  it("exports workstation, storage, and table collections", () => {
    expect(WORKSTATIONS.length).toBeGreaterThan(0);
    expect(STORAGE.length).toBeGreaterThan(0);
    expect(TABLES.length).toBeGreaterThan(0);
    expect(buildOandoSeedProducts().length).toBe(WORKSTATIONS.length + STORAGE.length + TABLES.length);
  });

  it("resolves a numeric footprint for every seed product", () => {
    for (const product of buildOandoSeedProducts()) {
      const footprint = resolveFootprint(product);
      expect(footprint, `${product.id} should resolve`).not.toBeNull();
      expect(footprint!.L).toBeGreaterThan(0);
      expect(footprint!.D).toBeGreaterThan(0);
    }
  });

  it("tags seed products with oando metadata and sizing types", () => {
    expect(WORKSTATIONS.every((product) => product.sizingType === "parametric")).toBe(true);
    expect(STORAGE.every((product) => product.sizingType === "discrete")).toBe(true);
    expect(TABLES.every((product) => product.sizingType === "discrete")).toBe(true);
    expect(buildOandoSeedProducts().every((product) => product.metadata?.source === "oando-seed")).toBe(true);
  });
});