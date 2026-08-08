"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listProjects, deleteProject, fileUrl } from "@planner/lib/plannerApi";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";
import { usePlannerUIStore } from "@planner/store/plannerUiStore";
import { OoButton } from "@planner/components/ui/PlannerOoButton";
import type { PlannerProject } from "@planner/lib/plannerTypes";

const ProjectsList = () => {
  const router = useRouter();
  const showToast = usePlannerUIStore((s) => s.showToast);
  const [projects, setProjects] = useState<PlannerProject[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const items = (await listProjects()) as PlannerProject[];
      setProjects(items);
    } catch {
      showToast("Failed to load projects", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const doDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteProject(id);
      showToast("Deleted", "ok");
      load();
    } catch {
      showToast("Delete failed", "error");
    }
  };

  return (
    <div style={{ flex: 1, overflow: "auto", background: "var(--surface-soft)" }} data-testid="projects-page">
      <div style={{ padding: "24px 24px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-strong)", margin: 0, letterSpacing: "-0.02em" }}>Floor plans</h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{projects.length} saved</div>
        </div>
        <OoButton variant="primary" onPress={() => router.push("/ooplanner")} data-testid="btn-new-project">
          <PhIcon name="plus" size={16} /> New plan
        </OoButton>
      </div>
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="panel-empty-state" data-testid="projects-empty-state">
          <div className="panel-empty-state__icon" aria-hidden="true">
            <PhIcon name="group" size={24} />
          </div>
          <p className="panel-empty-state__title">No saved plans yet</p>
          <p className="panel-empty-state__body">Start a new plan to draw your floor, place furniture, and review the BOQ.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => (
            <div
              key={p.id}
              className="project-card"
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/ooplanner/projects/${p.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/ooplanner/projects/${p.id}`);
                }
              }}
              data-testid={`project-${p.id}`}
              aria-label={`Open plan ${p.name}`}
            >
              <div className="project-card__thumb">
                {p.thumbnail_url
                  ? <img src={fileUrl(p.thumbnail_url) ?? ""} alt={p.name} />
                  : <PhIcon name="rect" size={48} />}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="project-card__name">{p.name}</div>
                  <div className="project-card__meta">{p.objects_count} objects · {new Date(p.updated_at).toLocaleDateString()}</div>
                </div>
                <OoButton
                  variant={["ghost", "icon"]}
                  onPress={() => doDelete(p.id, p.name)}
                  data-testid={`del-${p.id}`}
                  aria-label={`Delete plan ${p.name}`}
                >
                  <PhIcon name="trash" size={16} />
                </OoButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
