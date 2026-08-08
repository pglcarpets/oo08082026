/**
 * Name-mirror coverage for lib/catalog/types (type export smoke).
 */
import { describe, expect, it } from "vitest";
import type {
  CategoryRow,
  CompatCategory,
  CompatProduct,
  CompatSeries,
  DerivedRules,
  Dim,
  Product,
  ProductMetadata,
  ProductVariant,
  SizeOption,
  SizingType,
  WorkstationSpec,
} from "@/lib/catalog/types";

describe("catalog types export smoke", () => {
  it("accepts Dim and discrete SizeOption geometry", () => {
    const dim: Dim = { L: 1200, D: 600, H: 750 };
    const option: SizeOption = {
      sku: "PED-3",
      label: "3-Drawer Pedestal",
      dim,
    };
    expect(option.dim.L).toBe(1200);
    expect(option.dim.D).toBe(600);
  });

  it("accepts parametric WorkstationSpec and DerivedRules", () => {
    const workstation: WorkstationSpec = {
      shape: "straight",
      system: "leg",
      wireManagement: ["125 raceway"],
      sharing: "non-sharing",
      seaterOptions: [1, 2, 3],
      lengthOptions: [1200, 1350, 1500],
      depthOptions: [600, 750],
      heightMm: 750,
    };
    const rules: DerivedRules = {
      screenOffsetIntermediate: 75,
      screenOffsetMain: 150,
    };
    const sizing: SizingType = "parametric";

    expect(workstation.heightMm).toBe(750);
    expect(rules.screenOffsetMain).toBe(150);
    expect(sizing).toBe("parametric");
  });

  it("accepts Product, Compat*, and CategoryRow contracts used by catalog facades", () => {
    const variant: ProductVariant = {
      id: "v1",
      variantName: "Black",
      galleryImages: ["/a.webp"],
    };
    const metadata: ProductMetadata = {
      category: "seating",
      warrantyYears: 5,
      priceRange: "premium",
    };
    const product: Product = {
      id: "p1",
      category_id: "seating",
      series: "Ergo",
      name: "Chair",
      slug: "chair",
      images: ["/a.webp"],
      specs: {
        dimensions: "600x600x1100",
        materials: ["mesh"],
        features: ["tilt"],
      },
      series_id: "s1",
      series_name: "Ergo",
      created_at: "2026-01-01T00:00:00.000Z",
      metadata,
      sizingType: "fixed",
      defaultFootprint: { L: 600, D: 600 },
    };
    const compat: CompatProduct = {
      id: "p1",
      name: "Chair",
      description: "Ergonomic office chair for long workdays.",
      flagshipImage: "/a.webp",
      sceneImages: [],
      variants: [variant],
      detailedInfo: {
        overview: "overview",
        features: ["tilt"],
        dimensions: "600x600",
        materials: ["mesh"],
      },
      metadata,
    };
    const series: CompatSeries = {
      id: "s1",
      name: "Ergo",
      description: "series",
      products: [compat],
    };
    const category: CompatCategory = {
      id: "seating",
      name: "Seating",
      description: "chairs",
      series: [series],
    };
    const row: CategoryRow = { id: "seating", name: "Seating" };

    expect(product.slug).toBe("chair");
    expect(category.series[0]?.products[0]?.name).toBe("Chair");
    expect(row.id).toBe("seating");
  });
});
