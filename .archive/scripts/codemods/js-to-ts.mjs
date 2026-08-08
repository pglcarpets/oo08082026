#!/usr/bin/env node
/**
 * JS -> TS file conversion codemod — dry-run by default.
 *
 * Renames `.js`/`.jsx` source files to `.ts`/`.tsx`, choosing the extension by
 * detecting JSX syntax. Uses `git mv` for tracked files so history is preserved.
 *
 * This script does NOT add type annotations. It only performs the rename, which
 * is what makes the files visible to `tsc` (site/tsconfig.json includes only
 * `.ts`/`.tsx`). Expect new type errors to surface afterwards — that is the
 * point, and they are fixed by hand.
 *
 * Usage (from repo root):
 *   node scripts/codemods/js-to-ts.mjs <dir-or-file>...            # dry run
 *   node scripts/codemods/js-to-ts.mjs <dir-or-file>... --write    # apply
 *
 * Example:
 *   node scripts/codemods/js-to-ts.mjs site/features/OOStudio site/lib/OOStudio
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { REPO_ROOT } from "../lib/repoRoot.mjs";

const write = process.argv.includes("--write");
const targets = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));

/** Never convert these — they are build/tool configs that must stay CommonJS or plain JS. */
const SKIP_BASENAMES = new Set([
  "next.config.js",
  "postcss.config.js",
  "tailwind.config.js",
  "eslint.config.mjs",
]);

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
  "results",
  "_archive",
  "archive",
]);

/** Heuristic JSX detection: a JSX element or fragment in return/assignment position. */
const JSX_PATTERN =
  /(?:<\/[A-Za-z][\w.-]*>)|(?:<>[\s\S]*<\/>)|(?:<[A-Z][\w.]*[\s/>])|(?:<[a-z][\w-]*\s+[^>]*\/>)/;

function fail(message) {
  process.stderr.write(`js-to-ts: ${message}\n`);
  process.exit(1);
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name)) continue;
      walk(path.join(dir, entry.name), files);
      continue;
    }
    if (/\.(js|jsx)$/.test(entry.name)) files.push(path.join(dir, entry.name));
  }
  return files;
}

function collect(target) {
  const abs = path.resolve(REPO_ROOT, target);
  if (!fs.existsSync(abs)) fail(`path does not exist: ${target}`);
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) return walk(abs);
  return /\.(js|jsx)$/.test(abs) ? [abs] : [];
}

function isTracked(absPath) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", absPath], {
      cwd: REPO_ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function rename(from, to, tracked) {
  if (tracked) {
    execFileSync("git", ["mv", from, to], { cwd: REPO_ROOT, stdio: "pipe" });
    return "git mv";
  }
  fs.renameSync(from, to);
  return "fs rename";
}

if (targets.length === 0) {
  fail("no targets given. Pass one or more directories or files, e.g. site/lib/OOStudio");
}

const files = [...new Set(targets.flatMap(collect))].sort();

if (files.length === 0) {
  process.stdout.write("js-to-ts: no .js/.jsx files found under the given targets\n");
  process.exit(0);
}

const planned = [];
const skipped = [];

for (const abs of files) {
  const rel = path.relative(REPO_ROOT, abs).replaceAll("\\", "/");
  const base = path.basename(abs);

  if (SKIP_BASENAMES.has(base)) {
    skipped.push({ rel, reason: "config file (skip list)" });
    continue;
  }

  const source = fs.readFileSync(abs, "utf8");
  const hasJsx = JSX_PATTERN.test(source);
  const nextExt = hasJsx ? ".tsx" : ".ts";
  const target = abs.replace(/\.(js|jsx)$/, nextExt);
  const targetRel = path.relative(REPO_ROOT, target).replaceAll("\\", "/");

  if (fs.existsSync(target)) {
    skipped.push({ rel, reason: `target already exists: ${targetRel}` });
    continue;
  }

  planned.push({ abs, rel, target, targetRel, hasJsx, tracked: isTracked(abs) });
}

// Imports in this repo are extensionless, so no specifier rewriting is required.
// Flag any explicit .js specifiers that would dangle after the rename.
const danglingSpecifiers = [];
for (const item of planned) {
  const source = fs.readFileSync(item.abs, "utf8");
  for (const match of source.matchAll(/from\s+["']([^"']+\.js)["']/g)) {
    danglingSpecifiers.push({ rel: item.rel, specifier: match[1] });
  }
}

process.stdout.write(
  `js-to-ts: ${planned.length} file(s) to convert, ${skipped.length} skipped ` +
    `(${write ? "WRITE" : "dry run"})\n`,
);

for (const item of planned) {
  process.stdout.write(
    `  ${item.rel} -> ${path.basename(item.targetRel)}` +
      `${item.hasJsx ? " [jsx]" : ""}${item.tracked ? "" : " [untracked]"}\n`,
  );
}

for (const item of skipped) {
  process.stdout.write(`  SKIP ${item.rel} — ${item.reason}\n`);
}

for (const item of danglingSpecifiers) {
  process.stdout.write(
    `  WARN ${item.rel} imports "${item.specifier}" with an explicit .js extension\n`,
  );
}

if (!write) {
  process.stdout.write("js-to-ts: dry run only — re-run with --write to apply\n");
  process.exit(0);
}

let converted = 0;
for (const item of planned) {
  const how = rename(item.abs, item.target, item.tracked);
  process.stdout.write(`  ${how}: ${item.rel} -> ${item.targetRel}\n`);
  converted += 1;
}

process.stdout.write(
  `js-to-ts: converted ${converted} file(s). Run \`pnpm run typecheck\` to see what surfaced.\n`,
);
