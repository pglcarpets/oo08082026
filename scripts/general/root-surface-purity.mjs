/**
 * Root surface purity — pinned front-door Markdown + at most two session extras;
 * no stray scripts at repo root (those belong under scripts/).
 */
import fs from "node:fs";
import path from "node:path";

/** Permanent root docs from CONTENTS.md / AGENTS.md — not session scratch. */
export const PINNED_ROOT_MD = new Set([
  "AGENTS.md",
  "CONTENTS.md",
  "DOC-MAP.md",
  "Failures.md",
  "OPERATIONS_RUNBOOK.md",
  "README.md",
  "START.md",
  "Testing-handbook.md",
]);

/**
 * Optional tooling pointers — may exist at root but are not required and do
 * not consume the session-extra budget.
 */
export const OPTIONAL_ROOT_MD = new Set([]);

/** Session handoff / scratch Markdown allowed beyond the pinned set. */
export const MAX_EXTRA_ROOT_MD = 3;

/** Executable / script extensions forbidden at repo root unless allow-listed. */
export const ROOT_SCRIPT_EXTENSIONS = new Set([
  ".cjs",
  ".js",
  ".mjs",
  ".ps1",
  ".py",
  ".sh",
  ".ts",
  ".tsx",
]);

/** Known root tooling entrypoints (not product one-offs). */
export const ROOT_SCRIPT_ALLOW = new Set(["vitest.config.ts"]);

/**
 * @param {string} rootDir
 * @returns {string[]}
 */
export function findRootSurfaceViolations(rootDir) {
  const violations = [];
  if (!fs.existsSync(rootDir)) {
    return [`root missing: ${rootDir}`];
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const rootMd = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const name = entry.name;
    const ext = path.extname(name).toLowerCase();

    if (ext === ".md") {
      rootMd.push(name);
      continue;
    }

    if (ROOT_SCRIPT_EXTENSIONS.has(ext) && !ROOT_SCRIPT_ALLOW.has(name)) {
      violations.push(
        `FORBIDDEN root script: ${name} (keep one-offs out of repo root; use scripts/ or delete)`,
      );
    }
  }

  const extras = rootMd
    .filter((name) => !PINNED_ROOT_MD.has(name) && !OPTIONAL_ROOT_MD.has(name))
    .sort();
  if (extras.length > MAX_EXTRA_ROOT_MD) {
    violations.push(
      `too many extra root Markdown files (${extras.length} > ${MAX_EXTRA_ROOT_MD}): ${extras.join(", ")} (pinned: ${[...PINNED_ROOT_MD].sort().join(", ")}; optional: ${[...OPTIONAL_ROOT_MD].sort().join(", ") || "(none)"}; at most ${MAX_EXTRA_ROOT_MD} session docs e.g. handoff/handover)`,
    );
  }

  return violations;
}
