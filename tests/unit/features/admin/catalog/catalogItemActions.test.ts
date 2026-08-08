import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CreateStandardCatalogItemSchema,
  DeleteStandardCatalogItemSchema,
  PatchStandardCatalogItemWithIdSchema,
} from "@/features/shared/api/schemas";
import { resolveAuthContext } from "@/features/shared/api/withAuth";
import { rateLimit } from "@/lib/rateLimit";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";
import {
  createStandardCatalogItem,
  patchStandardCatalogItem,
} from "@/features/admin/api/catalogAdminHandlers";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () =>
    new Headers({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    }),
  ),
}));

vi.mock("@/features/shared/api/withAuth", () => ({
  resolveAuthContext: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/features/admin/api/catalogAdminHandlers", () => ({
  createStandardCatalogItem: vi.fn(),
  patchStandardCatalogItem: vi.fn(),
  deleteStandardCatalogItem: vi.fn(),
  createConfiguratorCatalogItem: vi.fn(),
  patchConfiguratorCatalogItem: vi.fn(),
  setConfiguratorCatalogActive: vi.fn(),
  deleteConfiguratorCatalogItem: vi.fn(),
}));

import {
  createStandardCatalogItemAction,
  patchStandardCatalogItemAction,
} from "@/features/admin/catalog/catalogItemActions";

const createBody = {
  name: "Linear Desk",
  category: "desks",
  subcategory: "linear",
  width_mm: 1200,
  depth_mm: 600,
  height_mm: 750,
  price: 1000,
  mesh_type: "box",
  visible: true,
};

const sampleItem = {
  id: "item-1",
  ...createBody,
  image_url: null,
  description: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("catalogItemActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveAuthContext).mockResolvedValue({
      user: { id: "admin-1", email: "admin@example.com", role: "admin" },
      isAdmin: true,
      requiredRole: "admin",
    });
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 20,
      remaining: 19,
      reset: Date.now() + 60_000,
    });
  });

  it("validates schemas for create/patch/delete", () => {
    expect(CreateStandardCatalogItemSchema.safeParse(createBody).success).toBe(true);
    expect(
      PatchStandardCatalogItemWithIdSchema.safeParse({ id: "item-1", visible: false })
        .success,
    ).toBe(true);
    expect(
      PatchStandardCatalogItemWithIdSchema.safeParse({ visible: false }).success,
    ).toBe(false);
    expect(DeleteStandardCatalogItemSchema.safeParse({ id: "item-1" }).success).toBe(
      true,
    );
  });

  it("create requires admin, rate-limits, and maps domain success/errors", async () => {
    vi.mocked(createStandardCatalogItem).mockResolvedValue({
      item: sampleItem,
      source: "planner_managed_products",
    });
    const ok = await createStandardCatalogItemAction(createBody);
    expect(resolveAuthContext).toHaveBeenCalledWith("admin");
    expect(rateLimit).toHaveBeenCalledWith(
      "admin-catalogs:post:203.0.113.10",
      20,
      60_000,
    );
    expect(ok).toMatchObject({
      data: { item: sampleItem, source: "planner_managed_products" },
    });

    vi.mocked(createStandardCatalogItem).mockRejectedValue(
      new ApiError(503, API_ERROR_CODES.SERVICE_UNAVAILABLE, "Catalog storage is not configured"),
    );
    expect(await createStandardCatalogItemAction(createBody)).toMatchObject({
      serverError: "Catalog storage is not configured",
    });

    vi.mocked(resolveAuthContext).mockRejectedValue(
      new ApiError(403, API_ERROR_CODES.INSUFFICIENT_PERMISSIONS, "Admin access required"),
    );
    expect(await createStandardCatalogItemAction(createBody)).toMatchObject({
      serverError: "Admin access required",
    });

    vi.mocked(resolveAuthContext).mockResolvedValue({
      user: { id: "admin-1", email: "admin@example.com", role: "admin" },
      isAdmin: true,
      requiredRole: "admin",
    });
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 20,
      remaining: 0,
      reset: Date.now() + 60_000,
    });
    expect(await createStandardCatalogItemAction(createBody)).toMatchObject({
      serverError: "Too many requests. Please try again shortly.",
    });
    expect(createStandardCatalogItem).toHaveBeenCalledTimes(2);
  });

  it("patch requires id and returns validationErrors for empty create body", async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 20,
      remaining: 19,
      reset: Date.now() + 60_000,
    });
    vi.mocked(patchStandardCatalogItem).mockResolvedValue({
      item: { ...sampleItem, visible: false },
      source: "planner_managed_products",
    });
    const patched = await patchStandardCatalogItemAction({
      id: "item-1",
      visible: false,
    });
    expect(patchStandardCatalogItem).toHaveBeenCalled();
    expect(patched).toMatchObject({
      data: { item: expect.objectContaining({ visible: false }) },
    });

    const invalid = await createStandardCatalogItemAction(
      {} as never,
    );
    expect(invalid).toMatchObject({ validationErrors: expect.anything() });
  });
});
