import "server-only";

import { normalizeAssetPath } from "@/lib/assetPaths";
import {
  canQueryCatalogDatabase,
  fetchCatalogProductImageRowsLive,
  fetchCatalogProductSpecsRowsLive,
} from "@/lib/catalog/catalogDrizzle";

type ProductImageKind = "flagship" | "gallery" | "scene" | "variant" | "other";

export type ProductImageBundle = {
  flagshipImage: string;
  images: string[];
  sceneImages: string[];
};

let specsTableMissing = false;
let imagesTableMissing = false;
let loggedSpecsMissing = false;
let loggedImagesMissing = false;

function toSpecsObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {return {};}
  return { ...(input as Record<string, unknown>) };
}

function uniqueIds(productIds: readonly string[]): string[] {
  return [...new Set(productIds.filter(Boolean))];
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function fetchProductSpecsMap(
  productIds: readonly string[],
): Promise<Map<string, Record<string, unknown>>> {
  const ids = uniqueIds(productIds).filter(isUuidLike);
  const result = new Map<string, Record<string, unknown>>();
  if (ids.length === 0 || specsTableMissing || !canQueryCatalogDatabase()) {return result;}

  try {
    const rows = await fetchCatalogProductSpecsRowsLive(ids);
    if (rows === null) {
      specsTableMissing = true;
      if (!loggedSpecsMissing) {
        loggedSpecsMissing = true;
        console.warn("[product_specs] table missing; falling back to products.specs");
      }
      return result;
    }

    for (const row of rows) {
      result.set(row.product_id, toSpecsObject(row.specs));
    }
  } catch (error) {
    specsTableMissing = true;
    if (!loggedSpecsMissing) {
      loggedSpecsMissing = true;
      console.warn("[product_specs] Drizzle read failed; falling back to products.specs", error);
    }
  }

  return result;
}

export async function fetchProductImagesMap(
  productIds: readonly string[],
): Promise<Map<string, ProductImageBundle>> {
  const ids = uniqueIds(productIds).filter(isUuidLike);
  const result = new Map<string, ProductImageBundle>();
  if (ids.length === 0 || imagesTableMissing || !canQueryCatalogDatabase()) {return result;}

  try {
    const rows = await fetchCatalogProductImageRowsLive(ids);
    if (rows === null) {
      imagesTableMissing = true;
      if (!loggedImagesMissing) {
        loggedImagesMissing = true;
        console.warn("[product_images] table missing; falling back to products image columns");
      }
      return result;
    }

    for (const row of rows) {
      const normalized = normalizeAssetPath(row.image_url, { probeDisk: true });
      if (!normalized) {continue;}

      const current = result.get(row.product_id) || {
        flagshipImage: "",
        images: [],
        sceneImages: [],
      };

      const kind = (row.image_kind || "gallery") as ProductImageKind;
      if (kind === "flagship") {
        if (!current.flagshipImage) {current.flagshipImage = normalized;}
      } else if (kind === "scene") {
        current.sceneImages.push(normalized);
      } else {
        current.images.push(normalized);
      }

      result.set(row.product_id, current);
    }

    for (const [productId, bundle] of result.entries()) {
      result.set(productId, {
        flagshipImage: bundle.flagshipImage,
        images: dedupe(bundle.images),
        sceneImages: dedupe(bundle.sceneImages),
      });
    }
  } catch (error) {
    imagesTableMissing = true;
    if (!loggedImagesMissing) {
      loggedImagesMissing = true;
      console.warn("[product_images] Drizzle read failed; falling back to products image columns", error);
    }
  }

  return result;
}
