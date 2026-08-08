/**
 * kpiIntegrity.ts
 * Centralized KPI integrity monitoring utilities.
 * Keeps API fetch and field comparisons in one place for telemetry-only checks.
 */

import {
  compareKpiField,
} from "./kpiEvents";
import type { BusinessStatsResult } from "@/lib/types/businessStats";

/**
 * Runs a canonical integrity check against the live /api/business-stats endpoint.
 * Used by KpiIntegrityMonitor and other planner-facing surfaces.
 */
export async function runKpiCanonicalIntegrityCheck(
  page: string,
  stats: {
    projectsDelivered: number;
    clientOrganisations: number;
    sectorsServed: number;
  },
  signal?: AbortSignal,
): Promise<void> {
  try {
    const response = await fetch("/api/business-stats", {
      method: "GET",
      signal,
      cache: "no-store",
    });
    if (!response.ok) {return;}

    const payload = (await response.json()) as BusinessStatsResult;
    const canonical = payload.stats;
    compareKpiField(page, "projectsDelivered", stats.projectsDelivered, canonical.projectsDelivered);
    compareKpiField(
      page,
      "clientOrganisations",
      stats.clientOrganisations,
      canonical.clientOrganisations,
    );
    compareKpiField(page, "sectorsServed", stats.sectorsServed, canonical.sectorsServed);
  } catch {
    // Telemetry-only failures should not affect the user flow.
  }
}
