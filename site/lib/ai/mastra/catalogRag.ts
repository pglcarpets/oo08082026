import "server-only";

import { embedV2 } from "@mastra/core/vector";
import { createVectorQueryTool } from "@mastra/rag";

import { getCatalog } from "@/lib/catalog/site/getProducts";
import {
  buildRequestedCategoryCatalog,
  getCatalogCategoryHref,
  getCatalogProductHref,
} from "@/lib/catalog/site/categories";

import {
  isVectorRecallEnabled,
  resolveMastraEmbeddingModel,
} from "./embedder";
import {
  CATALOG_VECTOR_INDEX_NAME,
  getLanceCatalogVectorStore,
} from "./lanceVectorStore";

export type CatalogVectorDocument = {
  id: string;
  title: string;
  keywords: string;
  href: string;
  type: "product" | "category" | "page";
  text: string;
};

const STATIC_PAGES: Array<Pick<CatalogVectorDocument, "id" | "title" | "href" | "type">> = [
  { id: "page:products", title: "All Products", href: "/products", type: "page" },
  { id: "page:solutions", title: "Solutions", href: "/solutions", type: "page" },
  { id: "page:clients", title: "Clients", href: "/clients", type: "page" },
  { id: "page:contact", title: "Contact", href: "/contact", type: "page" },
];

let indexPromise: Promise<void> | null = null;
let lastIndexedAt = 0;

async function embedTexts(texts: string[]): Promise<number[][]> {
  const model = resolveMastraEmbeddingModel();
  if (!model) {
    return [];
  }

  const embeddings: number[][] = [];
  for (const text of texts) {
    const { embedding } = await embedV2({
      model,
      value: text,
    });
    embeddings.push(embedding);
  }

  return embeddings;
}

async function buildCatalogVectorDocuments(): Promise<CatalogVectorDocument[]> {
  const baseCatalog = await getCatalog();
  const requestedCatalog = buildRequestedCategoryCatalog(baseCatalog);
  const documents: CatalogVectorDocument[] = [];

  for (const category of requestedCatalog) {
    documents.push({
      id: `category:${category.id}`,
      title: category.name,
      href: getCatalogCategoryHref(category.id),
      type: "category",
      keywords: [category.name, category.id].join(" "),
      text: `${category.name} ${category.id}`,
    });

    for (const series of category.series) {
      for (const product of series.products) {
        const productSlug = product.slug ?? product.id;
        documents.push({
          id: `product:${product.id}`,
          title: product.name,
          href: getCatalogProductHref(category.id, productSlug),
          type: "product",
          keywords: [product.name, productSlug, category.name, product.id].join(" "),
          text: `${product.name} ${productSlug} ${category.name}`,
        });
      }
    }
  }

  for (const page of STATIC_PAGES) {
    documents.push({
      ...page,
      keywords: page.title.toLowerCase(),
      text: page.title,
    });
  }

  return documents;
}

export async function ensureCatalogVectorIndex(force = false): Promise<void> {
  if (!isVectorRecallEnabled()) {
    return;
  }

  const now = Date.now();
  if (!force && indexPromise && now - lastIndexedAt < 5 * 60 * 1000) {
    return indexPromise;
  }

  indexPromise = (async () => {
    const documents = await buildCatalogVectorDocuments();
    if (documents.length === 0) {
      return;
    }

    const embeddings = await embedTexts(documents.map((doc) => doc.text));
    if (embeddings.length !== documents.length) {
      return;
    }

    await getLanceCatalogVectorStore().upsert({
      indexName: CATALOG_VECTOR_INDEX_NAME,
      vectors: embeddings,
      ids: documents.map((doc) => doc.id),
      metadata: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        keywords: doc.keywords,
        href: doc.href,
        type: doc.type,
        text: doc.text,
      })),
    });

    lastIndexedAt = Date.now();
  })();

  return indexPromise;
}

export function createCatalogVectorQueryTool() {
  const model = resolveMastraEmbeddingModel();
  if (!model) {
    return null;
  }

  return createVectorQueryTool({
    id: "catalog_vector_search",
    description:
      "Semantic search over the furniture catalog (products, categories, and key site pages).",
    vectorStore: getLanceCatalogVectorStore(),
    indexName: CATALOG_VECTOR_INDEX_NAME,
    model,
    includeSources: true,
  });
}

export async function searchCatalogVectors(query: string, limit = 8) {
  if (!isVectorRecallEnabled() || query.trim().length < 2) {
    return [];
  }

  await ensureCatalogVectorIndex();

  const model = resolveMastraEmbeddingModel();
  if (!model) {
    return [];
  }

  const { embedding } = await embedV2({
    model,
    value: query,
  });

  const hits = await getLanceCatalogVectorStore().query({
    indexName: CATALOG_VECTOR_INDEX_NAME,
    queryVector: embedding,
    topK: limit,
  });

  return hits.map((hit) => ({
    id: hit.id,
    score: hit.score,
    title: typeof hit.metadata?.title === "string" ? hit.metadata.title : hit.id,
    href: typeof hit.metadata?.href === "string" ? hit.metadata.href : "/products",
    type:
      hit.metadata?.type === "product" ||
      hit.metadata?.type === "category" ||
      hit.metadata?.type === "page"
        ? hit.metadata.type
        : "page",
    text: hit.document ?? "",
  }));
}
