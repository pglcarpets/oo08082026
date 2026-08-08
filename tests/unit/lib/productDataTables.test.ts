import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchProductSpecsMap, fetchProductImagesMap } from '../../../site/lib/productDataTables';

const mockCanQueryCatalogDatabase = vi.fn();
const mockFetchCatalogProductSpecsRowsLive = vi.fn();
const mockFetchCatalogProductImageRowsLive = vi.fn();

vi.mock('@/lib/catalog/catalogDrizzle', () => ({
  canQueryCatalogDatabase: () => mockCanQueryCatalogDatabase(),
  fetchCatalogProductSpecsRowsLive: (...args: unknown[]) => mockFetchCatalogProductSpecsRowsLive(...args),
  fetchCatalogProductImageRowsLive: (...args: unknown[]) => mockFetchCatalogProductImageRowsLive(...args),
}));

vi.mock('@/lib/assetPaths', () => ({
  normalizeAssetPath: vi.fn((val) => val),
}));

describe('productDataTables', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanQueryCatalogDatabase.mockReturnValue(true);
  });

  const validUuid = '12345678-1234-4321-a123-123456789abc';

  describe('fetchProductSpecsMap', () => {
    it('should return empty map for empty/invalid ids', async () => {
      const res = await fetchProductSpecsMap([]);
      expect(res.size).toBe(0);

      const res2 = await fetchProductSpecsMap(['invalid-uuid']);
      expect(res2.size).toBe(0);
    });

    it('should query product_specs and return formatted map', async () => {
      mockFetchCatalogProductSpecsRowsLive.mockResolvedValue([
        { product_id: validUuid, specs: { weight: '10kg' } },
      ]);

      const res = await fetchProductSpecsMap([validUuid]);
      expect(mockFetchCatalogProductSpecsRowsLive).toHaveBeenCalledWith([validUuid]);
      expect(res.get(validUuid)).toEqual({ weight: '10kg' });
    });

    it('should handle table missing error gracefully', async () => {
      mockFetchCatalogProductSpecsRowsLive.mockResolvedValue(null);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const res = await fetchProductSpecsMap([validUuid]);
      expect(res.size).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('fetchProductImagesMap', () => {
    it('should return empty map for empty/invalid ids', async () => {
      const res = await fetchProductImagesMap([]);
      expect(res.size).toBe(0);
    });

    it('should query product_images and group them by product_id', async () => {
      mockFetchCatalogProductImageRowsLive.mockResolvedValue([
        { product_id: validUuid, image_url: '/img1.jpg', image_kind: 'flagship', sort_order: 1 },
        { product_id: validUuid, image_url: '/img2.jpg', image_kind: 'scene', sort_order: 2 },
        { product_id: validUuid, image_url: '/img3.jpg', image_kind: 'gallery', sort_order: 3 },
        { product_id: validUuid, image_url: '/img4.jpg', image_kind: null, sort_order: 4 },
      ]);

      const res = await fetchProductImagesMap([validUuid]);
      expect(mockFetchCatalogProductImageRowsLive).toHaveBeenCalledWith([validUuid]);

      const bundle = res.get(validUuid);
      expect(bundle).toEqual({
        flagshipImage: '/img1.jpg',
        images: ['/img3.jpg', '/img4.jpg'],
        sceneImages: ['/img2.jpg'],
      });
    });

    it('should handle table missing error gracefully for images', async () => {
      mockFetchCatalogProductImageRowsLive.mockResolvedValue(null);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const res = await fetchProductImagesMap([validUuid]);
      expect(res.size).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });
});
