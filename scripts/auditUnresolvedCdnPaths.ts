import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { resolveProductImages } from "@/lib/catalog/site/imageMetadata";
import { buildBasenameIndex, localAssetExists } from "./lib/cdnAssetResolver";
import { REPO_ROOT, SITE_PACKAGE_ROOT } from "./lib/repoRoot";

dotenv.config({ path: path.resolve(SITE_PACKAGE_ROOT, ".env.local") });

const PUBLIC_DIR = path.resolve(SITE_PACKAGE_ROOT, "public");
const FAILURES_PATH = path.resolve(REPO_ROOT, "results/cdn-asset-failures.json");
const REPORT_JSON = path.resolve(REPO_ROOT, "results/cdn-unresolved-replacements.json");
const REPORT_MD = path.resolve(REPO_ROOT, "results/cdn-unresolved-replacements.md");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type ProductRef = {
  table: "products" | "catalog_products" | "product_images";
  id: string;
  slug: string | null;
  name: string | null;
  field: string;
};

type ReplacementSuggestion = {
  path: string;
  category: string;
  reason: string;
  suggestedPath: string | null;
  confidence: "high" | "medium" | "low" | "none";
  referencedBy: ProductRef[];
};

function loadUnresolvedPaths(): string[] {
  const report = JSON.parse(fs.readFileSync(FAILURES_PATH, "utf8")) as {
    unresolved?: Array<{ path: string }>;
  };
  const fromUnresolved = (report.unresolved ?? []).map((row) => row.path);
  if (fromUnresolved.length > 0) return fromUnresolved;

  const failures = (report as { failures?: Array<{ path: string; resolution: string }> }).failures ?? [];
  return failures.filter((row) => row.resolution === "unresolved").map((row) => row.path);
}

function parseChairPath(relPath: string): { slug: string; imageNumber: number | null } | null {
  const match = relPath.match(/^\/images\/chairs\/([^/]+)\/(image-0*(\d+))\.[^.]+$/i);
  if (!match) return null;
  return { slug: match[1], imageNumber: Number.parseInt(match[3], 10) };
}

function listCatalogChairImages(slug: string): string[] {
  const catalogDir = path.join(PUBLIC_DIR, "images", "catalog", `oando-seating--${slug}`);
  if (!fs.existsSync(catalogDir)) return [];

  return fs
    .readdirSync(catalogDir)
    .filter((file) => !file.startsWith("."))
    .map((file) => `/assets/catalog/oando-seating--${slug}/${file}`)
    .filter((webPath) => localAssetExists(webPath))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function imageNumberFromPath(relPath: string): number | null {
  const match = relPath.match(/image-0*(\d+)/i);
  return match ? Number.parseInt(match[1], 10) : null;
}

function suggestNearestCatalogImage(images: string[], requestedNumber: number | null): string | null {
  if (images.length === 0) return null;
  if (requestedNumber === null) return images[0] ?? null;

  const numbered = images
    .map((imagePath) => ({ imagePath, number: imageNumberFromPath(imagePath) }))
    .filter((entry): entry is { imagePath: string; number: number } => entry.number !== null)
    .sort((a, b) => a.number - b.number);

  const exact = numbered.find((entry) => entry.number === requestedNumber);
  if (exact) return exact.imagePath;

  const lowerOrEqual = [...numbered].reverse().find((entry) => entry.number <= requestedNumber);
  if (lowerOrEqual) return lowerOrEqual.imagePath;

  return numbered[0]?.imagePath ?? images[0] ?? null;
}

function suggestReplacement(relPath: string, basenameIndex: Map<string, string[]>): {
  suggestedPath: string | null;
  reason: string;
  confidence: ReplacementSuggestion["confidence"];
} {
  const chair = parseChairPath(relPath);
  if (chair) {
    const images = listCatalogChairImages(chair.slug);
    const suggested = suggestNearestCatalogImage(images, chair.imageNumber);
    if (suggested) {
      return {
        suggestedPath: suggested,
        reason: `Nearest ingested image for oando-seating--${chair.slug}`,
        confidence: chair.imageNumber && imageNumberFromPath(suggested) === chair.imageNumber ? "high" : "medium",
      };
    }
  }

  const fileName = path.posix.basename(relPath);
  const stem = fileName.replace(/\.[^.]+$/, "");
  const parts = stem.split("_");
  const lastPart = parts[parts.length - 1] ?? "";
  const slug = /^\d+[a-z]?$/i.test(lastPart) ? (parts[parts.length - 2] ?? "") : lastPart.replace(/_?\d+[a-z]?$/i, "");

  if (slug) {
    const catalogDir = path.join(PUBLIC_DIR, "images", "catalog");
    if (fs.existsSync(catalogDir)) {
      const folders = fs
        .readdirSync(catalogDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.toLowerCase().includes(slug.toLowerCase()))
        .map((entry) => entry.name);

      for (const folder of folders) {
        const images = fs
          .readdirSync(path.join(catalogDir, folder))
          .map((file) => `/assets/catalog/${folder}/${file}`)
          .filter((webPath) => localAssetExists(webPath))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        const requestedNumber = /_2[a-z]?$/i.test(lastPart) ? 2 : imageNumberFromPath(fileName);
        const suggested = suggestNearestCatalogImage(images, requestedNumber);
        if (suggested) {
          return {
            suggestedPath: suggested,
            reason: `Matched catalog folder ${folder} by product slug "${slug}"`,
            confidence: "medium",
          };
        }
      }
    }
  }

  const basenameMatches = (basenameIndex.get(fileName) ?? []).filter((candidate) => candidate !== relPath);
  if (basenameMatches[0]) {
    return {
      suggestedPath: basenameMatches[0],
      reason: "Same basename exists elsewhere in public/assets",
      confidence: "low",
    };
  }

  return {
    suggestedPath: null,
    reason: "No local catalog source found",
    confidence: "none",
  };
}

function collectPathReferences(
  relPath: string,
  products: Array<Record<string, unknown>>,
  catalogProducts: Array<Record<string, unknown>>,
): ProductRef[] {
  const refs: ProductRef[] = [];

  const addRef = (
    table: ProductRef["table"],
    row: Record<string, unknown>,
    field: string,
  ) => {
    refs.push({
      table,
      id: String(row.id ?? ""),
      slug: typeof row.slug === "string" ? row.slug : null,
      name: typeof row.name === "string" ? row.name : null,
      field,
    });
  };

  for (const row of products) {
    if (row.flagship_image === relPath) addRef("products", row, "flagship_image");
    if (Array.isArray(row.images) && row.images.includes(relPath)) addRef("products", row, "images");
    if (Array.isArray(row.scene_images) && row.scene_images.includes(relPath)) addRef("products", row, "scene_images");
    const metadata = row.metadata;
    if (metadata && typeof metadata === "object") {
      const m = metadata as Record<string, unknown>;
      if (m.threeDModelUrl === relPath || m["3d_model"] === relPath) addRef("products", row, "metadata");
    }
  }

  for (const row of catalogProducts) {
    if (row.flagship_image === relPath) addRef("catalog_products", row, "flagship_image");
    if (Array.isArray(row.images) && row.images.includes(relPath)) addRef("catalog_products", row, "images");
    if (Array.isArray(row.scene_images) && row.scene_images.includes(relPath)) addRef("catalog_products", row, "scene_images");
  }

  return refs;
}

function suggestFromProductRefs(refs: ProductRef[]): string | null {
  for (const ref of refs) {
    if (!ref.name) continue;
    const resolved = resolveProductImages({
      categoryId: ref.slug?.startsWith("oando-") ? ref.slug.split("--")[0] : null,
      name: ref.name,
      slug: ref.slug,
    });
    if (resolved?.flagshipImage && localAssetExists(resolved.flagshipImage)) {
      return resolved.flagshipImage;
    }
    const first = resolved?.images.find((image) => localAssetExists(image));
    if (first) return first;
  }
  return null;
}

function renderMarkdown(rows: ReplacementSuggestion[]): string {
  const lines = [
    "# Unresolved CDN path replacement suggestions",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Total unresolved: ${rows.length}`,
    "",
  ];

  for (const row of rows) {
    lines.push(`## ${row.path}`);
    lines.push("");
    lines.push(`- Category: ${row.category}`);
    lines.push(`- Confidence: ${row.confidence}`);
    lines.push(`- Reason: ${row.reason}`);
    lines.push(`- Suggested: ${row.suggestedPath ?? "(none)"}`);
    if (row.referencedBy.length > 0) {
      lines.push("- Referenced by:");
      for (const ref of row.referencedBy) {
        lines.push(`  - ${ref.table} ${ref.slug ?? ref.id} (${ref.field})`);
      }
    } else {
      lines.push("- Referenced by: not found in Supabase products/catalog_products");
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function collectLocalReferences(relPath: string): ProductRef[] {
  const refs: ProductRef[] = [];
  const seatingPath = path.resolve(process.cwd(), "scripts/catalog-seating.json");
  if (fs.existsSync(seatingPath)) {
    const seating = JSON.parse(fs.readFileSync(seatingPath, "utf8")) as Array<Record<string, unknown>>;
    for (const item of seating) {
      const images = item.images;
      if (!Array.isArray(images) || !images.includes(relPath)) continue;
      refs.push({
        table: "catalog_products",
        id: String(item.slug ?? ""),
        slug: typeof item.slug === "string" ? item.slug : null,
        name: typeof item.name === "string" ? item.name : null,
        field: "images (catalog-seating.json)",
      });
    }
  }

  const indexPath = path.resolve(process.cwd(), "features/site/data/localCatalogIndex.json");
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf8")) as Array<Record<string, unknown>>;
    for (const item of index) {
      const images = item.images;
      const flagship = item.flagship_image;
      const usesPath =
        (Array.isArray(images) && images.includes(relPath)) || flagship === relPath;
      if (!usesPath) continue;
      refs.push({
        table: "catalog_products",
        id: String(item.id ?? item.slug ?? ""),
        slug: typeof item.slug === "string" ? item.slug : null,
        name: typeof item.name === "string" ? item.name : null,
        field: "localCatalogIndex.json",
      });
    }
  }

  return refs;
}

async function loadSupabaseRows(): Promise<{
  products: Array<Record<string, unknown>>;
  catalogProducts: Array<Record<string, unknown>>;
  supabaseConnected: boolean;
}> {
  if (!supabaseUrl || !supabaseKey) {
    return { products: [], catalogProducts: [], supabaseConnected: false };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, slug, name, images, flagship_image, scene_images, metadata");
  if (productsError) throw productsError;

  const { data: catalogProducts, error: catalogError } = await supabase
    .from("catalog_products")
    .select("id, slug, name, images, flagship_image, scene_images, metadata");
  if (catalogError) throw catalogError;

  return {
    products: (products ?? []) as Array<Record<string, unknown>>,
    catalogProducts: (catalogProducts ?? []) as Array<Record<string, unknown>>,
    supabaseConnected: true,
  };
}

async function main() {
  const unresolvedPaths = loadUnresolvedPaths();
  const basenameIndex = buildBasenameIndex("images");
  const { products, catalogProducts, supabaseConnected } = await loadSupabaseRows();

  const suggestions: ReplacementSuggestion[] = unresolvedPaths.map((relPath) => {
    const referencedBy = [
      ...collectPathReferences(relPath, products, catalogProducts),
      ...collectLocalReferences(relPath),
    ];

    let { suggestedPath, reason, confidence } = suggestReplacement(relPath, basenameIndex);

    const productSuggestion = suggestFromProductRefs(referencedBy);
    if (productSuggestion && !suggestedPath) {
      suggestedPath = productSuggestion;
      reason = "Resolved via lib/catalog/site/imageMetadata for referenced product";
      confidence = "medium";
    } else if (productSuggestion && confidence === "none") {
      suggestedPath = productSuggestion;
      reason = `${reason}; product metadata fallback`;
      confidence = "low";
    }

    if (suggestedPath && !localAssetExists(suggestedPath)) {
      reason = `${reason}; suggested path is not present locally`;
      suggestedPath = null;
      confidence = "none";
    }

    return {
      path: relPath,
      category: relPath.split("/").filter(Boolean)[1] ?? "unknown",
      reason,
      suggestedPath,
      confidence,
      referencedBy,
    };
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    supabaseConnected,
    total: suggestions.length,
    withSuggestion: suggestions.filter((row) => row.suggestedPath).length,
    withoutSuggestion: suggestions.filter((row) => !row.suggestedPath).length,
    referencedInCatalog: suggestions.filter((row) => row.referencedBy.length > 0).length,
    byConfidence: {
      high: suggestions.filter((row) => row.confidence === "high").length,
      medium: suggestions.filter((row) => row.confidence === "medium").length,
      low: suggestions.filter((row) => row.confidence === "low").length,
      none: suggestions.filter((row) => row.confidence === "none").length,
    },
    suggestions,
  };

  fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(summary, null, 2));
  fs.writeFileSync(REPORT_MD, renderMarkdown(suggestions));

  console.log(JSON.stringify({
    total: summary.total,
    withSuggestion: summary.withSuggestion,
    withoutSuggestion: summary.withoutSuggestion,
    referencedInCatalog: summary.referencedInCatalog,
    byConfidence: summary.byConfidence,
  }, null, 2));
  console.log(`report: ${path.relative(process.cwd(), REPORT_JSON)}`);
  console.log(`summary: ${path.relative(process.cwd(), REPORT_MD)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});