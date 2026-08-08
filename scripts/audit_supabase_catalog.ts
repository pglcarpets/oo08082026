import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { REPO_ROOT } from "./lib/repoRoot";

type TableName =
  | "categories"
  | "products"
  | "product_specs"
  | "product_images"
  | "product_slug_aliases"
  | "business_stats_current"
  | "catalog_categories"
  | "catalog_products"
  | "catalog_product_specs"
  | "catalog_product_images"
  | "catalog_product_slug_aliases";

type TableProbe = {
  table: TableName;
  exists: boolean;
  rowCount: number | null;
  error: string | null;
};

type ProductRow = {
  id: string;
  slug: string | null;
  name: string | null;
  category_id: string | null;
  normalized_name_key?: string | null;
  metadata?: Record<string, unknown> | null;
  flagship_image?: string | null;
  alt_text?: string | null;
};

type AliasRow = {
  id?: string | number | null;
  alias_slug: string | null;
  canonical_slug: string | null;
  is_active?: boolean | null;
};

type StatsRow = {
  id: string;
  is_active: boolean;
  as_of_date: string;
};

type AuditSummary = {
  generatedAt: string;
  supabaseHost: string;
  tables: TableProbe[];
  runtimeQueries: Array<{
    label: string;
    ok: boolean;
    detail: string;
  }>;
  dataQuality: {
    productCount: number;
    categoryCount: number;
    blankSlugs: number;
    duplicateSlugs: Array<{ slug: string; count: number }>;
    missingCategoryIds: number;
    missingSubcategorySlug: number;
    missingAltText: number;
    missingPrimaryImage: number;
    duplicateNameKeysByCategory: Array<{
      category_id: string;
      normalized_name_key: string;
      count: number;
      slugs: string[];
    }>;
    aliasCount: number;
    blankAliasRows: number;
    selfAliasRows: number;
    missingBusinessStatsRows: number;
    activeBusinessStatsRows: number;
  };
};

const TABLES: TableName[] = [
  "categories",
  "products",
  "product_specs",
  "product_images",
  "product_slug_aliases",
  "business_stats_current",
  "catalog_categories",
  "catalog_products",
  "catalog_product_specs",
  "catalog_product_images",
  "catalog_product_slug_aliases",
];

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function summarizeError(error: unknown): string {
  if (!error) return "unknown";
  const text =
    error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error);
  return text.replace(/\s+/g, " ").trim();
}

function createSupabaseAdminClient(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ??
    process.env.SUPABASE_URL?.trim() ??
    "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    "";
  if (!url || !key) {
    throw new Error(
      "Missing Supabase credentials. Expected NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function probeTable(client: SupabaseClient, table: TableName): Promise<TableProbe> {
  try {
    const response = await client.from(table).select("*", { count: "exact", head: true });
    if (response.error) {
      return {
        table,
        exists: false,
        rowCount: null,
        error: summarizeError(response.error.message),
      };
    }
    return {
      table,
      exists: true,
      rowCount: response.count ?? 0,
      error: null,
    };
  } catch (error) {
    return {
      table,
      exists: false,
      rowCount: null,
      error: summarizeError(error),
    };
  }
}

function stringValue(value: unknown): string {
  return String(value ?? "").trim();
}

function computeNormalizedNameKey(name: unknown): string {
  return stringValue(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function countDuplicateSlugs(products: ProductRow[]) {
  const counts = new Map<string, number>();
  for (const product of products) {
    const slug = stringValue(product.slug);
    if (!slug) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([slug, count]) => ({ slug, count }));
}

function countDuplicateNameKeys(products: ProductRow[]) {
  const grouped = new Map<string, { count: number; slugs: string[] }>();
  for (const product of products) {
    const categoryId = stringValue(product.category_id);
    const metadata = product.metadata && typeof product.metadata === "object" ? product.metadata : {};
    const key =
      stringValue((metadata as Record<string, unknown>).normalized_name_key) ||
      stringValue(product.normalized_name_key) ||
      computeNormalizedNameKey(product.name);
    if (!categoryId || !key) continue;
    const mapKey = `${categoryId}__${key}`;
    const current = grouped.get(mapKey) ?? { count: 0, slugs: [] };
    current.count += 1;
    const slug = stringValue(product.slug);
    if (slug) current.slugs.push(slug);
    grouped.set(mapKey, current);
  }
  return [...grouped.entries()]
    .filter(([, value]) => value.count > 1)
    .map(([compoundKey, value]) => {
      const [category_id, normalized_name_key] = compoundKey.split("__");
      return {
        category_id,
        normalized_name_key,
        count: value.count,
        slugs: value.slugs.sort(),
      };
    })
    .sort((a, b) => b.count - a.count || a.category_id.localeCompare(b.category_id));
}

function hasSubcategorySlug(product: ProductRow): boolean {
  const metadata = product.metadata && typeof product.metadata === "object" ? product.metadata : {};
  return Boolean(stringValue((metadata as Record<string, unknown>).subcategory_id || (metadata as Record<string, unknown>).subcategory_slug));
}

async function runRuntimeQueryAudit(client: SupabaseClient) {
  const checks: AuditSummary["runtimeQueries"] = [];

  const probes: Array<{ label: string; table: string; columns: string }> = [
    { label: "Products list", table: "products", columns: "id,slug,category_id,name" },
    { label: "Categories list", table: "categories", columns: "id,name" },
    { label: "Product specs", table: "product_specs", columns: "product_id,specs" },
    { label: "Product images", table: "product_images", columns: "product_id,image_url,image_kind" },
    { label: "Alias table", table: "product_slug_aliases", columns: "alias_slug,canonical_slug,is_active" },
    { label: "Business stats", table: "business_stats_current", columns: "id,is_active,as_of_date" },
  ];

  for (const probe of probes) {
    try {
      const response = await client.from(probe.table).select(probe.columns).limit(1);
      if (response.error) {
        checks.push({
          label: probe.label,
          ok: false,
          detail: summarizeError(response.error.message),
        });
      } else {
        checks.push({
          label: probe.label,
          ok: true,
          detail: "ok",
        });
      }
    } catch (error) {
      checks.push({
        label: probe.label,
        ok: false,
        detail: summarizeError(error),
      });
    }
  }

  return checks;
}

function renderMarkdown(summary: AuditSummary): string {
  const lines: string[] = [];
  lines.push("# Supabase Schema Audit");
  lines.push("");
  lines.push(`- Generated at: ${summary.generatedAt}`);
  lines.push(`- Supabase host: ${summary.supabaseHost}`);
  lines.push("");
  lines.push("## Table Probes");
  for (const table of summary.tables) {
    lines.push(
      `- ${table.table}: ${table.exists ? "present" : "missing"}${table.rowCount !== null ? `, rows=${table.rowCount}` : ""}${table.error ? `, error=${table.error}` : ""}`,
    );
  }
  lines.push("");
  lines.push("## Runtime Query Checks");
  for (const check of summary.runtimeQueries) {
    lines.push(`- ${check.label}: ${check.ok ? "ok" : "fail"}${check.detail ? ` (${check.detail})` : ""}`);
  }
  lines.push("");
  lines.push("## Data Quality Summary");
  lines.push(`- products: ${summary.dataQuality.productCount}`);
  lines.push(`- categories: ${summary.dataQuality.categoryCount}`);
  lines.push(`- blank slugs: ${summary.dataQuality.blankSlugs}`);
  lines.push(`- duplicate slugs: ${summary.dataQuality.duplicateSlugs.length}`);
  lines.push(`- missing category IDs: ${summary.dataQuality.missingCategoryIds}`);
  lines.push(`- missing subcategory slug/id: ${summary.dataQuality.missingSubcategorySlug}`);
  lines.push(`- missing alt text: ${summary.dataQuality.missingAltText}`);
  lines.push(`- missing primary image: ${summary.dataQuality.missingPrimaryImage}`);
  lines.push(`- duplicate normalized name keys by category: ${summary.dataQuality.duplicateNameKeysByCategory.length}`);
  lines.push(`- alias rows: ${summary.dataQuality.aliasCount}`);
  lines.push(`- blank alias rows: ${summary.dataQuality.blankAliasRows}`);
  lines.push(`- self alias rows: ${summary.dataQuality.selfAliasRows}`);
  lines.push(`- missing business stats rows: ${summary.dataQuality.missingBusinessStatsRows}`);
  lines.push(`- active business stats rows: ${summary.dataQuality.activeBusinessStatsRows}`);
  if (summary.dataQuality.duplicateSlugs.length > 0) {
    lines.push("");
    lines.push("## Duplicate Slugs");
    for (const item of summary.dataQuality.duplicateSlugs.slice(0, 25)) {
      lines.push(`- ${item.slug}: ${item.count}`);
    }
  }
  if (summary.dataQuality.duplicateNameKeysByCategory.length > 0) {
    lines.push("");
    lines.push("## Duplicate Name Keys By Category");
    for (const item of summary.dataQuality.duplicateNameKeysByCategory.slice(0, 25)) {
      lines.push(`- ${item.category_id} / ${item.normalized_name_key}: ${item.count} (${item.slugs.join(", ")})`);
    }
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  config({ path: ".env.local" });
  const client = createSupabaseAdminClient();
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const host = new URL(supabaseUrl).host;

  const tables = await Promise.all(TABLES.map((table) => probeTable(client, table)));
  const runtimeQueries = await runRuntimeQueryAudit(client);

  const productResponse = await client
    .from("products")
    .select("id,slug,name,category_id,metadata,flagship_image,alt_text")
    .order("category_id", { ascending: true })
    .order("name", { ascending: true });
  if (productResponse.error) {
    throw new Error(`Failed reading products: ${summarizeError(productResponse.error.message)}`);
  }
  const products = (productResponse.data ?? []) as ProductRow[];

  const categoryResponse = await client.from("categories").select("id", { count: "exact", head: true });
  const aliasResponse = await client
    .from("product_slug_aliases")
    .select("id,alias_slug,canonical_slug,is_active");
  if (aliasResponse.error) {
    throw new Error(`Failed reading aliases: ${summarizeError(aliasResponse.error.message)}`);
  }
  const aliases = (aliasResponse.data ?? []) as AliasRow[];

  const statsResponse = await client.from("business_stats_current").select("id,is_active,as_of_date");
  if (statsResponse.error) {
    throw new Error(`Failed reading business stats: ${summarizeError(statsResponse.error.message)}`);
  }
  const statsRows = (statsResponse.data ?? []) as StatsRow[];

  const summary: AuditSummary = {
    generatedAt: new Date().toISOString(),
    supabaseHost: host,
    tables,
    runtimeQueries,
    dataQuality: {
      productCount: products.length,
      categoryCount: categoryResponse.count ?? 0,
      blankSlugs: products.filter((product) => !stringValue(product.slug)).length,
      duplicateSlugs: countDuplicateSlugs(products),
      missingCategoryIds: products.filter((product) => !stringValue(product.category_id)).length,
      missingSubcategorySlug: products.filter((product) => !hasSubcategorySlug(product)).length,
      missingAltText: products.filter((product) => !stringValue(product.alt_text)).length,
      missingPrimaryImage: products.filter((product) => !stringValue(product.flagship_image)).length,
      duplicateNameKeysByCategory: countDuplicateNameKeys(products),
      aliasCount: aliases.length,
      blankAliasRows: aliases.filter((row) => !stringValue(row.alias_slug) || !stringValue(row.canonical_slug)).length,
      selfAliasRows: aliases.filter(
        (row) => stringValue(row.alias_slug) && stringValue(row.alias_slug) === stringValue(row.canonical_slug),
      ).length,
      missingBusinessStatsRows: statsRows.length === 0 ? 1 : 0,
      activeBusinessStatsRows: statsRows.filter((row) => Boolean(row.is_active)).length,
    },
  };

  const auditsDir = path.join(REPO_ROOT, "results", "audits");
  fs.mkdirSync(auditsDir, { recursive: true });

  const schemaJsonPath = path.join(auditsDir, "supabase-schema-audit.json");
  const schemaMdPath = path.join(auditsDir, "supabase-schema-audit.md");
  const qualityJsonPath = path.join(auditsDir, "supabase-data-quality-audit.json");
  const runtimeMdPath = path.join(auditsDir, "supabase-runtime-query-audit.md");

  fs.writeFileSync(schemaJsonPath, JSON.stringify(summary, null, 2), "utf8");
  fs.writeFileSync(schemaMdPath, renderMarkdown(summary), "utf8");
  fs.writeFileSync(qualityJsonPath, JSON.stringify(summary.dataQuality, null, 2), "utf8");
  fs.writeFileSync(
    runtimeMdPath,
    [
      "# Supabase Runtime Query Audit",
      "",
      "*Redirect — runtime checks are included in [`supabase-schema-audit.md`](supabase-schema-audit.md) § Runtime Query Checks.*",
      "",
      `- Generated at: ${summary.generatedAt}`,
      "",
      "Do not extend this file; edit `scripts/audit_supabase_catalog.ts` if probes change.",
      "",
    ].join("\n"),
    "utf8",
  );

  console.log(`[audit:supabase] wrote ${path.relative(process.cwd(), schemaMdPath)}`);
  console.log(`[audit:supabase] products=${summary.dataQuality.productCount} blankSlugs=${summary.dataQuality.blankSlugs} duplicateSlugs=${summary.dataQuality.duplicateSlugs.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
