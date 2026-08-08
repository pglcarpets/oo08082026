/**
 * Name-mirror: site/app/robots.ts
 * Host must follow SITE_URL / env — never hardcoded localhost.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ROBOTS_DISALLOW_PREFIXES } from "@/features/site/data/routeClassification";

describe("app/robots.ts", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("disallows protected prefixes and points sitemap at SITE_URL host", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.SITE_URL;

    const robots = (await import("@/app/robots")).default;
    const config = robots();
    const host = String(config.host ?? "");
    const sitemap = String(config.sitemap?.[0] ?? "");
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const firstRule = rules[0];
    expect(firstRule?.userAgent).toBe("*");
    expect(firstRule?.disallow).toEqual([...ROBOTS_DISALLOW_PREFIXES]);
    expect(host).toBe("https://oando.co.in");
    expect(sitemap).toBe("https://oando.co.in/sitemap.xml");
    expect(host).not.toMatch(/localhost|127\.0\.0\.1/i);
    expect(sitemap).not.toMatch(/localhost|127\.0\.0\.1/i);
  });

  it("uses NEXT_PUBLIC_SITE_URL host when configured (not localhost)", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://seo-host.example.com///";
    delete process.env.SITE_URL;

    const robots = (await import("@/app/robots")).default;
    const config = robots();
    const host = String(config.host ?? "");
    const sitemap = String(config.sitemap?.[0] ?? "");

    expect(host).toBe("https://seo-host.example.com");
    expect(sitemap).toBe("https://seo-host.example.com/sitemap.xml");
    expect(host).not.toMatch(/localhost|127\.0\.0\.1/i);
  });

  it("falls back to production origin for vercel.app preview domains", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://oando-git-main.vercel.app";
    delete process.env.SITE_URL;

    const robots = (await import("@/app/robots")).default;
    const config = robots();

    expect(String(config.host ?? "")).toBe("https://oando.co.in");
    expect(String(config.sitemap?.[0] ?? "")).toBe("https://oando.co.in/sitemap.xml");
  });

  it("falls back to production origin when env is localhost", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    delete process.env.SITE_URL;

    const robots = (await import("@/app/robots")).default;
    const config = robots();

    expect(String(config.host ?? "")).toBe("https://oando.co.in");
    expect(String(config.sitemap?.[0] ?? "")).not.toMatch(/localhost|127\.0\.0\.1/i);
  });
});
