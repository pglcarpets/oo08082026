import { describe, it, expect, vi } from 'vitest';
import '../../../../helpers/nextIntlServerEnMock';
import { render, screen } from '@testing-library/react';
import TermsPage from '@/app/(site)/terms/page';
import { expectHomeMarketingShell } from '@/tests/unit/app/(site)/_template.homepage.test';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/terms',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/shared/ContactTeaser', () => ({
  ContactTeaser: () => <div data-testid="contact-teaser" />,
}));

describe('app/(site)/terms/page.tsx', () => {
  it('renders terms sections, imprint, and commercial CTA hrefs', async () => {
    const { container } = render(await TermsPage());

    expectHomeMarketingShell(container);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Terms & Conditions' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Website, enquiry, quotation, delivery, warranty, and support terms for One&Only.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'The operating terms behind quotations, orders, delivery, and support.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'General Terms and Conditions' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '1. Scope' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '2. Quotations and acceptance' }),
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'View refund policy' })).toHaveAttribute(
      'href',
      '/refund-and-return-policy',
    );
    expect(screen.getByRole('link', { name: 'Service and support' })).toHaveAttribute(
      'href',
      '/service',
    );
    expect(screen.getByRole('link', { name: 'Ask commercial desk' })).toHaveAttribute(
      'href',
      '/contact',
    );

    const privacyLinks = screen.getAllByRole('link', { name: 'Privacy policy' });
    expect(privacyLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of privacyLinks) {
      expect(link).toHaveAttribute('href', '/privacy');
    }
    expect(screen.getByRole('link', { name: 'Contact team' })).toHaveAttribute(
      'href',
      '/contact',
    );

    const imprint = document.getElementById('imprint');
    expect(imprint).not.toBeNull();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Imprint' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Legal Information' })).toBeInTheDocument();
    expect(screen.getByText('One and Only Furniture')).toBeInTheDocument();
    expect(screen.getByText('Email: sales@oando.co.in')).toBeInTheDocument();
    expect(screen.getByTestId('contact-teaser')).toBeInTheDocument();
  });
});
