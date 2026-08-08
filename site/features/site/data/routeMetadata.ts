import type { Metadata } from "next";
import { SITE_BRAND } from "@/features/site/data/brand";
import {
  LEGAL_PAGE_COPY,
  PRODUCTS_PAGE_COPY,
  SOLUTIONS_PAGE_COPY,
  DOWNLOADS_PAGE_COPY,
  COMPARE_ROUTE_COPY,
  QUOTE_CART_ROUTE_COPY,
  SHOWROOMS_PAGE_COPY,
  TRUSTED_BY_PAGE_COPY,
  PLANNING_PAGE_COPY,
  SERVICE_PAGE_COPY,
  SUSTAINABILITY_PAGE_COPY,
  CAREER_PAGE_COPY,
  ABOUT_PAGE_COPY,
  CONTACT_PAGE_COPY,
} from "@/features/site/data/routeCopy";
import { buildPageMetadata } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Centralized metadata registry for all static site routes.
 * Each entry yields unique title, description, canonical URL, OG tags,
 * Twitter cards, and i18n hreflang alternates via `buildPageMetadata`.
 *
 * Pages with dynamic params (products/[category], products/[category]/[product],
 * solutions/[category], planner features/[slug]) use `generateMetadata` and
 * are not listed here.
 */

export const ABOUT_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "About One&Only | Office furniture Patna — Steelcase & Featherlite",
  description: ABOUT_PAGE_COPY.heroSubtitle,
  path: "/about",
  keywords: [
    "office furniture Patna",
    "office furniture Ranchi",
    "office furniture Bihar",
    "office furniture Jharkhand",
    "office furniture dealer Patna",
    "office furniture dealer Ranchi",
    "Steelcase dealer Bihar",
    "Steelcase dealer Jharkhand",
    "Featherlite office furniture Patna",
    "Humanscale ergonomic seating Ranchi",
    "authorized office furniture dealer",
    "workspace planning partner East India",
    "about One&Only",
  ],
});

export const SOLUTIONS_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: SOLUTIONS_PAGE_COPY.metadataTitle,
  description: SOLUTIONS_PAGE_COPY.metadataDescription,
  path: "/solutions",
  keywords: [
    "workspace planning approach",
    "office furniture delivery model",
    "project execution Bihar",
    "workspace fit-out India",
  ],
});

export const CONTACT_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "Contact sales | Office furniture Patna & Ranchi | One&Only",
  description: CONTACT_PAGE_COPY.heroSubtitle,
  path: "/contact",
  image: "/assets/marketing/hero/slides/TVS3-Oneandonly-bright.webp",
  keywords: [
    "contact office furniture Patna",
    "office furniture dealer Ranchi",
    "office furniture quote Bihar",
    "office furniture support Jharkhand",
    "Steelcase Featherlite Humanscale contact",
    "workspace planning enquiry Patna",
    "quote request office furniture",
    "sales contact One&Only",
  ],
});

export const SUSTAINABILITY_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "Sustainable office furniture | One&Only",
  description: SUSTAINABILITY_PAGE_COPY.heroSubtitle,
  path: "/sustainability",
  image: "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  keywords: [
    "sustainable office furniture",
    "long-life workspace systems",
    "durable office furniture Patna",
    "eco-conscious furniture Bihar Jharkhand",
  ],
});

export const SERVICE_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${SERVICE_PAGE_COPY.heroTitle} | One&Only`,
  description: SERVICE_PAGE_COPY.heroSubtitle,
  path: "/service",
  /** Same family hero as planning / privacy / downloads for visual parity. */
  image: "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  keywords: [
    "office furniture service support",
    "after-sales support furniture",
    "warranty support Bihar",
    "installation support office furniture",
  ],
});

export const PLANNING_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${PLANNING_PAGE_COPY.heroTitle} | One&Only`,
  description: PLANNING_PAGE_COPY.heroSubtitle,
  path: "/planning",
  keywords: [
    "workspace planning service",
    "office layout planning Patna",
    "space planning Bihar",
    "furniture layout design India",
  ],
});

export const DOWNLOADS_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${DOWNLOADS_PAGE_COPY.metadataTitle} | One&Only`,
  description: DOWNLOADS_PAGE_COPY.metadataDescription,
  path: "/downloads",
  keywords: [
    "product catalogs office furniture",
    "technical sheets furniture",
    "planning references workspace",
    "resource desk One&Only",
  ],
});

export const PRIVACY_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "Privacy Policy | One&Only Patna & Ranchi",
  description:
    "How One&Only handles enquiry data, cookies, and records for furniture planning support in Patna, Ranchi, Bihar and Jharkhand.",
  path: "/privacy",
  image: "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  keywords: [
    "One&Only privacy policy",
    "office furniture privacy Patna",
    "enquiry data cookies India",
    "privacy policy Bihar Jharkhand",
  ],
});

export const TERMS_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "Terms & Conditions | One&Only office furniture",
  description:
    "Website, quotation, delivery, warranty, and support terms for One&Only office furniture in Patna, Ranchi, Bihar and Jharkhand.",
  path: "/terms",
  alternates: false,
  image: "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
});

export const REFUND_POLICY_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${LEGAL_PAGE_COPY.refund.metadataTitle} | One&Only`,
  description: LEGAL_PAGE_COPY.refund.metadataDescription,
  path: "/refund-and-return-policy",
  alternates: false,
});

export const COMPARE_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "Compare office furniture | Patna & Ranchi | One&Only",
  description: COMPARE_ROUTE_COPY.description,
  path: "/compare",
  keywords: [
    "compare office furniture",
    "compare office furniture Patna",
    "compare office furniture Ranchi",
    "office furniture comparison Bihar",
    "office furniture comparison Jharkhand",
    "compare workstations chairs storage",
    "Steelcase Featherlite Humanscale compare",
    "furniture shortlist India",
  ],
});

export const QUOTE_CART_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${QUOTE_CART_ROUTE_COPY.title} | One&Only`,
  description: QUOTE_CART_ROUTE_COPY.description,
  path: "/quote-cart",
  alternates: false,
  indexable: false,
});

export const SHOWROOMS_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${SHOWROOMS_PAGE_COPY.heroTitle} | One&Only Patna`,
  description: SHOWROOMS_PAGE_COPY.heroSubtitle,
  path: "/showrooms",
  image: "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  keywords: [
    "office furniture showroom Patna",
    "furniture display Bihar",
    "workspace showroom India",
    "One&Only showroom",
  ],
});

export const CLIENTS_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "Trusted clients | Office furniture delivery | One&Only",
  description:
    "Workplace installations for government, finance, manufacturing, and institutions across Patna, Ranchi, Bihar and Jharkhand.",
  path: "/clients",
  image: "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  keywords: [
    "office furniture clients India",
    "office furniture clients Patna",
    "workspace delivery clients Bihar",
    "enterprise office furniture Jharkhand",
    "DMRC Titan TVS office furniture",
    "completed office fit-out photos",
  ],
});

export const TRUSTED_BY_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${TRUSTED_BY_PAGE_COPY.heroTitle} | One&Only`,
  description: TRUSTED_BY_PAGE_COPY.heroSubtitle,
  path: "/trusted-by",
  image: "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  keywords: [
    "trusted office furniture clients",
    "enterprise furniture clients India",
    "government furniture supplier",
    "corporate furniture partner",
  ],
});

export const ACCESS_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "Sign in | One&Only office furniture planner",
  description:
    "Sign in or continue as a guest to plan office furniture layouts and product selections. Not indexed — account entry only.",
  path: "/access",
  alternates: false,
  indexable: false,
});

export const CHOOSE_PRODUCT_PAGE_METADATA: Metadata = buildPageMetadata(
  SITE_URL,
  {
    title: "Choose planner entry | Office furniture workspace | One&Only",
    description:
      "Start the office furniture planner as guest or signed-in member. Layout, catalog placement, and BOQ export for Patna, Ranchi, Bihar and Jharkhand. Workspace entry — not indexed.",
    path: "/choose-product",
    alternates: false,
    indexable: false,
  },
);

export const CAREER_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "Careers | Office furniture jobs | One&Only",
  description: CAREER_PAGE_COPY.heroSubtitle,
  path: "/career",
  keywords: [
    "office furniture jobs Patna",
    "office furniture jobs Ranchi",
    "office furniture careers Bihar",
    "office furniture careers Jharkhand",
    "Steelcase Featherlite Humanscale careers",
    "workspace planning jobs Patna",
    "furniture sales jobs Bihar",
    "furniture operations jobs Ranchi",
    "One&Only careers",
  ],
});

export const TEMPLATES_PAGE_FALLBACK_TITLE = "Workspace Templates | One&Only";

export const PRODUCTS_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${PRODUCTS_PAGE_COPY.headlineLead} ${PRODUCTS_PAGE_COPY.headlineAccent}`,
  description: PRODUCTS_PAGE_COPY.heroSubtitle,
  path: "/products",
  image: "/assets/marketing/ui/categories/workstations-clean.webp",
  keywords: [
    "office furniture products India",
    "workstations chairs tables storage",
    "office furniture catalog Bihar",
    "ergonomic furniture products",
  ],
});

/**
 * Registry copy for planner marketing routes.
 * Live pages under `app/planner/(marketing)/` currently build metadata inline —
 * keep these strings identical so ownership and SEO stay single-sourced when wired.
 */
export const PLANNER_LANDING_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "Workspace Planner — Design Your Office Layout",
  description:
    "Plan desks, zones, and equipment on mm-accurate floor plans. 2D and 3D views, AI layout assist, and branded PDF export for client-ready proposals.",
  path: "/planner",
  image: "/planner-og.webp",
  keywords: [
    "workspace planner",
    "office layout tool",
    "floor plan furniture",
    "office space planning",
    "2D floor plan",
    "3D office planner",
    "One&Only planner",
  ],
});

export const PLANNER_HELP_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "Planner Help — Workspace Layout Guide",
  description:
    "Learn how to draw walls, place furniture, measure areas, use AI assist, and export branded PDF floor plans.",
  path: "/planner/help",
  keywords: ["planner help", "floor plan guide", "workspace layout tutorial"],
});

export const PLANNER_FEATURES_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "Planner Features — Measure, Catalog, 3D & Export",
  description:
    "Explore workspace planner capabilities: measurements, catalog furniture, 3D view, AI assist, and branded PDF export.",
  path: "/planner/features",
  keywords: [
    "planner features",
    "floor plan measurement",
    "office layout 3d",
    "furniture catalog planner",
  ],
});

export { SITE_BRAND };
