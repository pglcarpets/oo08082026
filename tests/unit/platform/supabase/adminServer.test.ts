import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  createAdminServiceClient,
  getClientIp,
  isMissingTableError,
} from "@/platform/supabase/adminServer";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth: { persistSession: false } })),
}));

describe("platform/supabase/adminServer.ts", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getClientIp", () => {
    it("reads cf-connecting-ip first", () => {
      const req = new NextRequest("http://localhost", {
        headers: { "cf-connecting-ip": "1.1.1.1" },
      });
      expect(getClientIp(req)).toBe("1.1.1.1");
    });
  });

  describe("isMissingTableError", () => {
    it("detects missing table messages", () => {
      expect(isMissingTableError("relation foo does not exist")).toBe(true);
      expect(isMissingTableError("Could not find the table public.foo")).toBe(true);
      expect(isMissingTableError("permission denied for table foo")).toBe(true);
      expect(isMissingTableError("connection timeout")).toBe(false);
    });
  });

  describe("createAdminServiceClient", () => {
    it("returns null when service env is missing", () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(createAdminServiceClient()).toBeNull();
    });

    it("returns a client when env is configured", () => {
      process.env.SUPABASE_URL = "https://example.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
      expect(createAdminServiceClient()).not.toBeNull();
    });
  });
});