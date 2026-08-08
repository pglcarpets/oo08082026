import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  buildCanonicalProductRouteSlug,
  buildCanonicalSeriesId,
  getCanonicalCategoryId,
  resolveCanonicalSubcategory,
} from "@/lib/catalog/site/categories";
import { REPO_ROOT } from "./lib/repoRoot";

type ProductRow = {
  id: string;
  slug: string | null;
  name: string | null;
  category_id: string | null;
  series_name: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
};

type AliasRow = {
  alias_slug: string | null;
  canonical_slug: string | null;
};

type IntegritySummary = {
  generatedAt: string;
  totals: {
    products: number;
    missingCanonicalCategoryId: number;
    missingCanonicalSubcategoryId: number;
    missingCanonicalSlugV2: number;
    missingCanonicalSeriesId: number;
    aliasCoverageMissing: number;
    canonicalSlugConflicts: number;
  };
  missingCanonicalFields: Array<{
    slug: string;
    name: string;
    missing: string[];
  }>;
  aliasCoverageMissing: Array<{
    currentSlug: string;
    expectedCanonicalSlug: string;
  }>;
  canonicalConflicts: Array<{
    canonicalSlug: string;
    legacySlugs: string[];
  }>;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

async function main() {
  config({ path: ".env.local" });

  const supabase = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    },
  );

  const [{ data: products, error: productError }, { data: aliases, error: aliasError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id,slug,name,category_id,series_name,description,metadata")
        .order("category_id", { ascending: true })
        .order("name", { ascending: true }),
      supabase.from("product_slug_aliases").select("alias_slug,canonical_slug"),
    ]);

  if (productError) throw new Error(productError.message);
  if (aliasError) throw new Error(aliasError.message);

  const aliasLookup = new Map<string, string>();
  for (const row of (aliases ?? []) as AliasRow[]) {
    const aliasSlug = text(row.alias_slug);
    if (aliasSlug) aliasLookup.set(aliasSlug, text(row.canonical_slug));
  }

  const missingCanonicalFields: IntegritySummary["missingCanonicalFields"] = [];
  const aliasCoverageMissing: IntegritySummary["aliasCoverageMissing"] = [];
  const canonicalConflictMap = new Map<string, Set<string>>();
  const aliasCoverageSeen = new Set<string>();

  for (const row of (products ?? []) as ProductRow[]) {
    const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
    const metadataRecord = metadata as Record<string, unknown>;
    const canonicalCategoryId =
      text(metadataRecord.categoryIdCanonical) ||
      getCanonicalCategoryId(text(row.category_id));
    const canonicalSubcategory = resolveCanonicalSubcategory(canonicalCategoryId, {
      subcategory: text(
        metadataRecord.subcategoryId ||
          metadataRecord.subcategoryLabel ||
          metadataRecord.subcategory,
      ),
      productName: text(row.name),
      description: text(row.description),
      seriesName: text(row.series_name || metadataRecord.seriesName),
    });
    const canonicalSlugV2 =
      text(metadataRecord.canonicalSlugV2) ||
      buildCanonicalProductRouteSlug(canonicalCategoryId, canonicalSubcategory.id, text(row.name));
    const canonicalSeriesId =
      text(metadataRecord.canonicalSeriesId) ||
      buildCanonicalSeriesId(
        canonicalCategoryId,
        canonicalSubcategory.id,
        text(row.series_name || metadataRecord.seriesName || "series"),
      );

    const missing: string[] = [];
    if (!canonicalCategoryId) missing.push("categoryIdCanonical");
    if (!canonicalSubcategory.id) missing.push("subcategoryId");
    if (!canonicalSlugV2) missing.push("canonicalSlugV2");
    if (!canonicalSeriesId) missing.push("canonicalSeriesId");

    if (missing.length > 0) {
      missingCanonicalFields.push({
        slug: text(row.slug),
        name: text(row.name),
        missing,
      });
    }

    const currentSlug = text(row.slug);
    if (currentSlug && canonicalSlugV2 && canonicalSlugV2 !== currentSlug) {
      canonicalConflictMap.set(
        canonicalSlugV2,
        new Set([...(canonicalConflictMap.get(canonicalSlugV2) ?? []), currentSlug]),
      );
      if (!aliasLookup.has(canonicalSlugV2) && !aliasCoverageSeen.has(canonicalSlugV2)) {
        aliasCoverageMissing.push({
          currentSlug,
          expectedCanonicalSlug: canonicalSlugV2,
        });
        aliasCoverageSeen.add(canonicalSlugV2);
      }
    }
  }

  const canonicalConflicts = [...canonicalConflictMap.entries()]
    .map(([canonicalSlug, legacySlugs]) => ({
      canonicalSlug,
      legacySlugs: [...legacySlugs].sort(),
    }))
    .filter((row) => row.legacySlugs.length > 1)
    .sort((left, right) => left.canonicalSlug.localeCompare(right.canonicalSlug));

  const summary: IntegritySummary = {
    generatedAt: new Date().toISOString(),
    totals: {
      products: (products ?? []).length,
      missingCanonicalCategoryId: missingCanonicalFields.filter((row) =>
        row.missing.includes("categoryIdCanonical"),
      ).length,
      missingCanonicalSubcategoryId: missingCanonicalFields.filter((row) =>
        row.missing.includes("subcategoryId"),
      ).length,
      missingCanonicalSlugV2: missingCanonicalFields.filter((row) =>
        row.missing.includes("canonicalSlugV2"),
      ).length,
      missingCanonicalSeriesId: missingCanonicalFields.filter((row) =>
        row.missing.includes("canonicalSeriesId"),
      ).length,
      aliasCoverageMissing: aliasCoverageMissing.length,
      canonicalSlugConflicts: canonicalConflicts.length,
    },
    missingCanonicalFields,
    aliasCoverageMissing,
    canonicalConflicts,
  };

  const auditsDir = path.join(REPO_ROOT, "results", "audits");
  fs.mkdirSync(auditsDir, { recursive: true });

  fs.writeFileSync(
    path.join(auditsDir, "slug-id-integrity-audit.json"),
    JSON.stringify(summary, null, 2),
    "utf8",
  );
  fs.writeFileSync(
    path.join(auditsDir, "slug-id-overhaul-baseline.md"),
    [
      "# Slug and ID Integrity Audit",
      "",
      `- Generated at: ${summary.generatedAt}`,
      `- Products audited: ${summary.totals.products}`,
      `- Missing canonical category IDs: ${summary.totals.missingCanonicalCategoryId}`,
      `- Missing canonical subcategory IDs: ${summary.totals.missingCanonicalSubcategoryId}`,
      `- Missing canonical slug v2 values: ${summary.totals.missingCanonicalSlugV2}`,
      `- Missing canonical series IDs: ${summary.totals.missingCanonicalSeriesId}`,
      `- Missing alias coverage rows: ${summary.totals.aliasCoverageMissing}`,
      `- Canonical slug conflicts: ${summary.totals.canonicalSlugConflicts}`,
      "",
      "## Canonical Slug Conflicts",
      ...canonicalConflicts.map(
        (row) => `- ${row.canonicalSlug}: ${row.legacySlugs.join(", ")}`,
      ),
      "",
      "## Alias Coverage Missing",
      ...aliasCoverageMissing.map(
        (row) => `- ${row.expectedCanonicalSlug} -> missing alias for ${row.currentSlug}`,
      ),
      "",
    ].join("\n"),
    "utf8",
  );

  console.log(
    `[audit:slug-id] products=${summary.totals.products} aliasCoverageMissing=${summary.totals.aliasCoverageMissing} canonicalConflicts=${summary.totals.canonicalSlugConflicts}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
