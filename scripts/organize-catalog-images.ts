import fs from "fs";
import { mkdir, readFile, writeFile, access, copyFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { config as loadEnv } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  Node,
  Project,
  SyntaxKind,
  type ArrayLiteralExpression,
  type ObjectLiteralExpression,
} from "ts-morph";

type CanonicalCategory =
  | "seating"
  | "soft-seating"
  | "workstations"
  | "tables"
  | "storage"
  | "educational"
  | "collaborative";

type Flags = {
  dryRun: boolean;
  apply: boolean;
  syncDb: boolean;
  syncCatalog: boolean;
  allowMissingSlug: boolean;
};

type ManifestRow = {
  product_slug: string;
  category: string;
  rank: number;
  source_relative_path: string;
  lineNo: number;
};

type PlannedImage = {
  rank: number;
  sourceRelativePath: string;
  sourceAbsolutePath: string;
  targetWebPath: string;
  targetAbsolutePath: string;
};

type ProductPlan = {
  productSlug: string;
  category: CanonicalCategory;
  images: PlannedImage[];
};

type OrganizerReport = {
  generatedAt: string;
  mode: {
    dryRun: boolean;
    apply: boolean;
    syncDb: boolean;
    syncCatalog: boolean;
    allowMissingSlug: boolean;
  };
  summary: {
    productsInManifest: number;
    productsProcessed: number;
    filesPlanned: number;
    filesWritten: number;
    dbRowsUpdated: number;
    catalogProductsUpdated: number;
  };
  categoryDistribution: Record<string, number>;
  processedProducts: Array<{
    productSlug: string;
    category: CanonicalCategory;
    outputImages: string[];
  }>;
  warnings: string[];
  errors: string[];
  skipped: Array<{ productSlug: string; reason: string }>;
};

type PostSyncAudit = {
  generatedAt: string;
  touchedProductCount: number;
  localPathAudit: {
    checked: number;
    missingCount: number;
    missing: string[];
  };
  dbPathAudit: {
    checkedProducts: number;
    missingCount: number;
    missing: Array<{ slug: string; path: string }>;
  };
  catalogPathAudit: {
    updatedProducts: number;
    missingCount: number;
    missing: Array<{ slug: string; path: string }>;
  };
};

const ROOT = process.cwd();
const RAW_DIR = path.resolve(ROOT, "scripts", "catalog-raw");
const MANIFEST_PATH = path.resolve(ROOT, "scripts", "catalog-image-manifest.csv");
const REPORT_PATH = path.resolve(ROOT, "scripts", "catalog-image-report.json");
const POST_SYNC_AUDIT_PATH = path.resolve(
  ROOT,
  "scripts",
  "catalog-postsync-audit.json",
);
const CATALOG_PATH = path.resolve(ROOT, "lib", "catalog.ts");

const CATEGORY_ALIAS_MAP: Record<string, CanonicalCategory> = {
  "revolving chairs mesh": "seating",
  "revolving chairs (mesh)": "seating",
  "executive chairs": "seating",
  "executive-chairs": "seating",
  "lounge chairs": "soft-seating",
  sofa: "soft-seating",
  desks: "workstations",
  workstations: "workstations",
  "conference and other tables": "tables",
  storage: "storage",
  cabinets: "storage",
  educational: "educational",
  collaborative: "collaborative",
  pods: "collaborative",
  "acoustic booth": "collaborative",
};

const CATALOG_SLUG_OVERRIDES_BY_PRODUCT_KEY: Record<string, string[]> = {
  "oando-workstations::cabin-60x30": ["cabin-60x30"],
  "oando-workstations::cabin-l-shape": ["cabin-l-shape"],
  "oando-tables::conference-8-seater": ["conference-8-seater"],
};

export function parseFlags(argv: string[]): Flags {
  return {
    dryRun: argv.includes("--dry-run"),
    apply: argv.includes("--apply"),
    syncDb: argv.includes("--sync-db"),
    syncCatalog: argv.includes("--sync-catalog"),
    allowMissingSlug: argv.includes("--allow-missing-slug"),
  };
}

export function normalizeCategoryToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_:()]+/g, " ")
    .replace(/[^a-z0-9 -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveCategory(value: string): CanonicalCategory | null {
  const normalized = normalizeCategoryToken(value);
  const canonicalValues: CanonicalCategory[] = [
    "seating",
    "soft-seating",
    "workstations",
    "tables",
    "storage",
    "educational",
    "collaborative",
  ];
  if (canonicalValues.includes(normalized as CanonicalCategory)) {
    return normalized as CanonicalCategory;
  }
  return CATEGORY_ALIAS_MAP[normalized] ?? null;
}

export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  out.push(current.trim());
  return out;
}

export function parseManifest(manifestCsv: string): ManifestRow[] {
  const lines = manifestCsv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length === 0) {
    throw new Error("Manifest is empty.");
  }

  const header = parseCsvLine(lines[0]);
  const expected = [
    "product_slug",
    "category",
    "rank",
    "source_relative_path",
  ];
  const missing = expected.filter((h) => !header.includes(h));
  if (missing.length > 0) {
    throw new Error(`Manifest is missing required columns: ${missing.join(", ")}`);
  }

  const colIndex: Record<string, number> = {};
  for (const col of expected) colIndex[col] = header.indexOf(col);

  const rows: ManifestRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const productSlug = values[colIndex.product_slug] ?? "";
    const category = values[colIndex.category] ?? "";
    const rankRaw = values[colIndex.rank] ?? "";
    const sourceRelativePath = values[colIndex.source_relative_path] ?? "";

    const rank = Number.parseInt(rankRaw, 10);
    if (!productSlug || !category || !sourceRelativePath || Number.isNaN(rank)) {
      throw new Error(`Manifest row ${i + 1} is invalid.`);
    }

    rows.push({
      product_slug: productSlug.trim(),
      category: category.trim(),
      rank,
      source_relative_path: sourceRelativePath.trim(),
      lineNo: i + 1,
    });
  }

  if (rows.length === 0) {
    throw new Error("Manifest has no data rows.");
  }
  return rows;
}

function buildPlans(rows: ManifestRow[]): ProductPlan[] {
  const grouped = new Map<string, ManifestRow[]>();
  for (const row of rows) {
    if (!grouped.has(row.product_slug)) grouped.set(row.product_slug, []);
    grouped.get(row.product_slug)!.push(row);
  }

  const plans: ProductPlan[] = [];
  for (const [slug, slugRows] of grouped) {
    const categoryCandidates = [...new Set(slugRows.map((r) => r.category))];
    if (categoryCandidates.length !== 1) {
      throw new Error(`Slug ${slug} has multiple categories in manifest.`);
    }

    const category = resolveCategory(categoryCandidates[0]);
    if (!category) {
      throw new Error(
        `Slug ${slug} has unmapped category "${categoryCandidates[0]}".`,
      );
    }

    const rankMap = new Map<number, ManifestRow>();
    for (const row of slugRows) {
      if (row.rank < 1 || row.rank > 7) {
        throw new Error(
          `Slug ${slug} has rank ${row.rank} (must be between 1 and 7).`,
        );
      }
      if (rankMap.has(row.rank)) {
        throw new Error(`Slug ${slug} has duplicate rank ${row.rank}.`);
      }
      rankMap.set(row.rank, row);
    }

    const ranks = [...rankMap.keys()].sort((a, b) => a - b);
    const maxRank = ranks[ranks.length - 1];
    if (ranks.length < 5 || ranks.length > 7) {
      throw new Error(
        `Slug ${slug} must have between 5 and 7 images; found ${ranks.length}.`,
      );
    }
    for (let expectedRank = 1; expectedRank <= maxRank; expectedRank += 1) {
      if (!rankMap.has(expectedRank)) {
        throw new Error(`Slug ${slug} is missing rank ${expectedRank}.`);
      }
    }

    const images: PlannedImage[] = [];
    for (const rank of ranks) {
      const row = rankMap.get(rank)!;
      const sourceAbsolutePath = path.resolve(RAW_DIR, row.source_relative_path);
      if (!sourceAbsolutePath.startsWith(RAW_DIR)) {
        throw new Error(
          `Slug ${slug} has invalid source path outside catalog-raw: ${row.source_relative_path}`,
        );
      }
      const targetWebPath = `/assets/catalog/${category}/${slug}-${rank}.webp`;
      const targetAbsolutePath = path.resolve(
        ROOT,
        "public",
        targetWebPath.replace(/^\//, ""),
      );
      images.push({
        rank,
        sourceRelativePath: row.source_relative_path,
        sourceAbsolutePath,
        targetWebPath,
        targetAbsolutePath,
      });
    }

    plans.push({
      productSlug: slug,
      category,
      images,
    });
  }

  return plans.sort((a, b) => a.productSlug.localeCompare(b.productSlug));
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyFileRecursive(
  source: string,
  dest: string,
): Promise<void> {
  const stat = await fs.promises.stat(source);

  if (stat.isDirectory()) {
    await mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(source);
    for (const entry of entries) {
      const srcPath = path.join(source, entry);
      const destPath = path.join(dest, entry);
      await copyFileRecursive(srcPath, destPath);
    }
  } else {
    await copyFile(source, dest);
  }
}

async function ensureManifestSources(plans: ProductPlan[]): Promise<void> {
  for (const plan of plans) {
    for (const image of plan.images) {
      const exists = await pathExists(image.sourceAbsolutePath);
      if (!exists) {
        throw new Error(
          `Missing source file for ${plan.productSlug}: ${image.sourceRelativePath}`,
        );
      }
    }
  }
}

async function convertOrCopyToWebp(
  sourceAbsolutePath: string,
  targetAbsolutePath: string,
): Promise<void> {
  await mkdir(path.dirname(targetAbsolutePath), { recursive: true });
  const ext = path.extname(sourceAbsolutePath).toLowerCase();
  if (ext === ".webp") {
    await copyFileRecursive(sourceAbsolutePath, targetAbsolutePath);
    return;
  }
  await sharp(sourceAbsolutePath).webp({ quality: 82 }).toFile(targetAbsolutePath);
}

async function applyOrganization(
  plans: ProductPlan[],
  dryRun: boolean,
): Promise<{ processed: OrganizerReport["processedProducts"]; filesWritten: number }> {
  const processed: OrganizerReport["processedProducts"] = [];
  let filesWritten = 0;

  for (const plan of plans) {
    const outputImages: string[] = [];
    for (const image of plan.images) {
      outputImages.push(image.targetWebPath);
      if (!dryRun) {
        await convertOrCopyToWebp(image.sourceAbsolutePath, image.targetAbsolutePath);
        filesWritten += 1;
      }
    }
    processed.push({
      productSlug: plan.productSlug,
      category: plan.category,
      outputImages,
    });
  }

  return { processed, filesWritten };
}

function createSupabaseClient(): SupabaseClient {
  loadEnv({
    path: [path.resolve(ROOT, "local.env"), path.resolve(ROOT, ".env.local")],
  });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env vars for sync-db mode.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function syncDb(
  supabase: SupabaseClient,
  plans: ProductPlan[],
  allowMissingSlug: boolean,
): Promise<{ updated: number; unmatched: string[] }> {
  const unmatched: string[] = [];
  let updated = 0;

  const slugs = plans.map((p) => p.productSlug);
  const existing = new Set<string>();

  const CHUNK = 100;
  for (let i = 0; i < slugs.length; i += CHUNK) {
    const batch = slugs.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("products")
      .select("slug")
      .in("slug", batch);
    if (error) {
      throw new Error(`DB slug lookup failed: ${error.message}`);
    }
    for (const row of data || []) {
      if (row.slug) existing.add(row.slug);
    }
  }

  for (const plan of plans) {
    if (!existing.has(plan.productSlug)) {
      unmatched.push(plan.productSlug);
      continue;
    }
    const images = plan.images
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map((img) => img.targetWebPath);
    const flagship = images[0] || null;
    const { error } = await supabase
      .from("products")
      .update({
        images,
        flagship_image: flagship,
      })
      .eq("slug", plan.productSlug);
    if (error) {
      throw new Error(`Failed updating DB slug ${plan.productSlug}: ${error.message}`);
    }
    updated += 1;
  }

  if (unmatched.length > 0 && !allowMissingSlug) {
    throw new Error(
      `Manifest contains slugs not found in DB: ${unmatched.slice(0, 20).join(", ")}`,
    );
  }

  return { updated, unmatched };
}

function getObjectProp(
  obj: ObjectLiteralExpression,
  key: string,
): Node | undefined {
  return obj.getProperty((prop) => {
    if (Node.isPropertyAssignment(prop) || Node.isShorthandPropertyAssignment(prop)) {
      return prop.getName() === key;
    }
    return false;
  });
}

function setStringProperty(
  obj: ObjectLiteralExpression,
  key: string,
  value: string,
): void {
  const existing = getObjectProp(obj, key);
  const text = `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

  if (existing && Node.isPropertyAssignment(existing)) {
    existing.setInitializer(text);
    return;
  }
  obj.addPropertyAssignment({
    name: key,
    initializer: text,
  });
}

function setStringArrayProperty(
  obj: ObjectLiteralExpression,
  key: string,
  values: string[],
): void {
  const initializer = `[${values
    .map((v) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
    .join(", ")}]`;
  const existing = getObjectProp(obj, key);
  if (existing && Node.isPropertyAssignment(existing)) {
    existing.setInitializer(initializer);
    return;
  }
  obj.addPropertyAssignment({
    name: key,
    initializer,
  });
}

async function syncCatalog(
  plans: ProductPlan[],
): Promise<{ updated: number; unmatched: string[]; updatedPaths: Record<string, string[]> }> {
  if (!(await pathExists(CATALOG_PATH))) {
    throw new Error("lib/catalog.ts not found.");
  }

  const planBySlug = new Map<string, ProductPlan>();
  for (const plan of plans) planBySlug.set(plan.productSlug, plan);

  const matchedSlugs = new Set<string>();
  const updatedPaths: Record<string, string[]> = {};
  let updated = 0;

  const project = new Project({
    tsConfigFilePath: path.resolve(ROOT, "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });
  const source = project.addSourceFileAtPath(CATALOG_PATH);
  const decl = source.getVariableDeclaration("oandoCatalog");
  if (!decl) throw new Error("oandoCatalog declaration not found.");

  const arr = decl.getInitializerIfKindOrThrow(
    SyntaxKind.ArrayLiteralExpression,
  ) as ArrayLiteralExpression;

  for (const categoryNode of arr.getElements()) {
    if (!Node.isObjectLiteralExpression(categoryNode)) continue;
    const categoryIdProp = getObjectProp(categoryNode, "id");
    if (!categoryIdProp || !Node.isPropertyAssignment(categoryIdProp)) continue;
    const categoryId = categoryIdProp
      .getInitializerIfKind(SyntaxKind.StringLiteral)
      ?.getLiteralValue();
    if (!categoryId) continue;

    const seriesProp = getObjectProp(categoryNode, "series");
    if (!seriesProp || !Node.isPropertyAssignment(seriesProp)) continue;
    const seriesArray = seriesProp.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);
    if (!seriesArray) continue;

    for (const seriesNode of seriesArray.getElements()) {
      if (!Node.isObjectLiteralExpression(seriesNode)) continue;
      const productsProp = getObjectProp(seriesNode, "products");
      if (!productsProp || !Node.isPropertyAssignment(productsProp)) continue;
      const productsArray = productsProp.getInitializerIfKind(
        SyntaxKind.ArrayLiteralExpression,
      );
      if (!productsArray) continue;

      for (const productNode of productsArray.getElements()) {
        if (!Node.isObjectLiteralExpression(productNode)) continue;
        const productIdProp = getObjectProp(productNode, "id");
        if (!productIdProp || !Node.isPropertyAssignment(productIdProp)) continue;
        const productId = productIdProp
          .getInitializerIfKind(SyntaxKind.StringLiteral)
          ?.getLiteralValue();
        if (!productId) continue;

        const productKey = `${categoryId}::${productId}`;
        const candidates = [
          `${categoryId}--${productId}`,
          productId,
          ...(CATALOG_SLUG_OVERRIDES_BY_PRODUCT_KEY[productKey] || []),
        ];

        let matchedPlan: ProductPlan | null = null;
        for (const candidate of candidates) {
          const plan = planBySlug.get(candidate);
          if (plan) {
            matchedPlan = plan;
            matchedSlugs.add(candidate);
            break;
          }
        }
        if (!matchedPlan) continue;

        const ordered = matchedPlan.images
          .slice()
          .sort((a, b) => a.rank - b.rank)
          .map((img) => img.targetWebPath);
        const flagship = ordered[0];
        const scenes = ordered.slice(1);

        setStringProperty(productNode, "flagshipImage", flagship);
        setStringArrayProperty(productNode, "sceneImages", scenes);

        updated += 1;
        updatedPaths[matchedPlan.productSlug] = ordered;
      }
    }
  }

  await source.save();

  const unmatched = plans
    .map((p) => p.productSlug)
    .filter((slug) => !matchedSlugs.has(slug));

  return { updated, unmatched, updatedPaths };
}

async function runPostSyncAudit(
  plans: ProductPlan[],
  catalogUpdatedPaths: Record<string, string[]>,
): Promise<PostSyncAudit> {
  const localMissing: string[] = [];
  for (const plan of plans) {
    for (const image of plan.images) {
      const exists = await pathExists(image.targetAbsolutePath);
      if (!exists) localMissing.push(image.targetWebPath);
    }
  }

  const dbMissing: Array<{ slug: string; path: string }> = [];
  let dbCheckedProducts = 0;
  try {
    const supabase = createSupabaseClient();
    const slugs = plans.map((p) => p.productSlug);
    const CHUNK = 100;
    for (let i = 0; i < slugs.length; i += CHUNK) {
      const batch = slugs.slice(i, i + CHUNK);
      const { data, error } = await supabase
        .from("products")
        .select("slug,images,flagship_image")
        .in("slug", batch);
      if (error) throw new Error(error.message);
      for (const row of data || []) {
        dbCheckedProducts += 1;
        const paths = [
          ...(Array.isArray(row.images) ? row.images : []),
          row.flagship_image,
        ].filter(Boolean) as string[];
        for (const p of paths) {
          if (p.startsWith("http://") || p.startsWith("https://")) continue;
          const abs = path.resolve(ROOT, "public", p.replace(/^\//, ""));
          if (!(await pathExists(abs))) {
            dbMissing.push({ slug: row.slug, path: p });
          }
        }
      }
    }
  } catch {
    // Keep audit best-effort if env is unavailable.
  }

  const catalogMissing: Array<{ slug: string; path: string }> = [];
  for (const [slug, paths] of Object.entries(catalogUpdatedPaths)) {
    for (const p of paths) {
      const abs = path.resolve(ROOT, "public", p.replace(/^\//, ""));
      if (!(await pathExists(abs))) {
        catalogMissing.push({ slug, path: p });
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    touchedProductCount: plans.length,
    localPathAudit: {
      checked: plans.reduce((sum, p) => sum + p.images.length, 0),
      missingCount: localMissing.length,
      missing: localMissing.slice(0, 200),
    },
    dbPathAudit: {
      checkedProducts: dbCheckedProducts,
      missingCount: dbMissing.length,
      missing: dbMissing.slice(0, 200),
    },
    catalogPathAudit: {
      updatedProducts: Object.keys(catalogUpdatedPaths).length,
      missingCount: catalogMissing.length,
      missing: catalogMissing.slice(0, 200),
    },
  };
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));
  if (!flags.dryRun && !flags.apply && !flags.syncDb && !flags.syncCatalog) {
    flags.dryRun = true;
  }

  if (!(await pathExists(RAW_DIR))) {
    throw new Error(`Missing input directory: ${RAW_DIR}`);
  }
  if (!(await pathExists(MANIFEST_PATH))) {
    throw new Error(`Missing manifest file: ${MANIFEST_PATH}`);
  }

  const manifestText = await readFile(MANIFEST_PATH, "utf8");
  const rows = parseManifest(manifestText);
  const plans = buildPlans(rows);
  await ensureManifestSources(plans);

  const report: OrganizerReport = {
    generatedAt: new Date().toISOString(),
    mode: { ...flags },
    summary: {
      productsInManifest: plans.length,
      productsProcessed: 0,
      filesPlanned: plans.reduce((sum, p) => sum + p.images.length, 0),
      filesWritten: 0,
      dbRowsUpdated: 0,
      catalogProductsUpdated: 0,
    },
    categoryDistribution: {},
    processedProducts: [],
    warnings: [],
    errors: [],
    skipped: [],
  };

  for (const plan of plans) {
    report.categoryDistribution[plan.category] =
      (report.categoryDistribution[plan.category] || 0) + 1;
  }

  const doApply = flags.apply || flags.syncDb || flags.syncCatalog;
  const { processed, filesWritten } = await applyOrganization(
    plans,
    !doApply || flags.dryRun,
  );
  report.processedProducts = processed;
  report.summary.productsProcessed = processed.length;
  report.summary.filesWritten = filesWritten;

  let catalogUpdatedPaths: Record<string, string[]> = {};
  if (flags.syncDb) {
    const supabase = createSupabaseClient();
    const db = await syncDb(supabase, plans, flags.allowMissingSlug);
    report.summary.dbRowsUpdated = db.updated;
    if (db.unmatched.length > 0) {
      report.warnings.push(
        `Unmatched DB slugs: ${db.unmatched.slice(0, 20).join(", ")}`,
      );
    }
  }

  if (flags.syncCatalog) {
    const catalog = await syncCatalog(plans);
    report.summary.catalogProductsUpdated = catalog.updated;
    catalogUpdatedPaths = catalog.updatedPaths;
    if (catalog.unmatched.length > 0) {
      report.warnings.push(
        `Unmatched catalog products for slugs: ${catalog.unmatched
          .slice(0, 20)
          .join(", ")}`,
      );
    }
  }

  const postSyncAudit = await runPostSyncAudit(plans, catalogUpdatedPaths);

  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
  await writeFile(
    POST_SYNC_AUDIT_PATH,
    JSON.stringify(postSyncAudit, null, 2),
    "utf8",
  );

  console.log(`Report: ${REPORT_PATH}`);
  console.log(`Post-sync audit: ${POST_SYNC_AUDIT_PATH}`);
  console.log(
    `Processed ${report.summary.productsProcessed} products, planned ${report.summary.filesPlanned} files.`,
  );
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return path.resolve(entry) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isMainModule()) {
  main().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(msg);
    process.exit(1);
  });
}
