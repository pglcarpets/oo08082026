import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import {
  buildCanonicalProductRouteSlug,
  buildCanonicalSeriesId,
  normalizeRequestedCategoryId,
  resolveCanonicalSubcategory,
} from "@/lib/catalog/site/categories";
import { REPO_ROOT, SITE_PACKAGE_ROOT } from "./lib/repoRoot";

config({ path: resolve(SITE_PACKAGE_ROOT, ".env.local") });

type ProductRow = {
  id: string;
  category_id: string | null;
  name: string | null;
  slug: string | null;
  series_name: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
};

type AliasRow = {
  alias_slug: string | null;
  canonical_slug: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function main() {
  const { data, error } = await supabase
    .from("products")
    .select("id, category_id, name, slug, series_name, description, metadata")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`[products] ${error.message}`);
  }

  const products = (data ?? []) as ProductRow[];
  const updates: Array<{ id: string; metadata: Record<string, unknown> }> = [];
  const aliasCandidates: Array<{ alias_slug: string; canonical_slug: string }> = [];
  const collisions = new Map<string, string[]>();

  for (const row of products) {
    const metadata = { ...row.metadata };
    const metadataSeriesName =
      String(metadata.seriesName || metadata.series_name || metadata.series || "").trim();
    const resolvedSeriesName = String(row.series_name || metadataSeriesName || "series");
    const canonicalCategoryId =
      normalizeRequestedCategoryId(String(row.category_id || "")) ||
      String(row.category_id || "").replace(/^oando-/, "") ||
      "products";
    const canonicalSubcategory = resolveCanonicalSubcategory(canonicalCategoryId, {
      subcategory:
        String(metadata.subcategoryId || metadata.subcategoryLabel || metadata.subcategory || ""),
      productName: String(row.name || ""),
      description: String(row.description || ""),
      seriesName: resolvedSeriesName,
    });
    const canonicalSlugV2 = buildCanonicalProductRouteSlug(
      canonicalCategoryId,
      canonicalSubcategory.id,
      String(row.name || ""),
    );
    const canonicalSeriesId = buildCanonicalSeriesId(
      canonicalCategoryId,
      canonicalSubcategory.id,
      resolvedSeriesName,
    );

    updates.push({
      id: row.id,
      metadata: {
        ...metadata,
        categoryIdCanonical: canonicalCategoryId,
        subcategoryId: canonicalSubcategory.id,
        subcategoryLabel: canonicalSubcategory.label,
        canonicalSlugV2,
        canonicalSeriesId,
      },
    });

    const existingCanonical = String(row.slug || "").trim();
    if (canonicalSlugV2 && existingCanonical && canonicalSlugV2 !== existingCanonical) {
      const current = collisions.get(canonicalSlugV2) || [];
      collisions.set(canonicalSlugV2, [...current, existingCanonical]);
      aliasCandidates.push({
        alias_slug: canonicalSlugV2,
        canonical_slug: existingCanonical,
      });
    }
  }

  for (const batch of chunk(updates, 50)) {
    for (const row of batch) {
      const { error: updateError } = await supabase
        .from("products")
        .update({ metadata: row.metadata })
        .eq("id", row.id);
      if (updateError) {
        throw new Error(`[update:${row.id}] ${updateError.message}`);
      }
    }
  }

  const nonConflictingAliases = aliasCandidates.filter((row) => {
    const linked = collisions.get(row.alias_slug) || [];
    return new Set(linked).size === 1;
  });

  const candidateAliasSlugs = nonConflictingAliases.map((row) => row.alias_slug);
  const existingAliases = new Map<string, string>();

  if (candidateAliasSlugs.length > 0) {
    for (const batch of chunk(candidateAliasSlugs, 200)) {
      const { data: aliasRows, error: aliasError } = await supabase
        .from("product_slug_aliases")
        .select("alias_slug, canonical_slug")
        .in("alias_slug", batch);

      if (aliasError) {
        throw new Error(`[alias-select] ${aliasError.message}`);
      }

      for (const row of (aliasRows ?? []) as AliasRow[]) {
        if (row.alias_slug) {
          existingAliases.set(row.alias_slug, String(row.canonical_slug || ""));
        }
      }
    }
  }

  const inserts = nonConflictingAliases.filter((row) => !existingAliases.has(row.alias_slug));

  for (const batch of chunk(inserts, 200)) {
    if (batch.length === 0) continue;
    const { error: insertError } = await supabase
      .from("product_slug_aliases")
      .insert(batch);
    if (insertError) {
      throw new Error(`[alias-insert] ${insertError.message}`);
    }
  }

  const conflictSummary = Array.from(collisions.entries())
    .map(([aliasSlug, legacySlugs]) => ({
      aliasSlug,
      legacySlugs: Array.from(new Set(legacySlugs)),
    }))
    .filter((item) => item.legacySlugs.length > 1)
    .sort((left, right) => left.aliasSlug.localeCompare(right.aliasSlug));

  const reportDir = resolve(REPO_ROOT, "results", "audits");
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(
    resolve(reportDir, "canonical-metadata-backfill-report.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        productsUpdated: updates.length,
        aliasesInserted: inserts.length,
        aliasConflictsSkipped: conflictSummary,
      },
      null,
      2,
    ),
  );

  console.log(
    `[backfill] updated=${updates.length} aliasesInserted=${inserts.length} aliasConflicts=${conflictSummary.length}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
