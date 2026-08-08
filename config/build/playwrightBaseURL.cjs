/**
 * Playwright must use hostname `localhost`, never `127.0.0.1` / `::1`.
 * Next.js treats those as different origins (HMR / loading stuck without matching certs).
 */

const DEFAULT_ORIGIN = "http://localhost:3000";

/**
 * @param {string | undefined} raw
 * @returns {string} origin without trailing slash, host always localhost for loopback
 */
function resolvePlaywrightBaseURL(raw) {
  const input = (raw || process.env.PLAYWRIGHT_BASE_URL || DEFAULT_ORIGIN).trim();
  try {
    const u = new URL(input);
    if (
      u.hostname === "127.0.0.1" ||
      u.hostname === "[::1]" ||
      u.hostname === "::1" ||
      u.hostname === "0.0.0.0" ||
      u.hostname === "localhost"
    ) {
      u.protocol = "http:";
      u.hostname = "localhost";
      if (!u.port) u.port = "3000";
    }
    return u.origin;
  } catch {
    return DEFAULT_ORIGIN;
  }
}

/** Mutate env so specs / child processes never keep 127.0.0.1. */
function forcePlaywrightBaseURLEnv() {
  const origin = resolvePlaywrightBaseURL(process.env.PLAYWRIGHT_BASE_URL);
  process.env.PLAYWRIGHT_BASE_URL = origin;
  return origin;
}

module.exports = {
  DEFAULT_ORIGIN,
  resolvePlaywrightBaseURL,
  forcePlaywrightBaseURLEnv,
};
