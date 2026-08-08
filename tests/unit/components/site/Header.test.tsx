import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SiteHeader, __resetNavCategoriesLoadForTests } from '@/components/site/Header';
import { trackSiteSearchSubmitted } from '@/lib/analytics/siteEvents';

// Mock phosphor icons
vi.mock('@phosphor-icons/react', () => ({
  CaretDown: () => <span data-testid="caret-icon" />,
  List: () => <span data-testid="hamburger-icon" />,
  MagnifyingGlass: () => <span data-testid="magnifier-icon" />,
  Sparkle: () => <span data-testid="sparkle-icon" />,
  X: () => <span data-testid="menu-close-icon" />,
}));

// Mock Logo
vi.mock('@/components/ui/Logo', () => ({
  OneAndOnlyLogo: () => <div data-testid="header-logo" />,
}));

// Mock MobileNavDrawer
vi.mock('@/components/site/MobileNavDrawer', () => ({
  MobileNavDrawer: ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    <div data-testid="mobile-drawer" data-open={open}>
      <button onClick={onClose} data-testid="close-drawer">Close</button>
    </div>
  ),
}));

// Mock Navigation data
vi.mock('@/lib/navigation', () => ({
  NAV_CATEGORY_GROUP_ORDER: ['seating'],
  NAV_CATEGORY_GROUPS: {
    seating: { label: 'Seating Group', ids: ['chairs'] },
  },
  groupCategories: vi.fn((cats) => cats),
}));

vi.mock('@/features/site/data/navigation', () => ({
  SITE_HEADER_PRIMARY_LINKS: [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products', hasMega: true },
  ],
  SITE_HEADER_MORE_LINKS: [
    { label: 'Portal', href: '/portal', headerSlot: 'more' as const },
    { label: 'Login', href: '/login', headerSlot: 'more' as const },
  ],
  SITE_NAV_LINKS: [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products', hasMega: true },
    { label: 'Portal', href: '/portal', headerSlot: 'more' as const },
    { label: 'Login', href: '/login', headerSlot: 'more' as const },
  ],
  SITE_AUTH_LINK: { label: 'Sign in', href: '/access' },
  SITE_CTA_LINKS: [
    { label: 'Quote Cart', href: '/quote-cart', variant: 'primary' },
  ],
}));

vi.mock('@/lib/analytics/siteEvents', () => ({
  trackPlannerLaunchClicked: vi.fn(),
  trackSiteSearchSubmitted: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/products',
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('SiteHeader Component', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  async function renderSettledHeader() {
    const result = render(<SiteHeader />);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/nav-categories/');
    });
    await act(async () => {});
    return result;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    __resetNavCategoriesLoadForTests();

    mockFetch = vi.fn((url: string, _options?: RequestInit) => {
      if (url.includes('/api/nav-categories/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            groups: [
              {
                groupId: 'seating',
                groupLabel: 'Seating Group',
                items: [
                  {
                    id: 'chairs',
                    name: 'Chairs',
                    href: '/products/chairs',
                    subcategories: [
                      { id: 'task-chairs', name: 'Task chairs', href: '/products/chairs/task' },
                      { id: 'cafe-chairs', name: 'Cafe chairs', href: '/products/chairs/cafe' }, // filtered to Others
                    ],
                  },
                ],
              },
            ],
          }),
        });
      }
      if (url.includes('/api/nav-search/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: [
              { id: 'r1', title: 'Task Chair Premium', href: '/products/chairs/task', type: 'product', source: 'local' },
            ],
            rankingMode: 'local',
          }),
        });
      }
      return Promise.reject(new Error('Unknown Endpoint'));
    });

    global.fetch = mockFetch as typeof fetch;
  });

  it('renders logo, nav links and fetch categories on mount', async () => {
    await renderSettledHeader();

    expect(screen.getByTestId('header-logo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');

    // Verify categories fetched
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/nav-categories/');
    });
  });

  it('opens and closes products mega menu on mouse enter/leave', async () => {
    await renderSettledHeader();

    // Wait for categories to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/nav-categories/');
    });

    const megaTrigger = screen.getByRole('button', { name: /Products/i });

    // Hover to open
    fireEvent.mouseEnter(megaTrigger);
    expect(screen.getByText('Seating Group')).toBeInTheDocument();
    expect(screen.getByText('Task chairs')).toBeInTheDocument();

    // Leave trigger should schedule close
    fireEvent.mouseLeave(megaTrigger);
    await waitFor(() => {
      expect(screen.queryByText('Seating Group')).toBeNull();
    });
  });

  it('performs debounced search and displays results panel', async () => {
    await renderSettledHeader();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/nav-categories/');
    });

    vi.useFakeTimers({ shouldAdvanceTime: true });

    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.focus(searchInput);
    
    // Default quick links list
    expect(screen.getByRole('link', { name: 'All Products' })).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Task' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/nav-search/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ query: 'Task', limit: 8, context: 'header' }),
        })
      );
    });

    // Check result renders
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Task Chair Premium/i })).toBeInTheDocument();
    });

    // Click result hides panel
    fireEvent.click(screen.getByRole('link', { name: /Task Chair Premium/i }));
    expect(screen.queryByRole('link', { name: /Task Chair Premium/i })).toBeNull();

    await act(async () => {});
    vi.useRealTimers();
  });

  it('submits search form and redirects using resolved destination', async () => {
    await renderSettledHeader();

    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'Premium' } });

    // Submit form
    const searchForm = screen.getByPlaceholderText('Search products...').closest('form')!;
    fireEvent.submit(searchForm);

    await waitFor(() => {
      expect(trackSiteSearchSubmitted).toHaveBeenCalledWith({
        pathname: '/products',
        surface: 'header',
        queryLength: 7,
        destination: '/products/chairs/task', // resolved from result
      });
      expect(mockPush).toHaveBeenCalledWith('/products/chairs/task');
    }, { timeout: 2000 });
  });

  it('exposes language dropdown and no Guided Planner in header', async () => {
    await renderSettledHeader();

    expect(screen.getByLabelText('Select Language')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Guided Planner/i })).toBeNull();
  });

  it('announces search status for assistive tech (quote cart not in header)', async () => {
    await renderSettledHeader();

    expect(screen.queryByRole('link', { name: 'View Quote Cart' })).toBeNull();
    expect(screen.getByRole('search', { name: 'Site product search' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Search products/i);
  });

  it('collapses secondary destinations under More flyout', async () => {
    await renderSettledHeader();

    expect(screen.queryByRole('menuitem', { name: 'Portal' })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: 'Login' })).toBeNull();

    const moreBtn = screen.getByRole('button', { name: /More/i });
    fireEvent.mouseEnter(moreBtn);

    expect(screen.getByRole('menuitem', { name: 'Portal' })).toHaveAttribute('href', '/portal');
    expect(screen.getByRole('menuitem', { name: 'Login' })).toHaveAttribute('href', '/login');
  });

  it('triggers mobile nav drawer on hamburger click', async () => {
    await renderSettledHeader();

    const burgerBtn = screen.getByRole('button', { name: /Open menu/i });
    expect(burgerBtn.className).toMatch(/min-h-11/);
    expect(burgerBtn.className).toMatch(/min-w-11/);
    expect(burgerBtn).toHaveAttribute('aria-expanded', 'false');
    expect(burgerBtn).toHaveAttribute('aria-controls', 'mobile-nav-drawer');
    expect(screen.getByTestId('hamburger-icon')).toBeInTheDocument();

    fireEvent.click(burgerBtn);

    const drawer = screen.getByTestId('mobile-drawer');
    expect(drawer).toHaveAttribute('data-open', 'true');
    expect(burgerBtn).toHaveAttribute('aria-expanded', 'true');
    expect(burgerBtn).toHaveAccessibleName('Close menu');
    expect(screen.getByTestId('menu-close-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('hamburger-icon')).toBeNull();

    // Close via close button in drawer
    const closeBtn = screen.getByTestId('close-drawer');
    fireEvent.click(closeBtn);
    expect(drawer).toHaveAttribute('data-open', 'false');
    expect(burgerBtn).toHaveAttribute('aria-expanded', 'false');
    expect(burgerBtn).toHaveAccessibleName('Open menu');
    expect(screen.getByTestId('hamburger-icon')).toBeInTheDocument();
  });

  it('keeps mobile header actions from overflowing the bar', async () => {
    await renderSettledHeader();

    const banner = screen.getByRole('banner');
    // home-shell-xl: same max + gutters as marketing body/footer (not shell-container-wide).
    const shell = banner.querySelector('.home-shell-xl');
    expect(shell?.className).toMatch(/min-w-0/);

    const burgerBtn = screen.getByRole('button', { name: /Open menu/i });
    expect(burgerBtn.className).toMatch(/shrink-0/);
    expect(burgerBtn.className).toMatch(/h-11/);
    expect(burgerBtn.className).toMatch(/w-11/);

    const locale = screen.getByLabelText('Select Language');
    expect(locale.className).toMatch(/min-h-11/);
  });

  it('adds shadow style class on page scroll', async () => {
    await renderSettledHeader();

    // Initially window.scrollY is 0
    expect(screen.getByRole('banner')).not.toHaveClass('[box-shadow:var(--shadow-panel)]');

    // Mock scrolling
    window.scrollY = 20;
    fireEvent.scroll(window);

    expect(screen.getByRole('banner')).toHaveClass('[box-shadow:var(--shadow-panel)]');
  });
});
