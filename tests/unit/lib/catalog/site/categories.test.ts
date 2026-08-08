import { describe, expect, it } from "vitest";

import {
  Catalog_CATEGORY_LABELS,
  buildCanonicalProductRouteSlug,
  buildCanonicalSeriesId,
  buildCatalogCategoryNav,
  buildRequestedCategoryCatalog,
  classifyToRequestedCategory,
  classifyToRequestedSubcategory,
  getCanonicalCategoryId,
  getCanonicalSubcategoryId,
  getCanonicalSubcategoryLabel,
  getCatalogCategoryDescription,
  getCatalogCategoryHref,
  getCatalogCategoryLabel,
  getCatalogProductHref,
  getRequestedCategoryRouteSegment,
  normalizeRequestedCategoryId,
  resolveCanonicalSubcategory,
  slugifyCatalogToken,
} from "@/lib/catalog/site/categories";
import type { CompatCategory, CompatProduct } from "@/lib/catalog/site/getProducts";

function makeProduct(overrides: Partial<CompatProduct> = {}): CompatProduct {
  return {
    id: "p1",
    name: "Sample Product",
    description: "Description",
    flagshipImage: "/img.webp",
    sceneImages: [],
    variants: [],
    detailedInfo: {
      overview: "",
      features: [],
      dimensions: "",
      materials: [],
    },
    metadata: {},
    ...overrides,
  };
}

describe("site catalog categories", () => {
  describe("slugifyCatalogToken", () => {
    it("normalizes accents, symbols, and casing", () => {
      expect(slugifyCatalogToken("Fluid X & Chair")).toBe("fluid-x-and-chair");
      expect(slugifyCatalogToken("Café  Table")).toBe("cafe-table");
      expect(slugifyCatalogToken("1200 × 600")).toBe("1200-x-600");
    });

    it("returns empty for blank input", () => {
      expect(slugifyCatalogToken("")).toBe("");
      expect(slugifyCatalogToken(null)).toBe("");
    });
  });

  describe("normalizeRequestedCategoryId", () => {
    it("accepts canonical category ids", () => {
      expect(normalizeRequestedCategoryId("seating")).toBe("seating");
      expect(normalizeRequestedCategoryId("soft-seating")).toBe("soft-seating");
    });

    it("maps legacy oando and alias ids", () => {
      expect(normalizeRequestedCategoryId("oando-seating")).toBe("seating");
      expect(normalizeRequestedCategoryId("oando-chairs")).toBe("seating");
      expect(normalizeRequestedCategoryId("storage")).toBe("storages");
      expect(normalizeRequestedCategoryId("educational")).toBe("education");
      expect(normalizeRequestedCategoryId("collaborative")).toBe("soft-seating");
    });

    it("maps compound legacy route segments", () => {
      expect(normalizeRequestedCategoryId("desks-cabin-tables")).toBe("tables");
      expect(normalizeRequestedCategoryId("chairs-mesh")).toBe("seating");
      expect(normalizeRequestedCategoryId("others-1")).toBe("soft-seating");
    });

    it("returns null for unknown categories", () => {
      expect(normalizeRequestedCategoryId("unknown-category")).toBeNull();
    });
  });

  describe("getCanonicalCategoryId", () => {
    it("mirrors normalizeRequestedCategoryId", () => {
      expect(getCanonicalCategoryId("oando-workstations")).toBe("workstations");
    });
  });

  describe("getCanonicalSubcategoryId and label", () => {
    it("resolves known subcategory labels and aliases", () => {
      expect(getCanonicalSubcategoryId("seating", "Mesh chairs")).toBe("mesh");
      expect(getCanonicalSubcategoryId("seating", "mesh chair")).toBe("mesh");
      expect(getCanonicalSubcategoryId("tables", "Meeting Tables")).toBe("meeting");
    });

    it("slugifies unknown subcategories", () => {
      expect(getCanonicalSubcategoryId("seating", "Custom Range")).toBe("custom-range");
      expect(getCanonicalSubcategoryId("unknown", "Custom Range")).toBe("custom-range");
    });

    it("returns label for known subcategory id", () => {
      expect(getCanonicalSubcategoryLabel("seating", "mesh", "Fallback")).toBe("Mesh chairs");
      expect(getCanonicalSubcategoryLabel("seating", "missing", "Fallback")).toBe("Fallback");
      expect(getCanonicalSubcategoryLabel("unknown", "mesh", "Fallback")).toBe("Fallback");
    });
  });

  describe("resolveCanonicalSubcategory", () => {
    it("falls back when category is unknown", () => {
      expect(
        resolveCanonicalSubcategory("unknown", {
          subcategory: "Pods",
          productName: "Solace",
        }),
      ).toEqual({ id: "pods", label: "Pods" });
    });

    it("classifies seating subcategories from combined text", () => {
      expect(resolveCanonicalSubcategory("seating", { productName: "Mesh Task" })).toEqual({
        id: "mesh",
        label: "Mesh chairs",
      });
      expect(resolveCanonicalSubcategory("seating", { productName: "Cafe Stool" })).toEqual({
        id: "cafe",
        label: "Cafe chairs",
      });
      expect(resolveCanonicalSubcategory("seating", { productName: "Training Study" })).toEqual({
        id: "study",
        label: "Study chairs",
      });
      expect(resolveCanonicalSubcategory("seating", { productName: "Visitor Fabric" })).toEqual({
        id: "fabric",
        label: "Fabric chairs",
      });
      expect(resolveCanonicalSubcategory("seating", { productName: "Executive" })).toEqual({
        id: "leather",
        label: "Leather chairs",
      });
    });

    it("classifies workstations, tables, storages, soft-seating, and education", () => {
      expect(
        resolveCanonicalSubcategory("workstations", { productName: "Height Adjustable Desk" }),
      ).toEqual({ id: "height-adjustable", label: "Height Adjustable Series" });
      expect(
        resolveCanonicalSubcategory("workstations", {
          subcategoryId: "height-adjustable",
          productName: "DeskPro",
        }),
      ).toEqual({ id: "height-adjustable", label: "Height Adjustable Series" });
      expect(resolveCanonicalSubcategory("workstations", { productName: "Panel Pro" })).toEqual({
        id: "panel",
        label: "Panel Series",
      });
      expect(resolveCanonicalSubcategory("workstations", { productName: "DeskPro" })).toEqual({
        id: "desking",
        label: "Desking Series",
      });

      expect(resolveCanonicalSubcategory("tables", { productName: "Conference Meet" })).toEqual({
        id: "meeting",
        label: "Meeting Tables",
      });
      expect(resolveCanonicalSubcategory("tables", { productName: "Cafe Round" })).toEqual({
        id: "cafe",
        label: "Cafe Tables",
      });
      expect(resolveCanonicalSubcategory("tables", { productName: "Training Fold" })).toEqual({
        id: "training",
        label: "Training Tables",
      });
      expect(resolveCanonicalSubcategory("tables", { productName: "Executive Cabin" })).toEqual({
        id: "cabin",
        label: "Cabin Tables",
      });

      expect(resolveCanonicalSubcategory("storages", { productName: "Locker Cabinet" })).toEqual({
        id: "locker",
        label: "Locker",
      });
      expect(resolveCanonicalSubcategory("storages", { productName: "Compactor Rack" })).toEqual({
        id: "compactor",
        label: "Compactor Storage",
      });
      expect(resolveCanonicalSubcategory("storages", { productName: "Metal Rack" })).toEqual({
        id: "metal",
        label: "Metal Storage",
      });
      expect(resolveCanonicalSubcategory("storages", { productName: "Wood Shelf" })).toEqual({
        id: "prelam",
        label: "Prelam Storage",
      });

      expect(resolveCanonicalSubcategory("soft-seating", { productName: "Corner Sofa" })).toEqual({
        id: "sofa",
        label: "Sofa",
      });
      expect(resolveCanonicalSubcategory("soft-seating", { productName: "Collaborative Pod" })).toEqual({
        id: "collaborative",
        label: "Collaborative",
      });
      expect(resolveCanonicalSubcategory("soft-seating", { productName: "Coffee Side Table" })).toEqual({
        id: "occasional-tables",
        label: "Occasional Tables",
      });
      expect(resolveCanonicalSubcategory("soft-seating", { productName: "Round Pouf" })).toEqual({
        id: "pouffee",
        label: "Pouffee",
      });
      expect(resolveCanonicalSubcategory("soft-seating", { productName: "Lounge Chair" })).toEqual({
        id: "lounge",
        label: "Lounge",
      });

      expect(resolveCanonicalSubcategory("education", { productName: "Library Shelf" })).toEqual({
        id: "library",
        label: "Library",
      });
      expect(resolveCanonicalSubcategory("education", { productName: "Hostel Bed" })).toEqual({
        id: "hostel",
        label: "Hostel",
      });
      expect(resolveCanonicalSubcategory("education", { productName: "Auditorium Seat" })).toEqual({
        id: "auditorium",
        label: "Auditorium",
      });
      expect(resolveCanonicalSubcategory("education", { productName: "Desk" })).toEqual({
        id: "classroom",
        label: "Classroom",
      });
    });
  });

  describe("buildCanonicalSeriesId and buildCanonicalProductRouteSlug", () => {
    it("builds canonical ids from category and subcategory", () => {
      expect(buildCanonicalSeriesId("seating", "mesh", "Mesh Line")).toBe(
        "seating-mesh-mesh-line",
      );
      expect(buildCanonicalProductRouteSlug("tables", "meeting", "Opus Meet")).toBe(
        "tables-meeting-opus-meet",
      );
    });

    it("slugifies unknown categories", () => {
      expect(buildCanonicalSeriesId("custom-range", "pods", "Series A")).toBe(
        "custom-range-pods-series-a",
      );
    });
  });

  describe("classifyToRequestedCategory", () => {
    const item = (baseCategoryId: string, product: Partial<CompatProduct>, seriesName = "Series") => ({
      product: makeProduct(product),
      baseCategoryId,
      seriesName,
    });

    it("maps direct canonical and oando base category ids", () => {
      expect(classifyToRequestedCategory(item("education", {}))).toBe("education");
      expect(classifyToRequestedCategory(item("storages", {}))).toBe("storages");
      expect(classifyToRequestedCategory(item("oando-educational", {}))).toBe("education");
      expect(classifyToRequestedCategory(item("oando-chairs", {}))).toBe("seating");
      expect(classifyToRequestedCategory(item("oando-collaborative", {}))).toBe("soft-seating");
      expect(classifyToRequestedCategory(item("storage", { name: "Office Storage System" }))).toBe(
        "storages",
      );
    });

    it("infers category from product text tokens", () => {
      expect(
        classifyToRequestedCategory(
          item("misc", { name: "Classroom Desk", description: "library furniture" }),
        ),
      ).toBe("education");
      expect(
        classifyToRequestedCategory(item("misc", { name: "Metal Storage Locker" })),
      ).toBe("storages");
      expect(
        classifyToRequestedCategory(item("misc", { name: "Collaborative Lounge Sofa" })),
      ).toBe("soft-seating");
      expect(
        classifyToRequestedCategory(
          item("misc", { name: "DeskPro Height Adjustable Workstation" }),
        ),
      ).toBe("workstations");
      expect(
        classifyToRequestedCategory(item("misc", { name: "Conference Meeting Table" })),
      ).toBe("tables");
      expect(
        classifyToRequestedCategory(item("misc", { name: "Mesh Training Chair" })),
      ).toBe("seating");
    });

    it("defaults to seating when no signals match", () => {
      expect(classifyToRequestedCategory(item("misc", { name: "Generic Item" }))).toBe("seating");
    });
  });

  describe("classifyToRequestedSubcategory", () => {
    it("returns resolved subcategory label", () => {
      expect(
        classifyToRequestedSubcategory("seating", {
          product: makeProduct({ name: "Mesh Pro", metadata: { subcategory: "Mesh chairs" } }),
          baseCategoryId: "seating",
          seriesName: "Mesh",
        }),
      ).toBe("Mesh chairs");
    });
  });

  describe("catalog navigation helpers", () => {
    it("returns labels, descriptions, and hrefs", () => {
      expect(getCatalogCategoryLabel("seating", "Fallback")).toBe(Catalog_CATEGORY_LABELS.seating);
      expect(getCatalogCategoryLabel("unknown", "Fallback")).toBe("Fallback");
      expect(getCatalogCategoryDescription("tables", "Fallback")).toContain("table");
      expect(getCatalogCategoryHref("seating")).toBe("/products/seating");
    });

    it("builds product href with route segment normalization", () => {
      expect(getCatalogProductHref("oando-seating", "oando-seating--arvo")).toBe(
        "/products/seating/oando-seating--arvo",
      );
      expect(getCatalogProductHref("seating", "")).toBe("/products/seating");
    });

    it("resolves requested category route segments", () => {
      expect(getRequestedCategoryRouteSegment("oando-workstations")).toBe("workstations");
      expect(getRequestedCategoryRouteSegment("oando-custom-range")).toBe("custom-range");
      expect(getRequestedCategoryRouteSegment("unknown")).toBe("products");
    });

    it("builds category nav entries", () => {
      const nav = buildCatalogCategoryNav(["seating", "tables"]);
      expect(nav).toEqual([
        { id: "seating", label: "Seating", href: "/products/seating" },
        { id: "tables", label: "Tables", href: "/products/tables" },
      ]);
    });
  });

  describe("buildRequestedCategoryCatalog", () => {
    it("re-buckets products into requested categories with canonical metadata", () => {
      const baseCatalog: CompatCategory[] = [
        {
          id: "oando-seating",
          name: "Legacy Seating",
          description: "Legacy",
          series: [
            {
              id: "s1",
              name: "Mesh Series",
              description: "Mesh",
              products: [
                makeProduct({
                  id: "chair-1",
                  name: "Mesh Task",
                  metadata: { subcategory: "Mesh chairs" },
                }),
              ],
            },
          ],
        },
        {
          id: "oando-workstations",
          name: "Legacy Workstations",
          description: "Legacy",
          series: [
            {
              id: "s2",
              name: "DeskPro",
              description: "Desking",
              products: [
                makeProduct({
                  id: "desk-1",
                  name: "Height Adjustable Bench",
                  metadata: { subcategory: "Height Adjustable Series" },
                }),
              ],
            },
          ],
        },
      ];

      const rebuilt = buildRequestedCategoryCatalog(baseCatalog);
      expect(rebuilt).toHaveLength(6);

      const seating = rebuilt.find((category) => category.id === "seating");
      const workstations = rebuilt.find((category) => category.id === "workstations");

      expect(seating?.series[0]?.products[0]?.metadata?.categoryIdCanonical).toBe("seating");
      expect(seating?.series[0]?.products[0]?.metadata?.subcategoryId).toBe("mesh");
      expect(seating?.series[0]?.products[0]?.metadata?.canonicalSlugV2).toContain("seating-mesh");

      expect(workstations?.series[0]?.products[0]?.metadata?.subcategoryId).toBe("height-adjustable");
      expect(workstations?.series[0]?.name).toBe("DeskPro");
    });

    it("drops legacy storage products from seating buckets", () => {
      const baseCatalog: CompatCategory[] = [
        {
          id: "storage",
          name: "Storage",
          description: "Legacy storage",
          series: [
            {
              id: "storage-series",
              name: "Storage Series",
              description: "",
              products: [
                makeProduct({
                  id: "office-storage",
                  slug: "office-storage",
                  name: "Office Storage System",
                  flagshipImage:
                    "/assets/catalog/storage/oando-storage--office-storage/gallery/image-1.webp",
                  images: [
                    "/assets/catalog/storage/oando-storage--office-storage/gallery/image-1.webp",
                  ],
                }),
              ],
            },
          ],
        },
      ];

      const rebuilt = buildRequestedCategoryCatalog(baseCatalog);
      const seating = rebuilt.find((category) => category.id === "seating");
      const storages = rebuilt.find((category) => category.id === "storages");
      const seatingNames =
        seating?.series.flatMap((series) => series.products.map((product) => product.name)) ?? [];
      const storageNames =
        storages?.series.flatMap((series) => series.products.map((product) => product.name)) ?? [];

      expect(seatingNames).not.toContain("Office Storage System");
      expect(storageNames).toContain("Office Storage System");
    });

    it("drops project case-study entries from product categories", () => {
      const baseCatalog: CompatCategory[] = [
        {
          id: "projects",
          name: "Projects",
          description: "Install photography",
          series: [
            {
              id: "p-series",
              name: "Case studies",
              description: "",
              products: [
                makeProduct({
                  id: "project-1",
                  slug: "project-dmrc",
                  name: "DMRC Office",
                  flagshipImage: "/assets/marketing/projects/DMRC/dmrc-facility.webp",
                  images: ["/assets/marketing/projects/DMRC/dmrc-facility.webp"],
                }),
              ],
            },
          ],
        },
        {
          id: "oando-seating",
          name: "Seating",
          description: "Chairs",
          series: [
            {
              id: "s-abdul",
              name: "Seating Series",
              description: "",
              products: [
                makeProduct({
                  id: "project-abdul",
                  slug: "abdul-hai-office",
                  name: "Abdul Hai Office",
                  flagshipImage: "/assets/marketing/projects/DMRC/dmrc-office-01.webp",
                  images: ["/assets/marketing/projects/Titan/project-gallery-02.webp"],
                }),
              ],
            },
          ],
        },
      ];

      const rebuilt = buildRequestedCategoryCatalog(baseCatalog);
      const seating = rebuilt.find((category) => category.id === "seating");
      const allNames = seating?.series.flatMap((series) => series.products.map((p) => p.name)) ?? [];
      expect(allNames).not.toContain("DMRC Office");
      expect(allNames).not.toContain("Abdul Hai Office");
    });

    it("preserves canonical subcategoryId from source metadata during rebucketing", () => {
      const baseCatalog: CompatCategory[] = [
        {
          id: "oando-workstations",
          name: "Legacy Workstations",
          description: "Legacy",
          series: [
            {
              id: "s2",
              name: "DeskPro",
              description: "Desking",
              products: [
                makeProduct({
                  id: "desk-2",
                  name: "DeskPro",
                  metadata: {
                    subcategoryId: "height-adjustable",
                    subcategory: "Height Adjustable Series",
                  },
                }),
              ],
            },
          ],
        },
      ];

      const rebuilt = buildRequestedCategoryCatalog(baseCatalog);
      const workstations = rebuilt.find((category) => category.id === "workstations");
      expect(workstations?.series[0]?.products[0]?.metadata?.subcategoryId).toBe("height-adjustable");
      expect(workstations?.series[0]?.products[0]?.metadata?.subcategory).toBe(
        "Height Adjustable Series",
      );
    });

    it("groups seating products under Seating Series", () => {
      const baseCatalog: CompatCategory[] = [
        {
          id: "oando-chairs",
          name: "Chairs",
          description: "",
          series: [
            {
              id: "s1",
              name: "Ignored",
              description: "",
              products: [makeProduct({ name: "Cafe Chair" })],
            },
          ],
        },
      ];

      const seating = buildRequestedCategoryCatalog(baseCatalog).find((c) => c.id === "seating");
      expect(seating?.series[0]?.name).toBe("Seating Series");
    });
  });
});