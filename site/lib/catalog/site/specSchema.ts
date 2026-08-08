import { existsSync } from "fs";
import { join } from "path";
import type { CompatProduct } from '@/lib/catalog/site/getProducts';
import { isSupportedCatalogSlug } from '@/lib/catalog/site/slugResolver';
import { normalizeAssetList, normalizeAssetPath } from "@/lib/assetPaths";

export type ProductIssueSeverity = "critical" | "high" | "medium";

export type ProductIssueCode =
  | "missing_primary_image"
  | "missing_gallery_images"
  | "missing_description"
  | "missing_alt_text"
  | "missing_dimensions"
  | "missing_materials"
  | "missing_features"
  | "missing_subcategory"
  | "missing_warranty"
  | "missing_sustainability_score"
  | "missing_documents"
  | "invalid_primary_image_path"
  | "invalid_gallery_image_path"
  | "legacy_slug_format"
  | "suspicious_text_encoding";

export interface ProductQualityIssue {
  code: ProductIssueCode;
  severity: ProductIssueSeverity;
  message: string;
}

export interface ProductFieldRequirement {
  code: ProductIssueCode;
  severity: ProductIssueSeverity;
  label: string;
}

export interface ProductCategorySchema {
  categoryId: string;
  displayName: string;
  requirements: ProductFieldRequirement[];
}

const COMMON_REQUIREMENTS: ProductFieldRequirement[] = [
  { code: "missing_dimensions", severity: "high", label: "Dimensions" },
  { code: "missing_materials", severity: "high", label: "Materials" },
  { code: "missing_features", severity: "medium", label: "Features" },
  { code: "missing_subcategory", severity: "medium", label: "Subcategory" },
  { code: "missing_warranty", severity: "medium", label: "Warranty years" },
  { code: "missing_sustainability_score", severity: "medium", label: "Sustainability score" },
];

export const PRODUCT_CATEGORY_SCHEMAS: Record<string, ProductCategorySchema> = {
  seating: { categoryId: "seating", displayName: "Seating", requirements: COMMON_REQUIREMENTS },
  workstations: { categoryId: "workstations", displayName: "Workstations", requirements: COMMON_REQUIREMENTS },
  tables: { categoryId: "tables", displayName: "Tables", requirements: COMMON_REQUIREMENTS },
  storages: { categoryId: "storages", displayName: "Storages", requirements: COMMON_REQUIREMENTS },
  "soft-seating": {
    categoryId: "soft-seating",
    displayName: "Soft Seating",
    requirements: COMMON_REQUIREMENTS,
  },
  education: { categoryId: "education", displayName: "Education", requirements: COMMON_REQUIREMENTS },
};

const DEFAULT_SCHEMA: ProductCategorySchema = {
  categoryId: "general",
  displayName: "General",
  requirements: COMMON_REQUIREMENTS,
};

function containsSuspiciousEncoding(value: string): boolean {
  return /\uFFFD|Ã¢â‚¬â€|Ã¢â‚¬â€œ|Ã¢â‚¬â„¢|Ã¢â‚¬Å“|Ã¢â‚¬/.test(value);
}

function toText(value: unknown): string {
  if (typeof value !== "string") {return "";}
  return value.trim();
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) {return [];}
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function extractDocumentCandidates(value: unknown): string[] {
  if (typeof value === "string") {
    const text = value.trim();
    return text ? [text] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractDocumentCandidates(item));
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const directKeys = [
    "documents",
    "document",
    "documentUrl",
    "documentUrls",
    "documentLink",
    "documentLinks",
    "brochure",
    "brochures",
    "brochureUrl",
    "brochureUrls",
    "pdf",
    "pdfs",
    "downloads",
    "downloadsUrl",
    "technicalDrawings",
    "technicalDrawing",
    "specSheet",
    "specSheets",
    "specSheetUrl",
    "specSheetUrls",
    "datasheet",
    "datasheets",
  ];

  return directKeys.flatMap((key) => extractDocumentCandidates(record[key]));
}

function getSpecs(product: CompatProduct): Record<string, unknown> {
  return product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
    ? (product.specs as Record<string, unknown>)
    : {};
}

function getAllTextFields(product: CompatProduct): string[] {
  const specs = getSpecs(product);
  return [
    product.name,
    product.description,
    product.detailedInfo?.overview,
    product.altText,
    toText(product.metadata?.subcategory),
    toText(specs.dimensions),
    ...toTextList(specs.materials),
    ...toTextList(specs.features),
    ...toTextList(product.metadata?.material),
    ...toTextList(product.metadata?.useCase),
  ].filter(Boolean) as string[];
}

function fileExistsForPublicAsset(assetPath: string): boolean {
  if (!assetPath.startsWith("/")) {return true;}
  return existsSync(join(process.cwd(), "public", assetPath.replace(/^\/+/, "")));
}

export function getProductCategorySchema(categoryId: string): ProductCategorySchema {
  return PRODUCT_CATEGORY_SCHEMAS[categoryId] || DEFAULT_SCHEMA;
}

export function collectProductImages(product: CompatProduct): string[] {
  const seen = new Set<string>();
  const images = [
    normalizeAssetPath(product.flagshipImage, { probeDisk: true }),
    ...normalizeAssetList(Array.isArray(product.images) ? product.images : []),
    ...normalizeAssetList(Array.isArray(product.sceneImages) ? product.sceneImages : []),
    ...(Array.isArray(product.variants)
      ? product.variants.flatMap((variant) => normalizeAssetList(variant.galleryImages || []))
      : []),
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return images.filter((value) => {
    if (seen.has(value)) {return false;}
    seen.add(value);
    return true;
  });
}

export function collectProductDocuments(product: CompatProduct): string[] {
  const seen = new Set<string>();
  const values = [
    ...extractDocumentCandidates(product.documents),
    ...extractDocumentCandidates(product.technicalDrawings),
    ...extractDocumentCandidates(product.metadata),
    ...extractDocumentCandidates(product.specs),
    ...extractDocumentCandidates(product.variants),
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return values.filter((value) => {
    if (seen.has(value)) {return false;}
    seen.add(value);
    return true;
  });
}

export function auditCompatProduct(
  categoryId: string,
  product: CompatProduct,
): ProductQualityIssue[] {
  const schema = getProductCategorySchema(categoryId);
  const specs = getSpecs(product);
  const issues: ProductQualityIssue[] = [];
  const dimensions = toText(product.detailedInfo?.dimensions) || toText(specs.dimensions);
  const materials =
    toTextList(product.detailedInfo?.materials).length > 0
      ? toTextList(product.detailedInfo?.materials)
      : toTextList(specs.materials).length > 0
        ? toTextList(specs.materials)
        : toTextList(product.metadata?.material);
  const features =
    toTextList(product.detailedInfo?.features).length > 0
      ? toTextList(product.detailedInfo?.features)
      : toTextList(specs.features);
  const subcategory = toText(product.metadata?.subcategory);
  const subcategoryId = toText(product.metadata?.subcategoryId);
  const warrantyYears = toNumber(product.metadata?.warrantyYears);
  const sustainabilityScore =
    toNumber(product.metadata?.sustainabilityScore) ?? toNumber(specs.sustainability_score);
  const images = collectProductImages(product);
  const primaryImage =
    normalizeAssetPath(toText(product.flagshipImage), { probeDisk: true }) || images[0] || "";
  const altText =
    toText(product.altText) ||
    toText(product.metadata?.ai_alt_text) ||
    toText(product.metadata?.aiAltText);
  const documents = collectProductDocuments(product);

  if (!primaryImage) {
    issues.push({ code: "missing_primary_image", severity: "critical", message: "Primary image is missing." });
  } else if (!fileExistsForPublicAsset(primaryImage)) {
    issues.push({
      code: "invalid_primary_image_path",
      severity: "critical",
      message: `Primary image asset not found: ${primaryImage}`,
    });
  }

  if (images.length < 2) {
    issues.push({
      code: "missing_gallery_images",
      severity: "high",
      message: "Product has fewer than 2 usable gallery images.",
    });
  }

  for (const image of images.slice(0, 12)) {
    if (!fileExistsForPublicAsset(image)) {
      issues.push({
        code: "invalid_gallery_image_path",
        severity: "high",
        message: `Gallery image asset not found: ${image}`,
      });
    }
  }

  if (toText(product.description).length < 20) {
    issues.push({ code: "missing_description", severity: "high", message: "Description is missing or too short." });
  }

  if (!altText) {
    issues.push({ code: "missing_alt_text", severity: "medium", message: "Alt text is missing." });
  }

  if (!isSupportedCatalogSlug(product.slug, categoryId)) {
    issues.push({
      code: "legacy_slug_format",
      severity: "medium",
      message: `Slug does not follow a supported catalog format for ${categoryId}.`,
    });
  }

  if (getAllTextFields(product).some((value) => containsSuspiciousEncoding(value))) {
    issues.push({
      code: "suspicious_text_encoding",
      severity: "high",
      message: "Suspicious text encoding artifacts detected in product content.",
    });
  }

  for (const requirement of schema.requirements) {
    if (requirement.code === "missing_dimensions" && !dimensions) {
      issues.push({ code: requirement.code, severity: requirement.severity, message: `${requirement.label} is missing.` });
    }
    if (requirement.code === "missing_materials" && materials.length === 0) {
      issues.push({ code: requirement.code, severity: requirement.severity, message: `${requirement.label} is missing.` });
    }
    if (requirement.code === "missing_features" && features.length === 0) {
      issues.push({ code: requirement.code, severity: requirement.severity, message: `${requirement.label} is missing.` });
    }
    if (requirement.code === "missing_subcategory" && !subcategory && !subcategoryId) {
      issues.push({ code: requirement.code, severity: requirement.severity, message: `${requirement.label} is missing.` });
    }
    if (requirement.code === "missing_warranty" && warrantyYears === null) {
      issues.push({ code: requirement.code, severity: requirement.severity, message: `${requirement.label} is missing.` });
    }
    if (requirement.code === "missing_sustainability_score" && sustainabilityScore === null) {
      issues.push({ code: requirement.code, severity: requirement.severity, message: `${requirement.label} is missing.` });
    }
  }

  if (documents.length === 0) {
    issues.push({
      code: "missing_documents",
      severity: "medium",
      message: "Spec sheet or brochure document is missing.",
    });
  }

  return issues;
}
