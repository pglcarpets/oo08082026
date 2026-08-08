import "server-only";

import fs from "node:fs";
import path from "node:path";

import { connect, type Connection, type Table } from "@lancedb/lancedb";
import { MastraVector } from "@mastra/core/vector";
import type {
  CreateIndexParams,
  DeleteIndexParams,
  DeleteVectorParams,
  DeleteVectorsParams,
  DescribeIndexParams,
  IndexStats,
  QueryResult,
  QueryVectorParams,
  UpdateVectorParams,
  UpsertVectorParams,
} from "@mastra/core/vector";

import { CATALOG_EMBEDDING_DIMENSION } from "./embedder";

export const CATALOG_VECTOR_INDEX_NAME = "catalog_nav";

type LanceCatalogRow = {
  id: string;
  vector: number[];
  text: string;
  title: string;
  keywords: string;
  href: string;
  type: string;
};

function sanitizeTableName(indexName: string): string {
  return indexName.replace(/[^a-zA-Z0-9_]/g, "_");
}

function escapeSqlLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

function resolveLanceDbUri(): string {
  const configured = process.env.LANCE_DB_URI?.trim();
  if (configured) {
    return configured;
  }
  return path.join(process.cwd(), ".data", "lancedb", "catalog");
}

let store: LanceCatalogVectorStore | null = null;

export function getLanceCatalogVectorStore(): LanceCatalogVectorStore {
  if (!store) {
    store = new LanceCatalogVectorStore();
  }
  return store;
}

export class LanceCatalogVectorStore extends MastraVector {
  private connection: Promise<Connection> | null = null;
  private readonly uri: string;
  private readonly indexDimensions = new Map<string, number>();

  constructor(uri = resolveLanceDbUri()) {
    super({ id: "lance-catalog-vector" });
    this.uri = uri;
  }

  private async conn(): Promise<Connection> {
    if (!this.connection) {
      fs.mkdirSync(this.uri, { recursive: true });
      this.connection = connect(this.uri);
    }
    return this.connection;
  }

  private async openTable(indexName: string): Promise<Table | null> {
    const conn = await this.conn();
    const name = sanitizeTableName(indexName);
    if (!(await conn.tableNames()).includes(name)) {
      return null;
    }
    return conn.openTable(name);
  }

  async createIndex({ indexName, dimension }: CreateIndexParams): Promise<void> {
    const conn = await this.conn();
    const name = sanitizeTableName(indexName);
    if ((await conn.tableNames()).includes(name)) {
      this.indexDimensions.set(indexName, dimension);
      return;
    }

    const seed: LanceCatalogRow = {
      id: "__seed__",
      vector: Array.from({ length: dimension }, () => 0),
      text: "",
      title: "",
      keywords: "",
      href: "",
      type: "",
    };
    const created = await conn.createTable(name, [seed], { mode: "overwrite" });
    await created.delete("id = '__seed__'");
    this.indexDimensions.set(indexName, dimension);
  }

  async listIndexes(): Promise<string[]> {
    const conn = await this.conn();
    return conn.tableNames();
  }

  async describeIndex({ indexName }: DescribeIndexParams): Promise<IndexStats> {
    const tbl = await this.openTable(indexName);
    if (!tbl) {
      return {
        dimension: this.indexDimensions.get(indexName) ?? CATALOG_EMBEDDING_DIMENSION,
        count: 0,
        metric: "cosine",
      };
    }

    return {
      dimension: this.indexDimensions.get(indexName) ?? CATALOG_EMBEDDING_DIMENSION,
      count: await tbl.countRows(),
      metric: "cosine",
    };
  }

  async deleteIndex({ indexName }: DeleteIndexParams): Promise<void> {
    const conn = await this.conn();
    const name = sanitizeTableName(indexName);
    if ((await conn.tableNames()).includes(name)) {
      await conn.dropTable(name);
    }
    this.indexDimensions.delete(indexName);
  }

  async upsert({ indexName, vectors, metadata = [], ids }: UpsertVectorParams): Promise<string[]> {
    const dimension = vectors[0]?.length ?? CATALOG_EMBEDDING_DIMENSION;
    await this.createIndex({ indexName, dimension });

    const tbl = await this.openTable(indexName);
    if (!tbl) {
      throw new Error(`Lance index missing after create: ${indexName}`);
    }

    const rows: LanceCatalogRow[] = vectors.map((vector, index) => {
      const meta = metadata[index] ?? {};
      const id =
        ids?.[index] ?? (typeof meta.id === "string" ? meta.id : `catalog_${index}`);
      const title = typeof meta.title === "string" ? meta.title : "";
      const keywords = typeof meta.keywords === "string" ? meta.keywords : "";
      const href = typeof meta.href === "string" ? meta.href : "";
      const type = typeof meta.type === "string" ? meta.type : "";
      const text =
        typeof meta.text === "string" ? meta.text : [title, keywords].filter(Boolean).join(" ");

      return { id, vector, text, title, keywords, href, type };
    });

    if (rows.length === 0) {
      return [];
    }

    const idList = rows.map((row) => `'${escapeSqlLiteral(row.id)}'`).join(", ");
    await tbl.delete(`id IN (${idList})`);
    await tbl.add(rows, { mode: "append" });

    return rows.map((row) => row.id);
  }

  async query(params: QueryVectorParams): Promise<QueryResult[]> {
    const { indexName, queryVector, topK = 10 } = params;
    if (!queryVector?.length) {
      return [];
    }

    const tbl = await this.openTable(indexName);
    if (!tbl) {
      return [];
    }

    const results = await tbl.vectorSearch(queryVector).limit(topK).toArray();
    return results.map((row: Record<string, unknown>, index: number) => {
      const distance = typeof row._distance === "number" ? row._distance : index;
      return {
        id: String(row.id ?? index),
        score: 1 / (1 + distance),
        metadata: {
          title: row.title,
          keywords: row.keywords,
          href: row.href,
          type: row.type,
        },
        document: typeof row.text === "string" ? row.text : undefined,
      };
    });
  }

  async updateVector(_params: UpdateVectorParams): Promise<void> {
    throw new Error("LanceCatalogVectorStore.updateVector is not supported");
  }

  async deleteVector({ indexName, id }: DeleteVectorParams): Promise<void> {
    const tbl = await this.openTable(indexName);
    if (!tbl) {
      return;
    }
    await tbl.delete(`id = '${escapeSqlLiteral(String(id))}'`);
  }

  async deleteVectors({ indexName, ids }: DeleteVectorsParams): Promise<void> {
    if (!ids?.length) {
      return;
    }
    const tbl = await this.openTable(indexName);
    if (!tbl) {
      return;
    }
    const idList = ids.map((id) => `'${escapeSqlLiteral(String(id))}'`).join(", ");
    await tbl.delete(`id IN (${idList})`);
  }
}
