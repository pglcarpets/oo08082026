export const CONSENT_COOKIE = "oando_cookie_consent";
export const CONSENT_ACCEPTED = "accepted";
export const CONSENT_REJECTED = "rejected";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {return null;}
  const prefix = `${name}=`;
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!entry) {return null;}
  return decodeURIComponent(entry.slice(prefix.length));
}

export function hasConsentChoice(): boolean {
  if (typeof document === "undefined") {return false;}
  const value = readCookie(CONSENT_COOKIE);
  return value === CONSENT_ACCEPTED || value === CONSENT_REJECTED;
}

/** Analytics and conversion events emit only after explicit or timed accept. */
export function hasAnalyticsConsent(): boolean {
  return readCookie(CONSENT_COOKIE) === CONSENT_ACCEPTED;
}