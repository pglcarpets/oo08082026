/**
 * Name-mirror coverage for lib/siteUrl.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("SITE_URL", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("defaults to production origin when no env is set", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.SITE_URL;

    const { SITE_URL } = await import("@/lib/siteUrl");
    expect(SITE_URL).toBe("https://oando.co.in");
  });

  it("uses NEXT_PUBLIC_SITE_URL and strips trailing slashes", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com///";
    delete process.env.SITE_URL;

    const { SITE_URL } = await import("@/lib/siteUrl");
    expect(SITE_URL).toBe("https://example.com");
  });

  it("falls back to production origin for vercel.app preview domains", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://oando-git-main.vercel.app";
    delete process.env.SITE_URL;

    const { SITE_URL } = await import("@/lib/siteUrl");
    expect(SITE_URL).toBe("https://oando.co.in");
  });

  it("rejects localhost and loopback hosts so SEO builders never leak them", async () => {
    for (const host of [
      "http://localhost:3000",
      "https://localhost",
      "http://127.0.0.1:3000",
      "http://[::1]:3000",
      "http://0.0.0.0:3000",
    ]) {
      vi.resetModules();
      process.env.NEXT_PUBLIC_SITE_URL = host;
      delete process.env.SITE_URL;
      const { SITE_URL } = await import("@/lib/siteUrl");
      expect(SITE_URL, host).toBe("https://oando.co.in");
      expect(SITE_URL).not.toMatch(/localhost|127\.0\.0\.1|0\.0\.0\.0|::1/i);
    }
  });

  it("rejects non-http schemes and invalid absolute URLs", async () => {
    for (const host of ["ftp://files.example.com", "not-a-url", "javascript:alert(1)"]) {
      vi.resetModules();
      process.env.NEXT_PUBLIC_SITE_URL = host;
      delete process.env.SITE_URL;
      const { SITE_URL } = await import("@/lib/siteUrl");
      expect(SITE_URL, host).toBe("https://oando.co.in");
    }
  });

  it("prefers NEXT_PUBLIC_SITE_URL over SITE_URL", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://public.example";
    process.env.SITE_URL = "https://private.example";

    const { SITE_URL } = await import("@/lib/siteUrl");
    expect(SITE_URL).toBe("https://public.example");
  });
});
