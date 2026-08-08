"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { trackSitePageView } from "@/lib/analytics/siteEvents";

/** Emits SITE-MEASURE-01 `page_view` on marketing route changes (consent-gated). */
export function SiteConversionTracker() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const lastPath = useRef("");

  useEffect(() => {
    const query = searchParams?.toString() ?? "";
    const path = query ? `${pathname}?${query}` : pathname;
    if (path === lastPath.current) {return;}
    lastPath.current = path;
    trackSitePageView({
      pathname,
      locale: document.documentElement.lang || "en",
      referrer: document.referrer || undefined,
    });
  }, [pathname, searchParams]);

  return null;
}