/**
 * Single dev-server lock for planner Playwright jobs (gate runner + direct specs).
 * Prevents overlapping `next dev` on port 3000 from burning 9–17m on timeouts.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

export const PLAYWRIGHT_DEV_LOCK_PATH = path.join(
  repoRoot,
  "results",
  "planner",
  ".playwright-dev.lock",
);

/** Max expected single Playwright / gate duration before lock is stale. */
export const PLAYWRIGHT_DEV_LOCK_STALE_MS = 30 * 60 * 1000;

/**
 * @param {string} owner
 * @param {number} [pid]
 */
function readLockOrNull() {
  try {
    return JSON.parse(fs.readFileSync(PLAYWRIGHT_DEV_LOCK_PATH, "utf8"));
  } catch {
    return null;
  }
}

function lockHeldMessage(lock) {
  return (
    `Playwright dev lock held by ${lock.owner ?? "?"} ` +
    `(pid=${lock.pid ?? "?"}, started=${lock.startedAt ?? "?"}). ` +
    `Wait for the active run or remove stale lock: ${PLAYWRIGHT_DEV_LOCK_PATH}`
  );
}

function writeLockAtomically(owner, pid) {
  fs.writeFileSync(
    PLAYWRIGHT_DEV_LOCK_PATH,
    `${JSON.stringify({
      owner,
      pid,
      startedAt: new Date().toISOString(),
    })}\n`,
    { encoding: "utf8", flag: "wx" },
  );
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err?.code === "EPERM";
  }
}

export function acquirePlaywrightDevLock(owner, pid = process.pid) {
  fs.mkdirSync(path.dirname(PLAYWRIGHT_DEV_LOCK_PATH), { recursive: true });
  try {
    writeLockAtomically(owner, pid);
    return;
  } catch (err) {
    if (err?.code !== "EEXIST") {
      throw err;
    }
  }

  const existing = readLockOrNull();
  const startedMs = Date.parse(existing?.startedAt ?? "");
  const age = Number.isFinite(startedMs)
    ? Date.now() - startedMs
    : PLAYWRIGHT_DEV_LOCK_STALE_MS + 1;
  const holderIsAlive = isProcessAlive(existing?.pid);

  if (holderIsAlive && age < PLAYWRIGHT_DEV_LOCK_STALE_MS) {
    const error = new Error(lockHeldMessage(existing ?? {}));
    error.name = "PlaywrightDevLockError";
    throw error;
  }

  console.warn(
    `[playwright-dev-lock] removing stale lock (age=${Math.round(age / 1000)}s, alive=${holderIsAlive}, was=${existing?.owner ?? "?"})`,
  );
  try {
    fs.unlinkSync(PLAYWRIGHT_DEV_LOCK_PATH);
  } catch {
    // ignore — retry atomic create below
  }
  try {
    writeLockAtomically(owner, pid);
  } catch (err) {
    if (err?.code === "EEXIST") {
      const raced = readLockOrNull();
      const error = new Error(lockHeldMessage(raced ?? {}));
      error.name = "PlaywrightDevLockError";
      throw error;
    }
    throw err;
  }
}

/**
 * @param {number} [pid]
 */
export function releasePlaywrightDevLock(pid = process.pid) {
  try {
    if (!fs.existsSync(PLAYWRIGHT_DEV_LOCK_PATH)) return;
    const lock = JSON.parse(fs.readFileSync(PLAYWRIGHT_DEV_LOCK_PATH, "utf8"));
    if (lock.pid === pid) {
      fs.unlinkSync(PLAYWRIGHT_DEV_LOCK_PATH);
    }
  } catch {
    // ignore — stale recovery on next acquire
  }
}
