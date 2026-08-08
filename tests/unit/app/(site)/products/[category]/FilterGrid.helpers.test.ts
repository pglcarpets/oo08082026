import { describe, it, expect, vi } from 'vitest';
import {
  buildImageCandidates,
  toInlineSpec,
  getDisplayDimensions,
  getDisplayMaterials,
  fallbackAltText,
  getProductRouteKey,
  flattenCategoryProducts,
  buildFallbackFacets,
  type FlatProduct,
} from '@/features/site/catalog/FilterGrid.helpers';
import { PRICE_RANGES } from '@/lib/catalog/site/filters';
import type { CompatCategory, CompatProduct } from '@/lib/catalog/site/getProducts';

vi.mock('@/lib/catalog/site/traits', () => ({
  hasVerifiedHeadrest: vi.fn(() => false),
  hasVerifiedHeightAdjustable: vi.fn(() => false),
}));

vi.mock('@/lib/displayText', () => ({
  sanitizeDisplayText: vi.fn((val: string) => String(val)),
  filterMeaningfulDimensionText: vi.fn((val: string) => String(val)),
  filterMeaningfulMaterialList: vi.fn((list: string[]) => list),
}));

vi.mock('@/lib/assetPaths', () => ({
  normalizeAssetPath: vi.fn((val: string | null | undefined) => (val ? `/${val}` : val)),
}));

function flatProduct(overrides: Partial<FlatProduct> & Pick<FlatProduct, 'id' | 'name'>): FlatProduct {
  return {
    slug: overrides.id,
    description: '',
    flagshipImage: '',
    sceneImages: [],
    variants: [],
    detailedInfo: {
      overview: '',
      features: [],
      dimensions: '',
      materials: [],
    },
    metadata: {},
    seriesId: 'series',
    seriesName: 'Series',
    ...overrides,
  };
}

function compatProduct(
  overrides: Partial<CompatProduct> & Pick<CompatProduct, 'id' | 'name'>,
): CompatProduct {
  return {
    slug: overrides.id,
    description: '',
    flagshipImage: '',
    sceneImages: [],
    variants: [],
    detailedInfo: {
      overview: '',
      features: [],
      dimensions: '',
      materials: [],
    },
    metadata: {},
    ...overrides,
  };
}

describe('FilterGrid.helpers', () => {
  describe('buildImageCandidates', () => {
    it('filters placeholders/SVGs and uniqueifies usable paths', () => {
      const product: Pick<FlatProduct, 'images' | 'flagshipImage'> = {
        flagshipImage: 'assets_placeholder.jpg',
        images: ['valid.jpg', 'fallback/category.webp', 'valid.jpg', 'test.svg'],
      };
      expect(buildImageCandidates(product)).toEqual(['/valid.jpg', '/fallback/category.webp']);
    });

    it('falls back to unique raw paths when every candidate is unusable', () => {
      const product: Pick<FlatProduct, 'images' | 'flagshipImage'> = {
        flagshipImage: 'assets_placeholder.jpg',
        images: ['fallback/category.webp'],
      };
      expect(buildImageCandidates(product)).toEqual(['/fallback/category.webp']);
    });
  });

  describe('toInlineSpec', () => {
    it('returns empty for blank input and truncates long text', () => {
      expect(toInlineSpec('')).toBe('');
      const longText = 'a'.repeat(80);
      expect(toInlineSpec(longText)).toBe(`${'a'.repeat(72)}...`);
      expect(toInlineSpec('short ok')).toBe('short ok');
    });
  });

  describe('getDisplayDimensions', () => {
    it('prefers specs dimensions, then detailedInfo', () => {
      expect(
        getDisplayDimensions(
          flatProduct({
            id: 'p1',
            name: 'P1',
            specs: { dimensions: '100x100x100' },
          }),
        ),
      ).toBe('100x100x100');

      expect(
        getDisplayDimensions(
          flatProduct({
            id: 'p2',
            name: 'P2',
            detailedInfo: {
              overview: '',
              features: [],
              dimensions: '20 x 30 x 40',
              materials: [],
            },
          }),
        ),
      ).toBe('20 x 30 x 40');
    });
  });

  describe('getDisplayMaterials', () => {
    it('prefers specs materials, then detailedInfo, comma-joined', () => {
      expect(
        getDisplayMaterials(
          flatProduct({
            id: 'p1',
            name: 'P1',
            specs: { materials: ['Wood', 'Metal'] },
          }),
        ),
      ).toBe('Wood, Metal');

      expect(
        getDisplayMaterials(
          flatProduct({
            id: 'p2',
            name: 'P2',
            detailedInfo: {
              overview: '',
              features: [],
              dimensions: '',
              materials: ['Leather', 'Steel'],
            },
          }),
        ),
      ).toBe('Leather, Steel');
    });
  });

  describe('fallbackAltText', () => {
    it('generates category-scoped product alt text', () => {
      expect(fallbackAltText('Chair', 'Seating')).toBe(
        'Product image of Chair in Seating category',
      );
    });
  });

  describe('getProductRouteKey', () => {
    it('prefers trimmed slug, otherwise trimmed id', () => {
      expect(
        getProductRouteKey({ slug: '  test-slug  ', id: 'test-id' }),
      ).toBe('test-slug');
      expect(getProductRouteKey({ id: '  test-id  ' })).toBe('test-id');
      expect(getProductRouteKey({ slug: '   ', id: 'fallback-id' })).toBe(
        'fallback-id',
      );
    });
  });

  describe('flattenCategoryProducts', () => {
    it('flattens series products, stamps series fields, and dedupes by name+subcategory', () => {
      const preferred = compatProduct({
        id: 'p1-oando',
        name: 'P1',
        slug: 'oando-p1',
        metadata: { subcategory: 'sc1', source: 'oando.co.in' },
      });
      const duplicate = compatProduct({
        id: 'p1-legacy',
        name: 'P1',
        slug: 'legacy-p1',
        metadata: { subcategory: 'sc1' },
      });
      const other = compatProduct({
        id: 'p2',
        name: 'P2',
        slug: 'p2',
        metadata: { subcategory: 'sc2' },
      });
      const cat: CompatCategory = {
        id: 'seating',
        name: 'Seating',
        description: '',
        series: [
          {
            id: 's1',
            name: 'Series 1',
            description: '',
            products: [duplicate, preferred],
          },
          {
            id: 's2',
            name: 'Series 2',
            description: '',
            products: [other],
          },
        ],
      };

      const res = flattenCategoryProducts(cat);
      expect(res).toHaveLength(2);
      expect(res.map((product) => product.id).sort()).toEqual(['p1-oando', 'p2']);
      const kept = res.find((product) => product.id === 'p1-oando');
      expect(kept).toMatchObject({
        seriesId: 's1',
        seriesName: 'Series 1',
        altText: 'Product image of P1 in Seating category',
      });
    });
  });

  describe('buildFallbackFacets', () => {
    it('builds facets from metadata.priceRange bands only (no numeric list prices)', () => {
      const products: FlatProduct[] = [
        flatProduct({
          id: 'p1',
          name: 'P1',
          seriesName: 'S1',
          metadata: { subcategory: 'SC1', isStackable: true, priceRange: 'mid' },
          specs: { materials: ['Metal'] },
        }),
        flatProduct({
          id: 'p2',
          name: 'P2',
          seriesName: 'S2',
          metadata: { subcategory: 'SC1', bifmaCertified: true, priceRange: 'luxury' },
        }),
        // Numeric list price must never become a facet or commercial claim.
        {
          ...flatProduct({
            id: 'p3',
            name: 'P3',
            seriesName: 'S3',
            metadata: { subcategory: 'SC2' },
          }),
          price: 15000,
        } as FlatProduct & { price: number },
      ];
      const facets = buildFallbackFacets('desks', products);

      expect(PRICE_RANGES).toEqual(['budget', 'mid', 'premium', 'luxury']);
      expect(facets.series).toEqual(['S1', 'S2', 'S3']);
      expect(facets.subcategory).toEqual(['SC1', 'SC2']);
      expect(facets.material).toEqual(['Metal']);
      expect(facets.priceRange).toEqual(['mid', 'luxury']);
      expect(facets.priceRange).not.toContain('Under 5,000');
      expect(facets.priceRange).not.toContain('10,000-20,000');
      expect(facets.priceRange).not.toContain('20,000+');
      expect(facets.featureAvailability.isStackable).toBe(true);
      expect(facets.featureAvailability.bifmaCertified).toBe(true);
    });

    it('omits seating series facets and empty price bands when no released priceRange', () => {
      expect(buildFallbackFacets('seating', []).series).toEqual([]);

      const facets = buildFallbackFacets('desks', [
        flatProduct({
          id: 'p1',
          name: 'P1',
          seriesName: 'S1',
          metadata: { subcategory: 'SC1' },
        }),
      ]);
      expect(facets.priceRange).toEqual([]);
      expect(facets.series).toEqual(['S1']);
      expect(facets.subcategory).toEqual(['SC1']);
    });
  });
});
