export {
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  buildFAQJsonLd,
  buildGlobalJsonLd,
  buildItemListJsonLd,
  buildOpenGraph,
  buildOrganizationJsonLd,
  buildPageJsonLd,
  buildPageMetadata,
  buildProductJsonLd,
  buildSiteMetadata,
  sanitizeCanonicalPath,
  type BreadcrumbItem,
  type FaqJsonLdItem,
  type ItemListEntry,
  type PageJsonLdInput,
  type PageMetadataInput,
  type ProductJsonLdInput,
} from "@/lib/helpers/seo";

/** Single brand authority — never a second copy that can drift from homepage SEO. */
export { SITE_BRAND } from "@/features/site/data/brand";
