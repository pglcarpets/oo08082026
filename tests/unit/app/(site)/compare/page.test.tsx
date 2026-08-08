import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComparePage from '@/app/(site)/compare/page';
import { COMPARE_ROUTE_COPY } from '@/features/site/data/routeCopy';
import { getProducts } from '@/lib/catalog/site/getProducts';

vi.mock('@/lib/catalog/site/getProducts', () => ({
  getProducts: vi.fn(async () => []),
}));

vi.mock('@/components/shared/SectionIntro', () => ({
  SectionIntro: ({ title }: { title: string }) => <h2>{title}</h2>,
}));

vi.mock('@/components/products/CompareColumnActions', () => ({
  CompareColumnActions: () => <div data-testid="compare-column-actions" />,
}));

vi.mock('@/components/products/CompareShortlistHydrator', () => ({
  CompareShortlistHydrator: () => null,
}));

vi.mock('@/components/ui/TrackedLink', () => ({
  TrackedLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('app/(site)/compare/page.tsx', () => {
  it('renders empty compare state when no items are provided', async () => {
    const page = await ComparePage({});
    render(page);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Compare selected workspace options/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(COMPARE_ROUTE_COPY.emptyTitle)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: COMPARE_ROUTE_COPY.bodyHeading,
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('home-marketing-layout')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open guest planner/i })).toHaveAttribute(
      'href',
      '/choose-product?mode=guest',
    );
    expect(getProducts).not.toHaveBeenCalled();
  });

  it('resolves selected products from one catalog read', async () => {
    vi.mocked(getProducts).mockResolvedValueOnce([
      {
        id: 'chair-a',
        name: 'Chair A',
        slug: 'chair-a',
        category_id: 'chairs',
        images: [],
        specs: { dimensions: '600 x 600', materials: ['Mesh'], features: ['Adjustable'] },
        metadata: {},
        series_id: 'task',
        series_name: 'Task',
        created_at: '2026-01-01',
        series: 'task',
      },
      {
        id: 'chair-b',
        name: 'Chair B',
        slug: 'chair-b',
        category_id: 'chairs',
        images: [],
        specs: { dimensions: '', materials: [], features: [] },
        metadata: {},
        series_id: 'task',
        series_name: 'Task',
        created_at: '2026-01-01',
        series: 'task',
      },
    ]);

    const page = await ComparePage({
      searchParams: Promise.resolve({ items: 'chair-a,missing,chair-b' }),
    });
    render(page);

    expect(getProducts).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Chair A')).toBeInTheDocument();
    expect(screen.getByText('Chair B')).toBeInTheDocument();
    expect(screen.queryByText(COMPARE_ROUTE_COPY.emptyTitle)).not.toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
