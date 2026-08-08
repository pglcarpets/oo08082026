"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  size?: "sm" | "default";
};

/** FOCSS switch — no Radix. API matches prior `onCheckedChange` call sites. */
function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
  size = "default",
}: SwitchProps) {
  const [uncontrolled, setUncontrolled] = React.useState(Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const on = isControlled ? Boolean(checked) : uncontrolled;

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      disabled={disabled}
      data-slot="switch"
      data-size={size}
      className={cn("admin-switch", size === "sm" && "admin-switch--sm", className)}
      onClick={() => {
        const next = !on;
        if (!isControlled) setUncontrolled(next);
        onCheckedChange?.(next);
      }}
    >
      <span className="admin-switch__thumb" aria-hidden />
    </button>
  );
}

export { Switch };
