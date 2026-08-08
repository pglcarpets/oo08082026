/**
 * Name-mirror: features/site/data/productSuite
 */

import { describe, expect, it } from "vitest";
import { PRODUCT_SUITE, type ProductSuiteKey } from "@/features/site/data/productSuite";

describe("PRODUCT_SUITE", () => {
  it("defines planner, configurator, admin, and shared route maps", () => {
    const keys: ProductSuiteKey[] = ["planner", "configurator", "admin", "shared"];
    for (const key of keys) {
      expect(PRODUCT_SUITE[key].routes).toBeDefined();
    }
    expect(PRODUCT_SUITE.planner.label).toBe("Workspace Planner");
    expect(PRODUCT_SUITE.planner.routes.canvas).toBe("/ooplanner");
    expect(PRODUCT_SUITE.planner.routes.guest).toBe("/ooplanner");
    expect(PRODUCT_SUITE.configurator.routes.landing).toBe("/planner");
    expect(PRODUCT_SUITE.admin.routes.landing).toBe("/admin");
    expect(PRODUCT_SUITE.shared.routes.login).toBe("/login");
    expect(PRODUCT_SUITE.shared.routes.chooser).toBe("/choose-product");
  });
});
