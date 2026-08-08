/**
 * features/shared/analytics/types.ts
 *
 * Shared analytics event contract used by BOTH space-planner AND configurator.
 * Both features fire analytics events but must not import from each other.
 * Use these types to ensure consistent event shapes across both products.
 */

/** Identifies which product surface fired the event */
export type AnalyticsProductSurface = "planner" | "configurator" | "crm" | "portal";

/** Broad category buckets for analytics event taxonomy */
export type AnalyticsEventCategory =
  | "canvas_interaction"
  | "session"
  | "navigation"
  | "product_browse"
  | "quote"
  | "export"
  | "auth"
  | "error";

export interface SharedAnalyticsEvent {
  /** e.g. "canvas_element_added", "quote_line_updated", "session_start" */
  name: string;
  surface: AnalyticsProductSurface;
  category: AnalyticsEventCategory;
  properties?: Record<string, string | number | boolean | null>;
  /** ISO timestamp — defaults to now if omitted */
  timestamp?: string;
  /** Supabase user id or "guest" */
  userId?: string;
}

export interface AnalyticsBatch {
  events: SharedAnalyticsEvent[];
  sessionId: string;
  clientTimestamp: string;
}
