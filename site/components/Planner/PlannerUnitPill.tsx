"use client";

import { Button as AriaButton } from "react-aria-components";
import { usePlannerUIStore, type PlannerUnit } from "@planner/store/plannerUiStore";

const UNITS: PlannerUnit[] = ["mm", "cm", "m", "in"];

/** Planner canvas overlay unit switcher — not shared with Studio. */
export function PlannerUnitPill() {
  const unit = usePlannerUIStore((s) => s.unit);
  const setUnit = usePlannerUIStore((s) => s.setUnit);
  return (
    <div className="planner-unit-pill" data-testid="top-unit" role="group" aria-label="Units">
      {UNITS.map((u) => (
        <AriaButton
          key={u}
          data-active={unit === u ? "true" : "false"}
          onPress={() => setUnit(u)}
          data-testid={`top-unit-${u}`}
        >
          {u}
        </AriaButton>
      ))}
    </div>
  );
}

export default PlannerUnitPill;
