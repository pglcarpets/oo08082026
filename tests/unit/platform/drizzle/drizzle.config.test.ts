// @vitest-environment node
/**
 * drizzle.config.ts imports drizzle-kit, which has a broken package entry for Vite.
 * Assert export shape from source + the dbCredentials URL contract via databaseUrls.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { resolvePlannerDatabaseUrl } from "@/platform/drizzle/databaseUrls";

const configPath = path.resolve(
  __dirname,
  "../../../../site/platform/drizzle/drizzle.config.ts",
);

describe("platform/drizzle/drizzle.config", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("source exists and exports defineConfig shape", () => {
    expect(fs.existsSync(configPath), configPath).toBe(true);
    const source = fs.readFileSync(configPath, "utf8");

    expect(source).toMatch(/from\s+["']drizzle-kit["']/);
    expect(source).toMatch(/export\s+default\s+defineConfig\s*\(/);
    expect(source).toMatch(/dialect:\s*["']postgresql["']/);
    expect(source).toMatch(/platform\/drizzle\/schema\/catalog\.ts/);
    expect(source).toMatch(/platform\/drizzle\/schema\/planner\.ts/);
    expect(source).toMatch(/out:\s*["']platform\/drizzle\/migrations["']/);
    expect(source).toMatch(/dbCredentials\s*:\s*\{/);
    expect(source).toMatch(/resolvePlannerDatabaseUrl\(\)\s*\?\?\s*["']["']/);
  });

  it("dbCredentials url follows resolvePlannerDatabaseUrl (set)", () => {
    process.env.SUPABASE_AUTH_DATABASE_URL = "postgres://planner/config-test";
    expect(resolvePlannerDatabaseUrl() ?? "").toBe(
      "postgres://planner/config-test",
    );
  });

  it("dbCredentials url falls back to empty string when unset", () => {
    delete process.env.SUPABASE_AUTH_DATABASE_URL;
    delete process.env.PLANNER_DATABASE_URL;
    expect(resolvePlannerDatabaseUrl() ?? "").toBe("");
  });
});
