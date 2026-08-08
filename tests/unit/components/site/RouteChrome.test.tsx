import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouteChrome } from '@/components/site/RouteChrome';

// Mock components
vi.mock('@/components/site/Header', () => ({
  SiteHeader: () => <div data-testid="site-header">Header</div>,
}));

vi.mock('@/components/site/Footer', () => ({
  SiteFooter: () => <div data-testid="site-footer">Footer</div>,
}));

vi.mock('@/components/site/FooterLogoMarquee', () => ({
  FooterLogoMarquee: () => <div data-testid="logo-marquee">Marquee</div>,
}));

vi.mock('@/components/site/CookieConsentBar', () => ({
  CookieConsentBar: () => <div data-testid="cookie-consent-bar">Cookie Bar</div>,
}));

vi.mock('@/features/site/assistant/DynamicBotWrapper', () => ({
  default: () => <div data-testid="dynamic-bot-wrapper">Bot Wrapper</div>,
}));

vi.mock('@/components/ui/WhatsAppCTA', () => ({
  WhatsAppCTA: () => <div data-testid="whatsapp-cta">WhatsApp CTA</div>,
}));

let mockPathname = '/';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

describe('RouteChrome Component', () => {
  beforeEach(() => {
    mockPathname = '/';
  });

  describe('position="top"', () => {
    it('renders SiteHeader on normal marketing routes', () => {
      mockPathname = '/products';
      render(<RouteChrome position="top" />);

      expect(screen.getByTestId('site-header')).toBeInTheDocument();
    });

    it('returns null on CAD routes', () => {
      mockPathname = '/ooplanner';
      const { container } = render(<RouteChrome position="top" />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null on Workspace routes', () => {
      mockPathname = '/admin';
      const { container } = render(<RouteChrome position="top" />);
      expect(container.firstChild).toBeNull();
    });

    it('renders SiteHeader on guest chooser (pre-planner step)', () => {
      mockPathname = '/choose-product';
      render(<RouteChrome position="top" />);
      expect(screen.getByTestId('site-header')).toBeInTheDocument();
    });
  });

  describe('position="bottom"', () => {
    it('renders bottom elements on normal marketing routes', () => {
      mockPathname = '/products';
      render(<RouteChrome position="bottom" />);

      expect(screen.getByTestId('logo-marquee')).toBeInTheDocument();
      expect(screen.getByTestId('site-footer')).toBeInTheDocument();
      expect(screen.getByTestId('cookie-consent-bar')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-bot-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('whatsapp-cta')).toBeInTheDocument();
    });

    it('renders only bot wrapper and whatsapp CTA on login routes', () => {
      mockPathname = '/login';
      render(<RouteChrome position="bottom" />);

      expect(screen.queryByTestId('logo-marquee')).toBeNull();
      expect(screen.queryByTestId('site-footer')).toBeNull();
      expect(screen.queryByTestId('cookie-consent-bar')).toBeNull();
      
      expect(screen.getByTestId('dynamic-bot-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('whatsapp-cta')).toBeInTheDocument();
    });

    it('returns null on CAD/Workspace routes', () => {
      mockPathname = '/ooplanner';
      const { container } = render(<RouteChrome position="bottom" />);
      expect(container.firstChild).toBeNull();
    });

    it('renders footer on guest chooser (pre-planner step)', () => {
      mockPathname = '/choose-product';
      render(<RouteChrome position="bottom" />);
      expect(screen.getByTestId('site-footer')).toBeInTheDocument();
      expect(screen.getByTestId('logo-marquee')).toBeInTheDocument();
    });
  });
});
