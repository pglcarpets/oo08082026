import { describe, it, expect, vi, beforeEach } from "vitest";
import { requirePlannerUser } from "@/lib/auth/plannerSession";
import { getOptionalUser } from "@/lib/auth/session";
import { hasAuthSupabaseEnv } from "@/platform/supabase/env";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PLANNER_GUEST_COOKIE } from "@/lib/auth/constants";
import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => {
  const mockCookies = {
    has: vi.fn(() => false),
  };
  return {
    cookies: vi.fn(() => Promise.resolve(mockCookies)),
  };
});

vi.mock("@/lib/auth/session", () => ({
  getOptionalUser: vi.fn(),
}));

vi.mock("@/lib/auth/plannerRedirect", () => ({
  buildAccessRedirect: vi.fn((nextPath: string) => `/access?next=${encodeURIComponent(nextPath)}`),
}));

vi.mock("@/platform/supabase/env", () => ({
  hasAuthSupabaseEnv: vi.fn(() => true),
}));

type CookieStore = { has: (name: string) => boolean };

describe("plannerSession requirePlannerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hasAuthSupabaseEnv).mockReturnValue(true);
    vi.mocked(cookies).mockResolvedValue({
      has: vi.fn(() => false),
    } as CookieStore as Awaited<ReturnType<typeof cookies>>);
  });

  it("returns guest user if guest cookie is present and path is guest-allowed", async () => {
    const mockStore: CookieStore = {
      has: (name) => name === PLANNER_GUEST_COOKIE,
    };
    vi.mocked(cookies).mockResolvedValueOnce(
      mockStore as Awaited<ReturnType<typeof cookies>>,
    );

    const user = await requirePlannerUser("/ooplanner");
    expect(user).toEqual({
      id: "guest",
      email: "guest@example.com",
      name: "Guest User",
    });
  });

  it("returns guest user on /ooplanner/projects with guest cookie", async () => {
    const mockStore: CookieStore = {
      has: (name) => name === PLANNER_GUEST_COOKIE,
    };
    vi.mocked(cookies).mockResolvedValueOnce(
      mockStore as Awaited<ReturnType<typeof cookies>>,
    );

    const user = await requirePlannerUser("/ooplanner/projects/p_1");
    expect(user.id).toBe("guest");
  });

  it("returns ANONYMOUS_USER if supabase env is missing", async () => {
    vi.mocked(hasAuthSupabaseEnv).mockReturnValueOnce(false);
    const user = await requirePlannerUser("/dashboard");
    expect(user.id).toBe("anonymous");
  });

  it("returns user if session is valid", async () => {
    const mockUser = {
      id: "user-123",
      email: "user@test.com",
      role: "editor" as const,
    };
    vi.mocked(getOptionalUser).mockResolvedValueOnce(mockUser as never);

    const user = await requirePlannerUser("/dashboard");
    expect(user).toEqual(mockUser);
  });

  it("redirects unauthenticated callers on protected paths", async () => {
    vi.mocked(getOptionalUser).mockResolvedValueOnce(null);

    await expect(requirePlannerUser("/dashboard")).rejects.toThrow(
      "Authentication required",
    );
    expect(buildAccessRedirect).toHaveBeenCalledWith("/dashboard");
    expect(redirect).toHaveBeenCalledWith("/access?next=%2Fdashboard");
  });

  it("returns ANONYMOUS_USER on guest-allowed paths without a session", async () => {
    vi.mocked(getOptionalUser).mockResolvedValueOnce(null);

    const user = await requirePlannerUser("/ooplanner");
    expect(user.id).toBe("anonymous");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("rethrows NEXT_REDIRECT control-flow errors instead of falling open", async () => {
    const redirectError = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/access?next=%2Fdashboard;307;",
    });
    vi.mocked(getOptionalUser).mockRejectedValueOnce(redirectError);

    await expect(requirePlannerUser("/dashboard")).rejects.toBe(redirectError);
  });

  it("fails closed on protected paths when auth lookup throws", async () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(getOptionalUser).mockRejectedValueOnce(new Error("session store down"));

    await expect(requirePlannerUser("/dashboard")).rejects.toThrow(
      "Authentication required",
    );
    expect(redirect).toHaveBeenCalledWith("/access?next=%2Fdashboard");
    consoleWarn.mockRestore();
  });

  it("fails open to anonymous on guest-allowed paths when auth lookup throws", async () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(getOptionalUser).mockRejectedValueOnce(new Error("session store down"));

    const user = await requirePlannerUser("/planner/guest");
    expect(user.id).toBe("anonymous");
    expect(redirect).not.toHaveBeenCalled();
    consoleWarn.mockRestore();
  });
});
