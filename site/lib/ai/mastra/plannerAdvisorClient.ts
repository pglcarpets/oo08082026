import { browserApiFetch } from "@/lib/api/browserApi";

export const PLANNER_ADVISOR_API_PATH = "/api/planner/ai-advisor";

export type PlannerAdvisorMode = "chat" | "space-suggest";

export type PlannerAdvisorRole = "system" | "user" | "assistant";

export type PlannerAdvisorMessage = {
  role: PlannerAdvisorRole;
  content: string;
};

export type PlannerAdvisorContext = {
  planner?: "oando" | "unified";
  roomWidth?: number;
  roomHeight?: number;
  currentShapeCount?: number;
  seatCount?: number;
  purpose?: string;
  floorAreaSqFt?: number;
  projectName?: string;
};

/** Legacy floating-panel context (`useAiAdvisor` / `AiAdvisorPanel`). */
export type LegacyAdvisorUiContext = {
  roomArea?: number;
  teamSize?: number;
  currentElements?: number;
  plannerType?: "oando" | "planner";
};

export type PlannerAdvisorLayoutSuggestion = {
  type: "placement" | "rearrange" | "template";
  description: string;
  actionLabel: string;
};

export type PlannerAdvisorRequest = {
  mode: PlannerAdvisorMode;
  messages: PlannerAdvisorMessage[];
  context?: PlannerAdvisorContext;
};

export type PlannerAdvisorResponse = {
  content: string;
  suggestion?: PlannerAdvisorLayoutSuggestion;
  degraded?: boolean;
  provider?: string;
  layout?: Record<string, unknown>;
};

export class PlannerAdvisorClientError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "PlannerAdvisorClientError";
    this.status = status;
  }
}

export function mapLegacyAdvisorUiContext(
  context: LegacyAdvisorUiContext | undefined,
): PlannerAdvisorContext | undefined {
  if (!context) {
    return undefined;
  }

  const out: PlannerAdvisorContext = {};
  if (context.plannerType === "oando" || context.plannerType === "planner") {
    out.planner = context.plannerType === "planner" ? "unified" : context.plannerType;
  }
  if (typeof context.teamSize === "number" && Number.isFinite(context.teamSize)) {
    out.seatCount = context.teamSize;
  }
  if (typeof context.roomArea === "number" && Number.isFinite(context.roomArea)) {
    out.floorAreaSqFt = context.roomArea;
  }
  if (typeof context.currentElements === "number" && Number.isFinite(context.currentElements)) {
    out.currentShapeCount = context.currentElements;
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

function resolvePlannerAdvisorError(
  data: unknown,
  status: number,
): PlannerAdvisorClientError {
  if (data && typeof data === "object") {
    const record = data as {
      error?: string | { message?: string };
    };
    const message =
      (typeof record.error === "object" && record.error?.message) ||
      (typeof record.error === "string" ? record.error : null);
    if (message) {
      return new PlannerAdvisorClientError(message, status);
    }
  }
  return new PlannerAdvisorClientError(`HTTP ${status}`, status);
}

/** Browser client for Mastra-backed `POST /api/planner/ai-advisor`. */
export async function callPlannerAdvisor(
  request: PlannerAdvisorRequest,
  init: RequestInit = {},
): Promise<PlannerAdvisorResponse> {
  const response = await browserApiFetch(PLANNER_ADVISOR_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...init.headers },
    body: JSON.stringify(request),
    ...init,
  });

  const data = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    content?: string;
    suggestion?: PlannerAdvisorLayoutSuggestion;
    degraded?: boolean;
    provider?: string;
    layout?: Record<string, unknown>;
    error?: string | { message?: string };
  };

  if (!response.ok) {
    throw resolvePlannerAdvisorError(data, response.status);
  }

  return {
    content: typeof data.content === "string" ? data.content : "",
    suggestion: data.suggestion,
    degraded: data.degraded,
    provider: data.provider,
    layout: data.layout,
  };
}
