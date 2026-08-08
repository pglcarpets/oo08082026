import type { Page } from "@playwright/test";

/**
 * Errors a cold Next.js dev route can surface while a client chunk is still
 * being written to disk. All are transient — re-navigating after the
 * compiler catches up resolves them without masking a real defect.
 *
 * Extra patterns cover webpack mid-rebuild races after writes under
 * `site/public` (e.g. PNG mirror e2e setup), which leave SSR markup visible
 * while the client bundle fails to attach.
 */
const COLD_CHUNK_ERROR_PATTERNS = [
  /Manifest file is empty/i,
  // Next loadManifest JSON.parse of a mid-write empty/partial webpack manifest
  /Unexpected end of JSON input/i,
  /Invalid or unexpected token/i,
  /Loading chunk [\w/.+-]+ failed/i,
  /ChunkLoadError/i,
  /Failed to fetch dynamically imported module/i,
  /Cannot find module ['"].*['"]/i,
] as const;

/** Pure: does this captured error text indicate a cold-chunk race, not a real bug? */
export function isColdChunkError(errorText: string): boolean {
  return COLD_CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(errorText));
}

export interface WarmDevRouteOptions {
  /** Element the client (not the server) renders, used to confirm hydration. */
  readySelector?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

/**
 * Navigate to `path`, retrying a bounded number of times if the load hits a
 * known cold-chunk race. Logs every retry with the captured error so a real
 * hydration break still surfaces instead of being silently retried away.
 *
 * SSR can make `readySelector` visible before the client bundle finishes; if a
 * cold-chunk pageerror is already recorded after that wait, the navigation is
 * treated as failed and retried rather than handed back as “ready”.
 */
export async function warmDevRoute(
  page: Page,
  path: string,
  options: WarmDevRouteOptions = {},
): Promise<void> {
  const { readySelector, timeoutMs = 60_000, maxRetries = 3 } = options;

  let lastError = "";
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const pageErrors: string[] = [];
    const onPageError = (error: Error) => pageErrors.push(String(error?.message ?? error));
    page.on("pageerror", onPageError);

    try {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: timeoutMs });
      if (readySelector) {
        await page.locator(readySelector).waitFor({ state: "visible", timeout: timeoutMs });
      }
      const coldAfterReady = pageErrors.filter((entry) => isColdChunkError(entry));
      if (coldAfterReady.length > 0) {
        lastError = coldAfterReady.join(" | ");
      } else {
        return;
      }
    } catch (error) {
      lastError = String((error as Error)?.message ?? error);
    } finally {
      page.off("pageerror", onPageError);
    }

    const combined = [lastError, ...pageErrors].join(" | ");
    if (!isColdChunkError(combined) || attempt === maxRetries) {
      throw new Error(
        `warmDevRoute: ${path} failed after ${attempt} attempt(s): ${combined}`,
      );
    }
    console.warn(`warmDevRoute: retrying ${path} (attempt ${attempt + 1}/${maxRetries}) after: ${combined}`);
  }
}
