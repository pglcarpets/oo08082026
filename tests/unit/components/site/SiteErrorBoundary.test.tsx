import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SiteErrorBoundary } from '@/components/site/SiteErrorBoundary';
import { logClientError } from '@/lib/errorLogger';

vi.mock('@/lib/errorLogger', () => ({
  logClientError: vi.fn(),
}));

const ProblemChild = () => {
  throw new Error('Test render crash');
};

describe('SiteErrorBoundary Component', () => {
  const originalReload = window.location.reload;
  const originalHref = window.location.href;
  const mockReload = vi.fn();
  let mockHrefVal = '/';

  beforeEach(() => {
    vi.clearAllMocks();
    // Prevent happy-dom print-outs of errors we deliberately trigger
    vi.spyOn(console, 'error').mockImplementation(() => {});

    Object.defineProperty(window, 'location', {
      value: {
        reload: mockReload,
        get href() {
          return mockHrefVal;
        },
        set href(val: string) {
          mockHrefVal = val;
        },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: {
        reload: originalReload,
        value: originalHref,
      },
      writable: true,
      configurable: true,
    });
  });

  it('renders children normally when no error occurs', () => {
    render(
      <SiteErrorBoundary>
        <div data-testid="healthy-child">All good</div>
      </SiteErrorBoundary>
    );

    expect(screen.getByTestId('healthy-child')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('logs error and renders fallback screen on component crash', () => {
    render(
      <SiteErrorBoundary>
        <ProblemChild />
      </SiteErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test render crash')).toBeInTheDocument();

    expect(logClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
        label: 'site-layout-global',
      })
    );
  });

  it('triggers page reload on click Reload Page', () => {
    render(
      <SiteErrorBoundary>
        <ProblemChild />
      </SiteErrorBoundary>
    );

    const reloadBtn = screen.getByRole('button', { name: /Reload Page/i });
    fireEvent.click(reloadBtn);

    expect(mockReload).toHaveBeenCalled();
  });

  it('navigates to homepage on click Go to Homepage', () => {
    render(
      <SiteErrorBoundary>
        <ProblemChild />
      </SiteErrorBoundary>
    );

    const homeBtn = screen.getByRole('button', { name: /Go to Homepage/i });
    fireEvent.click(homeBtn);

    expect(mockHrefVal).toBe('/');
  });
});
