import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CategoryPage, {
  generateMetadata,
  generateStaticParams,
} from '@/app/(site)/products/[category]/page';
import { CategoryPageView } from '@/features/site/catalog/CategoryPageView';
import { notFound, permanentRedirect } from 'next/navigation';
import { buildRequestedCategoryCatalog } from '@/lib/catalog/site/categories';
import { fetchCategoryIdsLive } from '@/lib/catalog/sources';
import { getCatalog } from '@/lib/catalog/site/getProducts';
import type { CompatCategory } from '@/lib/catalog/site/getProducts';
import {
  buildBreadcrumbJsonLd,
  buildPageJsonLd,
  type PageMetadataInput,
} from '@/features/site/data/seo';
import { sanitizeJsonForScript } from '@/lib/security/sanitize';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
  permanentRedirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/products/cat1'),
  redirect: vi.fn(),
}));

vi.mock('@/features/site/data/seo', () => ({
  buildPageMetadata: (_base: string, opts: PageMetadataInput) => ({
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
  }),
  buildPageJsonLd: vi.fn(() => ({ '@type': 'CollectionPage' })),
  buildBreadcrumbJsonLd: vi.fn(() => ({ '@type': 'BreadcrumbList' })),
}));

vi.mock('@/lib/catalog/site/categories', () => ({
  Catalog_CATEGORY_ORDER: ['seating', 'desks'],
  Catalog_SUBCATEGORY_LABELS: {
    seating: [],
    workstations: [],
    tables: [],
    storages: [],
    'soft-seating': [],
    education: [],
  },
  normalizeRequestedCategoryId: (id: string) => {
    if (id === 'SEATING') return 'seating';
    if (id === 'invalid') return null;
    return id;
  },
  buildRequestedCategoryCatalog: vi.fn((catalog: CompatCategory[]) => catalog),
  getCatalogCategoryLabel: (id: string, def: string) => `Label for ${id} (${def})`,
  getCatalogCategoryDescription: (id: string, def: string) => `Desc for ${id} (${def})`,
}));

vi.mock('@/lib/catalog/site/getProducts', () => ({
  getCatalog: vi.fn(async (): Promise<CompatCategory[]> => [
    {
      id: 'seating',
      name: 'Chairs',
      description: 'Comfortable chairs',
      series: [],
    },
  ]),
}));

vi.mock('@/lib/catalog/sources', () => ({
  fetchCategoryIdsLive: vi.fn(),
}));

vi.mock('@/lib/siteUrl', () => ({
  SITE_URL: 'http://localhost:3000',
}));

vi.mock('@/lib/security/sanitize', () => ({
  sanitizeJsonForScript: vi.fn((data: unknown) => JSON.stringify(data)),
}));

vi.mock('@/features/site/catalog/FilterGrid', () => ({
  FilterGrid: ({
    categoryId,
    category,
  }: {
    categoryId: string;
    category: CompatCategory;
  }) => (
    <div
      data-testid="filter-grid"
      data-category-id={categoryId}
      data-category-name={category.name}
    />
  ),
}));

vi.mock('@/features/site/data/routeCopy', () => ({
  CATEGORY_ROUTE_COPY: {
    offlineTitle: 'Offline',
    offlineDescription: 'Offline description',
    offlinePrimaryCta: 'Contact us',
    offlineSecondaryCta: 'Back to home',
    metadataSuffix: 'Suffix',
    metadataTail:
      'Browse our full range of {category} for practical office planning and delivery.',
  },
}));

function categoryFixture(overrides: Partial<CompatCategory> & Pick<CompatCategory, 'id'>): CompatCategory {
  return {
    name: overrides.id,
    description: '',
    series: [],
    ...overrides,
  };
}

describe('Category products surface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(buildRequestedCategoryCatalog).mockImplementation(
      (catalog: CompatCategory[]) => catalog,
    );
    vi.mocked(getCatalog).mockResolvedValue([
      categoryFixture({
        id: 'seating',
        name: 'Chairs',
        description: 'Comfortable chairs',
      }),
    ]);
  });

  describe('generateMetadata', () => {
    it('hard-404s unknown categories instead of soft empty metadata', async () => {
      await expect(
        generateMetadata({ params: Promise.resolve({ category: 'non-existent' }) }),
      ).rejects.toThrow('NOT_FOUND');
      expect(notFound).toHaveBeenCalled();
    });

    it('returns noindex robots when catalog is offline/empty', async () => {
      vi.mocked(getCatalog).mockResolvedValueOnce([]);
      const meta = await generateMetadata({
        params: Promise.resolve({ category: 'seating' }),
      });
      expect(meta).toEqual({ robots: { index: false, follow: false } });
      expect(notFound).not.toHaveBeenCalled();
    });

    it('returns built page metadata if category exists', async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({ category: 'seating' }),
      });
      expect(meta).toEqual({
        title: 'Label for seating (Chairs)',
        description:
          'Desc for seating (Comfortable chairs) Browse our full range of label for seating (chairs) for practical office planning and delivery.',
        alternates: { canonical: '/products/seating' },
      });
    });
  });

  describe('generateStaticParams', () => {
    it('merges static order with live category ids', async () => {
      vi.mocked(fetchCategoryIdsLive).mockResolvedValue(['oando-tables']);

      const params = await generateStaticParams();
      expect(params).toContainEqual({ category: 'seating' });
      expect(params).toContainEqual({ category: 'desks' });
      expect(params).toContainEqual({ category: 'oando-tables' });
    });
  });

  describe('CategoryPage route', () => {
    it('triggers notFound() if category is invalid', async () => {
      await expect(
        CategoryPage({ params: Promise.resolve({ category: 'invalid' }) }),
      ).rejects.toThrow('NOT_FOUND');
      expect(notFound).toHaveBeenCalled();
    });

    it('permanent-redirects if requested categoryId needs normalization', async () => {
      await expect(
        CategoryPage({ params: Promise.resolve({ category: 'SEATING' }) }),
      ).rejects.toThrow('REDIRECT:/products/seating/');
      expect(permanentRedirect).toHaveBeenCalledWith('/products/seating/');
    });

    it('renders category view chrome for a valid category', async () => {
      const element = await CategoryPage({
        params: Promise.resolve({ category: 'seating' }),
      });
      render(element);
      expect(screen.getByTestId('filter-grid')).toBeInTheDocument();
      expect(screen.getByTestId('home-marketing-layout')).toBeInTheDocument();
    });
  });

  describe('CategoryPageView', () => {
    it('renders offline state if catalog is empty', async () => {
      vi.mocked(buildRequestedCategoryCatalog).mockReturnValue([]);

      const jsx = await CategoryPageView({ categoryId: 'cat1' });
      render(jsx);

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('Offline description')).toBeInTheDocument();
      expect(screen.getByTestId('home-marketing-layout')).toBeInTheDocument();
      expect(screen.queryByTestId('filter-grid')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Contact us' })).toHaveAttribute(
        'href',
        '/contact',
      );
      expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute(
        'href',
        '/',
      );
      expect(buildPageJsonLd).not.toHaveBeenCalled();
      expect(buildBreadcrumbJsonLd).not.toHaveBeenCalled();
    });

    it('calls notFound if category is not found in catalog', async () => {
      vi.mocked(buildRequestedCategoryCatalog).mockReturnValue([
        categoryFixture({ id: 'other-cat' }),
      ]);

      await expect(CategoryPageView({ categoryId: 'cat1' })).rejects.toThrow(
        'NOT_FOUND',
      );
      expect(notFound).toHaveBeenCalledTimes(1);
      expect(buildPageJsonLd).not.toHaveBeenCalled();
      expect(sanitizeJsonForScript).not.toHaveBeenCalled();
    });

    it('renders FilterGrid and JSON-LD scripts if category is found', async () => {
      vi.mocked(buildRequestedCategoryCatalog).mockReturnValue([
        categoryFixture({
          id: 'cat1',
          name: 'Cat 1',
          description: 'Desc 1',
        }),
      ]);

      const jsx = await CategoryPageView({ categoryId: 'cat1' });
      const { container } = render(jsx);

      const filterGrid = screen.getByTestId('filter-grid');
      expect(filterGrid).toHaveAttribute('data-category-id', 'cat1');
      expect(filterGrid).toHaveAttribute(
        'data-category-name',
        'Label for cat1 (Cat 1)',
      );
      expect(screen.getByTestId('home-marketing-layout')).toBeInTheDocument();

      expect(buildPageJsonLd).toHaveBeenCalledWith('http://localhost:3000', {
        path: '/products/cat1',
        title: 'Label for cat1 (Cat 1) | Suffix',
        description: 'Desc for cat1 (Desc 1)',
        pageType: 'CollectionPage',
      });
      expect(buildBreadcrumbJsonLd).toHaveBeenCalledWith('http://localhost:3000', [
        { name: 'Home', path: '/' },
        { name: 'Products', path: '/products' },
        { name: 'Label for cat1 (Cat 1)', path: '/products/cat1' },
      ]);
      expect(sanitizeJsonForScript).toHaveBeenCalledTimes(2);

      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts).toHaveLength(2);
      expect(scripts[0]?.textContent).toBe(
        JSON.stringify({ '@type': 'CollectionPage' }),
      );
      expect(scripts[1]?.textContent).toBe(
        JSON.stringify({ '@type': 'BreadcrumbList' }),
      );
    });
  });
});
