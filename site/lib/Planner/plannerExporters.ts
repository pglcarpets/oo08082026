import type { Canvas } from "fabric";
import jsPDF from "jspdf";
import type { OoFabricObject } from "@planner/lib/plannerTypes";

type PngOptions = {
  dpiMultiplier?: number;
  format?: "png" | "jpeg" | "webp";
  quality?: number;
  enableRetinaScaling?: boolean;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  multiplier?: number;
};

export const exportPNG = (canvas: Canvas, options: PngOptions = {}): string => {
  const multiplier = options.dpiMultiplier || options.multiplier || 2;
  const { dpiMultiplier: _d, multiplier: _m, format: _f, ...rest } = options;
  return canvas.toDataURL({
    format: "png",
    multiplier,
    quality: options.quality ?? 1,
    enableRetinaScaling: options.enableRetinaScaling ?? false,
    ...rest,
  });
};

export const exportSVG = (canvas: Canvas): { svg: string; dataUrl: string } => {
  const svg = canvas.toSVG({ suppressPreamble: false });
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return { svg, dataUrl };
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

export const exportTightPNG = (canvas: Canvas, multiplier = 2): string | null => {
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
  const pad = 4;
  return canvas.toDataURL({
    format: "png",
    multiplier,
    left: Math.max(0, minX - pad),
    top: Math.max(0, minY - pad),
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  });
};
