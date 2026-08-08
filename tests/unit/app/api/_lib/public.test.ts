import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getPublicApiIp, enforcePublicApiRateLimit } from "@/app/api/_lib/public";
import { rateLimit } from "@/lib/rateLimit";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

describe("app/api/_lib/public.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPublicApiIp", () => {
    it("prefers cf-connecting-ip", () => {
      const req = new NextRequest("http://localhost", {
        headers: { "cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" },
      });
      expect(getPublicApiIp(req)).toBe("1.2.3.4");
    });

    it("falls back to first x-forwarded-for entry", () => {
      const req = new NextRequest("http://localhost", {
        headers: { "x-forwarded-for": "10.0.0.1, 192.168.1.1" },
      });
      expect(getPublicApiIp(req)).toBe("10.0.0.1");
    });

    it("defaults to localhost when no proxy headers", () => {
      const req = new NextRequest("http://localhost");
      expect(getPublicApiIp(req)).toBe("localhost");
    });
  });

  describe("enforcePublicApiRateLimit", () => {
    it("returns null when rate limit allows the request", async () => {
      vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: true, reset: 123  }));
      const req = new NextRequest("http://localhost", {
        headers: { "cf-connecting-ip": "8.8.8.8" },
      });

      const result = await enforcePublicApiRateLimit(req, "test-scope", 60);
      expect(result).toBeNull();
      expect(rateLimit).toHaveBeenCalledWith("public:test-scope:8.8.8.8", 60, 60 * 1000);
    });

    it("returns 429 JSON when rate limit is exceeded", async () => {
      vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: false, reset: 999  }));
      const req = new NextRequest("http://localhost");

      const result = await enforcePublicApiRateLimit(req, "products:get", 40);
      expect(result).not.toBeNull();
      expect(result!.status).toBe(429);
      const body = await result!.json();
      expect(body.error).toBe("Too many requests");
      expect(result!.headers.get("X-RateLimit-Reset")).toBe("999");
    });
  });
});
