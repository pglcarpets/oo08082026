#!/usr/bin/env node
/**
 * Phase 4c — translate marketing namespaces by batching flat string leaves.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvLocal } = require("./general/loadEnvLocal.cjs");

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..", "site");
const messagesDir = path.join(siteRoot, "i18n", "messages");
const manifest = JSON.parse(
  fs.readFileSync(path.join(siteRoot, "i18n", "marketing-parity-manifest.json"), "utf8"),
);

export const LANG = { de: "German", es: "Spanish", fr: "French" };
export const BATCH_SIZE = 35;
// Prefix match for urls/paths/mailto; full match for phones/emails.
export const SKIP_VALUE =
  /^(https?:\/\/\S*|\/\S*|mailto:\S*|\+?\d[\d\s-]{8,}|[^@\s]+@[^@\s]+\.[^@\s]+)$/;

export function shouldSkipTranslation(value) {
  if (!value || typeof value !== "string") return true;
  if (SKIP_VALUE.test(value.trim())) return true;
  if (/^[\d+.,\s%-]+$/.test(value.trim())) return true;
  return false;
}

export function collectLeaves(value, prefix = "", out = []) {
  if (typeof value === "string") {
    if (!shouldSkipTranslation(value)) out.push({ path: prefix, value });
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectLeaves(item, `${prefix}[${index}]`, out));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const next = prefix ? `${prefix}.${key}` : key;
      collectLeaves(child, next, out);
    }
  }
  return out;
}

export function setByPath(root, pathExpr, value) {
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

export function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function deepMergeStructure(base, overrides) {
  const out = structuredClone(base);
  for (const [key, value] of Object.entries(overrides ?? {})) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === "object" &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMergeStructure(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}


async function translateBatch(entries, locale, label) {
  const keys = [
    process.env.OPENROUTER_API_KEY_PRIMARY?.trim(),
    process.env.OPENROUTER_API_KEY_BACKUP?.trim(),
  ].filter(Boolean);
  const model = process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";
  const payload = Object.fromEntries(entries.map((entry) => [entry.path, entry.value]));

  let lastError;
  for (const apiKey of keys) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://oando.co.in",
            "X-Title": "Oando i18n deferred locale sync",
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            messages: [
              {
                role: "system",
                content:
                  `Translate each JSON value to ${LANG[locale]}. Return JSON with identical keys. ` +
                  "Keep brand names (Oando, One&Only, Planner, Titan, HDFC, etc.) unchanged.",
              },
              { role: "user", content: JSON.stringify(payload) },
            ],
            response_format: { type: "json_object" },
          }),
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          const retryAfter = Number(data.error?.metadata?.retry_after_seconds ?? 0);
          if (retryAfter > 0) {
            await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          }
          throw new Error(`OpenRouter failed (${label}): ${JSON.stringify(data.error ?? data).slice(0, 400)}`);
        }

        const content = data.choices?.[0]?.message?.content;
        const parsed = JSON.parse(content.trim().replace(/^```json\s*|\s*```$/g, ""));
        return parsed;
      } catch (error) {
        lastError = error;
        process.stderr.write(
          `Retry ${attempt}/3 (${apiKey === keys[0] ? "primary" : "backup"}) for ${label}: ${error instanceof Error ? error.message : String(error)}\n`,
        );
        await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
      }
    }
  }

  throw lastError;
}

async function main() {
  loadEnvLocal();
  const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));

  for (const locale of manifest.deferredLocales) {
    const file = path.join(messagesDir, `${locale}.json`);
    const merged = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};

    for (const namespace of manifest.allMarketingNamespaces) {
      const target = structuredClone(en[namespace]);
      const leaves = collectLeaves(en[namespace]);
      const pending = [];

      for (const leaf of leaves) {
        const current = collectLeaves(merged[namespace]).find((item) => item.path === leaf.path)?.value;
        if (current && current !== leaf.value) continue;
        pending.push(leaf);
      }

      if (pending.length === 0) {
        process.stdout.write(`Skip ${locale}/${namespace}\n`);
        merged[namespace] = deepMergeStructure(en[namespace], merged[namespace] ?? {});
        continue;
      }

      process.stdout.write(`Translating ${locale}/${namespace} (${pending.length} strings)\n`);
      for (const batch of chunk(pending, BATCH_SIZE)) {
        const translated = await translateBatch(batch, locale, `${locale}/${namespace}`);
        for (const [pathKey, value] of Object.entries(translated)) {
          setByPath(target, pathKey, value);
        }
        merged[namespace] = target;
        fs.writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      merged[namespace] = target;
    }

    process.stdout.write(`Finished ${locale}.json\n`);
  }
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
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
