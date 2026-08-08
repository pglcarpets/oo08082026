"use client";

import { useMemo, useState } from "react";
import { usePlanner } from "@planner/hooks/usePlannerDockBridge";
import { collectSceneGeometry, furnitureToCenterOrigin } from "@planner/lib/fabricGeometryBridge";
import { buildBoqFromGeometry } from "@planner/lib/boq/buildBoqFromGeometry";
import { exportBoqCsv } from "@planner/lib/boq/exportBoqCsv";
import { exportBoqJson } from "@planner/lib/boq/exportBoqJson";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { PlannerHandoffDialog } from "@planner/components/PlannerHandoffDialog";

function downloadText(text: string, filename: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Furniture BOQ from placed catalog items (Port 02). */
export function BoqPanel() {
  const { fabricRef, sceneVersion, scalePxPerMm, sheet } = usePlanner();
  const [handoffOpen, setHandoffOpen] = useState(false);
  const pricingEnabled = isFeatureEnabled("boqPricingEnabled");
  const exportEnabled = isFeatureEnabled("plannerExportBoq");
  const handoffEnabled = isFeatureEnabled("plannerHandoff");

  const boq = useMemo(() => {
    void sceneVersion;
    const c = fabricRef.current;
    if (!c) {
      return buildBoqFromGeometry({
        projectId: "local",
        projectName: "Untitled Plan",
        furniture: [],
        pricingEnabled,
      });
    }
    const scene = collectSceneGeometry(c, scalePxPerMm);
    return buildBoqFromGeometry({
      projectId: "local",
      projectName: "Untitled Plan",
      furniture: scene.furniture.map((f) => {
        const center = furnitureToCenterOrigin(f);
        return {
          id: f.id,
          catalogId: f.catalogId || f.id,
          name: f.label || f.catalogId || f.id,
          widthMm: center.widthMm,
          depthMm: center.depthMm,
        };
      }),
      pricingEnabled,
    });
  }, [fabricRef, sceneVersion, scalePxPerMm, pricingEnabled]);

  void sheet;
  const totalQty = boq.lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <div className="boq-panel" data-testid="boq-panel">
      <div className="boq-panel__head">
        <div className="boq-panel__title">Bill of quantities</div>
        <div className="boq-panel__meta">{totalQty} item{totalQty === 1 ? "" : "s"}</div>
      </div>
      <p className="ai-hint" data-testid="boq-pricing-note">{boq.pricingNote}</p>
      {boq.lines.length === 0 ? (
        <div className="boq-panel__empty" data-testid="boq-empty">
          Place furniture from Catalog to build the BOQ.
        </div>
      ) : (
        <ul className="boq-panel__list" data-testid="review-boq-lines">
          {boq.lines.map((line) => (
            <li key={`${line.catalogId}-${line.sku ?? line.name}`} className="boq-panel__row">
              <span className="boq-panel__name">{line.name}</span>
              <span className="boq-panel__qty">×{line.quantity}</span>
              {pricingEnabled ? (
                <span className="boq-panel__price">
                  {line.priced ? `₹${line.lineTotalInr}` : "—"}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {pricingEnabled && boq.subtotalInr > 0 ? (
        <div className="boq-panel__totals" data-testid="boq-totals">
          <div>Subtotal ₹{boq.subtotalInr}</div>
          <div>GST ₹{boq.gstInr}</div>
          <div><strong>Total ₹{boq.totalInr}</strong></div>
        </div>
      ) : null}
      <div className="boq-panel__actions">
        {exportEnabled ? (
          <>
            <button
              type="button"
              className="btn btn--sm"
              disabled={boq.lines.length === 0}
              onClick={() => downloadText(exportBoqCsv(boq), "planner-boq.csv", "text/csv;charset=utf-8")}
              data-testid="boq-export-csv"
            >
              Export CSV
            </button>
            <button
              type="button"
              className="btn btn--sm"
              disabled={boq.lines.length === 0}
              onClick={() => downloadText(exportBoqJson(boq), "planner-boq.json", "application/json")}
              data-testid="boq-export-json"
            >
              Export JSON
            </button>
          </>
        ) : null}
        {handoffEnabled ? (
          <button
            type="button"
            className="btn btn--primary btn--sm"
            disabled={boq.lines.length === 0}
            onClick={() => setHandoffOpen(true)}
            data-testid="boq-handoff"
          >
            Request quote
          </button>
        ) : null}
      </div>
      {handoffOpen ? (
        <PlannerHandoffDialog boq={boq} onClose={() => setHandoffOpen(false)} />
      ) : null}
    </div>
  );
}

export default BoqPanel;
