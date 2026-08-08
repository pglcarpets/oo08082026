/**
 * Normalize loopback IPs so rate-limit keys match across `localhost` and `127.0.0.1`.
 * Browser tests must use http://localhost:3000 (AGENTS.md); proxy fallbacks often emit 127.0.0.1.
 */
export function normalizeClientIp(ip: string): string {
  const trimmed = ip.trim().toLowerCase();
  if (trimmed === "127.0.0.1" || trimmed === "::1") {
    return "localhost";
  }
  return ip.trim();
}
