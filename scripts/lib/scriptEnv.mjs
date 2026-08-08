/**
 * Shared env for maintenance scripts — not an atomic clock.
 *
 * Prefer discovery + env over frozen hostnames, ports, drive letters, and
 * historical statement totals. The repo moves; scripts should not assume
 * D:\..., :3000 forever, or last year's mass counts.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

/** site/ root (parent of scripts/) */
export function siteRootFrom(importMetaUrl) {
  return path.resolve(path.dirname(fileURLToPath(importMetaUrl)), "..");
}

/** monorepo root (parent of site/) */
export function workspaceRootFrom(importMetaUrl) {
  return path.resolve(siteRootFrom(importMetaUrl), "..");
}

/**
 * Dev/base URL for probes and screenshots.
 * Override: BASE_URL, PLAYWRIGHT_BASE_URL, PROBE_BASE_URL, LAUNCH_SMOKE_BASE_URL
 */
export function baseUrl(fallback = "http://localhost:3000") {
  const raw =
    process.env.BASE_URL ||
    process.env.PLAYWRIGHT_BASE_URL ||
    process.env.PROBE_BASE_URL ||
    process.env.LAUNCH_SMOKE_BASE_URL ||
    fallback;
  return String(raw).replace(/\/+$/, "");
}

/** Optional timeout ms from env (not a frozen "must be exact"). */
export function timeoutMs(fallback = 30_000) {
  const n = Number(process.env.SCRIPT_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
