import { describe, it, expect, vi } from 'vitest';
import GuestPortalPlanViewerPage from '@/app/(site)/portal/guest/view/[id]/page';
import { redirect } from 'next/navigation';
import { buildAccessRedirect } from '@/lib/auth/plannerRedirect';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/lib/auth/plannerRedirect', () => ({
  buildAccessRedirect: vi.fn(() => '/access?next=%2Fportal%2Ftest-id'),
}));

describe('GuestPortalPlanViewerPage', () => {
  it('redirects using the canonical access redirect helper', async () => {
    const params = Promise.resolve({ id: 'test-id' });
    await GuestPortalPlanViewerPage({ params });

    expect(buildAccessRedirect).toHaveBeenCalledWith('/portal/test-id');
    expect(redirect).toHaveBeenCalledWith('/access?next=%2Fportal%2Ftest-id');
  });
});
