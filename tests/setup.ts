import "@testing-library/jest-dom/vitest";
import { webcrypto } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { MockNextImage } from "./helpers/mockNextImage";
import { MockNextLink } from "./helpers/mockNextLink";

/**
 * Vitest is launched from monorepo root, but product paths (app/, features/, …)
 * live under site/. Align cwd with vitest `root` so process.cwd() + "app/…" works.
 * Absolute monorepo paths (fileURLToPath-based) are unaffected.
 */
const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sitePackageRoot = path.join(monorepoRoot, "site");
if (process.cwd() !== sitePackageRoot) {
  process.chdir(sitePackageRoot);
}

// happy-dom has no Web Crypto; Node's implementation is test-only (never bundled for browser).
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js font modules — they use Node APIs unavailable in happy-dom
vi.mock("next/font/local", () => ({
  default: () => ({ className: "mock-font", style: { fontFamily: "mock" } }),
}));
vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "mock-font", style: { fontFamily: "mock" } }),
  Outfit: () => ({ className: "mock-font", style: { fontFamily: "mock" } }),
}));

// server-only is a no-op in tests
vi.mock("server-only", () => ({}));

vi.mock("next/image", () => ({
  default: MockNextImage,
}));

vi.mock("next/link", () => ({
  default: MockNextLink,
}));

import enMessages from "../site/i18n/messages/en.json";

vi.mock("next-intl", () => {
  const getNestedValue = (obj: Record<string, unknown> | unknown, path: string): unknown => {
    return path.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  };

  const makeTranslator = (namespace?: string) => {
    const t = (key: string, values?: Record<string, unknown>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      let text = getNestedValue(enMessages, fullKey) ?? fullKey;
      if (typeof text === "string" && values) {
        Object.entries(values).forEach(([k, v]) => {
          text = (text as string).replace(`{${k}}`, String(v));
        });
      }
      return text;
    };
    (t as typeof t & { raw: (key: string) => unknown }).raw = (key: string) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return getNestedValue(enMessages, fullKey);
    };
    return t;
  };

  return {
    useTranslations: (namespace?: string) => makeTranslator(namespace),
    getTranslations: async (namespace?: string) => makeTranslator(namespace),
    useLocale: () => "en",
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock("next-intl/server", () => ({
    getTranslations: async (namespace?: string) => {
      const t = (key: string, values?: Record<string, unknown>) => {
        const fullKey = namespace ? `${namespace}.${key}` : key;
        let text = fullKey as string;
        if (values) {
          Object.entries(values).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, String(v));
          });
        }
        return text;
      };
      (t as typeof t & { raw: (key: string) => unknown }).raw = (key: string) => {
        const fullKey = namespace ? `${namespace}.${key}` : key;
        const parts = fullKey.split(".");
        let current: unknown = enMessages;
        for (const part of parts) {
          if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
            current = (current as Record<string, unknown>)[part];
          } else {
            return [];
          }
        }
        return current;
      };
      return t;
    },
  getMessages: async () => enMessages,
  getLocale: async () => "en",
}));
