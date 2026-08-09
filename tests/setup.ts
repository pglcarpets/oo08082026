import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { MockNextImage } from "./helpers/mockNextImage";
import { MockNextLink } from "./helpers/mockNextLink";

type RequireLike = (id: string) => Record<string, unknown>;

let req: RequireLike | null = null;
try {
  const { createRequire } = await import("node:module");
  req = createRequire(import.meta.url) as RequireLike;
} catch {}

try {
  (globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  if (typeof window !== "undefined") (window as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  const g = globalThis as unknown as Record<string, unknown>;
  const actStub = (cb: () => unknown): unknown => {
    const prev = g.IS_REACT_ACT_ENVIRONMENT;
    g.IS_REACT_ACT_ENVIRONMENT = true;
    try {
      const res = cb();
      if (res !== null && typeof res === "object" && typeof (res as { then?: unknown }).then === "function") {
        return (res as Promise<unknown>).then(
          (v) => { g.IS_REACT_ACT_ENVIRONMENT = prev; return v; },
          (e) => { g.IS_REACT_ACT_ENVIRONMENT = prev; throw e; }
        );
      }
      g.IS_REACT_ACT_ENVIRONMENT = prev;
      return res;
    } catch (e) {
      g.IS_REACT_ACT_ENVIRONMENT = prev;
      throw e;
    }
  };
  for (const mid of ["react", "react/cjs/react.production.js", "react/cjs/react.development.js"]) {
    try {
      if (!req) continue;
      const mod = req(mid);
      const desc = (() => { try { return Object.getOwnPropertyDescriptor(mod, "act"); } catch { return undefined; } })();
      if (typeof mod.act !== "function" || (desc && desc.configurable === false && desc.value === undefined)) {
        const proto = (() => { try { return Object.getPrototypeOf(mod) as unknown as Record<string, unknown> | null; } catch { return null; } })();
        if (desc && desc.configurable === false && proto && !Object.prototype.hasOwnProperty.call(proto, "act")) {
          try { Object.defineProperty(proto, "act", { value: actStub, configurable: true, writable: true }); } catch {}
        }
        try { Object.defineProperty(mod, "act", { value: actStub, configurable: true, writable: true }); } catch { (mod as Record<string, unknown>).act = actStub; }
      }
    } catch {}
  }
  for (const mid of ["react-dom/test-utils", "react-dom/cjs/react-dom-test-utils.production.js", "react-dom/cjs/react-dom-test-utils.development.js"]) {
    try {
      if (!req) continue;
      const mod = req(mid);
      if (mod && typeof (mod as Record<string, unknown>).act === "function" && String((mod as Record<string, unknown>).act).includes("React.act")) {
        try { Object.defineProperty(mod, "act", { value: actStub, configurable: true, writable: true }); } catch { (mod as Record<string, unknown>).act = actStub; }
      }
    } catch {}
  }
} catch {}

try {
  const cwd = process.cwd().replace(/\\/g, "/");
  if (!cwd.endsWith("/site")) {
    const siteFromEnv = (process.env.VITEST_REPO_ROOT ?? "").replace(/\\/g, "/");
    if (siteFromEnv.endsWith("/site")) {
      try {
        process.chdir(siteFromEnv);
      } catch {}
    } else {
      const marker = "/site";
      const idx = cwd.lastIndexOf(marker);
      const base = idx >= 0 ? cwd.slice(0, idx + marker.length) : `${cwd}/site`;
      try {
        process.chdir(base);
      } catch {}
    }
  }
} catch {}

if (typeof globalThis.crypto === "undefined" || !globalThis.crypto?.subtle) {
  try {
    const { webcrypto } = await import("node:crypto");
    Object.defineProperty(globalThis, "crypto", {
      value: webcrypto as unknown as Crypto,
      configurable: true,
    });
  } catch {}
}

afterEach(() => {
  cleanup();
});

vi.mock("next/font/local", () => ({
  default: () => ({ className: "mock-font", style: { fontFamily: "mock" } }),
}));
vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "mock-font", style: { fontFamily: "mock" } }),
  Outfit: () => ({ className: "mock-font", style: { fontFamily: "mock" } }),
}));

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
