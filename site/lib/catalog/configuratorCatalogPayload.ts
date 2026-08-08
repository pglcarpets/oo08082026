// Shared validation/normalization for configurator_products admin writes (Plan D / D2).
// Keeps the API routes thin and the rules in one place.

import type { ConfiguratorProductRow } from "./configuratorCatalog";
import type { Dim, SizeOption, SizingType, WorkstationSpec } from "./types";

export type PayloadResult =
  | { row: Omit<ConfiguratorProductRow, "id" | "created_at" | "updated_at"> }
  | { error: string };

const SIZING_TYPES: SizingType[] = ["parametric", "discrete", "fixed"];

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function isDim(v: unknown): v is Dim {
  return !!v && typeof v === "object" && typeof (v as Dim).L === "number" && typeof (v as Dim).D === "number";
}

function isWorkstationSpec(v: unknown): v is WorkstationSpec {
  if (!v || typeof v !== "object") {return false;}
  const w = v as WorkstationSpec;
  return (
    (w.shape === "straight" || w.shape === "l-shape") &&
    (w.system === "leg" || w.system === "partition") &&
    Array.isArray(w.seaterOptions) &&
    Array.isArray(w.lengthOptions) &&
    Array.isArray(w.depthOptions)
  );
}

function isSizeOptions(v: unknown): v is SizeOption[] {
  return Array.isArray(v) && v.every((o) => o && typeof o.sku === "string" && isDim(o.dim));
}

/** Validate + normalize a create/update body into a row (no id/timestamps). */
export function buildConfiguratorRow(body: Record<string, unknown>): PayloadResult {
  const name = asString(body.name);
  const category = asString(body.category);
  const sizing_type = asString(body.sizing_type) as SizingType;

  if (!name) {return { error: "name is required" };}
  if (!category) {return { error: "category is required" };}
  if (!SIZING_TYPES.includes(sizing_type)) {
    return { error: `sizing_type must be one of ${SIZING_TYPES.join(", ")}` };
  }

  // Sizing-type-specific geometry must be present and well-formed.
  let workstation: WorkstationSpec | null = null;
  let size_options: SizeOption[] = [];
  let default_footprint: Dim | null = null;

  if (sizing_type === "parametric") {
    if (!isWorkstationSpec(body.workstation)) {
      return { error: "parametric products require a valid `workstation` spec" };
    }
    workstation = body.workstation;
  } else if (sizing_type === "discrete") {
    if (!isSizeOptions(body.size_options) || (body.size_options as SizeOption[]).length === 0) {
      return { error: "discrete products require a non-empty `size_options` array of { sku, label, dim }" };
    }
    size_options = body.size_options as SizeOption[];
  } else {
    if (!isDim(body.default_footprint)) {
      return { error: "fixed products require a `default_footprint` { L, D, H? }" };
    }
    default_footprint = body.default_footprint;
  }

  const slug = asString(body.slug) || slugify(name);
  const materials = Array.isArray(body.materials)
    ? (body.materials as unknown[]).map((m) => String(m).trim()).filter(Boolean)
    : [];

  return {
    row: {
      slug,
      name,
      category,
      family: asString(body.family) || null,
      brand_name: asString(body.brand_name) || null,
      sizing_type,
      workstation,
      size_options,
      default_footprint,
      derived_rules:
        body.derived_rules && typeof body.derived_rules === "object"
          ? (body.derived_rules as ConfiguratorProductRow["derived_rules"])
          : null,
      materials,
      thumbnail_url: asString(body.thumbnail_url) || null,
      model_3d_url: asString(body.model_3d_url) || null,
      description: asString(body.description) || null,
      active: body.active !== false,
    },
  };
}
