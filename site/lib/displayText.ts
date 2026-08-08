export function sanitizeDisplayText(value: string): string {
  return String(value || "")
    .replace(/[\uFFFD]+/g, "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019']/g, "'")
    .replace(/[\u201c\u201d"]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/(?:\u20B9|₹)\s*/g, "Rs. ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDimensionText(value: string): string {
  return sanitizeDisplayText(value)
    .replace(
      /\bW\s*(\d{2,4})\s*D\s*(\d{2,4})\s*H\s*(\d{3})\s*[-/]\s*(\d{3,4})\s*mm\b/gi,
      "W $1 x D $2 x H $3-$4 mm",
    )
    .replace(
      /\bW\s*(\d{2,4})\s*D\s*(\d{2,4})\s*H\s*(\d{3})(\d{3,4})\s*mm\b/gi,
      "W $1 x D $2 x H $3-$4 mm",
    )
    .replace(
      /\bW\s*(\d{2,4})\s*D\s*(\d{2,4})\s*H\s*(\d{2,4})\s*mm\b/gi,
      "W $1 x D $2 x H $3 mm",
    )
    .replace(/([0-9])([A-Z])/g, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b([WDHL])\s*(\d)/g, "$1 $2")
    .replace(/(\d)(mm)\b/gi, "$1 $2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function filterMeaningfulDimensionText(value: string): string {
  const normalized = normalizeDimensionText(value);
  return /\d/.test(normalized) ? normalized : "";
}

const GENERIC_MATERIAL_TOKENS = new Set([
  "fabric",
  "foam",
  "nylon",
  "chrome",
  "metal",
  "wood",
  "steel",
  "mesh",
  "leather",
  "plastic",
  "plywood",
  "pu",
]);

function isGenericMaterialValue(value: string): boolean {
  const normalized = sanitizeDisplayText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) {return true;}
  return normalized
    .split(/[/\s-]+/)
    .filter(Boolean)
    .every((token) => GENERIC_MATERIAL_TOKENS.has(token));
}

export function filterMeaningfulMaterialList(values: string[]): string[] {
  const cleaned = values.map((value) => sanitizeDisplayText(value)).filter(Boolean);
  if (cleaned.length === 0) {return [];}
  return cleaned.every(isGenericMaterialValue) ? [] : cleaned;
}
