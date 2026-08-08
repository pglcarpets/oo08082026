import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";

import { CATEGORY_ROUTE_COPY } from "@/features/site/data/routeCopy";
import { buildPageMetadata } from "@/features/site/data/seo";
import {
  Catalog_CATEGORY_ORDER,
  buildRequestedCategoryCatalog,
  getCatalogCategoryDescription,
  getCatalogCategoryLabel,
  normalizeRequestedCategoryId,
} from "@/lib/catalog/site/categories";
import type { CompatCategory } from "@/lib/catalog/site/getProducts";
import { getCatalog } from "@/lib/catalog/site/getProducts";
import { fetchCategoryIdsLive } from "@/lib/catalog/sources";
import { SITE_URL } from "@/lib/siteUrl";

import { CategoryPageView } from "@/features/site/catalog/CategoryPageView";

const BASE_URL = SITE_URL;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categoryId } = await params;
  const canonicalCategoryId = normalizeRequestedCategoryId(categoryId) || categoryId;
  const requestedCatalog = buildRequestedCategoryCatalog(await getCatalog());
  const category = requestedCatalog.find(
    (c: CompatCategory) => c.id === canonicalCategoryId,
  );
  // Empty catalog = offline shell (noindex). Known-missing slug = hard 404 (no soft metadata).
  if (requestedCatalog.length === 0) {
    return { robots: { index: false, follow: false } };
  }
  if (!category) {
    notFound();
  }
  const displayName = getCatalogCategoryLabel(canonicalCategoryId, category.name);
  const displayDescription = getCatalogCategoryDescription(
    canonicalCategoryId,
    category.description,
  );
  const title = displayName;
  const description = `${displayDescription} ${CATEGORY_ROUTE_COPY.metadataTail.replace(
    "{category}",
    displayName.toLowerCase(),
  )}`;
  return buildPageMetadata(BASE_URL, {
    title,
    description,
    path: `/products/${canonicalCategoryId}`,
  });
}

export async function generateStaticParams() {
  const categoryIds = await fetchCategoryIdsLive();
  const merged = [...new Set([...Catalog_CATEGORY_ORDER, ...categoryIds])];
  return merged.map((category) => ({ category }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categoryId } = await params;
  const canonicalCategoryId = normalizeRequestedCategoryId(categoryId);
  if (!canonicalCategoryId) {
    notFound();
  }
  // Alias slugs (e.g. chairs → seating) must hard-redirect for SEO, not soft-render.
  if (canonicalCategoryId !== categoryId) {
    permanentRedirect(`/products/${canonicalCategoryId}/`);
  }

  return CategoryPageView({ categoryId: canonicalCategoryId });
}