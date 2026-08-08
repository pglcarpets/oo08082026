import type { NextRequest} from "next/server";
import type { NextResponse } from "next/server";
import { getProductsFresh } from '@/lib/catalog/site/getProducts';
import { createSupabaseAuthAdminClient } from '@/platform/supabase/auth-admin';
import { normalizeRequestedCategoryId } from '@/lib/catalog/site/categories';
import {
  requestAdvisorText,
  resolveAdvisorModelChain,
  retrieveCatalogProducts,
  type AdvisorModelTarget,
  type AdvisorProviderId,
} from "@/lib/ai/mastra";
import {
  buildConfiguratorContextSummary,
  sanitizeAdvisorPriceText,
  type AdvisorRecommendation,
  type AdvisorResult,
  type AdvisorStreamEvent,
  type ConfiguratorAdvisorContext,
} from '@/features/site/advisor/aiAdvisor';
import { withAuth, type AuthContext } from "@/features/shared/api/withAuth";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";
import { success, error } from "@/features/shared/api/apiResponse";
import { CatalogAdvisorRequestSchema } from "@/features/shared/api/schemas";
import { isMissingUserHistoryTable } from "@/lib/tracking/userHistoryRepository";

type ProductLite = Awaited<ReturnType<typeof getProductsFresh>>[number];
type AdvisorClientConfig = {
  provider: AdvisorProviderId;
  model: string;
  target: AdvisorModelTarget;
};
type ParsedAdvisorPayload = {
  query: string;
  context?: ConfiguratorAdvisorContext;
  stream: boolean;
};
type AdvisorResponsePayload = AdvisorResult & {
  fallbackUsed: boolean;
};

const AI_ADVISOR_TIMEOUT_MS = 10_000;
/** Catalog rows retrieved into the grounding prompt (was a flat first-80 slice). */
const ADVISOR_PROMPT_PRODUCT_LIMIT = 80;
const STREAM_ENCODER = new TextEncoder();
const STREAM_HEADERS = {
  "content-type": "application/x-ndjson; charset=utf-8",
  "cache-control": "no-cache, no-transform",
  connection: "keep-alive",
};

function resolveAdvisorClients(): AdvisorClientConfig[] {
  return resolveAdvisorModelChain().map((target) => ({
    provider: target.provider,
    model: target.label,
    target,
  }));
}

function normalizeContext(value: unknown): ConfiguratorAdvisorContext | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {return undefined;}
  const source = value as Record<string, unknown>;
  const context: Partial<ConfiguratorAdvisorContext> = {};

  if (source.source === "global") {context.source = "global";}
  if (source.mode === "quick-estimate" || source.mode === "technical-planner") {
    context.mode = source.mode;
  }
  if (typeof source.sourcePath === "string") {context.sourcePath = source.sourcePath.trim().slice(0, 200);}
  if (source.projectType === "workstations" || source.projectType === "storages") {
    context.projectType = source.projectType;
  }

  for (const key of ["seatOrUnitCount", "moduleCount", "modulesPerRow", "roomWidthMm", "roomLengthMm", "roomClearanceMm"] as const) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      context[key] = value;
    }
  }

  if (typeof source.workstationSeries === "string") {context.workstationSeries = source.workstationSeries.trim().slice(0, 120);}
  if (typeof source.layoutLabel === "string") {context.layoutLabel = source.layoutLabel.trim().slice(0, 120);}
  if (typeof source.storageLayout === "string") {context.storageLayout = source.storageLayout.trim().slice(0, 120);}
  if (typeof source.fitStatus === "string") {context.fitStatus = source.fitStatus.trim().slice(0, 120);}
  if (typeof source.budgetBand === "string") {context.budgetBand = source.budgetBand.trim().slice(0, 120);}
  if (typeof source.siteLocation === "string") {context.siteLocation = source.siteLocation.trim().slice(0, 120);}
  if (typeof source.estimatedBudget === "string") {context.estimatedBudget = source.estimatedBudget.trim().slice(0, 120);}
  if (Array.isArray(source.keyOptions)) {
    context.keyOptions = source.keyOptions
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().slice(0, 80))
      .filter(Boolean)
      .slice(0, 12);
  }

  return context.source === "global" ? (context as ConfiguratorAdvisorContext) : undefined;
}

function parsePayload(value: unknown): ParsedAdvisorPayload | null {
  const parsed = CatalogAdvisorRequestSchema.safeParse(value);
  if (!parsed.success) {return null;}
  const { query, stream, context: rawContext } = parsed.data;
  // Body `userId` is intentionally ignored — history is bound to the session only
  // to prevent IDOR on user_history via spoofed identifiers.
  return {
    query,
    context: normalizeContext(rawContext),
    stream: stream === true,
  };
}

function normalizeCategoryId(raw: string): string {
  const canonical = normalizeRequestedCategoryId(raw);
  if (canonical) {return canonical;}
  const stripped = raw.replace(/^oando-/, "").trim().toLowerCase();
  return stripped || "seating";
}

function parsePriceRange(priceRange: string | undefined): string {
  switch (priceRange) {
    case "budget":
      return "Budget-friendly";
    case "mid":
      return "Mid-range";
    case "premium":
      return "Premium";
    case "luxury":
      return "Luxury";
    default:
      return "On request";
  }
}

function inferBudgetFromQuery(query: string): string {
  const text = query.toLowerCase();
  if (text.includes("budget") || text.includes("cost effective")) {return "Indicative value band on request";}
  if (text.includes("premium") || text.includes("executive")) {return "Indicative premium band on request";}
  if (text.includes("luxury") || text.includes("director")) {return "Indicative premium band on request";}
  return "Indicative budget band on request";
}

function buildHeuristicRecommendations(
  query: string,
  products: ProductLite[],
): AdvisorRecommendation[] {
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);

  const categoryHints: Array<{ id: string; tokens: string[] }> = [
    { id: "seating", tokens: ["chair", "seating", "ergonomic", "visitor", "training"] },
    { id: "workstations", tokens: ["workstation", "desk", "bench", "desking"] },
    { id: "tables", tokens: ["table", "meeting", "conference", "cabin"] },
    { id: "storages", tokens: ["storage", "locker", "cabinet", "pedestal"] },
    { id: "soft-seating", tokens: ["sofa", "lounge", "pod", "collaborative"] },
    { id: "education", tokens: ["classroom", "library", "hostel", "auditorium"] },
  ];

  const hintedCategories = new Set<string>();
  for (const hint of categoryHints) {
    if (hint.tokens.some((token) => query.toLowerCase().includes(token))) {
      hintedCategories.add(hint.id);
    }
  }

  const scored = products.map((product) => {
    const haystack = [
      product.name,
      product.description || "",
      product.category_id,
      product.series_name,
      product.series,
      ...(product.metadata?.tags || []),
      product.metadata?.subcategory || "",
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    for (const word of words) {
      if (haystack.includes(word)) {score += 2;}
    }
    if (hintedCategories.has(normalizeCategoryId(product.category_id))) {
      score += 3;
    }
    return { product, score };
  });

  scored.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));
  const picked = scored.filter((entry) => entry.score > 0).slice(0, 5);
  const finalList = (picked.length > 0 ? picked : scored.slice(0, 5)).map((entry) => {
    const product = entry.product;
    const category = normalizeCategoryId(product.category_id);
    return {
      productUrlKey: product.slug,
      productId: product.slug,
      productName: product.name,
      category,
      why:
        product.description?.split(".")[0]?.trim() ||
        `Matches ${category.replace(/-/g, " ")} requirements in your brief.`,
      budgetEstimate: parsePriceRange(product.metadata?.priceRange),
    } satisfies AdvisorRecommendation;
  });

  return finalList;
}

function buildContextualNextActions(
  context: ConfiguratorAdvisorContext | undefined,
): string[] {
  if (!context) {
    return [
      "Share team size, city, and category priorities to tighten the shortlist.",
      "Confirm whether budget, delivery speed, or ergonomics should lead the recommendation.",
    ];
  }

  const actions = [
    "Share team size, city, and category priorities to tighten the shortlist.",
    "Confirm whether budget, delivery speed, or ergonomics should lead the recommendation.",
  ];
  if (context.fitStatus?.toLowerCase().includes("over")) {
    actions.unshift("Reduce seat or unit density, or increase the usable planning zone.");
  }
  if (!context.siteLocation) {
    actions.push("Add site location to tune installation and delivery assumptions.");
  }
  return actions;
}

function buildContextualWarnings(
  context: ConfiguratorAdvisorContext | undefined,
): string[] {
  if (!context) {return [];}
  const warnings: string[] = [];
  if (context.fitStatus?.toLowerCase().includes("over")) {
    warnings.push("Current layout does not fit inside the stated planning zone.");
  }
  if (!context.budgetBand || context.budgetBand.toLowerCase().includes("guidance")) {
    warnings.push("Budget band is still open, so pricing remains indicative only.");
  }
  return warnings;
}

function buildFallbackAdvisorResponse(
  query: string,
  products: ProductLite[],
  context?: ConfiguratorAdvisorContext,
): AdvisorResponsePayload {
  const recommendations = buildHeuristicRecommendations(query, products);
  return {
    recommendations,
    totalBudget:
      context?.estimatedBudget && !context.estimatedBudget.toLowerCase().includes("$")
        ? context.estimatedBudget
        : inferBudgetFromQuery(query),
    summary:
      "Here is a practical shortlist based on your brief and our available catalog. Share team size and site details for a tighter recommendation.",
    nextActions: buildContextualNextActions(context),
    warnings: buildContextualWarnings(context),
    pricingMode: context?.estimatedBudget ? "band" : "on-request",
    fallbackUsed: true,
  };
}

function normalizeRecommendation(
  entry: unknown,
  byUrlKey: Map<string, ProductLite>,
): AdvisorRecommendation | null {
  if (!entry || typeof entry !== "object") {return null;}
  const source = entry as Record<string, unknown>;
  const productUrlKey =
    typeof source.productUrlKey === "string" && source.productUrlKey.trim().length > 0
      ? source.productUrlKey.trim()
      : typeof source.productId === "string" && source.productId.trim().length > 0
        ? source.productId.trim()
        : "";

  if (!productUrlKey) {return null;}
  const product = byUrlKey.get(productUrlKey);
  const categoryFromEntry =
    typeof source.category === "string" ? source.category : product?.category_id || "";
  const category = normalizeCategoryId(categoryFromEntry);

  return {
    productUrlKey,
    productId: productUrlKey,
    productName:
      typeof source.productName === "string" && source.productName.trim().length > 0
        ? source.productName
        : product?.name || "",
    category,
    why:
      typeof source.why === "string" && source.why.trim().length > 0
        ? source.why
        : product?.description?.split(".")[0] || "",
    budgetEstimate:
      typeof source.budgetEstimate === "string" && source.budgetEstimate.trim().length > 0
        ? sanitizeAdvisorPriceText(source.budgetEstimate, parsePriceRange(product?.metadata?.priceRange))
        : parsePriceRange(product?.metadata?.priceRange),
  };
}

function isAbortLikeError(error: unknown): boolean {
  if (!error || typeof error !== "object") {return false;}
  const maybeError = error as { name?: string; message?: string };
  return maybeError.name === "AbortError" || String(maybeError.message || "").toLowerCase().includes("aborted");
}

function stripJsonCodeFence(value: string): string {
  return value.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
}

function parseAdvisorJson(raw: string): Record<string, unknown> | null {
  if (!raw.trim()) {return null;}
  try {
    return JSON.parse(stripJsonCodeFence(raw)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildAdvisorSuccessResponse(
  parsed: Record<string, unknown>,
  productsByUrlKey: Map<string, ProductLite>,
  context: ConfiguratorAdvisorContext | undefined,
  fallbackBudget: string,
): AdvisorResponsePayload | null {
  const recommendations = Array.isArray(parsed.recommendations)
    ? parsed.recommendations
        .map((entry) => normalizeRecommendation(entry, productsByUrlKey))
        .filter((item): item is AdvisorRecommendation => Boolean(item))
    : [];

  if (recommendations.length === 0) {return null;}

  return {
    recommendations,
    totalBudget: sanitizeAdvisorPriceText(
      typeof parsed.totalBudget === "string" && parsed.totalBudget.trim().length > 0
        ? parsed.totalBudget
        : fallbackBudget,
      fallbackBudget,
    ),
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim().length > 0
        ? parsed.summary
        : "Recommendation shortlist generated from your project brief and current catalog.",
    nextActions: Array.isArray(parsed.nextActions)
      ? parsed.nextActions.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : buildContextualNextActions(context),
    warnings: Array.isArray(parsed.warnings)
      ? parsed.warnings.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : buildContextualWarnings(context),
    pricingMode:
      parsed.pricingMode === "band" || parsed.pricingMode === "on-request"
        ? parsed.pricingMode
        : context?.estimatedBudget
          ? "band"
          : "on-request",
    fallbackUsed: false,
  };
}

function buildUnavailableCatalogResponse(
  context: ConfiguratorAdvisorContext | undefined,
): AdvisorResponsePayload {
  return {
    recommendations: [],
    totalBudget: "On request",
    summary: "Catalog is temporarily unavailable.",
    nextActions: buildContextualNextActions(context),
    warnings: buildContextualWarnings(context),
    pricingMode: "on-request",
    fallbackUsed: true,
  };
}

function emitStreamEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: AdvisorStreamEvent,
) {
  try {
    controller.enqueue(STREAM_ENCODER.encode(`${JSON.stringify(event)}\n`));
  } catch {
    // Ignore error if client aborted connection
  }
}

function chunkSummary(summary: string): string[] {
  return summary.split(/(\s+)/).filter(Boolean);
}

async function streamResolvedResult(
  controller: ReadableStreamDefaultController<Uint8Array>,
  result: AdvisorResponsePayload,
) {
  emitStreamEvent(controller, { type: "status", message: "Preparing shortlist" });
  for (const token of chunkSummary(result.summary)) {
    emitStreamEvent(controller, { type: "delta", text: token });
    await Promise.resolve();
  }
  emitStreamEvent(controller, { type: "result", result });
}

function createStreamResponse(
  executor: (controller: ReadableStreamDefaultController<Uint8Array>) => Promise<void>,
) {
  if (process.env.JEST_WORKER_ID) {
    const chunks: Uint8Array[] = [];
    const bufferedController = {
      enqueue(chunk: Uint8Array) {
        chunks.push(chunk);
      },
      close() {},
    } as unknown as ReadableStreamDefaultController<Uint8Array>;

    return executor(bufferedController)
      .catch((error) => {
        console.error("[ai-advisor] stream error:", error);
        emitStreamEvent(bufferedController, {
          type: "error",
          message: "Unable to process advisor request right now.",
        });
      })
      .then(
        () =>
          new Response(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))), {
            headers: STREAM_HEADERS,
          }),
      );
  }

  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        void executor(controller)
          .catch((error) => {
            console.error("[ai-advisor] stream error:", error);
            emitStreamEvent(controller, {
              type: "error",
              message: "Unable to process advisor request right now.",
            });
          })
          .finally(() => {
            try {
              controller.close();
            } catch {
              // Ignore if already closed
            }
          });
      },
    }),
    { headers: STREAM_HEADERS },
  );
}

async function requestAdvisorRawResponse(
  advisorClient: AdvisorClientConfig,
  systemPrompt: string,
  query: string,
  stream: boolean,
  onDelta?: (delta: string) => void,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_ADVISOR_TIMEOUT_MS);

  try {
    return await requestAdvisorText(advisorClient.target, systemPrompt, query, {
      signal: controller.signal,
      stream,
      onDelta,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function buildHistoryContext(userId: string): Promise<string> {
  if (!userId) {return "";}

  const supabaseAdmin = createSupabaseAuthAdminClient();
  const { data, error } = await supabaseAdmin
    .from("user_history")
    .select("viewed_products")
    .eq("user_id", userId)
    .single();

  if (error && !isMissingUserHistoryTable(error.message)) {
    console.error("[ai-advisor] user_history error:", error.message);
  }

  if (!data?.viewed_products?.length) {return "";}

  return (
    `\nClient History (Recently Viewed Products): ${data.viewed_products.join(", ")}` +
    "\nPrioritize recommending complementary or similar items based on this history."
  );
}

function buildSystemPrompt(
  historyContext: string,
  contextSummary: string,
  productList: string,
) {
  return `You are an enterprise workspace engineering consultant for One & Only Furniture.
Recommend 3 to 5 specific products from the catalog.
Consider team size, industry, budget sensitivity, location context, and ergonomic needs.
Only use the live catalog below.
This is an India-facing experience, so never return USD or dollar pricing. Use INR budget bands or "On request".
Do not fabricate a final BOQ or fake precision totals.
${historyContext}
${contextSummary ? `\n${contextSummary}\n` : ""}

Available products:
${productList}

Respond ONLY with valid JSON in this exact key order:
{
  "summary": "<2-sentence consultation summary>",
  "recommendations": [
    {
      "productUrlKey": "<product URL key from catalog>",
      "productId": "<same value as productUrlKey for backward compatibility>",
      "productName": "<name>",
      "category": "<category>",
      "why": "<one sentence engineering rationale>",
      "budgetEstimate": "<budget range>"
    }
  ],
  "totalBudget": "<estimated project total range>",
  "nextActions": ["<specific next change or validation step>"],
  "warnings": ["<optional risk or confidence caveat>"],
  "pricingMode": "band"
}`;
}

/**
 * Core catalog-advisor logic, invoked after auth + rate-limit. The streaming
 * path returns a raw NDJSON `Response` (bypassing the JSON envelope); the
 * non-stream path uses the standard {@link success} envelope while preserving
 * the legacy top-level fields (`recommendations`, `summary`, etc.) that the
 * `UnifiedAssistant` client reads.
 */
async function handleCatalogAdvisor(
  req: NextRequest,
  auth: AuthContext,
): Promise<NextResponse | Response> {
  const parsedBody = parsePayload(await req.json().catch(() => null));
  if (!parsedBody) {
    return error(
      new ApiError(400, API_ERROR_CODES.VALIDATION_ERROR, "Query is required"),
    );
  }

  const { query, context, stream } = parsedBody;
  const products = await getProductsFresh();
  if (!products || products.length === 0) {
    const unavailable = buildUnavailableCatalogResponse(context);
    return stream
      ? createStreamResponse((controller) => streamResolvedResult(controller, unavailable))
      : success(unavailable);
  }

  const productsByUrlKey = new Map(products.map((product) => [product.slug, product]));
  const advisorClients = resolveAdvisorClients();
  const fallbackResult = buildFallbackAdvisorResponse(query, products, context);

  if (advisorClients.length === 0) {
    return stream
      ? createStreamResponse((controller) => streamResolvedResult(controller, fallbackResult))
      : success(fallbackResult);
  }

  // Session-bound history only (guest routes may have null user).
  const historyContext = await buildHistoryContext(auth.user?.id ?? "");
  // Ground the prompt on retrieved rows (LanceDB vectors → Orama lexical →
  // catalog order) instead of the first 80 rows in catalog order.
  const retrieved = await retrieveCatalogProducts(
    query,
    products,
    ADVISOR_PROMPT_PRODUCT_LIMIT,
  );
  const productList = retrieved.products
    .map(
      (p) =>
        `- Product URL Key: ${p.slug} | Name: ${p.name} | Category: ${p.category_id} | ${p.description?.slice(0, 80)}`,
    )
    .join("\n");

  const contextSummary = buildConfiguratorContextSummary(context);
  const systemPrompt = buildSystemPrompt(historyContext, contextSummary, productList);
  const fallbackBudget = context?.estimatedBudget || inferBudgetFromQuery(query);

  if (stream) {
    return createStreamResponse(async (controller) => {
      for (const advisorClient of advisorClients) {
        let streamedAnyData = false;
        emitStreamEvent(controller, {
          type: "status",
          message: `Consulting ${advisorClient.provider}`,
        });

        try {
          const raw = await requestAdvisorRawResponse(
            advisorClient,
            systemPrompt,
            query,
            true,
            (delta) => {
              streamedAnyData = true;
              emitStreamEvent(controller, { type: "delta", text: delta });
            },
          );

          const parsed = parseAdvisorJson(raw);
          const result = parsed
            ? buildAdvisorSuccessResponse(parsed, productsByUrlKey, context, fallbackBudget)
            : null;

          if (result) {
            emitStreamEvent(controller, { type: "result", result });
            return;
          }
        } catch (providerError) {
          const isTimeout = isAbortLikeError(providerError);
          console.error(
            `[ai-advisor] ${advisorClient.provider} stream error${
              isTimeout ? " (timeout)" : ""
            }:`,
            providerError,
          );
        }

        if (streamedAnyData) {
          break;
        }
      }

      await streamResolvedResult(controller, fallbackResult);
    });
  }

  for (const advisorClient of advisorClients) {
    try {
      const raw = await requestAdvisorRawResponse(
        advisorClient,
        systemPrompt,
        query,
        false,
      );
      const parsed = parseAdvisorJson(raw);
      const result = parsed
        ? buildAdvisorSuccessResponse(parsed, productsByUrlKey, context, fallbackBudget)
        : null;

      if (result) {
        return success(result);
      }
    } catch (providerError) {
      const isTimeout = isAbortLikeError(providerError);
      console.error(
        `[ai-advisor] ${advisorClient.provider} provider error${
          isTimeout ? " (timeout)" : ""
        }:`,
        providerError,
      );
    }
  }

  return success(fallbackResult);
}

/**
 * POST /api/ai-advisor — Catalog AI advisor (canonical).
 *
 * Accepts a natural-language `query` plus optional `context` and returns a
 * shortlist of catalog recommendations with budget bands and next actions.
 * Supports NDJSON streaming when `stream: true`. Guest auth; rate-limited.
 *
 * Response (200, non-stream): `{ success: true, recommendations, summary,
 *   totalBudget, nextActions, warnings, pricingMode, fallbackUsed }`.
 * Response (200, stream): `application/x-ndjson` of `{ type, ... }` events.
 * Errors: 400 (validation), 429 (rate limit), 500.
 */
export const POST = withAuth(
  async (req, auth) => handleCatalogAdvisor(req as NextRequest, auth),
  { role: "guest", rateLimitScope: "ai-advisor", rateLimit: 5, requireCsrf: true },
);
