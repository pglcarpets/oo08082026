import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompareColumnActions } from '@/components/products/CompareColumnActions';
import { CompareDock } from '@/components/products/CompareDock';
import type { ProductCompareItem } from '@/lib/store/productCompare';
import { trackQuoteCartAdded, trackSiteCtaClick } from '@/lib/analytics/siteEvents';

vi.mock('@phosphor-icons/react', () => ({
  GitDiff: () => <div data-testid="compare-icon" />,
  Trash: () => <div data-testid="trash-icon" />,
  ShoppingCart: () => <div data-testid="shopping-cart-icon" />,
}));

let mockPathname = '/products/seating';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

vi.mock('@/lib/analytics/siteEvents', () => ({
  trackSiteCtaClick: vi.fn(),
  trackQuoteCartAdded: vi.fn(),
}));

let mockItems: ProductCompareItem[] = [];
const mockClear = vi.fn();
vi.mock('@/lib/store/productCompare', () => ({
  MAX_COMPARE_ITEMS: 3,
  useProductCompare: <T,>(selector: (state: { items: ProductCompareItem[]; clear: () => void }) => T) =>
    selector({
      items: mockItems,
      clear: mockClear,
    }),
}));

const mockAddItem = vi.fn();
vi.mock('@/lib/store/quoteCart', () => ({
  useQuoteCart: <T,>(selector: (state: { addItem: typeof mockAddItem }) => T) =>
    selector({ addItem: mockAddItem }),
}));

function compareItem(
  partial: Pick<ProductCompareItem, 'productUrlKey' | 'name'> & Partial<ProductCompareItem>,
): ProductCompareItem {
  return {
    id: partial.id ?? (partial.productUrlKey || 'item'),
    categoryId: partial.categoryId ?? 'seating',
    productUrlKey: partial.productUrlKey,
    name: partial.name,
    image: partial.image,
    href: partial.href,
  };
}

describe('Product compare surfaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/products/seating';
    mockItems = [];
  });

  describe('CompareDock', () => {
    it('hides when empty or on /compare', () => {
      const empty = render(<CompareDock />);
      expect(empty.container.firstChild).toBeNull();
      empty.unmount();

      mockPathname = '/compare';
      mockItems = [
        compareItem({ productUrlKey: 'chair-a', name: 'Chair A' }),
        compareItem({ productUrlKey: 'chair-b', name: 'Chair B' }),
      ];
      const onCompare = render(<CompareDock />);
      expect(onCompare.container.firstChild).toBeNull();
    });

    it('renders shortlist, clear action, and compare link', () => {
      mockItems = [
        compareItem({ productUrlKey: 'chair-a', name: 'Chair A' }),
        compareItem({ productUrlKey: 'chair-b', name: 'Chair B' }),
      ];

      render(<CompareDock />);

      expect(screen.getByText('Compare products (2/3)')).toBeInTheDocument();
      expect(screen.getByText('Chair A | Chair B')).toBeInTheDocument();
      expect(
        screen.getByRole('region', { name: 'Product comparison shortlist' }),
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('button', { name: /Clear comparison shortlist/i }),
      );
      expect(mockClear).toHaveBeenCalled();

      const compareLink = screen.getByRole('link', {
        name: /Compare 2 selected office furniture products/i,
      });
      expect(compareLink).toHaveAttribute('href', '/compare?items=chair-a%2Cchair-b');
      fireEvent.click(compareLink);
      expect(trackSiteCtaClick).toHaveBeenCalledWith({
        href: '/compare?items=chair-a%2Cchair-b',
        label: 'Compare now',
        pathname: '/products/seating',
        surface: 'compare-dock',
      });
    });

    it('skips empty productUrlKey values in the compare query', () => {
      mockItems = [
        compareItem({ productUrlKey: '', name: 'Chair A' }),
        compareItem({ productUrlKey: 'chair-b', name: 'Chair B' }),
      ];

      render(<CompareDock />);
      expect(
        screen.getByRole('link', {
          name: /Compare 2 selected office furniture products/i,
        }),
      ).toHaveAttribute('href', '/compare?items=chair-b');
    });
  });

  describe('CompareColumnActions', () => {
    const props = {
      productId: '123',
      productName: 'Super Ergonomic Chair',
      productHref: '/products/seating/super-chair',
      image: '/assets/catalog/super-chair.webp',
      viewLabel: 'View Details',
      addLabel: 'Add to Quote',
    };

    it('links to product details and adds to quote cart', () => {
      mockPathname = '/products/compare';
      render(<CompareColumnActions {...props} />);

      expect(screen.getByRole('link', { name: 'View Details' })).toHaveAttribute(
        'href',
        '/products/seating/super-chair',
      );

      fireEvent.click(
        screen.getByRole('button', { name: /Add to Quote Super Ergonomic Chair/i }),
      );

      expect(trackQuoteCartAdded).toHaveBeenCalledWith({
        pathname: '/products/compare',
        surface: 'compare-column-actions',
        productId: '123',
      });
      expect(mockAddItem).toHaveBeenCalledWith({
        id: 'quote-123',
        name: 'Super Ergonomic Chair',
        image: '/assets/catalog/super-chair.webp',
        href: '/products/seating/super-chair',
        qty: 1,
      });
    });
  });
});
