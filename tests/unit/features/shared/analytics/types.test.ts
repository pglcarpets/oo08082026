/**
 * Name-mirror: features/shared/analytics/types
 */

import { describe, expect, it } from "vitest";
import type {
  AnalyticsBatch,
  AnalyticsEventCategory,
  AnalyticsProductSurface,
  SharedAnalyticsEvent,
} from "@/features/shared/analytics/types";

describe("shared analytics types", () => {
  it("accepts product surfaces and event categories used across planner and configurator", () => {
    const surfaces: AnalyticsProductSurface[] = [
      "planner",
      "configurator",
      "crm",
      "portal",
    ];
    const categories: AnalyticsEventCategory[] = [
      "canvas_interaction",
      "session",
      "navigation",
      "product_browse",
      "quote",
      "export",
      "auth",
      "error",
    ];
    expect(surfaces).toHaveLength(4);
    expect(categories).toContain("quote");
  });

  it("shapes SharedAnalyticsEvent and AnalyticsBatch contracts", () => {
    const event: SharedAnalyticsEvent = {
      name: "quote_line_updated",
      surface: "crm",
      category: "quote",
      properties: { qty: 2, sku: "WS-1", priced: true, note: null },
      timestamp: "2026-07-14T12:00:00.000Z",
      userId: "user-1",
    };
    const batch: AnalyticsBatch = {
      events: [event],
      sessionId: "s-1",
      clientTimestamp: event.timestamp!,
    };
    expect(batch.events[0].properties?.qty).toBe(2);
    expect(batch.events[0].name).toBe("quote_line_updated");
  });
});
