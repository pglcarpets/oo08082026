/**
 * Remove nested package installs and regeneratable npm/yarn locks.
 *
 * Workspace: root + tech-docs-generator (see pnpm-workspace.yaml).
 * Install only from repo root: `pnpm install`.
 * Canonical lock: root pnpm-lock.yaml (never deleted here).
 *
 * Do NOT delete tech-docs-generator/node_modules — pnpm workspace links
 * package-local deps there. Only strip non-workspace trees (e.g. site/).
 *
 * Runs on postinstall. Safe to run anytime.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Non-workspace trees must never hold their own node_modules. */
const REMOVE_DIRS = [
  "site/node_modules",
];

/**
 * npm/yarn locks are regeneratable noise in a pnpm workspace.
 * Keep only root pnpm-lock.yaml.
 */
const REMOVE_FILES = [
  "package-lock.json",
  "yarn.lock",
  "npm-shrinkwrap.json",
  "site/package-lock.json",
  "site/yarn.lock",
  "site/npm-shrinkwrap.json",
  "tech-docs-generator/package-lock.json",
  "tech-docs-generator/yarn.lock",
  "tech-docs-generator/npm-shrinkwrap.json",
];

let removed = 0;

for (const rel of REMOVE_DIRS) {
  const abs = path.join(root, rel);
  if (fs.existsSync(abs)) {
    fs.rmSync(abs, { recursive: true, force: true });
    console.log(`cleanup-nested-installs: removed ${rel}/`);
    removed += 1;
  }
}

for (const rel of REMOVE_FILES) {
  const abs = path.join(root, rel);
  if (fs.existsSync(abs)) {
    fs.rmSync(abs, { force: true });
    console.log(`cleanup-nested-installs: removed ${rel}`);
    removed += 1;
  }
}

if (removed === 0) {
  console.log("cleanup-nested-installs: nothing to remove");
} else {
  console.log(
    `cleanup-nested-installs: removed ${removed} path(s); deps live at root node_modules via pnpm-lock.yaml`,
  );
}

/**
 * PostCSS/Tailwind resolve `@focss/...` as node_modules paths (not webpack aliases).
 * Keep a stable link so `@import "@focss/*.css"` and CSS-module graphs resolve
 * after focss relocated to site/focss/.
 */
const focssTarget = path.join(root, "site", "focss");
const focssLink = path.join(root, "node_modules", "@focss");

if (fs.existsSync(focssTarget)) {
  fs.mkdirSync(path.dirname(focssLink), { recursive: true });
  let linkedCorrectly = false;
  try {
    if (fs.existsSync(focssLink)) {
      linkedCorrectly =
        fs.realpathSync(focssLink) === fs.realpathSync(focssTarget);
      if (!linkedCorrectly) {
        fs.rmSync(focssLink, { recursive: true, force: true });
      }
    }
  } catch {
    try {
      fs.rmSync(focssLink, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    linkedCorrectly = false;
  }
  if (!linkedCorrectly) {
    const type = process.platform === "win32" ? "junction" : "dir";
    fs.symlinkSync(focssTarget, focssLink, type);
    console.log("cleanup-nested-installs: linked node_modules/@focss -> site/focss");
  }
}
