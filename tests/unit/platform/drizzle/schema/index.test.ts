// @vitest-environment node
import { describe, it, expect } from "vitest";
import { getTableName, isTable } from "drizzle-orm";
import * as schema from "@/platform/drizzle/schema";
import { catalogProducts, blockDescriptors } from "@/platform/drizzle/schema/catalog";
import { plans, auditEvents } from "@/platform/drizzle/schema/planner";

describe("platform/drizzle/schema/index", () => {
  it("re-exports catalog tables", () => {
    expect(schema.catalogProducts).toBe(catalogProducts);
    expect(schema.blockDescriptors).toBe(blockDescriptors);
    expect(isTable(schema.catalogProducts)).toBe(true);
    expect(getTableName(schema.catalogProducts)).toBe("catalog_products");
  });

  it("re-exports planner tables", () => {
    expect(schema.plans).toBe(plans);
    expect(schema.auditEvents).toBe(auditEvents);
    expect(isTable(schema.plans)).toBe(true);
    expect(getTableName(schema.plans)).toBe("oando_plans");
  });

  it("exposes a non-empty public export surface", () => {
    const exportNames = Object.keys(schema);
    expect(exportNames).toEqual(
      expect.arrayContaining([
        "catalogProducts",
        "configuratorProducts",
        "profiles",
        "plans",
        "priceBooks",
        "auditEvents",
      ]),
    );
    expect(exportNames.length).toBeGreaterThanOrEqual(15);
  });
});
