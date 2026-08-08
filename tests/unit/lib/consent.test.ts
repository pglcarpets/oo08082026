import { describe, it, expect, vi, afterEach } from "vitest";
import {
  CONSENT_ACCEPTED,
  CONSENT_COOKIE,
  CONSENT_REJECTED,
  hasAnalyticsConsent,
  hasConsentChoice,
} from "@/lib/consent";

describe("consent", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return false when document is undefined", () => {
    vi.stubGlobal("document", undefined);
    expect(hasConsentChoice()).toBe(false);
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("should return false when consent cookie is not present", () => {
    const mockDocument = {
      cookie: "other_cookie=value; another=123",
    };
    vi.stubGlobal("document", mockDocument);
    expect(hasConsentChoice()).toBe(false);
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("should return true for choice when accepted", () => {
    const mockDocument = {
      cookie: `other_cookie=value; ${CONSENT_COOKIE}=${CONSENT_ACCEPTED}; another=123`,
    };
    vi.stubGlobal("document", mockDocument);
    expect(hasConsentChoice()).toBe(true);
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it("should treat rejected as a choice without analytics consent", () => {
    const mockDocument = {
      cookie: `${CONSENT_COOKIE}=${CONSENT_REJECTED}`,
    };
    vi.stubGlobal("document", mockDocument);
    expect(hasConsentChoice()).toBe(true);
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("should ignore unknown consent cookie values", () => {
    const mockDocument = {
      cookie: `${CONSENT_COOKIE}=maybe`,
    };
    vi.stubGlobal("document", mockDocument);
    expect(hasConsentChoice()).toBe(false);
    expect(hasAnalyticsConsent()).toBe(false);
  });
});
