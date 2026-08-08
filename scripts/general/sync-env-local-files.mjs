#!/usr/bin/env node
/**
 * Append missing workstation env keys to repo-root `.env.local` only.
 * Skips keys already present (no duplicate blocks).
 *
 * Usage: node scripts/general/sync-env-local-files.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveMissingEnvFileKeys } from "./workstation-env.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const filePath = path.join(repoRoot, ".env.local");

if (!fs.existsSync(filePath)) {
  console.error("sync-env-local-files: missing .env.local at repo root");
  process.exit(1);
}

function parseEnvFile(text) {
  const map = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (m) map[m[1]] = m[2];
  }
  return map;
}

let text = fs.readFileSync(filePath, "utf8");
const additions = deriveMissingEnvFileKeys(parseEnvFile(text));
let added = 0;
if (!text.endsWith("\n")) text += "\n";
for (const [key, value] of Object.entries(additions).sort(([a], [b]) => a.localeCompare(b))) {
  if (text.includes(`${key}=`)) continue;
  text += `${key}=${value}\n`;
  added += 1;
}
if (added > 0) fs.writeFileSync(filePath, text);
console.log(`.env.local: appended ${added} missing key(s)`);
