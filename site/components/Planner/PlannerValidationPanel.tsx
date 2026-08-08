"use client";

import { useMemo } from "react";
import { usePlanner } from "@planner/hooks/usePlannerDockBridge";
import { buildValidationFloorFromCanvas } from "@planner/lib/buildValidationFloor";
import { runFloorValidation } from "@planner/lib/validation/runValidation";
import type { ValidationIssue } from "@planner/lib/validation/types";

function severityClass(severity: ValidationIssue["severity"]): string {
  if (severity === "error") return "planner-validation__item--error";
  if (severity === "warning") return "planner-validation__item--warning";
  return "planner-validation__item--advisory";
}

/** Review-step validation list from live Fabric scene. */
export function ValidationPanel() {
  const { fabricRef, scalePxPerMm, sheet, sceneVersion } = usePlanner();

  const result = useMemo(() => {
    void sceneVersion;
    const c = fabricRef.current;
    const floor = buildValidationFloorFromCanvas(c, scalePxPerMm, sheet);
    return runFloorValidation(floor);
  }, [fabricRef, scalePxPerMm, sheet, sceneVersion]);

  if (result.issues.length === 0) {
    return (
      <div className="planner-validation" data-testid="planner-validation-empty">
        <p className="ai-hint">No layout issues detected.</p>
      </div>
    );
  }

  return (
    <div className="planner-validation" data-testid="planner-validation">
      <div className="planner-validation__summary" data-testid="planner-validation-summary">
        <span data-testid="planner-validation-errors">{result.errors} errors</span>
        <span data-testid="planner-validation-warnings">{result.warnings} warnings</span>
      </div>
      <ul className="planner-validation__list">
        {result.issues.map((issue) => (
          <li
            key={issue.id}
            className={`planner-validation__item ${severityClass(issue.severity)}`}
            data-testid={`planner-validation-issue-${issue.rule}`}
            data-rule={issue.rule}
            data-severity={issue.severity}
          >
            <strong>{issue.severity}</strong>
            <span>{issue.message}</span>
            <span className="ai-hint">{issue.remedy}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ValidationPanel;
