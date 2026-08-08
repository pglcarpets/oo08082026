import { NextResponse, type NextRequest } from "next/server";
import {
  BadRequestError,
  deleteFurnitureItem,
  loadFurnitureItem,
  nowIso,
  persistFurnitureAssets,
  readJsonBody,
  writeFurnitureItem,
} from "@studio/server/studioStore";
import {
  prepareStudioFurnitureCatalogFiles,
  resolveFurnitureFootprintMm,
} from "@studio/server/prepareStudioFurnitureCatalogFiles";
import { withAuth, type AuthContext } from "@/features/shared/api/withAuth";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(
  async (_request: NextRequest, _auth: AuthContext, context: Ctx) => {
    const { id } = await context.params;
    const item = await loadFurnitureItem(id);
    if (!item) {
      return NextResponse.json({ detail: "Furniture not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  },
  {
    role: "guest",
    rateLimitScope: "studio-furniture-id:get",
    rateLimit: 60,
  },
);

export const PATCH = withAuth(
  async (request: NextRequest, _auth: AuthContext, context: Ctx) => {
    try {
      return await patchFurniture(request, context);
    } catch (e) {
      if (e instanceof BadRequestError) {
        return NextResponse.json({ detail: e.message }, { status: 400 });
      }
      throw e;
    }
  },
  {
    role: "guest",
    rateLimitScope: "studio-furniture-id:patch",
    rateLimit: 30,
    requireCsrf: true,
  },
);

async function patchFurniture(request: Request, context: Ctx) {
  const { id } = await context.params;
  const item = await loadFurnitureItem(id);
  if (!item) {
    return NextResponse.json({ detail: "Furniture not found" }, { status: 404 });
  }
  const updates = await readJsonBody(request);
  if (updates.dimensions && typeof updates.dimensions === "object") {
    item.dimensions = updates.dimensions;
  }
  const dims =
    item.dimensions && typeof item.dimensions === "object"
      ? (item.dimensions as Record<string, unknown>)
      : {};
  const footprint = resolveFurnitureFootprintMm({
    ...updates,
    dimensions: updates.dimensions ?? dims,
  });
  const prepared = await prepareStudioFurnitureCatalogFiles(id, updates, footprint);
  const fileUrls = await persistFurnitureAssets(id, prepared.payload);
  for (const key of [
    "name",
    "category",
    "subcategory",
    "tags",
    "notes",
    "top_fabric_json",
    "front_fabric_json",
    "side_fabric_json",
  ] as const) {
    if (key in updates) item[key] = updates[key];
  }
  Object.assign(item, fileUrls);
  if (prepared.top_png_checksum) {
    item.top_png_checksum = prepared.top_png_checksum;
  }
  item.updated_at = nowIso();
  await writeFurnitureItem(item);
  return NextResponse.json(item);
}

export const DELETE = withAuth(
  async (_request: NextRequest, _auth: AuthContext, context: Ctx) => {
    const { id } = await context.params;
    const ok = await deleteFurnitureItem(id);
    if (!ok) {
      return NextResponse.json({ detail: "Furniture not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  },
  {
    role: "guest",
    rateLimitScope: "studio-furniture-id:delete",
    rateLimit: 20,
    requireCsrf: true,
  },
);
