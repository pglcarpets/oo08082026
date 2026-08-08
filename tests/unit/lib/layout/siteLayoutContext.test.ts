/**
 * Name-mirror coverage for lib/layout/siteLayoutContext.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMessages = vi.fn();
const getLocale = vi.fn();

vi.mock("next-intl/server", () => ({
  getMessages: () => getMessages(),
  getLocale: () => getLocale(),
}));

vi.mock("@/lib/i18n/htmlLang", () => ({
  getHtmlLang: (locale: string) => (locale === "hi" ? "hi-IN" : "en-IN"),
}));

describe("getSiteLayoutContext", () => {
  beforeEach(() => {
    vi.resetModules();
    getMessages.mockReset();
    getLocale.mockReset();
  });

  it("returns messages, locale, and html lang together", async () => {
    getMessages.mockResolvedValue({ Home: { title: "Home" } });
    getLocale.mockResolvedValue("hi");

    const { getSiteLayoutContext } = await import(
      "@/lib/layout/siteLayoutContext"
    );
    const ctx = await getSiteLayoutContext();

    expect(ctx.messages).toEqual({ Home: { title: "Home" } });
    expect(ctx.locale).toBe("hi");
    expect(ctx.lang).toBe("hi-IN");
  });

  it("maps english locale to en-IN", async () => {
    getMessages.mockResolvedValue({});
    getLocale.mockResolvedValue("en");

    const { getSiteLayoutContext } = await import(
      "@/lib/layout/siteLayoutContext"
    );
    const ctx = await getSiteLayoutContext();
    expect(ctx.locale).toBe("en");
    expect(ctx.lang).toBe("en-IN");
  });
});
