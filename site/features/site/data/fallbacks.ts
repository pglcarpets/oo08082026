import type { BusinessStats } from "@/lib/types/businessStats";

export const BUSINESS_STATS_FETCH_TIMEOUT_MS = 1200;
export const BUSINESS_STATS_REVALIDATE_SECONDS = 300;
export const CATALOG_REVALIDATE_SECONDS = 300;

/**
 * Safe floors when CRM stats fetch fails. Marketing display strings
 * (`TRUSTED_BY_STATS`, SOLUTIONS stats, homepage glass proof) use these floors
 * with a "+" suffix — keep them honest and aligned.
 */
export const BUSINESS_STATS_SAFE_DEFAULTS: BusinessStats = {
  projectsDelivered: 120,
  clientOrganisations: 120,
  sectorsServed: 18,
  locationsServed: 20,
  yearsExperience: 14,
  asOfDate: "2026-07-14",
};
