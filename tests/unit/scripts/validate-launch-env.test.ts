// @vitest-environment node
/**
 * Name-mirror: scripts/general/validate-launch-env.mjs
 */
import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_PUBLIC_SECRET_PATTERNS,
  REQUIRED_PUBLIC_ENVS,
  REQUIRED_SERVER_ENVS,
  hasValue,
  validateLaunchEnv,
} from "../../../scripts/general/validate-launch-env.mjs";

describe("validate-launch-env (name-mirror)", () => {
  it("requires public and server envs", () => {
    expect(REQUIRED_PUBLIC_ENVS).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]);
    expect(REQUIRED_SERVER_ENVS).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(hasValue("X", { X: "  " })).toBe(false);
    expect(hasValue("X", { X: "ok" })).toBe(true);
  });

  it("passes when all required values are present", () => {
    const result = validateLaunchEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      NODE_ENV: "test",
    });
    expect(result.ok).toBe(true);
    expect(result.missingPublic).toEqual([]);
    expect(result.missingServer).toEqual([]);
    expect(result.missingProduction).toEqual([]);
  });

  it("fails on missing required and forbidden public secrets", () => {
    const result = validateLaunchEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SERVICE_ROLE_KEY: "leaked",
      NODE_ENV: "production",
    });
    expect(result.ok).toBe(false);
    expect(result.missingPublic).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(result.missingServer.length).toBeGreaterThan(0);
    expect(result.missingProduction).toEqual(
      expect.arrayContaining(["PRODUCTS_DATABASE_URL", "SUPABASE_AUTH_DATABASE_URL"]),
    );
    expect(result.forbiddenPublic).toContain("NEXT_PUBLIC_SERVICE_ROLE_KEY");
    expect(
      FORBIDDEN_PUBLIC_SECRET_PATTERNS.some((re) => re.test("NEXT_PUBLIC_API_TOKEN")),
    ).toBe(true);
  });
});
