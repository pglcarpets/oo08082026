import type { Metadata } from "next";
import { SITE_BRAND } from "@/features/site/data/brand";
import { SITE_CONTACT } from "@/features/site/data/contact";
import { locales, defaultLocale, type Locale } from "@/i18n/config";
import { routing } from "@/i18n/routing";

export type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
  type?: "website" | "article";
  /** Set false to skip hreflang alternates (e.g. legal/utility pages). */
  alternates?: boolean;
  /**
   * SITE-SEO-01 / 03 — when false, emit robots noindex/nofollow.
   * Defaults true for marketing pages.
   */
  indexable?: boolean;
};

export type ProductJsonLdInput = {
  name: string;
  description: string;
  /** Canonical product URL (already absolute). */
  url: string;
  /** Absolute or site-root-relative image path(s) shown on the page. */
  image: string | readonly string[];
  /** Stable product identifier (slug or SKU) when visible or released. */
  sku?: string;
  brandName?: string;
  category?: string;
};

/** Locale → BCP 47 language tag used for OG / hreflang. */
export const LOCALE_HREFLANG: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
};

function localeAlternateUrl(siteUrl: string, path: string, locale: Locale): string {
  const origin = normalizeSiteOrigin(siteUrl);
  const canonical = canonicalPath(path);
  const canonicalUrl = buildCanonicalUrl(origin, path);

  if (routing.localePrefix === "never") {
    return canonicalUrl;
  }

  if (locale === defaultLocale) {
    return canonicalUrl;
  }

  return buildCanonicalUrl(origin, `/${locale}${canonical === "/" ? "" : canonical}`);
}

/**
 * Build hreflang alternates for a canonical path.
 * With `localePrefix: "never"`, every language uses the same URL (locale is
 * negotiated via cookie/header). Otherwise non-default locales are prefixed.
 */
export function buildLocaleAlternates(siteUrl: string, path: string) {
  const origin = normalizeSiteOrigin(siteUrl);
  const canonicalUrl = buildCanonicalUrl(origin, path);
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[LOCALE_HREFLANG[locale]] = localeAlternateUrl(origin, path, locale);
  }
  languages["x-default"] = canonicalUrl;
  return languages;
}

type PageJsonLdInput = {
  path: string;
  title: string;
  description: string;
  pageType: "WebPage" | "CollectionPage" | "ContactPage" | "ItemPage";
};

type BreadcrumbItem = {
  name: string;
  path: string;
};

/** Paths for trailingSlash routes — homepage stays `/`, others end with `/`. */
export function canonicalPath(path: string): string {
  if (!path || path === "/") {return "/";}
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

/**
 * Force a same-origin relative path for metadata/canonical builders.
 * Rejects absolute schemes, protocol-relative hosts, backslashes, and
 * control characters so link tags never point off-site (open-redirect class).
 * Unsafe input collapses to `/`.
 */
export function sanitizeCanonicalPath(path: string): string {
  if (path === null || path === undefined || typeof path !== "string") {
    return "/";
  }

  let value = path.trim();
  if (!value || value === "/") {
    return "/";
  }

  // Canonicals are path-only — drop query/hash before further checks.
  const cut = value.search(/[?#]/);
  if (cut >= 0) {
    value = value.slice(0, cut);
  }
  if (!value || value === "/") {
    return "/";
  }

  // Encoded protocol-relative / backslash / NUL before decode.
  if (/%2f%2f/i.test(value) || /%5c/i.test(value) || /%00/i.test(value)) {
    return "/";
  }

  try {
    value = decodeURIComponent(value);
  } catch {
    return "/";
  }

  value = value.trim();
  if (!value) {
    return "/";
  }

  // Reject absolute schemes and protocol-relative before forcing a leading slash.
  if (
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/";
  }

  if (!value.startsWith("/")) {
    value = `/${value}`;
  }

  // Protocol-relative after normalize, or scheme smuggled mid-path.
  if (value.startsWith("//") || value.includes("://")) {
    return "/";
  }

  const hasControlCharacter = Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });
  if (hasControlCharacter) {
    return "/";
  }

  // e.g. `/javascript:alert(1)` after a forced leading slash.
  const withoutLeading = value.replace(/^\/+/, "");
  if (/^[a-z][a-z0-9+.-]*:/i.test(withoutLeading)) {
    return "/";
  }

  return canonicalPath(value);
}

export function buildCanonicalUrl(siteUrl: string, path: string): string {
  const origin = normalizeSiteOrigin(siteUrl);
  // Relative base requires a trailing slash so `/about` resolves under origin, not as sibling path.
  const base = origin.endsWith("/") ? origin : `${origin}/`;
  const safePath = sanitizeCanonicalPath(path);
  const resolved = new URL(safePath.replace(/^\//, ""), base).toString();

  // Defense in depth: never emit a different origin than the configured site host.
  try {
    const expectedOrigin = new URL(base).origin;
    if (new URL(resolved).origin !== expectedOrigin) {
      return new URL("/", base).toString();
    }
  } catch {
    return new URL("/", base).toString();
  }

  return resolved;
}

/**
 * Resolve a page URL for structured data onto the configured site origin.
 * Absolute foreign hosts are rewritten to the same-origin pathname only.
 */
function resolveSameOriginPageUrl(siteUrl: string, url: string): string {
  const origin = normalizeSiteOrigin(siteUrl);
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed) {
    return buildCanonicalUrl(origin, "/").replace(/\/+$/, "");
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) || trimmed.startsWith("//")) {
    try {
      const absolute = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
      const parsed = new URL(absolute);
      const expectedOrigin = new URL(origin.endsWith("/") ? origin : `${origin}/`).origin;
      if (parsed.origin === expectedOrigin) {
        return parsed.toString().replace(/\/+$/, "");
      }
      return buildCanonicalUrl(origin, parsed.pathname || "/").replace(/\/+$/, "");
    } catch {
      return buildCanonicalUrl(origin, "/").replace(/\/+$/, "");
    }
  }

  return buildCanonicalUrl(origin, trimmed).replace(/\/+$/, "");
}

const TITLE_PIPE = /\s*[|–—-]\s*/;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isPureBrandSegment(segment: string): boolean {
  return segment.trim().toLowerCase() === SITE_BRAND.titleSuffix.toLowerCase();
}

/**
 * Count pure brand pipe segments (`| One&Only`).
 * Used by SF-02 unit contracts — more than one is a double-brand title.
 */
export function countBrandPipeSegments(title: string): number {
  if (!title.trim()) {return 0;}
  return title
    .split(TITLE_PIPE)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && isPureBrandSegment(part)).length;
}

/**
 * Normalize caller-supplied site origin for metadataBase / canonicals.
 * Strips trailing slashes only — never invents a host (SITE_URL is caller's job).
 */
export function normalizeSiteOrigin(siteUrl: string): string {
  return siteUrl.trim().replace(/\/+$/, "");
}

/**
 * Collapse repeated brand suffixes and produce one document title.
 * Prevents "Workstations | One&Only | One&Only" from template + manual suffix.
 * Result has at most one pure brand pipe segment (defaultTitle leads with brand once).
 */
export function resolveDocumentTitle(rawTitle: string): string {
  const suffix = SITE_BRAND.titleSuffix;
  const trimmed = rawTitle.trim().replace(/\s+/g, " ");
  if (!trimmed) {return SITE_BRAND.defaultTitle;}
  if (trimmed === SITE_BRAND.defaultTitle) {return SITE_BRAND.defaultTitle;}

  const escaped = escapeRegExp(suffix);
  const trailingBrand = new RegExp(`(?:\\s*[|–—-]\\s*${escaped})+$`, "i");
  const withoutTrailing = trimmed.replace(trailingBrand, "").trim();

  if (
    withoutTrailing === SITE_BRAND.defaultTitle ||
    trimmed === SITE_BRAND.defaultTitle
  ) {
    return SITE_BRAND.defaultTitle;
  }

  if (!withoutTrailing || isPureBrandSegment(withoutTrailing)) {
    return SITE_BRAND.defaultTitle;
  }

  const parts = withoutTrailing
    .split(TITLE_PIPE)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  // Drop pure brand segments from the body; re-append at most once below.
  const bodyParts = parts.filter((part) => !isPureBrandSegment(part));
  if (bodyParts.length === 0) {return SITE_BRAND.defaultTitle;}

  const body = bodyParts.join(" | ");
  if (body === SITE_BRAND.defaultTitle) {return SITE_BRAND.defaultTitle;}

  // Brand already present as a non-pure segment ("About One&Only", "…One&Only Patna").
  // Do not append a second pure brand suffix.
  const brandAsSubstring = new RegExp(escaped, "i");
  if (bodyParts.some((part) => brandAsSubstring.test(part))) {
    return body;
  }

  return `${body} | ${suffix}`;
}

export function buildSiteMetadata(siteUrl: string): Metadata {
  const origin = normalizeSiteOrigin(siteUrl);
  return {
    metadataBase: new URL(origin),
    applicationName: SITE_BRAND.companyName,
    title: {
      default: SITE_BRAND.defaultTitle,
      // Child pages that already include the brand must use buildPageMetadata
      // (`title.absolute`) so Next does not apply this template again.
      template: `%s | ${SITE_BRAND.titleSuffix}`,
    },
    description: SITE_BRAND.description,
    keywords: [
      "office furniture India",
      "premium office furniture",
      "commercial office furniture India",
      "ergonomic office chairs India",
      "modular office workstations",
      "office furniture manufacturer supplier India",
      "corporate office furniture",
      "One&Only",
      "oando furniture",
      "meeting tables office India",
      "office storage solutions",
      "soft seating office",
      "Steelcase Featherlite Humanscale dealer",
      "workspace planning furniture",
      "turnkey office furniture India",
      "enterprise office fit-out",
    ],
    authors: [{ name: SITE_BRAND.companyName, url: origin }],
    creator: SITE_BRAND.companyName,
    publisher: SITE_BRAND.companyName,
    category: "business",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    robots: {
      index: true,
      follow: true,
      // Rich-result friendliness for Google (main marketing surface only).
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    // Optional Search Console / Bing verification — set in env, never hardcode secrets.
    verification: {
      ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()
        ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION.trim() }
        : {}),
      ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim()
        ? {
            other: {
              "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION.trim(),
            },
          }
        : {}),
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.png", type: "image/png", sizes: "192x192" },
        { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
      ],
      shortcut: "/favicon.ico",
      apple: "/icon.png",
    },
    manifest: "/site.webmanifest",
    alternates: {
      canonical: "/",
      languages: buildLocaleAlternates(origin, "/"),
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      alternateLocale: ["hi_IN", "fr_FR", "de_DE", "es_ES"],
      url: origin,
      siteName: SITE_BRAND.siteName,
      title: SITE_BRAND.defaultTitle,
      description: SITE_BRAND.description,
      images: [
        {
          url: SITE_BRAND.ogImage,
          width: 1200,
          height: 630,
          alt: SITE_BRAND.defaultTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_BRAND.defaultTitle,
      description: SITE_BRAND.description,
      images: [SITE_BRAND.ogImage],
    },
  };
}

export function buildPageMetadata(siteUrl: string, input: PageMetadataInput): Metadata {
  const origin = normalizeSiteOrigin(siteUrl);
  const canonicalUrl = buildCanonicalUrl(origin, input.path);
  const image = input.image || SITE_BRAND.ogImage;
  const includeAlternates = input.alternates !== false;
  const indexable = input.indexable !== false;
  const resolvedTitle = resolveDocumentTitle(input.title);
  // Always absolute so the root template cannot re-append the brand.
  const title: Metadata["title"] = { absolute: resolvedTitle };

  return {
    metadataBase: new URL(origin),
    title,
    description: input.description,
    keywords: input.keywords,
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    alternates: {
      canonical: canonicalUrl,
      ...(includeAlternates && indexable
        ? { languages: buildLocaleAlternates(origin, input.path) }
        : {}),
    },
    openGraph: {
      title: resolvedTitle,
      description: input.description,
      url: canonicalUrl,
      type: input.type || "website",
      locale: "en_IN",
      alternateLocale: ["hi_IN", "fr_FR", "de_DE", "es_ES"],
      siteName: SITE_BRAND.siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: resolvedTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: input.description,
      images: [image],
    },
  };
}

function toAbsoluteAssetUrl(siteUrl: string, asset: string): string {
  if (!asset) {return siteUrl;}
  if (/^https?:\/\//i.test(asset)) {return asset;}
  const path = asset.startsWith("/") ? asset : `/${asset}`;
  return new URL(path, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
}

/**
 * SITE-SEO-04 — Product structured data from visible released fields only.
 * Does not invent price or InStock availability.
 */
export function buildProductJsonLd(siteUrl: string, input: ProductJsonLdInput) {
  const pageUrl = resolveSameOriginPageUrl(siteUrl, input.url);
  const rawImages = Array.isArray(input.image) ? input.image : [input.image];
  const images = rawImages
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => toAbsoluteAssetUrl(siteUrl, entry));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${pageUrl}#product`,
    name: input.name,
    description: input.description,
    url: pageUrl,
    ...(images.length > 0
      ? { image: images.length === 1 ? images[0] : images }
      : {}),
    ...(input.sku ? { sku: input.sku } : {}),
    brand: {
      "@type": "Brand",
      name: input.brandName ?? SITE_BRAND.companyName,
    },
    ...(input.category ? { category: input.category } : {}),
  };
}

export function buildPageJsonLd(siteUrl: string, input: PageJsonLdInput) {
  const pageUrl = buildCanonicalUrl(siteUrl, input.path);

  return {
    "@context": "https://schema.org",
    "@type": input.pageType,
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: input.title,
    description: input.description,
    inLanguage: "en-IN",
    isPartOf: { "@id": `${siteUrl}#website` },
    about: { "@id": `${siteUrl}#organization` },
  };
}

export type CareerJobJsonLdInput = {
  title: string;
  department: string;
  location: string;
  description?: string;
};

/**
 * JobPosting graph for careers — office furniture roles only from visible openings.
 * Does not invent salary or remote flags.
 */
export function buildCareerJobsJsonLd(
  siteUrl: string,
  jobs: readonly CareerJobJsonLdInput[],
) {
  const pageUrl = buildCanonicalUrl(siteUrl, "/career");
  return {
    "@context": "https://schema.org",
    "@graph": jobs.map((job, index) => {
      // National hiring signal — do not hard-code East-India-only localities.
      const jobCountry = "IN";
      return {
        "@type": "JobPosting",
        "@id": `${pageUrl}#job-${index + 1}`,
        title: job.title,
        description:
          job.description ||
          `${job.title} (${job.department}) at One&Only — office furniture careers across India. Location: ${job.location}.`,
        employmentType: "FULL_TIME",
        industry: "Office Furniture",
        hiringOrganization: {
          "@type": "Organization",
          name: SITE_BRAND.companyName,
          sameAs: siteUrl,
          "@id": `${siteUrl}#organization`,
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressCountry: jobCountry,
            addressRegion: "IN",
            addressLocality: "India",
          },
        },
        jobLocationType: "TELECOMMUTE",
        applicantLocationRequirements: {
          "@type": "Country",
          name: "India",
        },
        directApply: false,
        url: pageUrl,
      };
    }),
  };
}

export function buildBreadcrumbJsonLd(siteUrl: string, items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildCanonicalUrl(siteUrl, item.path),
    })),
  };
}

export function buildGlobalJsonLd(siteUrl: string) {
  const organizationId = `${siteUrl}#organization`;
  const websiteId = `${siteUrl}#website`;
  const localBusinessId = `${siteUrl}#localbusiness`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_BRAND.companyName,
        url: siteUrl,
        logo: `${siteUrl}/logo-v2.webp`,
        description: SITE_BRAND.organizationDescription,
        email: SITE_CONTACT.salesEmail,
        telephone: SITE_CONTACT.salesPhone,
        areaServed: SITE_CONTACT.areaServed,
        sameAs: [siteUrl, ...SITE_CONTACT.socialLinks.map((link) => link.href)],
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: SITE_CONTACT.salesPhone,
            contactType: "sales",
            areaServed: "IN",
            availableLanguage: [...locales],
          },
          {
            "@type": "ContactPoint",
            telephone: SITE_CONTACT.supportPhone,
            contactType: "customer support",
            areaServed: "IN",
            availableLanguage: [...locales],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteUrl,
        name: SITE_BRAND.siteName,
        description: SITE_BRAND.description,
        inLanguage: "en-IN",
        publisher: { "@id": organizationId },
        // No free-text search route yet — point crawlers at primary commercial hub.
        potentialAction: {
          "@type": "ReadAction",
          target: [`${siteUrl}/products/`, `${siteUrl}/planning/`, `${siteUrl}/contact/`],
        },
      },
      {
        "@type": "FurnitureStore",
        "@id": localBusinessId,
        name: SITE_BRAND.companyName,
        url: siteUrl,
        description: SITE_BRAND.localBusinessDescription,
        parentOrganization: { "@id": organizationId },
        image: `${siteUrl}${SITE_BRAND.ogImage}`,
        logo: `${siteUrl}/logo-v2.webp`,
        address: {
          "@type": "PostalAddress",
          ...SITE_CONTACT.address,
        },
        geo: { "@type": "GeoCoordinates", ...SITE_CONTACT.geo },
        telephone: SITE_CONTACT.salesPhone,
        email: SITE_CONTACT.salesEmail,
        openingHours: SITE_CONTACT.openingHours,
        priceRange: SITE_CONTACT.priceRange,
        areaServed: SITE_CONTACT.areaServed,
        sameAs: SITE_CONTACT.socialLinks.map((link) => link.href),
      },
    ],
  };
}

/**
 * Standalone LocalBusiness (FurnitureStore) JSON-LD for the homepage.
 * Mirrors the entry in `buildGlobalJsonLd` but returns a single node so it
 * can be embedded alongside a WebPage node on the homepage.
 */
export function buildLocalBusinessJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    "@id": `${siteUrl}#localbusiness`,
    name: SITE_BRAND.companyName,
    url: siteUrl,
    description: SITE_BRAND.localBusinessDescription,
    image: `${siteUrl}${SITE_BRAND.ogImage}`,
    logo: `${siteUrl}/logo-v2.webp`,
    address: {
      "@type": "PostalAddress",
      ...SITE_CONTACT.address,
    },
    geo: { "@type": "GeoCoordinates", ...SITE_CONTACT.geo },
    telephone: SITE_CONTACT.salesPhone,
    email: SITE_CONTACT.salesEmail,
    openingHours: SITE_CONTACT.openingHours,
    priceRange: SITE_CONTACT.priceRange,
    areaServed: SITE_CONTACT.areaServed,
    sameAs: SITE_CONTACT.socialLinks.map((link) => link.href),
  };
}
