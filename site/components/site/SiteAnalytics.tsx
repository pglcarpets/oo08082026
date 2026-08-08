"use client";

/**
 * Mounts Vercel Web Analytics and Speed Insights.
 * Transport (`emitTransport.ts`) calls `vercelTrack()` from the package — not `window.va.track`.
 * Without this component, `window.va` is absent and `isAnalyticsTransportReady()` returns false.
 *
 * Automatic pageviews/vitals are consent-gated via `beforeSend`. Custom Site events
 * are separately gated in `emitSiteEvent` / the event queue (`hasAnalyticsConsent`).
 */
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { hasAnalyticsConsent } from "@/lib/consent";

export function SiteAnalytics() {
  return (
    <>
      <Analytics
        beforeSend={(event) => {
          if (!hasAnalyticsConsent()) {return null;}
          return event;
        }}
      />
      <SpeedInsights
        beforeSend={(event) => {
          if (!hasAnalyticsConsent()) {return null;}
          return event;
        }}
      />
    </>
  );
}
