import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/(site)/dashboard/page';
import { getOptionalUser } from '@/lib/auth/session';

vi.mock('@/lib/auth/session', () => ({
  getOptionalUser: vi.fn(),
}));

vi.mock('@/features/shared/dashboard/DashboardClient', () => ({
  DashboardClient: ({ userEmail }: { userEmail: string }) => (
    <div data-testid="dashboard-client">{userEmail}</div>
  ),
}));

describe('app/(site)/dashboard/page.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with fallback email for unauthenticated users', async () => {
    vi.mocked(getOptionalUser).mockResolvedValue(null);

    const page = await DashboardPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.getByTestId('dashboard-client')).toHaveTextContent('workspace user');
  });

  it('renders dashboard for authenticated users', async () => {
    vi.mocked(getOptionalUser).mockResolvedValue({ email: 'user@example.com' } as never);

    const page = await DashboardPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.getByTestId('dashboard-client')).toHaveTextContent('user@example.com');
  });
});
