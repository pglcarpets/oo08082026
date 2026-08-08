/**
 * Full vitest gate: default parallel suite, then low-concurrency tech-docs lane.
 * Invokes vitest via node (not nested `pnpm exec`) so Windows does not OOM/crash
 * the second lane after a long first run (exit 4294967295).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vitestEntry = path.join(repoRoot, "node_modules", "vitest", "vitest.mjs");

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

const mainStatus = runVitest("tests/vitest.config.ts");
if (mainStatus !== 0) {
  process.exit(mainStatus);
}

/**
 * Regenerate the tech-docs data before its lane. The generator's src/data/*.ts
 * import gitignored generated-documents/data/*.json at module load; without this
 * the lane asserts against whatever stale (or absent) bytes are on disk — F1.
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
process.exit(techDocsStatus);
