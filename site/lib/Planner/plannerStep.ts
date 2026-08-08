/** Three-step planner workflow (from 20072026: draw → place → review). */

export type PlannerStep = "draw" | "place" | "review";

export const PLANNER_STEPS: PlannerStep[] = ["draw", "place", "review"];

export const PLANNER_STEP_LABELS: Record<PlannerStep, string> = {
  draw: "Draw room",
  place: "Place furniture",
  review: "Review & quote",
};

export const PLANNER_STEP_DETAILS: Record<PlannerStep, string> = {
  draw: "Walls, openings, measurements",
  place: "Choose and position furniture",
  review: "Check 3D, validate, generate BOQ",
};

export type PlannerStepCompletion = "complete" | "incomplete";

export type PlannerStepCompletionMap = Record<PlannerStep, PlannerStepCompletion>;

export type PlannerWorkflowMetrics = {
  walls: number;
  furniture: number;
  boqReady?: boolean;
};

export function derivePlannerStepCompletion(
  metrics?: PlannerWorkflowMetrics,
): PlannerStepCompletionMap {
  const hasWalls = (metrics?.walls ?? 0) > 0;
  const hasFurniture = (metrics?.furniture ?? 0) > 0;
  const boqReady = metrics?.boqReady ?? hasFurniture;
  return {
    draw: hasWalls ? "complete" : "incomplete",
    place: hasFurniture ? "complete" : "incomplete",
    review: boqReady ? "complete" : "incomplete",
  };
}

export function plannerForwardWarning(
  target: PlannerStep,
  completion: PlannerStepCompletionMap,
): string | null {
  const targetIndex = PLANNER_STEPS.indexOf(target);
  if (targetIndex <= 0) return null;

  const incomplete = PLANNER_STEPS.slice(0, targetIndex).filter(
    (step) => completion[step] !== "complete",
  );
  if (incomplete.length === 0) return null;

  const labels = incomplete.map((step) => PLANNER_STEP_LABELS[step]).join(" and ");
  const verb = incomplete.length === 1 ? "is" : "are";
  return `${labels} ${verb} incomplete. You can continue, but review and quote may remain blocked.`;
}
