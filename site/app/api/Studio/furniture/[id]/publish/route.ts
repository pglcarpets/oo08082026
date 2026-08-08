/**
 * POST /api/Studio/furniture/[id]/publish
 * Publish a saved Studio furniture draft into versioned block descriptors + lifecycle.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { withAuth, type AuthContext } from "@/features/shared/api/withAuth";
import { success, error } from "@/features/shared/api/apiResponse";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";
import {
  FURNITURE_DIR,
  loadFurnitureItem,
  slugify,
} from "@studio/server/studioStore";
import { publishFurnitureToCatalog } from "@studio/server/publishFurnitureToCatalog";
import {
  resolveBlockDescriptorsDir,
  resolveSitePackageRoot,
} from "@/lib/paths/sitePackageRoot";

type Ctx = { params: Promise<{ id: string }> };

function dimMm(
  dimensions: Record<string, unknown> | undefined,
  key: string,
  fallback = 0,
): number {
  const v = dimensions?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export const POST = withAuth(
  async (request: NextRequest, auth: AuthContext, context: Ctx) => {
    const { id } = await context.params;
    const item = await loadFurnitureItem(id);
    if (!item) {
      return error(
        new ApiError(404, API_ERROR_CODES.RESOURCE_NOT_FOUND, "Furniture not found"),
      );
    }

    let body: { goLive?: boolean; slug?: string } = {};
    try {
      body = (await request.json()) as { goLive?: boolean; slug?: string };
    } catch {
      body = {};
    }

    // Only admins may promote to live; guests/members publish as draft.
    const goLive = Boolean(body.goLive) && auth.isAdmin;

    const dimensions =
      item.dimensions && typeof item.dimensions === "object"
        ? (item.dimensions as Record<string, unknown>)
        : {};

    let topPng: Buffer | undefined;
    try {
      topPng = await fs.readFile(path.join(FURNITURE_DIR, `${id}_top.png`));
    } catch {
      topPng = undefined;
    }

    const name = String(item.name || "item");
    const category = String(item.category || "uncategorized");
    const slug =
      (typeof body.slug === "string" && body.slug.trim()) ||
      slugify(name) ||
      id.replace(/^f_/, "").replace(/_[a-f0-9]{6}$/i, "") ||
      id;

    const descriptorsDir = resolveBlockDescriptorsDir();
    const lifecycleDir = path.join(resolveSitePackageRoot(), "inventory");

    const result = await publishFurnitureToCatalog({
      name,
      category,
      slug,
      width_mm: dimMm(dimensions, "width_mm", 100),
      depth_mm: dimMm(dimensions, "depth_mm", 100),
      height_mm: dimMm(dimensions, "height_mm", 750),
      topPng,
      descriptorsDir,
      lifecycleDir,
      goLive,
    });

    if (!result.ok) {
      const status =
        result.reason === "validation"
          ? 422
          : result.reason === "quality"
            ? 422
            : 500;
      const code =
        result.reason === "validation" || result.reason === "quality"
          ? API_ERROR_CODES.VALIDATION_ERROR
          : API_ERROR_CODES.DATABASE_ERROR;
      return error(new ApiError(status, code, result.message));
    }

    return success({
      slug: result.slug,
      version: result.version,
      lifecycle: goLive ? "live" : "draft",
      furnitureId: id,
    });
  },
  {
    role: "guest",
    rateLimitScope: "studio-furniture-publish:post",
    rateLimit: 20,
    requireCsrf: true,
  },
);
