import { describe, expect, it } from "vitest";

import type {
  ConfiguratorCatalogItem,
  StandardCatalogItem,
} from "@/features/admin/api/adminCatalogClient";
import {
  ADMIN_CATALOG_PAGE_SIZE,
  CONFIGURATOR_CATEGORIES,
  MESH_TYPES,
  STANDARD_CATEGORIES,
  configuratorDraftToPayload,
  configuratorFromItem,
  emptyConfiguratorDraft,
  emptyStandardDraft,
  getConfiguratorJsonErrors,
  standardDraftToPayload,
  standardFromItem,
  validateConfiguratorDraft,
  validateStandardDraft,
} from "@/features/admin/catalog/adminCatalogManagerUtils";

function baseStandardItem(
  overrides: Partial<StandardCatalogItem> = {},
): StandardCatalogItem {
  return {
    id: "std-1",
    name: "Bench desk",
    category: "workstation",
    subcategory: "bench",
    width_mm: 1400,
    depth_mm: 700,
    height_mm: 750,
    price: 1200,
    mesh_type: "box",
    image_url: "https://cdn.example/img.png",
    visible: true,
    active: true,
    description: "A desk",
    ...overrides,
  };
}

function baseConfiguratorItem(
  overrides: Partial<ConfiguratorCatalogItem> = {},
): ConfiguratorCatalogItem {
  return {
    id: "cfg-1",
    slug: "bench-desk",
    name: "Bench desk",
    category: "desks",
    family: "bench",
    brand_name: "Oando",
    sizing_type: "fixed",
    description: "Parametric desk family",
    materials: ["laminate", "steel"],
    thumbnail_url: "https://cdn.example/thumb.png",
    model_3d_url: "",
    active: true,
    default_footprint: { L: 1200, D: 600, H: 750 },
    ...overrides,
  };
}

describe("adminCatalogManagerUtils", () => {
  it("exports mesh/category constants and phone-friendly page size", () => {
    expect(MESH_TYPES).toEqual(["box", "cylinder", "sphere", "custom"]);
    expect(STANDARD_CATEGORIES).toContain("workstation");
    expect(CONFIGURATOR_CATEGORIES).toContain("desks");
    expect(ADMIN_CATALOG_PAGE_SIZE).toBe(12);
  });

  it("maps standard item ↔ draft and validates dimensions/price", () => {
    const draft = standardFromItem(baseStandardItem());
    expect(draft).toMatchObject({
      id: "std-1",
      name: "Bench desk",
      width_mm: "1400",
      mesh_type: "box",
      visible: true,
    });
    expect(standardFromItem(baseStandardItem({ active: false, visible: undefined })).visible).toBe(
      false,
    );

    expect(validateStandardDraft({ ...emptyStandardDraft(), name: "  " })).toBe(
      "Name is required",
    );
    expect(
      validateStandardDraft({ ...emptyStandardDraft(), name: "Desk", width_mm: "0" }),
    ).toBe("Width must be a positive number");
    expect(
      validateStandardDraft({ ...emptyStandardDraft(), name: "Desk", price: "-5" }),
    ).toBe("Price must be a non-negative number");
    expect(
      validateStandardDraft({ ...emptyStandardDraft(), name: "Desk", price: "0" }),
    ).toBeNull();

    const createPayload = standardDraftToPayload({
      ...emptyStandardDraft(),
      name: "  Desk  ",
      price: "",
      subcategory: "  ",
    });
    expect(createPayload).toMatchObject({
      name: "Desk",
      width_mm: 1200,
      mesh_type: "box",
    });
    expect(createPayload).not.toHaveProperty("id");
    expect(createPayload.price).toBeUndefined();

    const editPayload = standardDraftToPayload({
      ...emptyStandardDraft(),
      id: "std-9",
      name: "Desk",
      price: "99.5",
    });
    expect(editPayload.id).toBe("std-9");
    expect(editPayload.price).toBe(99.5);
  });

  it("maps configurator drafts, validates JSON by sizing type, and builds payloads", () => {
    const empty = emptyConfiguratorDraft();
    expect(JSON.parse(empty.defaultFootprintJson)).toEqual({ L: 1200, D: 600, H: 750 });
    expect(getConfiguratorJsonErrors(empty)).toEqual({});

    const badParametric = getConfiguratorJsonErrors({
      ...empty,
      sizing_type: "parametric",
      workstationJson: "{not-json",
      sizeOptionsJson: "{also-bad",
    });
    expect(badParametric.workstationJson).toMatch(/Invalid JSON in workstation/);
    expect(badParametric.sizeOptionsJson).toBeUndefined();

    expect(
      validateConfiguratorDraft({ ...empty, name: "Desk", category: "  " }, {}),
    ).toBe("Category is required");
    expect(
      validateConfiguratorDraft(
        { ...empty, name: "Desk" },
        { workstationJson: "Invalid JSON in workstation" },
      ),
    ).toBe("Resolve the JSON validation errors before saving.");

    const fromItem = configuratorFromItem(
      baseConfiguratorItem({
        workstation: { shape: "L" },
        materials: ["oak", "steel"],
        sizing_type: "parametric",
      }),
    );
    expect(fromItem.materials).toBe("oak, steel");
    expect(JSON.parse(fromItem.workstationJson)).toEqual({ shape: "L" });

    const parametric = configuratorDraftToPayload({
      ...empty,
      name: "  Desk  ",
      sizing_type: "parametric",
      materials: " oak , , steel ",
      workstationJson: JSON.stringify({ shape: "straight" }),
      model_3d_url: "/catalog-assets/generated/desk.glb",
    });
    expect(parametric).toMatchObject({
      name: "Desk",
      materials: ["oak", "steel"],
      workstation: { shape: "straight" },
      model_3d_url: "/catalog-assets/generated/desk.glb",
    });
    expect(parametric).not.toHaveProperty("size_options");

    expect(() =>
      configuratorDraftToPayload({
        ...empty,
        name: "Desk",
        model_3d_url: "https://cdn.example/hand-authored.glb",
      }),
    ).toThrow(/model_3d_url/);
  });
});
