#!/usr/bin/env node
/**
 * Deep key parity between locale message files (Phase 4a/4b).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..", "site");
const messagesDir = path.join(siteRoot, "i18n", "messages");
const manifestFile = path.join(siteRoot, "i18n", "marketing-parity-manifest.json");

function collectKeys(value, prefix = "") {
  const keys = [];
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    if (prefix) keys.push(prefix);
    return keys;
  }
  for (const [key, child] of Object.entries(value)) {
    const next = prefix ? `${prefix}.${key}` : key;
    keys.push(...collectKeys(child, next));
  }
  return keys;
}

function subtree(messages, namespace) {
  return namespace.split(".").reduce((node, part) => node?.[part], messages);
}

function loadLocale(locale) {
  const file = path.join(messagesDir, `${locale}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing locale file: ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
const baseLocale = "en";
const baseMessages = loadLocale(baseLocale);
const failures = [];
const parityLocales = manifest.parityLocales ?? manifest.wave1Locales.filter((l) => l !== baseLocale);

function namespacesForLocale(locale) {
  if (locale === "hi") return manifest.wave1Namespaces;
  if (manifest.deferredLocales?.includes(locale)) return manifest.allMarketingNamespaces;
  return manifest.wave1Namespaces;
}

for (const locale of parityLocales) {
  const localeMessages = loadLocale(locale);
  for (const namespace of namespacesForLocale(locale)) {
    const baseSubtree = subtree(baseMessages, namespace);
    if (!baseSubtree) {
      failures.push({ namespace, locale, issue: `missing in ${baseLocale}.json` });
      continue;
    }
    const baseKeys = new Set(collectKeys(baseSubtree, namespace));
    const localeSubtree = subtree(localeMessages, namespace);
    if (!localeSubtree) {
      failures.push({ namespace, locale, issue: "missing namespace" });
      continue;
    }
    const localeKeys = new Set(collectKeys(localeSubtree, namespace));

    for (const key of baseKeys) {
      if (!localeKeys.has(key)) {
        failures.push({ namespace, locale, issue: `missing key ${key}` });
      }
    }
    for (const key of localeKeys) {
      if (!baseKeys.has(key)) {
        failures.push({ namespace, locale, issue: `extra key ${key}` });
      }
    }
  }
}

if (failures.length > 0) {
  process.stderr.write(`check-i18n-key-parity: ${failures.length} issue(s)\n`);
  for (const failure of failures) {
    process.stderr.write(`  ${failure.namespace} [${failure.locale ?? baseLocale}] — ${failure.issue}\n`);
  }
  process.exit(1);
}

process.stdout.write(
  `check-i18n-key-parity: ok (locales ${parityLocales.join(", ")})\n`,
);
