import "server-only";

import { create, insertMultiple, search, type AnyOrama, type Results } from "@orama/orama";

export type CatalogSearchDocument = {
  id: string;
  title: string;
  keywords: string;
};

export type CatalogSearchHit<T extends CatalogSearchDocument> = {
  document: T;
  score: number;
};

function normalizeSearchText(text: string): string {
  return text.toLowerCase().trim();
}

export function createCatalogSearchIndex<T extends CatalogSearchDocument>(
  documents: readonly T[],
): AnyOrama {
  const db = create({
    schema: {
      id: "string",
      title: "string",
      keywords: "string",
    },
  });

  if (documents.length > 0) {
    insertMultiple(
      db,
      documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        keywords: doc.keywords,
      })),
    );
  }

  return db;
}

export async function searchCatalogDocuments<T extends CatalogSearchDocument>(
  db: AnyOrama,
  query: string,
  limit: number,
): Promise<CatalogSearchHit<T>[]> {
  const trimmedQuery = normalizeSearchText(query);
  if (trimmedQuery.length < 2) {
    return [];
  }

  const raw = await search(db, {
    term: trimmedQuery,
    properties: ["title", "keywords"],
    limit: Math.max(limit * 3, 24),
    tolerance: 1,
  });

  const results = raw as Results<T>;

  return results.hits.map((hit) => ({
    document: hit.document as T,
    score: hit.score,
  }));
}
