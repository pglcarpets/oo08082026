import {
  normalizeAssetPath,
  resolveProductCatalogAssets,
} from "@/lib/assetPaths";
import { filterProductCatalogMedia } from "@/lib/catalog/site/catalogProductFilters";
import { resolveDisplayEcoScore } from "@/lib/catalog/site/ecoScore";
import { normalizeCatalogProductId } from "@/lib/uuid/normalizeUuid";
import localCatalogIndex from "@/features/site/data/localCatalogIndex.json";
import type { CompatProduct, Product } from "./types";

type LocalCatalogIndexRow = {
  slug: string;
  flagship_image?: string;
  images?: string[];
};

function catalogIndexAssetsForSlug(slug: string): {
  flagship?: string;
  images?: string[];
} {
  const trimmed = String(slug || "").trim();
  const entry = (localCatalogIndex as LocalCatalogIndexRow[]).find(
    (row) =>
      row.slug === trimmed ||
      (trimmed && row.slug?.endsWith(`--${trimmed}`)),
  );
  if (!entry) {return {};}
  return {
    flagship: entry.flagship_image,
    images: entry.images,
  };
}

function preferredCatalogAssetsForProduct(product: Product): {
  flagship?: string | null;
  images?: Array<string | null | undefined> | null;
} {
  const indexAssets = catalogIndexAssetsForSlug(product.slug);
  return {
    flagship: indexAssets.flagship ?? product.flagship_image,
    images: indexAssets.images
      ? [...indexAssets.images, ...(product.images ?? [])]
      : product.images,
  };
}

export function isMissingTableError(message: string, tableName?: string): boolean {
  const normalized = (message || "").toLowerCase();
  if (!normalized) {return false;}

  const table = tableName?.toLowerCase();
  if (table) {
    if (normalized.includes(`${table} not found`) || normalized.includes(`public.${table} not found`)) {
      return true;
    }
    if (normalized.includes(`table ${table}`) && normalized.includes("not found")) {
      return true;
    }
    if (normalized.includes(`relation ${table}`) && normalized.includes("does not exist")) {
      return true;
    }
  }

  return (
    normalized.includes("does not exist") ||
    normalized.includes("could not find the table") ||
    normalized.includes("schema cache")
  );
}

export function normalizeProducts(rows: Product[]): Product[] {
  return (rows ?? []).map((product) => {
    const preferred = preferredCatalogAssetsForProduct(product);
    const assets = resolveProductCatalogAssets(
      product.slug,
      preferred.flagship,
      preferred.images,
    );
    const images = filterProductCatalogMedia(assets.images);
    const flagshipCandidates = filterProductCatalogMedia([assets.flagship_image]);
    const flagship_image = flagshipCandidates[0] ?? images[0] ?? assets.flagship_image;
    return {
      ...product,
      id: normalizeCatalogProductId(product.id, product.slug),
      images,
      flagship_image,
      "3d_model": normalizeAssetPath(product["3d_model"], { probeDisk: true }),
      category_id: product.category_id,
    };
  });
}

export function toCompatProduct(product: Product): CompatProduct {
  const specsObject =
    product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
      ? (product.specs as Record<string, unknown>)
      : {};
  const specsDimensions =
    typeof specsObject.dimensions === "string" ? specsObject.dimensions.trim() : "";
  const specsMaterials = Array.isArray(specsObject.materials)
    ? specsObject.materials.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const specsFeatures = Array.isArray(specsObject.features)
    ? specsObject.features.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const modelPath = normalizeAssetPath(product["3d_model"], { probeDisk: true });
  const explicitAlt =
    product.alt_text ||
    product.metadata?.ai_alt_text ||
    product.metadata?.aiAltText ||
    `${product.name} product image`;
  const preferred = preferredCatalogAssetsForProduct(product);
  const assets = resolveProductCatalogAssets(
    product.slug,
    preferred.flagship,
    preferred.images,
  );

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description || "",
    flagshipImage: assets.flagship_image,
    sceneImages: [],
    variants: [],
    detailedInfo: {
      overview: product.description || "",
      features: specsFeatures,
      dimensions: specsDimensions,
      materials: specsMaterials,
    },
    metadata: {
      ...product.metadata,
      sustainabilityScore: resolveDisplayEcoScore({
        specs: product.specs,
        metadata: product.metadata,
      }),
    },
    "3d_model": modelPath,
    threeDModelUrl: modelPath,
    images: assets.images,
    altText: explicitAlt.replace(/\s+/g, " ").trim().slice(0, 140),
    specs: specsObject,
  };
}
