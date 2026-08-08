import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth } from "@/features/shared/api/withAuth";
import { validationError } from "@/features/shared/api/apiResponse";
import { FilterRankSchema } from "@/features/shared/api/schemas";
import { getProducts } from "@/lib/catalog/site/getProducts";
import type { Product } from "@/lib/catalog/types";
import { requestAdvisorText, resolveAdvisorModelChain } from "@/lib/ai/mastra";

type RankMode = "sustainability" | "price" | "material" | "ergonomic";

interface ProductInput {
  id: string;
  name: string;
  description?: string;
  sustainabilityScore?: number;
  priceRange?: string;
  material?: string[];
  bifmaCertified?: boolean;
  isHeightAdjustable?: boolean;
  hasHeadrest?: boolean;
}

const RANK_PROMPTS: Record<RankMode, string> = {
  sustainability:
    "Rank these products from highest to lowest sustainability. Prioritise eco-friendly materials, recycled content, and high eco scores. Return JSON object: {\"ids\": [\"id1\",\"id2\",...]}",
  price:
    "Rank these products from lowest to highest price tier (budget < mid < premium < luxury). Return JSON object: {\"ids\": [\"id1\",\"id2\",...]}",
  material:
    "Rank these products prioritising recycled and sustainable materials first. Return JSON object: {\"ids\": [\"id1\",\"id2\",...]}",
  ergonomic:
    "Rank these products from most to least ergonomic, prioritising BIFMA certification, height-adjustability, and headrest support. Return JSON object: {\"ids\": [\"id1\",\"id2\",...]}",
};

function stripHtml(value: string | undefined): string | undefined {
  if (!value) {return undefined;}
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 240);
}

function toProductInput(product: Product): ProductInput {
  const metadata = product.metadata;
  return {
    id: product.id,
    name: product.name.slice(0, 160),
    description: stripHtml(product.description),
    sustainabilityScore:
      metadata?.sustainabilityScore ?? product.specs?.sustainability_score,
    priceRange: metadata?.priceRange,
    material: metadata?.material,
    bifmaCertified: metadata?.bifmaCertified,
    isHeightAdjustable: metadata?.isHeightAdjustable,
    hasHeadrest: metadata?.hasHeadrest,
  };
}

async function resolveProductsByIds(productIds: string[]): Promise<ProductInput[]> {
  const catalog = await getProducts();
  const byKey = new Map<string, Product>();
  for (const product of catalog) {
    byKey.set(product.id, product);
    byKey.set(product.slug, product);
  }

  const resolved: ProductInput[] = [];
  for (const productId of productIds) {
    const product = byKey.get(productId);
    if (product) {resolved.push(toProductInput(product));}
  }
  return resolved;
}

function fallbackSort(products: ProductInput[], rankBy: RankMode): string[] {
  const sorted = [...products];
  if (rankBy === "sustainability") {
    sorted.sort(
      (a, b) => (b.sustainabilityScore || 0) - (a.sustainabilityScore || 0),
    );
  } else if (rankBy === "price") {
    const order: Record<string, number> = {
      budget: 0,
      mid: 1,
      premium: 2,
      luxury: 3,
    };
    sorted.sort(
      (a, b) =>
        (order[a.priceRange || "mid"] ?? 1) -
        (order[b.priceRange || "mid"] ?? 1),
    );
  } else if (rankBy === "material") {
    sorted.sort((a, b) => {
      const aScore = a.material?.some((m) =>
        m.toLowerCase().includes("recycled"),
      )
        ? 1
        : 0;
      const bScore = b.material?.some((m) =>
        m.toLowerCase().includes("recycled"),
      )
        ? 1
        : 0;
      return bScore - aScore;
    });
  } else if (rankBy === "ergonomic") {
    sorted.sort((a, b) => {
      const score = (p: ProductInput) =>
        (p.bifmaCertified ? 3 : 0) +
        (p.isHeightAdjustable ? 2 : 0) +
        (p.hasHeadrest ? 1 : 0);
      return score(b) - score(a);
    });
  }
  return sorted.map((p) => p.id);
}

async function handleFilterRank(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.json().catch(() => null);
  const parsed = FilterRankSchema.safeParse(rawBody);
  if (!parsed.success) {return validationError(parsed.error.issues);}

  const { productIds, category, rankBy } = parsed.data;
  const products = await resolveProductsByIds(productIds);
  if (products.length === 0) {
    return NextResponse.json(
      { error: "No matching catalog products for the supplied productIds" },
      { status: 400 },
    );
  }

  const chain = resolveAdvisorModelChain();
  if (chain.length === 0) {
    return NextResponse.json({
      rankedIds: fallbackSort(products, rankBy),
      source: "fallback",
    });
  }

  const subset = products.slice(0, 40);
  const productList = subset
    .map((p) => {
      const meta = [
        p.sustainabilityScore !== null && p.sustainabilityScore !== undefined
          ? `eco:${p.sustainabilityScore}`
          : null,
        p.priceRange ? `price:${p.priceRange}` : null,
        p.material?.length ? `mat:${p.material.join(",")}` : null,
        p.bifmaCertified ? "BIFMA" : null,
        p.isHeightAdjustable ? "height-adj" : null,
        p.hasHeadrest ? "headrest" : null,
      ]
        .filter(Boolean)
        .join("; ");
      return `[${p.id}] ${p.name}${meta ? ` (${meta})` : ""}`;
    })
    .join("\n");

  const prompt = [
    category ? `Category: ${category}` : null,
    RANK_PROMPTS[rankBy],
    "Products to rank:",
    productList,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const raw = await requestAdvisorText(chain[0], RANK_PROMPTS[rankBy], prompt, {
      jsonMode: true,
      temperature: 0,
    });

    const body = JSON.parse(raw) as Record<string, unknown>;
    const ids = Array.isArray(body.ids) ? (body.ids as string[]) : null;

    if (!ids) {
      return NextResponse.json({
        rankedIds: fallbackSort(subset, rankBy),
        source: "fallback",
      });
    }

    const ranked = ids.filter((id) => subset.some((p) => p.id === id));
    const rankedSet = new Set(ranked);
    const rest = subset.filter((p) => !rankedSet.has(p.id)).map((p) => p.id);

    return NextResponse.json({
      rankedIds: [...ranked, ...rest],
      source: "ai",
    });
  } catch {
    return NextResponse.json({
      rankedIds: fallbackSort(subset, rankBy),
      source: "fallback",
    });
  }
}

export const POST = withAuth(
  async (req) => handleFilterRank(req as NextRequest),
  {
    role: "member",
    rateLimitScope: "filter",
    rateLimit: 12,
    requireCsrf: true,
  },
);
