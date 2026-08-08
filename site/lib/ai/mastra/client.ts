/** Browser-safe Mastra advisor client surface (no server-only imports). */
export {
  PLANNER_ADVISOR_API_PATH,
  PlannerAdvisorClientError,
  callPlannerAdvisor,
  mapLegacyAdvisorUiContext,
  type LegacyAdvisorUiContext,
  type PlannerAdvisorContext,
  type PlannerAdvisorLayoutSuggestion,
  type PlannerAdvisorMessage,
  type PlannerAdvisorMode,
  type PlannerAdvisorRequest,
  type PlannerAdvisorResponse,
  type PlannerAdvisorRole,
} from "./plannerAdvisorClient";
