import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

type CatalogEntry = {
  slug?: string;
  images?: string[];
};

type AliasSource = {
  sourceDir: string;
  note: string;
};

type ExactAssetFill = {
  sourceAssetPath: string;
  note: string;
};

type FillResult = {
  created: string[];
  skipped: string[];
  unresolved: Array<{ slug: string; image: string }>;
};

const ROOT = process.cwd();
const PUBLIC_ROOT = path.join(ROOT, "public");
const CATALOG_INDEX = path.join(ROOT, "data", "site", "localCatalogIndex.json");
const REPORT_PATH = path.join(ROOT, "tools", "reports", "supabase-catalog-asset-arrangement.json");

const ALIAS_SOURCES: Record<string, AliasSource> = {
  "oando-soft-seating--brim": {
    sourceDir: "/assets/catalog/oando-seating--brim",
    note: "Use existing seating catalog set for soft-seating brim canonical paths.",
  },
  "oando-soft-seating--fynn": {
    sourceDir: "/assets/catalog/oando-seating--fynn",
    note: "Use existing seating catalog set for soft-seating fynn canonical paths.",
  },
  "oando-soft-seating--grace": {
    sourceDir: "/assets/catalog/oando-seating--grace",
    note: "Use existing seating catalog set for soft-seating grace canonical paths.",
  },
  "oando-soft-seating--halo": {
    sourceDir: "/assets/catalog/oando-seating--halo",
    note: "Use existing seating catalog set for soft-seating halo canonical paths.",
  },
  "oando-seating--casca": {
    sourceDir: "/assets/catalog/oando-soft-seating--casca",
    note: "Use existing soft-seating catalog set for seating casca canonical paths.",
  },
  "oando-seating--crox": {
    sourceDir: "/assets/catalog/oando-seating--crotch",
    note: "Crox assets currently live under the legacy crotch folder name.",
  },
  "oando-soft-seating--moon": {
    sourceDir: "/assets/catalog/oando-seating--moonlight",
    note: "Moon assets live under the moonlight source set.",
  },
  "oando-soft-seating--orb": {
    sourceDir: "/assets/catalog/oando-seating--orbit",
    note: "Orb assets derive from the orbit source set.",
  },
  "oando-seating--revoq": {
    sourceDir: "/assets/catalog/products/imported/revoq",
    note: "Revoq source exists in the legacy imported tree only.",
  },
};

const EXACT_ASSET_FILLS: Record<string, ExactAssetFill> = {
  "/assets/catalog/oando-storage--prelam-locker/image-6.webp": {
    sourceAssetPath: "/_unused/product_others/imported/storage/image-14.webp",
    note: "Restore missing prelam locker panel from quarantined storage source.",
  },
  "/assets/catalog/oando-seating--solace/image-1.jpg": {
    sourceAssetPath: "/assets/catalog/products/solace-chair-1.webp",
    note: "Seed local solace canonical set from direct product image.",
  },
  "/assets/catalog/oando-seating--solace/image-2.jpg": {
    sourceAssetPath: "/assets/catalog/products/solace-chair-2.webp",
    note: "Seed local solace canonical set from direct product image.",
  },
  "/assets/catalog/oando-seating--solace/image-3.jpg": {
    sourceAssetPath: "/assets/catalog/products/solace-chair-3.webp",
    note: "Seed local solace canonical set from direct product image.",
  },
  "/assets/catalog/oando-seating--cafe-sleek/image-1.jpg": {
    sourceAssetPath: "/assets/catalog/products/chair-cafeteria.webp",
    note: "Seed cafe sleek local canonical set from cafeteria chair source.",
  },
  "/assets/catalog/oando-collaborative--solace-pod/image-1.webp": {
    sourceAssetPath: "/assets/catalog/products/softseating-solace-1.webp",
    note: "Seed solace pod local canonical set from direct marketing source.",
  },
  "/assets/catalog/oando-collaborative--cocoon-pod/image-1.webp": {
    sourceAssetPath: "/_unused/product_others/imported/pod/image-11.webp",
    note: "Seed cocoon pod local canonical set from quarantined pod source.",
  },
};

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function toFsPath(assetPath: string): string {
  return path.join(PUBLIC_ROOT, assetPath.replace(/^\/+/, "").split("/").join(path.sep));
}

function assetExists(assetPath: string): boolean {
  return fs.existsSync(toFsPath(assetPath));
}

function buildExpectedPath(sourceDir: string, imagePath: string): string {
  const sourceExt = path.posix.extname(imagePath);
  const targetExt = sourceExt || ".jpg";
  const fileName = path.posix.basename(imagePath, targetExt);
  return path.posix.join(sourceDir, `${fileName}${targetExt}`);
}

function buildPaddedCandidates(sourceDir: string, imagePath: string): string[] {
  const parsed = path.posix.parse(imagePath);
  const match = parsed.name.match(/^image-(\d+)$/i);
  if (!match) return [];
  const rank = Number.parseInt(match[1], 10);
  if (!Number.isFinite(rank)) return [];

  const names = [
    `image-${rank}`,
    `image-${String(rank).padStart(2, "0")}`,
  ];

  const exts = Array.from(
    new Set([parsed.ext || "", ".webp", ".jpg", ".jpeg", ".png"].filter(Boolean)),
  );

  return names.flatMap((name) => exts.map((ext) => path.posix.join(sourceDir, `${name}${ext}`)));
}

async function copyOrConvert(sourceAssetPath: string, targetAssetPath: string): Promise<void> {
  const sourceFsPath = toFsPath(sourceAssetPath);
  const targetFsPath = toFsPath(targetAssetPath);

  ensureDir(path.dirname(targetFsPath));

  const sourceExt = path.extname(sourceFsPath).toLowerCase();
  const targetExt = path.extname(targetFsPath).toLowerCase();

  if (sourceExt === targetExt) {
    fs.copyFileSync(sourceFsPath, targetFsPath);
    return;
  }

  if (targetExt === ".jpg" || targetExt === ".jpeg") {
    await sharp(sourceFsPath).jpeg({ quality: 90 }).toFile(targetFsPath);
    return;
  }

  if (targetExt === ".webp") {
    await sharp(sourceFsPath).webp({ quality: 90 }).toFile(targetFsPath);
    return;
  }

  if (targetExt === ".png") {
    await sharp(sourceFsPath).png().toFile(targetFsPath);
    return;
  }

  fs.copyFileSync(sourceFsPath, targetFsPath);
}

function findSourceForImage(slug: string, imagePath: string): string | null {
  const alias = ALIAS_SOURCES[slug];
  if (!alias) return null;

  const direct = buildExpectedPath(alias.sourceDir, imagePath);
  if (assetExists(direct)) return direct;

  for (const candidate of buildPaddedCandidates(alias.sourceDir, imagePath)) {
    if (assetExists(candidate)) return candidate;
  }

  return null;
}

async function fillCatalogGaps(): Promise<FillResult> {
  const entries = JSON.parse(fs.readFileSync(CATALOG_INDEX, "utf8")) as CatalogEntry[];
  const result: FillResult = { created: [], skipped: [], unresolved: [] };

  for (const entry of entries) {
    if (!entry.slug || !Array.isArray(entry.images)) continue;

    for (const imagePath of entry.images) {
      if (typeof imagePath !== "string") continue;
      if (assetExists(imagePath)) {
        result.skipped.push(imagePath);
        continue;
      }

      const exactFill = EXACT_ASSET_FILLS[imagePath];
      if (exactFill?.sourceAssetPath && assetExists(exactFill.sourceAssetPath)) {
        await copyOrConvert(exactFill.sourceAssetPath, imagePath);
        result.created.push(imagePath);
        continue;
      }

      const sourceAsset = findSourceForImage(entry.slug, imagePath);
      if (!sourceAsset) {
        result.unresolved.push({ slug: entry.slug, image: imagePath });
        continue;
      }

      await copyOrConvert(sourceAsset, imagePath);
      result.created.push(imagePath);
    }
  }

  return result;
}

async function fillExplicitCanonicalTargets(result: FillResult): Promise<void> {
  for (const [targetAssetPath, exactFill] of Object.entries(EXACT_ASSET_FILLS)) {
    if (assetExists(targetAssetPath)) {
      if (!result.skipped.includes(targetAssetPath)) result.skipped.push(targetAssetPath);
      continue;
    }

    if (!assetExists(exactFill.sourceAssetPath)) continue;

    await copyOrConvert(exactFill.sourceAssetPath, targetAssetPath);
    result.created.push(targetAssetPath);
  }
}

async function main(): Promise<void> {
  const beforeEntries = JSON.parse(fs.readFileSync(CATALOG_INDEX, "utf8")) as CatalogEntry[];
  const expectedCount = beforeEntries.reduce(
    (sum, entry) => sum + (Array.isArray(entry.images) ? entry.images.length : 0),
    0,
  );

  const result = await fillCatalogGaps();
  await fillExplicitCanonicalTargets(result);

  ensureDir(path.dirname(REPORT_PATH));
  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        expectedCount,
        createdCount: result.created.length,
        skippedCount: result.skipped.length,
        unresolvedCount: result.unresolved.length,
        aliases: ALIAS_SOURCES,
        created: result.created,
        unresolved: result.unresolved,
      },
      null,
      2,
    ),
  );

  console.log("Supabase catalog asset arrangement complete.");
  console.log(`Created: ${result.created.length}`);
  console.log(`Already present: ${result.skipped.length}`);
  console.log(`Unresolved: ${result.unresolved.length}`);
  console.log(`Report: ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error("Supabase catalog asset arrangement failed:", error);
  process.exit(1);
});
