// @vitest-environment node
/**
 * Name-mirror: i18n/request.ts
 * getRequestConfig resolves locale from cookie → Accept-Language → default,
 * and returns messages for that locale.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

type RequestConfigResult = {
  locale: string;
  messages: Record<string, unknown>;
};

type RequestConfigFactory = () => Promise<RequestConfigResult>;

const cookiesMock = vi.fn();
const headersMock = vi.fn();
let capturedFactory: RequestConfigFactory | undefined;

vi.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
  headers: () => headersMock(),
}));

vi.mock("next-intl/server", () => ({
  getRequestConfig: (factory: RequestConfigFactory) => {
    capturedFactory = factory;
    return factory;
  },
}));

function cookieStore(nextLocale: string | undefined) {
  return {
    get(name: string) {
      if (name === "NEXT_LOCALE" && nextLocale !== undefined) {
        return { name: "NEXT_LOCALE", value: nextLocale };
      }
      return undefined;
    },
  };
}

function headerStore(acceptLanguage: string | null) {
  return {
    get(name: string) {
      if (name.toLowerCase() === "accept-language") {
        return acceptLanguage;
      }
      return null;
    },
  };
}

async function loadRequestFactory(): Promise<RequestConfigFactory> {
  capturedFactory = undefined;
  vi.resetModules();
  const mod = await import("@/i18n/request");
  const exported = mod.default as RequestConfigFactory;
  expect(typeof exported).toBe("function");
  if (capturedFactory === undefined) {
    throw new Error("getRequestConfig did not capture factory");
  }
  return capturedFactory;
}

describe("i18n/request.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue(cookieStore(undefined));
    headersMock.mockResolvedValue(headerStore(null));
  });

  it("uses defaultLocale when cookie and Accept-Language are absent", async () => {
    const factory = await loadRequestFactory();
    const result = await factory();

    expect(result.locale).toBe(defaultLocale);
    expect(result.messages).toBeDefined();
    expect(typeof result.messages).toBe("object");
    expect(Object.keys(result.messages).length).toBeGreaterThan(0);
  });

  it("prefers valid NEXT_LOCALE cookie over Accept-Language", async () => {
    const cookieLocale: Locale = "fr";
    cookiesMock.mockResolvedValue(cookieStore(cookieLocale));
    headersMock.mockResolvedValue(headerStore("de-DE,de;q=0.9"));

    const factory = await loadRequestFactory();
    const result = await factory();

    expect(result.locale).toBe(cookieLocale);
    expect(result.messages).toBeDefined();
    expect(typeof result.messages).toBe("object");
  });

  it("falls back to Accept-Language primary tag when cookie missing", async () => {
    cookiesMock.mockResolvedValue(cookieStore(undefined));
    headersMock.mockResolvedValue(headerStore("de-DE,de;q=0.9,en;q=0.8"));

    const factory = await loadRequestFactory();
    const result = await factory();

    expect(result.locale).toBe("de");
    expect((locales as readonly string[]).includes(result.locale)).toBe(true);
  });

  it("ignores invalid NEXT_LOCALE cookie and uses Accept-Language", async () => {
    cookiesMock.mockResolvedValue(cookieStore("xx-invalid"));
    headersMock.mockResolvedValue(headerStore("es-ES,es;q=0.9"));

    const factory = await loadRequestFactory();
    const result = await factory();

    expect(result.locale).toBe("es");
  });

  it("falls back to defaultLocale when Accept-Language is unsupported", async () => {
    cookiesMock.mockResolvedValue(cookieStore(undefined));
    headersMock.mockResolvedValue(headerStore("ja-JP,ja;q=0.9"));

    const factory = await loadRequestFactory();
    const result = await factory();

    expect(result.locale).toBe(defaultLocale);
  });

  it("loads messages for each supported locale", async () => {
    for (const locale of locales) {
      cookiesMock.mockResolvedValue(cookieStore(locale));
      headersMock.mockResolvedValue(headerStore(null));

      const factory = await loadRequestFactory();
      const result = await factory();

      expect(result.locale).toBe(locale);
      expect(result.messages).toBeDefined();
      expect(typeof result.messages).toBe("object");
      expect(Object.keys(result.messages).length).toBeGreaterThan(0);
    }
  });
});
