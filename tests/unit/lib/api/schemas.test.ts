import { describe, it, expect } from "vitest";
import { PaginationQuerySchema, StandardCatalogListQuerySchema, CreatePlanSchema } from "@/features/shared/api/schemas";

describe("schemas validation", () => {
  it("validates PaginationQuerySchema correctly", () => {
    const valid = PaginationQuerySchema.safeParse({ page: "2", limit: "10" });
    expect(valid.success).toBe(true);
    expect(valid.data).toEqual({ page: 2, limit: 10 });

    const fallback = PaginationQuerySchema.safeParse({});
    expect(fallback.success).toBe(true);
    expect(fallback.data).toEqual({ page: 1, limit: 50 });

    const invalid = PaginationQuerySchema.safeParse({ page: -1 });
    expect(invalid.success).toBe(false);
  });

  it("validates StandardCatalogListQuerySchema", () => {
    const valid = StandardCatalogListQuerySchema.safeParse({ category: " Desks ", search: "Chair", visible: "true" });
    expect(valid.success).toBe(true);
    expect(valid.data?.category).toBe("desks");
    expect(valid.data?.search).toBe("chair");
    expect(valid.data?.visible).toBe("true");
  });

  it("validates CreatePlanSchema", () => {
    const valid = CreatePlanSchema.safeParse({
      id: "plan-123",
      projectName: "My Project",
      data: { key: "value" },
    });
    expect(valid.success).toBe(true);

    const invalid = CreatePlanSchema.safeParse({
      id: "",
      projectName: "My Project",
      data: {},
    });
    expect(invalid.success).toBe(false);
  });
});
