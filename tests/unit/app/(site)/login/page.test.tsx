import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from 'next/navigation';
import LoginPage from '@/app/(site)/login/page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('app/(site)/login/page.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to access with the sanitized next path', async () => {
    await LoginPage({ searchParams: Promise.resolve({ next: '/dashboard' }) });

    expect(redirect).toHaveBeenCalledWith('/access?next=%2Fdashboard');
  });
});
