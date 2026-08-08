"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useCrmStore } from "./stores/crmStore";
import { cn } from "@/lib/utils";
import { AdminField, AdminTextInput } from "@/features/admin/ui/AdminFormFields";
import { crmPageShell } from "./crmAdminUi";
import { crmUi } from "./crmUi";
import { CRM_PROJECTS_PATH } from "./crmRoutes";
import { memberSuitePlannerProjectHref } from "@/features/shared/shell/memberSuiteRoutes";
import { getSavedPlans } from "@planner/lib/projectIndex";
import type { PlannerSaveSummary } from "@planner/lib/projectsStore";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";
import { ArrowLeft, ArrowRight, Envelope as Mail, Phone, Clock, FileText, Cube as Box, WarningCircle as AlertCircle, Plus, X } from "@phosphor-icons/react";

interface ProjectDetailViewProps {
  projectId: string;
  embedded?: boolean;
}

export default function ProjectDetailView({ projectId, embedded = false }: ProjectDetailViewProps) {
  const router = useRouter();
  const { projects, clients, assignPlanToProject, removePlanFromProject } = useCrmStore();
  const [onlinePlans, setOnlinePlans] = useState<PlannerSaveSummary[]>([]);
  const [, setIsLoadingOnline] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState("");

  const project = useMemo(() => {
    return projects.find((p) => p.id === projectId);
  }, [projects, projectId]);

  const client = useMemo(() => {
    if (!project) {return null;}
    return clients.find((c) => c.id === project.clientId);
  }, [clients, project]);

  // Fetch online plans via the server API (keeps DB driver off the client bundle)
  useEffect(() => {
    let cancelled = false;
    async function fetchOnlinePlans() {
      setIsLoadingOnline(true);
      try {
        // Forked Planner disk projects (trailingSlash + credentials via browserApiFetch).
        const res = await browserApiFetch(apiPath("/api/Planner/projects"));
        if (!res.ok) {
          if (res.status !== 401) {
            console.error("Failed to fetch planner projects:", res.statusText);
          }
          return;
        }
        const body = (await res.json()) as unknown;
        const rows = Array.isArray(body)
          ? body
          : Array.isArray((body as { documents?: unknown }).documents)
            ? (body as { documents: unknown[] }).documents
            : [];
        if (!cancelled) {
          const mapped: PlannerSaveSummary[] = rows
            .map((row) => {
              if (!row || typeof row !== "object") return null;
              const r = row as Record<string, unknown>;
              const id = typeof r.id === "string" ? r.id : null;
              if (!id) return null;
              const objects =
                typeof r.objects_count === "number"
                  ? r.objects_count
                  : typeof r.item_count === "number"
                    ? r.item_count
                    : 0;
              return {
                id,
                name: typeof r.name === "string" ? r.name : "Untitled",
                item_count: objects,
                updated_at:
                  typeof r.updated_at === "string"
                    ? r.updated_at
                    : new Date().toISOString(),
              } satisfies PlannerSaveSummary;
            })
            .filter((p): p is PlannerSaveSummary => p !== null);
          setOnlinePlans(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch online plans:", err);
      } finally {
        if (!cancelled) {setIsLoadingOnline(false);}
      }
    }
    fetchOnlinePlans();
    return () => {
      cancelled = true;
    };
  }, []);


  // Get local plans
  const localPlans = useMemo(() => {
    return getSavedPlans();
  }, []);

  // Combine all available plans in the system
  const allSystemPlans = useMemo(() => {
    const combined: Array<{ id: string; name: string; type: "local" | "online"; itemsCount: number; updatedAt: string }> = [];
    
    // Add local plans
    localPlans.forEach((p) => {
      combined.push({
        id: p.id,
        name: p.name,
        type: "local",
        itemsCount: p.furniture.length,
        updatedAt: p.savedAt || new Date().toISOString(),
      });
    });

    // Add online plans
    onlinePlans.forEach((p) => {
      // Avoid duplication if the ID is already there
      if (!combined.some((c) => c.id === p.id)) {
        combined.push({
          id: p.id,
          name: p.name,
          type: "online",
          itemsCount: p.item_count,
          updatedAt: p.updated_at,
        });
      }
    });

    return combined;
  }, [localPlans, onlinePlans]);

  // Filter plans assigned to this project
  const assignedPlans = useMemo(() => {
    if (!project) {return [];}
    return allSystemPlans.filter((p) => project.planIds.includes(p.id));
  }, [allSystemPlans, project]);

  // Filter plans not assigned to this project
  const unassignedPlans = useMemo(() => {
    if (!project) {return [];}
    return allSystemPlans.filter((p) => !project.planIds.includes(p.id));
  }, [allSystemPlans, project]);

  if (!project) {
    return (
      <section className={crmPageShell(embedded, "crm-project-detail-view")}>
        <div
          className={
            embedded
              ? "admin-empty admin-panel space-y-4 py-12 text-center"
              : "mx-auto max-w-md space-y-4 py-20 text-center text-inverse"
          }
        >
          <AlertCircle className="mx-auto h-12 w-12 text-danger" aria-hidden />
          <h2 className={embedded ? "admin-empty__title" : "text-xl font-semibold"}>
            Project not found
          </h2>
          <p className={embedded ? "admin-empty__copy" : "text-sm text-muted-foreground"}>
            The project you are looking for does not exist or has been deleted.
          </p>
          {embedded ? (
            <Button asChild variant="primary" size="sm">
              <Link href={CRM_PROJECTS_PATH}>Back to Projects</Link>
            </Button>
          ) : (
            <Link
              href={CRM_PROJECTS_PATH}
              className="btn-primary inline-block rounded-full px-6 py-2"
            >
              Back to Projects
            </Link>
          )}
        </div>
      </section>
    );
  }

  const handleLinkPlan = (planId: string) => {
    assignPlanToProject(project.id, planId);
    setIsLinkModalOpen(false);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) {return;}

    // Create on disk via Planner API so canvas GET /api/Planner/projects/:id succeeds.
    try {
      const res = await browserApiFetch(apiPath("/api/Planner/projects"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: newPlanTitle.trim(),
          canvas_json: { objects: [] },
          sheet: {},
          layers: [],
        }),
      });
      if (!res.ok) {
        window.alert("Could not create floor plan on the server.");
        return;
      }
      const body = (await res.json()) as { id?: string };
      const newId = typeof body.id === "string" ? body.id : null;
      if (!newId) {
        window.alert("Server created a plan without an id.");
        return;
      }

      assignPlanToProject(project.id, newId);
      setNewPlanTitle("");
      setIsCreateModalOpen(false);
      router.push(memberSuitePlannerProjectHref(newId));
    } catch {
      window.alert("Could not create floor plan (network or CSRF failure).");
    }
  };

  const shell = crmPageShell(embedded, "crm-project-detail-view");
  const inner = embedded
    ? "flex w-full flex-col gap-5 sm:gap-6"
    : "mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8";

  return (
    <section className={shell}>
      <div className={inner}>
        {/* Back Link */}
        <div className="flex items-center gap-3">
          <Link
            href={CRM_PROJECTS_PATH}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2",
              crmUi.softSurface,
              embedded ? "text-muted hover:bg-soft" : crmUi.ghostInverse,
            )}
            aria-label="Back to projects"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0">
            {!embedded ? (
              <p className="admin-page__eyebrow">
                Project Detail
              </p>
            ) : null}
            {embedded ? (
              <h2 className="m-0 text-lg font-semibold text-strong">{project.name}</h2>
            ) : (
              <h1 className="text-2xl font-semibold text-strong">{project.name}</h1>
            )}
          </div>
        </div>

        {/* Project Layout Split */}
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Client Info Card */}
            {client ? (
              <div className="admin-panel space-y-4">
                <p className="admin-page__eyebrow text-[10px]">Client Account</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-inverse">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-strong">{client.name}</h4>
                    {client.company && <p className="text-xs text-muted-foreground">{client.company}</p>}
                  </div>
                </div>
                <hr className={crmUi.panelBorder} />
                <div className="space-y-2 text-xs text-inverse-body">
                  {client.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 opacity-60" /> {client.email}
                    </p>
                  )}
                  {client.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 opacity-60" /> {client.phone}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="admin-panel py-6 text-center text-xs italic text-muted-foreground">
                No client associated with this project.
              </div>
            )}

            {/* Notes Card */}
            <div className="admin-panel space-y-3">
              <p className="admin-page__eyebrow text-[10px]">Project Brief</p>
              {project.notes ? (
                <p className="text-xs leading-relaxed text-inverse-body whitespace-pre-wrap">{project.notes}</p>
              ) : (
                <p className="text-xs italic text-muted-foreground">No briefs or project notes recorded.</p>
              )}
            </div>

            {/* Meta Info */}
            <div className="admin-panel space-y-3 text-xs text-inverse-muted">
              <p className="admin-page__eyebrow text-[10px]">Timestamps</p>
              <p className="flex justify-between">
                <span>Created</span>
                <span className="font-mono text-inverse">{new Date(project.createdAt).toLocaleDateString()}</span>
              </p>
              <p className="flex justify-between">
                <span>Updated</span>
                <span className="font-mono text-inverse">{new Date(project.updatedAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          {/* Main Space Plans */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-strong">Floor Plans & Designs</h3>
                <p className="text-xs text-muted-foreground">
                  {assignedPlans.length} plan{assignedPlans.length !== 1 ? "s" : ""} grouped in this project
                </p>
              </div>
              
              <div className="flex gap-2">
                {embedded ? (
                  <Button type="button" variant="outline" size="xs" onClick={() => setIsLinkModalOpen(true)}>
                    Link Plan
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLinkModalOpen(true)}
                    className="btn-outline-light rounded-lg px-4 py-2 text-xs font-semibold"
                  >
                    Link Plan
                  </button>
                )}
                {embedded ? (
                  <Button type="button" variant="primary" size="xs" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4" aria-hidden /> Create Plan
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold"
                  >
                    <Plus className="h-4 w-4" aria-hidden /> Create Plan
                  </button>
                )}
              </div>
            </div>

            {assignedPlans.length === 0 ? (
              <div className={cn("admin-panel rounded-[2rem] py-20 text-center text-sm text-muted-foreground", crmUi.emptyState)}>
                <FileText className="mx-auto mb-4 h-12 w-12 text-subtle" />
                <p className="font-semibold text-strong">No plans linked yet</p>
                <p className="mt-1">Link an existing floor plan or create a new one for this project.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {assignedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={cn("admin-panel group flex flex-col justify-between", crmUi.panelBorder)}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="max-w-[12rem] truncate font-semibold text-inverse">{plan.name}</h4>
                          <span className={cn("mt-1 inline-block rounded px-2 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wider text-inverse-muted", crmUi.softSurface)}>
                            {plan.type}
                          </span>
                        </div>
                        <button
                          onClick={() => removePlanFromProject(project.id, plan.id)}
                          className={cn("rounded-lg p-1.5", crmUi.ghostDanger)}
                          title="Unlink plan"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <hr className={cn("my-3", crmUi.softBorder)} />

                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Box className="h-3.5 w-3.5 opacity-60" /> {plan.itemsCount} items
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 opacity-60" /> {new Date(plan.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className={cn("border-t p-3", crmUi.softSurface, crmUi.softBorder)}>
                      <Link
                        href={memberSuitePlannerProjectHref(plan.id)}
                        className="btn-primary block text-center py-2 text-xs font-semibold rounded-lg"
                      >
                        Open in Canvas
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Link Existing Plan Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={cn("flex w-full max-w-md flex-col gap-6 p-8", crmUi.modal)}>
            <div>
              <h2 className="text-xl font-semibold text-inverse">Link Floor Plan</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Select an existing workspace plan to assign to this project.
              </p>
            </div>

            {unassignedPlans.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No unassigned plans found in the system.
                <button
                  onClick={() => {
                    setIsLinkModalOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                  className="block mt-4 mx-auto text-xs font-semibold text-[color:var(--color-primary)] hover:underline"
                >
                  Create a new plan instead
                </button>
              </div>
            ) : (
              <div className={cn("max-h-60 space-y-1 overflow-y-auto divide-y", crmUi.softBorder)}>
                {unassignedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleLinkPlan(plan.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleLinkPlan(plan.id);
                      }
                    }}
                    className={cn("flex cursor-pointer items-center justify-between rounded-lg p-3 transition", crmUi.hoverSurface)}
                    aria-label={`Link plan ${plan.name}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-inverse">{plan.name}</p>
                      <p className="mt-0.5 text-[10px] capitalize text-muted-foreground">
                        {plan.type} · {plan.itemsCount} items
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-inverse-subtle" />
                  </div>
                ))}
              </div>
            )}

            <div className={cn("flex items-center justify-end border-t pt-2", crmUi.softBorder)}>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="btn-outline-light px-5 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Plan Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={cn("flex w-full max-w-md flex-col gap-6 p-8", crmUi.modal)}>
            <div>
              <h2 className="text-xl font-semibold text-inverse">Create New Floor Plan</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Set up a blank floor plan linked to this project.
              </p>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <AdminField label="Plan Title *">
                <AdminTextInput
                  type="text"
                  required
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  placeholder="e.g. Executive Cabin Blueprint"
                />
              </AdminField>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-outline-light px-5 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPlanTitle.trim()}
                  className="btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
