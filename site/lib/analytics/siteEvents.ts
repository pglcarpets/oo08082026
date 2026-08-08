type SiteEventPrimitive = string | number | boolean | null;
export type SiteEventPayload = Record<string, SiteEventPrimitive>;

import {
  trackConversionEvent,
  CONVERSION_EVENTS,
} from "@/lib/analytics/conversionContract";
import { hasAnalyticsConsent, hasConsentChoice } from "@/lib/consent";
import {
  buildPlannerEntryCampaign,
  isPlannerEntryHref,
  type PlannerEntryContext,
} from "@/lib/analytics/plannerEntry";
import {
  enqueueSiteEvent,
  flushSiteEventQueue,
} from "@/lib/analytics/eventQueue";
import { sendAnalyticsEvent } from "@/lib/analytics/emitTransport";

export function emitSiteEvent(eventName: string, payload: SiteEventPayload) {
  if (typeof window === "undefined") {return;}
  if (!hasAnalyticsConsent()) {
    // Queue only while consent is undecided. Reject → drop (no analytics).
    // Queue until accept so first-page CTA/page_view are not lost forever.
    if (!hasConsentChoice()) {
      enqueueSiteEvent(eventName, payload);
    }
    return;
  }
  const ok = sendAnalyticsEvent(eventName, payload);
  if (!ok) {
    enqueueSiteEvent(eventName, payload);
  }
}

/** Call after consent accept so queued page_view / CTA events flush. */
export function flushAnalyticsAfterConsent(): void {
  if (typeof window === "undefined") {return;}
  if (!hasAnalyticsConsent()) {return;}
  flushSiteEventQueue();
}

function normalizeHref(href: string): string {
  return href.trim().toLowerCase();
}

function isWhatsAppHref(href: string): boolean {
  const value = normalizeHref(href);
  return value.includes("wa.me") || value.includes("whatsapp");
}

export function trackSitePageView(params: {
  pathname: string;
  locale: string;
  referrer?: string;
}) {
  trackConversionEvent(CONVERSION_EVENTS.PAGE_VIEW, params);
}

export function trackSiteCtaClick(params: {
  href: string;
  label: string;
  pathname: string;
  surface: string;
}) {
  const href = normalizeHref(params.href);
  let eventName = "site_cta_clicked";

  if (href.startsWith("/downloads") || href.startsWith("/brochure") || href.startsWith("/catalog")) {
    eventName = "resource_desk_clicked";
  } else if (href.startsWith("/planning")) {
    eventName = "planning_cta_clicked";
  } else if (href.startsWith("/contact")) {
    eventName = "contact_cta_clicked";
  } else if (href.startsWith("/compare")) {
    eventName = "compare_cta_clicked";
  } else if (href.startsWith("mailto:")) {
    eventName = "email_contact_clicked";
  } else if (href.startsWith("tel:")) {
    eventName = "phone_contact_clicked";
  } else if (isWhatsAppHref(href)) {
    eventName = "whatsapp_contact_clicked";
  }

  emitSiteEvent(eventName, {
    href: params.href,
    label: params.label,
    pathname: params.pathname,
    surface: params.surface,
  });
}

export function trackPlannerLaunchClicked(params: PlannerEntryContext) {
  emitSiteEvent("planner_launch_clicked", {
    pathname: params.sourcePage,
    surface: params.surface,
    productSlug: params.productSlug ?? null,
    categoryId: params.categoryId ?? null,
  });
  trackConversionEvent(CONVERSION_EVENTS.PLANNER_ENTRY, {
    sourcePage: params.sourcePage,
    locale: "en",
    campaign: buildPlannerEntryCampaign(params),
  });
}

export function handlePlannerEntryNavigation(params: {
  href: string;
  pathname: string;
  surface: string;
  label: string;
  productSlug?: string;
  categoryId?: string;
}) {
  if (!isPlannerEntryHref(params.href)) {
    trackSiteCtaClick({
      href: params.href,
      label: params.label,
      pathname: params.pathname,
      surface: params.surface,
    });
    return;
  }

  trackPlannerLaunchClicked({
    sourcePage: params.pathname,
    surface: params.surface,
    productSlug: params.productSlug,
    categoryId: params.categoryId,
  });
}

export function trackSiteSearchSubmitted(params: {
  pathname: string;
  surface: "header" | "mobile";
  queryLength: number;
  destination: string;
}) {
  emitSiteEvent("site_search_submitted", params);
}

export function trackCompareToggled(params: {
  pathname: string;
  surface: string;
  categoryId: string;
  productId: string;
  nextState: "added" | "removed";
}) {
  emitSiteEvent("compare_toggled", params);
}

export function trackQuoteCartAdded(params: {
  pathname: string;
  surface: string;
  productId: string;
}) {
  emitSiteEvent("quote_cart_added", params);
}

export function trackContactSubmission(params: {
  pathname: string;
  surface: string;
  source: string;
  status: "success" | "error";
}) {
  emitSiteEvent("contact_submission", params);
}

/** @internal test-only aliases */
export const _trackCompareToggled = trackCompareToggled;
export const _trackQuoteCartAdded = trackQuoteCartAdded;
export const _trackContactSubmission = trackContactSubmission;