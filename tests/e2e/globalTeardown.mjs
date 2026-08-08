import {
  releasePlaywrightDevLock,
} from "../../scripts/playwright-dev-lock.mjs";

export default async function globalTeardown() {
  if (process.env.PLAYWRIGHT_DEV_LOCK_SKIP === "1") {
    return;
  }
  if (process.env.PLAYWRIGHT_BASE_URL?.trim()) {
    return;
  }
  releasePlaywrightDevLock();
}