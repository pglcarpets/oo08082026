"use client";

import { useEffect, useRef, useState } from "react";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";
import { usePlannerUIStore } from "@planner/store/plannerUiStore";
import { heuristicSpaceSuggest } from "@planner/lib/ai/spaceSuggest";
import { planPlacements } from "@planner/lib/ai/applySuggestedLayout";
import {
  sketchObjectsToApplyPayload,
  type SketchPlanObject,
  type SketchRoomMm,
  type SketchToPlanUiState,
  type SketchWallMm,
} from "@planner/lib/ai/sketchToPlanShared";
import { SketchToPlanDialog } from "@planner/components/SketchToPlanDialog";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";
import { isFeatureEnabled } from "@/lib/featureFlags";

const PROMPTS = [
  "4-seat open office",
  "6 desk bay",
  "small 2-person room",
];

const SKETCH_PROMPTS = [
  "Trace outer walls of the room",
  "Office floor plan walls only",
  "Include interior partitions",
];

type PlannerAiPanelProps = {
  onClose: () => void;
  onApplyPlacements?: (
    ops: ReturnType<typeof planPlacements>,
    room: { widthMm: number; depthMm: number },
  ) => void;
  onApplySketchGeometry?: (payload: {
    walls: SketchWallMm[];
    rooms: SketchRoomMm[];
  }) => void;
};

/** Floor-planner AI assist — space-suggest + optional sketch-to-plan (Port 04). */
export function PlannerAiPanel({
  onClose,
  onApplyPlacements,
  onApplySketchGeometry,
}: PlannerAiPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [seatTarget, setSeatTarget] = useState(4);
  const [sketchPrompt, setSketchPrompt] = useState("Trace outer walls of the room");
  const [includeRooms, setIncludeRooms] = useState(true);
  const [sketchState, setSketchState] = useState<SketchToPlanUiState>({ status: "idle" });
  const fileRef = useRef<HTMLInputElement | null>(null);
  const showToast = usePlannerUIStore((s) => s.showToast);
  const spaceSuggestOn = isFeatureEnabled("plannerAiSpaceSuggest");
  const sketchOn = isFeatureEnabled("sketchToPlan");

  // Same defect class the Studio audit found and fixed in
  // ui/StudioFloatingPanel.tsx — Escape had no wiring here at all.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const run = () => {
    if (!spaceSuggestOn) {
      showToast("AI space-suggest is disabled in feature flags", "error");
      return;
    }
    const result = heuristicSpaceSuggest({
      seatTarget,
      prompt: prompt.trim() || undefined,
    });
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    const ops = planPlacements(result.layout, {
      "desk-a": { widthMm: 1200, depthMm: 600, name: "Desk A" },
    });
    if (ops.length === 0) {
      showToast("No placements generated", "error");
      return;
    }
    onApplyPlacements?.(ops, result.layout.room);
    showToast(`Suggested ${ops.length} desk(s) (${result.source})`);
  };

  const runSketch = async (file: File) => {
    if (!sketchOn) {
      showToast("Sketch-to-plan is disabled in feature flags", "error");
      return;
    }
    const fileName = file.name || "sketch.png";
    setSketchState({ status: "converting", fileName });
    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error ?? new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const res = await browserApiFetch(apiPath("/api/Planner/sketch-to-plan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl,
          fileName,
          prompt: sketchPrompt.trim() || "Convert sketch to walls",
          includeRooms,
        }),
      });
      const body = (await res.json()) as {
        success?: boolean;
        status?: string;
        fileName?: string;
        objects?: SketchPlanObject[];
        warnings?: string[];
        reason?: string;
        message?: string;
        error?: { message?: string };
      };

      if (!res.ok || body.success === false) {
        setSketchState({
          status: "error",
          fileName,
          message: body.error?.message || body.message || `Conversion failed (${res.status})`,
        });
        return;
      }

      if (body.status === "fallback") {
        setSketchState({
          status: "fallback",
          fileName,
          reason: (body.reason as "missing_provider") || "server_error",
          message: body.message || "Conversion unavailable",
          underlayDataUrl: imageDataUrl,
        });
        return;
      }

      if (body.status === "preview" && Array.isArray(body.objects)) {
        setSketchState({
          status: "preview",
          fileName,
          objects: body.objects,
          warnings: body.warnings ?? [],
          underlayDataUrl: imageDataUrl,
        });
        return;
      }

      setSketchState({
        status: "error",
        fileName,
        message: "Unexpected response from sketch-to-plan",
      });
    } catch (e) {
      setSketchState({
        status: "error",
        fileName,
        message: e instanceof Error ? e.message : "Sketch conversion failed",
      });
    }
  };

  const acceptSketch = () => {
    if (sketchState.status !== "preview") return;
    const payload = sketchObjectsToApplyPayload(sketchState.objects);
    if (payload.walls.length === 0 && payload.rooms.length === 0) {
      showToast("No geometry to apply", "error");
      setSketchState({ status: "idle" });
      return;
    }
    onApplySketchGeometry?.(payload);
    showToast(
      `Applied ${payload.walls.length} wall(s)` +
        (payload.rooms.length ? `, ${payload.rooms.length} room(s)` : ""),
    );
    setSketchState({ status: "idle" });
  };

  return (
    <>
      <div className="planner-ai-float" data-testid="planner-ai-panel">
        <header className="planner-ai-float__head">
          <strong>AI assist</strong>
          <button
            type="button"
            className="planner-ai-float__close"
            aria-label="Close AI"
            onClick={onClose}
            data-testid="planner-ai-close"
          >
            <PhIcon name="x" size={16} />
          </button>
        </header>

        {spaceSuggestOn ? (
          <>
            <label className="prop-row">
              <span className="prop-row__label">Seats</span>
              <input
                className="input"
                type="number"
                min={1}
                max={40}
                value={seatTarget}
                onChange={(e) => setSeatTarget(Math.max(1, Number(e.target.value) || 1))}
                data-testid="planner-ai-seats"
              />
            </label>
            <textarea
              className="input planner-ai-float__prompt"
              placeholder="Optional notes for layout…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              data-testid="planner-ai-prompt"
              rows={2}
              aria-label="Layout notes"
            />
            <div className="planner-ai-float__chips">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="planner-ai-float__chip"
                  onClick={() => setPrompt(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={run}
              data-testid="planner-ai-run"
            >
              Suggest layout
            </button>
          </>
        ) : null}

        {sketchOn ? (
          <div className="planner-ai-float__sketch" data-testid="planner-sketch-section">
            <div className="planner-ai-float__head" style={{ marginTop: 8 }}>
              <strong>Sketch to plan</strong>
            </div>
            <textarea
              className="input planner-ai-float__prompt"
              placeholder="How should walls be traced…"
              value={sketchPrompt}
              onChange={(e) => setSketchPrompt(e.target.value)}
              data-testid="planner-sketch-prompt"
              rows={2}
              aria-label="Sketch tracing notes"
            />
            <div className="planner-ai-float__chips">
              {SKETCH_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="planner-ai-float__chip"
                  onClick={() => setSketchPrompt(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <label className="prop-row">
              <span className="prop-row__label">Rooms</span>
              <input
                type="checkbox"
                checked={includeRooms}
                onChange={(e) => setIncludeRooms(e.target.checked)}
                data-testid="planner-sketch-rooms"
              />
            </label>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => fileRef.current?.click()}
              data-testid="planner-sketch-upload"
            >
              Upload sketch…
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              aria-label="Upload sketch image"
              data-testid="planner-sketch-file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void runSketch(file);
              }}
            />
          </div>
        ) : null}
      </div>

      <SketchToPlanDialog
        state={sketchState}
        onAccept={acceptSketch}
        onReject={() => setSketchState({ status: "idle" })}
        onDismiss={() => setSketchState({ status: "idle" })}
      />
    </>
  );
}

export default PlannerAiPanel;
