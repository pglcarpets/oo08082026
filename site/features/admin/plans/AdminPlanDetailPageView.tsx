"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ArrowSquareOut as ExternalLink, CircleNotch as Loader2 } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { AdminAlert } from "@/features/admin/ui/AdminAlert";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";
import { buildPlannerCanvasHref } from "@/features/admin/plans/plannerAdminLinks";
import { formatAdminPlanTimestamp } from "@/features/admin/plans/AdminPlansPageView";
import {
  getPlannerSceneEnvelope,
  type PlannerSceneEnvelope,
  type PlannerJsonValue,
} from "@planner/lib/plannerDocument";

type AdminPlanDetail = {
  id: string;
  title: string;
  project_name: string | null;
  client_name: string | null;
  prepared_by: string | null;
  room_width_mm: number;
  room_depth_mm: number;
  seat_target: number;
  unit_system: string;
  item_count: number;
  thumbnail_url: string | null;
  scene_json: unknown;
  status: "draft" | "active" | "archived";
  review_status: "pending" | "approved";
  created_at: string;
  updated_at: string;
};

function formatTimestamp(value: string) {
  return formatAdminPlanTimestamp(value);
}

function sceneReadiness(scene: PlannerSceneEnvelope | null) {
  if (!scene) {
    return {
      hasScene: false,
      hasFabricSnapshot: false,
      itemCount: 0,
      roomLabel: "Unknown",
    };
  }

  const fabricSnapshot = (scene as PlannerSceneEnvelope & { fabricSnapshot?: unknown }).fabricSnapshot;
  return {
    hasScene: true,
    hasFabricSnapshot: Boolean(fabricSnapshot),
    itemCount: scene.items.length,
    roomLabel: `${scene.room.widthMm} × ${scene.room.depthMm} mm`,
  };
}

export default function AdminPlanDetailPageView() {
  const params = useParams<{ id: string }>();
  const planId = params?.id?.trim() ?? "";

  const [plan, setPlan] = useState<AdminPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPlan = useCallback(async () => {
    if (!planId) {return;}
    setLoading(true);
    setError(null);
    try {
      const response = await browserApiFetch(
        apiPath(`/api/admin/plans/${encodeURIComponent(planId)}`),
      );
      if (!response.ok) {
        throw new Error(`Failed to load plan (${response.status})`);
      }
      const payload = (await response.json()) as { plan: AdminPlanDetail };
      setPlan(payload.plan);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load plan");
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {void loadPlan();}
    });
    return () => {
      cancelled = true;
    };
  }, [loadPlan]);

  const scene = useMemo(
    () => (plan ? getPlannerSceneEnvelope(plan.scene_json as PlannerJsonValue) : null),
    [plan],
  );
  const readiness = useMemo(() => sceneReadiness(scene), [scene]);

  const updateStatus = useCallback(async (status: AdminPlanDetail["status"]) => {
    if (!planId) {return;}
    setSaving(true);
    setStatusMessage(null);
    setError(null);
    try {
      const response = await browserApiFetch(
        apiPath(`/api/admin/plans/${encodeURIComponent(planId)}`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to update plan (${response.status})`);
      }
      const payload = (await response.json()) as { plan: AdminPlanDetail };
      setPlan(payload.plan);
      setStatusMessage(`Plan marked as ${status}.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update plan");
    } finally {
      setSaving(false);
    }
  }, [planId]);

  if (!planId) {
    return (
      <div className="admin-page">
        <header className="admin-page__header">
          <div>
            <p className="admin-page__eyebrow">Plan review</p>
            <h1 className="admin-page__title">Plan detail</h1>
          </div>
        </header>
        <AdminAlert variant="error">Missing plan id.</AdminAlert>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Link href="/admin/plans" className="admin-inline-gap admin-type-meta">
        <ArrowLeft size={14} className="admin-icon-static" aria-hidden />
        Back to plans
      </Link>

      {loading ? (
        <div className="admin-status-line" role="status" aria-live="polite">
          <Loader2 size={16} className="admin-icon-spin" aria-hidden />
          Loading plan…
        </div>
      ) : null}

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}

      {statusMessage ? (
        <AdminAlert variant="success" role="status">
          <Check size={14} className="admin-icon-static mr-1 inline" aria-hidden />
          {statusMessage}
        </AdminAlert>
      ) : null}

      {!loading && !plan && !error ? (
        <div className="admin-empty admin-panel" role="status">
          <h2 className="admin-empty__title">Plan not found</h2>
          <p className="admin-empty__copy">
            This plan id is missing from storage, or the review API returned no document.
          </p>
          <div className="admin-empty__actions">
            <Button asChild variant="primary" size="sm">
              <Link href="/admin/plans">Back to plans</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {plan ? (
        <div className="admin-stack--loose">
          <header className="admin-page__header">
            <div>
              <p className="admin-page__eyebrow">Plan review</p>
              <h1 className="admin-page__title">{plan.title}</h1>
              <p className="admin-page__meta">
                {plan.project_name ?? "No project"} · {plan.client_name ?? "No client"} · Updated{" "}
                {formatTimestamp(plan.updated_at)}
              </p>
              <p className="admin-page__meta">
                Status:{" "}
                <span
                  className={
                    plan.status === "active"
                      ? "admin-badge admin-badge--active"
                      : plan.status === "archived"
                        ? "admin-badge admin-badge--hidden"
                        : "admin-badge admin-badge--warn"
                  }
                >
                  {plan.status}
                </span>
              </p>
            </div>
            <div className="admin-page__actions">
              <Button asChild variant="primary" size="sm">
                <Link href={buildPlannerCanvasHref(plan.id)}>
                  <ExternalLink size={14} className="admin-icon-static" aria-hidden />
                  Open in canvas
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving || plan.status === "active"}
                onClick={() => void updateStatus("active")}
              >
                Approve
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving || plan.status === "draft"}
                onClick={() => void updateStatus("draft")}
              >
                Mark draft
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving || plan.status === "archived"}
                onClick={() => void updateStatus("archived")}
              >
                Archive
              </Button>
            </div>
          </header>

          <section className="admin-grid-2--md">
            <div className="admin-panel admin-panel--padded">
              <h2 className="admin-type-section">Document summary</h2>
              <dl className="admin-dl">
                <div className="admin-dl__row">
                  <dt>Room</dt>
                  <dd>{plan.room_width_mm} × {plan.room_depth_mm} mm</dd>
                </div>
                <div className="admin-dl__row">
                  <dt>Items</dt>
                  <dd>{plan.item_count}</dd>
                </div>
                <div className="admin-dl__row">
                  <dt>Seat target</dt>
                  <dd>{plan.seat_target}</dd>
                </div>
                <div className="admin-dl__row">
                  <dt>Units</dt>
                  <dd>{plan.unit_system}</dd>
                </div>
                <div className="admin-dl__row">
                  <dt>Status</dt>
                  <dd>{plan.status}</dd>
                </div>
              </dl>
            </div>

            <div className="admin-panel admin-panel--padded">
              <h2 className="admin-type-section">Fabric scene readiness</h2>
              <dl className="admin-dl">
                <div className="admin-dl__row">
                  <dt>Canonical scene</dt>
                  <dd>{readiness.hasScene ? "Present" : "Missing"}</dd>
                </div>
                <div className="admin-dl__row">
                  <dt>Fabric snapshot</dt>
                  <dd>{readiness.hasFabricSnapshot ? "Present" : "Missing"}</dd>
                </div>
                <div className="admin-dl__row">
                  <dt>Scene items</dt>
                  <dd>{readiness.itemCount}</dd>
                </div>
                <div className="admin-dl__row">
                  <dt>Scene room</dt>
                  <dd>{readiness.roomLabel}</dd>
                </div>
              </dl>
            </div>
          </section>

          {scene?.items?.length ? (
            <section className="admin-panel admin-panel--padded">
              <h2 className="admin-type-section">Scene items</h2>
              <ul className="admin-item-list">
                {(scene.items as Array<{
                  id: string;
                  name: string;
                  category: string;
                  sizeMm: { widthMm: number; depthMm: number };
                }>).slice(0, 12).map((item) => (
                  <li key={item.id}>
                    <span className="admin-type-body--strong">{item.name}</span>
                    <span className="admin-type-muted">
                      {item.category} · {item.sizeMm.widthMm} × {item.sizeMm.depthMm} mm
                    </span>
                  </li>
                ))}
              </ul>
              {scene.items.length > 12 ? (
                <p className="admin-type-soft">Showing first 12 of {scene.items.length} items.</p>
              ) : null}
            </section>
          ) : null}

          <section className="admin-panel admin-panel--padded">
            <h2 className="admin-type-section">Scene JSON</h2>
            <pre
              className="admin-preformatted admin-preformatted--scroll"
              role="region"
              aria-label="Scene JSON"
            >
              {JSON.stringify(plan.scene_json, null, 2)}
            </pre>
          </section>
        </div>
      ) : null}
    </div>
  );
}
