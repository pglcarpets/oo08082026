import { unstable_cache } from "next/cache";

import { DEFAULT_HERO_FALLBACK } from "@/features/site/data/homepage";
import {
  PRODUCTS_CATEGORY_TILE_FALLBACKS,
  type ProductsCategoryTile,
} from "@/features/site/data/productsPage";
import { pickCategoryTileImage } from "@/lib/catalog/site/marketingImages";
import { normalizeAssetPath } from "@/lib/assetPaths";
import { getCatalog } from "@/lib/catalog/site/getProducts";
import {
  buildRequestedCategoryCatalog,
  getCatalogCategoryHref,
  getCatalogCategoryLabel,
  type RequestedCategoryId,
} from "@/lib/catalog/site/categories";

const getCachedCatalog = unstable_cache(async () => getCatalog(), ["home-category-grid-v2"], {
  revalidate: 3600,
  tags: ["catalog"],
});

/** Resolves a category's display label; falls back when the caller has no translation. */
export type CategoryLabelResolver = (categoryId: string, fallback: string) => string;

/**
 * Live catalog tiles for `/products` hub.
 * Kept separate from homepage Collections — products-owned copy and routing.
 */
const identityLabelResolver: CategoryLabelResolver = (_categoryId, fallback) => fallback;

export async function loadProductsCategoryTiles(
  resolveLabel: CategoryLabelResolver = identityLabelResolver,
): Promise<ProductsCategoryTile[]> {
  const requestedCatalog = buildRequestedCategoryCatalog(await getCachedCatalog());

  return requestedCatalog.map((category) => {
    const allProducts = category.series.flatMap((series) => series.products);
    const tileCandidates = allProducts.flatMap((product) => {
      const flagship = normalizeAssetPath(product.flagshipImage);
      const gallery = (product.images ?? []).map((src) => normalizeAssetPath(String(src || "")));
      return [flagship, ...gallery].filter(Boolean) as string[];
    });
    const catalogFallback =
      PRODUCTS_CATEGORY_TILE_FALLBACKS[category.id as RequestedCategoryId] ??
      DEFAULT_HERO_FALLBACK;
    const picked = pickCategoryTileImage(tileCandidates, catalogFallback);
    const image = normalizeAssetPath(picked) || normalizeAssetPath(catalogFallback) || DEFAULT_HERO_FALLBACK;

    return {
      id: category.id,
      name: resolveLabel(category.id, getCatalogCategoryLabel(category.id, category.name)),
      href: getCatalogCategoryHref(category.id),
      image,
      productCount: allProducts.length,
    };
  });
}
