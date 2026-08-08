import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuoteCartLayout, { metadata } from '@/app/(site)/quote-cart/layout';

vi.mock('@/features/site/data/routeMetadata', () => ({
  QUOTE_CART_PAGE_METADATA: { title: 'Quote Cart' },
}));

describe('QuoteCartLayout Component', () => {
  it('renders children correctly', () => {
    expect(metadata).toEqual({ title: 'Quote Cart' });

    render(
      <QuoteCartLayout>
        <div data-testid="layout-child">Child Content</div>
      </QuoteCartLayout>
    );

    expect(screen.getByTestId('layout-child')).toBeInTheDocument();
  });
});
