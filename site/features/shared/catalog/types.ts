/**
 * features/shared/catalog/types.ts
 *
 * Shared product catalog contract used by BOTH space-planner AND configurator.
 * Neither feature should import catalog types from the other feature's domain.
 * All cross-feature catalog references must use this contract only.
 */

export interface SharedProductDimensions {
  widthMm: number;
  depthMm: number;
  heightMm?: number;
}

export interface SharedProduct {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  price: number | null;
  /** Structured dimensions replacing the legacy string field */
  dimensions?: SharedProductDimensions;
  /** Legacy string representation for backward compat */
  dimensionsLabel?: string;
  finishes?: string[];
  tags?: string[];
  imageUrl?: string;
  isActive?: boolean;
}

export interface SharedCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

export interface SharedCatalogSearchResult {
  products: SharedProduct[];
  total: number;
  hasMore: boolean;
}
