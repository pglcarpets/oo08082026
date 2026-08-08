/**
 * Name-mirror coverage for lib/types/businessStats (type export smoke).
 */
import { describe, expect, it } from "vitest";
import type {
  BusinessStats,
  BusinessStatsResult,
  StatsSource,
} from "@/lib/types/businessStats";

describe("businessStats types", () => {
  it("accepts a complete BusinessStats shape", () => {
    const stats: BusinessStats = {
      projectsDelivered: 120,
      clientOrganisations: 80,
      sectorsServed: 12,
      locationsServed: 5,
      yearsExperience: 15,
      asOfDate: "2026-01-01",
    };

    expect(stats.projectsDelivered).toBe(120);
    expect(stats.asOfDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("accepts all StatsSource discriminants on BusinessStatsResult", () => {
    const sources: StatsSource[] = ["supabase", "stale-cache", "safe-default"];
    const results: BusinessStatsResult[] = sources.map((source) => ({
      source,
      fetchedAt: "2026-07-14T00:00:00.000Z",
      stats: {
        projectsDelivered: 1,
        clientOrganisations: 1,
        sectorsServed: 1,
        locationsServed: 1,
        yearsExperience: 1,
        asOfDate: "2026-07-14",
      },
    }));

    expect(results.map((r) => r.source)).toEqual(sources);
    expect(results.every((r) => typeof r.fetchedAt === "string")).toBe(true);
  });
});
