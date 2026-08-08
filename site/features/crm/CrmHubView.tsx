"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { AdminKpiLink } from "@/features/admin/ui/AdminKpiLink";
import { AdminPanelCard } from "@/features/admin/ui/AdminPanelCard";
import { useCrmStore } from "./stores/crmStore";
import {
  CRM_CLIENTS_PATH,
  CRM_PROJECTS_PATH,
  CRM_QUOTES_PATH,
  crmProjectDetailPath,
} from "./crmRoutes";
import { computeCrmMetrics, formatInrCompact } from "./crmMetrics";
import { CrmDemoBanner } from "./CrmDemoBanner";
import { CrmWorkspaceBanner } from "./CrmWorkspaceBanner";
import { crmProjectStatus, crmQuoteStatusColumns } from "./crmUi";

export default function CrmHubView() {
  const clients = useCrmStore((s) => s.clients);
  const projects = useCrmStore((s) => s.projects);
  const quotes = useCrmStore((s) => s.quotes);

  const metrics = useMemo(
    () => computeCrmMetrics(clients, projects, quotes),
    [clients, projects, quotes],
  );

  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients],
  );

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
    [projects],
  );

  const recentQuotes = useMemo(
    () =>
      [...quotes]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
    [quotes],
  );

  const empty =
    metrics.clientCount === 0 &&
    metrics.projectCount === 0 &&
    metrics.quoteCount === 0;

  return (
    <div className="crm-hub space-y-6">
      <CrmDemoBanner />
      <CrmWorkspaceBanner />

      <section className="admin-kpi-grid" aria-label="CRM summary">
        <AdminKpiLink
          href={CRM_CLIENTS_PATH}
          label="Clients"
          hint={metrics.clientCount}
          tone="neutral"
          hintClassName="text-lg font-bold text-strong"
          cta={
            <>
              Open directory <ArrowRight size={14} aria-hidden />
            </>
          }
        />
        <AdminKpiLink
          href={CRM_PROJECTS_PATH}
          label="Active projects"
          hint={
            <>
              {metrics.activeProjects}
              <span className="ml-1 text-xs font-normal text-muted">
                / {metrics.projectCount}
              </span>
            </>
          }
          tone="info"
          hintClassName="text-lg font-bold text-strong"
          cta={
            <>
              Open projects <ArrowRight size={14} aria-hidden />
            </>
          }
        />
        <AdminKpiLink
          href={CRM_QUOTES_PATH}
          label="Pipeline value"
          hint={formatInrCompact(metrics.pipelineValue)}
          tone="warn"
          hintClassName="text-lg font-bold text-strong"
          cta={
            <>
              {metrics.sentQuotes} sent · {metrics.draftQuotes} draft
            </>
          }
        />
        <AdminKpiLink
          href={CRM_QUOTES_PATH}
          label="Approved value"
          hint={formatInrCompact(metrics.approvedValue)}
          tone="success"
          hintClassName="text-lg font-bold text-strong"
          cta={<>{metrics.approvedQuotes} approved quotes</>}
        />
      </section>

      {empty ? (
        <div className="admin-empty admin-panel" role="status">
          <h2 className="admin-empty__title">CRM workspace is empty</h2>
          <p className="admin-empty__copy">
            Load sample data to explore the pipeline, or create your first client and
            project. Records stay in this browser until you export them.
          </p>
          <div className="admin-empty__actions">
            <Button asChild variant="primary" size="sm">
              <Link href={CRM_CLIENTS_PATH}>Add a client</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={CRM_PROJECTS_PATH}>Add a project</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AdminPanelCard
            className="p-4 sm:p-5"
            title="Recent projects"
            action={
              <Link href={CRM_PROJECTS_PATH} className="crm-panel-action">
                View all
              </Link>
            }
          >
            {recentProjects.length === 0 ? (
              <p className="admin-empty mt-3">No projects yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-soft">
                {recentProjects.map((project) => {
                  const status = crmProjectStatus[project.status] ?? crmProjectStatus.active;
                  const client = clientMap.get(project.clientId);
                  return (
                    <li key={project.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <Link
                          href={crmProjectDetailPath(project.id)}
                          className="block truncate text-sm font-semibold text-strong hover:text-primary"
                        >
                          {project.name}
                        </Link>
                        <p className="truncate text-xs text-muted">
                          {client?.name ?? "Unassigned"} · {project.planIds.length} plan
                          {project.planIds.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminPanelCard>

          <AdminPanelCard
            className="p-4 sm:p-5"
            title="Recent quotes"
            action={
              <Link href={CRM_QUOTES_PATH} className="crm-panel-action">
                View all
              </Link>
            }
          >
            {recentQuotes.length === 0 ? (
              <p className="admin-empty mt-3">No quotes yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-soft">
                {recentQuotes.map((quote) => {
                  const col =
                    crmQuoteStatusColumns.find((c) => c.value === quote.status) ??
                    crmQuoteStatusColumns[0];
                  const client = clientMap.get(quote.clientId);
                  return (
                    <li key={quote.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-strong">
                          {quote.title}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {client?.name ?? "Unassigned"} · {formatInrCompact(quote.totalAmount)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${col.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                        {col.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminPanelCard>
        </div>
      )}

      <AdminPanelCard className="p-4 sm:p-5" title="Quick actions">
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="primary" size="sm">
            <Link href={CRM_CLIENTS_PATH}>New client</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={CRM_PROJECTS_PATH}>New project</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={CRM_QUOTES_PATH}>New quote</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/customer-queries">Customer queries</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/plans">Planner plans</Link>
          </Button>
        </div>
        <p className="admin-page__meta mt-4">
          {metrics.plansLinked} floor plan link{metrics.plansLinked === 1 ? "" : "s"} across
          projects · {metrics.onHoldProjects} on hold · {metrics.completedProjects} completed
        </p>
      </AdminPanelCard>
    </div>
  );
}
