#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setByPath } from "./export-pending-translations.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..");
const messagesDir = path.join(siteRoot, "i18n", "messages");
const pendingDir = path.join(siteRoot, "i18n", "pending-translations");
const manifest = JSON.parse(
  fs.readFileSync(path.join(siteRoot, "i18n", "marketing-parity-manifest.json"), "utf8"),
);

for (const locale of manifest.deferredLocales) {
  const translatedPath = path.join(pendingDir, `${locale}.translated.json`);
  if (!fs.existsSync(translatedPath)) {
    console.warn(`Missing ${translatedPath}`);
    continue;
  }

  const translated = JSON.parse(fs.readFileSync(translatedPath, "utf8"));
  const file = path.join(messagesDir, `${locale}.json`);
  const merged = JSON.parse(fs.readFileSync(file, "utf8"));

  for (const [pathKey, value] of Object.entries(translated)) {
    const [namespace] = pathKey.split(".");
    const innerPath = pathKey.slice(namespace.length + 1);
    if (!merged[namespace]) merged[namespace] = {};
    setByPath(merged[namespace], innerPath, value);
  }

  fs.writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`Applied ${Object.keys(translated).length} translations → ${locale}.json`);
}
