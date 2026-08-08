import { NextResponse } from "next/server";
import {
  ensureStorageDirs,
  nowIso,
  persistFurnitureUpload,
  shortId,
  slugify,
  writeFurnitureItem,
} from "@studio/server/studioStore";
import { withAuth } from "@/features/shared/api/withAuth";

export const POST = withAuth(
  async (request) => {
    await ensureStorageDirs();
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ detail: "Expected multipart/form-data" }, { status: 400 });
    }
    const file = form.get("file");
    const name = String(form.get("name") || "upload");
    const category = String(form.get("category") || "uncategorized");
    const width_mm = Number(form.get("width_mm") || 0);
    const depth_mm = Number(form.get("depth_mm") || 0);
    const height_mm = Number(form.get("height_mm") || 0);
    const subcategory = String(form.get("subcategory") || "") || null;
    const tagsRaw = String(form.get("tags") || "");
    if (!(file instanceof File)) {
      return NextResponse.json({ detail: "file required" }, { status: 400 });
    }
    const itemId = `f_${slugify(name)}_${shortId()}`;
    const now = nowIso();
    const raw = Buffer.from(await file.arrayBuffer());
    const isSvg =
      (file.type || "").includes("svg") || file.name.toLowerCase().endsWith(".svg");
    const urls = await persistFurnitureUpload({ itemId, bytes: raw, isSvg });
    const item = {
      id: itemId,
      name,
      category,
      subcategory,
      tags: tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      dimensions: { width_mm, depth_mm, height_mm },
      notes: null,
      is_custom: true,
      thumbnail_url: urls.thumbnail_url ?? null,
      top_png_url: urls.top_png_url ?? null,
      top_svg_url: urls.top_svg_url ?? null,
      front_png_url: null,
      side_png_url: null,
      top_fabric_json: null,
      front_fabric_json: null,
      side_fabric_json: null,
      created_at: now,
      updated_at: now,
    };
    await writeFurnitureItem(item);
    return NextResponse.json(item, { status: 201 });
  },
  {
    role: "guest",
    rateLimitScope: "studio-furniture-upload:post",
    rateLimit: 15,
    requireCsrf: true,
  },
);
