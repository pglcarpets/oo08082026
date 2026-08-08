"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import {
  ArrowSquareOut as ExternalLink,
  CircleNotch as Loader2,
  ArrowsClockwise as RefreshCw,
  MagnifyingGlass as Search,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { AdminField, AdminSelect, AdminTextInput } from "@/features/admin/ui/AdminFormFields";
import { AdminAlert } from "@/features/admin/ui/AdminAlert";
import { AdminLoadingPanel } from "@/features/admin/ui/AdminLoadingPanel";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";
import {
  buildAdminPlansListQuery,
  buildPlannerCanvasHref,
  type AdminPlanStatus,
} from "@/features/admin/plans/plannerAdminLinks";
import { adminPlansSearchParams } from "@/features/admin/plans/adminPlansSearchParams";

type AdminPlanSummary = {
  id: string;
  title: string;
  project_name: string | null;
  client_name: string | null;
  item_count: number;
  room_width_mm: number;
  room_depth_mm: number;
  status: AdminPlanStatus;
  review_status: "pending" | "approved";
  created_at: string;
  updated_at: string;
};

type PlansResponse = {
  plans: AdminPlanSummary[];
  pagination: { page: number; limit: number; total: number; pages: number };
  source: string;
};

const STATUS_OPTIONS: Array<{ value: "all" | AdminPlanStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Approved" },
  { value: "archived", label: "Archived" },
];

const SORT_OPTIONS = [
  { value: "updated_at:desc", label: "Recently updated" },
  { value: "updated_at:asc", label: "Oldest updated" },
  { value: "created_at:desc", label: "Recently created" },
  { value: "created_at:asc", label: "Oldest created" },
] as const;

/**
 * Fixed locale + timezone so SSR/client never diverge on date attributes/text
 * (browser locale variance was a hydration attribute mismatch source).
 */
export function formatAdminPlanTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {return value;}
  return date.toLocaleString("en-IN", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function statusLabel(status: AdminPlanSummary["status"]) {
  if (status === "active") {return "Approved";}
  if (status === "archived") {return "Archived";}
  return "Draft";
}

function statusBadgeClass(status: AdminPlanSummary["status"]): string {
  switch (status) {
    case "active":
      return "admin-badge admin-badge--active";
    case "archived":
      return "admin-badge admin-badge--hidden";
    case "draft":
      return "admin-badge admin-badge--warn";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function parseSortValue(
  value: string,
): { sortBy: "updated_at" | "created_at"; sortOrder: "asc" | "desc" } {
  const [sortBy, sortOrder] = value.split(":") as [
    "updated_at" | "created_at",
    "asc" | "desc",
  ];
  return {
    sortBy: sortBy === "created_at" ? "created_at" : "updated_at",
    sortOrder: sortOrder === "asc" ? "asc" : "desc",
  };
}

export default function AdminPlansPageView() {
  const [plans, setPlans] = useState<AdminPlanSummary[]>([]);
  const [pagination, setPagination] = useState<PlansResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [shellActionsReady, setShellActionsReady] = useState(false);
  const [filterState, setFilterState] = useQueryStates(adminPlansSearchParams, {
    history: "push",
    scroll: false,
    shallow: true,
  });
  const statusFilter = filterState.status;
  const searchQuery = filterState.search;
  const sortValue = filterState.sort;
  const [searchInput, setSearchInput] = useState(searchQuery);
  const { sortBy, sortOrder } = useMemo(() => parseSortValue(sortValue), [sortValue]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void setFilterState(
        { ...filterState, search: searchInput.trim() },
        { history: "replace" },
      );
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput, filterState, setFilterState]);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = buildAdminPlansListQuery({
        limit: 50,
        status: statusFilter,
        search: searchQuery,
        sortBy,
        sortOrder,
      });
      const response = await browserApiFetch(apiPath(query));
      if (!response.ok) {
        throw new Error(`Failed to load plans (${response.status})`);
      }
      const payload = (await response.json()) as PlansResponse;
      setPlans(payload.plans ?? []);
      setPagination(payload.pagination ?? null);
      setSource(payload.source ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy, sortOrder, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const loadInitialPlans = async () => {
      try {
        const query = buildAdminPlansListQuery({
          limit: 50,
          status: statusFilter,
          search: searchQuery,
          sortBy,
          sortOrder,
        });
        const response = await browserApiFetch(apiPath(query), {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to load plans (${response.status})`);
        }
        const payload = (await response.json()) as PlansResponse;
        if (cancelled) {return;}
        setPlans(payload.plans ?? []);
        setPagination(payload.pagination ?? null);
        setSource(payload.source ?? null);
      } catch (loadError) {
        if (cancelled || controller.signal.aborted) {return;}
        setError(loadError instanceof Error ? loadError.message : "Failed to load plans");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void loadInitialPlans();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [searchQuery, sortBy, sortOrder, statusFilter]);

  useEffect(() => {
    function markShellActionsReady() {
      setShellActionsReady(true);
    }
    markShellActionsReady();
  }, []);

  const hasActiveFilters = statusFilter !== "all" || searchQuery.length > 0;

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">Admin review</p>
          <h1 className="admin-page__title">Planner plans</h1>
          <p className="admin-page__copy">
            Filter saved documents, review metadata, and open any plan in the canvas
            workspace.
          </p>
          {source ? (
            <p className="admin-page__meta">
              Source: {source === "unconfigured" ? "Database not configured" : source}
            </p>
          ) : null}
        </div>
        <div className="admin-page__actions">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadPlans()}
            disabled={shellActionsReady && loading}
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

      <div className="admin-toolbar">
        <AdminField label="Search" className="min-w-0 flex-1 sm:min-w-[12rem]" htmlFor="admin-plans-search">
          <span className="relative block">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-soft"
              aria-hidden
            />
            <AdminTextInput
              id="admin-plans-search"
              name="admin-plans-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Title, project, client…"
              className="w-full pl-9"
              autoComplete="off"
            />
          </span>
        </AdminField>
        <AdminField label="Status" htmlFor="admin-plans-status">
          <AdminSelect
            id="admin-plans-status"
            name="admin-plans-status"
            value={statusFilter}
            onChange={(event) =>
              setFilterState({
                ...filterState,
                status: event.target.value as "all" | AdminPlanStatus,
              })
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AdminSelect>
        </AdminField>
        <AdminField label="Sort" htmlFor="admin-plans-sort">
          <AdminSelect
            id="admin-plans-sort"
            name="admin-plans-sort"
            value={sortValue}
            onChange={(event) =>
              setFilterState({
                ...filterState,
                sort: event.target.value as (typeof SORT_OPTIONS)[number]["value"],
              })
            }
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AdminSelect>
        </AdminField>
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchInput("");
              void setFilterState({ ...filterState, status: "all", search: "" });
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {source === "unconfigured" ? (
        <AdminAlert variant="info" role="status">
          Database storage is not configured. Plan review will appear here once
          persistence is enabled.
        </AdminAlert>
      ) : null}

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}

      {pagination ? (
        <p className="admin-page__meta">
          Showing {plans.length} of {pagination.total} plan
          {pagination.total === 1 ? "" : "s"}
        </p>
      ) : null}

      {loading && plans.length === 0 ? (
        <AdminLoadingPanel
          title="Loading plans…"
          copy="Fetching saved planner documents from the admin API."
        >
          <div className="admin-loading-skeleton" aria-hidden>
            <div className="admin-loading-skeleton__row" />
            <div className="admin-loading-skeleton__row" />
            <div className="admin-loading-skeleton__row admin-loading-skeleton__row--short" />
          </div>
        </AdminLoadingPanel>
      ) : plans.length === 0 ? (
        <div className="admin-empty admin-panel" role="status">
          <h2 className="admin-empty__title">
            {hasActiveFilters ? "No matching plans" : "No plans yet"}
          </h2>
          <p className="admin-empty__copy">
            {hasActiveFilters
              ? "Clear filters or adjust search to see more planner documents."
              : source === "unconfigured"
                ? "Plan review needs planner database persistence. Configure the DB, then save a layout from the canvas."
                : "No saved planner documents yet. Open the guest planner, save a layout, then refresh this list."}
          </p>
          <div className="admin-empty__actions">
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  void setFilterState({ ...filterState, status: "all", search: "" });
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button asChild variant="primary" size="sm">
                <Link href="/ooplanner">Open planner</Link>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadPlans()}
              disabled={shellActionsReady && loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      ) : (
        <div className="admin-panel admin-table-wrap" data-phone-layout="cards-priority">
          <table className="admin-table" data-phone-layout="cards-priority">
            <caption className="sr-only">Planner plans available for Admin review</caption>
            <thead>
              <tr>
                <th scope="col">Plan</th>
                <th scope="col">Room</th>
                <th scope="col">Items</th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td data-label="Plan">
                    <Link
                      href={`/admin/plans/${plan.id}`}
                      className="admin-table__primary admin-link"
                    >
                      {plan.title}
                    </Link>
                    <p className="admin-table__secondary">
                      {plan.project_name ?? plan.client_name ?? "No project metadata"}
                    </p>
                  </td>
                  <td data-label="Room" className="admin-table__secondary">
                    {plan.room_width_mm} × {plan.room_depth_mm} mm
                  </td>
                  <td data-label="Items" className="admin-table__secondary">
                    {plan.item_count}
                  </td>
                  <td data-label="Status">
                    <span className={statusBadgeClass(plan.status)}>
                      {statusLabel(plan.status)}
                    </span>
                  </td>
                  <td data-label="Updated" className="admin-table__secondary">
                    {formatAdminPlanTimestamp(plan.updated_at)}
                  </td>
                  <td data-label="Actions">
                    <Link
                      href={buildPlannerCanvasHref(plan.id)}
                      className="admin-inline-gap admin-link"
                    >
                      <ExternalLink size={14} className="admin-icon-static" aria-hidden />
                      Open in canvas
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
