import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  AccordionSection,
  CheckList,
  SustainabilityButtons,
  Toggle,
  ProductCard,
  ActiveChips,
} from '@/features/site/catalog/FilterGrid.components';
import type { FlatProduct } from '@/features/site/catalog/FilterGrid.helpers';
import type { ActiveFilters } from '@/lib/catalog/site/filters';
import type {
  trackCompareToggled,
  trackQuoteCartAdded,
} from '@/lib/analytics/siteEvents';
import type { ProductCompareItem } from '@/lib/store/productCompare';
import type { QuoteCartItem } from '@/lib/store/quoteCart';

type TrackCompareToggled = typeof trackCompareToggled;
type TrackQuoteCartAdded = typeof trackQuoteCartAdded;
type AddQuoteItem = (item: Omit<QuoteCartItem, 'qty'> & { qty?: number }) => void;

const { mockTrackCompareToggled, mockTrackQuoteCartAdded } = vi.hoisted(() => ({
  mockTrackCompareToggled: vi.fn<TrackCompareToggled>(),
  mockTrackQuoteCartAdded: vi.fn<TrackQuoteCartAdded>(),
}));

// Mock dependencies
vi.mock('@/features/site/data/routeCopy', () => ({
  CATEGORY_ROUTE_COPY: {
    activeSearchLabel: 'Search',
    activeFiltersLabel: 'Active Filters',
    activeCountLabel: '{count} filters active',
    clearFiltersCta: 'Clear all',
  },
}));

vi.mock('@/lib/catalog/site/filters', () => ({
  SUSTAINABILITY_THRESHOLDS: [4, 7, 9],
}));

vi.mock('@/lib/analytics/siteEvents', () => ({
  trackCompareToggled: mockTrackCompareToggled,
  trackQuoteCartAdded: mockTrackQuoteCartAdded,
}));

const mockToggleItem = vi.fn<(item: ProductCompareItem) => void>();
const mockAddItem = vi.fn<AddQuoteItem>();
let mockCompareItems: ProductCompareItem[] = [];

interface CompareState {
  items: ProductCompareItem[];
  toggleItem: (item: ProductCompareItem) => void;
}

interface QuoteState {
  addItem: AddQuoteItem;
}

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

describe('FilterGrid.components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCompareItems = [];
  });

  describe('AccordionSection', () => {
    it('renders title and toggles open state', () => {
      render(
        <AccordionSection title="Test Accordion" count={5}>
          <div>Accordion Content</div>
        </AccordionSection>
      );

      expect(screen.getByText('Test Accordion')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.queryByText('Accordion Content')).not.toBeInTheDocument();

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Accordion Content')).toBeInTheDocument();

      fireEvent.click(button);
      expect(screen.queryByText('Accordion Content')).not.toBeInTheDocument();
    });
  });

  describe('CheckList', () => {
    it('renders options and handles toggle', () => {
      const onToggle = vi.fn();
      render(
        <CheckList
          options={['option1', 'option2']}
          selected={['option1']}
          onToggle={onToggle}
        />
      );

      expect(screen.getByLabelText('option1')).toBeChecked();
      expect(screen.getByLabelText('option2')).not.toBeChecked();

      fireEvent.click(screen.getByLabelText('option2'));
      expect(onToggle).toHaveBeenCalledWith('option2');
    });

    it('renders empty placeholder if no options', () => {
      render(<CheckList options={[]} selected={[]} onToggle={vi.fn()} />);
      expect(screen.getByText('No options available')).toBeInTheDocument();
    });
  });

  describe('SustainabilityButtons', () => {
    it('renders buttons and handles click', () => {
      const onSelect = vi.fn();
      render(<SustainabilityButtons selected={7} onSelect={onSelect} />);

      expect(screen.getByText('Any')).toBeInTheDocument();
      expect(screen.getByText('>= 4')).toBeInTheDocument();
      expect(screen.getByText('>= 7')).toBeInTheDocument();
      expect(screen.getByText('>= 9')).toBeInTheDocument();

      fireEvent.click(screen.getByText('>= 4'));
      expect(onSelect).toHaveBeenCalledWith(4);

      fireEvent.click(screen.getByText('Any'));
      expect(onSelect).toHaveBeenCalledWith(null);
    });
  });

  describe('Toggle', () => {
    it('renders toggle and handles click', () => {
      const onChange = vi.fn();
      render(<Toggle label="Feature A" checked={false} onChange={onChange} />);

      expect(screen.getByText('Feature A')).toBeInTheDocument();
      const button = screen.getByRole('switch');
      expect(button).toHaveAttribute('aria-checked', 'false');

      fireEvent.click(button);
      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  describe('ProductCard', () => {
    const dummyProduct: FlatProduct = {
      id: 'prod-123',
      slug: 'awesome-chair',
      name: 'Awesome Chair',
      description: 'An ergonomic office chair.',
      flagshipImage: '/img1.jpg',
      sceneImages: [],
      images: ['/img1.jpg'],
      variants: [],
      detailedInfo: {
        overview: 'An ergonomic office chair.',
        features: [],
        dimensions: 'W60 x D60 x H90 cm',
        materials: ['Mesh'],
      },
      seriesId: 'series-1',
      seriesName: 'Series One',
      metadata: {
        sustainabilityScore: 8,
        bifmaCertified: true,
      },
      specs: {
        dimensions: 'W60 x D60 x H90 cm',
        materials: ['Mesh'],
      },
    } satisfies FlatProduct;

    const expectedCardImage = '/img1.jpg';

    it('renders product details correctly', () => {
      render(
        <ProductCard
          product={dummyProduct}
          categoryId="office-chairs"
          categoryName="Office Chairs"
          contextQueryString="q=chair"
        />
      );

      expect(screen.getByText('Awesome Chair')).toBeInTheDocument();
      expect(screen.getByText('Series One')).toBeInTheDocument();
      expect(screen.getByText('BIFMA')).toBeInTheDocument();
    });

    it('triggers compare action', () => {
      render(
        <ProductCard
          product={dummyProduct}
          categoryId="office-chairs"
          categoryName="Office Chairs"
          contextQueryString=""
        />
      );

      const compareBtn = screen.getByRole('button', { name: /Add to compare/i });
      fireEvent.click(compareBtn);

      expect(mockToggleItem).toHaveBeenCalledWith({
        id: 'compare-office-chairs-awesome-chair',
        productUrlKey: 'awesome-chair',
        categoryId: 'office-chairs',
        name: 'Awesome Chair',
        image: expect.stringMatching(/\/img1\.jpg$/),
        href: '/products/office-chairs/awesome-chair',
      });
      expect(mockTrackCompareToggled).toHaveBeenCalled();
    });

    it('shows "Compared" if in compare list', () => {
      mockCompareItems = [{
        id: 'compare-office-chairs-awesome-chair',
        productUrlKey: 'awesome-chair',
        categoryId: 'office-chairs',
        name: 'Awesome Chair',
        image: expectedCardImage,
        href: '/products/office-chairs/awesome-chair',
      }];
      render(
        <ProductCard
          product={dummyProduct}
          categoryId="office-chairs"
          categoryName="Office Chairs"
          contextQueryString=""
        />
      );

      expect(screen.getByText('Compared')).toBeInTheDocument();
      const compareBtn = screen.getByRole('button', { name: /Remove from compare/i });
      expect(compareBtn).toBeInTheDocument();
    });


  });

  describe('ActiveChips', () => {
    const dummyFilters = {
      query: 'ergonomic',
      series: 'Aero',
      subcategory: ['Task', 'Executive'],
      priceRange: ['mid'],
      material: ['Mesh'],
      hasHeadrest: true,
      isHeightAdjustable: true,
      bifmaCertified: true,
      isStackable: true,
      sort: 'az',
      ecoMin: 8,
    } satisfies ActiveFilters;

    it('renders chips for active filters', () => {
      const onRemove = vi.fn();
      const onClearAll = vi.fn();

      render(
        <ActiveChips
          filters={dummyFilters}
          onRemove={onRemove}
          onClearAll={onClearAll}
          total={10}
        />
      );

      expect(screen.getByText('Search: ergonomic')).toBeInTheDocument();
      expect(screen.getByText('Series: Aero')).toBeInTheDocument();
      expect(screen.getByText('Subcategory: Task')).toBeInTheDocument();
      expect(screen.getByText('Subcategory: Executive')).toBeInTheDocument();
      expect(screen.getByText('Price: mid')).toBeInTheDocument();
      expect(screen.getByText('Mesh')).toBeInTheDocument();
      expect(screen.getByText('With headrest')).toBeInTheDocument();
      expect(screen.getByText('Height adjustable')).toBeInTheDocument();
      expect(screen.getByText('BIFMA certified')).toBeInTheDocument();
      expect(screen.getByText('Stackable')).toBeInTheDocument();
      expect(screen.getByText('Eco >= 8')).toBeInTheDocument();

      fireEvent.click(screen.getByText('With headrest'));
      expect(onRemove).toHaveBeenCalledWith('hasHeadrest', undefined);

      fireEvent.click(screen.getByText('Clear all'));
      expect(onClearAll).toHaveBeenCalled();
    });

    it('returns null if total is 0', () => {
      const { container } = render(
        <ActiveChips
          filters={dummyFilters}
          onRemove={vi.fn()}
          onClearAll={vi.fn()}
          total={0}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });
});
