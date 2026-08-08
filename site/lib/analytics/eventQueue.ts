/**
 * Hold analytics events until consent is accepted AND transport is ready.
 * Never flush without consent.
 */

import {
  isAnalyticsTransportReady,
  sendAnalyticsEvent,
  type TransportPayload,
} from "@/lib/analytics/emitTransport";
import { hasAnalyticsConsent } from "@/lib/consent";

const MAX_QUEUED = 40;

type QueuedEvent = {
  readonly name: string;
  readonly payload: TransportPayload;
  readonly at: number;
};

const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

export function enqueueSiteEvent(name: string, payload: TransportPayload): void {
  if (queue.length >= MAX_QUEUED) {
    queue.shift();
  }
  queue.push({ name, payload, at: Date.now() });
  // Only arm flush loop when consent already exists (e.g. va not ready yet).
  if (hasAnalyticsConsent()) {
    ensureFlushLoop();
  }
}

export function flushSiteEventQueue(): number {
  if (!hasAnalyticsConsent()) {return 0;}
  let sent = 0;
  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) {break;}
    if (Date.now() - next.at > 10 * 60_000) {continue;}
    const ok = sendAnalyticsEvent(next.name, next.payload);
    if (!ok) {
      // Keep event if transport not ready; stop loop.
      if (!isAnalyticsTransportReady()) {
        queue.unshift(next);
        break;
      }
      // Transport ready but send failed — drop to avoid infinite loop
      continue;
    }
    sent += 1;
  }
  if (queue.length === 0 && flushTimer !== null) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  return sent;
}

function ensureFlushLoop(): void {
  if (typeof window === "undefined") {return;}
  if (flushTimer !== null) {return;}
  flushTimer = setInterval(() => {
    if (hasAnalyticsConsent()) {
      flushSiteEventQueue();
    }
  }, 500);
  if (hasAnalyticsConsent()) {
    flushSiteEventQueue();
  }
}

export function _clearSiteEventQueueForTests(): void {
  queue.length = 0;
  if (flushTimer !== null) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

export function _queuedSiteEventCountForTests(): number {
  return queue.length;
}
