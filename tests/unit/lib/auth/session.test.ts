import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getOptionalUser, requireAuthUser } from "@/lib/auth/session";
import { createAuthServerClient } from "@/platform/supabase/server";
import { hasAuthSupabaseEnv } from "@/platform/supabase/env";
import { redirect } from "next/navigation";
import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";
import { DEV_BYPASS_USER } from "@/lib/auth/devAuthBypass";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/platform/supabase/server", () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: null }, error: null }),
      ),
    },
  };
  return {
    createAuthServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  };
});

vi.mock("@/platform/supabase/env", () => ({
  hasAuthSupabaseEnv: vi.fn(() => true),
}));

vi.mock("@/lib/auth/plannerRedirect", () => ({
  buildAccessRedirect: vi.fn((nextPath: string, fallback?: string) =>
    `/access?next=${encodeURIComponent(nextPath)}${fallback ? `&fb=${fallback}` : ""}`,
  ),
}));

const originalEnv = { ...process.env };

function forceBypassOff(): void {
  process.env = {
    ...originalEnv,
    NODE_ENV: "test",
    DEV_AUTH_BYPASS: "0",
  };
  delete process.env.DEV_AUTH_BYPASS;
  process.env.DEV_AUTH_BYPASS = "0";
}

function forceBypassOn(): void {
  process.env = {
    ...originalEnv,
    NODE_ENV: "development",
    DEV_AUTH_BYPASS: "1",
  };
}

describe("session auth helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    forceBypassOff();
    vi.mocked(hasAuthSupabaseEnv).mockReturnValue(true);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns null if hasAuthSupabaseEnv is false", async () => {
    vi.mocked(hasAuthSupabaseEnv).mockReturnValueOnce(false);
    const user = await getOptionalUser();
    expect(user).toBeNull();
  });

  it("returns user details when user is authenticated", async () => {
    const supabase = await createAuthServerClient();
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: {
        user: {
          id: "123",
          email: "user@example.com",
          user_metadata: { name: "John Doe" },
          app_metadata: { role: "admin" },
        },
      },
      error: null,
    } as never);

    const user = await getOptionalUser();
    expect(user).toEqual({
      id: "123",
      email: "user@example.com",
      name: "John Doe",
      avatarUrl: undefined,
      role: "owner",
    });
  });

  it("rethrows Next dynamic server usage during static probing", async () => {
    const dynamicError = Object.assign(
      new Error(
        "Dynamic server usage: Route /access couldn't be rendered statically",
      ),
      { digest: "DYNAMIC_SERVER_USAGE" },
    );
    vi.mocked(createAuthServerClient).mockRejectedValueOnce(dynamicError);

    await expect(getOptionalUser()).rejects.toBe(dynamicError);
  });

  it("returns null for auth client failures", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(createAuthServerClient).mockRejectedValueOnce(
      new Error("invalid session"),
    );

    await expect(getOptionalUser()).resolves.toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      "getOptionalUser error:",
      expect.any(Error),
    );
    consoleError.mockRestore();
  });

  it("redirects when requireAuthUser is called without user", async () => {
    const supabase = await createAuthServerClient();
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    } as never);

    await expect(requireAuthUser("/dashboard")).rejects.toThrow(
      "Authentication required",
    );
    expect(buildAccessRedirect).toHaveBeenCalledWith("/dashboard", undefined);
    expect(redirect).toHaveBeenCalled();
  });

  describe("admin gate (DEV_AUTH_BYPASS off)", () => {
    it("redirects unauthenticated /admin callers to access path", async () => {
      const supabase = await createAuthServerClient();
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as never);

      await expect(requireAuthUser("/admin", "admin")).rejects.toThrow(
        "Authentication required",
      );

      expect(buildAccessRedirect).toHaveBeenCalledWith("/admin", "/admin");
      expect(redirect).toHaveBeenCalledWith(
        expect.stringContaining("/access?next="),
      );
    });

    it("rejects non-admin members from admin surface", async () => {
      const supabase = await createAuthServerClient();
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: {
          user: {
            id: "member-1",
            email: "member@example.com",
            app_metadata: { role: "member" },
          },
        },
        error: null,
      } as never);

      await expect(requireAuthUser("/admin/svg-editor", "admin")).rejects.toThrow(
        "Unauthorized admin access",
      );

      expect(redirect).toHaveBeenCalledWith(
        "/dashboard?error=unauthorized_admin_access",
      );
    });

    it("allows owner (app admin) through admin surface", async () => {
      const supabase = await createAuthServerClient();
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: {
          user: {
            id: "admin-1",
            email: "admin@example.com",
            app_metadata: { role: "admin" },
          },
        },
        error: null,
      } as never);

      const user = await requireAuthUser("/admin", "admin");
      expect(user.id).toBe("admin-1");
      expect(user.role).toBe("owner");
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe("admin gate (DEV_AUTH_BYPASS on, non-prod only)", () => {
    it("returns synthetic admin without session", async () => {
      forceBypassOn();
      const user = await requireAuthUser("/admin", "admin");
      expect(user.id).toBe(DEV_BYPASS_USER.id);
      expect(user.email).toBe(DEV_BYPASS_USER.email);
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe("admin gate (production ignores DEV_AUTH_BYPASS)", () => {
    it("redirects unauthenticated admin callers when NODE_ENV=production and bypass=1", async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: "production",
        DEV_AUTH_BYPASS: "1",
      };
      const supabase = await createAuthServerClient();
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as never);

      await expect(requireAuthUser("/admin", "admin")).rejects.toThrow(
        "Authentication required",
      );
      expect(redirect).toHaveBeenCalledWith(
        expect.stringContaining("/access?next="),
      );
    });
  });
});
