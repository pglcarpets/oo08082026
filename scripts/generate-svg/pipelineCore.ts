/**
 * scripts/generate-svg/pipelineCore.ts
 *
 * LIVE publish compile core (S2/S3): boolean BlockDescriptor IR → SVG string
 * (sanitize + optimise). Paired with asset-engine normalizeDescriptorForPipeline (S1).
 * generate-svg.mjs is the thin CLI/write wrapper; compileSvgForPublish is the
 * no-I/O publish entry. V1 svgCompiler.server is reference-only — not this path.
 * GS: BP-03, anti-copy.
 */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Resolve __dirname in ES-module context.
const _require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// ── External deps (CJS bridge — robust under Next/turbopack server bundles) ──

type PolygonClippingApi = {
  union: typeof import("polygon-clipping").union;
  intersection: typeof import("polygon-clipping").intersection;
  difference: typeof import("polygon-clipping").difference;
  xor: typeof import("polygon-clipping").xor;
};

/**
 * Next/webpack sometimes surface CJS as `{ default: { union, difference, … } }`
 * or resolve createRequire from a chunk URL so ops go missing →
 * "Unknown boolean variant difference". Prefer a bag that actually has difference.
 */
function loadPolygonClipping(): PolygonClippingApi {
  const candidates: unknown[] = [];
  try {
    candidates.push(_require("polygon-clipping"));
  } catch {
    /* try absolute below */
  }
  try {
    // scripts/generate-svg → repo-root node_modules (hoisted)
    const abs = pathResolveSafe(
      __dirname,
      "..",
      "..",
      "..",
      "node_modules",
      "polygon-clipping",
    );
    candidates.push(_require(abs));
  } catch {
    /* ignore */
  }

  for (const raw of candidates) {
    if (!raw || typeof raw !== "object") continue;
    const rec = raw as Record<string, unknown>;
    const bags = [rec, rec.default].filter(Boolean);
    for (const bag of bags) {
      if (!bag || typeof bag !== "object") continue;
      const b = bag as Record<string, unknown>;
      if (
        typeof b.union === "function" &&
        typeof b.intersection === "function" &&
        typeof b.difference === "function" &&
        typeof b.xor === "function"
      ) {
        return b as unknown as PolygonClippingApi;
      }
    }
  }

  throw new Error(
    "polygon-clipping boolean ops unavailable (union/intersection/difference/xor). " +
      "Check repo-root node_modules/polygon-clipping and Next serverExternalPackages.",
  );
}

function pathResolveSafe(...parts: string[]): string {
  // local require of path to avoid top-level path import churn in ESM
  const nodePath = _require("node:path") as typeof import("node:path");
  return nodePath.resolve(...parts);
}

const polygonClipping = loadPolygonClipping();

// ── Public error class (mirrors generate-svg.mjs) ─────────────────────────────

export class PlannerPipelineError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "PlannerPipelineError";
  }
}

// ── Sanitizer (same logic as generate-svg.mjs sanitiseSvg) ───────────────────

const MAX_ATTR_SIZE = 4096;

/**
 * Sanitize an SVG string; throws PlannerPipelineError for unsafe content.
 * Mirrors generate-svg.mjs sanitiseSvg exactly.
 */
export function sanitiseSvg(svg: string): string {
  let result = svg;

  result = result.replace(/<script[\s\S]*?<\/script>/gi, "");
  result = result.replace(/<script[\s\S]*?\/>/gi, "");
  result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");
  result = result.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "");
  result = result.replace(/<foreignObject[\s\S]*?\/>/gi, "");

  if (/href\s*=\s*["']?\s*javascript:/i.test(result)) {
    throw new PlannerPipelineError("malformedSvg", "Sanitisation failed: javascript: href found in SVG");
  }

  const externalUseMatch = result.match(
    /<(?:use|image)[\s\S]*?(?:href|xlink:href)\s*=\s*["']([a-zA-Z][a-zA-Z0-9.+-]*:\/\/[^'"]+)["']/gi,
  );
  if (externalUseMatch) {
    for (const match of externalUseMatch) {
      const urlMatch = match.match(/["']([a-zA-Z][a-zA-Z0-9.+-]*:\/\/[^'"]+)["']/i);
      const url = urlMatch ? urlMatch[1] : "";
      const scheme = url.includes(":") ? url.slice(0, url.indexOf(":") + 1) : "";
      const ALLOWED: string[] = ["https:", "http:", "data:image/png;base64", "data:image/svg+xml;"];
      if (!ALLOWED.includes(scheme)) {
        throw new PlannerPipelineError(
          "malformedSvg",
          `Sanitisation failed: disallowed external reference in ${match.slice(0, 80)}`,
        );
      }
    }
  }

  const attrMatch = result.match(/([a-zA-Z_:][a-zA-Z0-9_:.-]*)\s*=\s*(["'])([\s\S]*?)\2/g);
  if (attrMatch) {
    for (const attr of attrMatch) {
      const val = attr.match(/=\s*(["'])([\s\S]*?)\1/)?.[2] ?? "";
      if (val.length > MAX_ATTR_SIZE) {
        throw new PlannerPipelineError(
          "malformedSvg",
          `Sanitisation failed: attribute value exceeds ${MAX_ATTR_SIZE} bytes`,
        );
      }
    }
  }

  return result;
}

// ── Slug / viewBox validation ─────────────────────────────────────────────────

const SLUG_RE = /^[a-z][a-z0-9-]{1,63}$/;

export function validateSlug(slug: string): void {
  if (!SLUG_RE.test(slug)) {
    throw new PlannerPipelineError(
      "invalid",
      `Slug "${slug}" does not match required pattern ^[a-z][a-z0-9-]{1,63}$`,
    );
  }
}

export interface ViewBox { x: number; y: number; width: number; height: number }

export function assertViewBoxStable(descriptor: { viewBox?: unknown }): ViewBox {
  const vb = descriptor.viewBox as Record<string, unknown> | undefined;
  if (!vb) throw new PlannerPipelineError("invalid", "Descriptor missing viewBox");
  const { x, y, width, height } = vb as { x: unknown; y: unknown; width: unknown; height: unknown };
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
    throw new PlannerPipelineError("invalid", "viewBox contains non-finite values");
  }
  if ((width as number) <= 0 || (height as number) <= 0) {
    throw new PlannerPipelineError("invalid", "viewBox width/height must be positive");
  }
  return { x: x as number, y: y as number, width: width as number, height: height as number };
}

// ── Boolean operations (mirrors generate-svg.mjs applyBooleanOp) ─────────────
// polygon-clipping geometry: Pair → Ring → Polygon → MultiPolygon
//   Pair = [number, number]
//   Ring = Pair[]
//   Polygon = Ring[]   (outer + holes)
//   MultiPolygon = Polygon[]
//   Geom = Polygon | MultiPolygon

/** Closed ring of plan-space points (polygon-clipping Ring). */
type PolygonRing = [number, number][];
/** One polygon: outer ring + optional holes (polygon-clipping Polygon). */
type Polygon = PolygonRing[];
/** polygon-clipping MultiPolygon — array of Polygons. */
type MultiPolygon = Polygon[];

const OP_MAP = {
  union: polygonClipping.union,
  intersection: polygonClipping.intersection,
  difference: polygonClipping.difference,
  xor: polygonClipping.xor,
} as const;

export type BooleanVariant = keyof typeof OP_MAP;

/**
 * Apply a boolean op across input Polygons.
 * Returns rings of the first result Polygon (sufficient for rect-block IR).
 */
export function applyBooleanOp(polygons: Polygon[], variant: BooleanVariant): PolygonRing[] {
  if (polygons.length === 0) {
    throw new PlannerPipelineError("invalid", "No polygons for boolean operation");
  }
  const op = OP_MAP[variant];
  if (!op) {
    throw new PlannerPipelineError("invalid", `Unknown boolean variant "${variant}"`);
  }
  // Pass MultiPolygon Geoms: [Polygon] — not [[Polygon]] (one nesting level).
  if (polygons.length === 1) {
    if (variant === "difference") {
      throw new PlannerPipelineError("invalid", "difference variant requires at least two polygons");
    }
    const result = (op as typeof polygonClipping.union)([polygons[0]!]);
    return Array.isArray(result) && result.length > 0 ? result[0]! : [];
  }
  let acc: MultiPolygon = [polygons[0]!];
  for (let i = 1; i < polygons.length; i++) {
    const next: MultiPolygon = [polygons[i]!];
    const merged = (op as typeof polygonClipping.union)(acc, next);
    if (!Array.isArray(merged) || merged.length === 0) {
      throw new PlannerPipelineError("invalid", `Boolean op "${variant}" produced empty result at index ${i}`);
    }
    acc = merged;
  }
  return Array.isArray(acc) && acc.length > 0 ? acc[0]! : [];
}

// ── Path construction ─────────────────────────────────────────────────────────

function fmt(n: number): string {
  return parseFloat(n.toFixed(4)).toString();
}

/** Convert polygon rings (outer + holes) into a single SVG path `d` string. */
export function polygonsToPath(rings: PolygonRing[]): string {
  if (!Array.isArray(rings) || rings.length === 0) return "";
  const parts: string[] = [];
  for (const ring of rings) {
    if (!Array.isArray(ring) || ring.length === 0) continue;
    const first = ring[0];
    if (!first || first.length < 2) continue;
    const moveCmd = `M ${fmt(first[0])} ${fmt(first[1])}`;
    const lineCmds: string[] = [];
    for (let i = 1; i < ring.length; i++) {
      const pt = ring[i]!;
      lineCmds.push(`L ${fmt(pt[0])} ${fmt(pt[1])}`);
    }
    lineCmds.push("Z");
    parts.push([moveCmd, ...lineCmds].join(" "));
  }
  return parts.join(" ");
}

// ── SVG assembly (mirrors generate-svg.mjs buildSvgString) ──────────────────

function escXml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Root <svg> a11y wiring: role=img + aria-labelledby → title/desc ids. */
function a11yRootAttrs(idBase: string, hasDesc: boolean): string {
  const labelledBy = `${idBase}-title${hasDesc ? ` ${idBase}-desc` : ""}`;
  return ` role="img" aria-labelledby="${escXml(labelledBy)}"`;
}

export interface ThemeTokens {
  "fill-primary"?: string;
  "stroke-accent"?: string;
  [key: string]: string | undefined;
}

/**
 * Plan SVGs are painted as raster images in Fabric / inventory thumbs.
 * `currentColor` and CSS vars resolve to black (or nothing) in that context.
 * Default to CAD-paper greys so symbols are readable on the light grid.
 */
export const PLAN_SVG_DEFAULT_FILL = "#8a8680";
export const PLAN_SVG_DEFAULT_STROKE = "#2c2a28";

function isImageUnsafePaint(token: string | undefined): boolean {
  if (!token || !token.trim()) return true;
  const t = token.trim().toLowerCase();
  return (
    t === "currentcolor" ||
    t.startsWith("var(") ||
    t === "inherit" ||
    t === "unset"
  );
}

/** Resolve fill/stroke for published plan symbols (image-safe literals only). */
export function resolvePlanSvgPaint(themeTokens: ThemeTokens | undefined): {
  fill: string;
  stroke: string;
  fillAttr: string;
  strokeAttr: string;
} {
  const tokens = themeTokens ?? {};
  const rawFill = tokens["fill-primary"] ?? tokens["--fill-primary"];
  const rawStroke = tokens["stroke-accent"] ?? tokens["--stroke-accent"];
  const fill = isImageUnsafePaint(rawFill) ? PLAN_SVG_DEFAULT_FILL : String(rawFill).trim();
  const stroke = isImageUnsafePaint(rawStroke)
    ? PLAN_SVG_DEFAULT_STROKE
    : String(rawStroke).trim();
  return {
    fill,
    stroke,
    fillAttr: ` fill="${escXml(fill)}"`,
    strokeAttr: ` stroke="${escXml(stroke)}" stroke-width="12"`,
  };
}

function blockRectToPath(b: BlockRect): string {
  return [
    `M ${fmt(b.x)} ${fmt(b.y)}`,
    `L ${fmt(b.x + b.width)} ${fmt(b.y)}`,
    `L ${fmt(b.x + b.width)} ${fmt(b.y + b.height)}`,
    `L ${fmt(b.x)} ${fmt(b.y + b.height)}`,
    "Z",
  ].join(" ");
}

/** Inventory publish: one path per block (seat + backrest visible), not one merged silhouette. */
export function buildPerBlockSvgString(
  slug: string,
  viewBox: ViewBox,
  blocks: readonly BlockRect[],
  themeTokens: ThemeTokens | undefined,
  title: string | undefined,
  desc: string | undefined,
  variant: string | undefined,
): string {
  const idBase = slug || "svg";
  const titleAttr = `<title id="${idBase}-title">${escXml(title ?? slug)}</title>`;
  const descAttr = desc ? `<desc id="${idBase}-desc">${escXml(desc)}</desc>` : "";
  const paint = resolvePlanSvgPaint(themeTokens);
  const variantAttr = variant ? ` data-block-variant="${escXml(variant)}"` : "";
  const vb = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
  const inner = blocks
    .map((b, index) => {
      const d = blockRectToPath(b);
      const idAttr = b.id ? ` id="${escXml(b.id)}"` : ` id="block-${index}"`;
      const classAttr = slug ? ` class="${slug}"` : "";
      // Slight shade variation so multiparts read as furniture, not one black mass.
      const fill = index === 0 ? paint.fill : shadeHex(paint.fill, index);
      return `<path d="${d}" fill="${escXml(fill)}"${paint.strokeAttr}${idAttr}${classAttr}/>`;
    })
    .join("");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg"${a11yRootAttrs(idBase, Boolean(desc))} shape-rendering="geometricPrecision" viewBox="${vb}" width="${viewBox.width}" height="${viewBox.height}"${variantAttr}>`,
    titleAttr,
    descAttr,
    `<g>`,
    inner,
    `</g>`,
    `</svg>`,
  ]
    .filter((part) => part !== "")
    .join("");
}

/** Nudge grey fills so seat/top/body are distinct on paper. */
function shadeHex(hex: string, step: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = Number.parseInt(m[1]!, 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + step * 12));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + step * 12));
  const b = Math.min(255, Math.max(0, (n & 255) + step * 10));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function buildSvgString(
  slug: string,
  viewBox: ViewBox,
  dPath: string,
  themeTokens: ThemeTokens | undefined,
  title: string | undefined,
  desc: string | undefined,
  variant: string | undefined,
): string {
  const idBase = slug || "svg";
  const titleAttr = `<title id="${idBase}-title">${escXml(title ?? slug)}</title>`;
  const descAttr = desc ? `<desc id="${idBase}-desc">${escXml(desc)}</desc>` : "";
  const { fillAttr, strokeAttr } = resolvePlanSvgPaint(themeTokens);
  const classAttr = slug ? ` class="${slug}"` : "";
  const variantAttr = variant ? ` data-block-variant="${escXml(variant)}"` : "";
  // Difference booleans need evenodd so cutouts are holes, not solid black.
  const fillRule =
    variant === "difference" ? ` fill-rule="evenodd"` : "";
  const vb = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg"${a11yRootAttrs(idBase, Boolean(desc))} shape-rendering="geometricPrecision" viewBox="${vb}" width="${viewBox.width}" height="${viewBox.height}"${variantAttr}>`,
    titleAttr,
    descAttr,
    `<g>`,
    `<path d="${dPath}"${fillAttr}${strokeAttr}${fillRule}${classAttr}/>`,
    `</g>`,
    `</svg>`,
  ]
    .filter((part) => part !== "")
    .join("");
}

// ── Block → polygon conversion ────────────────────────────────────────────────

export interface BlockRect {
  x: number;
  y: number;
  width: number;
  height: number;
  id?: string;
}

/** Rect block → polygon-clipping Polygon (one outer ring, no holes). */
export function blockToPolygon(b: BlockRect): Polygon {
  const ring: PolygonRing = [
    [b.x, b.y],
    [b.x + b.width, b.y],
    [b.x + b.width, b.y + b.height],
    [b.x, b.y + b.height],
  ];
  return [ring];
}

// ── Full pipeline (SVG-only, no file I/O, no R2, no PNG) ─────────────────────

export interface PipelineDescriptor {
  slug: string;
  name?: string;
  description?: string;
  variant?: string;
  viewBox: { x: number; y: number; width: number; height: number };
  blocks?: BlockRect[];
  themeTokens?: ThemeTokens;
}

/** Fallback cross-hatched SVG for descriptors with no blocks (§03-FIX-05). */
export function buildFallbackSvg(viewBox: ViewBox): string {
  const vb = `0 0 ${viewBox.width} ${viewBox.height}`;
  const FALLBACK_D_PATH = "M 10 10 L 90 90 M 90 10 L 10 90 M 50 10 L 50 90 M 10 50 L 90 50";
  // Image-safe stroke: Fabric/img cannot resolve currentColor/var.
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="fallback-title fallback-desc" shape-rendering="geometricPrecision" viewBox="${vb}" width="${viewBox.width}" height="${viewBox.height}">`,
    `<title id="fallback-title">Fallback - geometry missing</title>`,
    `<desc id="fallback-desc">Block geometry not provided; cross-hatched fallback rendered.</desc>`,
    `<path d="${FALLBACK_D_PATH}" fill="none" stroke="${PLAN_SVG_DEFAULT_STROKE}" stroke-width="2"/>`,
    `</svg>`,
  ].join("");
}

/**
 * Run the pipeline up to and including SVGO + sanitizer.
 * Does NOT write files, render PNG, or upload to R2.
 * Used by golden round-trip tests (03-TEST-01).
 */
export async function runPipelineCore(descriptor: PipelineDescriptor): Promise<string> {
  validateSlug(descriptor.slug);
  const viewBox = assertViewBoxStable(descriptor);

  const rawBlocks = Array.isArray(descriptor.blocks) ? descriptor.blocks : [];
  if (rawBlocks.length === 0) {
    const fallback = buildFallbackSvg(viewBox);
    return sanitiseSvg(fallback);
  }

  const variant = (descriptor.variant ?? "union") as BooleanVariant;
  if (variant === "union" && rawBlocks.length >= 2) {
    const assembled = buildPerBlockSvgString(
      descriptor.slug,
      viewBox,
      rawBlocks,
      descriptor.themeTokens,
      descriptor.name,
      descriptor.description,
      descriptor.variant,
    );
    // Phase 7 Stage A: the no-op `optimiseSvg` wrapper was retired with the
    // `svgo` removal (L10 forbids reinstating it). Assemblers already emit
    // minified markup, so trim + sanitize is the whole post-step.
    return sanitiseSvg(assembled.trim());
  }

  const polygons: Polygon[] = rawBlocks.map(blockToPolygon);
  const resultRings = applyBooleanOp(polygons, variant);
  const dPath = polygonsToPath(resultRings);

  return runPipelineCoreFromPath(descriptor, viewBox, dPath);
}

/**
 * S2 maker path: assemble + SVGO + sanitize from a pre-built `d` path (mm plan space).
 */
export interface MakerPathPart {
  readonly id: string;
  readonly dPath: string;
}

function buildMakerPathsSvgString(
  slug: string,
  viewBox: ViewBox,
  parts: readonly MakerPathPart[],
  themeTokens: ThemeTokens | undefined,
  title: string | undefined,
  desc: string | undefined,
  variant: string | undefined,
): string {
  const idBase = slug || "svg";
  const titleAttr = `<title id="${idBase}-title">${escXml(title ?? slug)}</title>`;
  const descAttr = desc ? `<desc id="${idBase}-desc">${escXml(desc)}</desc>` : "";
  const paint = resolvePlanSvgPaint(themeTokens);
  const variantAttr = variant ? ` data-block-variant="${escXml(variant)}"` : "";
  const vb = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
  const inner = parts
    .map((part, index) => {
      const idAttr = part.id ? ` id="${escXml(part.id)}"` : ` id="maker-part-${index}"`;
      const classAttr = slug ? ` class="${slug}"` : "";
      const isTop = /top|worksurface/i.test(part.id);
      const fill = isTop
        ? shadeHex(paint.fill, -2)
        : index === 0
          ? paint.fill
          : shadeHex(paint.fill, index);
      return `<path d="${part.dPath}" fill="${escXml(fill)}"${paint.strokeAttr}${idAttr}${classAttr}/>`;
    })
    .join("");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg"${a11yRootAttrs(idBase, Boolean(desc))} shape-rendering="geometricPrecision" viewBox="${vb}" width="${viewBox.width}" height="${viewBox.height}"${variantAttr}>`,
    titleAttr,
    descAttr,
    `<g>`,
    inner,
    `</g>`,
    `</svg>`,
  ]
    .filter((part) => part !== "")
    .join("");
}

export async function runPipelineCoreFromMakerPaths(
  descriptor: PipelineDescriptor,
  viewBox: ViewBox,
  parts: readonly MakerPathPart[],
): Promise<string> {
  validateSlug(descriptor.slug);
  const stableViewBox = assertViewBoxStable({ ...descriptor, viewBox });
  if (parts.length === 0) {
    throw new PlannerPipelineError("invalid", "Empty maker path parts");
  }
  const assembled = buildMakerPathsSvgString(
    descriptor.slug,
    stableViewBox,
    parts,
    descriptor.themeTokens,
    descriptor.name,
    descriptor.description,
    descriptor.variant,
  );
  // Phase 7 Stage A: `optimiseSvg` retired (see above).
  return sanitiseSvg(assembled.trim());
}

export async function runPipelineCoreFromPath(
  descriptor: PipelineDescriptor,
  viewBox: ViewBox,
  dPath: string,
): Promise<string> {
  validateSlug(descriptor.slug);
  const stableViewBox = assertViewBoxStable({ ...descriptor, viewBox });

  if (!dPath.trim()) {
    throw new PlannerPipelineError("invalid", "Empty SVG path data");
  }

  const assembled = buildSvgString(
    descriptor.slug,
    stableViewBox,
    dPath,
    descriptor.themeTokens,
    descriptor.name,
    descriptor.description,
    descriptor.variant,
  );

  // Phase 7 Stage A: `optimiseSvg` retired (see above).
  return sanitiseSvg(assembled.trim());
}
