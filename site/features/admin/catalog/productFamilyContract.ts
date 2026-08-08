/**
 * Admin boundary re-export of the shared product family contract (Phase 3).
 */
export {
  PRODUCT_FAMILY_SCHEMA_VERSION,
  PRODUCT_FAMILY_V1_FIXTURE,
  ProductFamilyV1Schema,
  ProductFamilyVersionV1Schema,
  FamilyOptionGroupV1Schema,
  FamilyOptionV1Schema,
  FamilyCompatibilityRuleV1Schema,
  parseProductFamilyV1,
  getFamilyVersion,
  validateFamilyConfiguration,
  formatFamilyConfigError,
  previewFamilyConfiguration,
  buildDraftFamilyFromForm,
  type ProductFamilyV1,
  type ProductFamilyVersionV1,
  type FamilyOptionGroupV1,
  type FamilyOptionV1,
  type FamilyCompatibilityRuleV1,
  type FamilyConfigError,
  type FamilyConfigValidation,
  type FamilyConfigurationPreview,
  type FamilyConfigurationPreviewResult,
  type ProductFamilyFormDraft,
} from "@/features/shared/catalog/productFamilyContract";
