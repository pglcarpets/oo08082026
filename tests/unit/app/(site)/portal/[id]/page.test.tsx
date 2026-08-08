import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PortalPlanViewerPage from '@/app/(site)/portal/[id]/page';
import { requireAuthUser } from '@/lib/auth/session';
import { loadPlannerDocumentFromStore } from '@planner/lib/projectsStore';

vi.mock('@/lib/auth/session', () => ({
  requireAuthUser: vi.fn(),
}));

vi.mock('@planner/lib/projectsStore', () => ({
  loadPlannerDocumentFromStore: vi.fn(),
}));

vi.mock('@/features/site/portal/PortalPlanPageView', () => ({
  default: ({ document }: { document: { id: string } | null }) => (
    <div data-testid="portal-plan-page-view" data-doc-id={document?.id ?? 'none'} />
  ),
}));

describe('app/(site)/portal/[id]/page.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthUser).mockResolvedValue({ id: 'user-1' } as never);
    vi.mocked(loadPlannerDocumentFromStore).mockResolvedValue({ id: 'plan-1' } as never);
  });

  it('renders plan viewer with loaded document', async () => {
    const page = await PortalPlanViewerPage({ params: Promise.resolve({ id: 'plan-1' }) });
    render(page);

    expect(loadPlannerDocumentFromStore).toHaveBeenCalledWith('plan-1', 'user-1');
    expect(screen.getByTestId('portal-plan-page-view')).toHaveAttribute('data-doc-id', 'plan-1');
  });
});
