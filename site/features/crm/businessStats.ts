import "server-only";

import { unstable_cache } from "next/cache";
import type { BusinessStats, BusinessStatsResult, StatsSource } from "@/lib/types/businessStats";
import {
  BUSINESS_STATS_FETCH_TIMEOUT_MS,
  BUSINESS_STATS_REVALIDATE_SECONDS,
  BUSINESS_STATS_SAFE_DEFAULTS,
} from "@/features/site/data/fallbacks";
import {
  canQueryCatalogDatabase,
  fetchBusinessStatsActiveLive,
  type BusinessStatsRow,
} from "@/lib/catalog/catalogDrizzle";

let lastKnownGoodStats: BusinessStats | null = null;
const loggedBusinessStatsFallbacks = new Set<string>();

interface BusinessStatsPayload {
  stats: BusinessStats;
  source: StatsSource;
}

function isExpectedStatsFallback(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("business_stats_current") ||
    normalized.includes("missing_active_business_stats") ||
    normalized.includes("products_database_url") ||
    normalized.includes("timeout>") ||
    normalized.includes("fetch failed") ||
    normalized.includes("econnrefused") ||
    normalized.includes("enotfound") ||
    normalized.includes("network")
  );
}

function resolveBusinessStatsPayload(): Promise<BusinessStatsPayload> {
  if (!canQueryCatalogDatabase()) {
    return Promise.resolve(buildFallbackPayload());
  }

  return fetchLiveBusinessStats()
    .then((stats) => {
      lastKnownGoodStats = stats;
      return { stats, source: "supabase" as const };
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      logUnexpectedBusinessStatsFallback(message);
      return buildFallbackPayload();
    });
}

function logUnexpectedBusinessStatsFallback(message: string) {
  const summarized = message.slice(0, 180);
  if (!isExpectedStatsFallback(summarized) && !loggedBusinessStatsFallbacks.has(summarized)) {
    loggedBusinessStatsFallbacks.add(summarized);
    if (process.env.NODE_ENV !== "production") {
      console.error(`[business-stats] fallback: ${summarized}`);
    }
  }
}

function buildFallbackPayload(): BusinessStatsPayload {
  if (lastKnownGoodStats) {
    return { stats: lastKnownGoodStats, source: "stale-cache" };
  }
  return { stats: BUSINESS_STATS_SAFE_DEFAULTS, source: "safe-default" };
}

function normalizeAsOfDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return BUSINESS_STATS_SAFE_DEFAULTS.asOfDate;
  }
  return parsed.toISOString().slice(0, 10);
}

function normalizeRow(row: BusinessStatsRow): BusinessStats {
  return {
    projectsDelivered: Math.max(0, Number(row.projects_delivered) || 0),
    clientOrganisations: Math.max(0, Number(row.client_organisations) || 0),
    sectorsServed: Math.max(0, Number(row.sectors_served) || 0),
    locationsServed: Math.max(0, Number(row.locations_served) || 0),
    yearsExperience: Math.max(0, Number(row.years_experience) || 0),
    asOfDate: normalizeAsOfDate(row.as_of_date),
  };
}

async function fetchLiveBusinessStats(): Promise<BusinessStats> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`timeout>${BUSINESS_STATS_FETCH_TIMEOUT_MS}ms`)),
      BUSINESS_STATS_FETCH_TIMEOUT_MS,
    );
  });

  const row = await Promise.race([fetchBusinessStatsActiveLive(), timeout]);
  if (!row) {
    throw new Error("drizzle:missing_active_business_stats");
  }

  return normalizeRow(row);
}

const getCachedLiveBusinessStats = unstable_cache(fetchLiveBusinessStats, ["business-stats-live"], {
  revalidate: BUSINESS_STATS_REVALIDATE_SECONDS,
  tags: ["business-stats"],
});
const getCachedBusinessStatsPayload = unstable_cache(
  resolveBusinessStatsPayload,
  ["business-stats-live-payload"],
  {
    revalidate: BUSINESS_STATS_REVALIDATE_SECONDS,
    tags: ["business-stats"],
  },
);

export async function getBusinessStats(options?: {
  forceLive?: boolean;
}): Promise<BusinessStatsResult> {
  const fetchedAt = new Date().toISOString();

  if (!options?.forceLive) {
    const payload = await getCachedBusinessStatsPayload();
    return { ...payload, fetchedAt };
  }

  if (!canQueryCatalogDatabase()) {
    return { ...buildFallbackPayload(), fetchedAt };
  }

  try {
    const stats = await getCachedLiveBusinessStats();
    lastKnownGoodStats = stats;
    return { stats, source: "supabase", fetchedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logUnexpectedBusinessStatsFallback(message);
    return { ...buildFallbackPayload(), fetchedAt };
  }
}
