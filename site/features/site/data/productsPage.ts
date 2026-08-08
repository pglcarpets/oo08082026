import type { RequestedCategoryId } from "@/lib/catalog/site/categories";

/**
 * Products hub media â€” executed install photography (marketing surface).
 * PDP product truth stays photography + published SVG elsewhere â€” no AI video on PDP.
 */
export const PRODUCTS_HERO_IMAGE = {
  src: "/assets/marketing/hero/slides/Titan-Oneandonly-bright.webp",
  alt: "Titan office workstations installed by One&Only",
} as const;

/** Poster-first Ken Burns loop from the install still (reduced-motion â†’ poster only). */
export const PRODUCTS_HERO_MEDIA = {
  poster: PRODUCTS_HERO_IMAGE.src,
} as const;

export const PRODUCTS_INTRO_IMAGE = {
  src: "/assets/marketing/ui/categories/seating-clean.webp",
  alt: "Seating from One&Only workplace photography",
} as const;

/** Strategy column preview — marketing UI only. */
export const PRODUCTS_STRATEGY_PREVIEW_IMAGE = {
  src: "/assets/marketing/ui/categories/workstations-clean.webp",
  alt: "Workstation setup used as category planning preview",
} as const;

/**
 * Category tiles — marketing UI only (product-focused; *-v2 busts image cache).
 */
export const PRODUCTS_CATEGORY_TILE_FALLBACKS: Record<RequestedCategoryId, string> = {
  seating: "/assets/marketing/ui/categories/seating-clean.webp",
  workstations: "/assets/marketing/ui/categories/workstations-clean.webp",
  tables: "/assets/marketing/ui/categories/tables-clean.webp",
  storages: "/assets/marketing/ui/categories/storages-clean.webp",
  "soft-seating": "/assets/marketing/ui/categories/soft-seating-clean.webp",
  education: "/assets/marketing/ui/categories/education-clean.webp",
};

/** Homepage collection band â€” same 6 flagship stills as category tiles. */
export const HOMEPAGE_COLLECTION_IMAGES = {
  seating: PRODUCTS_CATEGORY_TILE_FALLBACKS.seating,
  workstations: PRODUCTS_CATEGORY_TILE_FALLBACKS.workstations,
  tables: PRODUCTS_CATEGORY_TILE_FALLBACKS.tables,
  storages: PRODUCTS_CATEGORY_TILE_FALLBACKS.storages,
  "soft-seating": PRODUCTS_CATEGORY_TILE_FALLBACKS["soft-seating"],
  education: PRODUCTS_CATEGORY_TILE_FALLBACKS.education,
} as const;

/** Category listing hero stills â€” `/products/[category]` band above the filter grid. */
export const CATEGORY_LISTING_HERO: Record<
  RequestedCategoryId,
  { src: string; alt: string }
> = {
  seating: {
    src: PRODUCTS_CATEGORY_TILE_FALLBACKS.seating,
    alt: "Seating from the One&Only product catalog",
  },
  workstations: {
    src: PRODUCTS_STRATEGY_PREVIEW_IMAGE.src,
    alt: PRODUCTS_STRATEGY_PREVIEW_IMAGE.alt,
  },
  tables: {
    src: PRODUCTS_CATEGORY_TILE_FALLBACKS.tables,
    alt: "Tables from the One&Only product catalog",
  },
  storages: {
    src: PRODUCTS_CATEGORY_TILE_FALLBACKS.storages,
    alt: "Storage from the One&Only product catalog",
  },
  "soft-seating": {
    src: PRODUCTS_CATEGORY_TILE_FALLBACKS["soft-seating"],
    alt: "Soft seating from the One&Only product catalog",
  },
  education: {
    src: PRODUCTS_CATEGORY_TILE_FALLBACKS.education,
    alt: "Education furniture from the One&Only product catalog",
  },
};

export type ProductsCategoryTile = {
  id: string;
  name: string;
  href: string;
  image: string;
  productCount: number;
};
