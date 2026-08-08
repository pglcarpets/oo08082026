"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleNotch as Loader2,
  ArrowsClockwise as RefreshCw,
  ChartBar as BarChart3,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";
import { AdminField, AdminSelect } from "../ui/AdminFormFields";
import { AdminAlert } from "../ui/AdminAlert";
import { AdminLoadingPanel } from "../ui/AdminLoadingPanel";

type AnalyticsSummary = {
  avgArea: number;
  avgItems: number;
  totalPlans: number;
};

type SeriesPoint = { date: string; count?: number; activeUsers?: number };

type TopFurniture = { name: string; count: number; category: string };

type ExportRow = { format: string; count: number };

type AnalyticsResponse = {
  success?: boolean;
  summary: AnalyticsSummary;
  topFurniture: TopFurniture[];
  exports: ExportRow[];
  plansCreated: SeriesPoint[];
  activeUsers: SeriesPoint[];
  peakDayPlans?: number;
  periodDays?: number;
  databaseConfigured?: boolean;
  furnitureSource?: string;
  source?: string;
  warning?: string | null;
};

const PERIODS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

function sourceLabel(source: string | undefined): string {
  switch (source) {
    case "disk_planner_projects":
    case "drizzle_plans": // legacy telemetry alias
      return "Disk planner projects";
    case "disk_planner_projects-empty":
    case "drizzle_plans-empty":
      return "Disk planner projects (none in period)";
    case "planner-db-not-configured":
      return "Planner store not configured";
    case "planner-db-error":
      return "Planner store error";
    case "local-fallbacks":
      return "Local fallbacks";
    default:
      return source ?? "Unknown";
  }
}

function formatDayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) {return isoDate;}
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function AdminAnalyticsPageView() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["value"]>("30d");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await browserApiFetch(
        apiPath(`/api/admin/analytics?period=${period}`),
      );
      if (!response.ok) {
        throw new Error(`Failed to load analytics (${response.status})`);
      }
      const payload = (await response.json()) as AnalyticsResponse;
      setData(payload);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load analytics",
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAnalytics();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadAnalytics]);

  const peak = useMemo(() => {
    if (!data?.plansCreated?.length) {return 1;}
    const fromApi = data.peakDayPlans ?? 0;
    if (fromApi > 0) {return fromApi;}
    return Math.max(
      1,
      ...data.plansCreated.map((p) => p.count ?? 0),
    );
  }, [data]);

  const totalPlans = data?.summary.totalPlans ?? 0;
  const isEmpty = !loading && data && totalPlans === 0;
  const chartPoints = data?.plansCreated ?? [];
  // Show last 14 bars on wide periods for readability
  const chartSlice =
    chartPoints.length > 14 ? chartPoints.slice(-14) : chartPoints;

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">Planner usage</p>
          <h1 className="admin-page__title">Analytics</h1>
          <p className="admin-page__copy">
            Plan volume over time, furniture mix samples, and export activity
            from the planner database.
          </p>
          {data?.source ? (
            <p className="admin-page__meta">
              Source: {sourceLabel(data.source)}
              {data.periodDays ? ` · ${data.periodDays}d window` : ""}
            </p>
          ) : null}
        </div>
        <div className="admin-page__actions">
          <AdminField label="Period">
            <AdminSelect
              value={period}
              onChange={(event) =>
                setPeriod(
                  event.target.value as (typeof PERIODS)[number]["value"],
                )
              }
            >
              {PERIODS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadAnalytics()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={14} className="admin-icon-spin" aria-hidden />
            ) : (
              <RefreshCw size={14} className="admin-icon-static" aria-hidden />
            )}
            Refresh
          </Button>
        </div>
      </header>

      {error ? (
        <AdminAlert variant="error" title="Could not load analytics">
          <p className="m-0 mt-1">{error}</p>
          <div className="admin-empty__actions mt-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void loadAnalytics()}
            >
              Retry
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/plans">Open plans</Link>
            </Button>
          </div>
        </AdminAlert>
      ) : null}

      {data?.warning ? (
        <AdminAlert variant="warn" role="status">
          Database warning: {data.warning}
        </AdminAlert>
      ) : null}

      {loading && !data ? (
        <AdminLoadingPanel
          title="Loading analytics…"
          copy="Reading plan volume, furniture mix, and export activity from the planner database."
        >
          <div className="admin-loading-skeleton" aria-hidden>
            <div className="admin-loading-skeleton__row" />
            <div className="admin-loading-skeleton__row" />
            <div className="admin-loading-skeleton__row admin-loading-skeleton__row--short" />
          </div>
        </AdminLoadingPanel>
      ) : null}

      {data || error ? (
        <div className="admin-stack--loose">
          <div className="admin-kpi-grid admin-kpi-grid--3" aria-label="Analytics summary">
            <div className="admin-panel admin-panel--padded">
              <p className="admin-type-label">
                Total plans
              </p>
              <p className="admin-type-kpi mt-1">
                {data ? data.summary.totalPlans : "—"}
              </p>
            </div>
            <div className="admin-panel admin-panel--padded">
              <p className="admin-type-label">
                Avg items / plan
              </p>
              <p className="admin-type-kpi mt-1">
                {data ? data.summary.avgItems : "—"}
              </p>
            </div>
            <div className="admin-panel admin-panel--padded">
              <p className="admin-type-label">
                Avg area (m²)
              </p>
              <p className="admin-type-kpi mt-1">
                {data ? data.summary.avgArea : "—"}
              </p>
            </div>
          </div>

          {isEmpty ? (
            <div className="admin-empty admin-panel" role="status">
              <BarChart3 size={28} aria-hidden className="text-muted" />
              <h2 className="admin-empty__title">No plan activity yet</h2>
              <p className="admin-empty__copy">
                {data?.databaseConfigured === false
                  ? "The planner database URL is not configured, so live metrics cannot load. Set PRODUCTS / planner DB env and save plans from the canvas."
                  : "No planner documents were created in this period. Create or open plans, then refresh."}
              </p>
              <div className="admin-empty__actions">
                <Button asChild variant="primary" size="sm">
                  <Link href="/admin/plans">Review plans</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/ooplanner">Open planner</Link>
                </Button>
              </div>
            </div>
          ) : null}

          <section className="admin-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="m-0 text-sm font-semibold text-strong">
                Plans created
              </h2>
              {chartSlice.length > 0 ? (
                <p className="m-0 text-xs text-muted">
                  Peak day: {peak} plan{peak === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>
            {chartSlice.length === 0 ? (
              <p className="admin-empty">No plan activity recorded for this period.</p>
            ) : (
              <>
                <div
                  className="admin-analytics-bars"
                  role="img"
                  aria-label="Bar chart of plans created by day"
                >
                  {chartSlice.map((point) => {
                    const count = point.count ?? 0;
                    const heightPct = Math.max(
                      count > 0 ? 8 : 2,
                      Math.round((count / peak) * 100),
                    );
                    return (
                      <div
                        key={point.date}
                        className="admin-analytics-bars__col"
                        title={`${point.date}: ${count}`}
                      >
                        <div
                          className="admin-analytics-bars__bar"
                          style={{ height: `${heightPct}%` }}
                          data-count={count}
                        />
                        <span className="admin-analytics-bars__label">
                          {formatDayLabel(point.date)}
                        </span>
                        <span className="admin-analytics-bars__value">{count}</span>
                      </div>
                    );
                  })}
                </div>
                <div
                  className="admin-table-wrap mt-4"
                  role="region"
                  aria-label="Plan activity table"
                >
                  <table className="admin-table min-w-[28rem]">
                    <caption className="sr-only">
                      Plans created and activity series by date
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">New plans</th>
                        <th scope="col">Activity index</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartSlice.map((point, index) => {
                        const offset =
                          (data?.plansCreated.length ?? 0) - chartSlice.length;
                        const active =
                          data?.activeUsers[offset + index]?.activeUsers ?? "—";
                        return (
                          <tr key={point.date}>
                            <td>{point.date}</td>
                            <td className="admin-table__secondary">
                              {point.count ?? 0}
                            </td>
                            <td className="admin-table__secondary">{active}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="admin-panel p-4">
              <h2 className="admin-type-section">Top furniture</h2>
              {data?.furnitureSource === "catalog-sample" &&
              (data.topFurniture?.length ?? 0) > 0 ? (
                <p className="admin-page__meta mt-1">
                  Catalog sample ranking (not per-placement telemetry yet).
                </p>
              ) : null}
              {(data?.topFurniture?.length ?? 0) > 0 ? (
                <ul className="mt-3 divide-y divide-soft text-sm">
                  {data?.topFurniture.map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between gap-4 py-2"
                    >
                      <span>{item.name}</span>
                      <span className="text-muted">
                        {item.category} · {item.count}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="admin-empty" role="status">
                  <p className="admin-empty__copy">
                    No furniture mix for this period. Save plans that include
                    catalog items to populate usage rankings.
                  </p>
                </div>
              )}
            </section>

            <section className="admin-panel p-4">
              <h2 className="admin-type-section">
                Export breakdown
              </h2>
              {(data?.exports?.length ?? 0) > 0 ? (
                <ul className="mt-3 divide-y divide-soft text-sm">
                  {data?.exports.map((row) => (
                    <li
                      key={row.format}
                      className="flex items-center justify-between gap-4 py-2"
                    >
                      <span>{row.format}</span>
                      <span className="text-muted">{row.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="admin-empty" role="status">
                  <p className="admin-empty__copy">
                    No export estimates yet. Estimates appear once plans exist
                    in the selected window.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
