import type { ComponentProps, ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WhatsAppCTA } from '@/components/ui/WhatsAppCTA';
import { hasConsentChoice } from '@/lib/consent';
import { routeSuppressesFloatingQuickContact } from '@/features/crm/contactSurfaces';
import { trackSiteCtaClick } from '@/lib/analytics/siteEvents';

vi.mock('@/lib/consent', () => ({
  hasConsentChoice: vi.fn(() => false),
}));

vi.mock('@/lib/analytics/siteEvents', () => ({
  trackSiteCtaClick: vi.fn(),
}));

vi.mock('@/features/site/data/contact', () => ({
  buildWhatsAppHref: vi.fn((text: string) => `https://wa.me/mock?text=${encodeURIComponent(text)}`),
  buildMailtoHref: vi.fn((subject: string) => `mailto:mock@example.com?subject=${encodeURIComponent(subject)}`),
  toTelHref: vi.fn((phone: string) => `tel:${phone}`),
  SITE_CONTACT: {
    supportPhone: '+9111111111',
  },
}));

vi.mock('@/features/crm/contactSurfaces', () => ({
  routeSuppressesFloatingQuickContact: vi.fn(() => false),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/test-path'),
}));

type MotionButtonProps = ComponentProps<'button'> & {
  children?: ReactNode;
  initial?: unknown;
  animate?: unknown;
  transition?: unknown;
};

type MotionDivProps = ComponentProps<'div'> & {
  children?: ReactNode;
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
};

vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      initial: _initial,
      animate: _animate,
      transition: _transition,
      ...rest
    }: MotionButtonProps) => <button {...rest}>{children}</button>,
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...rest
    }: MotionDivProps) => <div {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

describe('WhatsAppCTA Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when the route suppresses the CTA', () => {
    vi.mocked(routeSuppressesFloatingQuickContact).mockReturnValue(true);
    const { container } = render(<WhatsAppCTA />);
    expect(container.querySelector('button')).toBeNull();
  });

  it('renders floating action button with raised style when consent is not settled', () => {
    vi.mocked(routeSuppressesFloatingQuickContact).mockReturnValue(false);
    vi.mocked(hasConsentChoice).mockReturnValue(false);

    render(<WhatsAppCTA />);

    const fab = screen.getByRole('button', { name: 'Open WhatsApp quick contact' });
    expect(fab).toBeInTheDocument();
    expect(fab.className).toContain('site-fab-launcher--whatsapp');
    expect(fab.className).toContain('site-fab-anchor--bottom-raised');
  });

  it('renders floating action button with standard style when consent is settled', () => {
    vi.mocked(routeSuppressesFloatingQuickContact).mockReturnValue(false);
    vi.mocked(hasConsentChoice).mockReturnValue(true);

    render(<WhatsAppCTA />);

    const fab = screen.getByRole('button', { name: 'Open WhatsApp quick contact' });
    expect(fab).toBeInTheDocument();
    expect(fab.className).toContain('site-fab-launcher--whatsapp');
    expect(fab.className).toContain('site-fab-anchor--bottom');
  });

  it('opens panel, clicks a quick action (tracking check), and closes', () => {
    vi.mocked(routeSuppressesFloatingQuickContact).mockReturnValue(false);
    vi.mocked(hasConsentChoice).mockReturnValue(true);

    render(<WhatsAppCTA />);

    const fab = screen.getByRole('button', { name: 'Open WhatsApp quick contact' });

    expect(screen.queryByText('Quick contact')).not.toBeInTheDocument();

    fireEvent.click(fab);
    expect(fab).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'Quick contact' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close quick contact panel' })).toBeInTheDocument();
    expect(screen.getByText('WhatsApp now')).toBeInTheDocument();
    expect(screen.getByText('Call team')).toBeInTheDocument();
    expect(screen.getByText('Email us')).toBeInTheDocument();

    const whatsappLink = screen.getByRole('link', { name: /WhatsApp now/i });
    expect(whatsappLink).toHaveAttribute('href', 'https://wa.me/mock?text=Hi%2C%20I%20need%20help%20with%20my%20workspace%20requirement.');
    expect(whatsappLink).toHaveAttribute('target', '_blank');
    fireEvent.click(whatsappLink);

    expect(trackSiteCtaClick).toHaveBeenCalledWith({
      href: 'https://wa.me/mock?text=Hi%2C%20I%20need%20help%20with%20my%20workspace%20requirement.',
      label: 'WhatsApp now',
      pathname: '/test-path',
      surface: 'quick-contact-panel',
    });

    const footerLink = screen.getByTestId('next-link');
    expect(footerLink).toHaveAttribute('href', '/contact');
    fireEvent.click(footerLink);

    expect(trackSiteCtaClick).toHaveBeenCalledWith({
      href: '/contact',
      label: 'Open full contact page',
      pathname: '/test-path',
      surface: 'quick-contact-panel',
    });

    expect(screen.queryByText('Quick contact')).not.toBeInTheDocument();
  });

  it('handles window events for consent change', () => {
    let storedCallback: (() => void) | null = null;

    const addSpy = vi.spyOn(window, 'addEventListener').mockImplementation((event, cb) => {
      if (event === 'oando-cookie-consent') {
        storedCallback = cb as () => void;
      }
    });

    vi.mocked(routeSuppressesFloatingQuickContact).mockReturnValue(false);
    vi.mocked(hasConsentChoice).mockReturnValue(false);

    const { rerender } = render(<WhatsAppCTA />);

    const fab = screen.getByRole('button', { name: 'Open WhatsApp quick contact' });
    expect(fab.className).toContain('site-fab-anchor--bottom-raised');

    vi.mocked(hasConsentChoice).mockReturnValue(true);
    if (storedCallback) {
      act(() => storedCallback?.());
    }

    rerender(<WhatsAppCTA />);
    expect(fab.className).toContain('site-fab-anchor--bottom');

    addSpy.mockRestore();
  });
});
