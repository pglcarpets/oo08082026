"use client";

import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";
import { clsx } from "clsx";

type Variant = "default" | "primary" | "ghost" | "sm" | "icon";

export type OoButtonProps = AriaButtonProps & {
  variant?: Variant | Variant[];
  className?: string;
  /** Skip `.btn` base — for chips / unit pills styled by parent CSS. */
  plain?: boolean;
};

/** Minimal FOCSS-styled React Aria Button. */
export function OoButton({
  variant = "default",
  className,
  plain = false,
  ...props
}: OoButtonProps) {
  const variants = Array.isArray(variant) ? variant : [variant];
  return (
    <AriaButton
      {...props}
      className={clsx(
        !plain && "btn",
        !plain && variants.includes("primary") && "btn--primary",
        !plain && variants.includes("ghost") && "btn--ghost",
        !plain && variants.includes("sm") && "btn--sm",
        !plain && variants.includes("icon") && "btn--icon",
        className,
      )}
    />
  );
}
