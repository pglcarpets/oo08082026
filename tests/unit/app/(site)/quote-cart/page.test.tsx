import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import QuoteCartPage from '@/app/(site)/quote-cart/page';
import { expectHomeMarketingShell } from '@/tests/unit/app/(site)/_template.homepage.test';
import type { QuoteCartItem } from '@/lib/store/quoteCart';

interface QuoteCartMockState {
  items: QuoteCartItem[];
  totalQty: number;
  setQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

vi.mock('@gsap/react', () => ({
  useGSAP: () => undefined,
}));

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    context: vi.fn(() => ({ revert: vi.fn() })),
    from: vi.fn(),
  },
}));

vi.mock('@/lib/helpers/gsapMotion', () => ({
  registerGsapPlugins: vi.fn(),
  gsapReducedMotion: () => true,
  GSAP_EASE_OUT: 'power3.out',
  GSAP_REVEAL: { y: 28, opacity: 0, duration: 0.85, stagger: 0.11 },
}));

vi.mock('@phosphor-icons/react', () => ({
  Minus: () => <span data-testid="icon-minus" />,
  Plus: () => <span data-testid="icon-plus" />,
  Trash2: () => <span data-testid="icon-trash2" />,
  Trash: () => <span data-testid="icon-trash" />,
}));

const mockSetQty = vi.fn<(id: string, qty: number) => void>();
const mockRemoveItem = vi.fn<(id: string) => void>();
const mockClearCart = vi.fn<() => void>();
let mockItems: QuoteCartItem[] = [];
let mockTotalQty = 0;

vi.mock('@/lib/store/quoteCart', () => ({
  useQuoteCart: <T,>(selector: (state: QuoteCartMockState) => T): T =>
    selector({
      items: mockItems,
      totalQty: mockTotalQty,
      setQty: mockSetQty,
      removeItem: mockRemoveItem,
      clearCart: mockClearCart,
    }),
}));

vi.mock('@/features/site/data/routeCopy', () => ({
  QUOTE_CART_ROUTE_COPY: {
    kicker: 'Your shortlist',
    title: 'Quote Cart',
    description: 'Manage your shortlisted items.',
    browseCta: 'Browse Products',
    compareCta: 'Compare Items',
    resourceDeskCta: 'Resource Desk',
    clearCta: 'Clear Cart',
    emptyTitle: 'Cart is empty',
    emptyDescription: 'Shortlist some products first.',
    emptyPrimaryCta: 'Shop Chairs',
    emptySecondaryCta: 'Downloads',
    removeCta: 'Remove',
    summaryTitle: 'Shortlist Summary',
    summaryDescription: 'Review and request final pricing.',
    summaryQuantityLabel: 'Total Quantity',
    summaryProductsLabel: 'Unique Products',
    summaryCompareHint: 'Compare features side-by-side.',
    summaryDeskHint: 'Need layout or spec help?',
    planningCta: 'Planner Support',
    primaryCta: 'Request Quote',
  },
}));

vi.mock('@/lib/assetPaths', () => ({
  normalizeAssetPath: (x: string | null | undefined) => x ?? '',
}));

describe('QuoteCartPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockItems = [];
    mockTotalQty = 0;
  });

  it('renders empty cart messaging and recovery CTAs', () => {
    const { container } = render(<QuoteCartPage />);

    expectHomeMarketingShell(container);
    expect(screen.getByRole('heading', { level: 1, name: 'Quote Cart' })).toBeInTheDocument();
    expect(screen.getByText('Cart is empty')).toBeInTheDocument();
    expect(screen.getByText('Shortlist some products first.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Shop Chairs' })).toHaveAttribute(
      'href',
      '/products',
    );
    expect(screen.getByRole('link', { name: 'Downloads' })).toHaveAttribute(
      'href',
      '/downloads',
    );
    expect(screen.queryByRole('button', { name: /Clear Cart/i })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Compare Items' })).toBeNull();
  });

  it('renders line items, summary metrics, and quote/compare hrefs', () => {
    mockItems = [
      { id: '1', name: 'Task Chair', qty: 2, image: '/chair.jpg', href: '/products/seating/task-chair' },
      { id: '2', name: 'Executive Desk', qty: 1, image: '/desk.jpg', href: '/products/desks/exec-desk' },
    ];
    mockTotalQty = 3;

    render(<QuoteCartPage />);

    expect(screen.getByRole('link', { name: 'Task Chair' })).toHaveAttribute(
      'href',
      '/products/seating/task-chair',
    );
    expect(screen.getByRole('link', { name: 'Executive Desk' })).toHaveAttribute(
      'href',
      '/products/desks/exec-desk',
    );
    expect(screen.getByText('Unique Products:').closest('p')).toHaveTextContent(
      'Unique Products: 2',
    );
    expect(screen.getByText('Total Quantity:').closest('p')).toHaveTextContent(
      'Total Quantity: 3',
    );
    expect(screen.getByRole('link', { name: 'Request Quote' })).toHaveAttribute(
      'href',
      '/contact?intent=quote&source=quote-cart',
    );

    const compareLinks = screen.getAllByRole('link', { name: 'Compare Items' });
    expect(compareLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of compareLinks) {
      expect(link).toHaveAttribute(
        'href',
        `/compare?items=${encodeURIComponent('task-chair,exec-desk')}`,
      );
    }
  });

  it('adjusts quantity, removes a line, and clears the cart', () => {
    mockItems = [
      { id: '1', name: 'Task Chair', qty: 2, image: '/chair.jpg', href: '/products/seating/task-chair' },
    ];
    mockTotalQty = 2;

    render(<QuoteCartPage />);

    const item = screen.getByRole('link', { name: 'Task Chair' }).closest('article');
    expect(item).not.toBeNull();
    const itemScope = within(item!);

    expect(itemScope.getByText('2')).toBeInTheDocument();
    fireEvent.click(
      itemScope.getByRole('button', { name: /Decrease quantity for Task Chair/i }),
    );
    expect(mockSetQty).toHaveBeenCalledWith('1', 1);

    fireEvent.click(
      itemScope.getByRole('button', { name: /Increase quantity for Task Chair/i }),
    );
    expect(mockSetQty).toHaveBeenCalledWith('1', 3);

    fireEvent.click(itemScope.getByRole('button', { name: /Remove/i }));
    expect(mockRemoveItem).toHaveBeenCalledWith('1');

    fireEvent.click(screen.getByRole('button', { name: /Clear Cart/i }));
    expect(mockClearCart).toHaveBeenCalledTimes(1);
  });
});
