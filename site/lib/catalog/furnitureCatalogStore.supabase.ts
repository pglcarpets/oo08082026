/**
 * Furniture catalog — Supabase-only (`public.furniture_catalog` on the Admin
 * project, asset bytes in the `catalog-assets` bucket).
 *
 * Call only when `getFurnitureCatalogMode()` is `supabase`. No dual-write: the
 * disk store under `site/platform/shared/data/furniture/` is the other exclusive
 * mode, used for local `pnpm run dev` only.
 *
 * Neutral module — the Studio writes this library and the Planner reads it, and
 * the two products may not import each other (`pnpm run scan:boundaries`).
 */

import "server-only";

import { createSupabaseAuthAdminClient } from "@/platform/supabase/auth-admin";
import {
  furnitureLibraryAssetPath,
  uploadCatalogAssetBinary,
} from "@/features/shared/catalog/catalogAssetStorage.server";

const TABLE = "furniture_catalog";

/** Columns as stored; mirrors the item object the Studio route builds. */
type FurnitureRow = {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  tags: string[] | null;
  dimensions: Record<string, unknown> | null;
  notes: string | null;
  is_custom: boolean;
  thumbnail_url: string | null;
  top_png_url: string | null;
  top_svg_url: string | null;
  front_png_url: string | null;
  side_png_url: string | null;
  top_png_checksum: string | null;
  top_fabric_json: unknown;
  front_fabric_json: unknown;
  side_fabric_json: unknown;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Row → the plain item shape both apps already consume. */
function rowToItem(row: FurnitureRow): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    tags: row.tags ?? [],
    dimensions: row.dimensions ?? {},
    notes: row.notes,
    is_custom: row.is_custom,
    thumbnail_url: row.thumbnail_url,
    top_png_url: row.top_png_url,
    top_svg_url: row.top_svg_url,
    front_png_url: row.front_png_url,
    side_png_url: row.side_png_url,
    top_png_checksum: row.top_png_checksum,
    top_fabric_json: row.top_fabric_json ?? null,
    front_fabric_json: row.front_fabric_json ?? null,
    side_fabric_json: row.side_fabric_json ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function itemToRow(item: Record<string, unknown>): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    id: str(item.id),
    name: str(item.name, "Untitled"),
    category: str(item.category, "uncategorized"),
    subcategory: typeof item.subcategory === "string" ? item.subcategory : null,
    tags: Array.isArray(item.tags)
      ? item.tags.filter((t): t is string => typeof t === "string")
      : [],
    dimensions:
      item.dimensions && typeof item.dimensions === "object" ? item.dimensions : {},
    notes: typeof item.notes === "string" ? item.notes : null,
    is_custom: item.is_custom !== false,
    thumbnail_url: typeof item.thumbnail_url === "string" ? item.thumbnail_url : null,
    top_png_url: typeof item.top_png_url === "string" ? item.top_png_url : null,
    top_svg_url: typeof item.top_svg_url === "string" ? item.top_svg_url : null,
    front_png_url: typeof item.front_png_url === "string" ? item.front_png_url : null,
    side_png_url: typeof item.side_png_url === "string" ? item.side_png_url : null,
    top_png_checksum:
      typeof item.top_png_checksum === "string" ? item.top_png_checksum : null,
    top_fabric_json: item.top_fabric_json ?? null,
    front_fabric_json: item.front_fabric_json ?? null,
    side_fabric_json: item.side_fabric_json ?? null,
    created_by: typeof item.created_by === "string" ? item.created_by : null,
    created_at: str(item.created_at, now),
    updated_at: str(item.updated_at, now),
  };
}

function table(client: ReturnType<typeof createSupabaseAuthAdminClient>) {
  return client.from(TABLE);
}

/**
 * Catalog entries, ordered the way both rails expect: seeded items first, then
 * custom uploads, each group by name. Matches the disk store's sort exactly.
 */
export async function listFurnitureFromSupabase(): Promise<
  Record<string, unknown>[]
> {
  const { data, error } = await table(createSupabaseAuthAdminClient())
    .select("*")
    .order("is_custom", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(`furniture_catalog list failed: ${error.message}`);
  return ((data as unknown as FurnitureRow[] | null) ?? []).map(rowToItem);
}

export async function loadFurnitureFromSupabase(
  itemId: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await table(createSupabaseAuthAdminClient())
    .select("*")
    .eq("id", itemId)
    .maybeSingle();
  if (error) throw new Error(`furniture_catalog load failed: ${error.message}`);
  return data ? rowToItem(data as unknown as FurnitureRow) : null;
}

export async function writeFurnitureToSupabase(
  item: Record<string, unknown>,
): Promise<void> {
  const { error } = await table(createSupabaseAuthAdminClient()).upsert(
    itemToRow(item) as never,
    { onConflict: "id" },
  );
  if (error) throw new Error(`furniture_catalog upsert failed: ${error.message}`);
}

export async function deleteFurnitureFromSupabase(
  itemId: string,
): Promise<boolean> {
  const { data, error } = await table(createSupabaseAuthAdminClient())
    .delete()
    .eq("id", itemId)
    .select("id");
  if (error) throw new Error(`furniture_catalog delete failed: ${error.message}`);
  return Array.isArray(data) && data.length > 0;
}

/**
 * Upload one furniture asset and return its public URL.
 * Throws rather than returning a partial item — a row whose `top_png_url`
 * silently points nowhere is worse than a failed save.
 */
export async function uploadFurnitureAsset(args: {
  itemId: string;
  filename: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  const path = furnitureLibraryAssetPath(args.itemId, args.filename);
  const result = await uploadCatalogAssetBinary({
    path,
    body: args.body,
    contentType: args.contentType,
    upsert: true,
    client: createSupabaseAuthAdminClient(),
  });
  if (!result.ok) {
    throw new Error(`furniture asset upload failed (${path}): ${result.reason}`);
  }
  return result.publicUrl;
}

/** Decode a `data:` URL. Local copy — both product stores declare their own. */
function decodeDataUrl(dataUrl: string): { raw: Buffer; mime: string } {
  if (!dataUrl.startsWith("data:")) {
    throw new Error("Expected a data: URL");
  }
  const comma = dataUrl.indexOf(",");
  const header = dataUrl.slice(0, comma);
  const encoded = dataUrl.slice(comma + 1);
  const mime = header.split(":")[1]?.split(";")[0] || "application/octet-stream";
  return header.includes(";base64")
    ? { raw: Buffer.from(encoded, "base64"), mime }
    : { raw: Buffer.from(decodeURIComponent(encoded), "utf8"), mime };
}

/** Max-edge-240 catalog thumbnail; falls back to the original on any failure. */
async function thumbnailFromPng(pngBytes: Buffer, maxSize = 240): Promise<Buffer> {
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

/**
 * Storage counterpart of the disk store's `persistFurnitureFiles`: same payload
 * keys, same returned `*_url` keys, public bucket URLs instead of
 * `/api/files/furniture/…` paths.
 */
export async function persistFurnitureAssetsToSupabase(
  itemId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};
  const mapping: Array<[string, string, string, string]> = [
    ["top_png", "top.png", "top_png_url", "image/png"],
    ["front_png", "front.png", "front_png_url", "image/png"],
    ["side_png", "side.png", "side_png_url", "image/png"],
    ["top_svg", "top.svg", "top_svg_url", "image/svg+xml"],
  ];

  for (const [key, filename, urlKey, contentType] of mapping) {
    const dataUrl = payload[key];
    if (typeof dataUrl !== "string" || !dataUrl) continue;
    const { raw } = decodeDataUrl(dataUrl);
    urls[urlKey] = await uploadFurnitureAsset({
      itemId,
      filename,
      body: raw,
      contentType,
    });
    if (key === "top_png") {
      urls.thumbnail_url = await uploadFurnitureAsset({
        itemId,
        filename: "thumb.png",
        body: await thumbnailFromPng(raw),
        contentType: "image/png",
      });
    }
  }
  return urls;
}

/** Upload already-decoded bytes (the multipart upload routes). */
export async function persistFurnitureUploadToSupabase(args: {
  itemId: string;
  bytes: Buffer;
  isSvg: boolean;
}): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};
  if (args.isSvg) {
    urls.top_svg_url = await uploadFurnitureAsset({
      itemId: args.itemId,
      filename: "top.svg",
      body: args.bytes,
      contentType: "image/svg+xml",
    });
    urls.thumbnail_url = urls.top_svg_url;
    return urls;
  }
  urls.top_png_url = await uploadFurnitureAsset({
    itemId: args.itemId,
    filename: "top.png",
    body: args.bytes,
    contentType: "image/png",
  });
  urls.thumbnail_url = await uploadFurnitureAsset({
    itemId: args.itemId,
    filename: "thumb.png",
    body: await thumbnailFromPng(args.bytes),
    contentType: "image/png",
  });
  return urls;
}
