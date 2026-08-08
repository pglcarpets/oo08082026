// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAuthAdminClient } from "@/platform/supabase/auth-admin";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: { admin: {} },
    from: vi.fn(),
  })),
}));

describe("platform/supabase/auth-admin", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.NEXT_ADMIN_SUPABASE_URL;
    delete process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws when NEXT_ADMIN_SUPABASE_URL is missing", () => {
    process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY = "admin-service-key";

    expect(() => createSupabaseAuthAdminClient()).toThrow(
      "Missing required env var: NEXT_ADMIN_SUPABASE_URL",
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("throws when SUPABASE_ADMIN_SERVICE_ROLE_KEY is missing", () => {
    process.env.NEXT_ADMIN_SUPABASE_URL = "https://admin.supabase.co";

    expect(() => createSupabaseAuthAdminClient()).toThrow(
      "Missing required env var: SUPABASE_ADMIN_SERVICE_ROLE_KEY",
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("creates a service-role client with session flags disabled", () => {
    process.env.NEXT_ADMIN_SUPABASE_URL = "  https://admin.supabase.co  ";
    process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY = "  admin-service-key  ";

    const client = createSupabaseAuthAdminClient();

    expect(createClient).toHaveBeenCalledWith(
      "https://admin.supabase.co",
      "admin-service-key",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
    expect(client).toEqual(
      expect.objectContaining({
        auth: expect.objectContaining({ admin: {} }),
      }),
    );
  });
});
