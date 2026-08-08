import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { MockNextImage } from "./helpers/mockNextImage";
import { MockNextLink } from "./helpers/mockNextLink";

try {
  (globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  }
} catch {}

try {
  const g = globalThis as unknown as Record<string, unknown>;
  const actStub = (cb: () => unknown): unknown => {
    const prev = g.IS_REACT_ACT_ENVIRONMENT;
    g.IS_REACT_ACT_ENVIRONMENT = true;
    try {
      const result = cb() as unknown as { then?: unknown } | null;
      if (result !== null && typeof result === "object" && typeof (result as { then?: unknown }).then === "function") {
        const p = result as Promise<unknown>;
        return {
          then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
            p.then(
              (v) => {
                g.IS_REACT_ACT_ENVIRONMENT = prev;
                resolve(v);
              },
              (e) => {
                g.IS_REACT_ACT_ENVIRONMENT = prev;
                reject(e);
              },
            ),
        };
      }
      g.IS_REACT_ACT_ENVIRONMENT = prev;
      return result;
    } catch (e) {
      g.IS_REACT_ACT_ENVIRONMENT = prev;
      throw e;
    }
  };
  const patchAct = (ns: Record<string, unknown>) => {
    const desc = (() => {
      try {
        return Object.getOwnPropertyDescriptor(ns, "act");
      } catch {
        return undefined;
      }
    })();
    const isBroken = typeof ns.act !== "function" || (desc !== undefined && desc.configurable === false && desc.value === undefined);
    if (!isBroken) return;
    if (desc !== undefined && desc.configurable === false) {
      const proto = (() => {
        try {
          return Object.getPrototypeOf(ns) as unknown as Record<string, unknown> | null;
        } catch {
          return null;
        }
      })();
      if (proto && !Object.prototype.hasOwnProperty.call(proto, "act")) {
        try {
          Object.defineProperty(proto, "act", { value: actStub, configurable: true, writable: true });
        } catch {}
      }
      try {
        Object.defineProperty(ns, "__reactActPolyfill", { value: actStub, configurable: true, writable: true });
      } catch {
        try {
          ns.__reactActPolyfill = actStub;
        } catch {}
      }
      if (typeof ns.act !== "function") {
        try {
          const alt: Record<string, unknown> = { ...ns, act: actStub };
          for (const k of Object.keys(alt)) {
            if (!(k in ns)) (ns as Record<string, unknown>)[k as string] = alt[k];
          }
        } catch {}
      }
    } else {
      try {
        Object.defineProperty(ns, "act", { value: actStub, configurable: true, writable: true });
      } catch {
        ns.act = actStub;
      }
    }
  };
  const ReactESM = await import("react");
  patchAct((ReactESM as unknown as { default?: Record<string, unknown> }).default ?? (ReactESM as unknown as Record<string, unknown>));
  try {
    const ReactCjs = eval("require")("react") as Record<string, unknown>;
    patchAct(ReactCjs);
    patchAct((ReactCjs as unknown as { default?: Record<string, unknown> }).default ?? ReactCjs);
  } catch {}
  try {
    const rdom = (await import("react-dom/test-utils")) as unknown as Record<string, unknown>;
    const cur = rdom.act;
    if (typeof cur === "function" && String(cur).includes("React.act")) {
      try {
        Object.defineProperty(rdom, "act", { value: actStub, configurable: true, writable: true });
      } catch {
        rdom.act = actStub;
      }
    }
  } catch {}
  try {
    const rdomCjs = eval("require")("react-dom/test-utils") as Record<string, unknown>;
    const cur = rdomCjs.act;
    if (typeof cur === "function" && String(cur).includes("React.act")) {
      try {
        Object.defineProperty(rdomCjs, "act", { value: actStub, configurable: true, writable: true });
      } catch {
        rdomCjs.act = actStub;
      }
    }
  } catch {}
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
