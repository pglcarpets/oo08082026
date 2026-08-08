// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/platform/supabase/supabaseAdmin";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: { admin: {} },
    from: vi.fn(),
  })),
}));

describe("platform/supabase/supabaseAdmin", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws when no Supabase URL is configured", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    expect(() => createSupabaseAdminClient()).toThrow(
      /Missing required env var: SUPABASE_URL \(or NEXT_PUBLIC_SUPABASE_URL\)/,
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", () => {
    process.env.SUPABASE_URL = "https://products.supabase.co";

    expect(() => createSupabaseAdminClient()).toThrow(
      "Missing required env var: SUPABASE_SERVICE_ROLE_KEY",
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("prefers SUPABASE_URL over NEXT_PUBLIC_SUPABASE_URL", () => {
    process.env.SUPABASE_URL = "https://server.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    createSupabaseAdminClient();

    expect(createClient).toHaveBeenCalledWith(
      "https://server.supabase.co",
      "service-role-key",
      expect.objectContaining({
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }),
    );
  });

  it("falls back to NEXT_PUBLIC_SUPABASE_URL", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "  https://public.supabase.co  ";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "  service-role-key  ";

    const client = createSupabaseAdminClient();

    expect(createClient).toHaveBeenCalledWith(
      "https://public.supabase.co",
      "service-role-key",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
    expect(client).toBeDefined();
  });
});
