import { describe, it, expect } from "vitest";
import { getE2EAuthEnv, getE2EAuthSeedEnv } from "@/lib/auth/e2eAuthEnv";

describe("e2eAuthEnv", () => {
  it("resolves auth-project variables when required keys are present", () => {
    const env = {
      NEXT_ADMIN_SUPABASE_URL: "https://auth.example.supabase.co",
      NEXT_ADMIN_SUPABASE_ANON_KEY: "auth_anon_key",
      E2E_SUPABASE_ADMIN_EMAIL: "admin@test.com",
      E2E_SUPABASE_ADMIN_PASSWORD: "password",
      E2E_SUPABASE_USER_EMAIL: "user@test.com",
      E2E_SUPABASE_USER_PASSWORD: "password",
    };

    const resolved = getE2EAuthEnv(env);
    expect(resolved.authSupabaseUrl).toBe("https://auth.example.supabase.co");
    expect(resolved.authSupabaseAnonKey).toBe("auth_anon_key");
    expect(resolved.adminEmail).toBe("admin@test.com");
  });

  it("throws error if required variables are missing", () => {
    const env = {
      NEXT_ADMIN_SUPABASE_URL: "https://auth.example.supabase.co",
    };
    expect(() => getE2EAuthEnv(env)).toThrow();
  });

  it("resolves seed variables against the admin auth project", () => {
    const env = {
      NEXT_ADMIN_SUPABASE_URL: "https://auth.example.supabase.co",
      SUPABASE_ADMIN_SERVICE_ROLE_KEY: "admin_service_key",
    };
    const resolved = getE2EAuthSeedEnv(env);
    expect(resolved.authSupabaseUrl).toBe("https://auth.example.supabase.co");
    expect(resolved.serviceRoleKey).toBe("admin_service_key");
  });
});
