import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShowcaseCarousel } from '@/components/home/ShowcaseCarousel';

const mockEmblaApi = {
  on: vi.fn(),
  off: vi.fn(),
  selectedScrollSnap: vi.fn().mockReturnValue(0),
  canScrollPrev: vi.fn().mockReturnValue(false),
  canScrollNext: vi.fn().mockReturnValue(true),
  scrollPrev: vi.fn(),
  scrollNext: vi.fn(),
  scrollTo: vi.fn()
};

vi.mock('embla-carousel-react', () => ({
  default: () => [vi.fn(), mockEmblaApi]
}));

vi.mock('@gsap/react', () => ({
  useGSAP: () => {},
}));

vi.mock('gsap', () => ({
  default: {
    context: (fn: () => void) => {
      fn();
      return { revert: () => {} };
    },
    from: () => {},
    registerPlugin: () => {},
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

vi.mock('@/lib/helpers/gsapMotion', () => ({
  registerGsapPlugins: () => {},
  gsapReducedMotion: () => true,
  GSAP_EASE_OUT: 'power3.out',
  GSAP_SCROLL_REVEAL: { y: 32, opacity: 0, duration: 0.75, stagger: 0.09 },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <button {...props}>{children}</button>
  }
}));

vi.mock('@/lib/helpers/motion', () => ({
  fadeUp: () => ({}),
  useMotionSafeHover: () => ({})
}));

vi.mock('@/components/home/PartnershipBanner', () => ({
  PartnershipPanel: () => <div data-testid="mock-partnership-panel" />
}));

vi.mock('@phosphor-icons/react', () => ({
  ChevronLeft: () => <span data-testid="left-icon" />,
  ChevronRight: () => <span data-testid="right-icon" />,
  CaretLeft: () => <span data-testid="left-icon" />,
  CaretRight: () => <span data-testid="right-icon" />,
}));

describe('ShowcaseCarousel Component', () => {
  const items = [
    { id: '1', name: 'Fluid Pro', label: 'Pro', image: '/img1.jpg', link: '/p1' },
    { id: '2', name: 'Desk Elite', label: 'Elite', image: '/img2.jpg', link: '/p2' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockEmblaApi.canScrollPrev.mockReturnValue(false);
    mockEmblaApi.canScrollNext.mockReturnValue(true);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders section title, items, and next/prev buttons', () => {
    render(
      <ShowcaseCarousel
        sectionLabel="Workspace design"
        sectionAriaLabel="Office showcase"
        sectionTitle="Modern Workspaces"
        items={items}
        browseLink="/all-projects"
      />
    );

    expect(screen.getByText('Workspace design')).toBeInTheDocument();
    expect(screen.getByText('Modern Workspaces')).toBeInTheDocument();
    expect(screen.getByText('Fluid Pro')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Office showcase slides' })).toHaveAttribute(
      'aria-roledescription',
      'carousel',
    );
    expect(screen.getByRole('link', { name: 'Fluid Pro' }).querySelector('img')).toHaveAttribute(
      'alt',
      'Fluid Pro',
    );

    const prevBtn = screen.getByRole('button', { name: 'Previous project' });
    const nextBtn = screen.getByRole('button', { name: 'Next project' });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);
    expect(mockEmblaApi.scrollNext).toHaveBeenCalled();
  });

  it('renders partnership panel when showPartnership is true', () => {
    render(
      <ShowcaseCarousel
        sectionLabel="Workspace design"
        sectionAriaLabel="Office showcase"
        sectionTitle="Modern Workspaces"
        items={items}
        showPartnership={true}
      />
    );
    expect(screen.getByTestId('mock-partnership-panel')).toBeInTheDocument();
  });

  it('handles mobile dots selection', () => {
    render(
      <ShowcaseCarousel
        sectionLabel="Workspace design"
        sectionAriaLabel="Office showcase"
        sectionTitle="Modern Workspaces"
        items={items}
      />
    );

    // Live carousel uses prev/next buttons (no keyboard handler on the viewport).
    const nextBtn = screen.getByRole('button', { name: 'Next project' });
    fireEvent.click(nextBtn);
    expect(mockEmblaApi.scrollNext).toHaveBeenCalled();

    const dotBtn = screen.getByRole('button', { name: 'Go to slide 2' });
    fireEvent.click(dotBtn);
    expect(mockEmblaApi.scrollTo).toHaveBeenCalledWith(1);
  });
});
