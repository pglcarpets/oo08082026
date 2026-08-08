import "server-only";

import { ModelRouterEmbeddingModel } from "@mastra/core/llm";

import { env } from "@/lib/env.server";

export const CATALOG_EMBEDDER_MODEL = "google/gemini-embedding-001" as const;
export const CATALOG_EMBEDDING_DIMENSION = 768;

/** Embedding model id for Mastra memory + RAG (Gemini preferred, OpenRouter fallback). */
export function resolveEmbedderModel(): string | null {
  const geminiKey = env.GEMINI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    return CATALOG_EMBEDDER_MODEL;
  }

  const openRouterKey =
    env.OPENROUTER_API_KEY_PRIMARY?.trim() || env.OPENROUTER_API_KEY_BACKUP?.trim();
  if (openRouterKey) {
    return "openai/text-embedding-3-small";
  }

  return null;
}

export function resolveMastraEmbeddingModel(): ModelRouterEmbeddingModel | null {
  const model = resolveEmbedderModel();
  if (!model) {
    return null;
  }
  return new ModelRouterEmbeddingModel(model);
}

export function isVectorRecallEnabled(): boolean {
  return resolveEmbedderModel() !== null;
}
