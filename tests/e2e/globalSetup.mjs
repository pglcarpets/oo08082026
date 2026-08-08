import {
  acquirePlaywrightDevLock,
} from "../../scripts/playwright-dev-lock.mjs";

const LOCK_WAIT_MS = 30_000;
const LOCK_POLL_MS = 5_000;

/** Skip when parent gate runner already holds the shared dev lock. */
export default async function globalSetup() {
  if (process.env.PLAYWRIGHT_DEV_LOCK_SKIP === "1") {
    return;
  }
  if (process.env.PLAYWRIGHT_BASE_URL?.trim()) {
    return;
  }

  const deadline = Date.now() + LOCK_WAIT_MS;
  let attempt = 0;
  while (Date.now() < deadline) {
    try {
      acquirePlaywrightDevLock("playwright");
      if (attempt > 0) {
        console.info(
          `[globalSetup] dev lock acquired after ${attempt} wait poll(s)`,
        );
      }
      return;
    } catch (err) {
      if (err?.name !== "PlaywrightDevLockError") {
        throw err;
      }
      attempt += 1;
      const remaining = Math.max(0, deadline - Date.now());
      if (remaining <= 0) break;
      console.info(
        `[globalSetup] dev lock busy — ${err.message} (retry in ${LOCK_POLL_MS / 1000}s)`,
      );
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(LOCK_POLL_MS, remaining)),
      );
    }
  }

  throw new Error(
    `Timed out after ${LOCK_WAIT_MS / 1000}s waiting for Playwright dev lock`,
  );
}
