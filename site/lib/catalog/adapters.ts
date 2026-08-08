import {
  normalizeAssetPath,
  resolveProductCatalogAssets,
} from "@/lib/assetPaths";
import { filterProductCatalogMedia } from "@/lib/catalog/site/catalogProductFilters";
import { resolveDisplayEcoScore } from "@/lib/catalog/site/ecoScore";
import { normalizeCatalogProductId } from "@/lib/uuid/normalizeUuid";
import type { CompatProduct, Product } from "./types";

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
    const assets = resolveProductCatalogAssets(
      product.slug,
      product.flagship_image,
      product.images,
    );
    const images = filterProductCatalogMedia(assets.images);
    const flagshipCandidates = filterProductCatalogMedia([assets.flagship_image]);
    const flagship_image = flagshipCandidates[0] ?? images[0] ?? assets.flagship_image;
    return {
      ...product,
      id: normalizeCatalogProductId(product.id, product.slug),
      images,
      flagship_image,
      "3d_model": normalizeAssetPath(product["3d_model"]),
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
  const modelPath = normalizeAssetPath(product["3d_model"]);
  const explicitAlt =
    product.alt_text ||
    product.metadata?.ai_alt_text ||
    product.metadata?.aiAltText ||
    `${product.name} product image`;
  // Prefer already-normalized product fields (normalizeProducts); re-resolve with slug if raw.
  const assets = resolveProductCatalogAssets(
    product.slug,
    product.flagship_image,
    product.images,
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
