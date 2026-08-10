import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { getPublicApiIp } from "@/app/api/_lib/public";
import { getCatalog } from '@/lib/catalog/site/getProducts';
import { buildRequestedCategoryCatalog } from '@/lib/catalog/site/categories';
import {
  createCatalogSearchIndex,
  requestAdvisorText,
  resolveAdvisorModelChain,
  searchCatalogDocuments,
} from "@/lib/ai/mastra";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

type SearchContext = "header" | "mobile";
type SearchResultType = "product" | "category" | "page";
type SearchSource = "ai" | "local";
type SearchRankingMode = "ai" | "local" | "static-fallback";

interface SearchIndexEntry {
  id: string;
  title: string;
  href: string;
  type: SearchResultType;
  keywords: string[];
}

interface SearchResultItem {
  id: string;
  title: string;
  href: string;
  type: SearchResultType;
  source: SearchSource;
}

const STATIC_PAGES: Array<Pick<SearchIndexEntry, "id" | "title" | "href">> = [
  { id: "page:products", title: "All Products", href: "/products" },
  { id: "page:solutions", title: "Solutions", href: "/solutions" },
  { id: "page:clients", title: "Clients", href: "/clients" },
  { id: "page:trusted-by", title: "Trusted By", href: "/trusted-by/" },
  { id: "page:about", title: "About Us", href: "/about" },
  { id: "page:contact", title: "Contact", href: "/contact" },
  { id: "page:sustainability", title: "Sustainability", href: "/sustainability" },
  {
    id: "page:refund-policy",
    title: "Refund and Return Policy",
    href: "/refund-and-return-policy",
  },
  { id: "page:showrooms", title: "Showrooms", href: "/showrooms" },
];

let cache: { ts: number; entries: SearchIndexEntry[] } = {
  ts: 0,
  entries: [],
};

function sanitizeLimit(limit: number | undefined): number {
  if (!limit || Number.isNaN(limit)) {return 8;}
  return Math.min(12, Math.max(1, Math.floor(limit)));
}

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

async function buildSearchIndex(): Promise<SearchIndexEntry[]> {
  const now = Date.now();
  if (cache.entries.length > 0 && now - cache.ts < 5 * 60 * 1000) {
    return cache.entries;
  }

  const baseCatalog = await getCatalog();
  const requestedCatalog = buildRequestedCategoryCatalog(baseCatalog);
  const entries: SearchIndexEntry[] = [];

  for (const category of requestedCatalog) {
    entries.push({
      id: `category:${category.id}`,
      title: category.name,
      href: `/products/${category.id}`,
      type: "category",
      keywords: [category.description, category.id],
    });

    for (const series of category.series) {
      for (const product of series.products) {
        const slug = product.slug || product.id;
        entries.push({
          id: `product:${slug}`,
          title: product.name,
          href: `/products/${category.id}/${slug}`,
          type: "product",
          keywords: [
            category.name,
            category.id,
            series.name,
            product.description || "",
            ...(product.metadata?.tags || []),
            ...(product.metadata?.useCase || []),
            ...(product.metadata?.material || []),
          ],
        });
      }
    }
  }

  for (const page of STATIC_PAGES) {
    entries.push({
      ...page,
      type: "page",
      keywords: [page.title, page.href],
    });
  }

  cache = { ts: now, entries };
  return entries;
}

function buildFallbackIndex(): SearchIndexEntry[] {
  return STATIC_PAGES.map((page) => ({
    ...page,
    type: "page",
    keywords: [page.title, page.href],
  }));
}

async function localSearch(entries: SearchIndexEntry[], query: string, limit: number): Promise<SearchResultItem[]> {
  const trimmedQuery = normalize(query);
  if (trimmedQuery.length < 2) {return [];}

  const documents = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    keywords: [entry.title, entry.href, ...entry.keywords].join(" "),
  }));
  const db = createCatalogSearchIndex(documents);
  const hits = await searchCatalogDocuments(db, trimmedQuery, limit);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const deduped = new Set<string>();
  const ranked: SearchResultItem[] = [];

  for (const hit of hits) {
    const entry = byId.get(hit.document.id);
    if (!entry || deduped.has(entry.href)) {continue;}
    deduped.add(entry.href);
    ranked.push({
      id: entry.id,
      title: entry.title,
      href: entry.href,
      type: entry.type,
      source: "local",
    });
    if (ranked.length >= limit) {break;}
  }

  return ranked;
}

async function aiRank(
  query: string,
  context: SearchContext,
  localCandidates: SearchResultItem[],
): Promise<string[]> {
  const chain = resolveAdvisorModelChain();
  if (chain.length === 0 || localCandidates.length === 0) {return [];}

  const compact = localCandidates
    .map((item) => `- ${item.id} | ${item.title} | ${item.type} | ${item.href}`)
    .join("\n");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1200);

  try {
    const content = await requestAdvisorText(
      chain[0],
      "Rank navigation results for furniture website intent. Return strict JSON only: {\"ids\":[\"...\"]}",
      `Context: ${context}\nQuery: ${query}\nCandidates:\n${compact}`,
      { jsonMode: true, signal: controller.signal },
    );
    const parsed = JSON.parse(content) as { ids?: string[] };
    return Array.isArray(parsed.ids) ? parsed.ids : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function executeSearch(
  query: string,
  limit: number,
  context: SearchContext,
  started: number,
) {
  let indexFallbackUsed = false;
  let index: SearchIndexEntry[] = [];

  try {
    index = await buildSearchIndex();
  } catch {
    index = buildFallbackIndex();
    indexFallbackUsed = true;
  }

  const localResults = await localSearch(index, query, limit);
  let results = localResults;
  const fallbackUsed = indexFallbackUsed;
  let rankingMode: SearchRankingMode = indexFallbackUsed ? "static-fallback" : "local";

  if (
    resolveAdvisorModelChain().length > 0 &&
    localResults.length > 0
  ) {
    try {
      const rankedIds = await aiRank(query, context, localResults);
      if (rankedIds.length > 0) {
        const byId = new Map(localResults.map((item) => [item.id, item]));
        const ordered = rankedIds
          .map((id) => byId.get(id))
          .filter((item): item is SearchResultItem => Boolean(item));
        const seen = new Set(ordered.map((item) => item.id));
        const tail = localResults.filter((item) => !seen.has(item.id));
        results = [...ordered, ...tail].slice(0, limit).map((item) => ({
          ...item,
          source: "ai",
        }));
        rankingMode = "ai";
      }
    } catch {
      rankingMode = indexFallbackUsed ? "static-fallback" : "local";
    }
  }

  return {
    results,
    fallbackUsed,
    rankingMode,
    latencyMs: Date.now() - started,
  };
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  const ip = getPublicApiIp(req);
  const limitRes = await rateLimit(`nav-search:${ip}`, 20, 60000);

  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } },
    );
  }

  try {
    const body = (await req.json()) as {
      query?: string;
      limit?: number;
      context?: SearchContext;
    };

    const query = body.query?.trim() || "";
    const limit = sanitizeLimit(body.limit);
    const context: SearchContext = body.context === "mobile" ? "mobile" : "header";

    if (query.length < 2) {
      return NextResponse.json(
        {
          results: [],
          fallbackUsed: false,
          rankingMode: "local",
          latencyMs: Date.now() - started,
          error: {
            code: "QUERY_TOO_SHORT",
            message: "Query must be at least 2 characters.",
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(await executeSearch(query, limit, context, started));
  } catch {
    return NextResponse.json(
      {
        results: [],
        fallbackUsed: true,
        rankingMode: "static-fallback",
        latencyMs: Date.now() - started,
        error: {
          code: "SEARCH_FAILED",
          message: "Unable to process search request right now.",
        },
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const started = Date.now();
  const ip = getPublicApiIp(req);
  const limitRes = await rateLimit(`nav-search:${ip}`, 20, 60000);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } },
    );
  }

  try {
    const query = req.nextUrl.searchParams.get("q")?.trim() || "";
    const limit = sanitizeLimit(Number(req.nextUrl.searchParams.get("limit") || "8"));
    const contextRaw = req.nextUrl.searchParams.get("context");
    const context: SearchContext = contextRaw === "mobile" ? "mobile" : "header";

    if (query.length < 2) {
      return NextResponse.json(
        {
          results: [],
          fallbackUsed: false,
          rankingMode: "local",
          latencyMs: Date.now() - started,
          error: {
            code: "QUERY_TOO_SHORT",
            message: "Query must be at least 2 characters.",
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(await executeSearch(query, limit, context, started));
  } catch {
    return NextResponse.json(
      {
        results: [],
        fallbackUsed: true,
        rankingMode: "static-fallback",
        latencyMs: Date.now() - started,
        error: {
          code: "SEARCH_FAILED",
          message: "Unable to process search request right now.",
        },
      },
      { status: 500 },
    );
  }
}
