import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as fs from "fs";

const { existsSync } = vi.hoisted(() => ({
  existsSync: vi.fn(),
}));

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof fs>();
  return {
    ...actual,
    existsSync,
    default: {
      ...actual,
      existsSync,
    },
  };
});

/**
 * Mock normalizeAssetPath to apply path rewriting (e.g. /gallery/ insertion)
 * without filesystem checks that depend on __non_webpack_require__.
 */
vi.mock("@/lib/assetPaths", () => {
  function normalizeAssetPath(value: string | null | undefined): string {
    if (!value) return "";
    const trimmed = String(value).trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    let p = trimmed;
    // Seating SKU image-N → gallery/image-N
    p = p.replace(
      /^(\/assets\/catalog\/seating\/(?:leather|non-leather)\/[^/]+)\/(image-[^/]+)$/i,
      "$1/gallery/$2",
    );
    p = p.replace(
      /^(\/assets\/catalog\/(?:seating|workstations|tables|storage|soft-seating|educational|collaborative)\/[^/]+)\/(image-[^/]+)$/i,
      "$1/gallery/$2",
    );
    return p;
  }
  return {
    normalizeAssetPath,
    normalizeAssetList: (values: (string | null | undefined)[]) =>
      (Array.isArray(values) ? values : []).map(normalizeAssetPath),
    PRODUCT_IMAGE_FALLBACK: "/assets/marketing/brand/logos/OneandOnlySmall-Logo.png",
    isProductImageFallback: (v: string | null | undefined) =>
      String(v || "").trim() === "/assets/marketing/brand/logos/OneandOnlySmall-Logo.png",
  };
});

import * as assetPaths from "@/lib/assetPaths";
import {
  PRODUCT_CATEGORY_SCHEMAS,
  auditCompatProduct,
  collectProductDocuments,
  collectProductImages,
  getProductCategorySchema,
} from "@/lib/catalog/site/specSchema";
import type { CompatProduct } from "@/lib/catalog/site/getProducts";

const VALID_PRIMARY = "/assets/catalog/seating/non-leather/oando-seating--arvo/gallery/image-1.jpg";
const VALID_GALLERY = "/assets/catalog/seating/non-leather/oando-seating--arvo/gallery/image-2.jpg";

function makeHealthyProduct(overrides: Partial<CompatProduct> = {}): CompatProduct {
  return {
    id: "p1",
    slug: "seating-mesh-healthy-product",
    name: "Healthy Product",
    description: "A complete product description with enough detail for catalog display.",
    flagshipImage: VALID_PRIMARY,
    sceneImages: [VALID_GALLERY],
    images: [VALID_GALLERY],
    variants: [
      {
        id: "v1",
        variantName: "Default",
        galleryImages: [VALID_GALLERY],
      },
    ],
    detailedInfo: {
      overview: "Overview text",
      features: ["Adjustable lumbar"],
      dimensions: "600 x 600 mm",
      materials: ["Mesh", "Aluminium"],
    },
    metadata: {
      subcategory: "Mesh chairs",
      subcategoryId: "mesh",
      warrantyYears: 5,
      sustainabilityScore: 8,
      ai_alt_text: "Mesh task chair",
    },
    altText: "Mesh task chair",
    documents: ["/docs/spec-sheet.pdf"],
    technicalDrawings: ["/docs/drawing.pdf"],
    specs: {
      dimensions: "600 x 600 mm",
      materials: ["Mesh"],
      features: ["Lumbar support"],
      sustainability_score: 8,
      brochureUrl: "/docs/brochure.pdf",
    },
    ...overrides,
  };
}

describe("site catalog specSchema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    existsSync.mockImplementation((targetPath: string) => {
      const normalized = String(targetPath).replace(/\\/g, "/");
      return normalized.includes("/public/assets/catalog/seating/non-leather/oando-seating--arvo/");
    });
  });

  describe("getProductCategorySchema", () => {
    it("returns known category schemas", () => {
      expect(getProductCategorySchema("seating").categoryId).toBe("seating");
      expect(PRODUCT_CATEGORY_SCHEMAS.seating.displayName).toBe("Seating");
    });

    it("falls back to general schema", () => {
      expect(getProductCategorySchema("unknown").categoryId).toBe("general");
    });
  });

  describe("collectProductImages", () => {
    it("deduplicates and normalizes image sources", () => {
      const images = collectProductImages(
        makeHealthyProduct({
          flagshipImage: VALID_PRIMARY,
          images: [VALID_PRIMARY, VALID_GALLERY],
          sceneImages: [VALID_GALLERY],
        }),
      );
      expect(images).toEqual([VALID_PRIMARY, VALID_GALLERY]);
    });

    it("includes variant gallery images", () => {
      const images = collectProductImages(
        makeHealthyProduct({
          variants: [
            {
              id: "v1",
              variantName: "Blue",
              galleryImages: [VALID_GALLERY, VALID_PRIMARY],
            },
          ],
        }),
      );
      expect(images.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("collectProductDocuments", () => {
    it("extracts documents from multiple nested shapes", () => {
      const docs = collectProductDocuments(
        makeHealthyProduct({
          documents: ["/docs/a.pdf"],
          metadata: {
            brochure: "/docs/brochure.pdf",
            documentLinks: ["/docs/c.pdf"],
          } as CompatProduct["metadata"],
          specs: {
            specSheetUrl: "/docs/spec.pdf",
          },
          variants: [
            {
              id: "v1",
              variantName: "Default",
              galleryImages: [],
              documentUrl: "/docs/variant.pdf",
            } as CompatProduct["variants"][number],
          ],
        }),
      );
      expect(docs).toEqual(
        expect.arrayContaining([
          "/docs/a.pdf",
          "/docs/brochure.pdf",
          "/docs/c.pdf",
          "/docs/spec.pdf",
          "/docs/variant.pdf",
        ]),
      );
    });

    it("deduplicates repeated document paths", () => {
      const docs = collectProductDocuments(
        makeHealthyProduct({
          documents: ["/docs/a.pdf", "/docs/a.pdf"],
          technicalDrawings: [],
          specs: {},
          metadata: {},
          variants: [],
        }),
      );
      expect(docs).toEqual(["/docs/a.pdf"]);
    });
  });

  describe("auditCompatProduct", () => {
    it("returns no issues for a healthy product", () => {
      const issues = auditCompatProduct("seating", makeHealthyProduct());
      expect(issues).toEqual([]);
    });

    it("flags missing primary image", () => {
      vi.spyOn(assetPaths, "normalizeAssetPath").mockReturnValue("");
      vi.spyOn(assetPaths, "normalizeAssetList").mockReturnValue([]);

      const issues = auditCompatProduct(
        "seating",
        makeHealthyProduct({
          flagshipImage: "",
          images: [],
          sceneImages: [],
          variants: [],
        }),
      );

      vi.restoreAllMocks();
      expect(issues.some((issue) => issue.code === "missing_primary_image")).toBe(true);
    });

    it("flags invalid primary and gallery asset paths", () => {
      existsSync.mockReturnValue(false);
      const issues = auditCompatProduct(
        "seating",
        makeHealthyProduct({
          flagshipImage: "/assets/catalog/missing-primary.webp",
          sceneImages: ["/assets/catalog/missing-gallery.webp"],
        }),
      );
      expect(issues.some((issue) => issue.code === "invalid_primary_image_path")).toBe(true);
      expect(issues.some((issue) => issue.code === "invalid_gallery_image_path")).toBe(true);
    });

    it("flags short descriptions and missing alt text", () => {
      const issues = auditCompatProduct(
        "seating",
        makeHealthyProduct({
          description: "Too short",
          altText: "",
          metadata: {},
        }),
      );
      expect(issues.some((issue) => issue.code === "missing_description")).toBe(true);
      expect(issues.some((issue) => issue.code === "missing_alt_text")).toBe(true);
    });

    it("flags unsupported slug formats", () => {
      const issues = auditCompatProduct(
        "seating",
        makeHealthyProduct({ slug: "random-product-slug" }),
      );
      expect(issues.some((issue) => issue.code === "legacy_slug_format")).toBe(true);
    });

    it("flags suspicious encoding artifacts", () => {
      const issues = auditCompatProduct(
        "seating",
        makeHealthyProduct({
          description: "Broken copy with Ã¢â‚¬â€ dash artifact in text",
        }),
      );
      expect(issues.some((issue) => issue.code === "suspicious_text_encoding")).toBe(true);
    });

    it("flags schema requirement gaps", () => {
      const issues = auditCompatProduct(
        "seating",
        makeHealthyProduct({
          detailedInfo: {
            overview: "",
            features: [],
            dimensions: "",
            materials: [],
          },
          metadata: {},
          specs: {},
          documents: [],
          technicalDrawings: [],
        }),
      );
      expect(issues.some((issue) => issue.code === "missing_dimensions")).toBe(true);
      expect(issues.some((issue) => issue.code === "missing_materials")).toBe(true);
      expect(issues.some((issue) => issue.code === "missing_features")).toBe(true);
      expect(issues.some((issue) => issue.code === "missing_subcategory")).toBe(true);
      expect(issues.some((issue) => issue.code === "missing_warranty")).toBe(true);
      expect(issues.some((issue) => issue.code === "missing_sustainability_score")).toBe(true);
      expect(issues.some((issue) => issue.code === "missing_documents")).toBe(true);
    });

    it("flags insufficient gallery image count", () => {
      vi.spyOn(assetPaths, "normalizeAssetPath").mockImplementation((value) => String(value || "").trim());
      vi.spyOn(assetPaths, "normalizeAssetList").mockReturnValue([]);

      const issues = auditCompatProduct(
        "seating",
        makeHealthyProduct({
          flagshipImage: VALID_PRIMARY,
          sceneImages: [],
          images: [],
          variants: [],
        }),
      );

      vi.restoreAllMocks();
      expect(issues.some((issue) => issue.code === "missing_gallery_images")).toBe(true);
    });

    it("uses metadata alt text aliases and specs sustainability score", () => {
      const issues = auditCompatProduct(
        "seating",
        makeHealthyProduct({
          altText: "",
          metadata: {
            subcategory: "Mesh chairs",
            subcategoryId: "mesh",
            warrantyYears: 3,
            aiAltText: "Alt from metadata",
            sustainabilityScore: undefined,
          },
          specs: { sustainability_score: 7 },
        }),
      );
      expect(issues.some((issue) => issue.code === "missing_alt_text")).toBe(false);
      expect(issues.some((issue) => issue.code === "missing_sustainability_score")).toBe(false);
    });

    it("skips filesystem checks for non-public asset paths", () => {
      existsSync.mockReturnValue(false);
      const issues = auditCompatProduct(
        "seating",
        makeHealthyProduct({
          flagshipImage: "https://cdn.example.com/chair.webp",
          sceneImages: ["https://cdn.example.com/chair-2.webp"],
        }),
      );
      expect(issues.some((issue) => issue.code === "invalid_primary_image_path")).toBe(false);
    });
  });
});
