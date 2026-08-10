import { describe, expect, it } from "vitest";
import {
  DEFAULT_TECH_DOCS_URL,
  DEV_TECH_DOCS_URL,
  getTechDocsPublicUrl,
  isExternalAdminHref,
} from "@/lib/admin/techDocsUrl";

describe("techDocsUrl", () => {
  it("defaults to localhost:3001 in non-production (dev tech-docs port)", () => {
    expect(getTechDocsPublicUrl({ NODE_ENV: "development" })).toBe(
      DEV_TECH_DOCS_URL,
    );
    expect(getTechDocsPublicUrl({})).toBe(DEV_TECH_DOCS_URL);
    expect(DEV_TECH_DOCS_URL).toBe("http://localhost:3001");
  });

  it("defaults to techdocsgenerator Vercel host in production", () => {
    expect(getTechDocsPublicUrl({ NODE_ENV: "production" })).toBe(
      DEFAULT_TECH_DOCS_URL,
    );
    // docs.oando.co.in is Cloudflare 525 until DNS/SSL (OPS-S01); use working SPA host.
    expect(DEFAULT_TECH_DOCS_URL).toBe("https://techdocsgenerator.vercel.app");
  });

  it("uses NEXT_PUBLIC_TECH_DOCS_URL when set", () => {
    expect(
      getTechDocsPublicUrl({
        NODE_ENV: "production",
        NEXT_PUBLIC_TECH_DOCS_URL: "http://localhost:3001/",
      }),
    ).toBe("http://localhost:3001");
    expect(
      getTechDocsPublicUrl({
        NEXT_PUBLIC_TECH_DOCS_URL: "https://docs.example.com/app/",
      }),
    ).toBe("https://docs.example.com/app");
  });

  it("rejects non-http schemes (falls back by env)", () => {
    expect(
      getTechDocsPublicUrl({
        NODE_ENV: "production",
        NEXT_PUBLIC_TECH_DOCS_URL: "javascript:alert(1)",
      }),
    ).toBe(DEFAULT_TECH_DOCS_URL);
    expect(
      getTechDocsPublicUrl({
        NODE_ENV: "development",
        NEXT_PUBLIC_TECH_DOCS_URL: "javascript:alert(1)",
      }),
    ).toBe(DEV_TECH_DOCS_URL);
  });

  it("detects external admin hrefs", () => {
    expect(isExternalAdminHref("https://docs.oando.co.in")).toBe(true);
    expect(isExternalAdminHref("http://localhost:3001")).toBe(true);
    expect(isExternalAdminHref("/admin/settings")).toBe(false);
  });
});
