import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { resolveSitePackageRoot } from "@/lib/paths/sitePackageRoot";
import { getFurnitureCatalogMode } from "@/lib/catalog/furnitureCatalogMode";

/**
 * Furniture Studio disk store — the furniture library and uploads.
 *
 * The Planner has its own `plannerStore.ts`. Both address the same furniture
 * library under `site/platform/shared/data/` (one store, separate handlers) but
 * neither imports the other; the layout below is this app's own declaration of it.
 */

const PLATFORM = path.join(resolveSitePackageRoot(), "platform");
/** Shared furniture library on disk — Studio owns CRUD and seeding. */
export const FURNITURE_DIR = path.join(PLATFORM, "shared", "data", "furniture");
/** Studio-owned storage. */
export const UPLOADS_DIR = path.join(PLATFORM, "Studio", "data", "uploads");

export async function ensureStorageDirs(): Promise<void> {
  await Promise.all([FURNITURE_DIR, UPLOADS_DIR].map((d) => fs.mkdir(d, { recursive: true })));
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function slugify(text: string): string {
  const cleaned = (text || "")
    .replace(/[^a-zA-Z0-9\-\s]/g, "")
    .trim()
    .toLowerCase();
  return cleaned.replace(/[\s-]+/g, "-") || "item";
}

export function shortId(): string {
  return randomBytes(3).toString("hex");
}

/**
 * Bad client input. Route handlers translate this into a 400 so a malformed
 * request body can never surface as an unhandled 500.
 *
 * The Planner declares its own copy in `plannerStore.ts` — duplicated on purpose.
 */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

/** Parse a JSON request body, rejecting non-objects and malformed payloads. */
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    throw new BadRequestError("Malformed JSON body");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new BadRequestError("Expected a JSON object body");
  }
  return parsed as Record<string, unknown>;
}

export function decodeDataUrl(dataUrl: string): { raw: Buffer; mime: string } {
  if (!dataUrl.startsWith("data:")) {
    throw new BadRequestError("Expected a data: URL");
  }
  const comma = dataUrl.indexOf(",");
  const header = dataUrl.slice(0, comma);
  const encoded = dataUrl.slice(comma + 1);
  const mime = header.split(":")[1]?.split(";")[0] || "application/octet-stream";
  if (header.includes(";base64")) {
    return { raw: Buffer.from(encoded, "base64"), mime };
  }
  return { raw: Buffer.from(decodeURIComponent(encoded), "utf8"), mime };
}

export async function readJson<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf8");
  return (content.trim() ? JSON.parse(content) : {}) as T;
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function writeBytes(filePath: string, data: Buffer): Promise<void> {
  await fs.writeFile(filePath, data);
}

/** Downscale a PNG for catalog thumbnails — max edge 240px. */
export async function thumbnailFromPng(pngBytes: Buffer, maxSize = 240): Promise<Buffer> {
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(pngBytes)
      .resize(maxSize, maxSize, { fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 8 })
      .toBuffer();
  } catch {
    return pngBytes;
  }
}

export async function persistFurnitureFiles(
  itemId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, string>> {
  await ensureStorageDirs();
  const urls: Record<string, string> = {};
  const mapping: Array<[string, string, string]> = [
    ["top_png", `${itemId}_top.png`, "top_png_url"],
    ["front_png", `${itemId}_front.png`, "front_png_url"],
    ["side_png", `${itemId}_side.png`, "side_png_url"],
    ["top_svg", `${itemId}_top.svg`, "top_svg_url"],
  ];
  for (const [key, filename, urlKey] of mapping) {
    const dataUrl = payload[key];
    if (typeof dataUrl !== "string" || !dataUrl) continue;
    const { raw } = decodeDataUrl(dataUrl);
    await writeBytes(path.join(FURNITURE_DIR, filename), raw);
    urls[urlKey] = `/api/files/furniture/${filename}`;
    if (key === "top_png") {
      const thumb = await thumbnailFromPng(raw);
      await writeBytes(path.join(FURNITURE_DIR, `${itemId}_thumb.png`), thumb);
      urls.thumbnail_url = `/api/files/furniture/${itemId}_thumb.png`;
    }
  }
  return urls;
}

export async function listFurnitureFromDisk(): Promise<Record<string, unknown>[]> {
  await ensureStorageDirs();
  const entries = await fs.readdir(FURNITURE_DIR);
  const items: Record<string, unknown>[] = [];
  for (const name of entries) {
    if (!name.endsWith(".json")) continue;
    try {
      items.push(await readJson(path.join(FURNITURE_DIR, name)));
    } catch {
      /* skip bad */
    }
  }
  items.sort((a, b) => {
    const ac = a.is_custom ? 1 : 0;
    const bc = b.is_custom ? 1 : 0;
    if (ac !== bc) return ac - bc;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
  return items;
}

export async function loadFurniture(itemId: string): Promise<Record<string, unknown> | null> {
  const meta = path.join(FURNITURE_DIR, `${itemId}.json`);
  try {
    await fs.access(meta);
    return await readJson(meta);
  } catch {
    return null;
  }
}

export async function writeFurniture(item: Record<string, unknown>): Promise<void> {
  await ensureStorageDirs();
  await writeJson(path.join(FURNITURE_DIR, `${item.id}.json`), item);
}

export async function deleteFurnitureFiles(itemId: string): Promise<boolean> {
  await ensureStorageDirs();
  const entries = await fs.readdir(FURNITURE_DIR);
  const matched = entries.filter(
    (n) => n === `${itemId}.json` || n.startsWith(`${itemId}_`) || n.startsWith(`${itemId}.`),
  );
  if (matched.length === 0) return false;
  await Promise.all(matched.map((n) => fs.unlink(path.join(FURNITURE_DIR, n))));
  return true;
}

export function safeFilename(name: string): string | null {
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) return null;
  return name;
}

// ---------------------------------------------------------------------------
// Mode-aware catalog access
// ---------------------------------------------------------------------------
// The disk helpers above remain the local-dev path and back the seeder and the
// `/api/files/furniture/[filename]` reader. Route handlers should call these
// wrappers instead, so production (read-only filesystem) writes to Supabase.
// The Planner declares its own equivalents in `plannerStore.ts` — duplicated on
// purpose, the two products never import each other.

export async function listFurnitureCatalog(): Promise<Record<string, unknown>[]> {
  if (getFurnitureCatalogMode() === "disk") {
    return listFurnitureFromDisk();
  }
  const { listFurnitureFromSupabase } = await import(
    "@/lib/catalog/furnitureCatalogStore.supabase"
  );
  return listFurnitureFromSupabase();
}

export async function loadFurnitureItem(
  itemId: string,
): Promise<Record<string, unknown> | null> {
  if (getFurnitureCatalogMode() === "disk") {
    return loadFurniture(itemId);
  }
  const { loadFurnitureFromSupabase } = await import(
    "@/lib/catalog/furnitureCatalogStore.supabase"
  );
  return loadFurnitureFromSupabase(itemId);
}

export async function writeFurnitureItem(
  item: Record<string, unknown>,
): Promise<void> {
  if (getFurnitureCatalogMode() === "disk") {
    return writeFurniture(item);
  }
  const { writeFurnitureToSupabase } = await import(
    "@/lib/catalog/furnitureCatalogStore.supabase"
  );
  return writeFurnitureToSupabase(item);
}

export async function deleteFurnitureItem(itemId: string): Promise<boolean> {
  if (getFurnitureCatalogMode() === "disk") {
    return deleteFurnitureFiles(itemId);
  }
  const { deleteFurnitureFromSupabase } = await import(
    "@/lib/catalog/furnitureCatalogStore.supabase"
  );
  return deleteFurnitureFromSupabase(itemId);
}

/** Same payload keys and same returned `*_url` keys in both modes. */
export async function persistFurnitureAssets(
  itemId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, string>> {
  if (getFurnitureCatalogMode() === "disk") {
    return persistFurnitureFiles(itemId, payload);
  }
  const { persistFurnitureAssetsToSupabase } = await import(
    "@/lib/catalog/furnitureCatalogStore.supabase"
  );
  return persistFurnitureAssetsToSupabase(itemId, payload);
}

/** Multipart upload bytes (`/api/Studio/furniture/upload`). */
export async function persistFurnitureUpload(args: {
  itemId: string;
  bytes: Buffer;
  isSvg: boolean;
}): Promise<Record<string, string>> {
  if (getFurnitureCatalogMode() === "disk") {
    const filename = `${args.itemId}_top${args.isSvg ? ".svg" : ".png"}`;
    await writeBytes(path.join(FURNITURE_DIR, filename), args.bytes);
    const urls: Record<string, string> = {};
    if (args.isSvg) {
      urls.top_svg_url = `/api/files/furniture/${filename}`;
      urls.thumbnail_url = urls.top_svg_url;
      return urls;
    }
    urls.top_png_url = `/api/files/furniture/${filename}`;
    const thumb = await thumbnailFromPng(args.bytes);
    await writeBytes(path.join(FURNITURE_DIR, `${args.itemId}_thumb.png`), thumb);
    urls.thumbnail_url = `/api/files/furniture/${args.itemId}_thumb.png`;
    return urls;
  }
  const { persistFurnitureUploadToSupabase } = await import(
    "@/lib/catalog/furnitureCatalogStore.supabase"
  );
  return persistFurnitureUploadToSupabase(args);
}
