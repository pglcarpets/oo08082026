"use client";
import { OO_DRAW } from "@planner/lib/plannerPalette";
import React, { type ReactNode } from "react";
import { PropertiesPanel } from "@planner/components/PlannerPropertiesPanel";
import { LayersPanel } from "@planner/components/PlannerLayersPanel";
import { ColorPalette } from "@planner/components/PlannerColorPalette";
import { SheetSettings } from "@planner/components/PlannerSheetSettings";
import CatalogRail from "@planner/components/PlannerCatalogRail";
import { BoqPanel } from "@planner/components/PlannerBoqPanel";
import { ValidationPanel } from "@planner/components/PlannerValidationPanel";
import { usePlanner } from "@planner/hooks/usePlannerDockBridge";

const pad = (children: ReactNode) => <div className="dock-panel">{children}</div>;

export const PlannerCatalogPanel = () => {
  const { placeFurnitureItem } = usePlanner();
  return (
    <div className="dock-panel dock-panel--catalog">
      <CatalogRail onItemClick={placeFurnitureItem} />
    </div>
  );
};

export const PlannerSheetPanel = () => {
  const { sheet, setSheet } = usePlanner();
  return pad(<SheetSettings sheet={sheet} onChange={setSheet} />);
};

export const PlannerPropsPanel = () => {
  const { propObj, scalePxPerMm, setObjectProp } = usePlanner();
  return pad(<PropertiesPanel selected={propObj} scalePxPerMm={scalePxPerMm} onChange={setObjectProp} />);
};

export const PlannerLayersPanel = () => {
  const { layers, selectedIds, layerSelect, layerToggleVisible, layerToggleLock, layerDelete, layerReorder } = usePlanner();
  return pad(
    <LayersPanel
      objects={layers}
      selectedId={selectedIds[0]}
      onSelect={layerSelect}
      onToggleVisible={layerToggleVisible}
      onToggleLock={layerToggleLock}
      onDelete={layerDelete}
      onReorder={layerReorder}
    />
  );
};

export const PlannerColorPanel = () => {
  const { propObj, applyFill, applyStroke } = usePlanner();
  return pad(
    <ColorPalette
      fill={propObj?.__props?.fill || "transparent"}
      stroke={propObj?.__props?.stroke || OO_DRAW.stroke}
      onFillChange={applyFill}
      onStrokeChange={applyStroke}
    />
  );
};

export const PlannerBoqPanel = () => pad(<BoqPanel />);

export const PlannerValidationPanel = () => pad(<ValidationPanel />);
