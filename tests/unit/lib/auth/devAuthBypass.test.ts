// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import {
  DEV_BYPASS_USER,
  isDevAuthBypassEnabled,
} from "@/lib/auth/devAuthBypass";
import { resolveAuthContext } from "@/features/shared/api/withAuth";
import { setNodeEnv } from "@/tests/helpers/setNodeEnv";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("DEV_BYPASS_USER", () => {
  it("uses a Postgres-valid UUID (oando_plans.user_id is uuid)", () => {
    expect(DEV_BYPASS_USER.id).toMatch(UUID_RE);
    // Guard against the historical non-hex suffix `…000dev`.
    expect(DEV_BYPASS_USER.id.toLowerCase()).not.toContain("dev");
  });
});

/**
 * Env matrix for isDevAuthBypassEnabled.
 * CSRF skip when bypass is on is covered in withAuth.test.ts (requireCsrf path).
 */
describe("isDevAuthBypassEnabled", () => {
  it.each([
    {
      name: "false by default (development, flag unset)",
      env: { NODE_ENV: "development" },
      expected: false,
    },
    {
      name: "true in development when DEV_AUTH_BYPASS=1",
      env: { NODE_ENV: "development", DEV_AUTH_BYPASS: "1" },
      expected: true,
    },
    {
      name: "false when DEV_AUTH_BYPASS is not exactly 1",
      env: { NODE_ENV: "development", DEV_AUTH_BYPASS: "true" },
      expected: false,
    },
    {
      name: "false in production even with DEV_AUTH_BYPASS=1",
      env: { NODE_ENV: "production", DEV_AUTH_BYPASS: "1" },
      expected: false,
    },
  ] as const)("$name", ({ env, expected }) => {
    process.env = {
      ...originalEnv,
      NODE_ENV: env.NODE_ENV,
    };
    delete process.env.DEV_AUTH_BYPASS;
    if ("DEV_AUTH_BYPASS" in env && env.DEV_AUTH_BYPASS !== undefined) {
      process.env.DEV_AUTH_BYPASS = env.DEV_AUTH_BYPASS;
    }
    expect(isDevAuthBypassEnabled(process.env)).toBe(expected);
  });
});

describe("resolveAuthContext with bypass", () => {
  it("returns synthetic admin when bypass enabled", async () => {
    setNodeEnv("development");
    process.env.DEV_AUTH_BYPASS = "1";
    const auth = await resolveAuthContext("admin");
    expect(auth.isAdmin).toBe(true);
    expect(auth.user?.id).toBe(DEV_BYPASS_USER.id);
    expect(auth.user?.email).toBe(DEV_BYPASS_USER.email);
  });

  it("still synthesizes admin for member/guest required roles under bypass", async () => {
    setNodeEnv("development");
    process.env.DEV_AUTH_BYPASS = "1";
    const member = await resolveAuthContext("member");
    expect(member.isAdmin).toBe(true);
    expect(member.user?.id).toBe(DEV_BYPASS_USER.id);
    expect(member.requiredRole).toBe("member");

    const guest = await resolveAuthContext("guest");
    expect(guest.isAdmin).toBe(true);
    expect(guest.user?.id).toBe(DEV_BYPASS_USER.id);
    expect(guest.requiredRole).toBe("guest");
  });
});
