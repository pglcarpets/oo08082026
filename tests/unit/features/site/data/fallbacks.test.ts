/**
 * Name-mirror: features/site/data/fallbacks
 */

import { describe, expect, it } from "vitest";
import {
  BUSINESS_STATS_FETCH_TIMEOUT_MS,
  BUSINESS_STATS_REVALIDATE_SECONDS,
  BUSINESS_STATS_SAFE_DEFAULTS,
  CATALOG_REVALIDATE_SECONDS,
} from "@/features/site/data/fallbacks";

describe("business stats fallbacks", () => {
  it("exports safe defaults with positive counts and a dated snapshot", () => {
    expect(BUSINESS_STATS_SAFE_DEFAULTS.clientOrganisations).toBeGreaterThan(0);
    expect(BUSINESS_STATS_SAFE_DEFAULTS.projectsDelivered).toBeGreaterThan(0);
    expect(BUSINESS_STATS_SAFE_DEFAULTS.sectorsServed).toBeGreaterThan(0);
    expect(BUSINESS_STATS_SAFE_DEFAULTS.locationsServed).toBeGreaterThan(0);
    expect(BUSINESS_STATS_SAFE_DEFAULTS.yearsExperience).toBeGreaterThan(0);
    expect(BUSINESS_STATS_SAFE_DEFAULTS.asOfDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("exports revalidate and timeout constants used by fetch paths", () => {
    expect(BUSINESS_STATS_FETCH_TIMEOUT_MS).toBe(1200);
    expect(BUSINESS_STATS_REVALIDATE_SECONDS).toBe(300);
    expect(CATALOG_REVALIDATE_SECONDS).toBe(300);
  });
});
