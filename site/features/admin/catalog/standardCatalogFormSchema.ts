import { z } from "zod";

/** Procedural / system mesh kinds only — no designer static glb/gltf product type. */
export const MESH_TYPES = ["box", "cylinder", "sphere", "custom"] as const;

export const STANDARD_CATEGORIES = [
  "workstation",
  "table",
  "storage",
  "seating",
  "partition",
  "misc",
] as const;

/**
 * RHF + Zod schema for the standard (managed products) catalog draft form.
 * Field types stay required strings (not optional+default) so zodResolver
 * input/output types match without casts. Numeric mm/price stay string in
 * the form; conversion to numbers happens in standardDraftToPayload.
 */

function positiveMmString(label: string) {
  return z.string().refine(
    (raw) => {
      const value = Number(raw);
      return Number.isFinite(value) && value > 0;
    },
    { message: `${label} must be a positive number` },
  );
}

export const standardCatalogFormSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Name is required"),
  /** Select options use STANDARD_CATEGORIES; keep string for API-loaded drafts. */
  category: z.string().min(1, "Category is required"),
  subcategory: z.string(),
  description: z.string(),
  width_mm: positiveMmString("Width"),
  depth_mm: positiveMmString("Depth"),
  height_mm: positiveMmString("Height"),
  price: z.string().refine(
    (raw) => {
      if (!raw.trim()) {
        return true;
      }
      const value = Number(raw);
      return Number.isFinite(value) && value >= 0;
    },
    { message: "Price must be a non-negative number" },
  ),
  mesh_type: z.string(),
  image_url: z.string(),
  visible: z.boolean(),
});

export type StandardCatalogFormValues = z.infer<typeof standardCatalogFormSchema>;

/** Stable form id so the drawer footer can submit via the `form` attribute. */
export const STANDARD_CATALOG_FORM_ID = "admin-standard-catalog-form";

/**
 * First schema issue in save-banner order (matches prior validateStandardDraft).
 */
export function firstStandardCatalogFormError(draft: unknown): string | null {
  const result = standardCatalogFormSchema.safeParse(draft);
  if (result.success) {
    return null;
  }

  const order = [
    "name",
    "width_mm",
    "depth_mm",
    "height_mm",
    "price",
    "category",
    "mesh_type",
  ] as const;

  for (const key of order) {
    const issue = result.error.issues.find((entry) => entry.path[0] === key);
    if (issue) {
      return issue.message;
    }
  }

  return result.error.issues[0]?.message ?? "Invalid draft";
}
