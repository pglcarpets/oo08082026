import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import {
  buildBasenameIndex,
  copyWebAsset,
  localAssetExists,
  resolveMissingAssetPath,
} from "./lib/cdnAssetResolver";
import { REPO_ROOT, SITE_PACKAGE_ROOT } from "./lib/repoRoot";

dotenv.config({ path: path.resolve(REPO_ROOT, ".env.local") });
dotenv.config({ path: path.resolve(SITE_PACKAGE_ROOT, ".env.local") });

export const CDN_BASE_URL = "https://oando-worker-proxy.mayoite.workers.dev";
export const PUBLIC_DIR = path.resolve(SITE_PACKAGE_ROOT, "public");

/** Editorial/marketing raster paths — CDN-backed; pulled into site/public for local fallback. */
export const MARKETING_SURFACE_CDN_PATHS = [
  "/assets/marketing/hero/dmrc-hero.webp",
  "/assets/marketing/hero/titan-patna-hero.webp",
  "/assets/marketing/hero/titan-patna-hq.webp",
  "/assets/marketing/hero/tvs-patna-hero.webp",
  "/assets/marketing/hero/usha-hero.webp",
  "/assets/marketing/hero/about-story.webp",
  "/assets/marketing/hero/27-06-2025 Image 03.webp",
  "/assets/marketing/hero/27-06-2025 Image 06.webp",
  "/assets/catalog/oando-seating--breeze/image-1.jpg",
] as const;

export async function downloadFile(
  url: string,
  destPath: string,
  relPath: string,
  basenameIndex: Map<string, string[]>,
  deps: {
    exists?: typeof fs.existsSync;
    mkdir?: typeof fs.mkdirSync;
    writeFile?: typeof fs.writeFileSync;
    localExists?: typeof localAssetExists;
    resolveMissing?: typeof resolveMissingAssetPath;
    copyLocal?: typeof copyWebAsset;
    fetchImpl?: typeof fetch;
    log?: typeof console.log;
    warn?: typeof console.warn;
    error?: typeof console.error;
  } = {},
): Promise<boolean> {
  const exists = deps.exists ?? fs.existsSync;
  const mkdir = deps.mkdir ?? fs.mkdirSync;
  const writeFile = deps.writeFile ?? fs.writeFileSync;
  const localExists = deps.localExists ?? localAssetExists;
  const resolveMissing = deps.resolveMissing ?? resolveMissingAssetPath;
  const copyLocal = deps.copyLocal ?? copyWebAsset;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const log = deps.log ?? console.log;
  const warn = deps.warn ?? console.warn;
  const error = deps.error ?? console.error;

  const dir = path.dirname(destPath);
  if (!exists(dir)) {
    mkdir(dir, { recursive: true });
  }

  if (localExists(relPath)) {
    return true;
  }

  const resolution = resolveMissing(relPath, basenameIndex);
  if (resolution.kind === "copy") {
    copyLocal(resolution.sourceWebPath, relPath);
    log(`✅ Copied local fallback: ${resolution.sourceWebPath} -> ${relPath}`);
    return true;
  }

  try {
    const res = await fetchImpl(url);
    if (!res.ok) {
      warn(`⚠️ Failed to download: ${url} (Status: ${res.status})`);
      return false;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFile(destPath, buffer);
    log(`✅ Downloaded: ${url} -> ${path.relative(REPO_ROOT, destPath)}`);
    return true;
  } catch (err) {
    error(`❌ Error downloading ${url}:`, err);
    return false;
  }
}

export function collectPathsFromCatalogItems(data: unknown): string[] {
  const paths: string[] = [];
  if (!Array.isArray(data)) return paths;
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (Array.isArray(row.images)) {
      for (const img of row.images) {
        if (typeof img === "string") paths.push(img);
      }
    }
    if (typeof row.flagship_image === "string") {
      paths.push(row.flagship_image);
    }
    if (Array.isArray(row.scene_images)) {
      for (const img of row.scene_images) {
        if (typeof img === "string") paths.push(img);
      }
    }
    if (row.metadata && typeof row.metadata === "object") {
      const m = row.metadata as Record<string, unknown>;
      if (typeof m.threeDModelUrl === "string") paths.push(m.threeDModelUrl);
      if (typeof m["3d_model"] === "string") paths.push(m["3d_model"]);
    }
    if (typeof row.image_url === "string") paths.push(row.image_url);
  }
  return paths;
}

export function filterLocalRelativePaths(assetPaths: Iterable<string>): string[] {
  return Array.from(assetPaths)
    .map((p) => p.trim())
    .filter((p) => p.startsWith("/") && !p.startsWith("//"));
}

export async function collectAssetPathsFromSources(
  deps: {
    exists?: typeof fs.existsSync;
    readFile?: typeof fs.readFileSync;
    createSupabase?: typeof createClient;
    supabaseUrl?: string | undefined;
    supabaseKey?: string | undefined;
    error?: typeof console.error;
    log?: typeof console.log;
    warn?: typeof console.warn;
  } = {},
): Promise<string[]> {
  const exists = deps.exists ?? fs.existsSync;
  const readFile = deps.readFile ?? fs.readFileSync;
  const createSupabase = deps.createSupabase ?? createClient;
  const error = deps.error ?? console.error;
  const log = deps.log ?? console.log;
  const warn = deps.warn ?? console.warn;
  const supabaseUrl =
    deps.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    deps.supabaseKey ??
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY);

  const assetPaths = new Set<string>();

  for (const marketingPath of MARKETING_SURFACE_CDN_PATHS) {
    assetPaths.add(marketingPath);
  }

  const localIndex = path.resolve(
    SITE_PACKAGE_ROOT,
    "features/site/data/localCatalogIndex.json",
  );
  if (exists(localIndex)) {
    try {
      const data = JSON.parse(readFile(localIndex, "utf8"));
      for (const p of collectPathsFromCatalogItems(data)) assetPaths.add(p);
    } catch (e) {
      error("Error reading localCatalogIndex.json:", e);
    }
  }

  const seatingPath = path.resolve(REPO_ROOT, "scripts/catalog-seating.json");
  if (exists(seatingPath)) {
    try {
      const data = JSON.parse(readFile(seatingPath, "utf8"));
      for (const p of collectPathsFromCatalogItems(data)) assetPaths.add(p);
    } catch (e) {
      error("Error reading catalog-seating.json:", e);
    }
  }

  if (supabaseUrl && supabaseKey) {
    try {
      log(`Connecting to Supabase at ${supabaseUrl}...`);
      const supabase = createSupabase(supabaseUrl, supabaseKey) as SupabaseClient;

      const { data: catProdData, error: catProdErr } = await supabase
        .from("catalog_products")
        .select("images, flagship_image, scene_images, metadata");

      if (!catProdErr && catProdData) {
        for (const p of collectPathsFromCatalogItems(catProdData)) assetPaths.add(p);
      }

      const { data: prodData, error: prodErr } = await supabase
        .from("products")
        .select("images, flagship_image, metadata");

      if (!prodErr && prodData) {
        for (const p of collectPathsFromCatalogItems(prodData)) assetPaths.add(p);
      }

      const { data: pImgData, error: pImgErr } = await supabase
        .from("product_images")
        .select("image_url");
      if (!pImgErr && pImgData) {
        for (const p of collectPathsFromCatalogItems(pImgData)) assetPaths.add(p);
      }
    } catch (dbErr) {
      warn("Could not query Supabase tables for assets:", dbErr);
    }
  }

  return filterLocalRelativePaths(assetPaths);
}

export async function run(
  deps: {
    collect?: typeof collectAssetPathsFromSources;
    download?: typeof downloadFile;
    buildIndex?: typeof buildBasenameIndex;
    publicDir?: string;
    cdnBase?: string;
    log?: typeof console.log;
  } = {},
): Promise<{ total: number; successCount: number }> {
  const collect = deps.collect ?? collectAssetPathsFromSources;
  const download = deps.download ?? downloadFile;
  const buildIndex = deps.buildIndex ?? buildBasenameIndex;
  const publicDir = deps.publicDir ?? PUBLIC_DIR;
  const cdnBase = deps.cdnBase ?? CDN_BASE_URL;
  const log = deps.log ?? console.log;

  log("🔍 Scanning for CDN assets to download locally...");
  const localRelativePaths = await collect();
  log(`Found ${localRelativePaths.length} unique asset paths referenced.`);

  let successCount = 0;
  const basenameIndex = buildIndex("images");

  for (const relPath of localRelativePaths) {
    const cdnUrl = `${cdnBase}${relPath}`;
    const localDest = path.join(publicDir, relPath.replace(/\//g, path.sep));
    const success = await download(cdnUrl, localDest, relPath, basenameIndex);
    if (success) successCount += 1;
  }

  log(
    `Finished downloading CDN assets locally. Success: ${successCount}/${localRelativePaths.length}`,
  );
  return { total: localRelativePaths.length, successCount };
}

function isMain(): boolean {
  const entry = (process.argv[1] ?? "").replace(/\\/g, "/");
  return entry.endsWith("downloadCdnAssets.ts") || entry.endsWith("downloadCdnAssets.js");
}

if (isMain()) {
  run().catch(console.error);
}
