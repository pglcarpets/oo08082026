import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type * as assetPathsType0 from "../../../site/lib/assetPaths";

const mockFs = {
  existsSync: vi.fn((p: string) => {
    if (p.includes('exists.webp')) return true;
    if (p.includes('exists-jpg.jpg')) return true;
    if (p.includes('exists-jpeg.jpeg')) return true;
    if (p.includes('exists-png.png')) return true;
    return false;
  }),
  readdirSync: vi.fn((_p?: string): string[] => []),
  statSync: vi.fn(() => ({ isDirectory: () => false })),
};

const mockPath = {
  sep: '/',
  join: (...args: string[]) => args.join('/'),
};

type GlobalWithNonWebpackRequire = typeof globalThis & {
  __non_webpack_require__?: (id: string) => typeof mockFs | typeof mockPath;
};

// Override __non_webpack_require__ to return our mock modules
(globalThis as GlobalWithNonWebpackRequire).__non_webpack_require__ = (id: string) => {
  if (id === 'node:fs' || id === 'fs') return mockFs;
  if (id === 'node:path' || id === 'path') return mockPath;
  throw new Error(`Unexpected require: ${id}`);
};

const BRAND_PRODUCT_FALLBACK =
  '/assets/marketing/brand/logos/logo-sharp.png';

const DISK_PROBE = { probeDisk: true } as const;

describe('assetPaths', () => {
  let assetPaths: typeof assetPathsType0;

  beforeEach(async () => {
    // Force server-side by default
    vi.stubGlobal('window', undefined);
    vi.resetModules();
    // Reset FS mock (other tests override implementation).
    mockFs.existsSync.mockImplementation((p: string) => {
      if (p.includes('exists.webp')) return true;
      if (p.includes('exists-jpg.jpg')) return true;
      if (p.includes('exists-jpeg.jpeg')) return true;
      if (p.includes('exists-png.png')) return true;
      return false;
    });
    mockFs.readdirSync.mockImplementation((): string[] => []);
    // Set environment variables for testing
    process.env.NEXT_PUBLIC_ASSET_BASE_URL = 'https://cdn.example.com/';
    assetPaths = await import('../../../site/lib/assetPaths');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should handle null/undefined/empty paths', () => {
    expect(assetPaths.normalizeAssetPath(null)).toBe('');
    expect(assetPaths.normalizeAssetPath(undefined)).toBe('');
    expect(assetPaths.normalizeAssetPath('')).toBe('');
    expect(assetPaths.normalizeAssetPath('   ')).toBe('');
  });

  it('should preserve absolute URLs', () => {
    expect(assetPaths.normalizeAssetPath('https://another-cdn.com/img.png')).toBe('https://another-cdn.com/img.png');
    expect(assetPaths.normalizeAssetPath('mailto:info@oando.co.in')).toBe('mailto:info@oando.co.in');
  });

  it('normalizes bare numeric catalog filenames to the published image-N form', () => {
    expect(
      assetPaths.normalizeAssetPath('/assets/catalog/seating/mesh/oando-seating--spino/1.webp'),
    ).toBe('https://cdn.example.com/assets/catalog/seating/mesh/oando-seating--spino/image-1.webp');
    expect(
      assetPaths.normalizeAssetPath('https://oando.co.in/assets/catalog/seating/mesh/oando-seating--spino/1.webp'),
    ).toBe('https://oando.co.in/assets/catalog/seating/mesh/oando-seating--spino/image-1.webp');
  });

  it('returns placeholder for legacy catalog export paths when local file is absent', () => {
    const legacySeg = String.fromCharCode(97, 102, 99);
    const legacy = `/assets/${legacySeg}/chair.webp`;
    expect(assetPaths.normalizeAssetPath(legacy, DISK_PROBE)).toBe(
      '/assets/marketing/brand/logos/logo-sharp.png',
    );
  });

  it('rewrites legacy /media/planner paths to /assets/planner/media', () => {
    mockFs.existsSync.mockImplementation((p: string) => {
      if (String(p).includes('/assets/planner/media/posters/planner-landing-poster.webp'))
        return true;
      return false;
    });
    expect(
      assetPaths.normalizeAssetPath('/media/planner/planner-landing-poster.webp', DISK_PROBE),
    ).toBe(
      'https://cdn.example.com/assets/planner/media/posters/planner-landing-poster.webp',
    );
  });

  it('rewrites legacy /media/hero paths to /assets/marketing/hero/pages', () => {
    mockFs.existsSync.mockImplementation((p: string) => {
      if (String(p).includes('/assets/marketing/hero/pages/Planner-oneandonly-bright.webp')) return true;
      return false;
    });
    expect(assetPaths.normalizeAssetPath('/media/hero/hero-1.webp', DISK_PROBE)).toBe(
      '/assets/marketing/hero/pages/Planner-oneandonly-bright.webp',
    );
  });

  it('returns placeholder for legacy products paths when local file is absent', () => {
    expect(assetPaths.normalizeAssetPath('/products/table.webp', DISK_PROBE)).toBe(
      '/assets/marketing/brand/logos/logo-sharp.png',
    );
  });

  it('should rewrite legacy chairs paths to catalog seating folders', () => {
    mockFs.existsSync.mockImplementation((p: string) => {
      const s = String(p).replace(/\\/g, '/');
      if (s.includes('/assets/catalog/seating/oando-seating--breeze/gallery/image-1.webp'))
        return true;
      if (s.includes('/assets/catalog/seating/oando-seating--breeze/gallery/image-01.webp'))
        return true;
      return false;
    });
    expect(assetPaths.normalizeAssetPath('/assets/catalog/chairs/breeze/image-1.jpg', DISK_PROBE)).toBe(
      'https://cdn.example.com/assets/catalog/seating/oando-seating--breeze/image-1.webp',
    );
  });

  it('should resolve category placeholders to raster product fallback', () => {
    expect(assetPaths.normalizeAssetPath('/assets/marketing/fallback/placeholders/category.webp')).toBe(
      '/assets/marketing/brand/logos/logo-sharp.png',
    );
    expect(assetPaths.normalizeAssetPath('/assets/marketing/fallback/placeholders/category.svg')).toBe(
      '/assets/marketing/brand/logos/logo-sharp.png',
    );
  });

  it('keeps project install photos same-origin when CDN is configured', () => {
    expect(assetPaths.normalizeAssetPath('/assets/marketing/projects/DMRC/dmrc-hero.webp')).toBe(
      '/assets/marketing/projects/DMRC/dmrc-hero.webp',
    );
  });

  it('should resolve canaret webp to CDN path when local file is absent', () => {
    expect(
      assetPaths.normalizeAssetPath('/assets/catalog/seating/fabric/oando-seating--canaret/gallery/image-01.webp'),
    ).toBe('https://cdn.example.com/assets/catalog/seating/fabric/oando-seating--canaret/image-01.webp');
  });

  it('strips erroneous gallery/ for workstations (R2 SKU-root layout)', () => {
    expect(
      assetPaths.normalizeAssetPath(
        '/assets/catalog/workstations/oando-workstations--adaptable/gallery/image-1.webp',
      ),
    ).toBe(
      'https://cdn.example.com/assets/catalog/workstations/oando-workstations--adaptable/image-1.webp',
    );
  });

  it('strips gallery/ for leather seating (R2 SKU-root layout)', () => {
    expect(
      assetPaths.normalizeAssetPath(
        '/assets/catalog/seating/leather/oando-seating--grace/gallery/image-01.webp',
      ),
    ).toBe('https://cdn.example.com/assets/catalog/seating/leather/oando-seating--grace/image-01.webp');
  });

  it('remaps legacy non-leather seating to fabric/mesh on CDN paths', () => {
    expect(
      assetPaths.normalizeAssetPath(
        '/assets/catalog/seating/non-leather/oando-seating--fluid-x/gallery/image-01.webp',
      ),
    ).toBe('https://cdn.example.com/assets/catalog/seating/mesh/oando-seating--fluid-x/image-01.webp');
  });

  it('should resolve phoenix seating webp on mesh path', () => {
    const phoenix = assetPaths.normalizeAssetPath(
      '/assets/catalog/seating/mesh/oando-seating--phoenix/gallery/image-1.webp',
    );
    expect(phoenix).toBe(
      'https://cdn.example.com/assets/catalog/seating/mesh/oando-seating--phoenix/image-1.webp',
    );
    // Non-catalog path (no CDN fallback) resolves to raster fallback.
    expect(assetPaths.normalizeAssetPath('/assets/catalog/not-a-real-sku/image-4.webp', DISK_PROBE)).toBe(
      BRAND_PRODUCT_FALLBACK,
    );
  });

  it('should resolve local variants for webp when server-side', () => {
    // exists.webp exists, so it should return it with cdn base
    expect(assetPaths.normalizeAssetPath('/assets/catalog/exists.webp', DISK_PROBE)).toBe(
      'https://cdn.example.com/assets/catalog/exists.webp',
    );

    // exists-jpg.webp does not exist, but exists-jpg.jpg does
    expect(assetPaths.normalizeAssetPath('/assets/catalog/exists-jpg.webp', DISK_PROBE)).toBe(
      'https://cdn.example.com/assets/catalog/exists-jpg.jpg',
    );

    // exists-jpeg.webp does not exist, but exists-jpeg.jpeg does
    expect(assetPaths.normalizeAssetPath('/assets/catalog/exists-jpeg.webp', DISK_PROBE)).toBe(
      'https://cdn.example.com/assets/catalog/exists-jpeg.jpeg',
    );

    // exists-png.webp does not exist, but exists-png.png does
    expect(assetPaths.normalizeAssetPath('/assets/catalog/exists-png.webp', DISK_PROBE)).toBe(
      'https://cdn.example.com/assets/catalog/exists-png.png',
    );

    // non-existing resolves to raster fallback (next/image rejects SVG)
    expect(assetPaths.normalizeAssetPath('/assets/catalog/not-here.webp', DISK_PROBE)).toBe(
      BRAND_PRODUCT_FALLBACK,
    );
  });

  it('should strip zero-padded catalog image numbers when unpadded file exists', () => {
    mockFs.existsSync.mockImplementation((p: string) => {
      if (String(p).includes('/assets/catalog/seating/non-leather/oando-seating--fluid-x/gallery/image-1.webp')) return true;
      if (String(p).includes('/assets/catalog/seating/non-leather/oando-seating--canaret/gallery/image-1.jpg')) return true;
      if (String(p).endsWith('/assets/catalog/seating/non-leather/oando-seating--fluid-x')) return true;
      if (String(p).endsWith('/assets/catalog/seating/non-leather/oando-seating--canaret')) return true;
      return false;
    });
    expect(
      assetPaths.normalizeAssetPath('/assets/catalog/seating/non-leather/oando-seating--fluid-x/image-01.webp', DISK_PROBE),
    ).toBe('https://cdn.example.com/assets/catalog/seating/non-leather/oando-seating--fluid-x/image-1.webp');
    expect(
      assetPaths.normalizeAssetPath('/assets/catalog/seating/non-leather/oando-seating--canaret/image-01.webp', DISK_PROBE),
    ).toBe('https://cdn.example.com/assets/catalog/seating/non-leather/oando-seating--canaret/image-1.jpg');
  });

  it('should keep zero-padded path when padded file exists on disk', () => {
    mockFs.existsSync.mockImplementation((p: string) => {
      if (String(p).includes('/assets/catalog/seating/non-leather/oando-seating--arvo/gallery/image-01.webp')) return true;
      if (String(p).endsWith('/assets/catalog/seating/non-leather/oando-seating--arvo')) return true;
      return false;
    });
    expect(
      assetPaths.normalizeAssetPath('/assets/catalog/seating/non-leather/oando-seating--arvo/image-01.webp', DISK_PROBE),
    ).toBe('https://cdn.example.com/assets/catalog/seating/non-leather/oando-seating--arvo/image-01.webp');
  });

  it('should resolve nearest sibling image when exact index is missing', () => {
    mockFs.existsSync.mockImplementation((p: string) => {
      const s = String(p).replace(/\\/g, '/');
      if (s.endsWith('/assets/catalog/seating/non-leather/oando-seating--casca')) return true;
      if (s.endsWith('/assets/catalog/seating/non-leather/oando-seating--casca/gallery')) return true;
      if (s.includes('/assets/catalog/seating/non-leather/oando-seating--casca/gallery/image-2.jpg')) return true;
      if (s.includes('/assets/catalog/seating/non-leather/oando-seating--casca/gallery/image-3.jpg')) return true;
      return false;
    });
    mockFs.statSync.mockImplementation(((p: string) => {
      const s = String(p).replace(/\\/g, '/');
      if (s.endsWith('/gallery')) return { isDirectory: () => true };
      return { isDirectory: () => false };
    }) as never);
    mockFs.readdirSync = vi.fn((p?: string) => {
      const s = String(p).replace(/\\/g, '/');
      if (s.endsWith('/gallery')) return ['image-2.jpg', 'image-3.jpg'];
      return [];
    });
    expect(
      assetPaths.normalizeAssetPath('/assets/catalog/seating/non-leather/oando-seating--casca/gallery/image-1.jpg', DISK_PROBE),
    ).toBe('https://cdn.example.com/assets/catalog/seating/non-leather/oando-seating--casca/image-2.jpg');
  });

  it('should preserve original path on client (no destructive unpad)', async () => {
    vi.stubGlobal('window', {});
    vi.resetModules();
    const clientAssetPaths = await import('../../../site/lib/assetPaths');
    expect(clientAssetPaths.normalizeAssetPath('/assets/catalog/anything.webp')).toBe(
      'https://cdn.example.com/assets/catalog/anything.webp',
    );
    // Client must not rewrite image-01 → image-1 (destroys SSR-resolved padded paths).
    expect(
      clientAssetPaths.normalizeAssetPath('/assets/catalog/seating/non-leather/oando-seating--arvo/gallery/image-01.webp'),
    ).toBe('https://cdn.example.com/assets/catalog/seating/fabric/oando-seating--arvo/image-01.webp');
    expect(
      clientAssetPaths.normalizeAssetPath('/assets/catalog/seating/non-leather/oando-seating--fluid-x/gallery/image-01.webp'),
    ).toBe('https://cdn.example.com/assets/catalog/seating/mesh/oando-seating--fluid-x/image-01.webp');
  });

  it('should normalize asset list', () => {
    expect(assetPaths.normalizeAssetList(null)).toEqual([BRAND_PRODUCT_FALLBACK]);
    expect(assetPaths.normalizeAssetList([])).toEqual([BRAND_PRODUCT_FALLBACK]);
    expect(assetPaths.normalizeAssetList(['/assets/catalog/exists.webp', null, ''], DISK_PROBE)).toEqual([
      'https://cdn.example.com/assets/catalog/exists.webp',
    ]);
  });

  it('detects product image fallback paths', () => {
    expect(assetPaths.isProductImageFallback('')).toBe(true);
    expect(assetPaths.isProductImageFallback('/assets/marketing/fallback/placeholders/product-placeholder.png')).toBe(true);
    expect(
      assetPaths.isProductImageFallback('https://cdn.example.com/assets/marketing/fallback/placeholders/product-placeholder.png'),
    ).toBe(true);
    expect(assetPaths.isProductImageFallback('/assets/catalog/tables/oando-tables--crest/gallery/image-1.jpg')).toBe(false);
  });

  it('lists catalog slug images and resolves CMS-hash miss via slug folder', () => {
    mockFs.existsSync.mockImplementation((p: string) => {
      const s = String(p).replace(/\\/g, '/');
      if (s.endsWith('/assets/catalog')) return true;
      if (s.endsWith('/assets/catalog/tables')) return true;
      if (s.endsWith('/assets/catalog/tables/oando-tables--crest')) return true;
      if (s.endsWith('/assets/catalog/tables/oando-tables--crest/gallery')) return true;
      if (s.includes('/assets/catalog/tables/oando-tables--crest/gallery/image-1.jpg')) return true;
      if (s.includes('/assets/catalog/tables/oando-tables--crest/gallery/image-2.jpg')) return true;
      return false;
    });
    mockFs.statSync.mockImplementation(((p: string) => {
      const s = String(p).replace(/\\/g, '/');
      if (s.endsWith('/gallery')) return { isDirectory: () => true };
      return { isDirectory: () => false };
    }) as never);
    mockFs.readdirSync.mockImplementation(((p: string) => {
      const s = String(p).replace(/\\/g, '/');
      if (s.endsWith('/assets/catalog')) return ['tables', 'seating'];
      if (s.endsWith('/assets/catalog/tables')) return ['oando-tables--crest'];
      if (s.endsWith('/assets/catalog/tables/oando-tables--crest')) return ['gallery'];
      if (s.endsWith('/assets/catalog/tables/oando-tables--crest/gallery'))
        return ['image-1.jpg', 'image-2.jpg', 'readme.txt'];
      return [];
    }) as never);

    expect(assetPaths.listCatalogSlugImages('oando-tables--crest')).toEqual([
      '/assets/catalog/tables/oando-tables--crest/gallery/image-1.jpg',
      '/assets/catalog/tables/oando-tables--crest/gallery/image-2.jpg',
    ]);

    // Short slug unique --suffix match (fluid-x → oando-seating--fluid-x style).
    mockFs.existsSync.mockImplementation((p: string) => {
      const s = String(p).replace(/\\/g, '/');
      if (s.endsWith('/assets/catalog')) return true;
      if (s.endsWith('/assets/catalog/seating')) return true;
      if (s.endsWith('/assets/catalog/seating/non-leather/oando-seating--fluid-x')) return true;
      if (s.endsWith('/assets/catalog/seating/non-leather/oando-seating--fluid-x/gallery')) return true;
      if (s.includes('/assets/catalog/seating/non-leather/oando-seating--fluid-x/gallery/image-1.webp')) return true;
      return false;
    });
    mockFs.statSync.mockImplementation(((p: string) => {
      const s = String(p).replace(/\\/g, '/');
      if (s.endsWith('/gallery')) return { isDirectory: () => true };
      return { isDirectory: () => false };
    }) as never);
    mockFs.readdirSync.mockImplementation(((p: string) => {
      const s = String(p).replace(/\\/g, '/');
      if (s.endsWith('/assets/catalog')) return ['seating'];
      if (s.endsWith('/assets/catalog/seating')) return ['oando-seating--fluid-x'];
      if (s.endsWith('/assets/catalog/seating/non-leather/oando-seating--fluid-x')) return ['gallery'];
      if (s.endsWith('/assets/catalog/seating/non-leather/oando-seating--fluid-x/gallery')) return ['image-1.webp'];
      return [];
    }) as never);
    const short = assetPaths.resolveProductCatalogAssets(
      'fluid-x',
      '/assets/catalog/products/fluid-x-chair-1.webp',
      ['/assets/catalog/products/fluid-x-chair-1.webp'],
    );
    expect(short.flagship_image).toBe(
      'https://cdn.example.com/assets/catalog/seating/non-leather/oando-seating--fluid-x/gallery/image-1.webp',
    );
    expect(short.images[0]).toBe(
      'https://cdn.example.com/assets/catalog/seating/non-leather/oando-seating--fluid-x/gallery/image-1.webp',
    );

    // Prefer real preferred path when it exists.
    mockFs.existsSync.mockImplementation((p: string) => String(p).includes('exists.webp'));
    const keep = assetPaths.resolveProductCatalogAssets(
      'anything',
      '/assets/catalog/exists.webp',
      ['/assets/catalog/exists.webp'],
    );
    expect(keep.flagship_image).toBe('https://cdn.example.com/assets/catalog/exists.webp');
    expect(keep.images).toEqual(['https://cdn.example.com/assets/catalog/exists.webp']);

    mockFs.existsSync.mockReturnValue(false);
    const arvo = assetPaths.resolveProductCatalogAssets(
      'oando-seating--arvo',
      '/assets/catalog/seating/fabric/oando-seating--arvo/image-01.webp',
      ['/assets/catalog/seating/fabric/oando-seating--arvo/image-01.webp'],
    );
    expect(arvo.flagship_image).toContain('/oando-seating--arvo/');
    expect(arvo.flagship_image).toMatch(/\/image-1\.webp$/);
    expect(arvo.flagship_image).not.toContain('image-01');

    const arvoShortSlug = assetPaths.resolveProductCatalogAssets(
      'arvo',
      '/assets/catalog/seating/fabric/oando-seating--arvo/image-01.webp',
      ['/assets/catalog/seating/fabric/oando-seating--arvo/image-01.webp'],
    );
    expect(arvoShortSlug.flagship_image).toMatch(/\/image-1\.webp$/);
  });
});
