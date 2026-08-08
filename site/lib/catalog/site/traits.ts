type UnknownRecord = Record<string, unknown>;

function toText(value: unknown): string {
  if (typeof value === "string") {return value.trim();}
  if (typeof value === "number") {return String(value);}
  return "";
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) {return [];}
  return value.map((item) => toText(item)).filter(Boolean);
}

function toRecord(value: unknown): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {return {};}
  return value as UnknownRecord;
}

function hasHeadrestToken(value: string): boolean {
  return /\bhead[\s-]?rest\b/i.test(value);
}

function hasHeightAdjustableToken(value: string): boolean {
  return /\b(height[\s-]?adjustable|adjustable[\s-]?height|sit[\s/-]?stand)\b/i.test(value);
}

function collectSpecStrings(specs: unknown): string[] {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) {return [];}

  const collected: string[] = [];
  for (const [key, rawValue] of Object.entries(specs as UnknownRecord)) {
    collected.push(key);
    collected.push(toText(rawValue));
    collected.push(...toTextList(rawValue));
  }
  return collected.filter(Boolean);
}

type HeadrestCandidate = {
  name?: string;
  slug?: string;
  description?: string;
  metadata?: unknown;
  detailedInfo?: unknown;
  specs?: unknown;
};

export function hasVerifiedHeadrest(product: HeadrestCandidate): boolean {
  const metadata = toRecord(product.metadata);
  if (metadata.hasHeadrest !== true) {return false;}

  const detailedInfo = toRecord(product.detailedInfo);
  const candidates = [
    product.name || "",
    product.slug || "",
    product.description || "",
    ...toTextList(metadata.tags),
    ...toTextList(metadata.features),
    ...toTextList(detailedInfo.features),
    ...collectSpecStrings(product.specs),
  ].filter(Boolean);

  return candidates.some((value) => hasHeadrestToken(value));
}

type HeightAdjustableCandidate = {
  name?: string;
  slug?: string;
  description?: string;
  metadata?: unknown;
  detailedInfo?: unknown;
  specs?: unknown;
};

export function hasVerifiedHeightAdjustable(product: HeightAdjustableCandidate): boolean {
  const metadata = toRecord(product.metadata);
  if (metadata.isHeightAdjustable === true) {return true;}

  const detailedInfo = toRecord(product.detailedInfo);
  const candidates = [
    product.name || "",
    product.slug || "",
    product.description || "",
    toText(metadata.subcategory),
    toText(metadata.subcategoryLabel),
    ...toTextList(metadata.tags),
    ...toTextList(metadata.features),
    ...toTextList(detailedInfo.features),
    ...collectSpecStrings(product.specs),
  ].filter(Boolean);

  return candidates.some((value) => hasHeightAdjustableToken(value));
}
