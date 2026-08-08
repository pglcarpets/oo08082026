/**
 * Name-mirror coverage for lib/security/csrfConstants.
 */
import { describe, expect, it } from "vitest";
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from "@/lib/security/csrfConstants";

describe("csrfConstants", () => {
  it("exports double-submit cookie and header names", () => {
    expect(CSRF_COOKIE_NAME).toBe("csrf-token");
    expect(CSRF_HEADER_NAME).toBe("x-csrf-token");
  });

  it("uses lowercase header name suitable for Request headers", () => {
    expect(CSRF_HEADER_NAME).toBe(CSRF_HEADER_NAME.toLowerCase());
    expect(CSRF_HEADER_NAME.startsWith("x-")).toBe(true);
  });
});
