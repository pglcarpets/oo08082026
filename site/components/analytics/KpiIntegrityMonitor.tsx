"use client";

import { useEffect } from "react";
import type { BusinessStats, StatsSource } from "@/lib/types/businessStats";
import {
  trackKpiFallbackUsed,
  trackKpiRendered,
} from "@/lib/analytics/kpiEvents";
import { runKpiCanonicalIntegrityCheck } from "@/lib/analytics/kpiIntegrity";

interface KpiIntegrityMonitorProps {
  page: string;
  source: StatsSource;
  stats: BusinessStats;
}

/**
 * @owner components/analytics (under active review per 2026-05-26 audit)
 * Delegates heavy lifting to the centralized kpiIntegrity utility.
 * See `plans/README.md` for programme direction (README + `1.md`–`6.md`).
 */
export function KpiIntegrityMonitor({ page, source, stats }: KpiIntegrityMonitorProps) {
  useEffect(() => {
    trackKpiRendered({ asOfDate: stats.asOfDate, source });
    if (source !== "supabase") {
      trackKpiFallbackUsed({ source });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      void runKpiCanonicalIntegrityCheck(page, stats, controller.signal);
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [page, source, stats]);

  return null;
}
