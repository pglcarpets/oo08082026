import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginWithSupabase, signupWithSupabase, signOutFromSupabase } from "@/lib/auth/supabaseServerActions";
import { createAuthServerClient } from "@/platform/supabase/server";
import { hasAuthSupabaseEnv } from "@/platform/supabase/env";

vi.mock("@/platform/supabase/server", () => {
  const mockSupabase = {
    auth: {
      signInWithPassword: vi.fn(() => Promise.resolve({ error: null })),
      signUp: vi.fn(() => Promise.resolve({ error: null })),
      signOut: vi.fn(() => Promise.resolve()),
    },
  };
  return {
    createAuthServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  };
});

vi.mock("@/platform/supabase/env", () => ({
  hasAuthSupabaseEnv: vi.fn(() => true),
}));

describe("supabaseServerActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error if auth supabase env is missing", async () => {
    vi.mocked(hasAuthSupabaseEnv).mockReturnValueOnce(false);
    const result = await loginWithSupabase("user@test.com", "password");
    expect(result.success).toBe(false);
  });

  it("authenticates login successfully", async () => {
    const result = await loginWithSupabase("user@test.com", "password");
    expect(result.success).toBe(true);
    const supabase = await createAuthServerClient();
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "user@test.com",
      password: "password",
    });
  });

  it("handles sign up correctly", async () => {
    const result = await signupWithSupabase("user@test.com", "password");
    expect(result.success).toBe(true);
    const supabase = await createAuthServerClient();
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "user@test.com",
      password: "password",
    });
  });

  it("signs out successfully", async () => {
    const result = await signOutFromSupabase();
    expect(result.success).toBe(true);
  });
});
