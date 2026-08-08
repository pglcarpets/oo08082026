import "server-only";

import { InMemoryStore } from "@mastra/core/storage";
import { Memory } from "@mastra/memory";

import { isVectorRecallEnabled, resolveEmbedderModel, resolveMastraEmbeddingModel } from "./embedder";
import { getLanceCatalogVectorStore } from "./lanceVectorStore";

let advisorMemory: Memory | null = null;

export function getAdvisorMemory(): Memory {
  if (advisorMemory) {
    return advisorMemory;
  }

  const embedder = resolveEmbedderModel();
  const embeddingModel = resolveMastraEmbeddingModel();
  const vectorEnabled = isVectorRecallEnabled();

  advisorMemory = new Memory({
    storage: new InMemoryStore({ id: "advisor-memory-storage" }),
    ...(vectorEnabled && embeddingModel
      ? {
          vector: getLanceCatalogVectorStore(),
          embedder: embedder ?? undefined,
        }
      : {}),
    options: {
      lastMessages: 20,
      semanticRecall: vectorEnabled
        ? {
            topK: 5,
            messageRange: 2,
          }
        : false,
    },
  });

  return advisorMemory;
}
