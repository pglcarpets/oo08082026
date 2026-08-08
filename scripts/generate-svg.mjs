/**
 * Thin CLI / S4 write wrapper for the SVG fixture pipeline.
 *
 * S1–S3: residual `scripts/generate-svg/pipelineCore.ts` (block boolean IR).
 * Former site `features/planner/asset-engine` path was retired with Product Studio;
 * smoke fixtures use pipelineCore + light local normalize only.
 * S4: write `site/public/assets/others/legacy/svg-catalog/{slug}.svg`.
 *
 * Kept as plain .mjs so admin can dynamic-import it; TypeScript cores load via jiti
 * (no circular import of this file from pipelineCore).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createJiti } from "jiti";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SITE_ROOT = path.join(REPO_ROOT, "site");
const CATALOG_DIR = path.join(SITE_ROOT, "public", "assets", "others", "legacy", "svg-catalog");
const PIPELINE_CORE = path.join(__dirname, "generate-svg", "pipelineCore.ts");

const jiti = createJiti(import.meta.url, { interopDefault: true });

/**
 * Light S1 normalize for residual pipelineCore (no retired asset-engine).
 * @param {Record<string, unknown>} descriptor
 * @returns {{ slug: string; name?: string; description?: string; variant?: string; viewBox: { x: number; y: number; width: number; height: number }; blocks: Array<{ x: number; y: number; width: number; height: number; id?: string }>; themeTokens?: Record<string, string | undefined> }}
 */
function normalizeDescriptorForPipelineCore(descriptor) {
  const slug = String(descriptor.slug || "").trim();
  if (!slug) {
    throw new Error("runPipeline requires descriptor.slug");
  }

  /** @type {{ x: number; y: number; width: number; height: number } | null} */
  let viewBox = null;
  if (
    descriptor.viewBox &&
    typeof descriptor.viewBox === "object" &&
    !Array.isArray(descriptor.viewBox)
  ) {
    const vb = /** @type {Record<string, unknown>} */ (descriptor.viewBox);
    viewBox = {
      x: Number(vb.x) || 0,
      y: Number(vb.y) || 0,
      width: Number(vb.width) || 0,
      height: Number(vb.height) || 0,
    };
  }

  /** @type {Array<{ x: number; y: number; width: number; height: number; id?: string }>} */
  let blocks = [];
  if (Array.isArray(descriptor.blocks)) {
    blocks = descriptor.blocks.map((raw, index) => {
      const b = /** @type {Record<string, unknown>} */ (raw ?? {});
      const height = Number(b.height ?? b.depth) || 0;
      return {
        x: Number(b.x) || 0,
        y: Number(b.y) || 0,
        width: Number(b.width) || 0,
        height,
        id: typeof b.id === "string" ? b.id : `block-${index}`,
      };
    });
  }

  // Parametric linear-desk fixture (maker path retired) → single plan rect.
  const type = typeof descriptor.type === "string" ? descriptor.type : "";
  const recipe = typeof descriptor.recipe === "string" ? descriptor.recipe : "";
  if (
    blocks.length === 0 &&
    (type === "linear-desk" || recipe === "linear-desk")
  ) {
    const widthMm = Number(descriptor.widthMm) || 0;
    const depthMm = Number(descriptor.depthMm) || 0;
    if (widthMm <= 0 || depthMm <= 0) {
      throw new Error("linear-desk requires positive widthMm and depthMm");
    }
    viewBox = { x: 0, y: 0, width: widthMm, height: depthMm };
    blocks = [
      {
        id: "desktop",
        x: 0,
        y: 0,
        width: widthMm,
        height: depthMm,
      },
    ];
  }

  if (!viewBox || viewBox.width <= 0 || viewBox.height <= 0) {
    const dims =
      descriptor.dimensions &&
      typeof descriptor.dimensions === "object" &&
      !Array.isArray(descriptor.dimensions)
        ? /** @type {Record<string, unknown>} */ (descriptor.dimensions)
        : null;
    const widthMm = Number(dims?.widthMm ?? descriptor.widthMm) || 0;
    const depthMm = Number(dims?.depthMm ?? descriptor.depthMm) || 0;
    if (widthMm > 0 && depthMm > 0) {
      viewBox = { x: 0, y: 0, width: widthMm, height: depthMm };
    }
  }

  if (!viewBox || viewBox.width <= 0 || viewBox.height <= 0) {
    throw new Error(`descriptor ${slug} missing usable viewBox/dimensions`);
  }

  /** @type {Record<string, string | undefined> | undefined} */
  let themeTokens;
  if (
    descriptor.themeTokens &&
    typeof descriptor.themeTokens === "object" &&
    !Array.isArray(descriptor.themeTokens)
  ) {
    themeTokens = /** @type {Record<string, string | undefined>} */ (
      descriptor.themeTokens
    );
  }

  return {
    slug,
    name: typeof descriptor.name === "string" ? descriptor.name : undefined,
    description:
      typeof descriptor.description === "string"
        ? descriptor.description
        : undefined,
    variant:
      typeof descriptor.variant === "string" ? descriptor.variant : "union",
    viewBox,
    blocks,
    themeTokens,
  };
}

/**
 * @param {unknown} descriptor
 * @returns {Promise<{ svg: string; svgPath: string; normalized: { slug: string } & Record<string, unknown> }>}
 */
export async function runPipeline(descriptor) {
  if (
    descriptor === null ||
    typeof descriptor !== "object" ||
    typeof /** @type {{ slug?: unknown }} */ (descriptor).slug !== "string" ||
    /** @type {{ slug: string }} */ (descriptor).slug.trim() === ""
  ) {
    throw new Error("runPipeline requires descriptor.slug");
  }

  const normalized = normalizeDescriptorForPipelineCore(
    /** @type {Record<string, unknown>} */ (descriptor),
  );

  const { runPipelineCore } = jiti(PIPELINE_CORE);
  const svg = await runPipelineCore(normalized);
  if (typeof svg !== "string" || svg.length === 0) {
    throw new Error("runPipeline produced empty SVG");
  }

  const slug = normalized.slug;
  fs.mkdirSync(CATALOG_DIR, { recursive: true });
  const svgPath = path.join(CATALOG_DIR, `${slug}.svg`);
  fs.writeFileSync(svgPath, svg, "utf8");

  return { svg, svgPath, normalized };
}

// CLI: node scripts/generate-svg.mjs path/to/descriptor.json
const isMain =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: node scripts/generate-svg.mjs <descriptor.json>");
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(input, "utf8"));
  runPipeline(raw)
    .then(({ svgPath, normalized }) => {
      console.log(`OK slug=${normalized.slug} path=${svgPath}`);
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
}
