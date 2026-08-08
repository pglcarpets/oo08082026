"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type NumberStepperProps = {
  id?: string;
  value: number;
  onChange?: (value: number) => void;
  /** Alias used by older call sites / tests */
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  "aria-label"?: string;
};

/** FOCSS number stepper — no Radix. */
function NumberStepper({
  id,
  value,
  onChange,
  onValueChange,
  min,
  max,
  step = 1,
  className,
  "aria-label": ariaLabel = "Number",
}: NumberStepperProps) {
  const emit = onValueChange ?? onChange ?? (() => undefined);

  const clamp = (n: number) => {
    let next = n;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    return next;
  };

  return (
    <div className={cn("admin-inline-row", className)} role="group" aria-label={ariaLabel}>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        aria-label="Decrease"
        onClick={() => emit(clamp(value - step))}
      >
        −
      </Button>
      <Input
        id={id}
        type="number"
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => emit(clamp(Number(e.target.value)))}
      />
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        aria-label="Increase"
        onClick={() => emit(clamp(value + step))}
      >
        +
      </Button>
    </div>
  );
}

export { NumberStepper };
