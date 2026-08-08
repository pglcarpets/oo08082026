"use client";

import * as React from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";

import { cn } from "@/lib/utils";

/**
 * FOCSS + React Aria button. No Radix / shadcn.
 * `asChild` merges classes onto a single child (e.g. next/link).
 */

export type ButtonVariant =
  | "default"
  | "primary"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

export type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg";

const variantClass: Record<ButtonVariant, string> = {
  default: "admin-btn admin-btn--primary",
  primary: "admin-btn admin-btn--primary",
  outline: "admin-btn admin-btn--outline",
  secondary: "admin-btn admin-btn--secondary",
  ghost: "admin-btn admin-btn--ghost",
  destructive: "admin-btn admin-btn--destructive",
  link: "admin-btn admin-btn--link",
};

const sizeClass: Record<ButtonSize, string> = {
  default: "admin-btn--md",
  xs: "admin-btn--xs",
  sm: "admin-btn--sm",
  lg: "admin-btn--lg",
  icon: "admin-btn--icon",
  "icon-xs": "admin-btn--icon-xs",
  "icon-sm": "admin-btn--icon-sm",
  "icon-lg": "admin-btn--icon-lg",
};

export type ButtonProps = Omit<AriaButtonProps, "className" | "children"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  /** HTML-style alias — mapped to React Aria `isDisabled` */
  disabled?: boolean;
  /** Native tooltip / advisory title (not on AriaButtonProps). */
  title?: string;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      children,
      type = "button",
      disabled,
      isDisabled,
      ...props
    },
    ref,
  ) {
    const classes = cn(variantClass[variant], sizeClass[size], className);
    const ariaDisabled = isDisabled ?? disabled;

    if (asChild && React.isValidElement<{ className?: string }>(children)) {
      return React.cloneElement(children, {
        className: cn(classes, children.props.className),
        "data-slot": "button",
        "data-variant": variant,
        "data-size": size,
      } as React.HTMLAttributes<HTMLElement>);
    }

    return (
      <AriaButton
        ref={ref}
        type={type}
        isDisabled={ariaDisabled}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={classes}
        {...props}
      >
        {children}
      </AriaButton>
    );
  },
);

export function buttonVariants(opts?: {
  variant?: ButtonVariant | null;
  size?: ButtonSize | null;
  className?: string;
}) {
  return cn(
    variantClass[opts?.variant ?? "default"],
    sizeClass[opts?.size ?? "default"],
    opts?.className,
  );
}
