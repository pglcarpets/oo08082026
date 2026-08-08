/**
 * Verify markdown file links in root doc-chain files resolve on disk.
 * Policy: root doc-chain links must resolve on disk.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// `README.md`, not `Readme.md` — Windows resolves either, Linux CI does not.
const FILES = [
  "AGENTS.md",
  "README.md",
  "START.md",
  "CONTENTS.md",
  "DOC-MAP.md",
  "OPERATIONS_RUNBOOK.md",
  "Testing-handbook.md",
  "Failures.md",
  "Agents/INDEX.md",
  "docs/README.md",
  "tech-docs-generator/README.md",
];

const LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;

/** @param {string} relPath */
function checkFile(relPath) {
  const abs = path.join(repoRoot, relPath);
  if (!fs.existsSync(abs)) {
    return [{ file: relPath, href: "(missing source file)", resolved: relPath }];
  }

  const content = fs.readFileSync(abs, "utf8");
  /** @type {{ file: string; href: string; resolved: string }[]} */
  const errors = [];

  for (const match of content.matchAll(LINK_RE)) {
    const href = match[2].trim();
    if (!href || href.startsWith("#") || /^https?:/i.test(href) || href.startsWith("mailto:")) {
      continue;
    }

    const filePart = href.split("#")[0];
    if (!filePart) continue;

    const resolved = path.normalize(path.join(path.dirname(abs), filePart));
    if (!fs.existsSync(resolved)) {
      errors.push({
        file: relPath,
        href,
        resolved: path.relative(repoRoot, resolved).replace(/\\/g, "/"),
      });
    }
  }

  return errors;
}

/** @type {{ file: string; href: string; resolved: string }[]} */
const allErrors = [];
for (const file of FILES) {
  allErrors.push(...checkFile(file));
}

if (allErrors.length) {
  console.error("Broken markdown links in root doc chain:\n");
  for (const err of allErrors) {
    console.error(`  ${err.file}`);
    console.error(`    link: ${err.href}`);
    console.error(`    missing: ${err.resolved}\n`);
  }
  process.exit(1);
}

console.log(`root markdown links OK (${FILES.length} files checked)`);
