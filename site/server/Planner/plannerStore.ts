import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { resolveSitePackageRoot } from "@/lib/paths/sitePackageRoot";
import { getFurnitureCatalogMode } from "@/lib/catalog/furnitureCatalogMode";

/**
 * Floor Planner disk store — saved plans, catalog reads for the furniture rail,
 * and Planner-side custom uploads.
 *
 * The Studio has its own `studioStore.ts`. Both address the same furniture
 * library under `site/platform/shared/data/` (one store, separate handlers) but
 * neither imports the other; the layout below is this app's own declaration of it.
 */

const PLATFORM = path.join(resolveSitePackageRoot(), "platform");
/** Planner-owned storage. */
export const PROJECTS_DIR = path.join(PLATFORM, "Planner", "data", "projects");
/** Shared furniture library on disk — Planner lists it and appends its own uploads. */
export const FURNITURE_DIR = path.join(PLATFORM, "shared", "data", "furniture");

export async function ensureStorageDirs(): Promise<void> {
  await Promise.all([PROJECTS_DIR, FURNITURE_DIR].map((d) => fs.mkdir(d, { recursive: true })));
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
 * The Studio declares its own copy in `studioStore.ts` — duplicated on purpose.
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
  const handle = await fs.open(filePath, "w");
  await handle.writeFile(JSON.stringify(data, null, 2), "utf8");
  await handle.sync();
  await handle.close();
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

export async function listProjectsFromDisk(): Promise<Record<string, unknown>[]> {
  await ensureStorageDirs();
  const entries = await fs.readdir(PROJECTS_DIR);
  const withStat: Array<{ name: string; mtime: number }> = [];
  for (const name of entries) {
    if (!name.endsWith(".json")) continue;
    const st = await fs.stat(path.join(PROJECTS_DIR, name));
    withStat.push({ name, mtime: st.mtimeMs });
  }
  withStat.sort((a, b) => b.mtime - a.mtime);
  const projects: Record<string, unknown>[] = [];
  for (const { name } of withStat) {
    try {
      projects.push(await readJson(path.join(PROJECTS_DIR, name)));
    } catch {
      /* skip */
    }
  }
  return projects;
}

export async function loadProject(projectId: string): Promise<Record<string, unknown> | null> {
  const meta = path.join(PROJECTS_DIR, `${projectId}.json`);
  try {
    await fs.access(meta);
    return await readJson(meta);
  } catch {
    return null;
  }
}

export async function writeProject(project: Record<string, unknown>): Promise<void> {
  await ensureStorageDirs();
  await writeJson(path.join(PROJECTS_DIR, `${project.id}.json`), project);
}

export async function deleteProjectFiles(projectId: string): Promise<boolean> {
  await ensureStorageDirs();
  const entries = await fs.readdir(PROJECTS_DIR);
  const matched = entries.filter(
    (n) => n === `${projectId}.json` || n.startsWith(`${projectId}_`),
  );
  if (matched.length === 0) return false;
  await Promise.all(matched.map((n) => fs.unlink(path.join(PROJECTS_DIR, n))));
  return true;
}

/** Catalog entries available to place on a plan. */
export async function listCatalogFromDisk(): Promise<Record<string, unknown>[]> {
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

/** Append a Planner-uploaded custom item to the shared library on disk. */
export async function writeCatalogItem(item: Record<string, unknown>): Promise<void> {
  await ensureStorageDirs();
  await writeJson(path.join(FURNITURE_DIR, `${item.id}.json`), item);
}

export function safeFilename(name: string): string | null {
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) return null;
  return name;
}

// ---------------------------------------------------------------------------
// Mode-aware catalog access
// ---------------------------------------------------------------------------
// The disk helpers above remain the local-dev path. Route handlers should call
// these wrappers, so production (read-only filesystem) reads and writes
// Supabase. The Studio declares its own equivalents in `studioStore.ts` —
// duplicated on purpose, the two products never import each other.

/** Catalog entries available to place on a plan. */
export async function listCatalog(): Promise<Record<string, unknown>[]> {
  if (getFurnitureCatalogMode() === "disk") {
    return listCatalogFromDisk();
  }
  const { listFurnitureFromSupabase } = await import(
    "@/lib/catalog/furnitureCatalogStore.supabase"
  );
  return listFurnitureFromSupabase();
}

/** Append a Planner-uploaded custom item to the shared library. */
export async function writeCatalogEntry(
  item: Record<string, unknown>,
): Promise<void> {
  if (getFurnitureCatalogMode() === "disk") {
    return writeCatalogItem(item);
  }
  const { writeFurnitureToSupabase } = await import(
    "@/lib/catalog/furnitureCatalogStore.supabase"
  );
  return writeFurnitureToSupabase(item);
}

/** Multipart upload bytes (`/api/Planner/catalog/upload`). */
export async function persistCatalogUpload(args: {
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
