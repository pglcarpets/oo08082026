import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { locales } from "@/i18n/config";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..", "site");
const messagesDir = path.join(siteRoot, "i18n", "messages");
const manifestPath = path.join(siteRoot, "i18n", "marketing-parity-manifest.json");

type JsonObject = { [key: string]: JsonValue };
type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

type MarketingParityManifest = {
  allMarketingNamespaces: string[];
  wave1Locales: string[];
  parityLocales: string[];
  wave1Namespaces: string[];
  deferredLocales: string[];
};

function loadJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function collectKeys(value: JsonValue, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }
  const keys: string[] = [];
  for (const [key, child] of Object.entries(value)) {
    const next = prefix ? `${prefix}.${key}` : key;
    keys.push(...collectKeys(child as JsonValue, next));
  }
  return keys;
}

function subtree(messages: JsonObject, namespace: string): JsonValue | undefined {
  return namespace.split(".").reduce<JsonValue | undefined>((node, part) => {
    if (node === null || node === undefined || typeof node !== "object" || Array.isArray(node)) {
      return undefined;
    }
    return (node as JsonObject)[part];
  }, messages);
}

function namespacesForLocale(manifest: MarketingParityManifest, locale: string): string[] {
  if (locale === "hi") return manifest.wave1Namespaces;
  if (manifest.deferredLocales.includes(locale)) return manifest.allMarketingNamespaces;
  return manifest.wave1Namespaces;
}

function loadLocaleMessages(locale: string): JsonObject {
  const file = path.join(messagesDir, `${locale}.json`);
  expect(fs.existsSync(file), `missing message file for ${locale}`).toBe(true);
  const parsed = loadJson(file);
  expect(parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)).toBe(true);
  return parsed as JsonObject;
}

describe("i18n/messages", () => {
  const manifest = loadJson(manifestPath) as MarketingParityManifest;
  const enMessages = loadLocaleMessages("en");

  it("ships a message file for every routing locale", () => {
    for (const locale of locales) {
      const file = path.join(messagesDir, `${locale}.json`);
      expect(fs.existsSync(file), `expected i18n/messages/${locale}.json`).toBe(true);
      const parsed = loadJson(file);
      expect(parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)).toBe(true);
    }
  });

  it("keeps marketing key parity vs en for each parity locale per manifest scope", () => {
    const parityLocales =
      manifest.parityLocales ??
      manifest.wave1Locales.filter((locale) => locale !== "en");

    for (const locale of parityLocales) {
      const localeMessages = loadLocaleMessages(locale);
      for (const namespace of namespacesForLocale(manifest, locale)) {
        const baseSubtree = subtree(enMessages, namespace);
        expect(baseSubtree, `en missing namespace ${namespace}`).toBeDefined();

        const localeSubtree = subtree(localeMessages, namespace);
        expect(localeSubtree, `${locale} missing namespace ${namespace}`).toBeDefined();

        const baseKeys = new Set(collectKeys(baseSubtree as JsonValue, namespace));
        const localeKeys = new Set(collectKeys(localeSubtree as JsonValue, namespace));

        const missing = [...baseKeys].filter((key) => !localeKeys.has(key));
        const extra = [...localeKeys].filter((key) => !baseKeys.has(key));

        expect(missing, `${locale}/${namespace} missing keys`).toEqual([]);
        expect(extra, `${locale}/${namespace} extra keys`).toEqual([]);
      }
    }
  });

  it("ships hi wave1 marketing plus live consumer namespaces news/legal/workspace", () => {
    const hiMessages = loadLocaleMessages("hi");
    const hiTopLevel = Object.keys(hiMessages);

    for (const namespace of manifest.wave1Namespaces) {
      expect(hiTopLevel, `hi missing wave1 namespace ${namespace}`).toContain(namespace);
    }

    // Live routes require these beyond pure wave1 marketing parity.
    for (const namespace of ["workspace", "news", "legal"] as const) {
      expect(hiTopLevel, `hi missing live consumer namespace ${namespace}`).toContain(
        namespace,
      );
    }
  });
});

