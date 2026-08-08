import { describe, it, expect } from "vitest";
import { sanitizeNextPath, buildAccessRedirect } from "@/lib/auth/plannerRedirect";

/** Post-sign-in default hub (not guest chooser, not Portal). */
const DEFAULT_AFTER_AUTH = "/dashboard";

describe("plannerRedirect", () => {
  it("sanitizes next paths correctly", () => {
    expect(sanitizeNextPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeNextPath("http://external.com")).toBe(DEFAULT_AFTER_AUTH);
    expect(sanitizeNextPath("//malicious")).toBe(DEFAULT_AFTER_AUTH);
    expect(sanitizeNextPath(null)).toBe(DEFAULT_AFTER_AUTH);
  });

  it("rejects open-redirect and path-injection variants", () => {
    expect(sanitizeNextPath("/\\evil.com")).toBe(DEFAULT_AFTER_AUTH);
    expect(sanitizeNextPath("/%2f%2fevil.com")).toBe(DEFAULT_AFTER_AUTH);
    expect(sanitizeNextPath("/%5cevil")).toBe(DEFAULT_AFTER_AUTH);
    expect(sanitizeNextPath("/path@evil")).toBe(DEFAULT_AFTER_AUTH);
    expect(sanitizeNextPath("/foo\u0000bar")).toBe(DEFAULT_AFTER_AUTH);
    expect(sanitizeNextPath("  /portal/guest  ")).toBe("/portal/guest");
    expect(sanitizeNextPath("javascript:alert(1)")).toBe(DEFAULT_AFTER_AUTH);
  });

  it("builds access redirect URLs with dashboard as default next", () => {
    expect(buildAccessRedirect("/dashboard")).toBe("/access?next=%2Fdashboard");
    expect(buildAccessRedirect(null)).toBe("/access?next=%2Fdashboard");
  });
});
