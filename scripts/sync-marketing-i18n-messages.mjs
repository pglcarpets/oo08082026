#!/usr/bin/env node
/**
 * Merge exported marketing copy into i18n/messages/en.json (Phase 4a scaffold).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..");
const enFile = path.join(siteRoot, "i18n", "messages", "en.json");
const exportScript = path.join(scriptsDir, "lib", "exportMarketingCopy.ts");

export function mergeMarketingIntoEn(en, marketing) {
  return {
    ...en,
    ...marketing,
    home: {
      ...en.home,
      ...marketing.home,
    },
  };
}

export function loadMarketingExport({
  siteRoot: root = siteRoot,
  exportScriptPath = exportScript,
} = {}) {
  const marketingJson = execFileSync(
    process.execPath,
    [path.join(root, "node_modules", "tsx", "dist", "cli.mjs"), exportScriptPath],
    {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    },
  );
  return JSON.parse(marketingJson);
}

export function syncMarketingI18nMessages({
  enPath = enFile,
  marketing,
  write = true,
  siteRoot: root = siteRoot,
} = {}) {
  const payload = marketing ?? loadMarketingExport({ siteRoot: root });
  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const merged = mergeMarketingIntoEn(en, payload);
  if (write) {
    fs.writeFileSync(enPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  }
  return { merged, marketingKeys: Object.keys(payload) };
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
  const { marketingKeys } = syncMarketingI18nMessages();
  console.log(
    `Updated ${path.relative(siteRoot, enFile)} with ${marketingKeys.length} marketing namespaces`,
  );
}
