/**
 * Name-mirror: features/shared/analytics/index
 */

import { describe, expect, it } from "vitest";
import type {
  AnalyticsBatch,
  SharedAnalyticsEvent,
} from "@/features/shared/analytics/index";

describe("shared analytics index", () => {
  it("re-exports analytics types for cross-product event contracts", async () => {
    const mod = await import("@/features/shared/analytics/index");
    expect(mod).toBeDefined();

    const event: SharedAnalyticsEvent = {
      name: "session_start",
      surface: "planner",
      category: "session",
      userId: "guest",
    };
    const batch: AnalyticsBatch = {
      events: [event],
      sessionId: "sess-1",
      clientTimestamp: "2026-07-14T00:00:00.000Z",
    };
    expect(batch.events[0].surface).toBe("planner");
    expect(batch.sessionId).toBe("sess-1");
  });
});
