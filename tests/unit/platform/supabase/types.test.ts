// @vitest-environment node
/**
 * Smoke: platform supabase Database type exports are importable.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { Database, Json } from "@/platform/supabase/types";

const typesPath = path.resolve(
  __dirname,
  "../../../../site/platform/supabase/types.ts",
);

describe("platform/supabase/types", () => {
  it("source file exists", () => {
    expect(fs.existsSync(typesPath), typesPath).toBe(true);
  });

  it("source exports type Database and Json", () => {
    const source = fs.readFileSync(typesPath, "utf8");
    expect(source).toMatch(/export\s+type\s+Json\s*=/);
    expect(source).toMatch(/export\s+type\s+Database\s*=/);
  });

  it("Database types are importable and shape-checkable", () => {
    const jsonValue: Json = { nested: ["a", 1, null], flag: true };
    expect(jsonValue).toBeDefined();

    type ImageAssetsRow = Database["public"]["Tables"]["image_assets"]["Row"];
    const rowKeys: Array<keyof ImageAssetsRow> = [
      "id",
      "url",
      "storage_path",
      "asset_type",
      "created_at",
    ];
    expect(rowKeys).toContain("id");
    expect(rowKeys).toContain("url");

    const insertShape: Database["public"]["Tables"]["image_assets"]["Insert"] = {
      url: "https://example.com/asset.webp",
    };
    expect(insertShape.url).toBe("https://example.com/asset.webp");
  });
});
