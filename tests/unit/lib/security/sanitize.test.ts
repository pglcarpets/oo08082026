import { describe, it, expect } from "vitest";
import {
  sanitizeJsonForScript,
  sanitizeInlineSvg,
} from "@/lib/security/sanitize";

describe("sanitize security utilities", () => {
  describe("sanitizeJsonForScript", () => {
    it("escapes angle brackets and ampersand in stringified JSON", () => {
      const input = { msg: "<script>alert(1)</script> & more" };
      const result = sanitizeJsonForScript(input);
      expect(result).toBe('{"msg":"\\u003cscript\\u003ealert(1)\\u003c/script\\u003e \\u0026 more"}');
    });

    it("returns JSON without changes when no special chars present", () => {
      const input = { safe: "hello world 123", num: 42 };
      const result = sanitizeJsonForScript(input);
      expect(result).toBe('{"safe":"hello world 123","num":42}');
    });

    it("handles array input and null/undefined values", () => {
      const input = [null, "a<b>c", undefined];
      const result = sanitizeJsonForScript(input);
      expect(result).toBe('[null,"a\\u003cb\\u003ec",null]');
    });

    it("escapes in nested structures", () => {
      const input = { html: "<div>&</div>" };
      const result = sanitizeJsonForScript(input);
      expect(result).toContain("\\u003cdiv\\u003e");
      expect(result).toContain("\\u0026");
    });
  });

  describe("sanitizeInlineSvg", () => {
    it("returns input unchanged when no script or handlers present", () => {
      const svg = '<svg><rect x="0" y="0" width="10" height="10"/></svg>';
      expect(sanitizeInlineSvg(svg)).toBe(svg);
    });

    it("removes script tags and their contents", () => {
      const svg = '<svg><script>evil()</script><circle/></svg>';
      const result = sanitizeInlineSvg(svg);
      expect(result).not.toContain("<script");
      expect(result).not.toContain("evil()");
      expect(result).toContain("<circle/>");
    });

    it("removes self-closing script and foreignObject nodes", () => {
      const svg =
        '<svg><script src="evil.js"/><foreignObject width="1" height="1"/><circle/></svg>';
      const result = sanitizeInlineSvg(svg);
      expect(result).not.toContain("<script");
      expect(result).not.toContain("foreignObject");
      expect(result).toContain("<circle/>");
    });

    it("removes paired foreignObject hosts", () => {
      const svg =
        '<svg><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><script>x()</script></body></foreignObject><rect/></svg>';
      const result = sanitizeInlineSvg(svg);
      expect(result).not.toContain("foreignObject");
      expect(result).not.toContain("<script");
      expect(result).toContain("<rect/>");
    });

    it("removes inline event handlers with double quotes", () => {
      const svg = '<svg><rect onclick="doBad()" /></svg>';
      const result = sanitizeInlineSvg(svg);
      expect(result).not.toContain("onclick");
      expect(result).not.toContain("doBad");
      expect(result).toContain("<rect ");
    });

    it("removes inline event handlers with single quotes", () => {
      const svg = "<svg><g onmouseover='bad()'></g></svg>";
      const result = sanitizeInlineSvg(svg);
      expect(result).not.toContain("onmouseover");
      expect(result).not.toContain("bad()");
    });

    it("removes inline event handlers without quotes", () => {
      const svg = '<svg><path onfocus=alert(1) /></svg>';
      const result = sanitizeInlineSvg(svg);
      expect(result).not.toContain("onfocus");
      expect(result).not.toContain("alert(1)");
    });

    it("removes javascript: protocol references", () => {
      const svg = '<svg><a href="javascript:evil()"/></svg>';
      const result = sanitizeInlineSvg(svg);
      expect(result).not.toContain("javascript:");
      expect(result).toContain('href="');
    });

    it("handles empty string and multiple issues combined", () => {
      expect(sanitizeInlineSvg("")).toBe("");
      const dirty = '<svg><script>/* */</script><rect onclick="x()" onfoo=bar href="javascript:void(0)"/></svg>';
      const clean = sanitizeInlineSvg(dirty);
      expect(clean).not.toContain("<script");
      expect(clean).not.toContain("onclick");
      expect(clean).not.toContain("onfoo");
      expect(clean).not.toContain("javascript:");
    });
  });
});
