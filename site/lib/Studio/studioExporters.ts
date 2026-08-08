import type { Canvas } from "fabric";
import jsPDF from "jspdf";
import type { OoFabricObject } from "@studio/lib/studioTypes";

export type RasterExportFormat = "png" | "jpeg" | "webp";

type RasterOptions = {
  dpiMultiplier?: number;
  format?: RasterExportFormat;
  quality?: number;
  enableRetinaScaling?: boolean;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  multiplier?: number;
};

const FABRIC_JSON_PROPS = ["data"] as const;

/** Padding around content for tight raster exports (scene units / CSS px at zoom 1). */
export const TIGHT_EXPORT_PAD = 4;

type ViewportMatrix = [number, number, number, number, number, number];

/** Raster export via Fabric `toDataURL` (honours format). */
export const exportRaster = (canvas: Canvas, options: RasterOptions = {}): string => {
  const multiplier = options.dpiMultiplier || options.multiplier || 2;
  const format = options.format ?? "png";
  const { dpiMultiplier: _d, multiplier: _m, format: _f, ...rest } = options;
  return canvas.toDataURL({
    format,
    multiplier,
    quality: options.quality ?? (format === "png" ? 1 : 0.92),
    enableRetinaScaling: options.enableRetinaScaling ?? false,
    ...rest,
  });
};

/** PNG export (default format). */
export const exportPNG = (canvas: Canvas, options: RasterOptions = {}): string =>
  exportRaster(canvas, { ...options, format: "png" });

/** JPG/JPEG export. */
export const exportJPEG = (canvas: Canvas, options: RasterOptions = {}): string =>
  exportRaster(canvas, { ...options, format: "jpeg", quality: options.quality ?? 0.92 });

/** Alias used in UI copy. */
export const exportJPG = exportJPEG;

export const exportSVG = (canvas: Canvas): { svg: string; dataUrl: string } => {
  const svg = canvas.toSVG({ suppressPreamble: false });
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return { svg, dataUrl };
};

/** Fabric canvas JSON (includes custom `data` fields). Fabric v7: use `toObject`. */
export const exportCanvasJson = (
  canvas: Canvas,
  propertiesToInclude: string[] = [...FABRIC_JSON_PROPS],
): Record<string, unknown> => {
  // Prefer shared serialize helper when available; keep local path for exporters purity.
  return canvas.toObject(propertiesToInclude) as Record<string, unknown>;
};

export const canvasJsonToDownloadText = (json: unknown): string =>
  `${JSON.stringify(json, null, 2)}\n`;

export const canvasJsonToDataUrl = (json: unknown): string => {
  const text = typeof json === "string" ? json : canvasJsonToDownloadText(json);
  return `data:application/json;charset=utf-8,${encodeURIComponent(text)}`;
};

export const exportPDF = (canvas: Canvas, filename = "floor-plan.pdf"): void => {
  const dataUrl = exportPNG(canvas, { dpiMultiplier: 3 });
  const width = canvas.getWidth();
  const height = canvas.getHeight();
  const orientation = width > height ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "px", format: [width, height] });
  pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
  pdf.save(filename);
};

export const downloadDataUrl = (dataUrl: string, filename: string): void => {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const downloadText = (
  text: string,
  filename: string,
  mime = "application/json;charset=utf-8",
): void => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  try {
    downloadDataUrl(url, filename);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
};

/**
 * Scene-space axis-aligned bounds of exportable objects (excludes grid).
 * Does **not** clamp to ≥0 — Studio’s viewport is origin-centred, so furniture
 * often sits in negative scene space. Clamping left/top was cutting exports.
 */
export function contentBounds(canvas: Canvas): {
  left: number;
  top: number;
  width: number;
  height: number;
} | null {
  const objs = canvas.getObjects().filter((raw) => {
    const o = raw as OoFabricObject;
    return !o.data?.isGridLine && !o.excludeFromExport;
  });
  if (objs.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  objs.forEach((o) => {
    const b = o.getBoundingRect();
    minX = Math.min(minX, b.left);
    minY = Math.min(minY, b.top);
    maxX = Math.max(maxX, b.left + b.width);
    maxY = Math.max(maxY, b.top + b.height);
  });
  const pad = TIGHT_EXPORT_PAD;
  return {
    left: minX - pad,
    top: minY - pad,
    width: Math.max(1, maxX - minX + pad * 2),
    height: Math.max(1, maxY - minY + pad * 2),
  };
}

/**
 * Fabric `toDataURL` crop (`left`/`top`) is applied against the current
 * viewport matrix (`vp[4] - left`). Studio keeps a centred pan + user zoom, so
 * scene-space bounds only match the crop API when the viewport is identity.
 * Temporarily reset VPT for measure+export so resolution is zoom-independent
 * and negative scene coords are not clipped.
 */
function withIdentityViewport<T>(canvas: Canvas, fn: () => T): T {
  const prev = (
    canvas.viewportTransform
      ? ([...canvas.viewportTransform] as ViewportMatrix)
      : ([1, 0, 0, 1, 0, 0] as ViewportMatrix)
  );
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  try {
    return fn();
  } finally {
    canvas.setViewportTransform(prev);
  }
}

export const exportTightRaster = (
  canvas: Canvas,
  options: RasterOptions = {},
): string | null => {
  return withIdentityViewport(canvas, () => {
    const bounds = contentBounds(canvas);
    if (!bounds) return null;
    return exportRaster(canvas, {
      ...options,
      format: options.format ?? "png",
      multiplier: options.dpiMultiplier || options.multiplier || 2,
      ...bounds,
    });
  });
};

export const exportTightPNG = (canvas: Canvas, multiplier = 2): string | null =>
  exportTightRaster(canvas, { format: "png", multiplier });

export const exportTightJPEG = (canvas: Canvas, multiplier = 2): string | null =>
  exportTightRaster(canvas, { format: "jpeg", multiplier, quality: 0.92 });
