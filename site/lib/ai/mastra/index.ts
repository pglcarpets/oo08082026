import "server-only";

export {
  resolveAdvisorModelChain,
  type AdvisorModelTarget,
  type AdvisorProviderId,
} from "./providers";
export {
  requestAdvisorMessages,
  requestAdvisorText,
  type AdvisorChatMessage,
} from "./requestAdvisorText";
export {
  createCatalogSearchIndex,
  searchCatalogDocuments,
  type CatalogSearchDocument,
  type CatalogSearchHit,
} from "./catalogLocalSearch";
export {
  ensureCatalogVectorIndex,
  searchCatalogVectors,
  createCatalogVectorQueryTool,
  type CatalogVectorDocument,
} from "./catalogRag";
export {
  retrieveCatalogProducts,
  type CatalogRetrievalResult,
  type RetrievableProduct,
} from "./catalogRetrieval";
export { getAdvisorMemory } from "./advisorMemory";
export { resolveEmbedderModel, resolveMastraEmbeddingModel, isVectorRecallEnabled } from "./embedder";
export {
  getBedrockMantleBaseUrl,
  requestProviderText,
  resolveProviderChain,
  type ProviderId,
  type ResolvedProvider,
  type ServerChatMessage,
  type ServerChatMessageContentPart,
} from "./providerFetch";
