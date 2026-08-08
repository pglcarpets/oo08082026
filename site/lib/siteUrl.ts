/** Canonical production origin for robots, sitemap, and page metadata. */
export const PRODUCTION_SITE_URL = "https://oando.co.in";

const configuredSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").trim();
const normalizedConfiguredSiteUrl = configuredSiteUrl.replace(/\/+$/, "");

/**
 * Preview and local hosts must never leak into SEO absolute URLs
 * (robots host, sitemap entries, canonicals, OG urls).
 */
function isUnusableSiteUrl(value: string): boolean {
  if (!value) {
    return true;
  }
  if (/^https?:\/\/[^/]*\.vercel\.app$/i.test(value)) {
    return true;
  }
  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(value)) {
    return true;
  }
  if (/^https?:\/\/0\.0\.0\.0(:\d+)?(\/|$)/i.test(value)) {
    return true;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return true;
    }
    if (!parsed.hostname) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

export const SITE_URL = (
  !isUnusableSiteUrl(normalizedConfiguredSiteUrl)
    ? normalizedConfiguredSiteUrl
    : PRODUCTION_SITE_URL
).replace(/\/+$/, "");
