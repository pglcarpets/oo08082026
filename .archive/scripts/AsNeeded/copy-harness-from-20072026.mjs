/**
 * Re-copy harness files from E:\20072026.
 * Does NOT copy eslint.config.mjs.
 * Does NOT overwrite fork-patched config/build/next.config.js by default
 * (set OVERWRITE_NEXT_BASE=1 to force).
 *
 *   node scripts/AsNeeded/copy-harness-from-20072026.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const destRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const srcRoot = process.env.OANDO_SOURCE_ROOT || "E:\\20072026";
const overwriteNextBase = process.env.OVERWRITE_NEXT_BASE === "1";

function copyFile(rel) {
  const from = path.join(srcRoot, rel);
  const to = path.join(destRoot, rel);
  if (!fs.existsSync(from)) throw new Error(`missing source: ${from}`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`copied ${rel}`);
}

function copyDirFiles(relDir, { exclude = [] } = {}) {
  const fromDir = path.join(srcRoot, relDir);
  if (!fs.existsSync(fromDir)) throw new Error(`missing dir: ${fromDir}`);
  for (const name of fs.readdirSync(fromDir)) {
    if (exclude.includes(name)) continue;
    const from = path.join(fromDir, name);
    if (!fs.statSync(from).isFile()) continue;
    const rel = path.join(relDir, name).replace(/\\/g, "/");
    if (!overwriteNextBase && rel === "config/build/next.config.js") {
      console.log(`kept local (fork patches): ${rel}`);
      continue;
    }
    copyFile(rel);
  }
}

copyDirFiles("config/build", { exclude: ["eslint.config.mjs"] });
copyDirFiles("config/quality");
copyFile("site/postcss.config.mjs");
// site next.config.js is fork-owned (next-intl + useTypeScriptCli merge) — do not overwrite.
console.log("harness copy done from", srcRoot);
