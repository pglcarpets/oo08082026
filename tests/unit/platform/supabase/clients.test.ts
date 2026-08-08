import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "@supabase/supabase-js";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import {
  createBrowserClient,
  createServerClient as createSSRClient,
} from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getOptionalPublicSupabaseEnv,
  getPublicSupabaseEnv,
} from "@/platform/supabase/env";
import {
  createClient,
  createOptionalClient,
  getBrowserSessionUser,
} from "@/platform/supabase/client";
import { createServerClient } from "@/platform/supabase/server";

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn((url: string, anonKey: string) => ({
    auth: { getUser: vi.fn() },
    url,
    anonKey,
  })),
  createServerClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/headers", () => {
  const mockGetAll = vi.fn();
  const mockSet = vi.fn();
  return {
    cookies: vi.fn(async () => ({
      getAll: mockGetAll,
      set: mockSet,
    })),
  };
});

vi.mock("@/platform/supabase/env", () => ({
  getPublicSupabaseEnv: vi.fn(() => ({
    url: "https://mock-server.supabase.co",
    anonKey: "mock-anon-key",
  })),
  getOptionalPublicSupabaseEnv: vi.fn(),
}));

type BrowserClient = ReturnType<typeof createClient>;

describe("supabase clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicSupabaseEnv).mockReturnValue({
      url: "https://mock-server.supabase.co",
      anonKey: "mock-anon-key",
    });
  });

  describe("createClient", () => {
    it("creates a browser client with public env url and anon key", () => {
      const client = createClient();

      expect(getPublicSupabaseEnv).toHaveBeenCalledTimes(1);
      expect(createBrowserClient).toHaveBeenCalledWith(
        "https://mock-server.supabase.co",
        "mock-anon-key",
      );
      expect(client).toMatchObject({
        url: "https://mock-server.supabase.co",
        anonKey: "mock-anon-key",
      });
    });
  });

  describe("createOptionalClient", () => {
    it("returns null when public env is unavailable", () => {
      vi.mocked(getOptionalPublicSupabaseEnv).mockReturnValue(null);

      expect(createOptionalClient()).toBeNull();
      expect(createBrowserClient).not.toHaveBeenCalled();
    });

    it("creates a browser client when optional public env is present", () => {
      vi.mocked(getOptionalPublicSupabaseEnv).mockReturnValue({
        url: "https://opt.supabase.co",
        anonKey: "opt-anon",
      });

      const client = createOptionalClient();

      expect(client).not.toBeNull();
      expect(createBrowserClient).toHaveBeenCalledWith(
        "https://opt.supabase.co",
        "opt-anon",
      );
      expect(client).toMatchObject({
        url: "https://opt.supabase.co",
        anonKey: "opt-anon",
      });
    });
  });

  describe("getBrowserSessionUser", () => {
    it("returns the auth user on success", async () => {
      const mockUser = { id: "user-123" } as User;
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      } as unknown as BrowserClient;

      await expect(getBrowserSessionUser(mockClient)).resolves.toEqual(mockUser);
    });

    it("returns null when there is no session user", async () => {
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as unknown as BrowserClient;

      await expect(getBrowserSessionUser(mockClient)).resolves.toBeNull();
    });

    it("throws when getUser returns an error", async () => {
      const mockError = new Error("Auth error");
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: mockError }),
        },
      } as unknown as BrowserClient;

      await expect(getBrowserSessionUser(mockClient)).rejects.toThrow("Auth error");
    });
  });

  describe("createServerClient cookie adapter", () => {
    it("wires getAll/setAll through the cookie store with public env", async () => {
      const mockCookieStore = await cookies();
      const sessionCookie: RequestCookie = { name: "session", value: "xyz" };
      vi.mocked(mockCookieStore.getAll).mockReturnValue([sessionCookie]);

      await createServerClient();

      expect(createSSRClient).toHaveBeenCalledWith(
        "https://mock-server.supabase.co",
        "mock-anon-key",
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        }),
      );

      const cookiesConfig = vi.mocked(createSSRClient).mock.calls[0]?.[2]?.cookies;
      expect(cookiesConfig?.getAll?.()).toEqual([sessionCookie]);

      cookiesConfig?.setAll?.(
        [{ name: "new-cookie", value: "val", options: { path: "/" } }],
        {},
      );
      expect(mockCookieStore.set).toHaveBeenCalledWith("new-cookie", "val", {
        path: "/",
      });
    });

    it("swallows setAll errors from Server Component contexts", async () => {
      const mockCookieStore = await cookies();
      vi.mocked(mockCookieStore.set).mockImplementation(() => {
        throw new Error("Cannot set headers");
      });

      await createServerClient();
      const cookiesConfig = vi.mocked(createSSRClient).mock.calls[0]?.[2]?.cookies;

      expect(() => {
        cookiesConfig?.setAll?.(
          [{ name: "new-cookie", value: "val", options: {} }],
          {},
        );
      }).not.toThrow();
    });
  });
});
