import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import DashboardPage from '@/app/(site)/dashboard/page';
import { getOptionalUser } from '@/lib/auth/session';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

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

  it('redirects unauthenticated users to access', async () => {
    vi.mocked(getOptionalUser).mockResolvedValue(null);

    await expect(DashboardPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/access?next=%2Fdashboard');
    // buildAccessRedirect encodes the same path
  });

  it('renders dashboard for authenticated users', async () => {
    vi.mocked(getOptionalUser).mockResolvedValue({ email: 'user@example.com' } as never);

    const page = await DashboardPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.getByTestId('dashboard-client')).toHaveTextContent('user@example.com');
  });
});
