import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductPage, { generateMetadata, generateStaticParams } from '@/app/(site)/products/[category]/[product]/page';
import { resolveProductByUrlKey, type ProductSlugResolution } from '@/lib/productSlugResolver';
import { notFound } from 'next/navigation';
import { buildProductStaticParams } from '@/lib/catalog/productStaticParams';

type MockProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category_id: string;
  images?: string[];
  flagship_image?: string;
  price?: number;
  metadata?: Record<string, unknown>;
};

type ProductJsonLdInput = {
  name: string;
  description: string;
  url: string;
  image: string | readonly string[];
  sku?: string;
  brandName?: string;
  category?: string;
};

function mockProductResolution(
  row: MockProductRow | null,
  requestedSlug = 'some-product',
): ProductSlugResolution<MockProductRow> {
  return {
    row,
    requestedSlug,
    canonicalSlug: row?.slug ?? '',
    resolvedViaAlias: false,
    aliasSlug: null,
  };
}

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('@/features/site/catalog/ProductViewer', () => ({
  ProductViewer: ({
    product,
    categoryId,
    productRoute,
  }: {
    product: { id: string; name: string; slug: string };
    categoryId?: string;
    productRoute: string;
  }) => (
    <div
      data-testid="product-viewer"
      data-product-id={product.id}
      data-product-name={product.name}
      data-product-slug={product.slug}
      data-category-id={categoryId}
      data-product-route={productRoute}
    >
      Product Viewer
    </div>
  ),
}));

vi.mock('@/platform/drizzle/productsDb', () => ({
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: [] }),
    }),
  },
}));

vi.mock('@/lib/productSlugResolver', () => ({
  resolveProductByUrlKey: vi.fn(),
}));

vi.mock('@/lib/productDataTables', () => ({
  fetchProductSpecsMap: vi.fn(async () => new Map()),
  fetchProductImagesMap: vi.fn(async () => new Map()),
}));

const buildProductJsonLdMock = vi.fn(
  (_base: string, input: ProductJsonLdInput) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image,
    ...(input.sku ? { sku: input.sku } : {}),
  }),
);

vi.mock('@/features/site/data/seo', () => ({
  buildBreadcrumbJsonLd: () => ({ '@type': 'BreadcrumbList' }),
  buildPageMetadata: (_base: string, opts: { title: string; description: string }) => ({
    title: { absolute: `${opts.title} | One&Only` },
    description: opts.description,
  }),
  buildProductJsonLd: (base: string, input: ProductJsonLdInput) =>
    buildProductJsonLdMock(base, input),
}));

vi.mock('@/lib/assetPaths', () => ({
  normalizeAssetPath: (x: string | null | undefined) => x ?? '',
  normalizeAssetList: (x: Array<string | null | undefined> | null | undefined) =>
    x ? x.map((value) => value ?? '').filter(Boolean) : [],
  PRODUCT_IMAGE_FALLBACK: '/assets/marketing/fallback/placeholders/product-placeholder.png',
}));

vi.mock('@/lib/security/sanitize', () => ({
  sanitizeJsonForScript: (x: unknown) => JSON.stringify(x),
}));

vi.mock('@/lib/siteUrl', () => ({
  SITE_URL: 'http://localhost:3000',
}));

vi.mock('@/features/site/data/routeCopy', () => ({
  PDP_ROUTE_COPY: {
    productBrand: 'Oando',
    fallbackDescription: 'Check out {name}',
  },
}));

vi.mock('@/lib/catalog/site/categories', () => ({
  classifyToRequestedCategory: () => 'seating',
  getCatalogCategoryLabel: (id: string) => id,
  normalizeRequestedCategoryId: (id: string) => id,
}));

vi.mock('@/lib/catalog/productStaticParams', () => ({
  buildProductStaticParams: vi.fn(async () => []),
}));

async function renderProductContent(params: {
  category: string;
  product: string;
}) {
  const pageElement = await ProductPage({
    params: Promise.resolve(params),
  });
  const productContent = pageElement.props.children;
  const contentElement = await productContent.type(productContent.props);
  return render(contentElement);
}

describe('ProductPage Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateStaticParams', () => {
    it('delegates to buildProductStaticParams and returns its params', async () => {
      vi.mocked(buildProductStaticParams).mockResolvedValueOnce([
        { category: 'seating', product: 'super-chair' },
      ]);
      const params = await generateStaticParams();
      expect(buildProductStaticParams).toHaveBeenCalledTimes(1);
      expect(params).toEqual([{ category: 'seating', product: 'super-chair' }]);
    });
  });

  describe('generateMetadata', () => {
    it('hard-404s unknown products instead of soft empty metadata', async () => {
      vi.mocked(resolveProductByUrlKey).mockResolvedValue(mockProductResolution(null));
      await expect(
        generateMetadata({
          params: Promise.resolve({ category: 'seating', product: 'some-product' }),
        }),
      ).rejects.toThrow('NOT_FOUND');
      expect(notFound).toHaveBeenCalledTimes(1);
    });

    it('returns structured metadata when product resolves', async () => {
      vi.mocked(resolveProductByUrlKey).mockResolvedValue(
        mockProductResolution({
          id: '1',
          slug: 'some-product',
          name: 'Super Chair',
          description: 'A great chair',
          category_id: 'seating',
        }),
      );
      const meta = await generateMetadata({
        params: Promise.resolve({ category: 'seating', product: 'some-product' }),
      });
      expect(meta.title).toEqual({ absolute: 'Super Chair | One&Only' });
      expect(meta.description).toBe('A great chair');
    });
  });

  describe('ProductPage Component', () => {
    it('calls notFound when product resolution returns no row', async () => {
      vi.mocked(resolveProductByUrlKey).mockResolvedValue(mockProductResolution(null));

      await expect(
        ProductPage({
          params: Promise.resolve({ category: 'seating', product: 'some-product' }),
        }).then(async (pageElement) => {
          const productContent = pageElement.props.children;
          await productContent.type(productContent.props);
        }),
      ).rejects.toThrow('NOT_FOUND');
      expect(notFound).toHaveBeenCalledTimes(1);
    });

    it('renders ProductViewer and Product JSON-LD from visible fields only', async () => {
      const mockProduct: MockProductRow = {
        id: 'p-1',
        slug: 'super-chair',
        name: 'Super Chair',
        description: 'Visible product description',
        category_id: 'seating',
        images: ['/image.jpg'],
        flagship_image: '/flagship.jpg',
        // Demo numeric price must never become commercial JSON-LD authority.
        price: 19999,
        metadata: { priceRange: 'mid' },
      };
      vi.mocked(resolveProductByUrlKey).mockResolvedValue(
        mockProductResolution(mockProduct, 'super-chair'),
      );

      const { container } = await renderProductContent({
        category: 'seating',
        product: 'super-chair',
      });

      const viewer = screen.getByTestId('product-viewer');
      expect(viewer).toHaveAttribute('data-product-id', 'p-1');
      expect(viewer).toHaveAttribute('data-product-name', 'Super Chair');
      expect(viewer).toHaveAttribute('data-product-slug', 'super-chair');
      expect(viewer).toHaveAttribute('data-category-id', 'seating');
      expect(viewer).toHaveAttribute(
        'data-product-route',
        '/products/seating/super-chair',
      );

      expect(buildProductJsonLdMock).toHaveBeenCalledTimes(1);
      const visibleInput = buildProductJsonLdMock.mock.calls[0]?.[1];
      expect(visibleInput).toMatchObject({
        name: 'Super Chair',
        description: 'Visible product description',
        sku: 'super-chair',
        brandName: 'Oando',
        category: 'seating',
      });
      expect(visibleInput).not.toHaveProperty('price');
      expect(visibleInput).not.toHaveProperty('offers');
      expect(visibleInput).not.toHaveProperty('availability');

      const productScript = Array.from(
        container.querySelectorAll('script[type="application/ld+json"]'),
      )
        .map((node) => node.innerHTML)
        .find((html) => html.includes('"@type":"Product"') || html.includes('"@type": "Product"'));
      expect(productScript).toBeTruthy();
      const parsed = JSON.parse(productScript!) as Record<string, unknown>;
      expect(parsed['@type']).toBe('Product');
      expect(parsed.name).toBe('Super Chair');
      expect(parsed.description).toBe('Visible product description');
      expect(parsed).not.toHaveProperty('offers');
      expect(JSON.stringify(parsed)).not.toMatch(/InStock|price|19999/i);
    });
  });
});
