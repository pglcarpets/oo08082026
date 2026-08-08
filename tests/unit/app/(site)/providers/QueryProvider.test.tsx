import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import QueryProvider from '@/app/(site)/providers/QueryProvider';

vi.mock('nuqs/adapters/next/app', () => ({
  NuqsAdapter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="nuqs-adapter">{children}</div>
  ),
}));

describe('QueryProvider', () => {
  it('renders QueryClientProvider wrapping children', () => {
    render(
      <QueryProvider>
        <span data-testid="inner-child">Content</span>
      </QueryProvider>
    );

    expect(screen.getByTestId('nuqs-adapter')).toBeInTheDocument();
    expect(screen.getByTestId('inner-child')).toBeInTheDocument();
  });
});
