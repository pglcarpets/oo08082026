import type { ComponentProps, ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Collections } from '@/components/home/Collections';
import { PartnershipBanner } from '@/components/home/PartnershipBanner';
import { TrustStrip } from '@/components/home/TrustStrip';
import {
  HOMEPAGE_COLLECTIONS_CONTENT,
  HOMEPAGE_PARTNERSHIP_CONTENT,
} from '@/features/site/data/homepage';

type MotionDomProps = {
  children?: ReactNode;
  className?: string;
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  variants?: unknown;
  transition?: unknown;
  whileInView?: unknown;
  viewport?: unknown;
};

vi.mock('embla-carousel-react', () => ({
  default: () => [
    vi.fn(),
    {
      canScrollPrev: () => false,
      canScrollNext: () => true,
      scrollPrev: vi.fn(),
      scrollNext: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    },
  ],
}));

vi.mock('embla-carousel-autoplay', () => ({
  default: () => ({ play: vi.fn(), stop: vi.fn() }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      variants: _variants,
      transition: _transition,
      whileInView: _whileInView,
      viewport: _viewport,
      ...props
    }: MotionDomProps) => <div {...props}>{children}</div>,
    button: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      variants: _variants,
      transition: _transition,
      whileInView: _whileInView,
      viewport: _viewport,
      ...props
    }: MotionDomProps & ComponentProps<'button'>) => <button {...props}>{children}</button>,
  },
}));

vi.mock('@/lib/helpers/motion', () => ({
  fadeUp: () => ({}),
  useFadeUp: () => ({}),
  useMotionSafeHover: () => ({}),
  staggerContainer: {},
  staggerItem: {},
  useStaggerMotion: () => ({
    container: {},
    item: {},
    initial: 'hidden',
    whileInView: 'visible',
  }),
}));

vi.mock('@/components/home/CollectionsSectionHeading', () => ({
  CollectionsSectionHeading: () => <div data-testid="mock-heading">Collections Heading</div>,
}));

vi.mock('@/components/home/KpiCounter', () => ({
  KpiCounter: ({ value, className }: { value: number; className?: string }) => (
    <span data-testid="mock-kpi-counter" className={className}>
      Value: {value}
    </span>
  ),
}));

vi.mock('@phosphor-icons/react', () => ({
  ArrowLeft: () => <span data-testid="arrow-left" />,
  ArrowRight: () => <span data-testid="arrow-right" />,
}));

describe('Homepage marketing surfaces', () => {
  describe('PartnershipBanner', () => {
    it('renders partnership copy and logo', () => {
      render(<PartnershipBanner />);

      const element = screen.getByTestId('home-partnership');
      expect(element).toHaveAttribute('aria-label', HOMEPAGE_PARTNERSHIP_CONTENT.image.alt);
      expect(
        element.querySelector('img.home-partnership-ribbon__logo-img'),
      ).toHaveAttribute('src', HOMEPAGE_PARTNERSHIP_CONTENT.image.src);
      expect(screen.getByText(HOMEPAGE_PARTNERSHIP_CONTENT.title[0])).toBeInTheDocument();
      expect(screen.getByText(HOMEPAGE_PARTNERSHIP_CONTENT.title[1])).toBeInTheDocument();
    });
  });

  describe('TrustStrip', () => {
    const stats = {
      yearsExperience: 10,
      projectsDelivered: 500,
      clientOrganisations: 120,
      locationsServed: 15,
      sectorsServed: 8,
      asOfDate: '2026-07-01',
    };

    it('renders KPI labels and values', () => {
      render(<TrustStrip stats={stats} />);

      const section = screen.getByTestId('home-trust');
      expect(section).toHaveAttribute('aria-label', 'Business metrics');
      expect(screen.getByTestId('kpi-years-experience')).toHaveTextContent('Value: 10');
      expect(screen.getByText('Years of experience')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-projects-delivered')).toHaveTextContent('Value: 500');
      expect(screen.getByTestId('kpi-client-organisations')).toHaveTextContent('Value: 120');
      expect(screen.getByTestId('kpi-locations-served')).toHaveTextContent('Value: 15');
    });

    it('supports embedded mode without outer section', () => {
      render(<TrustStrip stats={stats} embedded />);
      expect(screen.queryByTestId('home-trust')).toBeNull();
      expect(screen.getByTestId('kpi-years-experience')).toHaveTextContent('Value: 10');
    });
  });

  describe('Collections', () => {
    it('renders catalog CTA, collection links, and carousel controls', () => {
      render(<Collections />);

      expect(screen.getByTestId('mock-heading')).toBeInTheDocument();
      expect(screen.getByTestId('home-collections')).toBeInTheDocument();

      for (const item of HOMEPAGE_COLLECTIONS_CONTENT.items) {
        expect(screen.getByRole('link', { name: `${item.name} ${item.name}` })).toBeInTheDocument();
      }

      const firstItem = HOMEPAGE_COLLECTIONS_CONTENT.items[0];
      const firstLink = screen.getByRole('link', { name: `${firstItem.name} ${firstItem.name}` });
      expect(firstLink).toHaveAttribute('href', firstItem.href);
      expect(firstLink.querySelector('img')).toHaveAttribute('src', firstItem.image);
    });
  });
});
