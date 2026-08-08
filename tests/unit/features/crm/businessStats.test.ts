import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type * as businessStatsType0 from "@/features/crm/businessStats";
import { BUSINESS_STATS_SAFE_DEFAULTS } from '@/features/site/data/fallbacks';

vi.mock('server-only', () => ({}));

vi.mock('next/cache', () => ({
  unstable_cache: (fn: unknown) => fn,
}));

const mockCanQueryCatalogDatabase = vi.fn();
const mockFetchBusinessStatsActiveLive = vi.fn();

vi.mock('@/lib/catalog/catalogDrizzle', () => ({
  canQueryCatalogDatabase: () => mockCanQueryCatalogDatabase(),
  fetchBusinessStatsActiveLive: (...args: unknown[]) => mockFetchBusinessStatsActiveLive(...args),
}));

describe('businessStats Feature Module', () => {
  let getBusinessStats: typeof businessStatsType0.getBusinessStats;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCanQueryCatalogDatabase.mockReturnValue(true);
    ({ getBusinessStats } = await import('@/features/crm/businessStats'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns safe-defaults when catalog DB is not configured', async () => {
    mockCanQueryCatalogDatabase.mockReturnValue(false);

    const result = await getBusinessStats();

    expect(result.source).toBe('safe-default');
    expect(result.stats).toEqual(BUSINESS_STATS_SAFE_DEFAULTS);
    expect(result.fetchedAt).toBeDefined();
  });

  it('returns supabase stats when DB call is successful', async () => {
    const mockRow = {
      projects_delivered: 150,
      client_organisations: 120,
      sectors_served: 10,
      locations_served: 25,
      years_experience: 14,
      as_of_date: '2026-06-20',
    };

    mockFetchBusinessStatsActiveLive.mockResolvedValue(mockRow);

    const result = await getBusinessStats({ forceLive: true });

    expect(result.source).toBe('supabase');
    expect(result.stats).toEqual({
      projectsDelivered: 150,
      clientOrganisations: 120,
      sectorsServed: 10,
      locationsServed: 25,
      yearsExperience: 14,
      asOfDate: '2026-06-20',
    });
  });

  it('uses stale cache if a previous success was recorded and subsequent call fails', async () => {
    const mockRow = {
      projects_delivered: 200,
      client_organisations: 180,
      sectors_served: 12,
      locations_served: 30,
      years_experience: 15,
      as_of_date: '2026-06-25',
    };

    mockFetchBusinessStatsActiveLive.mockResolvedValueOnce(mockRow);
    const successResult = await getBusinessStats({ forceLive: true });
    expect(successResult.source).toBe('supabase');

    mockFetchBusinessStatsActiveLive.mockRejectedValueOnce(new Error('Database down'));
    const fallbackResult = await getBusinessStats({ forceLive: true });

    expect(fallbackResult.source).toBe('stale-cache');
    expect(fallbackResult.stats.projectsDelivered).toBe(200);
  });

  it('returns safe-defaults on DB query error and no stale cache exists', async () => {
    mockFetchBusinessStatsActiveLive.mockRejectedValue(new Error('Some DB Error'));

    const result = await getBusinessStats({ forceLive: true });
    expect(result.source).toBe('safe-default');
    expect(result.stats).toEqual(BUSINESS_STATS_SAFE_DEFAULTS);
  });

  it('returns safe-defaults on DB query timeout', async () => {
    mockFetchBusinessStatsActiveLive.mockReturnValue(new Promise(() => {}));

    const resultPromise = getBusinessStats({ forceLive: true });
    await vi.advanceTimersByTimeAsync(5000);

    const result = await resultPromise;
    expect(result.source).toBe('safe-default');
    expect(result.stats).toEqual(BUSINESS_STATS_SAFE_DEFAULTS);
  });
});
