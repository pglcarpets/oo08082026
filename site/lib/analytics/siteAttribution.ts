const SEO_COOKIE_KEYS = {
  source: "oando_seo_source",
  medium: "oando_seo_medium",
  campaign: "oando_seo_campaign",
  landing: "oando_seo_landing",
} as const;

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

/** Empty string cookies (Max-Age=0 remnants) are treated as absent. */
function cookieOrDefault(name: string, fallback: string): string {
  const value = readCookie(name);
  if (value === null || value.trim() === "") {return fallback;}
  return value;
}

export interface SiteAttributionSnapshot {
  readonly source: string;
  readonly medium: string;
  readonly campaign: string;
  readonly landing: string;
}

export function readSiteAttribution(): SiteAttributionSnapshot {
  return {
    source: cookieOrDefault(SEO_COOKIE_KEYS.source, "direct"),
    medium: cookieOrDefault(SEO_COOKIE_KEYS.medium, "none"),
    campaign: cookieOrDefault(SEO_COOKIE_KEYS.campaign, ""),
    landing: cookieOrDefault(SEO_COOKIE_KEYS.landing, ""),
  };
}