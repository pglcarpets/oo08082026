"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEventHandler, ReactNode } from "react";
import {
  buildPlannerEntryHref,
  isPlannerEntryHref,
} from "@/lib/analytics/plannerEntry";
import { handlePlannerEntryNavigation, trackSiteCtaClick } from "@/lib/analytics/siteEvents";

interface TrackedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  label: string;
  surface: string;
  productSlug?: string;
  categoryId?: string;
  prefetch?: boolean;
  target?: string;
  rel?: string;
  role?: string;
  onMouseEnter?: MouseEventHandler<HTMLAnchorElement>;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  "aria-label"?: string;
  "data-testid"?: string;
}

function isExternalHref(href: string) {
  return /^(https?:|mailto:|tel:)/i.test(href);
}

export function TrackedLink({
  href,
  children,
  className,
  label,
  surface,
  productSlug,
  categoryId,
  prefetch,
  target,
  rel,
  role,
  onMouseEnter,
  onClick,
  "aria-label": ariaLabel,
  "data-testid": dataTestId,
}: TrackedLinkProps) {
  const pathname = usePathname() || "/";
  const entryContext = {
    sourcePage: pathname,
    productSlug,
    categoryId,
  };
  const isPlanner = isPlannerEntryHref(href);
  // SSR-safe: cookie utm_* only on click path, not in rendered href.
  const resolvedHref = isPlanner
    ? buildPlannerEntryHref(href, entryContext)
    : href;

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (isPlanner) {
      handlePlannerEntryNavigation({
        href: buildPlannerEntryHref(href, entryContext, { includeAttribution: true }),
        label,
        pathname,
        surface,
        productSlug,
        categoryId,
      });
    } else {
      trackSiteCtaClick({
        href,
        label,
        pathname,
        surface,
      });
    }
    onClick?.(event);
  };

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        className={className}
        target={target}
        rel={rel}
        role={role}
        onClick={handleClick}
        onMouseEnter={onMouseEnter}
        aria-label={ariaLabel}
        data-testid={dataTestId}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={resolvedHref}
      className={className}
      prefetch={prefetch}
      role={role}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      aria-label={ariaLabel}
      data-testid={dataTestId}
    >
      {children}
    </Link>
  );
}
