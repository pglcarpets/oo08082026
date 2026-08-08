import { emitSiteEvent, type SiteEventPayload } from "@/lib/analytics/siteEvents";
import { hasAnalyticsConsent, hasConsentChoice } from "@/lib/consent";

export const CONVERSION_EVENTS = {
  PAGE_VIEW: "page_view",
  MEANINGFUL_ENGAGEMENT: "meaningful_engagement",
  PLANNER_ENTRY: "planner_entry",
  PROJECT_START: "project_start",
  FIRST_PLACEMENT: "first_placement",
  BOQ_GENERATED: "boq_generated",
  HANDOFF_INTENT: "handoff_intent",
  HANDOFF_SUCCESS: "handoff_success",
  HANDOFF_FAILURE: "handoff_failure",
} as const;

export type ConversionEventName = (typeof CONVERSION_EVENTS)[keyof typeof CONVERSION_EVENTS];

export interface ConversionEventMap {
  [CONVERSION_EVENTS.PAGE_VIEW]: { pathname: string; locale: string; referrer?: string };
  [CONVERSION_EVENTS.MEANINGFUL_ENGAGEMENT]: {
    pathname: string;
    engagementType: string;
    locale: string;
    scrollDepth?: number;
  };
  [CONVERSION_EVENTS.PLANNER_ENTRY]: { sourcePage: string; campaign?: string; locale: string };
  [CONVERSION_EVENTS.PROJECT_START]: { projectId: string; source: string; locale: string };
  [CONVERSION_EVENTS.FIRST_PLACEMENT]: { projectId: string; productId: string; locale: string };
  [CONVERSION_EVENTS.BOQ_GENERATED]: { productCount: number; source: string; locale: string };
  [CONVERSION_EVENTS.HANDOFF_INTENT]: { projectId: string; channel: string; locale: string };
  [CONVERSION_EVENTS.HANDOFF_SUCCESS]: { projectId: string; channel: string; locale: string };
  [CONVERSION_EVENTS.HANDOFF_FAILURE]: {
    projectId: string;
    channel: string;
    reason: string;
    locale: string;
  };
}

const DEDUPE_TTL_MS = 30_000;

const DEDUPE_EVENTS = new Set<ConversionEventName>([
  CONVERSION_EVENTS.PAGE_VIEW,
  CONVERSION_EVENTS.PLANNER_ENTRY,
  CONVERSION_EVENTS.PROJECT_START,
  CONVERSION_EVENTS.BOQ_GENERATED,
]);

const DEDUPE_KEYS = new Set<string>();
const DEDUPE_TIMESTAMPS = new Map<string, number>();

function dedupeKeyFor(name: ConversionEventName, fields: Record<string, unknown>): string {
  switch (name) {
    case CONVERSION_EVENTS.PAGE_VIEW:
      return String(fields.pathname ?? "");
    case CONVERSION_EVENTS.PLANNER_ENTRY:
      return String(fields.sourcePage ?? "");
    case CONVERSION_EVENTS.PROJECT_START:
      return String(fields.projectId ?? "");
    case CONVERSION_EVENTS.BOQ_GENERATED:
      return `${String(fields.source ?? "")}:${String(fields.productCount ?? "")}`;
    default:
      return "";
  }
}

const PRIVACY_DENYLIST = new Set([
  "geometry",
  "boqLines",
  "boq",
  "secret",
  "token",
  "password",
  "privateKey",
]);

const PERSONAL_FIELDS = new Set(["email", "name"]);

function filterValue(value: unknown, allowPersonalData: boolean): unknown {
  if (Array.isArray(value)) {
    return value
      .map((item) => filterValue(item, allowPersonalData))
      .filter((item) => item !== undefined);
  }

  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (PRIVACY_DENYLIST.has(key)) {continue;}
      if (!allowPersonalData && PERSONAL_FIELDS.has(key)) {continue;}
      const filtered = filterValue(child, allowPersonalData);
      if (filtered === undefined) {continue;}
      out[key] = filtered;
    }
    return out;
  }

  return value;
}

export function clearConversionDedupe(): void {
  DEDUPE_KEYS.clear();
  DEDUPE_TIMESTAMPS.clear();
}

export function filterEventPrivacy<T extends Record<string, unknown>>(
  payload: T,
  options?: { allowPersonalData?: boolean },
): T {
  const allowPersonalData = options?.allowPersonalData ?? false;
  return filterValue(payload, allowPersonalData) as T;
}

/**
 * Site funnel events emit via consent-gated `emitSiteEvent`.
 *
 * Planner call sites (as of commercial handoff work):
 * - BOQ_GENERATED from Review export / quote cart
 * - HANDOFF_INTENT / HANDOFF_SUCCESS / HANDOFF_FAILURE from Send to Oando
 * Still OPEN for browser proof: PROJECT_START, FIRST_PLACEMENT.
 */
export function trackConversionEvent<K extends ConversionEventName>(
  name: K,
  fields: ConversionEventMap[K],
): void {
  if (typeof window === "undefined") {return;}

  const filtered = filterEventPrivacy(fields as unknown as Record<string, unknown>);

  // No emit before accept. Queue only while choice is still open so first-page
  // PAGE_VIEW / PLANNER_ENTRY survive Accept (SiteConversionTracker does not re-fire).
  // Do not burn dedupe TTL pre-consent.
  if (!hasAnalyticsConsent()) {
    if (!hasConsentChoice()) {
      emitSiteEvent(name, filtered as SiteEventPayload);
    }
    return;
  }

  if (DEDUPE_EVENTS.has(name)) {
    const key = `${name}:${dedupeKeyFor(name, fields as unknown as Record<string, unknown>)}`;
    const now = Date.now();
    const last = DEDUPE_TIMESTAMPS.get(key);
    if (last !== undefined && now - last < DEDUPE_TTL_MS) {
      DEDUPE_KEYS.add(key);
      return;
    }
    DEDUPE_TIMESTAMPS.set(key, now);
    DEDUPE_KEYS.add(key);
  }

  emitSiteEvent(name, filtered as SiteEventPayload);
}

export const SITE_EVENT_CONTRACT = {
  funnelOrder: [
    CONVERSION_EVENTS.PAGE_VIEW,
    CONVERSION_EVENTS.MEANINGFUL_ENGAGEMENT,
    CONVERSION_EVENTS.PLANNER_ENTRY,
    CONVERSION_EVENTS.PROJECT_START,
    CONVERSION_EVENTS.FIRST_PLACEMENT,
    CONVERSION_EVENTS.BOQ_GENERATED,
    CONVERSION_EVENTS.HANDOFF_INTENT,
    CONVERSION_EVENTS.HANDOFF_SUCCESS,
    CONVERSION_EVENTS.HANDOFF_FAILURE,
  ],
  events: {
    [CONVERSION_EVENTS.PAGE_VIEW]: {
      trigger: "Visitor loads a site page (route change).",
      requiredFields: ["pathname", "locale"],
      owner: "Site",
    },
    [CONVERSION_EVENTS.MEANINGFUL_ENGAGEMENT]: {
      trigger: "Visitor reaches a defined engagement threshold (scroll/depth/interaction).",
      requiredFields: ["pathname", "engagementType", "locale"],
      owner: "Site",
    },
    [CONVERSION_EVENTS.PLANNER_ENTRY]: {
      trigger: "Visitor clicks a launch/entry CTA into the Planner.",
      requiredFields: ["sourcePage", "locale"],
      owner: "Site",
    },
    [CONVERSION_EVENTS.PROJECT_START]: {
      trigger: "Planner creates a new project from a Site entry.",
      requiredFields: ["projectId", "source", "locale"],
      owner: "Planner",
    },
    [CONVERSION_EVENTS.FIRST_PLACEMENT]: {
      trigger: "First furniture placement committed inside a project.",
      requiredFields: ["projectId", "productId", "locale"],
      owner: "Planner",
    },
    [CONVERSION_EVENTS.BOQ_GENERATED]: {
      trigger: "Bill of quantities generated for a project.",
      requiredFields: ["productCount", "source", "locale"],
      owner: "Planner",
    },
    [CONVERSION_EVENTS.HANDOFF_INTENT]: {
      trigger: "User initiates handoff of BOQ to Oando.",
      requiredFields: ["projectId", "channel", "locale"],
      owner: "Planner",
    },
    [CONVERSION_EVENTS.HANDOFF_SUCCESS]: {
      trigger: "Handoff of BOQ to Oando succeeds.",
      requiredFields: ["projectId", "channel", "locale"],
      owner: "Planner",
    },
    [CONVERSION_EVENTS.HANDOFF_FAILURE]: {
      trigger: "Handoff of BOQ to Oando fails.",
      requiredFields: ["projectId", "channel", "reason", "locale"],
      owner: "Planner",
    },
  },
} as const;
