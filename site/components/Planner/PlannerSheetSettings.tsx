"use client";
import React, { useRef } from "react";
import { usePlannerUIStore } from "@planner/store/plannerUiStore";
import type { PlannerSheet } from "@planner/lib/plannerTypes";
import {
  isSupportedFloorPlanImage,
  scaleFactorFromKnownWidth,
  UNDERLAY_KNOWN_WIDTH_5M_MM,
  UNDERLAY_KNOWN_WIDTH_10M_MM,
} from "@planner/lib/underlayCalibrate";
import { isFeatureEnabled } from "@/lib/featureFlags";

type SheetSettingsProps = {
  sheet: PlannerSheet;
  onChange: (sheet: PlannerSheet) => void;
  onUnderlayImage?: (dataUrl: string, mmPerPx: number) => void;
};

export const SheetSettings = ({ sheet, onChange, onUnderlayImage }: SheetSettingsProps) => {
  const gridSize = usePlannerUIStore((s) => s.gridSize);
  const setGridSize = usePlannerUIStore((s) => s.setGridSize);
  const underlayEnabled = isFeatureEnabled("plannerUnderlay") && isFeatureEnabled("floorPlanImport");
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div data-testid="sheet-settings">
      <div className="prop-row">
        <label className="prop-row__label" htmlFor="planner-sheet-preset">
          Sheet
        </label>
        <select
          id="planner-sheet-preset"
          className="select"
          value={`${sheet.width_mm}x${sheet.height_mm}`}
          onChange={(e) => {
            const [w, h] = e.target.value.split("x").map(Number);
            onChange({ ...sheet, width_mm: w, height_mm: h });
          }}
          data-testid="sheet-preset"
        >
          <option value="5000x3000">Small · 5×3m</option>
          <option value="10000x7000">Medium · 10×7m</option>
          <option value="15000x10000">Large · 15×10m</option>
          <option value="20000x14000">XL · 20×14m</option>
          <option value="30000x20000">XXL · 30×20m</option>
          <option value="40000x30000">Custom · 40×30m</option>
        </select>
      </div>
      <div className="prop-row">
        <label className="prop-row__label" htmlFor="planner-sheet-w">
          Width
        </label>
        <div className="prop-row__inputs">
          <input
            id="planner-sheet-w"
            className="input"
            type="number"
            step="100"
            value={sheet.width_mm}
            onChange={(e) =>
              onChange({ ...sheet, width_mm: parseFloat(e.target.value) || 100 })
            }
            data-testid="sheet-w"
          />
          <div style={{ fontSize: 11, color: "var(--text-subtle)", alignSelf: "center" }}>
            mm
          </div>
        </div>
      </div>
      <div className="prop-row">
        <label className="prop-row__label" htmlFor="planner-sheet-h">
          Height
        </label>
        <div className="prop-row__inputs">
          <input
            id="planner-sheet-h"
            className="input"
            type="number"
            step="100"
            value={sheet.height_mm}
            onChange={(e) =>
              onChange({
                ...sheet,
                height_mm: parseFloat(e.target.value) || 100,
              })
            }
            data-testid="sheet-h"
          />
          <div style={{ fontSize: 11, color: "var(--text-subtle)", alignSelf: "center" }}>
            mm
          </div>
        </div>
      </div>
      <div className="prop-row">
        <label className="prop-row__label" htmlFor="planner-grid-step">
          Grid step
        </label>
        <div className="prop-row__inputs">
          <input
            id="planner-grid-step"
            className="input"
            type="number"
            step="10"
            value={gridSize}
            onChange={(e) =>
              setGridSize(Math.max(10, parseFloat(e.target.value) || 100))
            }
            data-testid="grid-step"
          />
          <div style={{ fontSize: 11, color: "var(--text-subtle)", alignSelf: "center" }}>
            mm
          </div>
        </div>
      </div>
      {underlayEnabled ? (
        <div className="prop-row" data-testid="sheet-underlay">
          <span className="prop-row__label">Floor plan</span>
          <div className="prop-row__inputs" style={{ flexDirection: "column", gap: 6 }}>
            <button
              type="button"
              className="btn btn--sm"
              data-testid="sheet-underlay-import"
              onClick={() => fileRef.current?.click()}
            >
              Import image
            </button>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className="btn btn--sm"
                data-testid="sheet-underlay-5m"
                onClick={() => {
                  // Preset stored as data attribute for host; import uses 5m when selected next.
                  fileRef.current?.setAttribute("data-known-width-mm", String(UNDERLAY_KNOWN_WIDTH_5M_MM));
                  fileRef.current?.click();
                }}
              >
                5 m width
              </button>
              <button
                type="button"
                className="btn btn--sm"
                data-testid="sheet-underlay-10m"
                onClick={() => {
                  fileRef.current?.setAttribute("data-known-width-mm", String(UNDERLAY_KNOWN_WIDTH_10M_MM));
                  fileRef.current?.click();
                }}
              >
                10 m width
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              aria-label="Import floor plan image"
              data-testid="sheet-underlay-input"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file || !onUnderlayImage) return;
                if (!isSupportedFloorPlanImage(file)) return;
                const known = Number(fileRef.current?.getAttribute("data-known-width-mm") || UNDERLAY_KNOWN_WIDTH_10M_MM);
                const dataUrl = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(String(reader.result));
                  reader.onerror = () => reject(reader.error);
                  reader.readAsDataURL(file);
                });
                const img = new Image();
                await new Promise<void>((resolve, reject) => {
                  img.onload = () => resolve();
                  img.onerror = () => reject(new Error("Image load failed"));
                  img.src = dataUrl;
                });
                const mmPerPx = scaleFactorFromKnownWidth({
                  imageWidthPx: img.naturalWidth || img.width,
                  knownWidthMm: known,
                });
                onUnderlayImage(dataUrl, mmPerPx);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SheetSettings;
