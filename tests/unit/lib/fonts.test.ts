/**
 * Name-mirror coverage for lib/fonts.
 * next/font/local is globally mocked in tests/setup.ts.
 */
import { describe, expect, it } from "vitest";
import {
  ciscoSans,
  helveticaNeue,
  resolveLoadedSansFamily,
  resolveLoadedSansFamilyShort,
} from "@/lib/fonts";

describe("fonts", () => {
  it("exports ciscoSans and helveticaNeue font objects", () => {
    expect(ciscoSans).toBeDefined();
    expect(helveticaNeue).toBeDefined();
    expect(typeof ciscoSans.className).toBe("string");
    expect(typeof helveticaNeue.className).toBe("string");
  });

  it("provides style.fontFamily for layout consumers", () => {
    expect(ciscoSans.style?.fontFamily).toBeDefined();
    expect(helveticaNeue.style?.fontFamily).toBeDefined();
  });

  it("resolves Helvetica Neue for canvas without Inter", () => {
    const family = resolveLoadedSansFamily();
    const short = resolveLoadedSansFamilyShort();
    expect(family.toLowerCase()).not.toContain("inter");
    expect(short.toLowerCase()).not.toContain("inter");
    expect(family.length).toBeGreaterThan(0);
    expect(short.length).toBeGreaterThan(0);
  });
});
