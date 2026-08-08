/**
 * Real transport for Site analytics.
 *
 * BROKEN HISTORY: product code called `window.va.track(...)`.
 * Vercel Web Analytics exposes:
 *   - `track(name, props)` from `@vercel/analytics`
 *   - `window.va` as a *function*: va('event', { name, data })
 * Calling `.track` on `va` always fails → silent no-op for every event.
 */

import { track as vercelTrack } from "@vercel/analytics";

export type TransportPayload = Record<string, string | number | boolean | null | undefined>;

export function isAnalyticsTransportReady(): boolean {
  if (typeof window === "undefined") {return false;}
  return typeof window.va === "function" || Array.isArray(window.vaq);
}

/**
 * Send a custom event. Returns true when the call was accepted by the transport
 * (script may still be loading; Vercel queues via vaq when present).
 */
export function sendAnalyticsEvent(
  name: string,
  payload: TransportPayload,
): boolean {
  if (typeof window === "undefined") {return false;}

  try {
    vercelTrack(name, payload);
    // If neither va nor vaq exist yet, script is not mounted — treat as not ready.
    if (!isAnalyticsTransportReady()) {
      return false;
    }
    return true;
  } catch {
    // fall through
  }

  const va = window.va;
  if (typeof va === "function") {
    try {
      va("event", { name, data: payload });
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
