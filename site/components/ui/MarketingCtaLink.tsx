"use client";

import type { ComponentProps, ReactNode } from "react";

import { TrackedLink } from "@/components/ui/TrackedLink";
import { cn } from "@/lib/utils";

type MarketingCtaLinkVariant = "primary" | "outline" | "outline-light";
type MarketingCtaLinkContext = "default" | "hero";

const VARIANT_CLASS: Record<MarketingCtaLinkVariant, string> = {
  primary: "btn-primary",
  outline: "btn-outline",
  "outline-light": "btn-outline-light",
};

/** Modifier classes for dark hero / accent bands — pairs with btn-primary + btn-outline-light. */
export const MARKETING_CTA_HERO_CLASS: Record<"primary" | "secondary", string> = {
  primary: "btn-hero-primary shadow-theme-panel",
  secondary: "btn-hero-secondary shadow-theme-panel",
};

const HERO_CONTEXT_CLASS: Partial<Record<MarketingCtaLinkVariant, string>> = {
  primary: MARKETING_CTA_HERO_CLASS.primary,
  "outline-light": MARKETING_CTA_HERO_CLASS.secondary,
};

type MarketingCtaLinkProps = {
  readonly variant?: MarketingCtaLinkVariant;
  readonly context?: MarketingCtaLinkContext;
  readonly className?: string;
  readonly children: ReactNode;
  readonly href: string;
  readonly label: string;
  readonly surface: string;
} & Omit<ComponentProps<typeof TrackedLink>, "className" | "children">;

/**
 * Tracked marketing link — FOCSS btn-* utilities (site design; no shadcn).
 */
export function MarketingCtaLink({
  variant = "primary",
  context = "default",
  className,
  children,
  href,
  label,
  surface,
  ...props
}: MarketingCtaLinkProps) {
  return (
    <TrackedLink
      href={href}
      label={label}
      surface={surface}
      className={cn(
        "inline-flex min-h-11",
        VARIANT_CLASS[variant],
        context === "hero" ? HERO_CONTEXT_CLASS[variant] : undefined,
        className,
      )}
      {...props}
    >
      {children}
    </TrackedLink>
  );
}
