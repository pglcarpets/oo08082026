import { describe, it, expect } from "vitest";
import {
  assertCatalogWriteAllowed,
  CatalogIsolationError,
} from "@/lib/catalog/catalogWriteIsolation";

describe("catalogWriteIsolation", () => {
  it("allows path under root", () => {
    expect(() =>
      assertCatalogWriteAllowed("/tmp/catalog/foo.json", {
        allowedRoots: ["/tmp/catalog"],
      }),
    ).not.toThrow();
  });

  it("blocks path outside root", () => {
    expect(() =>
      assertCatalogWriteAllowed("/etc/passwd", {
        allowedRoots: ["/tmp/catalog"],
      }),
    ).toThrow(CatalogIsolationError);
  });
});
