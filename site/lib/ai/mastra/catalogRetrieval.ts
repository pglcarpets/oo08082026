import "server-only";

/**
 * Catalog retrieval for the AI advisor prompt.
 *
 * The advisor used to ground the model on `products.slice(0, 80)` — the first
 * N rows in catalog order, unrelated to the question. This module puts the
 * retrieval stack the program keeps (lock L8: Mastra / LanceDB / Orama) in
 * front of that prompt:
 *
 * 1. **LanceDB vector recall** via `searchCatalogVectors` (Mastra RAG). Active
 *    only when an embedding provider key is configured; returns `[]` otherwise.
 * 2. **Orama lexical search** over the live product rows — always available,
 *    no network, no key.
 * 3. **Catalog order** as the tail filler so the prompt is never short.
 *
 * Every layer is fail-open: any retrieval error degrades to plain catalog
 * order, so the advisor answers with the same coverage it had before.
 */

import {
  createCatalogSearchIndex,
  searchCatalogDocuments,
  type CatalogSearchDocument,
} from "./catalogLocalSearch";
import { searchCatalogVectors } from "./catalogRag";

/** Minimal product shape the retrieval layer reads (subset of catalog `Product`). */
export interface RetrievableProduct {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly category_id?: string;
  readonly description?: string | null;
  readonly series_name?: string | null;
  readonly series?: string | null;
  readonly metadata?: {
    readonly tags?: readonly string[];
    readonly subcategory?: string;
  } | null;
}

export interface CatalogRetrievalResult<T extends RetrievableProduct> {
  readonly products: readonly T[];
  /** Which layers actually contributed, in order of contribution. */
  readonly sources: readonly ("vector" | "lexical" | "catalog-order")[];
}

const VECTOR_PRODUCT_ID_PREFIX = "product:";

function toSearchDocument(product: RetrievableProduct): CatalogSearchDocument {
  return {
    id: product.slug,
    title: product.name,
    keywords: [
      product.slug,
      product.category_id ?? "",
      product.series_name ?? "",
      product.series ?? "",
      product.metadata?.subcategory ?? "",
      ...(product.metadata?.tags ?? []),
      product.description ?? "",
    ]
      .filter((part) => part.length > 0)
      .join(" "),
  };
}

/** Product ids named by LanceDB hits, in score order (`product:{id}` metadata ids). */
async function recallVectorProductIds(query: string, limit: number): Promise<string[]> {
  try {
    const hits = await searchCatalogVectors(query, limit);
    return hits
      .filter((hit) => hit.id.startsWith(VECTOR_PRODUCT_ID_PREFIX))
      .map((hit) => hit.id.slice(VECTOR_PRODUCT_ID_PREFIX.length));
  } catch (error) {
    console.error("[catalog-retrieval] vector recall failed:", error);
    return [];
  }
}

/** Product slugs matched lexically by Orama, in score order. */
async function recallLexicalSlugs<T extends RetrievableProduct>(
  query: string,
  products: readonly T[],
  limit: number,
): Promise<string[]> {
  try {
    const index = createCatalogSearchIndex(products.map(toSearchDocument));
    const hits = await searchCatalogDocuments(index, query, limit);
    return hits.map((hit) => hit.document.id);
  } catch (error) {
    console.error("[catalog-retrieval] lexical recall failed:", error);
    return [];
  }
}

/**
 * Rank catalog products for an advisor query: vector recall, then lexical
 * recall, then catalog order — deduped by slug and capped at `limit`.
 */
export async function retrieveCatalogProducts<T extends RetrievableProduct>(
  query: string,
  products: readonly T[],
  limit: number,
): Promise<CatalogRetrievalResult<T>> {
  const trimmed = query.trim();
  if (products.length === 0 || limit <= 0) {
    return { products: [], sources: [] };
  }
  if (trimmed.length < 2) {
    return { products: products.slice(0, limit), sources: ["catalog-order"] };
  }

  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const byId = new Map(products.map((product) => [product.id, product]));

  const [vectorIds, lexicalSlugs] = await Promise.all([
    recallVectorProductIds(trimmed, limit),
    recallLexicalSlugs(trimmed, products, limit),
  ]);

  const picked: T[] = [];
  const seen = new Set<string>();
  const sources: ("vector" | "lexical" | "catalog-order")[] = [];

  const push = (product: T | undefined, source: "vector" | "lexical" | "catalog-order") => {
    if (!product || seen.has(product.slug) || picked.length >= limit) {
      return;
    }
    seen.add(product.slug);
    picked.push(product);
    if (!sources.includes(source)) {
      sources.push(source);
    }
  };

  for (const id of vectorIds) {
    push(byId.get(id) ?? bySlug.get(id), "vector");
  }
  for (const slug of lexicalSlugs) {
    push(bySlug.get(slug), "lexical");
  }
  for (const product of products) {
    push(product, "catalog-order");
  }

  return { products: picked, sources };
}
