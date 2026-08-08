import "server-only";

import type { Agent } from "@mastra/core/agent";

import { resolveAdvisorModelChain } from "./providers";
import { getAdvisorMemory } from "./advisorMemory";
import { createCatalogVectorQueryTool, ensureCatalogVectorIndex } from "./catalogRag";

let catalogAdvisorAgent: Agent | null = null;

export async function getCatalogAdvisorAgent() {
  if (catalogAdvisorAgent) {
    return catalogAdvisorAgent;
  }

  await ensureCatalogVectorIndex();

  const { Agent } = await import("@mastra/core/agent");
  const [primaryModel] = resolveAdvisorModelChain();
  const catalogSearchTool = createCatalogVectorQueryTool();

  catalogAdvisorAgent = new Agent({
    id: "catalog-advisor",
    name: "Catalog Advisor",
    instructions:
      "You are an enterprise workspace engineering consultant for One & Only Furniture. Use catalog_vector_search when product or page context would improve the answer.",
    model: primaryModel ?? "google/gemini-2.5-flash",
    memory: getAdvisorMemory(),
    ...(catalogSearchTool
      ? {
          tools: {
            catalog_vector_search: catalogSearchTool,
          },
        }
      : {}),
  });

  return catalogAdvisorAgent;
}
