"use client";
// Minimal ASCII DXF R12 exporter for a Fabric.ts canvas.
import type { Canvas, Group, IText, Line, Polyline, Textbox } from "fabric";
import type { OoFabricObject } from "@studio/lib/studioTypes";

const LAYERS = {
  wall: { name: "WALLS", color: 7 },
  furniture: { name: "FURNITURE", color: 3 },
  door: { name: "DOORS", color: 5 },
  window: { name: "WINDOWS", color: 4 },
  dimension: { name: "DIMENSIONS", color: 6 },
  text: { name: "TEXT", color: 2 },
  misc: { name: "MISC", color: 8 },
} as const;

type LayerKey = keyof typeof LAYERS;
type PointMm = { x: number; y: number };

const DEFAULT_LAYER = "MISC";

const pxToMm = (px: number, pxPerMm: number): number => px / pxPerMm;

const g = (code: number | string, value: number | string): string => `${code}\n${value}\n`;

const openSection = (name: string): string => `${g(0, "SECTION")}${g(2, name)}`;
const closeSection = (): string => g(0, "ENDSEC");

const header = (): string => (
  openSection("HEADER") +
  g(9, "$INSUNITS") + g(70, 4) +
  g(9, "$MEASUREMENT") + g(70, 1) +
  g(9, "$LUNITS") + g(70, 2) +
  closeSection()
);

const tablesSection = (): string => {
  const layers = Object.values(LAYERS);
  let out = openSection("TABLES");
  out += g(0, "TABLE") + g(2, "LAYER") + g(70, layers.length);
  for (const l of layers) {
    out += g(0, "LAYER") + g(2, l.name) + g(70, 0) + g(62, l.color) + g(6, "CONTINUOUS");
  }
  out += g(0, "ENDTAB");
  out += closeSection();
  return out;
};

const dxfLine = (x1: number, y1: number, x2: number, y2: number, layer: string): string => (
  g(0, "LINE") + g(8, layer) +
  g(10, x1.toFixed(3)) + g(20, y1.toFixed(3)) + g(30, "0.0") +
  g(11, x2.toFixed(3)) + g(21, y2.toFixed(3)) + g(31, "0.0")
);

const dxfCircle = (cx: number, cy: number, r: number, layer: string): string => (
  g(0, "CIRCLE") + g(8, layer) +
  g(10, cx.toFixed(3)) + g(20, cy.toFixed(3)) + g(30, "0.0") +
  g(40, r.toFixed(3))
);

const dxfEllipse = (cx: number, cy: number, rx: number, ry: number, layer: string): string => {
  if (rx <= 0 || ry <= 0) return "";
  const major = Math.max(rx, ry);
  const minor = Math.min(rx, ry);
  const isXMajor = rx >= ry;
  const mx = isXMajor ? major : 0;
  const my = isXMajor ? 0 : major;
  return (
    g(0, "ELLIPSE") + g(8, layer) +
    g(10, cx.toFixed(3)) + g(20, cy.toFixed(3)) + g(30, "0.0") +
    g(11, mx.toFixed(3)) + g(21, my.toFixed(3)) + g(31, "0.0") +
    g(40, (minor / major).toFixed(6)) +
    g(41, "0.0") + g(42, (Math.PI * 2).toFixed(6))
  );
};

const dxfPolyline = (points: PointMm[], layer: string, closed = false): string => {
  if (!points || points.length < 2) return "";
  let out = g(0, "LWPOLYLINE") + g(8, layer) + g(90, points.length) + g(70, closed ? 1 : 0);
  for (const p of points) {
    out += g(10, p.x.toFixed(3)) + g(20, p.y.toFixed(3));
  }
  return out;
};

const dxfText = (x: number, y: number, text: string, height: number, layer: string): string => (
  g(0, "TEXT") + g(8, layer) +
  g(10, x.toFixed(3)) + g(20, y.toFixed(3)) + g(30, "0.0") +
  g(40, height.toFixed(3)) + g(1, sanitizeText(text))
);

const sanitizeText = (t: unknown): string => (t === null || t === undefined ? "" : String(t).replace(/[\n\r]+/g, " ").slice(0, 250));

const layerFor = (o: OoFabricObject): string => {
  const kind = o.data?.kind;
  if (kind && kind in LAYERS) return LAYERS[kind as LayerKey].name;
  if (o.type === "i-text" || o.type === "text" || o.type === "textbox") return LAYERS.text.name;
  return DEFAULT_LAYER;
};

const rectPoints = (b: { left: number; top: number; width: number; height: number }, P: (x: number, y: number) => PointMm): PointMm[] => [
  P(b.left, b.top),
  P(b.left + b.width, b.top),
  P(b.left + b.width, b.top + b.height),
  P(b.left, b.top + b.height),
];

const objectToDxf = (o: OoFabricObject, pxPerMm: number): string => {
  if (!o || o.excludeFromExport) return "";
  if (o.data?.isGridLine || o.data?.isSheet || o.data?.isGuide) return "";
  const layer = layerFor(o);
  const P = (x: number, y: number): PointMm => ({ x: pxToMm(x, pxPerMm), y: -pxToMm(y, pxPerMm) });

  if (o.type === "line") {
    const line = o as Line;
    const p1 = P(line.x1 || 0, line.y1 || 0);
    const p2 = P(line.x2 || 0, line.y2 || 0);
    return dxfLine(p1.x, p1.y, p2.x, p2.y, layer);
  }

  if (o.type === "rect") {
    const b = o.getBoundingRect();
    return dxfPolyline(rectPoints(b, P), layer, true);
  }

  if (o.type === "circle") {
    const b = o.getBoundingRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    const r = Math.min(b.width, b.height) / 2;
    const c = P(cx, cy);
    return dxfCircle(c.x, c.y, pxToMm(r, pxPerMm), layer);
  }

  if (o.type === "ellipse") {
    const b = o.getBoundingRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    const c = P(cx, cy);
    return dxfEllipse(c.x, c.y, pxToMm(b.width / 2, pxPerMm), pxToMm(b.height / 2, pxPerMm), layer);
  }

  if (o.type === "polyline" || o.type === "polygon") {
    const poly = o as Polyline;
    const pts = (poly.points || []).map((pt) => {
      const worldX = (o.left || 0) + (pt.x - (poly.pathOffset?.x || 0)) * (o.scaleX || 1);
      const worldY = (o.top || 0) + (pt.y - (poly.pathOffset?.y || 0)) * (o.scaleY || 1);
      return P(worldX, worldY);
    });
    return dxfPolyline(pts, layer, o.type === "polygon");
  }

  if (o.type === "i-text" || o.type === "text" || o.type === "textbox") {
    const textObj = o as IText | Textbox;
    const b = o.getBoundingRect();
    const c = P(b.left, b.top + b.height);
    const h = pxToMm(textObj.fontSize || 12, pxPerMm);
    return dxfText(c.x, c.y, String(textObj.text || ""), h, layer);
  }

  if (o.type === "path") {
    const b = o.getBoundingRect();
    return dxfPolyline(rectPoints(b, P), layer, true);
  }

  if (o.type === "image") {
    const b = o.getBoundingRect();
    let out = dxfPolyline(rectPoints(b, P), layer, true);
    if (o.data?.label) {
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      const c = P(cx, cy);
      out += dxfText(c.x, c.y, String(o.data.label), Math.max(80, pxToMm(Math.min(b.width, b.height) * 0.15, pxPerMm)), LAYERS.text.name);
    }
    return out;
  }

  if (o.type === "group" || o.type === "activeselection") {
    const parts: string[] = [];
    const group = o as Group;
    const children = group.getObjects ? group.getObjects() : [];
    const groupB = o.getBoundingRect();
    for (const ch of children) {
      const chB = ch.getBoundingRect();
      const proxy = Object.create(ch) as OoFabricObject;
      proxy.getBoundingRect = () => chB;
      const dxf = objectToDxf(proxy, pxPerMm);
      if (dxf) parts.push(dxf);
    }
    if (parts.length === 0) {
      return dxfPolyline(rectPoints(groupB, P), layer, true);
    }
    return parts.join("");
  }

  return "";
};

export const canvasToDxf = (canvas: Canvas, { pxPerMm }: { pxPerMm: number }): string => {
  if (!canvas || !pxPerMm) throw new Error("canvasToDxf requires canvas + pxPerMm");
  const entities = canvas.getObjects().map((obj) => objectToDxf(obj as OoFabricObject, pxPerMm)).filter(Boolean);
  const body = openSection("ENTITIES") + entities.join("") + closeSection();
  return header() + tablesSection() + body + g(0, "EOF").trimEnd();
};

export const downloadDxf = (canvas: Canvas, filename: string, { pxPerMm }: { pxPerMm: number }): void => {
  const dxf = canvasToDxf(canvas, { pxPerMm });
  const blob = new Blob([dxf], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".dxf") ? filename : `${filename}.dxf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
