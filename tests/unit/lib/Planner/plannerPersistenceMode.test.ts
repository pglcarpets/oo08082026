import { describe, expect, it } from "vitest";
import {
  getPlannerPersistenceMode,
  isPlannerPersistenceConfigured,
} from "@/lib/Planner/plannerPersistenceMode";

/**
 * Both helpers take an explicit env bag, so pass one rather than mutating
 * `process.env` — Next types `NODE_ENV` as read-only, and a shared mutable
 * process env leaks between tests.
 */
function env(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return overrides as NodeJS.ProcessEnv;
}

describe("plannerPersistenceMode", () => {
  it("disk when DEV_AUTH_BYPASS=1 and not production", () => {
    const e = env({ NODE_ENV: "development", DEV_AUTH_BYPASS: "1" });
    expect(getPlannerPersistenceMode(e)).toBe("disk");
    expect(isPlannerPersistenceConfigured(e)).toBe(true);
  });

  it("supabase when bypass off", () => {
    expect(getPlannerPersistenceMode(env({ NODE_ENV: "development" }))).toBe(
      "supabase",
    );
  });

  it("bypass never applies in production", () => {
    const e = env({ NODE_ENV: "production", DEV_AUTH_BYPASS: "1" });
    expect(getPlannerPersistenceMode(e)).toBe("supabase");
  });

  it("supabase not configured without admin env", () => {
    const e = env({ NODE_ENV: "production" });
    expect(getPlannerPersistenceMode(e)).toBe("supabase");
    expect(isPlannerPersistenceConfigured(e)).toBe(false);
  });

  it("supabase configured when admin env present", () => {
    const e = env({
      NODE_ENV: "production",
      NEXT_ADMIN_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_ADMIN_SERVICE_ROLE_KEY: "service-role-key",
    });
    expect(isPlannerPersistenceConfigured(e)).toBe(true);
  });
});
