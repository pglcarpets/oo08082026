import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProductViewer, sanitizeDisplayText, escapeHtmlAttribute } from '@/features/site/catalog/ProductViewer';
import type { CompatProduct } from '@/lib/catalog/site/getProducts';
import type { ProductCompareItem } from '@/lib/store/productCompare';
import type { QuoteCartItem } from '@/lib/store/quoteCart';
import {
  trackCompareToggled,
  trackQuoteCartAdded,
} from '@/lib/analytics/siteEvents';

type AddQuoteItem = (item: Omit<QuoteCartItem, 'qty'> & { qty?: number }) => void;

interface CompareState {
  items: ProductCompareItem[];
  toggleItem: (item: ProductCompareItem) => void;
}

interface QuoteState {
  addItem: AddQuoteItem;
}

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

vi.mock('next/navigation', () => ({
  usePathname: () => '/products/seating/super-chair',
  useSearchParams: () => new URLSearchParams(''),
}));

vi.mock('@/components/Reviews', () => ({
  Reviews: ({ productId }: { productId: string }) => (
    <div data-testid="mock-reviews">Reviews for {productId}</div>
  ),
}));

vi.mock('@/components/ProductGallery', () => ({
  ProductGallery: ({ images, productName }: { images: string[]; productName: string }) => (
    <div data-testid="mock-gallery">
      Gallery for {productName} - {images.length} images
    </div>
  ),
}));

vi.mock('@/components/products/CompareDock', () => ({
  CompareDock: () => <div data-testid="mock-compare-dock">Compare Dock</div>,
}));

const mockAddItem = vi.fn<AddQuoteItem>();
const mockToggleItem = vi.fn<(item: ProductCompareItem) => void>();
let mockCompareItems: ProductCompareItem[] = [];

vi.mock('@/lib/store/productCompare', () => ({
  useProductCompare: <T,>(selector: (state: CompareState) => T): T =>
    selector({
      items: mockCompareItems,
      toggleItem: mockToggleItem,
    }),
}));

vi.mock('@/lib/store/quoteCart', () => ({
  useQuoteCart: <T,>(selector: (state: QuoteState) => T): T =>
    selector({
      addItem: mockAddItem,
    }),
}));

vi.mock('@/lib/analytics/siteEvents', () => ({
  trackCompareToggled: vi.fn(),
  trackQuoteCartAdded: vi.fn(),
  trackSiteCtaClick: vi.fn(),
  handlePlannerEntryNavigation: vi.fn(),
}));

vi.mock('@/features/site/data/routeCopy', () => ({
  PDP_ROUTE_COPY: {
    productBrand: 'Oando',
    fallbackDescription: 'Fallback',
    ctas: {
      addToQuote: 'Add to Quote',
      addToCompare: 'Add to Compare',
      addedToCompare: 'Added to Compare',
      requestQuote: 'Request Quote',
      designInPlanner: 'Design in Planner',
      planning: 'Planning',
      resourceDesk: 'Resource Desk',
      copyLink: 'Copy Link',
      view3d: 'View in 3D',
      viewImage: 'View Image',
      modelUnavailable: 'Model Unavailable',
      modelChecking: 'Checking Model',
      specifications: 'Specifications',
      keyFeatures: 'Key Features',
      technicalDetails: 'Technical Details',
      returnToResults: 'Return to Results',
      returnToCategory: 'Return to Category',
      configuration: 'Configuration',
    },
    summary: {
      bestFor: 'Best For',
      dimensions: 'Dimensions',
      materials: 'Materials',
      useCases: 'Use Cases',
    },
  },
}));

describe('ProductViewer helpers', () => {
  it('sanitizes display text and escapes HTML attributes', () => {
    expect(sanitizeDisplayText('raw   text')).toBe('raw text');
    expect(sanitizeDisplayText('â€”')).toBe('—');
    expect(escapeHtmlAttribute('<script>"x"&\'y\'')).toBe(
      '&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;',
    );
  });
});

describe('ProductViewer Component', () => {
  const dummyProduct: CompatProduct = {
    id: 'prod-1',
    slug: 'super-chair',
    name: 'Super Chair',
    description: 'A great chair for work.',
    flagshipImage: '/flagship.jpg',
    images: ['/image1.jpg'],
    threeDModelUrl: '/model.glb',
    sceneImages: ['/scene.jpg'],
    variants: [
      {
        id: 'var-1',
        variantName: 'Mesh Red',
        galleryImages: ['/mesh-red.jpg'],
        threeDModelUrl: '/model-red.glb',
      },
    ],
    detailedInfo: {
      overview: 'Full overview detail.',
      features: ['Adjustable Arms', 'Lumbar Support'],
      dimensions: 'W60 H100',
      materials: ['Mesh', 'Nylon'],
    },
    metadata: {
      sustainabilityScore: 9,
      bifmaCertified: true,
      warrantyYears: 5,
    },
    altText: 'Alt Text Super Chair',
    specs: {},
  };

  const writeText = vi.fn<(text: string) => Promise<void>>();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCompareItems = [];
    writeText.mockResolvedValue(undefined);
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      writable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
    });
  });

  async function renderSettledViewer(
    overrides: Partial<{
      categoryId: string;
      planSvgThumbUrl: string;
    }> = {},
  ) {
    render(
      <ProductViewer
        product={dummyProduct}
        categoryRoute="/products/seating"
        categoryName="Seating"
        productRoute="/products/seating/super-chair"
        {...overrides}
      />,
    );
    await act(async () => {});
  }

  it('renders product identity, gallery, reviews, and category links', async () => {
    await renderSettledViewer();

    expect(screen.getByRole('heading', { level: 1, name: 'Super Chair' })).toBeInTheDocument();
    expect(screen.getByText('Full overview detail.')).toBeInTheDocument();
    expect(screen.getByText('Adjustable Arms')).toBeInTheDocument();
    expect(screen.getByTestId('mock-gallery')).toHaveTextContent(
      'Gallery for Super Chair - 4 images',
    );
    expect(screen.getByTestId('mock-reviews')).toHaveTextContent('Reviews for prod-1');
    expect(screen.getByTestId('mock-compare-dock')).toBeInTheDocument();
    expect(screen.queryByTestId('pdp-plan-svg-thumb')).toBeNull();

    const seatingLinks = screen.getAllByRole('link', { name: 'Seating' });
    expect(seatingLinks).toHaveLength(2);
    for (const link of seatingLinks) {
      expect(link).toHaveAttribute('href', '/products/seating');
    }
  });

  it('shows plan SVG thumb when published plan artifact URL is provided', async () => {
    await renderSettledViewer({
      planSvgThumbUrl: '/svg-catalog/oando-breeze-task-chair.svg',
    });

    const thumb = screen.getByTestId('pdp-plan-svg-thumb');
    expect(thumb).toHaveAttribute(
      'data-plan-svg-url',
      '/svg-catalog/oando-breeze-task-chair.svg',
    );
    expect(screen.getByText('Plan symbol')).toBeInTheDocument();
    const symbol = screen.getByRole('img', { name: 'Plan symbol for Super Chair' });
    expect(symbol).toHaveAttribute(
      'src',
      '/svg-catalog/oando-breeze-task-chair.svg',
    );
    expect(symbol).toHaveAttribute('data-testid', 'inline-plan-symbol-preview');
  });

  it('adds to quote and toggles compare with contract payloads', async () => {
    await renderSettledViewer({ categoryId: 'seating' });

    fireEvent.click(screen.getAllByRole('button', { name: /Add to Quote/i })[0]!);
    expect(mockAddItem).toHaveBeenCalledWith({
      id: 'quote-super-chair',
      name: 'Super Chair',
      image: '/image1.jpg',
      href: '/products/seating/super-chair',
      qty: 1,
    });
    expect(vi.mocked(trackQuoteCartAdded)).toHaveBeenCalledWith({
      pathname: '/products/seating/super-chair',
      surface: 'pdp',
      productId: 'super-chair',
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Add to Compare/i })[0]!);
    expect(mockToggleItem).toHaveBeenCalledWith({
      id: 'compare-seating-super-chair',
      productUrlKey: 'super-chair',
      categoryId: 'seating',
      name: 'Super Chair',
      image: '/image1.jpg',
      href: '/products/seating/super-chair',
    });
    expect(vi.mocked(trackCompareToggled)).toHaveBeenCalledWith({
      pathname: '/products/seating/super-chair',
      surface: 'pdp',
      categoryId: 'seating',
      productId: 'super-chair',
      nextState: 'added',
    });
  });

  it('copies the current page URL to the clipboard', async () => {
    await renderSettledViewer();

    fireEvent.click(screen.getByRole('button', { name: /Copy Link/i }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });

  it('selects a variant finish option', async () => {
    await renderSettledViewer();

    fireEvent.click(screen.getByRole('button', { name: /Select Mesh Red variant/i }));
    expect(screen.getByText('Selected:')).toBeInTheDocument();
    expect(screen.getAllByText('Mesh Red').length).toBeGreaterThan(0);
  });

  it('Design in Planner deep-links guest with siteProduct/siteCategory/siteSource (SF-08 / W5)', async () => {
    await renderSettledViewer({ categoryId: 'seating' });

    const href = screen.getByTestId('pdp-design-in-planner').getAttribute('href') ?? '';
    expect(href.startsWith('/ooplanner')).toBe(true);
    expect(href).not.toContain('choose-product');
    expect(href).not.toMatch(/^\/planner(\/)?(\?|$)/);
    expect(href).toContain('siteProduct=super-chair');
    expect(href).toContain('siteCategory=seating');
    expect(href).toContain('siteSource=%2Fproducts%2Fseating%2Fsuper-chair');
  });

  it('Design in Planner omits siteCategory when categoryId is missing (never path)', async () => {
    await renderSettledViewer();

    const href = screen.getByTestId('pdp-design-in-planner').getAttribute('href') ?? '';
    expect(href.startsWith('/ooplanner')).toBe(true);
    expect(href).toContain('siteProduct=super-chair');
    expect(href).toContain('siteSource=%2Fproducts%2Fseating%2Fsuper-chair');
    expect(href).not.toContain('siteCategory=');
    expect(href).not.toMatch(/siteCategory=%2Fproducts/);
  });
});
