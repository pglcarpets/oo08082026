import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '@/app/(site)/not-found';

vi.mock('@/components/ui/MarketingCtaLink', () => ({
  MarketingCtaLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('app/(site)/not-found.tsx', () => {
  it('renders 404 message and popular links', () => {
    render(<NotFound />);

    expect(screen.getByText('Error 404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /We could not find that page/i })).toBeInTheDocument();
    expect(screen.getByTestId('home-marketing-layout')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to homepage' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Browse products' })).toHaveAttribute('href', '/products');
    expect(screen.getByRole('navigation', { name: 'Popular pages' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Homepage' })).toHaveAttribute('href', '/');
  });
});
