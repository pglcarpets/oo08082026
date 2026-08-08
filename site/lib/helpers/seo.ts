export {
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  buildGlobalJsonLd,
  buildPageJsonLd,
  buildPageMetadata,
  buildSiteMetadata,
  canonicalPath,
  countBrandPipeSegments,
  normalizeSiteOrigin,
  resolveDocumentTitle,
  sanitizeCanonicalPath,
} from "@/features/site/data/seo";

export type {
  PageMetadataInput,
  ProductJsonLdInput,
} from "@/features/site/data/seo";

import { buildProductJsonLd as buildProductJsonLdCore } from "@/features/site/data/seo";
import type { ProductJsonLdInput } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";

/** Prefer `(siteUrl, input)`. Single-object form kept for older call sites. */
export function buildProductJsonLd(
  siteUrlOrData: string | ProductJsonLdInput,
  input?: ProductJsonLdInput,
) {
  if (typeof siteUrlOrData === "string") {
    if (!input) {
      throw new Error("buildProductJsonLd requires product fields when siteUrl is a string");
    }
    return buildProductJsonLdCore(siteUrlOrData, input);
  }
  // Never trust product.url host for the site origin — use configured SITE_URL only.
  return buildProductJsonLdCore(SITE_URL, siteUrlOrData);
}

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type FaqJsonLdItem = {
  question: string;
  answer: string;
};

export type ItemListEntry = {
  name: string;
  item: string;
};

export type PageJsonLdInput = {
  path: string;
  title: string;
  description: string;
  pageType: "WebPage" | "CollectionPage" | "ContactPage" | "ItemPage";
};

export function buildFAQJsonLd(items: FaqJsonLdItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildItemListJsonLd(items: ItemListEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}

export function buildOpenGraph(data: {
  title: string;
  description: string;
  url: string;
  image: string;
}) {
  return {
    title: data.title,
    description: data.description,
    url: data.url,
    images: [data.image],
  };
}

export function buildOrganizationJsonLd(data: {
  name: string;
  url: string;
  logo: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.name,
    url: data.url,
    logo: data.logo,
  };
}


