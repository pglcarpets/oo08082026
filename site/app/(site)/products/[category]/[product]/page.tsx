import { notFound, redirect } from "next/navigation";
import { ProductViewer } from "@/features/site/catalog/ProductViewer";
import type { Metadata } from "next";
import { Suspense } from "react";
import type { Product, CompatProduct, ProductVariant } from '@/lib/catalog/site/getProducts';
import {
  classifyToRequestedCategory,
  getCatalogCategoryLabel,
  normalizeRequestedCategoryId,
} from '@/lib/catalog/site/categories';
import { fetchCatalogProductsSlugFieldsByCategoryLive } from "@/lib/catalog/catalogDrizzle";
import { normalizeAssetList, normalizeAssetPath, PRODUCT_IMAGE_FALLBACK } from "@/lib/assetPaths";
import {
  fetchProductImagesMap,
  fetchProductSpecsMap,
} from "@/lib/productDataTables";
import { buildProductStaticParams } from "@/lib/catalog/productStaticParams";
import { resolveProductByUrlKey } from "@/lib/productSlugResolver";
import { SITE_URL } from "@/lib/siteUrl";
import { PDP_ROUTE_COPY } from "@/features/site/data/routeCopy";
import {
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  buildProductJsonLd,
} from "@/features/site/data/seo";
import { resolvePdpPlanSvgThumbFromDisk } from "@/features/site/planSvg/resolvePdpPlanSvgThumb.server";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

const BASE_URL = SITE_URL;

type CategoryResolutionRow = {
  id?: string;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  category_id?: string | null;
  series_name?: string | null;
  metadata?: Product["metadata"] | null;
  images?: string[] | null;
  flagship_image?: string | null;
};

function getSourceSlug(row: Pick<CategoryResolutionRow, "metadata">): string {
  const metadataRecord =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : null;
  return metadataRecord && typeof metadataRecord.sourceSlug === "string"
    ? metadataRecord.sourceSlug.trim()
    : "";
}

function resolveRequestedCategoryId(
  row: CategoryResolutionRow,
  fallbackCategoryId?: string,
): string {
  const rawCategoryId = row.category_id || fallbackCategoryId || "";
  const normalized = normalizeRequestedCategoryId(rawCategoryId);
  if (normalized) {return normalized;}

  return classifyToRequestedCategory({
    baseCategoryId: rawCategoryId,
    seriesName: row.series_name || "",
    product: {
      id: row.id || row.slug || rawCategoryId,
      slug: row.slug || "",
      name: row.name || "",
      description: row.description || "",
      flagshipImage: row.flagship_image || "",
      sceneImages: [],
      variants: [],
      detailedInfo: {
        overview: "",
        features: [],
        dimensions: "",
        materials: [],
      },
      metadata: row.metadata || {},
      images: Array.isArray(row.images) ? row.images : [],
    },
  });
}

async function resolvePreferredProductSlug(
  row: CategoryResolutionRow,
): Promise<string | null> {
  const currentSlug = typeof row.slug === "string" ? row.slug.trim() : "";
  const sourceSlug = getSourceSlug(row);
  const categoryId = typeof row.category_id === "string" ? row.category_id.trim() : "";
  const productName = typeof row.name === "string" ? row.name.trim() : "";

  if (!currentSlug || currentSlug.startsWith("oando-") || !sourceSlug || !categoryId) {
    return null;
  }

  const candidates = await fetchCatalogProductsSlugFieldsByCategoryLive(categoryId);

  const canonicalMatch = (candidates ?? []).find((candidate) => {
    const candidateSlug =
      typeof candidate.slug === "string" ? candidate.slug.trim() : "";
    const candidateSourceSlug = getSourceSlug(candidate);
    const candidateName = typeof candidate.name === "string" ? candidate.name.trim() : "";

    return (
      candidateSlug.startsWith("oando-") &&
      candidateSlug !== currentSlug &&
      candidateSourceSlug === sourceSlug &&
      candidateName === productName
    );
  });

  return canonicalMatch?.slug || null;
}

export async function generateStaticParams() {
  return buildProductStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}): Promise<Metadata> {
  const { category: categoryId, product: productUrlKey } = await params;

  const productResolution = await resolveProductByUrlKey<CategoryResolutionRow>(
    productUrlKey,
    "id, slug, name, description, category_id, metadata, series_name, images, flagship_image",
  );
  const product = productResolution.row;

  // Unknown product must hard-404 — empty metadata is a soft-404 SEO risk.
  if (!product) {
    notFound();
  }
  const resolvedCategoryId = resolveRequestedCategoryId(
    product as CategoryResolutionRow,
    categoryId,
  );
  const preferredCanonicalSlug = await resolvePreferredProductSlug(
    product as CategoryResolutionRow,
  );

  const productName = typeof product.name === "string" ? product.name : "";
  const title = productName;
  const descriptionFallback = PDP_ROUTE_COPY.fallbackDescription.replace(
    "{name}",
    productName,
  );
  const description = product.description || descriptionFallback;
  const images = Array.isArray(product.images) ? product.images : [];
  const image =
    normalizeAssetPath(images.length > 0 ? images[0] : null, { probeDisk: true }) ||
    normalizeAssetPath(product.flagship_image, { probeDisk: true }) ||
    PRODUCT_IMAGE_FALLBACK;
  const canonicalProductUrlKey =
    preferredCanonicalSlug || productResolution.canonicalSlug || productUrlKey;

  return buildPageMetadata(BASE_URL, {
    title,
    description,
    path: `/products/${resolvedCategoryId}/${canonicalProductUrlKey}`,
    image,
  });
}

function ProductLoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse space-y-4 w-full max-w-4xl px-6">
        <div className="h-96 rounded bg-muted" />
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </div>
    </div>
  );
}

async function ProductContent({
  categoryId,
  productUrlKey,
}: {
  categoryId: string;
  productUrlKey: string;
}) {
  const productResolution = await resolveProductByUrlKey<Product>(productUrlKey, "*");
  const rawProduct = productResolution.row;

  if (!rawProduct) {
    notFound();
  }

  const p = rawProduct as Product & {
    alt_text?: string;
    metadata?: (Product["metadata"] & { ai_alt_text?: string }) | null;
    scene_images?: string[] | null;
    detailed_info?: {
      overview?: string;
      features?: string[];
      dimensions?: string;
      materials?: string[];
    } | null;
    variants?: unknown;
  };
  const [specsMap, imagesMap] = await Promise.all([
    fetchProductSpecsMap([p.id]),
    fetchProductImagesMap([p.id]),
  ]);

  const tableSpecs = specsMap.get(p.id);
  const mergedSpecs =
    tableSpecs && Object.keys(tableSpecs).length > 0 ? tableSpecs : p.specs || {};
  const specsFeatures = Array.isArray((mergedSpecs as { features?: unknown }).features)
    ? ((mergedSpecs as { features?: unknown[] }).features ?? [])
        .map((value) => String(value).trim())
        .filter(Boolean)
    : [];
  const specsDimensions =
    typeof (mergedSpecs as { dimensions?: unknown }).dimensions === "string"
      ? String((mergedSpecs as { dimensions?: string }).dimensions).trim()
      : "";
  const specsMaterials = Array.isArray((mergedSpecs as { materials?: unknown }).materials)
    ? ((mergedSpecs as { materials?: unknown[] }).materials ?? [])
        .map((value) => String(value).trim())
        .filter(Boolean)
    : [];
  const imageBundle = imagesMap.get(p.id);
  const diskProbe = { probeDisk: true } as const;
  const mergedFlagship =
    imageBundle?.flagshipImage || normalizeAssetPath(p.flagship_image, diskProbe);
  const mergedImages =
    imageBundle?.images && imageBundle.images.length > 0
      ? imageBundle.images
      : normalizeAssetList(p.images, diskProbe);
  const mergedSceneImages =
    imageBundle?.sceneImages && imageBundle.sceneImages.length > 0
      ? imageBundle.sceneImages
      : Array.isArray(p.scene_images)
        ? normalizeAssetList(p.scene_images, diskProbe)
        : [];

  const resolvedCategoryId = resolveRequestedCategoryId(
    p as CategoryResolutionRow,
    categoryId,
  );
  const preferredCanonicalSlug = await resolvePreferredProductSlug(
    p as CategoryResolutionRow,
  );
  const canonicalProductUrlKey =
    preferredCanonicalSlug || productResolution.canonicalSlug || productUrlKey;
  const normalizedUrlCategory = normalizeRequestedCategoryId(categoryId) || categoryId;
  if (resolvedCategoryId !== normalizedUrlCategory) {
    redirect(`/products/${resolvedCategoryId}/${canonicalProductUrlKey}`);
  }
  const aiOverview = p.alt_text || p.metadata?.ai_alt_text || p.description || "";
  const deterministicAlt =
    p.alt_text ||
    p.metadata?.ai_alt_text ||
    `Product image of ${p.name} in ${resolvedCategoryId.replace(/-/g, " ")} category`
      .replace(/\s+/g, " ")
      .trim();
  const variantList: ProductVariant[] = Array.isArray(p.variants)
    ? p.variants
        .map((variant, idx) => {
          const v = variant as {
            id?: string;
            variantName?: string;
            galleryImages?: string[];
            threeDModelUrl?: string;
          };
          return {
            id: v.id || `variant-${idx + 1}`,
            variantName: v.variantName || `Option ${idx + 1}`,
            galleryImages: normalizeAssetList(v.galleryImages, diskProbe),
            threeDModelUrl: normalizeAssetPath(v.threeDModelUrl, diskProbe) || undefined,
          };
        })
        .filter((variant) => variant.galleryImages.length > 0 || variant.threeDModelUrl)
    : [];

  const compatProduct: CompatProduct = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description || "",
    flagshipImage: mergedFlagship,
    sceneImages: mergedSceneImages,
    images: mergedImages,
    threeDModelUrl: normalizeAssetPath(
      variantList.find((v) => v.threeDModelUrl)?.threeDModelUrl || p["3d_model"],
      diskProbe,
    ),
    variants: variantList,
    detailedInfo: {
      overview: p.detailed_info?.overview || aiOverview,
      features: p.detailed_info?.features?.filter(Boolean) ||
        (specsFeatures.length > 0 ? specsFeatures : undefined) ||
        p.features?.filter(Boolean) ||
        [],
      dimensions: p.detailed_info?.dimensions || specsDimensions || "",
      materials:
        p.detailed_info?.materials?.filter(Boolean) ||
        (specsMaterials.length > 0 ? specsMaterials : undefined) ||
        [],
    },
    metadata: p.metadata || {},
    altText: deterministicAlt,
    specs: mergedSpecs,
  };

  const categoryRoute = `/products/${resolvedCategoryId}`;

  const url = `${BASE_URL}/products/${resolvedCategoryId}/${canonicalProductUrlKey}`;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(BASE_URL, [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    {
      name: getCatalogCategoryLabel(resolvedCategoryId, resolvedCategoryId),
      path: `/products/${resolvedCategoryId}`,
    },
    { name: p.name, path: `/products/${resolvedCategoryId}/${canonicalProductUrlKey}` },
  ]);
  // SITE-SEO-04: structured data mirrors visible name/description/images only.
  // No invented price or InStock claim.
  const visibleDescription =
    (typeof p.description === "string" && p.description.trim()) ||
    (typeof compatProduct.detailedInfo?.overview === "string" &&
      compatProduct.detailedInfo.overview.trim()) ||
    aiOverview;
  const visibleImages =
    mergedImages.length > 0
      ? mergedImages
      : mergedFlagship
        ? [mergedFlagship]
        : [];
  const productJsonLd = buildProductJsonLd(BASE_URL, {
    name: p.name,
    description: visibleDescription,
    url,
    image: visibleImages,
    sku: canonicalProductUrlKey,
    brandName: PDP_ROUTE_COPY.productBrand,
    category: getCatalogCategoryLabel(resolvedCategoryId, resolvedCategoryId),
  });

  const sourceSlug = getSourceSlug(p as CategoryResolutionRow);
  const metadataRecord =
    p.metadata && typeof p.metadata === "object"
      ? (p.metadata as Record<string, unknown>)
      : null;
  const planSlugFromMeta =
    metadataRecord && typeof metadataRecord.planSlug === "string"
      ? metadataRecord.planSlug.trim()
      : "";
  const planSvgThumb = resolvePdpPlanSvgThumbFromDisk({
    productSlug: p.slug || canonicalProductUrlKey,
    sourceSlug: sourceSlug || null,
    planSlug: planSlugFromMeta || null,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(productJsonLd) }}
      />
      <ProductViewer
        product={compatProduct}
        categoryRoute={categoryRoute}
        categoryId={resolvedCategoryId}
        categoryName={getCatalogCategoryLabel(resolvedCategoryId, resolvedCategoryId)}
        productRoute={`/products/${resolvedCategoryId}/${canonicalProductUrlKey}`}
        planSvgThumbUrl={planSvgThumb?.url ?? null}
      />
    </>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}) {
  const { category: categoryId, product: productUrlKey } = await params;

  return (
    <Suspense fallback={<ProductLoadingSkeleton />}>
      <ProductContent
        categoryId={categoryId}
        productUrlKey={productUrlKey}
      />
    </Suspense>
  );
}
