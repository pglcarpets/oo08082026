"use client";

import { useMemo } from "react";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";
import {
  PLANNER_STEPS,
  PLANNER_STEP_DETAILS,
  PLANNER_STEP_LABELS,
  derivePlannerStepCompletion,
  plannerForwardWarning,
  type PlannerStep,
  type PlannerWorkflowMetrics,
} from "@planner/lib/plannerStep";

type PlannerWorkflowBarProps = {
  currentStep: PlannerStep;
  onStepChange: (step: PlannerStep) => void;
  planMetrics?: PlannerWorkflowMetrics;
};

function nextStepOf(step: PlannerStep): PlannerStep | null {
  const i = PLANNER_STEPS.indexOf(step);
  if (i < 0 || i >= PLANNER_STEPS.length - 1) return null;
  return PLANNER_STEPS[i + 1] ?? null;
}

/** Compact 3-step workflow strip — Draw → Place → Review. */
export function PlannerWorkflowBar({
  currentStep,
  onStepChange,
  planMetrics,
}: PlannerWorkflowBarProps) {
  const completion = useMemo(
    () => derivePlannerStepCompletion(planMetrics),
    [planMetrics],
  );
  const warning = plannerForwardWarning(currentStep, completion);
  const next = nextStepOf(currentStep);
  const nextLabel = next === "place" ? "Place furniture" : next === "review" ? "Review & quote" : "Continue";
  const currentIndex = PLANNER_STEPS.indexOf(currentStep);

  return (
    <nav
      className="pw-step-bar"
      aria-label="Planner workflow"
      data-current={currentStep}
      data-testid="planner-workflow-bar"
    >
      <ol className="pw-step-bar__steps">
        {PLANNER_STEPS.map((step, index) => {
          const active = step === currentStep;
          const done = completion[step] === "complete";
          const past = index < currentIndex;
          const label = PLANNER_STEP_LABELS[step];
          const detail = PLANNER_STEP_DETAILS[step];
          return (
            <li
              key={step}
              className="pw-step-bar__step"
              data-past={past ? "true" : undefined}
              data-active={active ? "true" : undefined}
            >
              {index > 0 ? (
                <span
                  className="pw-step-bar__rail"
                  data-completion={completion[PLANNER_STEPS[index - 1]!]}
                  aria-hidden="true"
                />
              ) : null}
              <button
                type="button"
                className="pw-step-bar__btn"
                data-step={step}
                data-active={active ? "true" : undefined}
                data-completion={completion[step]}
                aria-current={active ? "step" : undefined}
                aria-label={`${index + 1}. ${label}. ${completion[step]}. ${detail}`}
                onClick={() => onStepChange(step)}
              >
                <span className="pw-step-bar__num">
                  {done ? <PhIcon name="check" size={16} /> : index + 1}
                </span>
                <span className="pw-step-bar__copy">
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {next ? (
        <button
          type="button"
          className="btn btn--primary btn--sm pw-step-bar__next"
          data-testid="planner-step-next"
          onClick={() => onStepChange(next)}
        >
          {nextLabel}
          <PhIcon name="caretRight" size={16} />
        </button>
      ) : null}
      <p className="pw-step-bar__warn" role="status" aria-live="polite" hidden={!warning}>
        {warning}
      </p>
    </nav>
  );
}

export default PlannerWorkflowBar;
