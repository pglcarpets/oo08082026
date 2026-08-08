import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { withNuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import { AdvancedFilterGridInner } from '@/features/site/catalog/FilterGridInner';
import { useQuery } from '@tanstack/react-query';

vi.mock('@gsap/react', () => ({
  useGSAP: () => undefined,
}));

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    context: vi.fn(() => ({ revert: vi.fn() })),
    from: vi.fn(),
    to: vi.fn(),
  },
}));

vi.mock('@/lib/helpers/gsapMotion', () => ({
  registerGsapPlugins: vi.fn(),
  gsapReducedMotion: () => true,
  GSAP_EASE_OUT: 'power3.out',
  GSAP_REVEAL: { y: 28, opacity: 0, duration: 0.85, stagger: 0.11 },
  GSAP_SCROLL_REVEAL: { y: 32, opacity: 0, duration: 0.75, stagger: 0.09 },
}));

// Mock router/navigation (pathname only — URL state is owned by nuqs)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/products/office-chairs',
  useSearchParams: () => new URLSearchParams(''),
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

// Mock Compare Store
vi.mock('@/lib/store/productCompare', () => ({
  useProductCompare: (selector: (state: { items: [] }) => unknown) =>
    selector({ items: [] }),
}));

// Mock Analytics
vi.mock('@/lib/analytics/siteEvents', () => ({
  trackSiteCtaClick: vi.fn(),
}));

// Mock icons
vi.mock('@phosphor-icons/react', () => ({
  Filter: () => <span data-testid="icon-filter" />,
  Funnel: () => <span data-testid="icon-filter" />,
  Search: () => <span data-testid="icon-search" />,
  MagnifyingGlass: () => <span data-testid="icon-search" />,
  SlidersHorizontal: () => <span data-testid="icon-sliders" />,
  FadersHorizontal: () => <span data-testid="icon-sliders" />,
  X: () => <span data-testid="icon-x" />,
  GitDiff: () => <span data-testid="icon-git-diff" />,
  GitCompareArrows: () => <span data-testid="icon-git-compare" />,
  CaretLeft: () => <span data-testid="icon-caret-left" />,
}));

// Mock Next Link/Image
// Mock site components
vi.mock('@/components/products/CompareDock', () => ({
  CompareDock: () => <div data-testid="compare-dock">Compare Dock</div>,
}));

vi.mock('@/features/site/catalog/FilterGrid.components', () => ({
  AccordionSection: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div data-testid={`accordion-${title.toLowerCase()}`}>
      <h3>{title}</h3>
      {children}
    </div>
  ),
  CheckList: ({
    options,
    selected,
    onToggle,
  }: {
    options: string[];
    selected: string[];
    onToggle: (value: string) => void;
  }) => (
    <div data-testid="mock-checklist">
      {options.map((opt: string) => (
        <button key={opt} data-testid={`toggle-${opt}`} onClick={() => onToggle(opt)}>
          {opt} {selected.includes(opt) ? '[selected]' : ''}
        </button>
      ))}
    </div>
  ),
  SustainabilityButtons: ({
    onSelect,
  }: {
    onSelect: (value: number | null) => void;
  }) => (
    <div data-testid="mock-sustainability">
      <button data-testid="eco-any" onClick={() => onSelect(null)}>Any</button>
      <button data-testid="eco-8" onClick={() => onSelect(8)}>8</button>
    </div>
  ),
  Toggle: ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <button data-testid={`toggle-bool-${label.toLowerCase()}`} onClick={() => onChange(!checked)}>
      {label} {checked ? 'ON' : 'OFF'}
    </button>
  ),
  ProductCard: ({
    product,
  }: {
    product: { id: string; name: string };
  }) => (
    <div data-testid={`product-card-${product.id}`}>{product.name}</div>
  ),
  ActiveChips: ({
    total,
    onClearAll,
  }: {
    total: number;
    onClearAll: () => void;
  }) => (
    <div data-testid="mock-chips">
      Total active: {total}
      <button data-testid="clear-all-chips" onClick={onClearAll}>Clear all</button>
    </div>
  ),
}));

vi.mock('@/features/site/catalog/FilterGrid.helpers', () => ({
  buildFallbackFacets: () => ({
    series: ['Aero', 'Zephyr'],
    subcategory: ['Task', 'Executive'],
    material: ['Mesh', 'Leather'],
    priceRange: ['budget', 'mid'],
    ecoMin: { min: 0, max: 10 },
    featureAvailability: {
      hasHeadrest: true,
      isHeightAdjustable: true,
      bifmaCertified: true,
      isStackable: true,
    },
  }),
  flattenCategoryProducts: (cat: { products?: unknown[] }) => cat.products || [],
  getProductRouteKey: (p: { slug?: string; id?: string }) => p.slug || p.id || '',
  useDebouncedValue: <T,>(val: T) => val,
}));

vi.mock('@/features/site/data/routeCopy', () => ({
  CATEGORY_ROUTE_COPY: {
    browseAllCta: 'Browse all categories',
    resourceDeskCta: 'Open Resource Desk',
    compareIdleLabel: 'Select up to 4 products to compare',
    compareIdleLabelShort: 'Compare',
    compareActiveLabelShort: 'Compare ({count})',
    compareActiveLabel: 'Compare {count} selected',
    filterSummaryTitle: 'Filter the current category',
    filterSummaryDescription: 'Use filters',
    resultsSummaryLabel: '{shown} of {total} products',
    drawerResultsCta: 'View {count} results',
    drawerResultsHint: 'Filters update the current category only.',
    filterFallbackMessage: 'Live filter sync is temporarily unavailable.',
    emptyTitle: 'No products match this filter set',
    emptyDescription: 'Clear filters, adjust your search, or return to the full category list.',
    emptyPrimaryCta: 'Clear all filters',
    emptySecondaryCta: 'Browse all categories',
    emptyCategoryTitle: 'No products are published in this category yet',
    emptyCategoryDescription:
      'This category has no published products right now. Browse other categories or contact us for current availability.',
    emptyCategoryPrimaryCta: 'Browse all categories',
    emptyCategorySecondaryCta: 'Contact us',
    errorTitle: "We couldn't load this category",
    errorDescription: 'Something went wrong loading these products.',
    clearFiltersCta: 'Clear all',
  },
}));

function renderFilterGrid(
  ui: React.ReactElement,
  options?: {
    searchParams?: string;
    onUrlUpdate?: OnUrlUpdateFunction;
  },
) {
  return render(ui, {
    wrapper: withNuqsTestingAdapter({
      searchParams: options?.searchParams ?? '',
      onUrlUpdate: options?.onUrlUpdate,
      hasMemory: true,
    }),
  });
}

describe('AdvancedFilterGridInner', () => {
  const gridShellProps = {
    heroImage: {
      src: "/assets/catalog/workstations/oando-workstations--deskpro/image-1.jpg",
      alt: "Deskpro workstation",
    },
    subcategoryQuickLinks: ["Mesh chairs", "Fabric chairs"],
  };

  const dummyCategory = {
    name: 'Office Chairs',
    products: [
      { id: '1', slug: 'chair-1', name: 'Chair One', metadata: {} },
      { id: '2', slug: 'chair-2', name: 'Chair Two', metadata: {} },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without error under loading state', () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: null,
      isLoading: true,
      isFetching: true,
      error: null,
    });

    renderFilterGrid(
      <AdvancedFilterGridInner
        category={dummyCategory as never}
        categoryId="office-chairs"
        {...gridShellProps}
      />
    );
    expect(screen.getByRole('heading', { name: /Office Chairs/i })).toBeInTheDocument();
  });

  it('renders fallback products if no query API data is loaded', () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: null,
    });

    renderFilterGrid(
      <AdvancedFilterGridInner
        category={dummyCategory as never}
        categoryId="office-chairs"
        {...gridShellProps}
      />
    );

    expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
  });

  it('renders products returned from query API', () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        products: [
          { id: '10', slug: 'api-chair', name: 'API Chair', metadata: {} },
        ],
        facets: {
          series: ['Aero'],
          subcategory: ['Task'],
          material: ['Mesh'],
          priceRange: ['mid'],
          ecoMin: { min: 0, max: 10 },
          featureAvailability: {
            hasHeadrest: true,
            isHeightAdjustable: true,
            bifmaCertified: true,
            isStackable: true,
          },
        },
        meta: {
          catalogTotal: 1,
        },
      },
      isLoading: false,
      isFetching: false,
      error: null,
    });

    renderFilterGrid(
      <AdvancedFilterGridInner
        category={dummyCategory as never}
        categoryId="office-chairs"
        {...gridShellProps}
      />
    );

    expect(screen.getByTestId('product-card-10')).toBeInTheDocument();
    expect(screen.queryByTestId('product-card-1')).not.toBeInTheDocument();
  });

  it('shows honest empty-category state when no products are published', () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        products: [],
        facets: {
          series: [],
          subcategory: [],
          material: [],
          priceRange: [],
          ecoMin: { min: 0, max: 10 },
          featureAvailability: {
            hasHeadrest: false,
            isHeightAdjustable: false,
            bifmaCertified: false,
            isStackable: false,
          },
        },
        meta: { catalogTotal: 0 },
      },
      isLoading: false,
      isFetching: false,
      error: null,
    });

    const emptyCategory = { name: 'Workstations', products: [] };
    renderFilterGrid(
      <AdvancedFilterGridInner
        category={emptyCategory as never}
        categoryId="workstations"
        {...gridShellProps}
      />,
    );

    expect(
      screen.getByRole('heading', { name: /Workstations/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'No products are published in this category yet' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no published products right now/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Browse all categories' }),
    ).toHaveAttribute('href', '/products');
    expect(
      screen.getByRole('link', { name: 'Contact us' }),
    ).toHaveAttribute('href', '/contact');
    // Dead filter chrome stays off when the category itself is empty.
    expect(screen.queryByRole('button', { name: /filters/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId('product-card-1')).not.toBeInTheDocument();
  });

  it('shows honest filter-empty state with clear action when filters exclude all products', () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        products: [],
        facets: {
          series: [],
          subcategory: [],
          material: [],
          priceRange: [],
          ecoMin: { min: 0, max: 10 },
          featureAvailability: {
            hasHeadrest: false,
            isHeightAdjustable: false,
            bifmaCertified: false,
            isStackable: false,
          },
        },
        meta: { catalogTotal: 2 },
      },
      isLoading: false,
      isFetching: false,
      error: null,
    });

    renderFilterGrid(
      <AdvancedFilterGridInner
        category={dummyCategory as never}
        categoryId="office-chairs"
        {...gridShellProps}
      />,
      { searchParams: 'q=zzz-no-match' },
    );

    expect(
      screen.getByRole('heading', { name: 'No products match this filter set' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Clear all filters' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Browse all categories' }),
    ).toHaveAttribute('href', '/products');
    // Chip bar still exposes its own clear control.
    expect(screen.getAllByRole('button', { name: 'Clear all' }).length).toBeGreaterThanOrEqual(1);
  });

  it('shows honest error state when the filter request fails and no products remain', () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: new Error('Filter request failed: 500'),
    });

    const emptyCategory = { name: 'Broken', products: [] };
    renderFilterGrid(
      <AdvancedFilterGridInner
        category={emptyCategory as never}
        categoryId="broken"
        {...gridShellProps}
      />,
      { searchParams: 'q=fail' },
    );

    expect(
      screen.getByRole('heading', { name: "We couldn't load this category" }),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('handles search input change and triggers navigation updates', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: null,
    });

    renderFilterGrid(
      <AdvancedFilterGridInner
        category={dummyCategory as never}
        categoryId="office-chairs"
        {...gridShellProps}
      />,
      { onUrlUpdate },
    );

    const searchInput = screen.getByPlaceholderText('Search products, materials, or series');
    fireEvent.change(searchInput, { target: { value: 'ergonomic' } });

    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });

    const lastCall = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall?.searchParams.get('q')).toBe('ergonomic');
    expect(lastCall?.options.history).toBe('replace');
  });

  it('handles toggle of boolean attributes', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: null,
    });

    renderFilterGrid(
      <AdvancedFilterGridInner
        category={dummyCategory as never}
        categoryId="office-chairs"
        {...gridShellProps}
      />,
      { onUrlUpdate },
    );

    const headrestToggle = screen.getByTestId('toggle-bool-with headrest');
    fireEvent.click(headrestToggle);

    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });

    const lastCall = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall?.searchParams.get('headrest')).toBe('1');
    expect(lastCall?.options.history).toBe('push');
  });
});
