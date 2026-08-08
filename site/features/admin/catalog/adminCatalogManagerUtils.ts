import type {
  ConfiguratorCatalogItem,
  StandardCatalogItem,
} from "../api/adminCatalogClient";
import type {
  ConfiguratorProductBodyInput,
  CreateStandardCatalogItemInput,
} from "@/features/shared/api/schemas";
import { assertNoDesignerStaticGlb } from "@/lib/catalog/glbAssetPolicy";
import {
  MESH_TYPES,
  STANDARD_CATEGORIES,
  firstStandardCatalogFormError,
} from "./standardCatalogFormSchema";

export { MESH_TYPES, STANDARD_CATEGORIES };

export const CONFIGURATOR_CATEGORIES = [
  "desks",
  "seating",
  "storage",
  "tables",
  "meeting",
  "accessories",
] as const;

export type CatalogListProps = {
  title: string;
  description: string;
  catalogType: "standard" | "configurator";
};

/**
 * Catalog list page size. Phone renders fat stacked cards (~250–300px each);
 * 50 rows ≈ 15k px scroll. 12 keeps the list pageable on phone and is fine on desktop.
 */
export const ADMIN_CATALOG_PAGE_SIZE = 12;

export type EditorMode = "create" | "edit" | null;

export type CatalogManagerItem = StandardCatalogItem | ConfiguratorCatalogItem;

export type StandardDraft = {
  id?: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  width_mm: string;
  depth_mm: string;
  height_mm: string;
  price: string;
  mesh_type: string;
  image_url: string;
  visible: boolean;
};

export type ConfiguratorDraft = {
  id?: string;
  slug: string;
  name: string;
  category: string;
  family: string;
  brand_name: string;
  sizing_type: "parametric" | "discrete" | "fixed";
  description: string;
  materials: string;
  thumbnail_url: string;
  model_3d_url: string;
  active: boolean;
  workstationJson: string;
  sizeOptionsJson: string;
  defaultFootprintJson: string;
  derivedRulesJson: string;
};

export type ConfiguratorJsonField =
  | "workstationJson"
  | "sizeOptionsJson"
  | "defaultFootprintJson"
  | "derivedRulesJson";

export type ConfiguratorJsonErrors = Partial<Record<ConfiguratorJsonField, string>>;

export function emptyStandardDraft(): StandardDraft {
  return {
    name: "",
    category: "workstation",
    subcategory: "",
    description: "",
    width_mm: "1200",
    depth_mm: "600",
    height_mm: "750",
    price: "",
    mesh_type: "box",
    image_url: "",
    visible: true,
  };
}

export function standardFromItem(item: StandardCatalogItem): StandardDraft {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    subcategory: item.subcategory ?? "",
    description: item.description ?? "",
    width_mm: String(item.width_mm ?? ""),
    depth_mm: String(item.depth_mm ?? ""),
    height_mm: String(item.height_mm ?? ""),
    price: item.price !== null && item.price !== undefined ? String(item.price) : "",
    mesh_type: item.mesh_type ?? "box",
    image_url: item.image_url ?? "",
    visible: item.visible !== false && item.active !== false,
  };
}

export function emptyConfiguratorDraft(): ConfiguratorDraft {
  return {
    slug: "",
    name: "",
    category: "desks",
    family: "",
    brand_name: "",
    sizing_type: "fixed",
    description: "",
    materials: "",
    thumbnail_url: "",
    model_3d_url: "",
    active: true,
    workstationJson: JSON.stringify(
      {
        shape: "straight",
        system: "leg",
        wireManagement: [],
        sharing: "non-sharing",
        seaterOptions: [1, 2, 4],
        lengthOptions: [1200, 1500],
        depthOptions: [600, 750],
        heightMm: 750,
      },
      null,
      2,
    ),
    sizeOptionsJson: JSON.stringify(
      [{ sku: "SKU-1200", label: "1200mm", dim: { L: 1200, D: 600, H: 750 } }],
      null,
      2,
    ),
    defaultFootprintJson: JSON.stringify({ L: 1200, D: 600, H: 750 }, null, 2),
    derivedRulesJson: "",
  };
}

export function configuratorFromItem(item: ConfiguratorCatalogItem): ConfiguratorDraft {
  const defaults = emptyConfiguratorDraft();

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    category: item.category,
    family: item.family ?? "",
    brand_name: item.brand_name ?? "",
    sizing_type: item.sizing_type,
    description: item.description ?? "",
    materials: (item.materials ?? []).join(", "),
    thumbnail_url: item.thumbnail_url ?? "",
    model_3d_url: item.model_3d_url ?? "",
    active: item.active !== false,
    workstationJson: item.workstation
      ? JSON.stringify(item.workstation, null, 2)
      : defaults.workstationJson,
    sizeOptionsJson: item.size_options
      ? JSON.stringify(item.size_options, null, 2)
      : defaults.sizeOptionsJson,
    defaultFootprintJson: item.default_footprint
      ? JSON.stringify(item.default_footprint, null, 2)
      : defaults.defaultFootprintJson,
    derivedRulesJson: item.derived_rules ? JSON.stringify(item.derived_rules, null, 2) : "",
  };
}

function parseJsonField(raw: string, fieldName: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) {return undefined;}

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    throw new Error(`Invalid JSON in ${fieldName}`);
  }
}

function parsePositiveNumber(raw: string, label: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number`);
  }
  return value;
}

export function getConfiguratorJsonErrors(
  draft: ConfiguratorDraft,
): ConfiguratorJsonErrors {
  const errors: ConfiguratorJsonErrors = {};

  try {
    if (draft.sizing_type === "parametric") {
      parseJsonField(draft.workstationJson, "workstation");
    }
  } catch (error) {
    errors.workstationJson =
      error instanceof Error ? error.message : "Invalid JSON in workstation";
  }

  try {
    if (draft.sizing_type === "discrete") {
      parseJsonField(draft.sizeOptionsJson, "size_options");
    }
  } catch (error) {
    errors.sizeOptionsJson =
      error instanceof Error ? error.message : "Invalid JSON in size_options";
  }

  try {
    if (draft.sizing_type === "fixed") {
      parseJsonField(draft.defaultFootprintJson, "default_footprint");
    }
  } catch (error) {
    errors.defaultFootprintJson =
      error instanceof Error ? error.message : "Invalid JSON in default_footprint";
  }

  try {
    if (draft.derivedRulesJson.trim()) {
      parseJsonField(draft.derivedRulesJson, "derived_rules");
    }
  } catch (error) {
    errors.derivedRulesJson =
      error instanceof Error ? error.message : "Invalid JSON in derived_rules";
  }

  return errors;
}

/** Zod-backed standard draft gate (same messages as pre-RHF path). */
export function validateStandardDraft(draft: StandardDraft): string | null {
  return firstStandardCatalogFormError(draft);
}

export function validateConfiguratorDraft(
  draft: ConfiguratorDraft,
  jsonErrors: ConfiguratorJsonErrors,
): string | null {
  if (!draft.name.trim()) {return "Name is required";}
  if (!draft.category.trim()) {return "Category is required";}
  if (Object.keys(jsonErrors).length > 0) {
    return "Resolve the JSON validation errors before saving.";
  }
  return null;
}

export function standardDraftToPayload(
  draft: StandardDraft,
): CreateStandardCatalogItemInput {
  return {
    ...(draft.id ? { id: draft.id } : {}),
    name: draft.name.trim(),
    category: draft.category.trim(),
    subcategory: draft.subcategory.trim() || undefined,
    description: draft.description.trim() || undefined,
    width_mm: parsePositiveNumber(draft.width_mm, "Width"),
    depth_mm: parsePositiveNumber(draft.depth_mm, "Depth"),
    height_mm: parsePositiveNumber(draft.height_mm, "Height"),
    price: draft.price.trim() ? Number(draft.price) : undefined,
    mesh_type: draft.mesh_type || "box",
    image_url: draft.image_url.trim() || undefined,
    visible: draft.visible,
  };
}

export function configuratorDraftToPayload(
  draft: ConfiguratorDraft,
): ConfiguratorProductBodyInput {
  const payload: ConfiguratorProductBodyInput = {
    name: draft.name.trim(),
    category: draft.category.trim(),
    slug: draft.slug.trim() || undefined,
    family: draft.family.trim() || undefined,
    brand_name: draft.brand_name.trim() || undefined,
    sizing_type: draft.sizing_type,
    description: draft.description.trim() || undefined,
    materials: draft.materials
      .split(",")
      .map((material) => material.trim())
      .filter(Boolean),
    thumbnail_url: draft.thumbnail_url.trim() || undefined,
    model_3d_url: (() => {
      const url = draft.model_3d_url.trim() || undefined;
      assertNoDesignerStaticGlb(url, "model_3d_url");
      return url;
    })(),
    active: draft.active,
  };

  if (draft.sizing_type === "parametric") {
    payload.workstation = parseJsonField(draft.workstationJson, "workstation");
  } else if (draft.sizing_type === "discrete") {
    payload.size_options = parseJsonField(draft.sizeOptionsJson, "size_options");
  } else {
    payload.default_footprint = parseJsonField(
      draft.defaultFootprintJson,
      "default_footprint",
    );
  }

  if (draft.derivedRulesJson.trim()) {
    payload.derived_rules = parseJsonField(draft.derivedRulesJson, "derived_rules");
  }

  return payload;
}
