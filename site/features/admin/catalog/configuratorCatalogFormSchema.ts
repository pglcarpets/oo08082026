import { z } from "zod";

/**
 * RHF + Zod schema for the configurator catalog draft form's scalar fields.
 * JSON sizing payloads (workstationJson/sizeOptionsJson/defaultFootprintJson/
 * derivedRulesJson) are validated separately by `getConfiguratorJsonErrors`
 * (semantic JSON-shape checks, not simple field values) and stay out of this
 * schema — `validateConfiguratorDraft` still gates save on both.
 */
export const configuratorCatalogFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.string().trim().min(1, "Category is required"),
});

export type ConfiguratorCatalogFormValues = z.infer<
  typeof configuratorCatalogFormSchema
>;

/** Stable form id so the drawer footer can submit via the `form` attribute. */
export const CONFIGURATOR_CATALOG_FORM_ID = "admin-configurator-catalog-form";
