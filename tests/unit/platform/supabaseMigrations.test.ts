import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const MIGRATIONS_DIR = resolve(process.cwd(), "platform/supabase/migrations");

const REQUIRED_TABLE_MIGRATIONS: Record<string, string> = {
  planner_managed_products: "20260628100000_create_planner_managed_products_and_feature_flags.sql",
  feature_flags: "20260628100000_create_planner_managed_products_and_feature_flags.sql",
  configurator_products: "20260601120000_create_configurator_products.sql",
};

describe("supabase migrations (read-only smoke)", () => {
  it("includes SQL migration files for planner catalog tables", () => {
    const files = readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith(".sql"));
    const fileSet = new Set(files);

    for (const [table, migrationFile] of Object.entries(REQUIRED_TABLE_MIGRATIONS)) {
      expect(fileSet.has(migrationFile), `missing migration file for ${table}`).toBe(true);
      const sql = readFileSync(resolve(MIGRATIONS_DIR, migrationFile), "utf8");
      expect(sql.toLowerCase()).toContain(`create table`);
      expect(sql.toLowerCase()).toContain(table);
    }
  });
});
