#!/usr/bin/env node
/**
 * Scaffold de / es / fr message files from en.json (Phase 4c).
 * Preserves existing translated values; fills structure from en for new keys only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..", "site");
const messagesDir = path.join(siteRoot, "i18n", "messages");
const manifest = JSON.parse(
  fs.readFileSync(path.join(siteRoot, "i18n", "marketing-parity-manifest.json"), "utf8"),
);

const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));

export function mergePreserveTranslations(existing, enSource) {
  if (enSource === null || typeof enSource !== "object") {
    return existing !== undefined ? existing : enSource;
  }
  if (Array.isArray(enSource)) {
    if (!Array.isArray(existing) || existing.length !== enSource.length) {
      return structuredClone(enSource);
    }
    return enSource.map((item, index) => mergePreserveTranslations(existing[index], item));
  }

  const out = {};
  for (const [key, enValue] of Object.entries(enSource)) {
    const existingValue = existing?.[key];
    if (enValue !== null && typeof enValue === "object") {
      out[key] = mergePreserveTranslations(existingValue, enValue);
      continue;
    }
    out[key] =
      typeof existingValue === "string" && existingValue.length > 0 && existingValue !== enValue
        ? existingValue
        : enValue;
  }
  return out;
}

export function marketingSubtree(messages, namespaces = manifest.allMarketingNamespaces) {
  const out = {};
  for (const namespace of namespaces) {
    if (messages[namespace]) out[namespace] = structuredClone(messages[namespace]);
  }
  return out;
}

export function syncDeferredLocaleMessages({
  messagesDir: dir = messagesDir,
  locales = manifest.deferredLocales,
  enSource = en,
  namespaces = manifest.allMarketingNamespaces,
  write = true,
} = {}) {
  const results = [];
  for (const locale of locales) {
    const file = path.join(dir, `${locale}.json`);
    const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
    const merged = { ...existing };
    const subtree = marketingSubtree(enSource, namespaces);
    for (const [namespace, enSubtree] of Object.entries(subtree)) {
      merged[namespace] = mergePreserveTranslations(existing[namespace], enSubtree);
    }
    if (write) {
      fs.writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
    }
    results.push({ locale, namespaces: Object.keys(subtree).length, merged });
  }
  return results;
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return path.resolve(entry) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  for (const result of syncDeferredLocaleMessages()) {
    console.log(`Updated ${result.locale}.json with ${result.namespaces} marketing namespaces`);
  }
}
