"use client";

import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import type { ReactNode } from "react";

type RouteCtaActionVariant = "primary" | "outline-light";

interface RouteCtaAction {
  href: string;
  label: string;
  variant?: RouteCtaActionVariant;
}

interface RouteCtaBandProps {
  kicker?: string;
  title: ReactNode;
  description: ReactNode;
  actions: RouteCtaAction[];
  className?: string;
}

export function RouteCtaBand({
  kicker,
  title,
  description,
  actions,
  className = "",
}: RouteCtaBandProps) {
  return (
    <div
      data-section="route-cta"
      className={`marketing-cta-band scheme-panel-dark grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10 ${className}`.trim()}
    >
      <div className="max-w-2xl min-w-0">
        {kicker ? <p className="home-kicker text-inverse-muted">{kicker}</p> : null}
        <h2 className="home-heading mt-3 text-inverse">{title}</h2>
        <p className="page-copy text-inverse-body mt-3">{description}</p>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap lg:justify-end">
        {actions.map((action) => (
          <MarketingCtaLink
            key={`${action.href}-${action.label}`}
            href={action.href}
            label={action.label}
            surface="route-cta-band"
            variant={action.variant ?? "outline-light"}
            context="hero"
            className="w-full justify-center sm:w-auto"
          >
            {action.label}
          </MarketingCtaLink>
        ))}
      </div>
    </div>
  );
}
