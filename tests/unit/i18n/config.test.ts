import { describe, expect, it } from "vitest";

import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { routing } from "@/i18n/routing";

describe("i18n/config", () => {
  it("exports a non-empty locales array", () => {
    expect(locales.length).toBeGreaterThan(0);
  });

  it("exports defaultLocale that is a member of locales", () => {
    expect((locales as readonly string[]).includes(defaultLocale)).toBe(true);
  });

  it("matches routing locales and defaultLocale", () => {
    expect([...locales]).toEqual([...routing.locales]);
    expect(defaultLocale).toBe(routing.defaultLocale);
  });

  it("uses English as the product default locale", () => {
    const expected: Locale = "en";
    expect(defaultLocale).toBe(expected);
  });
});
