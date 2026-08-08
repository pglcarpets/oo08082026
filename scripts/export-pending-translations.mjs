#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..");
const messagesDir = path.join(siteRoot, "i18n", "messages");
const outDir = path.join(siteRoot, "i18n", "pending-translations");
const manifest = JSON.parse(
  fs.readFileSync(path.join(siteRoot, "i18n", "marketing-parity-manifest.json"), "utf8"),
);

const SKIP_VALUE = /^(https?:\/\/|\/|mailto:|\+?\d[\d\s-]{8,}|[^@\s]+@[^@\s]+\.[^@\s]+)$/;

function collectLeaves(value, prefix = "", out = []) {
  if (typeof value === "string") {
    if (!SKIP_VALUE.test(value.trim()) && !/^[\d+.,\s%-]+$/.test(value.trim())) {
      out.push({ path: prefix, value });
    }
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectLeaves(item, `${prefix}[${index}]`, out));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      collectLeaves(child, prefix ? `${prefix}.${key}` : key, out);
    }
  }
  return out;
}

function setByPath(root, pathExpr, value) {
  const tokens = [];
  const re = /([^.[\]]+)|\[(\d+)\]/g;
  let match = re.exec(pathExpr);
  while (match) {
    tokens.push(match[1] !== undefined ? match[1] : Number(match[2]));
    match = re.exec(pathExpr);
  }
  let cursor = root;
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const token = tokens[i];
    const next = tokens[i + 1];
    if (cursor[token] === undefined) {
      cursor[token] = typeof next === "number" ? [] : {};
    }
    cursor = cursor[token];
  }
  cursor[tokens.at(-1)] = value;
}

fs.mkdirSync(outDir, { recursive: true });
const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));

for (const locale of manifest.deferredLocales) {
  const localeMessages = JSON.parse(fs.readFileSync(path.join(messagesDir, `${locale}.json`), "utf8"));
  const pending = {};
  for (const namespace of manifest.allMarketingNamespaces) {
    const enLeaves = collectLeaves(en[namespace], namespace);
    const localeLeaves = Object.fromEntries(collectLeaves(localeMessages[namespace], namespace).map((item) => [item.path, item.value]));
    for (const leaf of enLeaves) {
      if (localeLeaves[leaf.path] === leaf.value) {
        pending[leaf.path] = leaf.value;
      }
    }
  }
  fs.writeFileSync(path.join(outDir, `${locale}.pending.json`), `${JSON.stringify(pending, null, 2)}\n`, "utf8");
  console.log(`${locale}: ${Object.keys(pending).length} pending strings`);
}

export { setByPath };
