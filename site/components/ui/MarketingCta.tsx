"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type MarketingCtaVariant = "primary" | "outline" | "outline-light";

const VARIANT_CLASS: Record<MarketingCtaVariant, string> = {
  primary: "btn-primary",
  outline: "btn-outline",
  "outline-light": "btn-outline-light",
};

type MarketingCtaProps = {
  readonly variant?: MarketingCtaVariant;
  readonly className?: string;
  readonly children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Marketing CTA button — FOCSS btn-* utilities (site design; no shadcn).
 */
export function MarketingCta({
  variant = "primary",
  className,
  children,
  type = "button",
  ...props
}: MarketingCtaProps) {
  return (
    <button
      type={type}
      className={cn("inline-flex min-h-11", VARIANT_CLASS[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
