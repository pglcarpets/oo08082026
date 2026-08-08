import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { locales } from "@/i18n/config";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..", "site");
const manifestPath = path.join(siteRoot, "i18n", "marketing-parity-manifest.json");
const messagesDir = path.join(siteRoot, "i18n", "messages");

type MarketingParityManifest = {
  contractSourcePath: string;
  allMarketingNamespaces: string[];
  wave1Locales: string[];
  parityLocales: string[];
  wave1Namespaces: string[];
  batchAConsumerRoutes: string[];
  deferredLocales: string[];
  i18nConsumerPaths: string[];
};

function loadManifest(): MarketingParityManifest {
  const raw = fs.readFileSync(manifestPath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  expect(parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)).toBe(true);
  return parsed as MarketingParityManifest;
}

describe("i18n/marketing-parity-manifest", () => {
  it("is valid JSON with required fields", () => {
    const manifest = loadManifest();

    expect(typeof manifest.contractSourcePath).toBe("string");
    expect(manifest.contractSourcePath.length).toBeGreaterThan(0);

    expect(Array.isArray(manifest.allMarketingNamespaces)).toBe(true);
    expect(manifest.allMarketingNamespaces.length).toBeGreaterThan(0);

    expect(Array.isArray(manifest.wave1Locales)).toBe(true);
    expect(manifest.wave1Locales).toContain("en");
    expect(manifest.wave1Locales).toContain("hi");

    expect(Array.isArray(manifest.parityLocales)).toBe(true);
    expect(manifest.parityLocales.length).toBeGreaterThan(0);

    expect(Array.isArray(manifest.wave1Namespaces)).toBe(true);
    expect(manifest.wave1Namespaces.length).toBeGreaterThan(0);

    expect(Array.isArray(manifest.deferredLocales)).toBe(true);
    expect(Array.isArray(manifest.batchAConsumerRoutes)).toBe(true);
    expect(Array.isArray(manifest.i18nConsumerPaths)).toBe(true);
  });

  it("references locales that exist in routing and have message files", () => {
    const manifest = loadManifest();
    const referenced = new Set<string>([
      ...manifest.wave1Locales,
      ...manifest.parityLocales,
      ...manifest.deferredLocales,
      "en",
    ]);

    for (const locale of referenced) {
      expect((locales as readonly string[]).includes(locale), `unknown locale ${locale}`).toBe(
        true,
      );
      const messageFile = path.join(messagesDir, `${locale}.json`);
      expect(fs.existsSync(messageFile), `missing messages for ${locale}`).toBe(true);
    }
  });

  it("keeps wave1 namespaces inside the full marketing namespace list", () => {
    const manifest = loadManifest();
    for (const namespace of manifest.wave1Namespaces) {
      expect(manifest.allMarketingNamespaces).toContain(namespace);
    }
  });

  it("treats deferred locales as the non-en parity set for full marketing", () => {
    const manifest = loadManifest();
    for (const locale of manifest.deferredLocales) {
      expect(manifest.parityLocales).toContain(locale);
      expect(locale).not.toBe("en");
    }
  });

  it("points i18nConsumerPaths at existing site files", () => {
    const manifest = loadManifest();
    for (const relative of manifest.i18nConsumerPaths) {
      const absolute = path.join(siteRoot, relative);
      expect(fs.existsSync(absolute), `missing consumer ${relative}`).toBe(true);
    }
  });
});
