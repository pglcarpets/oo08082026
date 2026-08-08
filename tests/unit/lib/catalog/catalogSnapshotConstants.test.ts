/**
 * Name-mirror coverage for lib/catalog/catalogSnapshotConstants.
 */
import { describe, expect, it } from "vitest";
import { CATALOG_SNAPSHOT_R2_KEY } from "@/lib/catalog/catalogSnapshotConstants";

describe("catalogSnapshotConstants", () => {
  it("points at the nightly catalog-latest JSON key under backups/", () => {
    expect(CATALOG_SNAPSHOT_R2_KEY).toBe(
      "backups/catalog/catalog-latest.json",
    );
    expect(CATALOG_SNAPSHOT_R2_KEY.endsWith(".json")).toBe(true);
    expect(CATALOG_SNAPSHOT_R2_KEY.startsWith("backups/")).toBe(true);
  });
});
