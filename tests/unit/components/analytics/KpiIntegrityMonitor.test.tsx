import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { KpiIntegrityMonitor } from '@/components/analytics/KpiIntegrityMonitor';
import { trackKpiFallbackUsed, trackKpiRendered } from '@/lib/analytics/kpiEvents';
import { runKpiCanonicalIntegrityCheck } from '@/lib/analytics/kpiIntegrity';
import type { BusinessStats } from '@/lib/types/businessStats';

vi.mock('@/lib/analytics/kpiEvents', () => ({
  trackKpiFallbackUsed: vi.fn(),
  trackKpiRendered: vi.fn(),
}));

vi.mock('@/lib/analytics/kpiIntegrity', () => ({
  runKpiCanonicalIntegrityCheck: vi.fn(),
}));

describe('KpiIntegrityMonitor Component', () => {
  const stats: BusinessStats = {
    asOfDate: '2026-06-26',
    yearsExperience: 10,
    projectsDelivered: 500,
    clientOrganisations: 120,
    locationsServed: 12,
    sectorsServed: 8,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing and tracks KPI rendering', () => {
    const { container } = render(
      <KpiIntegrityMonitor page="home" source="supabase" stats={stats} />,
    );
    expect(container.firstChild).toBeNull();
    expect(trackKpiRendered).toHaveBeenCalledWith({ asOfDate: '2026-06-26', source: 'supabase' });
    expect(trackKpiFallbackUsed).not.toHaveBeenCalled();
  });

  it('tracks KPI fallback used if source is not supabase', () => {
    render(<KpiIntegrityMonitor page="home" source="safe-default" stats={stats} />);
    expect(trackKpiFallbackUsed).toHaveBeenCalledWith({ source: 'safe-default' });
  });

  it('runs integrity check after a 400ms delay', () => {
    render(<KpiIntegrityMonitor page="home" source="supabase" stats={stats} />);

    expect(runKpiCanonicalIntegrityCheck).not.toHaveBeenCalled();

    vi.advanceTimersByTime(400);

    expect(runKpiCanonicalIntegrityCheck).toHaveBeenCalledWith(
      'home',
      stats,
      expect.any(AbortSignal),
    );
  });

  it('cleans up timeout and aborts signal on unmount', () => {
    const { unmount } = render(
      <KpiIntegrityMonitor page="home" source="supabase" stats={stats} />,
    );

    unmount();

    vi.advanceTimersByTime(400);
    expect(runKpiCanonicalIntegrityCheck).not.toHaveBeenCalled();
  });
});
