/**
 * Contract tests for POST /api/Studio/furniture/[id]/publish.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const loadFurniture = vi.hoisted(() => vi.fn());
const publishFurnitureToCatalog = vi.hoisted(() => vi.fn());
const slugify = vi.hoisted(() => vi.fn((s: string) => s.toLowerCase().replace(/\s+/g, "-")));

const authCapture = vi.hoisted(() => ({
  options: null as Record<string, unknown> | null,
  auth: {
    user: null as { id: string; email: string; role: string } | null,
    isAdmin: false,
    requiredRole: "guest" as const,
  },
}));

vi.mock("@/features/shared/api/withAuth", () => ({
  withAuth: (
    handler: (
      req: NextRequest,
      auth: typeof authCapture.auth,
      ctx: { params: Promise<{ id: string }> },
    ) => Promise<Response>,
    options: Record<string, unknown>,
  ) => {
    authCapture.options = options;
    return (
      req: NextRequest,
      ctx: { params: Promise<{ id: string }> },
    ) => handler(req, authCapture.auth, ctx);
  },
}));

vi.mock("@studio/server/studioStore", () => ({
  FURNITURE_DIR: "/tmp/furniture",
  loadFurnitureItem: loadFurniture,
  slugify,
}));

vi.mock("@studio/server/publishFurnitureToCatalog", () => ({
  publishFurnitureToCatalog,
}));

vi.mock("@/lib/paths/sitePackageRoot", () => ({
  resolveBlockDescriptorsDir: () => "/tmp/descriptors",
  resolveSitePackageRoot: () => "/tmp/site",
}));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    promises: {
      ...actual.promises,
      readFile: vi.fn().mockRejectedValue(new Error("no png")),
    },
  };
});

import { POST } from "@/app/api/Studio/furniture/[id]/publish/route";

function postJson(id: string, body: unknown = {}) {
  const req = new NextRequest(
    `http://localhost/api/Studio/furniture/${id}/publish`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": "t" },
      body: JSON.stringify(body),
    },
  );
  return POST(req, { params: Promise.resolve({ id }) });
}

describe("app/api/Studio/furniture/[id]/publish/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authCapture.auth = {
      user: null,
      isAdmin: false,
      requiredRole: "guest",
    };
    loadFurniture.mockResolvedValue({
      id: "f_desk_abc",
      name: "Smoke Desk",
      category: "desks",
      dimensions: { width_mm: 1400, depth_mm: 700, height_mm: 750 },
    });
    publishFurnitureToCatalog.mockResolvedValue({
      ok: true,
      slug: "smoke-desk",
      version: 1,
    });
  });

  it("requires CSRF on guest mutator", () => {
    expect(authCapture.options).toEqual(
      expect.objectContaining({
        role: "guest",
        requireCsrf: true,
        rateLimitScope: "studio-furniture-publish:post",
      }),
    );
  });

  it("returns 404 when furniture missing", async () => {
    loadFurniture.mockResolvedValue(null);
    const res = await postJson("missing");
    expect(res.status).toBe(404);
    expect(publishFurnitureToCatalog).not.toHaveBeenCalled();
  });

  it("returns 200 with slug/version on success (draft for non-admin)", async () => {
    const res = await postJson("f_desk_abc", { goLive: true });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.slug).toBe("smoke-desk");
    expect(body.version).toBe(1);
    expect(body.lifecycle).toBe("draft");
    expect(publishFurnitureToCatalog).toHaveBeenCalledWith(
      expect.objectContaining({ goLive: false, name: "Smoke Desk" }),
    );
  });

  it("allows goLive only when auth.isAdmin", async () => {
    authCapture.auth.isAdmin = true;
    const res = await postJson("f_desk_abc", { goLive: true });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lifecycle).toBe("live");
    expect(publishFurnitureToCatalog).toHaveBeenCalledWith(
      expect.objectContaining({ goLive: true }),
    );
  });

  it("returns 422 on validation failure from publish pipeline", async () => {
    publishFurnitureToCatalog.mockResolvedValue({
      ok: false,
      reason: "validation",
      message: "Name is required",
    });
    const res = await postJson("f_desk_abc");
    expect(res.status).toBe(422);
  });
});
