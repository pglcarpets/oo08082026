import type { CompatCategory, CompatProduct, CompatSeries } from '@/lib/catalog/site/getProducts';
import { isPublishableCatalogProduct } from '@/lib/catalog/site/catalogProductFilters';

export const Catalog_CATEGORY_ORDER = [
  "seating",
  "workstations",
  "tables",
  "storages",
  "soft-seating",
  "education",
] as const;

export type RequestedCategoryId = (typeof Catalog_CATEGORY_ORDER)[number];

export const Catalog_CATEGORY_LABELS: Record<RequestedCategoryId, string> = {
  seating: "Seating",
  workstations: "Workstations",
  tables: "Tables",
  storages: "Storage",
  "soft-seating": "Soft Seating",
  education: "Education",
};

export const Catalog_CATEGORY_DESCRIPTIONS: Record<RequestedCategoryId, string> = {
  seating: "Leather, mesh, training and cafe chair collections.",
  workstations: "Height-adjustable, panel and desking workstation systems.",
  tables: "Cabin, meeting, training and cafe table collections.",
  storages: "Compactor, metal and prelam storage systems.",
  "soft-seating": "Lounge and comfort-focused seating collections.",
  education: "Classroom, auditorium, hostel and library furniture systems.",
};

type CanonicalSubcategoryDefinition = {
  id: string;
  label: string;
  aliases?: readonly string[];
};

export const Catalog_SUBCATEGORY_DEFINITIONS: Record<
  RequestedCategoryId,
  readonly CanonicalSubcategoryDefinition[]
> = {
  seating: [
    { id: "mesh", label: "Mesh chairs", aliases: ["mesh chair", "mesh"] },
    { id: "leather", label: "Leather chairs", aliases: ["leather chair", "executive chair"] },
    { id: "fabric", label: "Fabric chairs", aliases: ["fabric chair", "visitor chair"] },
    { id: "study", label: "Study chairs", aliases: ["study chair", "training chair"] },
    { id: "cafe", label: "Cafe chairs", aliases: ["cafe chair", "bar stool", "stool"] },
  ],
  workstations: [
    { id: "height-adjustable", label: "Height Adjustable Series", aliases: ["height adjustable"] },
    { id: "desking", label: "Desking Series", aliases: ["desking", "linear workstation", "modular workstation"] },
    { id: "panel", label: "Panel Series", aliases: ["panel", "panel workstation"] },
  ],
  tables: [
    { id: "cabin", label: "Cabin Tables", aliases: ["cabin table", "cabin desks"] },
    { id: "meeting", label: "Meeting Tables", aliases: ["meeting table", "conference table"] },
    { id: "cafe", label: "Cafe Tables", aliases: ["cafe table"] },
    { id: "training", label: "Training Tables", aliases: ["training table"] },
  ],
  storages: [
    { id: "prelam", label: "Prelam Storage", aliases: ["prelam", "prelam storage"] },
    { id: "metal", label: "Metal Storage", aliases: ["metal", "metal storage"] },
    { id: "compactor", label: "Compactor Storage", aliases: ["compactor", "compactor storage"] },
    { id: "locker", label: "Locker", aliases: ["locker", "pedestal", "cabinet"] },
  ],
  "soft-seating": [
    { id: "lounge", label: "Lounge", aliases: ["lounge", "lounge chair"] },
    { id: "sofa", label: "Sofa", aliases: ["sofa"] },
    { id: "collaborative", label: "Collaborative", aliases: ["collaborative", "pod"] },
    { id: "pouffee", label: "Pouffee", aliases: ["pouffee", "pouf", "ottoman"] },
    { id: "occasional-tables", label: "Occasional Tables", aliases: ["occasional table", "coffee table", "side table"] },
  ],
  education: [
    { id: "classroom", label: "Classroom", aliases: ["classroom"] },
    { id: "library", label: "Library", aliases: ["library"] },
    { id: "hostel", label: "Hostel", aliases: ["hostel"] },
    { id: "auditorium", label: "Auditorium", aliases: ["auditorium"] },
  ],
};

export const Catalog_SUBCATEGORY_LABELS: Record<RequestedCategoryId, readonly string[]> = {
  seating: Catalog_SUBCATEGORY_DEFINITIONS.seating.map((definition) => definition.label),
  workstations: Catalog_SUBCATEGORY_DEFINITIONS.workstations.map((definition) => definition.label),
  tables: Catalog_SUBCATEGORY_DEFINITIONS.tables.map((definition) => definition.label),
  storages: Catalog_SUBCATEGORY_DEFINITIONS.storages.map((definition) => definition.label),
  "soft-seating": Catalog_SUBCATEGORY_DEFINITIONS["soft-seating"].map((definition) => definition.label),
  education: Catalog_SUBCATEGORY_DEFINITIONS.education.map((definition) => definition.label),
};

type ProductWithContext = {
  product: CompatProduct;
  baseCategoryId: string;
  seriesName: string;
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function slugifyCatalogToken(value: unknown): string {
  return String(value || "")
    .replace(/\u00c3\u0192\u00c2\u00a9|\u00c3\u00a9/g, "\u00e9")
    .replace(/\u00c3\u2014/g, "\u00d7")
    .replace(/\u00c3\u0192\u00e2\u201a\u00ac\u201d/g, "\u00d7")
    .replace(/ÃƒÂ©|Ã©/g, "é")
    .replace(/Ãƒâ€”/g, "×")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00d7/g, "x")
    .replace(/Ã—/g, "x")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function productText(item: ProductWithContext): string {
  const p = item.product;
  return normalize(
    [
      p.id,
      p.slug || "",
      p.name,
      p.description || "",
      item.baseCategoryId,
      item.seriesName,
      p.metadata?.category || "",
      p.metadata?.subcategory || "",
      ...(p.metadata?.tags || []),
    ].join(" "),
  );
}

function hasToken(text: string, token: string): boolean {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
  return re.test(text);
}

const requestedCategorySet = new Set<string>(Catalog_CATEGORY_ORDER);

export function normalizeRequestedCategoryId(input: string): RequestedCategoryId | null {
  const normalized = normalize(input).replace(/\s+/g, "-");
  if (requestedCategorySet.has(normalized)) {
    return normalized as RequestedCategoryId;
  }

  const stripped = normalized.startsWith("oando-")
    ? normalized.slice("oando-".length)
    : normalized;

  if (stripped === "storage") {return "storages";}
  if (stripped === "educational") {return "education";}
  if (stripped === "collaborative") {return "soft-seating";}
  if (stripped === "chairs" || stripped === "other-seating") {return "seating";}
  if (stripped === "seating") {return "seating";}
  if (stripped === "workstations") {return "workstations";}
  if (stripped === "tables") {return "tables";}
  if (stripped === "soft-seating") {return "soft-seating";}

  if (normalized === "desks-cabin-tables" || normalized === "meeting-conference-tables") {
    return "tables";
  }
  if (
    normalized === "chairs-mesh" ||
    normalized === "chairs-others" ||
    normalized === "cafe-seating" ||
    normalized === "others-2"
  ) {
    return "seating";
  }
  if (normalized === "others-1") {return "soft-seating";}

  return null;
}

export function getCanonicalCategoryId(input: string): RequestedCategoryId | null {
  return normalizeRequestedCategoryId(input);
}

export function findCanonicalSubcategoryDefinition(
  categoryId: RequestedCategoryId,
  value: string,
): CanonicalSubcategoryDefinition | null {
  const normalizedValue = normalize(value);
  const slugValue = slugifyCatalogToken(value);
  for (const definition of Catalog_SUBCATEGORY_DEFINITIONS[categoryId] || []) {
    if (normalize(definition.label) === normalizedValue) {return definition;}
    if (definition.id === slugValue) {return definition;}
    if ((definition.aliases || []).some((alias) => normalize(alias) === normalizedValue)) {
      return definition;
    }
  }
  return null;
}

export function getCanonicalSubcategoryId(
  categoryId: string,
  value: string,
): string {
  const requestedCategoryId = normalizeRequestedCategoryId(categoryId);
  if (!requestedCategoryId) {return slugifyCatalogToken(value);}
  const definition = findCanonicalSubcategoryDefinition(requestedCategoryId, value);
  return definition?.id || slugifyCatalogToken(value);
}

export function getCanonicalSubcategoryLabel(
  categoryId: string,
  subcategoryId: string,
  fallback = "",
): string {
  const requestedCategoryId = normalizeRequestedCategoryId(categoryId);
  if (!requestedCategoryId) {return fallback;}
  const definition = Catalog_SUBCATEGORY_DEFINITIONS[requestedCategoryId].find(
    (entry) => entry.id === subcategoryId,
  );
  return definition?.label || fallback;
}

export function resolveCanonicalSubcategory(
  categoryId: string,
  input: {
    subcategory?: string;
    subcategoryId?: string;
    productName?: string;
    productSlug?: string;
    description?: string;
    seriesName?: string;
  },
): { id: string; label: string } {
  const canonicalCategoryId = normalizeRequestedCategoryId(categoryId);

  if (canonicalCategoryId) {
    for (const candidate of [input.subcategoryId, input.subcategory]) {
      if (!candidate?.trim()) {continue;}
      const definition = findCanonicalSubcategoryDefinition(canonicalCategoryId, candidate);
      if (definition) {
        return { id: definition.id, label: definition.label };
      }
    }
  }

  const combinedText = normalize(
    [
      input.subcategoryId || "",
      input.subcategory || "",
      input.productSlug || "",
      input.productName || "",
      input.description || "",
      input.seriesName || "",
    ].join(" "),
  );

  if (!canonicalCategoryId) {
    const fallbackId = slugifyCatalogToken(input.subcategory || input.productName || "general");
    return {
      id: fallbackId,
      label: input.subcategory || input.productName || "General",
    };
  }

  const subcategoryLabel = (() => {
    if (canonicalCategoryId === "seating") {
      if (hasToken(combinedText, "mesh") || hasToken(combinedText, "x mesh")) {return "Mesh chairs";}
      if (
        hasToken(combinedText, "cafe") ||
        hasToken(combinedText, "stool") ||
        hasToken(combinedText, "bar stool")
      ) {
        return "Cafe chairs";
      }
      if (hasToken(combinedText, "training") || hasToken(combinedText, "study")) {return "Study chairs";}
      if (
        hasToken(combinedText, "fabric") ||
        hasToken(combinedText, "upholster") ||
        hasToken(combinedText, "visitor chair") ||
        hasToken(combinedText, "polyester") ||
        hasToken(combinedText, "foam seat")
      ) {
        return "Fabric chairs";
      }
      if (
        hasToken(combinedText, "leather") ||
        hasToken(combinedText, "executive chair") ||
        hasToken(combinedText, "executive")
      ) {
        return "Leather chairs";
      }
      return "Fabric chairs";
    }

    if (canonicalCategoryId === "workstations") {
      if (hasToken(combinedText, "height adjustable") || hasToken(combinedText, "height-adjustable")) {
        return "Height Adjustable Series";
      }
      if (hasToken(combinedText, "panel")) {return "Panel Series";}
      return "Desking Series";
    }

    if (canonicalCategoryId === "tables") {
      if (hasToken(combinedText, "meeting") || hasToken(combinedText, "conference")) {return "Meeting Tables";}
      if (hasToken(combinedText, "cafe")) {return "Cafe Tables";}
      if (hasToken(combinedText, "training")) {return "Training Tables";}
      return "Cabin Tables";
    }

    if (canonicalCategoryId === "storages") {
      if (hasToken(combinedText, "locker")) {return "Locker";}
      if (hasToken(combinedText, "compactor")) {return "Compactor Storage";}
      if (hasToken(combinedText, "metal")) {return "Metal Storage";}
      return "Prelam Storage";
    }

    if (canonicalCategoryId === "soft-seating") {
      if (hasToken(combinedText, "sofa")) {return "Sofa";}
      if (hasToken(combinedText, "collaborative") || hasToken(combinedText, "pod")) {return "Collaborative";}
      if (
        hasToken(combinedText, "occasional table") ||
        hasToken(combinedText, "coffee table") ||
        hasToken(combinedText, "side table")
      ) {
        return "Occasional Tables";
      }
      if (hasToken(combinedText, "pouffee") || hasToken(combinedText, "pouf") || hasToken(combinedText, "ottoman")) {
        return "Pouffee";
      }
      return "Lounge";
    }

    if (hasToken(combinedText, "library")) {return "Library";}
    if (hasToken(combinedText, "hostel")) {return "Hostel";}
    if (hasToken(combinedText, "auditorium")) {return "Auditorium";}
    return "Classroom";
  })();

  return {
    id: getCanonicalSubcategoryId(canonicalCategoryId, subcategoryLabel),
    label: subcategoryLabel,
  };
}

export function buildCanonicalSeriesId(
  categoryId: string,
  subcategoryId: string,
  seriesName: string,
): string {
  const canonicalCategoryId = normalizeRequestedCategoryId(categoryId) || slugifyCatalogToken(categoryId);
  const canonicalSubcategoryId = getCanonicalSubcategoryId(canonicalCategoryId, subcategoryId);
  const canonicalSeriesName = slugifyCatalogToken(seriesName || "series");
  return `${canonicalCategoryId}-${canonicalSubcategoryId}-${canonicalSeriesName}`;
}

export function buildCanonicalProductRouteSlug(
  categoryId: string,
  subcategoryId: string,
  productName: string,
): string {
  const canonicalCategoryId = normalizeRequestedCategoryId(categoryId) || slugifyCatalogToken(categoryId);
  const canonicalSubcategoryId = getCanonicalSubcategoryId(canonicalCategoryId, subcategoryId);
  const canonicalProductName = slugifyCatalogToken(productName);
  return [canonicalCategoryId, canonicalSubcategoryId, canonicalProductName]
    .filter(Boolean)
    .join("-");
}

export function classifyToRequestedCategory(
  item: ProductWithContext,
): RequestedCategoryId {
  const canonicalFromBase = normalizeRequestedCategoryId(item.baseCategoryId);
  if (canonicalFromBase) {
    return canonicalFromBase;
  }

  const text = productText(item);

  if (
    hasToken(text, "classroom") ||
    hasToken(text, "auditorium") ||
    hasToken(text, "hostel") ||
    hasToken(text, "library")
  ) {
    return "education";
  }

  if (
    hasToken(text, "compactor") ||
    hasToken(text, "metal storage") ||
    hasToken(text, "prelam") ||
    hasToken(text, "locker") ||
    hasToken(text, "pedestal") ||
    hasToken(text, "cabinet") ||
    hasToken(text, "storage") ||
    hasToken(text, "filing")
  ) {
    return "storages";
  }

  if (
    hasToken(text, "lounge") ||
    hasToken(text, "sofa") ||
    hasToken(text, "collaborative") ||
    hasToken(text, "pouffee") ||
    hasToken(text, "pouf") ||
    hasToken(text, "pod")
  ) {
    return "soft-seating";
  }

  if (
    hasToken(text, "height adjustable") ||
    hasToken(text, "height-adjustable") ||
    hasToken(text, "panel series") ||
    hasToken(text, "desking series") ||
    hasToken(text, "workstation") ||
    hasToken(text, "deskpro") ||
    hasToken(text, "fenix")
  ) {
    return "workstations";
  }

  if (
    hasToken(text, "cabin table") ||
    hasToken(text, "meeting table") ||
    hasToken(text, "training table") ||
    hasToken(text, "cafe table") ||
    hasToken(text, "conference table") ||
    hasToken(text, "table")
  ) {
    return "tables";
  }

  if (
    hasToken(text, "leather chair") ||
    hasToken(text, "mesh chair") ||
    hasToken(text, "training chair") ||
    hasToken(text, "cafe chair") ||
    hasToken(text, "chair")
  ) {
    return "seating";
  }

  return "seating";
}

function productSpecContext(product: CompatProduct): string {
  const specs =
    product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
      ? (product.specs as Record<string, unknown>)
      : {};
  const materials = Array.isArray(specs.materials)
    ? specs.materials.map((entry) => String(entry)).join(" ")
    : "";
  const features = Array.isArray(specs.features)
    ? specs.features.map((entry) => String(entry)).join(" ")
    : "";
  return `${materials} ${features}`.trim();
}

function classifyToRequestedSubcategoryInternal(
  categoryId: RequestedCategoryId,
  item: ProductWithContext,
): string {
  const specContext = productSpecContext(item.product);
  return resolveCanonicalSubcategory(categoryId, {
    subcategory: item.product.metadata?.subcategory || "",
    subcategoryId: item.product.metadata?.subcategoryId || "",
    productName: item.product.name,
    productSlug: item.product.slug || "",
    description: [item.product.description || "", specContext].filter(Boolean).join(" "),
    seriesName: item.seriesName,
  }).label;
}

export function classifyToRequestedSubcategory(
  categoryId: RequestedCategoryId,
  item: {
    product: CompatProduct;
    baseCategoryId: string;
    seriesName: string;
  },
): string {
  return classifyToRequestedSubcategoryInternal(categoryId, {
    product: item.product,
    baseCategoryId: item.baseCategoryId,
    seriesName: item.seriesName,
  });
}

export function getCatalogCategoryLabel(categoryId: string, fallback: string): string {
  return Catalog_CATEGORY_LABELS[categoryId as RequestedCategoryId] || fallback;
}

export function getCatalogCategoryDescription(
  categoryId: string,
  fallback: string,
): string {
  return Catalog_CATEGORY_DESCRIPTIONS[categoryId as RequestedCategoryId] || fallback;
}

export function getCatalogCategoryHref(categoryId: string): string {
  return `/products/${categoryId}`;
}

export function getRequestedCategoryRouteSegment(categoryId: string): string {
  const canonical = normalizeRequestedCategoryId(categoryId);
  if (canonical) {return canonical;}

  if (categoryId.startsWith("oando-")) {
    return slugifyCatalogToken(categoryId.slice("oando-".length)) || "products";
  }

  return "products";
}

export function getCatalogProductHref(categoryId: string, productUrlKey: string): string {
  const routeCategory = getRequestedCategoryRouteSegment(categoryId);
  const routeKey = String(productUrlKey || "").trim();
  if (!routeKey) {return `/products/${routeCategory}`;}
  return `/products/${routeCategory}/${routeKey}`;
}

export function buildCatalogCategoryNav(categoryIds: readonly string[]) {
  return categoryIds.map((id) => ({
    id,
    label: getCatalogCategoryLabel(id, id),
    href: getCatalogCategoryHref(id),
  }));
}

export function buildRequestedCategoryCatalog(
  baseCatalog: CompatCategory[],
): CompatCategory[] {
  const flat: ProductWithContext[] = [];
  for (const category of baseCatalog) {
    for (const series of category.series) {
      for (const product of series.products) {
        flat.push({
          product,
          baseCategoryId: category.id,
          seriesName: series.name,
        });
      }
    }
  }

  const buckets = new Map<RequestedCategoryId, ProductWithContext[]>();
  for (const id of Catalog_CATEGORY_ORDER) {buckets.set(id, []);}
  for (const item of flat) {
    if (
      !isPublishableCatalogProduct({
        slug: item.product.slug,
        name: item.product.name,
        baseCategoryId: item.baseCategoryId,
        category_id: item.product.metadata?.category,
        flagshipImage: item.product.flagshipImage,
        images: item.product.images,
      })
    ) {
      continue;
    }
    const bucketId = classifyToRequestedCategory(item);
    (buckets.get(bucketId) as ProductWithContext[]).push(item);
  }

  return Catalog_CATEGORY_ORDER.map((id) => {
    const products = buckets.get(id) || [];
    const seriesMap = new Map<string, CompatProduct[]>();
    for (const item of products) {
      const key =
        id === "seating"
          ? "Seating Series"
          : item.seriesName || "Series";
      if (!seriesMap.has(key)) {seriesMap.set(key, []);}
      const canonicalSubcategory = classifyToRequestedSubcategoryInternal(id, item);
      const canonicalSubcategoryId = getCanonicalSubcategoryId(id, canonicalSubcategory);
      (seriesMap.get(key) as CompatProduct[]).push({
        ...item.product,
        metadata: {
          ...item.product.metadata,
          categoryIdCanonical: id,
          category: Catalog_CATEGORY_LABELS[id],
          subcategory: canonicalSubcategory,
          subcategoryId: canonicalSubcategoryId,
          subcategoryLabel: canonicalSubcategory,
          canonicalSlugV2: buildCanonicalProductRouteSlug(
            id,
            canonicalSubcategoryId,
            item.product.name,
          ),
          canonicalSeriesId: buildCanonicalSeriesId(id, canonicalSubcategoryId, key),
        },
      });
    }

    const series: CompatSeries[] = [...seriesMap.entries()]
      .map(([name, sProducts], idx) => ({
        id: `${id}-series-${idx + 1}`,
        name,
        description: `${Catalog_CATEGORY_LABELS[id]} series`,
        products: sProducts.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      id,
      name: Catalog_CATEGORY_LABELS[id],
      description: Catalog_CATEGORY_DESCRIPTIONS[id],
      series,
    };
  });
}
