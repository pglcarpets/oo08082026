"use client";
import React from "react";
import { PhIcon } from "@studio/components/ui/StudioPhIcon";

type ViewportControlsProps = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onZoom100: () => void;
  autoFit?: boolean;
  onToggleAutoFit?: () => void;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

export const ViewportControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  onZoom100,
  autoFit = false,
  onToggleAutoFit,
  fullscreen = false,
  onToggleFullscreen,
}: ViewportControlsProps) => (
  <div className="viewport-controls" role="group" aria-label="Viewport controls" data-testid="viewport-controls">
    <button type="button" className="vp-btn" onClick={onZoomOut} title="Zoom out (−)" aria-label="Zoom out" data-testid="vp-zoom-out"><PhIcon name="minus" size={16} /></button>
    <button type="button" className="vp-btn vp-btn--wide" onClick={onZoom100} title="Zoom 100% / home view (0)" aria-label={`Zoom ${Math.round(zoom * 100)} percent`} data-testid="vp-zoom-100">{Math.round(zoom * 100)}%</button>
    <button type="button" className="vp-btn" onClick={onZoomIn} title="Zoom in (+)" aria-label="Zoom in" data-testid="vp-zoom-in"><PhIcon name="plus" size={16} /></button>
    <div className="vp-sep" aria-hidden="true" />
    <button type="button" className="vp-btn" onClick={onFit} title="Fit to content (F)" aria-label="Fit to content" data-testid="vp-fit">Fit</button>
    <button
      className="vp-btn"
      data-active={autoFit}
      onClick={onToggleAutoFit}
      title="Auto-fit when the window resizes"
      aria-label="Auto-fit when the window resizes"
      data-testid="vp-auto-fit"
      type="button"
    >
      Auto
    </button>
    <div className="vp-sep" aria-hidden="true" />
    <button
      className="vp-btn"
      data-active={fullscreen}
      onClick={onToggleFullscreen}
      title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
      aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
      data-testid="vp-fullscreen"
      type="button"
    >
      <PhIcon name={fullscreen ? "minimize" : "maximize"} size={16} />
    </button>
  </div>
);

export default ViewportControls;
