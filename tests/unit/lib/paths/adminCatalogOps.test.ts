import { describe, expect, it } from "vitest";
import path from "node:path";

import {
  ADMIN_CATALOG_OPS_DIR_DEFAULT,
  resolveWorkspaceRoot,
} from "@/lib/paths/adminCatalogOps";

describe("admin catalog ops paths", () => {
  it("defaults catalog-ops under results/admin/catalog-ops", () => {
    expect(ADMIN_CATALOG_OPS_DIR_DEFAULT).toMatch(
      /results[\\/]admin[\\/]catalog-ops$/,
    );
    expect(path.isAbsolute(ADMIN_CATALOG_OPS_DIR_DEFAULT)).toBe(true);
    expect(resolveWorkspaceRoot()).toBe(
      path.resolve(ADMIN_CATALOG_OPS_DIR_DEFAULT, "..", "..", ".."),
    );
  });
});
