import { NextResponse } from "next/server";
import {
  BadRequestError,
  listFurnitureCatalog,
  persistFurnitureAssets,
  readJsonBody,
  slugify,
  shortId,
  nowIso,
  writeFurnitureItem,
} from "@studio/server/studioStore";
import {
  prepareStudioFurnitureCatalogFiles,
  resolveFurnitureFootprintMm,
} from "@studio/server/prepareStudioFurnitureCatalogFiles";
import { ensureFurnitureSeeded } from "@studio/server/studioFurnitureSeed";
import { withAuth } from "@/features/shared/api/withAuth";

export const GET = withAuth(
  async (request) => {
    await ensureFurnitureSeeded();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q");
    let items = await listFurnitureCatalog();
    if (category && category !== "all") {
      items = items.filter((i) => i.category === category);
    }
    if (q) {
      const needle = q.toLowerCase().trim();
      items = items.filter((i) => {
        const name = String(i.name || "").toLowerCase();
        const tags = Array.isArray(i.tags) ? i.tags.join(" ").toLowerCase() : "";
        return name.includes(needle) || tags.includes(needle);
      });
    }
    return NextResponse.json(items);
  },
  {
    role: "guest",
    rateLimitScope: "studio-furniture:get",
    rateLimit: 60,
  },
);

export const POST = withAuth(
  async (request) => {
    try {
      return await createFurniture(request);
    } catch (e) {
      if (e instanceof BadRequestError) {
        return NextResponse.json({ detail: e.message }, { status: 400 });
      }
      throw e;
    }
  },
  {
    role: "guest",
    rateLimitScope: "studio-furniture:post",
    rateLimit: 30,
    requireCsrf: true,
  },
);

async function createFurniture(request: Request) {
  const rawPayload = await readJsonBody(request);
  const name = String(rawPayload.name || "item");
  const itemId = `f_${slugify(name)}_${shortId()}`;
  const now = nowIso();
  const dimensions =
    (rawPayload.dimensions as Record<string, number> | undefined) || {
      width_mm: 0,
      depth_mm: 0,
      height_mm: 0,
    };
  const footprint = resolveFurnitureFootprintMm({
    ...rawPayload,
    dimensions,
  });
  const prepared = await prepareStudioFurnitureCatalogFiles(itemId, rawPayload, footprint);
  const fileUrls = await persistFurnitureAssets(itemId, prepared.payload);
  const item = {
    id: itemId,
    name,
    category: String(rawPayload.category || "uncategorized"),
    subcategory: rawPayload.subcategory ?? null,
    tags: Array.isArray(rawPayload.tags) ? rawPayload.tags : [],
    dimensions,
    notes: rawPayload.notes ?? null,
    is_custom: rawPayload.is_custom !== false,
    thumbnail_url: fileUrls.thumbnail_url ?? null,
    top_png_url: fileUrls.top_png_url ?? null,
    top_svg_url: fileUrls.top_svg_url ?? null,
    front_png_url: fileUrls.front_png_url ?? null,
    side_png_url: fileUrls.side_png_url ?? null,
    /** Additive SHA-256 of accepted catalog top_png bytes. */
    top_png_checksum: prepared.top_png_checksum,
    top_fabric_json: rawPayload.top_fabric_json ?? null,
    front_fabric_json: rawPayload.front_fabric_json ?? null,
    side_fabric_json: rawPayload.side_fabric_json ?? null,
    created_at: now,
    updated_at: now,
  };
  await writeFurnitureItem(item);
  return NextResponse.json(item, { status: 201 });
}
