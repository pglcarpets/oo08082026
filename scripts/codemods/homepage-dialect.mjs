#!/usr/bin/env node
/**
 * Homepage dialect codemod — dry-run by default (Phase 5c).
 */
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, SITE_PACKAGE_ROOT } from "../lib/repoRoot.mjs";

const siteRoot = SITE_PACKAGE_ROOT;
const siteApp = path.join(siteRoot, "app", "(site)");
const write = process.argv.includes("--write");
const logFile = path.join(REPO_ROOT, "results", "site-ui", "codemod-dry-run.log");

const SKIP_FILES = new Set(["app/(site)/page.tsx".replaceAll("\\", "/")]);

const REPLACEMENTS = [
  {
    id: "scheme-page-wrapper",
    pattern: /<section className="scheme-page flex min-h-screen flex-col items-center">/g,
    replacement: "<HomeMarketingLayout>",
    closing: { from: "</section>", to: "</HomeMarketingLayout>", once: true },
  },
  {
    id: "typ-section-h2",
    pattern: /className="typ-section/g,
    replacement: 'className="home-heading',
  },
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, files);
    else if (entry.name === "page.tsx") files.push(abs);
  }
  return files;
}

const log = [];
let changedFiles = 0;

for (const file of walk(siteApp)) {
  const rel = path.relative(siteRoot, file).replaceAll("\\", "/");
  if (SKIP_FILES.has(rel)) continue;

  let source = fs.readFileSync(file, "utf8");
  const original = source;
  const fileHits = [];

  for (const rule of REPLACEMENTS) {
    const matches = source.match(rule.pattern);
    if (matches?.length) {
      fileHits.push(`${rule.id}: ${matches.length}`);
      source = source.replace(rule.pattern, rule.replacement);
      if (rule.closing) {
        source = source.replace(rule.closing.from, rule.closing.to);
      }
    }
  }

  if (fileHits.length > 0) {
    log.push(`${rel} — ${fileHits.join(", ")}`);
    if (write && source !== original) {
      fs.writeFileSync(file, source, "utf8");
      changedFiles += 1;
    }
  }
}

fs.mkdirSync(path.dirname(logFile), { recursive: true });
fs.writeFileSync(
  logFile,
  `${write ? "WRITE" : "DRY-RUN"} homepage-dialect codemod (${new Date().toISOString()})\n${log.join("\n") || "(no matches)"}\n`,
  "utf8",
);

console.log(`homepage-dialect codemod: ${log.length} file(s) matched; ${write ? `${changedFiles} written` : "dry-run only"} → ${path.relative(siteRoot, logFile)}`);
