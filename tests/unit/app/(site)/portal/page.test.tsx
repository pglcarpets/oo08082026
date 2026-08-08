import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PortalPage from '@/app/(site)/portal/page';
import { requireAuthUser } from '@/lib/auth/session';
import {
  isMissingOandoPlansTableError,
  isPlannerDatabaseConfigured,
  listPlannerDocumentsFromStore,
} from '@planner/lib/projectsStore';

vi.mock('@/lib/auth/session', () => ({
  requireAuthUser: vi.fn(),
}));

vi.mock('@planner/lib/projectsStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@planner/lib/projectsStore')>();
  return {
    ...actual,
    isPlannerDatabaseConfigured: vi.fn(),
    listPlannerDocumentsFromStore: vi.fn(),
  };
});

vi.mock('@/features/site/portal/PortalPageView', () => ({
  default: ({
    databaseConfigured,
    plans,
    userName,
    listError,
  }: {
    databaseConfigured: boolean;
    plans: unknown[];
    userName: string | null;
    listError?: string | null;
  }) => (
    <div
      data-testid="portal-page-view"
      data-db={String(databaseConfigured)}
      data-plan-count={String(plans.length)}
      data-user={userName ?? ''}
      data-list-error={listError ?? ''}
    />
  ),
}));

describe('app/(site)/portal/page.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthUser).mockResolvedValue({ id: 'user-1', name: 'Test User' } as never);
    vi.mocked(isPlannerDatabaseConfigured).mockReturnValue(false);
    vi.mocked(listPlannerDocumentsFromStore).mockResolvedValue([]);
  });

  it('renders portal view for authenticated users', async () => {
    const page = await PortalPage();
    render(page);

    expect(screen.getByTestId('portal-page-view')).toHaveAttribute('data-user', 'Test User');
    expect(screen.getByTestId('portal-page-view')).toHaveAttribute('data-db', 'false');
  });

  it('does not throw when plan list fails; surfaces listError for non-schema errors', async () => {
    vi.mocked(isPlannerDatabaseConfigured).mockReturnValue(true);
    vi.mocked(listPlannerDocumentsFromStore).mockRejectedValue(
      new Error('Database list failed: connection refused'),
    );

    const page = await PortalPage();
    render(page);

    const view = screen.getByTestId('portal-page-view');
    expect(view).toHaveAttribute('data-db', 'true');
    expect(view).toHaveAttribute('data-plan-count', '0');
    expect(view).toHaveAttribute('data-list-error', 'Database list failed: connection refused');
  });

  it('demotes to "not configured" when oando_plans is missing, without an error banner', async () => {
    // The store is supabase-backed unless DEV_AUTH_BYPASS=1, so a missing table
    // is a deployment state, not a user-facing failure: the portal shows the
    // empty/unconfigured view rather than a raw Postgres message.
    vi.mocked(isPlannerDatabaseConfigured).mockReturnValue(true);
    const missing = new Error(
      'Database list failed: relation "oando_plans" does not exist',
    );
    expect(isMissingOandoPlansTableError(missing)).toBe(true);
    vi.mocked(listPlannerDocumentsFromStore).mockRejectedValue(missing);

    const page = await PortalPage();
    render(page);

    const view = screen.getByTestId('portal-page-view');
    expect(view).toHaveAttribute('data-db', 'false');
    expect(view).toHaveAttribute('data-plan-count', '0');
    expect(view.getAttribute('data-list-error')).not.toContain('oando_plans');
  });

  it('renders empty success list when store returns []', async () => {
    vi.mocked(isPlannerDatabaseConfigured).mockReturnValue(true);
    vi.mocked(listPlannerDocumentsFromStore).mockResolvedValue([]);

    const page = await PortalPage();
    render(page);

    const view = screen.getByTestId('portal-page-view');
    expect(view).toHaveAttribute('data-db', 'true');
    expect(view).toHaveAttribute('data-plan-count', '0');
    expect(view).toHaveAttribute('data-list-error', '');
  });

  it('surfaces listError when plan list never resolves (timeout path)', async () => {
    vi.useFakeTimers();
    vi.mocked(isPlannerDatabaseConfigured).mockReturnValue(true);
    vi.mocked(listPlannerDocumentsFromStore).mockImplementation(
      () => new Promise(() => {
        /* never settles — hang simulation */
      }),
    );

    const pagePromise = PortalPage();
    await vi.advanceTimersByTimeAsync(8_000);
    const page = await pagePromise;
    render(page);

    const view = screen.getByTestId('portal-page-view');
    expect(view).toHaveAttribute('data-plan-count', '0');
    expect(view.getAttribute('data-list-error') || '').toMatch(/timed out/i);

    vi.useRealTimers();
  });
});
