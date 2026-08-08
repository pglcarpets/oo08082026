/**
 * Browser-origin checks for public mutators (no session cookie CSRF).
 * Allows same-host requests and rejects unexpected cross-site POSTs.
 */

function parseOrigin(value: string | null): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * True when Origin/Referer matches the request host (or is absent — non-browser clients).
 * Missing Origin+Referer is allowed for same-site form tools and server-to-server tests;
 * cross-origin browsers always send Origin on POST.
 */
export function isAllowedBrowserOrigin(req: {
  headers: { get(name: string): string | null };
  nextUrl?: { origin: string };
  url?: string;
}): boolean {
  const originHeader = req.headers.get("origin");
  const refererHeader = req.headers.get("referer");

  // Non-browser callers (curl, unit tests) often omit both.
  if (!originHeader && !refererHeader) {
    return true;
  }

  let requestOrigin: string;
  try {
    requestOrigin =
      req.nextUrl?.origin ??
      new URL(req.url ?? "http://localhost").origin;
  } catch {
    return false;
  }

  const origin = parseOrigin(originHeader);
  if (origin) {
    return origin.origin === requestOrigin;
  }

  const referer = parseOrigin(refererHeader);
  if (referer) {
    return referer.origin === requestOrigin;
  }

  return false;
}
