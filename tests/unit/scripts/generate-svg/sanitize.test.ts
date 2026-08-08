import { describe, expect, it } from "vitest";

import { isSvgSafe, sanitizeSvg } from "@/lib/security/svgSanitizer";

describe("svg sanitizer", () => {
  const cleanSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100"/></svg>`;

  it("accepts clean svg and fragment-only use references", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><symbol id="shape"><rect width="10" height="10"/></symbol></defs><use href="#shape"/></svg>`;
    const result = sanitizeSvg(svg);
    expect(result.safe).toBe(true);
    expect(isSvgSafe(svg)).toBe(true);
  });

  it("rejects script elements", () => {
    const result = sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`);
    expect(result.safe).toBe(false);
    expect(result.issues[0] ?? "").toMatch(/script/);
  });

  it("rejects inline event handlers", () => {
    const result = sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg"><rect onclick="bad()"/></svg>`);
    expect(result.safe).toBe(false);
    expect(result.issues[0] ?? "").toMatch(/blocked attribute|blocked event attribute/);
  });

  it("rejects foreignObject", () => {
    const result = sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div/></foreignObject></svg>`);
    expect(result.safe).toBe(false);
  });

  it("rejects javascript urls in href attributes", () => {
    const result = sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg"><image href="javascript:alert(1)"/></svg>`);
    expect(result.safe).toBe(false);
    expect(result.issues[0] ?? "").toMatch(/unsafe URL reference/);
  });

  it("rejects external use references", () => {
    const result = sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg"><use href="https://example.com/icon.svg#shape"/></svg>`);
    expect(result.safe).toBe(false);
    expect(result.issues[0] ?? "").toMatch(/unsafe URL reference/);
  });

  it("rejects oversized attribute values", () => {
    const oversized = `<svg xmlns="http://www.w3.org/2000/svg"><rect data-label="${"x".repeat(4_100)}"/></svg>`;
    const result = sanitizeSvg(oversized);
    expect(result.safe).toBe(false);
    expect(result.issues[0] ?? "").toMatch(/oversized attribute value/);
  });

  it("rejects malformed roots", () => {
    expect(sanitizeSvg(`<div>no svg</div>`).safe).toBe(false);
    expect(sanitizeSvg(cleanSvg.replace("</svg>", "")).safe).toBe(false);
  });
});
