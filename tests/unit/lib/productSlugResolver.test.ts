import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as productSlugResolverType0 from "../../../site/lib/productSlugResolver";

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn) => fn),
}));

const mockFetchCatalogProductBySlugLive = vi.fn();
const mockFetchCatalogSlugAliasLive = vi.fn();

vi.mock('@/lib/catalog/catalogDrizzle', () => ({
  fetchCatalogProductBySlugLive: (...args: unknown[]) => mockFetchCatalogProductBySlugLive(...args),
  fetchCatalogSlugAliasLive: (...args: unknown[]) => mockFetchCatalogSlugAliasLive(...args),
}));

const mockFallbackProducts = [
  { slug: 'fallback-slug', name: 'Fallback Product' },
];
vi.mock('@/lib/catalog/fallback', () => ({
  buildLocalCatalogFallbackProducts: vi.fn(() => mockFallbackProducts),
}));

describe('productSlugResolver', () => {
  let resolver: typeof productSlugResolverType0;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    resolver = await import('../../../site/lib/productSlugResolver');
  });

  it('should return empty resolution for empty slug', async () => {
    const res = await resolver.resolveProductByUrlKey('');
    expect(res.requestedSlug).toBe('');
    expect(res.row).toBeNull();
  });

  it('should resolve via alias first if alias exists', async () => {
    mockFetchCatalogSlugAliasLive.mockResolvedValue({
      alias_slug: 'alias-slug',
      canonical_slug: 'canonical-slug',
    });
    mockFetchCatalogProductBySlugLive.mockResolvedValue({
      id: '1',
      slug: 'canonical-slug',
      name: 'Canonical Product',
    });

    const res = await resolver.resolveProductByUrlKey('alias-slug');
    expect(res.resolvedViaAlias).toBe(true);
    expect(res.canonicalSlug).toBe('canonical-slug');
    expect(res.row).toEqual({ id: '1', slug: 'canonical-slug', name: 'Canonical Product' });
  });

  it('should resolve directly if product exists', async () => {
    mockFetchCatalogSlugAliasLive.mockResolvedValue(null);
    mockFetchCatalogProductBySlugLive.mockResolvedValue({
      id: '1',
      slug: 'direct-slug',
      name: 'Direct Product',
    });

    const res = await resolver.resolveProductByUrlKey('direct-slug');
    expect(res.resolvedViaAlias).toBe(false);
    expect(res.canonicalSlug).toBe('direct-slug');
    expect(res.row).toEqual({ id: '1', slug: 'direct-slug', name: 'Direct Product' });
  });

  it('should resolve via fallback if not in DB', async () => {
    mockFetchCatalogSlugAliasLive.mockResolvedValue(null);
    mockFetchCatalogProductBySlugLive.mockResolvedValue(null);

    const res = await resolver.resolveProductByUrlKey('fallback-slug');
    expect(res.row).toEqual({ slug: 'fallback-slug', name: 'Fallback Product' });
    expect(res.resolvedViaAlias).toBe(false);
  });
});
