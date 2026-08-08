import type { Metadata } from "next";
import { permanentRedirect, notFound } from "next/navigation";
import { normalizeRequestedCategoryId } from "@/lib/catalog/site/categories";
import { buildPageMetadata } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Legacy alias `/products/category/:slug` → canonical `/products/:category/`.
 * Hard redirect so crawlers never index wrong title/canonical shells.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categoryId = normalizeRequestedCategoryId(slug);
  if (!categoryId) {
    notFound();
  }
  return buildPageMetadata(SITE_URL, {
    title: categoryId,
    description: `Office furniture in the ${categoryId} category.`,
    path: `/products/${categoryId}`,
    indexable: false,
  });
}

export default async function LegacyCategorySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryId = normalizeRequestedCategoryId(slug);

  if (!categoryId) {
    notFound();
  }

  permanentRedirect(`/products/${categoryId}/`);
}
