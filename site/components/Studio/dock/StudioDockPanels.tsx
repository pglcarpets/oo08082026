"use client";
import { OO_DRAW } from "@studio/lib/studioPalette";
import React, { type ReactNode } from "react";
import { PropertiesPanel } from "@studio/components/StudioPropertiesPanel";
import { LayersPanel } from "@studio/components/StudioLayersPanel";
import { ColorPalette } from "@studio/components/StudioColorPalette";
import { AiPanel } from "@studio/components/StudioAiPanel";
import { useStudio } from "@studio/hooks/useStudioDockBridge";

const pad = (children: ReactNode) => <div className="dock-panel">{children}</div>;

export const StudioPropsPanel = () => {
  const { propObj, scalePxPerMm, setObjectProp } = useStudio();
  return pad(<PropertiesPanel selected={propObj} scalePxPerMm={scalePxPerMm} onChange={setObjectProp} />);
};

export const StudioColorPanel = () => {
  const { propObj, applyFill, applyStroke, drawFill, drawStroke, activeTool } = useStudio();
  const fill =
    typeof propObj?.__props?.fill === "string" ? propObj.__props.fill : drawFill;
  const stroke =
    typeof propObj?.__props?.stroke === "string" ? propObj.__props.stroke : drawStroke;
  const preferredMode =
    activeTool === "line" ||
    activeTool === "freehand" ||
    activeTool === "pen" ||
    activeTool === "brush" ||
    activeTool === "polygon" ||
    activeTool === "arrow" ||
    activeTool === "arc"
      ? "stroke"
      : undefined;
  return pad(
    <ColorPalette
      fill={fill || OO_DRAW.fill}
      stroke={stroke || OO_DRAW.stroke}
      onFillChange={applyFill}
      onStrokeChange={applyStroke}
      preferredMode={preferredMode}
    />
  );
};

export const StudioAiPanel = () => {
  const { onAiGenerate, onAiSuggest, onAiRestyle, generating, hasSvg, hasSelection } = useStudio();
  return pad(
    <AiPanel
      onGenerate={onAiGenerate}
      onSuggest={onAiSuggest}
      onRestyle={onAiRestyle}
      hasSelection={hasSelection}
      hasSvg={hasSvg}
      generating={generating}
    />
  );
};

export const StudioLayersPanel = () => {
  const { layers, selectedIds, layerSelect, layerToggleVisible, layerToggleLock, layerDelete, layerReorder } = useStudio();
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
