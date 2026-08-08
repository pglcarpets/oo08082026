// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  resolveProductsDatabaseUrl,
  isProductsDatabaseConfigured,
  resolvePlannerDatabaseUrl,
  isPlannerDatabaseUrlConfigured,
} from "@/platform/drizzle/databaseUrls";

describe("platform/drizzle/databaseUrls", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.PRODUCTS_DATABASE_URL;
    delete process.env.SUPABASE_AUTH_DATABASE_URL;
    delete process.env.PLANNER_DATABASE_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("resolveProductsDatabaseUrl", () => {
    it("returns null when unset", () => {
      expect(resolveProductsDatabaseUrl()).toBeNull();
    });

    it("returns null for whitespace-only values", () => {
      process.env.PRODUCTS_DATABASE_URL = "   ";
      expect(resolveProductsDatabaseUrl()).toBeNull();
    });

    it("returns trimmed URL when set", () => {
      process.env.PRODUCTS_DATABASE_URL = "  postgres://products/db  ";
      expect(resolveProductsDatabaseUrl()).toBe("postgres://products/db");
    });
  });

  describe("isProductsDatabaseConfigured", () => {
    it("is false when URL missing", () => {
      expect(isProductsDatabaseConfigured()).toBe(false);
    });

    it("is true when URL present", () => {
      process.env.PRODUCTS_DATABASE_URL = "postgres://products/db";
      expect(isProductsDatabaseConfigured()).toBe(true);
    });
  });

  describe("resolvePlannerDatabaseUrl", () => {
    it("returns null when both planner envs are unset", () => {
      expect(resolvePlannerDatabaseUrl()).toBeNull();
    });

    it("prefers SUPABASE_AUTH_DATABASE_URL over PLANNER_DATABASE_URL", () => {
      process.env.SUPABASE_AUTH_DATABASE_URL = "postgres://auth/db";
      process.env.PLANNER_DATABASE_URL = "postgres://planner/db";
      expect(resolvePlannerDatabaseUrl()).toBe("postgres://auth/db");
    });

    it("falls back to PLANNER_DATABASE_URL", () => {
      process.env.PLANNER_DATABASE_URL = "  postgres://planner/db  ";
      expect(resolvePlannerDatabaseUrl()).toBe("postgres://planner/db");
    });

    it("returns null for whitespace-only primary env", () => {
      process.env.SUPABASE_AUTH_DATABASE_URL = "  ";
      process.env.PLANNER_DATABASE_URL = "  ";
      expect(resolvePlannerDatabaseUrl()).toBeNull();
    });
  });

  describe("isPlannerDatabaseUrlConfigured", () => {
    it("is false when no planner URL", () => {
      expect(isPlannerDatabaseUrlConfigured()).toBe(false);
    });

    it("is true when either planner URL is set", () => {
      process.env.PLANNER_DATABASE_URL = "postgres://planner/db";
      expect(isPlannerDatabaseUrlConfigured()).toBe(true);
    });
  });
});
