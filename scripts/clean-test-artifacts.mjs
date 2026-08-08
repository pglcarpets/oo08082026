/**
 * Remove stale test/typecheck/lint artifacts from the repo root.
 * Canonical outputs live under results/ — see docs/TESTING.md.
 *
 * Usage:
 *   node scripts/clean-test-artifacts.mjs           # delete matches
 *   node scripts/clean-test-artifacts.mjs --dry-run # list only
 */
import fs from "node:fs";
import path from "node:path";

/** Fixed filenames that should never live at repo root. */
export const STALE_ROOT_FILES = [
  "tsc-errors.txt",
  "errors.txt",
  "scripts_errors.txt",
  "lint-results.json",
  "test-results.json",
  "test-results2.json",
  "test-output.txt",
];

/** Root directories created by default Playwright/coverage runs at wrong cwd. */
export const STALE_ROOT_DIRS = ["test-results", "playwright-report", "coverage"];

const SCRATCH_PREFIX = "scratch_";

/**
 * @param {string} repoRoot
 * @returns {string[]}
 */
export function listStaleRootArtifacts(repoRoot) {
  const hits = [];

  for (const name of STALE_ROOT_FILES) {
    const full = path.join(repoRoot, name);
    if (fs.existsSync(full)) hits.push(full);
  }

  for (const name of STALE_ROOT_DIRS) {
    const full = path.join(repoRoot, name);
    if (fs.existsSync(full)) hits.push(full);
  }

  try {
    for (const entry of fs.readdirSync(repoRoot, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      if (entry.name.startsWith(SCRATCH_PREFIX)) {
        hits.push(path.join(repoRoot, entry.name));
      }
    }
  } catch {
    // ignore unreadable root
  }

  return hits.sort();
}

/**
 * @param {string} repoRoot
 * @param {{ dryRun?: boolean }} [options]
 * @returns {{ removed: string[]; skipped: string[] }}
 */
export function cleanStaleRootArtifacts(repoRoot, options = {}) {
  const { dryRun = false } = options;
  const targets = listStaleRootArtifacts(repoRoot);
  const removed = [];
  const skipped = [];

  for (const target of targets) {
    if (dryRun) {
      skipped.push(target);
      continue;
    }

    try {
      const stat = fs.lstatSync(target);
      if (stat.isDirectory()) {
        fs.rmSync(target, { recursive: true, force: true });
      } else {
        fs.unlinkSync(target);
      }
      removed.push(target);
    } catch (error) {
      skipped.push(target);
      console.warn(
        `clean-test-artifacts: could not remove ${path.relative(repoRoot, target)}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return { removed, skipped };
}

function isMain() {
  const entry = process.argv[1] ?? "";
  return entry.endsWith("clean-test-artifacts.mjs");
}

if (isMain()) {
  const dryRun = process.argv.includes("--dry-run");
  const repoRoot = process.cwd();
  const { removed, skipped } = cleanStaleRootArtifacts(repoRoot, { dryRun });

  if (dryRun) {
    if (skipped.length === 0) {
      console.log("clean-test-artifacts: no stale root artifacts");
    } else {
      console.log("clean-test-artifacts: would remove:");
      for (const file of skipped) {
        console.log(`  - ${path.relative(repoRoot, file)}`);
      }
    }
  } else if (removed.length === 0) {
    console.log("clean-test-artifacts: no stale root artifacts");
  } else {
    console.log("clean-test-artifacts: removed:");
    for (const file of removed) {
      console.log(`  - ${path.relative(repoRoot, file)}`);
    }
  }
}
