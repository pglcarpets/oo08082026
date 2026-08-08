import type { StatsSource } from "@/lib/types/businessStats";
import { hasAnalyticsConsent, hasConsentChoice } from "@/lib/consent";
import { sendAnalyticsEvent } from "@/lib/analytics/emitTransport";
import { enqueueSiteEvent } from "@/lib/analytics/eventQueue";

export type KpiEventSource = StatsSource;

type KpiPayload = Record<string, string | number | boolean | null>;

function emitEvent(eventName: string, payload: KpiPayload) {
  if (typeof window === "undefined") {return;}
  if (!hasAnalyticsConsent()) {
    if (!hasConsentChoice()) {
      enqueueSiteEvent(eventName, payload);
    }
    return;
  }
  if (!sendAnalyticsEvent(eventName, payload)) {
    enqueueSiteEvent(eventName, payload);
  }
}

export function trackKpiRendered(params: { asOfDate: string; source: KpiEventSource }) {
  emitEvent("kpi_rendered", params);
}

export function trackKpiFallbackUsed(params: { source: Exclude<KpiEventSource, "supabase"> }) {
  emitEvent("kpi_fallback_used", params);
}

export function trackKpiMismatchDetected(params: { page: string; field: string; expected: number; actual: number }) {
  emitEvent("kpi_mismatch_detected", params);
}

export function compareKpiField(
  page: string,
  field: string,
  rendered: number,
  canonical: number,
) {
  if (rendered !== canonical) {
    trackKpiMismatchDetected({
      page,
      field,
      expected: canonical,
      actual: rendered,
    });
  }
}
