import React from 'react';
import type * as ReactAriaComponents from 'react-aria-components';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MobileNavDrawer } from '@/components/site/MobileNavDrawer';

// Mock phosphor icons
vi.mock('@phosphor-icons/react', () => ({
  CaretDown: () => <span data-testid="caret-icon" />,
  MagnifyingGlass: () => <span data-testid="magnifier-icon" />,
  Sparkle: () => <span data-testid="sparkle-icon" />,
  X: () => <span data-testid="close-icon" />,
}));

// Mock Logo
vi.mock('@/components/ui/Logo', () => ({
  OneAndOnlyLogo: () => <div data-testid="drawer-logo" />,
}));

// Mock react-aria Modal (render children when open)
vi.mock('react-aria-components', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactAriaComponents>();
  return {
    ...actual,
    ModalOverlay: ({ children, isOpen, className }: { children: React.ReactNode; isOpen?: boolean; className?: string }) =>
      isOpen ? <div data-testid="drawer-overlay" className={className}>{children}</div> : null,
    Modal: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div data-testid="drawer-root" data-open="true" className={className}>{children}</div>
    ),
    Dialog: ({ children, className, ...props }: React.ComponentProps<'section'>) => (
      <section role="dialog" data-testid="drawer-content" className={className} {...props}>{children}</section>
    ),
  };
});

// Mock site data & analytics
vi.mock('@/features/site/data/navigation', () => ({
  SITE_NAV_LINKS: [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products', hasMega: true },
  ],
  SITE_CTA_LINKS: [
    { label: 'Quote Cart', href: '/quote-cart', variant: 'primary' },
  ],
  SITE_AUTH_LINK: { label: 'Sign in', href: '/access' },
}));

vi.mock('@/lib/analytics/siteEvents', () => ({
  trackSiteSearchSubmitted: vi.fn(),
  trackSiteCtaClick: vi.fn(),
  handlePlannerEntryNavigation: vi.fn(),
  trackPlannerLaunchClicked: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('MobileNavDrawer Component', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  const closeButtonRef = React.createRef<HTMLButtonElement>();

  beforeEach(() => {
    vi.clearAllMocks();

    mockFetch = vi.fn((url: string) => {
      if (url.includes('/api/nav-search/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: [{ id: 'r1', title: 'Task Office Chair', href: '/products/chairs/task', type: 'product', source: 'local' }],
          }),
        });
      }
      return Promise.reject(new Error('Unknown Endpoint'));
    });
    global.fetch = mockFetch as typeof fetch;
  });

  const categories = [
    {
      groupId: 'seating',
      groupLabel: 'Seating',
      items: [
        {
          id: 'chairs',
          name: 'Chairs',
          href: '/products/chairs',
          subcategories: [
            { id: 'task-chairs', name: 'Task Chairs', href: '/products/chairs/task' },
          ],
        },
      ],
    },
  ];

  it('does not render the drawer when open is false', async () => {
    render(
      <MobileNavDrawer
        open={false}
        onClose={vi.fn()}
        closeButtonRef={closeButtonRef}
        groupedCategories={categories}
      />
    );
    await act(async () => {});
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('drawer-root')).not.toBeInTheDocument();
  });

  it('renders drawer layout, logo, and nav links when open is true', async () => {
    render(
      <MobileNavDrawer
        open={true}
        onClose={vi.fn()}
        closeButtonRef={closeButtonRef}
        groupedCategories={categories}
      />
    );
    await act(async () => {});

    expect(screen.getByTestId('drawer-logo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quote Cart' })).toHaveAttribute('href', '/quote-cart');
  });

  it('locks body overflow on mount and restores on unmount/close', () => {
    const { unmount } = render(
      <MobileNavDrawer
        open={true}
        onClose={vi.fn()}
        closeButtonRef={closeButtonRef}
        groupedCategories={categories}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('toggles product categories accordion on click', async () => {
    render(
      <MobileNavDrawer
        open={true}
        onClose={vi.fn()}
        closeButtonRef={closeButtonRef}
        groupedCategories={categories}
      />
    );
    await act(async () => {});

    const accordionBtn = screen.getByRole('button', { name: 'Products' });
    expect(screen.queryByText('Seating')).toBeNull();

    // Click to open
    fireEvent.click(accordionBtn);
    expect(screen.getByText('Seating')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Task Chairs' })).toHaveAttribute('href', '/products/chairs/task');

    // Click to close
    fireEvent.click(accordionBtn);
    expect(screen.queryByText('Seating')).toBeNull();
  });

  it('performs debounced search and resolves queries', async () => {
    const onCloseMock = vi.fn();
    render(
      <MobileNavDrawer
        open={true}
        onClose={onCloseMock}
        closeButtonRef={closeButtonRef}
        groupedCategories={categories}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'Task' } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/nav-search/', expect.any(Object));
    });

    await waitFor(() => {
      expect(screen.getByText('Task Office Chair')).toBeInTheDocument();
    });

    // Click search result triggers navigation and closes drawer
    fireEvent.click(screen.getByText('Task Office Chair'));
    expect(onCloseMock).toHaveBeenCalled();
    await act(async () => {});
  });

  it('escapes / closes on Escape keydown', async () => {
    const onCloseMock = vi.fn();
    render(
      <MobileNavDrawer
        open={true}
        onClose={onCloseMock}
        closeButtonRef={closeButtonRef}
        groupedCategories={categories}
      />
    );
    await act(async () => {});

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('uses 44px close control and live search status region', async () => {
    render(
      <MobileNavDrawer
        open={true}
        onClose={vi.fn()}
        closeButtonRef={closeButtonRef}
        groupedCategories={categories}
      />
    );
    await act(async () => {});

    const closeBtn = screen.getByRole('button', { name: 'Close navigation' });
    expect(closeBtn.className).toMatch(/h-11/);
    expect(closeBtn.className).toMatch(/w-11/);
    expect(closeBtn.className).toMatch(/min-h-11/);
    expect(closeBtn.className).toMatch(/min-w-11/);
    expect(screen.getByRole('search', { name: 'Mobile product search' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Search products/i);
  });

  it('uses 44px primary nav targets and contains overflow in drawer shell', async () => {
    render(
      <MobileNavDrawer
        open={true}
        onClose={vi.fn()}
        closeButtonRef={closeButtonRef}
        groupedCategories={categories}
      />
    );
    await act(async () => {});

    const content = document.getElementById('mobile-nav-drawer');
    expect(content).not.toBeNull();
    expect(content!.className).toMatch(/overflow-hidden/);
    expect(content!.className).toMatch(/overscroll-contain/);
    expect(content!.className).toMatch(/max-w-\[100vw\]/);
    expect(screen.getByRole('dialog', { name: 'Mobile navigation' })).toBeInTheDocument();

    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink.className).toMatch(/min-h-11/);

    const productsBtn = screen.getByRole('button', { name: 'Products' });
    expect(productsBtn.className).toMatch(/min-h-11/);

    const quoteCta = screen.getByRole('link', { name: 'Quote Cart' });
    expect(quoteCta.className).toMatch(/min-h-11/);

    const callLink = screen.getByRole('link', { name: /Call \+91/i });
    expect(callLink.className).toMatch(/min-h-11/);

    const nav = screen.getByRole('navigation', { name: 'Mobile primary navigation' });
    expect(nav.className).toMatch(/overflow-x-hidden/);
    expect(nav.className).toMatch(/overflow-y-auto/);
  });

  it('keeps search results at 44px and truncates long titles', async () => {
    render(
      <MobileNavDrawer
        open={true}
        onClose={vi.fn()}
        closeButtonRef={closeButtonRef}
        groupedCategories={categories}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'Task' } });

    await waitFor(() => {
      expect(screen.getByText('Task Office Chair')).toBeInTheDocument();
    });

    const resultLink = screen.getByRole('link', { name: /Task Office Chair/i });
    expect(resultLink.className).toMatch(/min-h-11/);
    expect(resultLink.querySelector('.truncate')).not.toBeNull();
  });

  it('closes from the dedicated close control', async () => {
    const onCloseMock = vi.fn();
    render(
      <MobileNavDrawer
        open={true}
        onClose={onCloseMock}
        closeButtonRef={closeButtonRef}
        groupedCategories={categories}
      />
    );
    await act(async () => {});

    fireEvent.click(screen.getByRole('button', { name: 'Close navigation' }));
    expect(onCloseMock).toHaveBeenCalled();
  });
});
