import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..", "site");
const pendingDir = path.join(siteRoot, "i18n", "pending-translations");
const manifestPath = path.join(siteRoot, "i18n", "marketing-parity-manifest.json");

type MarketingParityManifest = {
  deferredLocales: string[];
};

/** Flat path → string map produced by export-pending-translations / apply-pending-translations. */
type FlatStringMap = Record<string, string>;

const FLAT_PATH_PATTERN = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*|\[\d+\])*$/;

function loadManifest(): MarketingParityManifest {
  return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as MarketingParityManifest;
}

function assertFlatStringMap(value: unknown, label: string): FlatStringMap {
  expect(value !== null && typeof value === "object" && !Array.isArray(value), label).toBe(true);
  const record = value as Record<string, unknown>;
  for (const [key, entry] of Object.entries(record)) {
    expect(typeof key, `${label} key type`).toBe("string");
    expect(key.length, `${label} empty key`).toBeGreaterThan(0);
    expect(FLAT_PATH_PATTERN.test(key), `${label} invalid path key: ${key}`).toBe(true);
    expect(typeof entry, `${label} value for ${key}`).toBe("string");
  }
  return record as FlatStringMap;
}

describe("i18n/pending-translations", () => {
  it("directory exists when deferred marketing workflow is active", () => {
    expect(fs.existsSync(pendingDir)).toBe(true);
    expect(fs.statSync(pendingDir).isDirectory()).toBe(true);
  });

  it("contains valid flat JSON maps for deferred locales (pending + translated)", () => {
    const manifest = loadManifest();
    expect(manifest.deferredLocales.length).toBeGreaterThan(0);

    const entries = fs.readdirSync(pendingDir).filter((name) => name.endsWith(".json"));
    expect(entries.length).toBeGreaterThan(0);

    for (const locale of manifest.deferredLocales) {
      const pendingFile = path.join(pendingDir, `${locale}.pending.json`);
      const translatedFile = path.join(pendingDir, `${locale}.translated.json`);

      expect(fs.existsSync(pendingFile), `missing ${locale}.pending.json`).toBe(true);
      expect(fs.existsSync(translatedFile), `missing ${locale}.translated.json`).toBe(true);

      const pending = assertFlatStringMap(
        JSON.parse(fs.readFileSync(pendingFile, "utf8")),
        `${locale}.pending.json`,
      );
      const translated = assertFlatStringMap(
        JSON.parse(fs.readFileSync(translatedFile, "utf8")),
        `${locale}.translated.json`,
      );

      // Contract (export-pending-translations.mjs / apply-pending-translations.mjs):
      // - pending: dotted leaf paths whose deferred locale value still equals English
      // - translated: same path style, values meant to replace pending English strings
      // Keys may overlap partially; both maps are string→string only.
      expect(Object.keys(pending).length).toBeGreaterThanOrEqual(0);
      expect(Object.keys(translated).length).toBeGreaterThan(0);
    }
  });

  it("only uses pending-translations filenames that match {locale}.{pending|translated}.json", () => {
    const names = fs.readdirSync(pendingDir).filter((name) => name.endsWith(".json"));
    for (const name of names) {
      expect(name).toMatch(/^[a-z]{2}\.(pending|translated)\.json$/);
    }
  });
});
