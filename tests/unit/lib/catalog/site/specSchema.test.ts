/**
 * Name-mirror coverage for lib/catalog/site/specSchema.
 */
import { describe, expect, it, vi } from "vitest";
import type { CompatProduct } from "@/lib/catalog/site/getProducts";
import {
  PRODUCT_CATEGORY_SCHEMAS,
  auditCompatProduct,
  collectProductDocuments,
  collectProductImages,
  getProductCategorySchema,
} from "@/lib/catalog/site/specSchema";

vi.mock("@/lib/catalog/site/slugResolver", () => ({
  isSupportedCatalogSlug: vi.fn(() => true),
}));

function baseProduct(overrides: Partial<CompatProduct> = {}): CompatProduct {
  return {
    id: "p1",
    slug: "modern-chair",
    name: "Modern Chair",
    description: "A premium ergonomic office chair for long workdays.",
    // Non-root paths skip public/ existsSync checks in fileExistsForPublicAsset.
    flagshipImage: "https://cdn.example.com/chair.webp",
    sceneImages: ["https://cdn.example.com/chair-scene.webp"],
    variants: [
      {
        id: "v1",
        variantName: "Black",
        galleryImages: ["https://cdn.example.com/chair-black.webp"],
      },
    ],
    detailedInfo: {
      overview: "overview",
      features: ["tilt", "mesh"],
      dimensions: "600x600x1100",
      materials: ["mesh", "steel"],
    },
    metadata: {
      subcategory: "task",
      warrantyYears: 5,
      sustainabilityScore: 80,
      aiAltText: "Black mesh task chair",
    },
    documents: ["https://cdn.example.com/chair.pdf"],
    images: [
      "https://cdn.example.com/chair.webp",
      "https://cdn.example.com/chair-2.webp",
    ],
    altText: "Black mesh task chair",
    ...overrides,
  };
}

describe("getProductCategorySchema", () => {
  it("returns known category schemas and a general default", () => {
    expect(PRODUCT_CATEGORY_SCHEMAS.seating.displayName).toBe("Seating");
    expect(getProductCategorySchema("seating").categoryId).toBe("seating");
    expect(getProductCategorySchema("unknown-category").categoryId).toBe(
      "general",
    );
  });
});

describe("collectProductImages", () => {
  it("deduplicates flagship, gallery, scene, and variant images", () => {
    const images = collectProductImages(baseProduct());
    expect(images.length).toBeGreaterThanOrEqual(2);
    expect(new Set(images).size).toBe(images.length);
  });
});

describe("collectProductDocuments", () => {
  it("collects document candidates from product fields", () => {
    const docs = collectProductDocuments(
      baseProduct({
        documents: [
          "https://cdn.example.com/a.pdf",
          "https://cdn.example.com/a.pdf",
        ],
        technicalDrawings: ["https://cdn.example.com/draw.pdf"],
      }),
    );
    expect(docs).toContain("https://cdn.example.com/a.pdf");
    expect(docs).toContain("https://cdn.example.com/draw.pdf");
    expect(docs.filter((d) => d === "https://cdn.example.com/a.pdf")).toHaveLength(
      1,
    );
  });
});

describe("auditCompatProduct", () => {
  it("returns no critical issues for a complete product", () => {
    const issues = auditCompatProduct("seating", baseProduct());
    const critical = issues.filter((issue) => issue.severity === "critical");
    expect(critical).toEqual([]);
  });

  it("flags short description, missing documents, and missing field requirements", () => {
    const product: CompatProduct = {
      id: "sparse",
      slug: "sparse-chair",
      name: "Sparse",
      description: "too short",
      flagshipImage: "https://cdn.example.com/only.webp",
      sceneImages: [],
      variants: [],
      detailedInfo: {
        overview: "",
        features: [],
        dimensions: "",
        materials: [],
      },
      metadata: {},
      documents: [],
      technicalDrawings: [],
      images: ["https://cdn.example.com/only.webp"],
      altText: "",
    };

    const issues = auditCompatProduct("seating", product);
    const codes = new Set(issues.map((issue) => issue.code));

    expect(codes.has("missing_description")).toBe(true);
    expect(codes.has("missing_documents")).toBe(true);
    expect(codes.has("missing_alt_text")).toBe(true);
    expect(codes.has("missing_dimensions")).toBe(true);
    expect(codes.has("missing_materials")).toBe(true);
    expect(codes.has("missing_features")).toBe(true);
    expect(issues.length).toBeGreaterThan(4);
  });
});
