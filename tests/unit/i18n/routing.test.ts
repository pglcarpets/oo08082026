import { describe, expect, it } from "vitest";

import { routing } from "@/i18n/routing";
import { defaultLocale, locales } from "@/i18n/config";

describe("i18n/routing", () => {
  it("exposes a non-empty locales list", () => {
    expect(Array.isArray(routing.locales)).toBe(true);
    expect(routing.locales.length).toBeGreaterThan(0);
  });

  it("keeps defaultLocale inside locales", () => {
    expect(routing.locales).toContain(routing.defaultLocale);
  });

  it("defines localePrefix", () => {
    expect(routing.localePrefix).toBeDefined();
    expect(typeof routing.localePrefix === "string" || typeof routing.localePrefix === "object").toBe(
      true,
    );
  });

  it("mirrors config locales and defaultLocale", () => {
    expect([...routing.locales]).toEqual([...locales]);
    expect(routing.defaultLocale).toBe(defaultLocale);
  });
});
