import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '@/components/home/Hero';

vi.mock('next/navigation', () => ({
  usePathname: () => '/solutions',
}));

vi.mock('@/lib/analytics/siteEvents', () => ({
  trackSiteCtaClick: vi.fn(),
  handlePlannerEntryNavigation: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, ...props }: { children?: React.ReactNode; style?: React.CSSProperties }) => (
      <div style={style} {...props}>{children}</div>
    ),
    p: ({ children, ...props }: { children?: React.ReactNode }) => <p {...props}>{children}</p>,
    span: ({ children, ...props }: { children?: React.ReactNode }) => <span {...props}>{children}</span>,
  },
  useScroll: () => ({ scrollYProgress: 0 }),
  useTransform: () => 0
}));

vi.mock('@phosphor-icons/react', () => ({
  ArrowRight: () => <span data-testid="arrow-right" />
}));

describe('Hero Component', () => {
  it('renders default title and button correctly', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: /Discover office furniture/i })).toHaveAttribute(
      'href',
      '/products',
    );
    expect(screen.getByText(/Create your/)).toBeInTheDocument();
  });

  it('renders custom title and subtitle', () => {
    render(<Hero title="Custom Title" subtitle="Custom Subtitle" showButton={false} />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Subtitle')).toBeInTheDocument();
    expect(screen.queryByText('Discover office furniture')).toBeNull();
  });

  it('applies classes based on variants', () => {
    const { rerender, container } = render(<Hero variant="small" />);
    expect(container.firstChild).toHaveClass('page-hero');

    rerender(<Hero variant="cinema" />);
    expect(container.firstChild).toHaveClass('h-[85vh]');
  });

  it('applies custom section, image, and content classes', () => {
    const { container } = render(
      <Hero
        variant="small"
        backgroundImage="/hero.jpg"
        className="custom-hero-height"
        imageClassName="custom-hero-image"
        contentClassName="custom-hero-content"
      />,
    );

    expect(container.firstChild).toHaveClass('custom-hero-height');
    expect(container.querySelector('img')).toHaveClass('custom-hero-image');
    expect(container.querySelector('.section-y-hero')).toHaveClass('custom-hero-content');
  });
});
