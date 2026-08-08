// @vitest-environment node
/**
 * Name-mirror: platform/types/database.admin.types.ts
 * Contract: generated admin Supabase types export Database (and Json).
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type {
  Database,
  Json,
} from "@/platform/types/database.admin.types";

const monorepoRoot = path.resolve(__dirname, "../../../../");
const adminTypesPath = path.join(
  monorepoRoot,
  "site",
  "platform",
  "types",
  "database.admin.types.ts",
);

describe("database.admin.types.ts", () => {
  it("file exists under platform/types/", () => {
    expect(fs.existsSync(adminTypesPath), adminTypesPath).toBe(true);
  });

  it("source exports type Database and Json", () => {
    const source = fs.readFileSync(adminTypesPath, "utf8");
    expect(source).toMatch(/export\s+type\s+Database\s*=/);
    expect(source).toMatch(/export\s+type\s+Json\s*=/);
  });

  it("exports Database with a public schema key", () => {
    const dummyJson: Json = { key: "value" };
    expect(dummyJson).toBeDefined();

    const dbKeys: (keyof Database)[] = ["public"];
    expect(dbKeys).toContain("public");
    expect(dbKeys).toHaveLength(1);
  });

  it("public schema exposes Tables", () => {
    type PublicSchema = Database["public"];
    type TableNames = keyof PublicSchema["Tables"];
    // `oando_plans` is the live Planner store; the legacy `plans`/`clients`
    // cluster moved to the `archive` schema (20260801110000) and is correctly
    // absent from generated public types.
    const sampleTables: TableNames[] = ["oando_plans", "customer_queries"];
    expect(sampleTables).toContain("oando_plans");
    expect(sampleTables).toContain("customer_queries");
  });

  it("no longer exposes the archived legacy tables", () => {
    const source = fs.readFileSync(adminTypesPath, "utf8");
    for (const archived of ["clients", "plans", "plan_versions", "quotes"]) {
      expect(source, `${archived} should have moved to the archive schema`).not.toMatch(
        new RegExp(`^      ${archived}: \\{`, "m"),
      );
    }
  });
});
