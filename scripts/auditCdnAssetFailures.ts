import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import {
  buildBasenameIndex,
  copyWebAsset,
  resolveMissingAssetPath,
} from "./lib/cdnAssetResolver";
import { REPO_ROOT, SITE_PACKAGE_ROOT } from "./lib/repoRoot";

dotenv.config({ path: path.resolve(SITE_PACKAGE_ROOT, ".env.local") });

const REPORT_PATH = path.resolve(REPO_ROOT, "results/cdn-asset-failures.json");
const REPORT_MD_PATH = path.resolve(REPO_ROOT, "results/cdn-asset-failures.md");
const CATALOG_SEATING_PATH = path.resolve(SITE_PACKAGE_ROOT, "scripts/catalog-seating.json");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

type FailureRow = {
  path: string;
  category: string;
  resolution: "copy" | "unresolved";
  fix?: string;
};

async function collectAssetPaths(): Promise<string[]> {
  const assetPaths = new Set<string>();

  const localIndex = path.resolve(process.cwd(), "features/site/data/localCatalogIndex.json");
  if (fs.existsSync(localIndex)) {
    const data = JSON.parse(fs.readFileSync(localIndex, "utf8")) as Array<Record<string, unknown>>;
    for (const item of data) {
      const images = item.images;
      if (Array.isArray(images)) {
        for (const img of images) {
          if (typeof img === "string") assetPaths.add(img);
        }
      }
      if (typeof item.flagship_image === "string") assetPaths.add(item.flagship_image);
    }
  }

  if (fs.existsSync(CATALOG_SEATING_PATH)) {
    const data = JSON.parse(fs.readFileSync(CATALOG_SEATING_PATH, "utf8")) as Array<Record<string, unknown>>;
    for (const item of data) {
      const images = item.images;
      if (Array.isArray(images)) {
        for (const img of images) {
          if (typeof img === "string") assetPaths.add(img);
        }
      }
    }
  }

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const addProductAssets = (row: Record<string, unknown>) => {
      const images = row.images;
      if (Array.isArray(images)) {
        for (const img of images) {
          if (typeof img === "string") assetPaths.add(img);
        }
      }
      if (typeof row.flagship_image === "string") assetPaths.add(row.flagship_image);
      const sceneImages = row.scene_images;
      if (Array.isArray(sceneImages)) {
        for (const img of sceneImages) {
          if (typeof img === "string") assetPaths.add(img);
        }
      }
      const metadata = row.metadata;
      if (metadata && typeof metadata === "object") {
        const m = metadata as Record<string, unknown>;
        if (typeof m.threeDModelUrl === "string") assetPaths.add(m.threeDModelUrl);
        if (typeof m["3d_model"] === "string") assetPaths.add(m["3d_model"]);
      }
    };

    const { data: catProdData } = await supabase
      .from("catalog_products")
      .select("images, flagship_image, scene_images, metadata");
    for (const row of catProdData ?? []) addProductAssets(row as Record<string, unknown>);

    const { data: prodData } = await supabase
      .from("products")
      .select("images, flagship_image, metadata");
    for (const row of prodData ?? []) addProductAssets(row as Record<string, unknown>);

    const { data: pImgData } = await supabase.from("product_images").select("image_url");
    for (const row of pImgData ?? []) {
      if (typeof row.image_url === "string") assetPaths.add(row.image_url);
    }
  }

  return Array.from(assetPaths)
    .map((value) => value.trim())
    .filter((value) => value.startsWith("/") && !value.startsWith("//"));
}

function rewriteCatalogSeatingLegacyChairPaths(): number {
  if (!fs.existsSync(CATALOG_SEATING_PATH)) return 0;

  const data = JSON.parse(fs.readFileSync(CATALOG_SEATING_PATH, "utf8")) as Array<Record<string, unknown>>;
  const basenameIndex = buildBasenameIndex("images");
  let updates = 0;

  for (const item of data) {
    const images = item.images;
    if (!Array.isArray(images)) continue;
    item.images = images.map((img) => {
      if (typeof img !== "string" || !img.startsWith("/assets/catalog/chairs/")) return img;
      const resolution = resolveMissingAssetPath(img, basenameIndex);
      if (resolution.kind !== "copy") return img;
      updates++;
      return resolution.sourceWebPath;
    });
  }

  if (updates > 0) {
    fs.writeFileSync(CATALOG_SEATING_PATH, `${JSON.stringify(data, null, 2)}\n`);
  }

  return updates;
}

function renderMarkdown(report: {
  totals: Record<string, number | boolean>;
  byCategory: Record<string, number>;
  unresolved: FailureRow[];
}): string {
  const lines = [
    "# CDN asset failure report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Totals",
    "",
    ...Object.entries(report.totals).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Failures by category",
    "",
    ...Object.entries(report.byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Unresolved paths",
    "",
  ];

  if (report.unresolved.length === 0) {
    lines.push("None.");
  } else {
    for (const row of report.unresolved.slice(0, 200)) {
      lines.push(`- ${row.path}`);
    }
    if (report.unresolved.length > 200) {
      lines.push(`- ...and ${report.unresolved.length - 200} more`);
    }
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const applyFixes = process.argv.includes("--apply");
  const assetPaths = await collectAssetPaths();
  const basenameIndex = buildBasenameIndex("images");

  const failures: FailureRow[] = [];
  let copied = 0;
  let alreadyLocal = 0;

  for (const relPath of assetPaths) {
    const resolution = resolveMissingAssetPath(relPath, basenameIndex);
    if (resolution.kind === "exists") {
      alreadyLocal++;
      continue;
    }

    const category = relPath.split("/").filter(Boolean)[1] ?? "unknown";
    const row: FailureRow = {
      path: relPath,
      category,
      resolution: resolution.kind === "copy" ? "copy" : "unresolved",
    };

    if (resolution.kind === "copy") {
      row.fix = resolution.sourceWebPath;
      if (applyFixes) {
        copyWebAsset(resolution.sourceWebPath, relPath);
        copied++;
      }
    }

    failures.push(row);
  }

  const seatingUpdates = applyFixes ? rewriteCatalogSeatingLegacyChairPaths() : 0;

  const unresolved = failures.filter((row) => row.resolution === "unresolved");
  const byCategory = failures.reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + 1;
    return acc;
  }, {});

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      referenced: assetPaths.length,
      alreadyLocal,
      missing: failures.length,
      copied,
      seatingJsonUpdates: seatingUpdates,
      unresolved: unresolved.length,
      appliedFixes: applyFixes,
    },
    byCategory,
    failures,
    unresolved,
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  fs.writeFileSync(REPORT_MD_PATH, renderMarkdown(report));

  console.log(JSON.stringify(report.totals, null, 2));
  console.log(`report: ${path.relative(process.cwd(), REPORT_PATH)}`);
  console.log(`summary: ${path.relative(process.cwd(), REPORT_MD_PATH)}`);
}

main().catch(console.error);