/**
 * Full vitest gate: default parallel suite, then low-concurrency tech-docs lane.
 * Invokes vitest via node (not nested `pnpm exec`) so Windows does not OOM/crash
 * the second lane after a long first run (exit 4294967295).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vitestEntry = path.join(repoRoot, "node_modules", "vitest", "vitest.mjs");
const resultsDir = path.join(repoRoot, "results", "tests");

/**
 * @param {string} configRel Config path relative to repo root
 * @returns {number}
 */
function runVitest(configRel) {
  const result = spawnSync(
    process.execPath,
    [vitestEntry, "run", "--config", configRel],
    {
      cwd: repoRoot,
      env: process.env,
      stdio: "inherit",
      // Avoid shell so exit codes stay intact on Windows.
      shell: false,
    },
  );
  if (result.error) {
    console.error(result.error);
    return 1;
  }
  if (result.signal) {
    console.error(`vitest terminated by signal ${result.signal} (${configRel})`);
    return 1;
  }
  return result.status === null ? 1 : result.status;
}

function readFailedCount(jsonPath) {
  try {
    const payload = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    return {
      failed: typeof payload.numFailedTests === "number" ? payload.numFailedTests : null,
      total: typeof payload.numTotalTests === "number" ? payload.numTotalTests : null,
      passed: typeof payload.numPassedTests === "number" ? payload.numPassedTests : null,
    };
  } catch {
    return { failed: null, total: null, passed: null };
  }
}

function writeSummary(defaultJson, techDocsJson) {
  const defaultStats = readFailedCount(defaultJson);
  const techDocsStats = readFailedCount(techDocsJson);
  const summary = {
    generatedAt: new Date().toISOString(),
    lanes: [
      { lane: "default", failed: defaultStats.failed ?? -1, total: defaultStats.total ?? 0, passed: defaultStats.passed ?? 0 },
      { lane: "tech-docs", failed: techDocsStats.failed ?? -1, total: techDocsStats.total ?? 0, passed: techDocsStats.passed ?? 0 },
    ],
  };
  fs.mkdirSync(resultsDir, { recursive: true });
  const summaryPath = path.join(resultsDir, "summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  console.log(`Summary written to ${summaryPath}`);
}

const mainStatus = runVitest("tests/vitest.config.ts");
if (mainStatus !== 0) {
  process.exit(mainStatus);
}

/**
 * Regenerate the tech-docs data before its lane. The generator's src/data/*.ts
 * import gitignored generated-documents/data/*.json at module load; without this
 * the lane asserts against whatever stale (or absent) bytes are on disk — P0-1.
 * Mirrors the package's own typecheck/build/gate scripts, which all generate
 * first. A generate failure fails the run rather than testing a stale tree.
 */
const techDocsData = spawnSync(
  process.execPath,
  [path.join(repoRoot, "tech-docs-generator", "scripts", "generate-all.mjs")],
  { cwd: repoRoot, env: process.env, stdio: "inherit", shell: false },
);
if (techDocsData.error) {
  console.error(techDocsData.error);
  process.exit(1);
}
if (techDocsData.status !== 0) {
  process.exit(techDocsData.status === null ? 1 : techDocsData.status);
}

const techDocsStatus = runVitest("tests/vitest.tech-docs.config.ts");
writeSummary(
  path.join(resultsDir, "vitest-results.json"),
  path.join(resultsDir, "vitest-tech-docs-results.json"),
);
process.exit(techDocsStatus);
