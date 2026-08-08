import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import type {
  CompatCategory,
  CompatProduct,
  CompatSeries,
  Product,
  ProductDetailedInfo,
  ProductMetadata,
  ProductVariant,
} from "@/lib/catalog/site/getProducts";
import {
  auditCompatProduct,
  collectProductDocuments,
  collectProductImages,
} from "@/lib/catalog/site/specSchema";

config({ path: resolve(process.cwd(), ".env.local") });

type AuditRow = {
  categoryId: string;
  seriesId: string;
  seriesName: string;
  productId: string;
  productName: string;
  slug: string;
  severity: string;
  issueCode: string;
  issueMessage: string;
  imageCount: number;
};

type CategoryRow = {
  id: string;
  name: string;
};

function createSupabaseAdminClient() {
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

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter((text) => text.length > 0);
}

function toCompatProduct(product: Product): CompatProduct {
  const specsObject =
    product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
      ? (product.specs as Record<string, unknown>)
      : {};
  const specsDimensions =
    typeof specsObject.dimensions === "string" ? specsObject.dimensions.trim() : "";
  const specsMaterials = Array.isArray(specsObject.materials)
    ? specsObject.materials.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const specsFeatures = Array.isArray(specsObject.features)
    ? specsObject.features.map((item) => String(item).trim()).filter(Boolean)
    : [];

  const baseProduct: CompatProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description || "",
    flagshipImage: product.flagship_image || "",
    // shape cast for legacy/row fields not on CompatProduct; reason: db row has snake_case extras (scene_images, variants); owner: Resolve Failures Agent (PLAN-FAIL-0411); removal: when CompatProduct or audit input includes them or mapper used
    sceneImages: toStringArray((product as { scene_images?: unknown }).scene_images),
    variants: Array.isArray((product as { variants?: unknown }).variants) ? ((product as { variants?: unknown }).variants as ProductVariant[]) : [],
    detailedInfo: {
      overview: product.description || "",
      features: specsFeatures,
      dimensions: specsDimensions,
      materials: specsMaterials,
    } satisfies ProductDetailedInfo,
    metadata: {
      ...product.metadata,
      sustainabilityScore:
        product.metadata?.sustainabilityScore ?? product.specs?.sustainability_score,
    } satisfies ProductMetadata,
    "3d_model": product["3d_model"],
    threeDModelUrl: product["3d_model"],
    technicalDrawings: [],
    documents: [],
    images: Array.isArray(product.images) ? product.images : [],
    altText:
      product.alt_text ||
      product.metadata?.ai_alt_text ||
      product.metadata?.aiAltText ||
      `${product.name} product image`,
    specs: specsObject,
  };

  const documents = collectProductDocuments(baseProduct);

  return {
    ...baseProduct,
    technicalDrawings: documents,
    documents,
  };
}

async function getCompatCatalog(): Promise<CompatCategory[]> {
  const supabase = createSupabaseAdminClient();
  const [categoriesResponse, productsResponse] = await Promise.all([
    supabase.from("categories").select("id,name"),
    supabase.from("products").select("*").order("name", { ascending: true }),
  ]);

  if (categoriesResponse.error) {
    throw new Error(`Failed fetching categories: ${categoriesResponse.error.message}`);
  }
  if (productsResponse.error) {
    throw new Error(`Failed fetching products: ${productsResponse.error.message}`);
  }

  const categories = (categoriesResponse.data ?? []) as CategoryRow[];
  const products = (productsResponse.data ?? []) as Product[];

  const categoryMap = new Map<string, { info: CategoryRow; products: Product[] }>();
  for (const category of categories) {
    categoryMap.set(category.id, { info: category, products: [] });
  }

  for (const product of products) {
    const categoryId = product.category_id;
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        info: { id: categoryId, name: categoryId },
        products: [],
      });
    }
    categoryMap.get(categoryId)?.products.push(product);
  }

  const result: CompatCategory[] = [];

  for (const [categoryId, categoryData] of categoryMap) {
    if (categoryData.products.length === 0) continue;

    const seriesMap = new Map<string, Product[]>();
    for (const product of categoryData.products) {
      const seriesId = product.series_id || `${categoryId}-series`;
      if (!seriesMap.has(seriesId)) seriesMap.set(seriesId, []);
      seriesMap.get(seriesId)?.push(product);
    }

    const series: CompatSeries[] = [];
    for (const [seriesId, seriesProducts] of seriesMap) {
      series.push({
        id: seriesId,
        name: seriesProducts[0]?.series_name || "Series",
        description: `Premium ${categoryData.info.name.toLowerCase()} solutions`,
        products: seriesProducts.map(toCompatProduct),
      });
    }

    result.push({
      id: categoryId,
      name: categoryData.info.name,
      description: `Professional furniture systems for ${categoryData.info.name.toLowerCase()}`,
      series,
    });
  }

  return result;
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

async function main() {
  const catalog = await getCompatCatalog();
  const rows: AuditRow[] = [];
  const issueCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  let productCount = 0;
  const debugSlug = process.env.AUDIT_DEBUG_SLUG?.trim();

  for (const category of catalog) {
    for (const series of category.series) {
      for (const product of series.products) {
        productCount += 1;
        categoryCounts.set(category.id, (categoryCounts.get(category.id) || 0) + 1);
        if (debugSlug && product.slug === debugSlug) {
          console.log(
            JSON.stringify(
              {
                debugSlug,
                categoryId: category.id,
                flagshipImage: product.flagshipImage,
                images: product.images,
                collectedImages: collectProductImages(product as CompatProduct),
                metadata: product.metadata,
              },
              null,
              2,
            ),
          );
        }
        const issues = auditCompatProduct(category.id, product as CompatProduct);
        for (const issue of issues) {
          rows.push({
            categoryId: category.id,
            seriesId: series.id,
            seriesName: series.name,
            productId: product.id,
            productName: product.name,
            slug: product.slug || "",
            severity: issue.severity,
            issueCode: issue.code,
            issueMessage: issue.message,
            imageCount: collectProductImages(product as CompatProduct).length,
          });
          issueCounts.set(issue.code, (issueCounts.get(issue.code) || 0) + 1);
        }
      }
    }
  }

  const summary = {
    auditedAt: new Date().toISOString(),
    productsAudited: productCount,
    issueRows: rows.length,
    categories: Array.from(categoryCounts.entries())
      .map(([categoryId, count]) => ({ categoryId, count }))
      .sort((a, b) => a.categoryId.localeCompare(b.categoryId)),
    issues: Array.from(issueCounts.entries())
      .map(([issueCode, count]) => ({ issueCode, count }))
      .sort((a, b) => b.count - a.count),
  };

  const outDir = resolve(process.cwd(), "docs", "audit");
  mkdirSync(outDir, { recursive: true });

  const csv = [
    [
      "categoryId",
      "seriesId",
      "seriesName",
      "productId",
      "productName",
      "slug",
      "severity",
      "issueCode",
      "issueMessage",
      "imageCount",
    ].join(","),
    ...rows.map((row) =>
      [
        row.categoryId,
        row.seriesId,
        row.seriesName,
        row.productId,
        row.productName,
        row.slug,
        row.severity,
        row.issueCode,
        row.issueMessage,
        row.imageCount,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n");

  const markdown = [
    "# Product Quality Audit",
    "",
    `- Audited at: ${summary.auditedAt}`,
    `- Products audited: ${summary.productsAudited}`,
    `- Total issue rows: ${summary.issueRows}`,
    "",
    "## Issues by type",
    ...summary.issues.map((issue) => `- ${issue.issueCode}: ${issue.count}`),
    "",
    "## Products by category",
    ...summary.categories.map((entry) => `- ${entry.categoryId}: ${entry.count}`),
    "",
    "## First 40 issue rows",
    ...rows
      .slice(0, 40)
      .map(
        (row) =>
          `- ${row.categoryId}/${row.slug || row.productId}: ${row.issueCode} (${row.severity})`,
      ),
    "",
  ].join("\n");

  writeFileSync(resolve(outDir, "product-quality-audit.csv"), csv, "utf8");
  writeFileSync(
    resolve(outDir, "product-quality-audit.json"),
    JSON.stringify({ summary, rows }, null, 2),
    "utf8",
  );
  writeFileSync(resolve(outDir, "product-quality-audit.md"), markdown, "utf8");

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
