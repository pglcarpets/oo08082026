"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { Project } from "./stores/crmStore";
import { useCrmStore } from "./stores/crmStore";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { crmProjectStatus, crmUi } from "./crmUi";
import { crmProjectDetailPath } from "./crmRoutes";
import { CrmWorkspaceBanner } from "./CrmWorkspaceBanner";
import {
  CrmFormDialog,
  crmPageInner,
  crmPageShell,
} from "./crmAdminUi";
import {
  AdminField,
  AdminSelect,
  AdminTextarea,
  AdminTextInput,
} from "@/features/admin/ui/AdminFormFields";
import {
  FolderOpen,
  Plus,
  FileText,
  Trash as Trash2,
  ArrowRight,
  Buildings as Building2,
  Users,
  CalendarBlank as CalendarDays,
} from "@phosphor-icons/react";

export default function ProjectsView({ embedded = false }: { embedded?: boolean }) {
  const { projects, clients, addProject, deleteProject } = useCrmStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("none");
  const [status, setStatus] = useState<Project["status"]>("active");
  const [notes, setNotes] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {return;}

    addProject({
      name: name.trim(),
      clientId,
      status,
      notes: notes.trim(),
    });

    setName("");
    setClientId("none");
    setStatus("active");
    setNotes("");
    setIsModalOpen(false);
  };

  const clientMap = useMemo(() => {
    return new Map(clients.map((c) => [c.id, c]));
  }, [clients]);

  const groupedProjects = useMemo(() => {
    const groups: Record<string, Project[]> = {};
    projects.forEach((p) => {
      const clientName = clientMap.get(p.clientId)?.name ?? "Unassigned Clients";
      if (!groups[clientName]) {groups[clientName] = [];}
      groups[clientName].push(p);
    });
    return groups;
  }, [projects, clientMap]);

  const stats = useMemo(
    () => [
      {
        label: "Total Projects",
        value: projects.length,
        tone: "text-strong",
      },
      {
        label: "Active Projects",
        value: projects.filter((p) => p.status === "active").length,
        tone: "text-success",
      },
      {
        label: "On Hold",
        value: projects.filter((p) => p.status === "on_hold").length,
        tone: "text-warning",
      },
      {
        label: "Completed",
        value: projects.filter((p) => p.status === "completed").length,
        tone: "text-primary",
      },
    ],
    [projects],
  );

  return (
    <section className={crmPageShell(embedded, "crm-projects-view")}>
      <div className={crmPageInner(embedded)}>
        {embedded ? <CrmWorkspaceBanner /> : null}

        {embedded ? (
          <div className="crm-projects-toolbar">
            <p className="crm-projects-toolbar__hint text-xs text-muted">
              {projects.length === 0
                ? "Start with sample data or create a project."
                : `${projects.length} project${projects.length === 1 ? "" : "s"} in this browser.`}
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden /> New Project
            </Button>
          </div>
        ) : (
          <header className="admin-page__header">
            <div>
              <p className="admin-page__eyebrow">CRM demo · browser only</p>
              <h1 className="admin-page__title">Projects Tracker</h1>
              <p className="admin-page__copy">
                Floor plans and deals grouped by customer — stored in this browser only.
                Not a production CRM.
              </p>
            </div>
            <div className="admin-page__actions">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="h-4 w-4" aria-hidden /> New Project
              </Button>
            </div>
          </header>
        )}

        {/* Stats — 2×2 phone, 4-up from sm */}
        <div
          className="crm-projects-kpi-grid"
          role="group"
          aria-label="Project statistics"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="admin-panel crm-projects-kpi p-3 sm:p-5">
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted sm:tracking-[0.2em]">
                {stat.label}
              </p>
              <p className={cn("mt-1.5 text-xl font-bold sm:mt-2 sm:text-2xl", stat.tone)}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {projects.length === 0 ? (
          <div className="admin-empty admin-panel" role="status">
            <FolderOpen className="mx-auto h-12 w-12 text-subtle sm:h-14 sm:w-14" aria-hidden />
            <h2 className="admin-empty__title">No projects yet</h2>
            <p className="admin-empty__copy">
              Create your first project to organize your space planner designs, link them to
              clients, and build quotes.
            </p>
            <div className="admin-empty__actions">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
              >
                Get Started
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-10">
            {Object.entries(groupedProjects).map(([clientName, clientProjs]) => (
              <div key={clientName} className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      crmUi.iconChip,
                    )}
                  >
                    <Building2 className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-strong">
                      {clientName}
                    </h2>
                    <p className="text-xs text-muted">
                      {clientProjs.length} project{clientProjs.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {clientProjs.map((project) => {
                    const sc = crmProjectStatus[project.status] || crmProjectStatus.active;
                    const client = clientMap.get(project.clientId);
                    return (
                      <article
                        key={project.id}
                        className="admin-panel group flex flex-col justify-between overflow-hidden"
                      >
                        <div className="p-4 sm:p-6">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-strong transition group-hover:text-primary">
                              {project.name}
                            </h3>
                            <span
                              className={cn(
                                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
                                sc.badge,
                              )}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                          </div>

                          {client ? (
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                              <Users className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                              <span className="truncate">{client.name}</span>
                            </p>
                          ) : null}

                          {project.notes ? (
                            <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">
                              {project.notes}
                            </p>
                          ) : null}
                        </div>

                        <div
                          className={cn(
                            "flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted sm:px-6 sm:py-4",
                            crmUi.softBorder,
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4 opacity-70" aria-hidden />
                            <span>
                              {project.planIds.length} floor plan
                              {project.planIds.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4 opacity-70" aria-hidden />
                            <span>
                              {new Date(project.updatedAt).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                        </div>

                        <div
                          className={cn(
                            "flex gap-2 border-t px-3 py-3 sm:px-6",
                            crmUi.softSurface,
                            crmUi.softBorder,
                          )}
                        >
                          <Button asChild variant="outline" size="sm" className="min-h-11 flex-1">
                            <Link href={crmProjectDetailPath(project.id)}>
                              Open Details <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                          </Button>
                          <button
                            type="button"
                            onClick={() => deleteProject(project.id)}
                            className={cn(
                              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg",
                              crmUi.ghostDanger,
                            )}
                            title="Delete project"
                            aria-label={`Delete project ${project.name}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CrmFormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Create New Project"
        description="Bundle floor plans and configurations for a client deal."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <AdminField label="Project Name *">
            <AdminTextInput
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nexus Office Level 4"
            />
          </AdminField>

          <AdminField label="Client Association">
            <AdminSelect
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              aria-label="Client Association"
            >
              <option value="none">No Client Assignment</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ""}
                </option>
              ))}
            </AdminSelect>
          </AdminField>

          <AdminField label="Initial Status">
            <AdminSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as Project["status"])}
              aria-label="Initial Status"
            >
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </AdminSelect>
          </AdminField>

          <AdminField label="Notes / Brief">
            <AdminTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Design specs, seat requirements..."
            />
          </AdminField>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
              disabled={!name.trim()}
            >
              Create Project
            </Button>
          </div>
        </form>
      </CrmFormDialog>
    </section>
  );
}
