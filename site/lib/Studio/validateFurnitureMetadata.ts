export type FurnitureMetadataInput = {
  name?: string;
  category?: string;
  width_mm?: number;
  depth_mm?: number;
  height_mm?: number;
};

export type FurnitureValidationIssue = {
  field: string;
  message: string;
};

const MAX_NAME = 120;
const MAX_DIM_MM = 50_000;

export function validateFurnitureMetadata(
  input: FurnitureMetadataInput,
): FurnitureValidationIssue[] {
  const issues: FurnitureValidationIssue[] = [];
  const name = (input.name ?? "").trim();
  if (!name) issues.push({ field: "name", message: "Name is required" });
  else if (name.length > MAX_NAME) {
    issues.push({ field: "name", message: `Name max ${MAX_NAME} characters` });
  }

  const category = (input.category ?? "").trim();
  if (!category) issues.push({ field: "category", message: "Category is required" });

  for (const key of ["width_mm", "depth_mm", "height_mm"] as const) {
    const v = input[key];
    if (v === undefined || v === null) continue;
    if (!Number.isFinite(v) || v <= 0) {
      issues.push({ field: key, message: `${key} must be a positive number` });
    } else if (v > MAX_DIM_MM) {
      issues.push({ field: key, message: `${key} exceeds ${MAX_DIM_MM} mm` });
    }
  }

  return issues;
}

export function isFurnitureMetadataValid(input: FurnitureMetadataInput): boolean {
  return validateFurnitureMetadata(input).length === 0;
}
