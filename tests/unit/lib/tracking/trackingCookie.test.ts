/**
 * Name-mirror coverage for lib/tracking/trackingCookie.
 */
import { describe, expect, it } from "vitest";
import {
  TRACKING_ANON_COOKIE,
  TRACKING_ANON_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/tracking/trackingCookie";

describe("trackingCookie", () => {
  it("exports the anonymous tracking cookie name", () => {
    expect(TRACKING_ANON_COOKIE).toBe("oando_anon_id");
  });

  it("sets max-age to one year in seconds", () => {
    expect(TRACKING_ANON_COOKIE_MAX_AGE_SECONDS).toBe(60 * 60 * 24 * 365);
    expect(TRACKING_ANON_COOKIE_MAX_AGE_SECONDS).toBe(31_536_000);
  });
});
