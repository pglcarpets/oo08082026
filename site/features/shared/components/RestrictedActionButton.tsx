"use client";

import * as React from "react";
import {
  TooltipTrigger,
  Tooltip,
  Button as RACButton,
} from "react-aria-components";
import { Lock } from "@phosphor-icons/react";

interface RestrictedActionButtonProps {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
  id?: string;
}

/**
 * Visually disabled action that still surfaces a "sign in" tooltip.
 * Single control only — never nest button-in-button.
 */
export function RestrictedActionButton({
  children,
  className,
  id,
  "aria-label": ariaLabel,
}: RestrictedActionButtonProps) {
  return (
    <TooltipTrigger delay={200} closeDelay={100}>
      <RACButton
        id={id}
        aria-label={ariaLabel}
        aria-disabled="true"
        // Keep out of tab order; tooltip still works via pointer on the trigger.
        excludeFromTabOrder
        className={`pointer-events-none inline-flex cursor-not-allowed items-center gap-2 border-0 bg-transparent p-0 opacity-50 ${className || ""}`}
      >
        <Lock className="h-4 w-4" aria-hidden="true" />
        {children}
      </RACButton>
      <Tooltip
        placement="top"
        offset={4}
        className="z-50 overflow-hidden rounded-md bg-[var(--surface-strong)] px-3 py-1.5 text-xs text-[var(--text-on-strong)] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
      >
        Sign in to unlock
      </Tooltip>
    </TooltipTrigger>
  );
}
