import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { getProducts } from '@/lib/catalog/site/getProducts';
import { getCatalogProductHref } from '@/lib/catalog/site/categories';
import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";

export const dynamic = "force-dynamic";

type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  href: string;
  image: string | null;
  priceRange: string | null;
  sustainabilityScore: number | null;
};

function clampLimit(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {return fallback;}
  return Math.min(Math.floor(parsed), max);
}

function clampOffset(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {return 0;}
  return Math.floor(parsed);
}

export async function GET(request: NextRequest) {
  const rateError = await enforcePublicApiRateLimit(request, "products:get", 40);
  if (rateError) {return rateError;}

  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get("limit"), 50, 200);
  const offset = clampOffset(url.searchParams.get("offset"));
  const category = url.searchParams.get("category")?.trim().toLowerCase() || "";

  try {
    const all = await getProducts();
    const filtered = category
      ? all.filter((product) => product.category_id === category)
      : all;

    const slice = filtered.slice(offset, offset + limit).map<ProductSummary>((product) => {
      const metadata = product.metadata || {};
      const firstImage = Array.isArray(product.images) && product.images.length > 0
        ? String(product.images[0]).trim()
        : null;
      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category_id,
        description: (product.description || "").slice(0, 240),
        href: getCatalogProductHref(product.category_id, product.slug),
        image: firstImage,
        priceRange: metadata.priceRange ?? null,
        sustainabilityScore:
          typeof metadata.sustainabilityScore === "number"
            ? metadata.sustainabilityScore
            : null,
      };
    });

    return NextResponse.json(
      {
        products: slice,
        total: filtered.length,
        offset,
        limit,
        category: category || null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[api/products] failed:", error);
    return NextResponse.json(
      {
        products: [],
        total: 0,
        offset,
        limit,
        category: category || null,
        error: "Unable to load products right now.",
      },
      { status: 500 },
    );
  }
}
