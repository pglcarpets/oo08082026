import { describe, expect, it } from "vitest";
import {
  humanizeAuthError,
  isSuspendedAuthError,
} from "@/features/shared/auth/lib/humanizeAuthError";

describe("isSuspendedAuthError", () => {
  it("detects banned-user messages from Supabase", () => {
    expect(isSuspendedAuthError({ message: "User is banned" })).toBe(true);
    expect(isSuspendedAuthError({ message: "user_banned" })).toBe(true);
    expect(isSuspendedAuthError({ message: "User is banned until 2099-01-01" })).toBe(
      true,
    );
  });

  it("returns false for unrelated errors", () => {
    expect(isSuspendedAuthError({ message: "Invalid login credentials" })).toBe(
      false,
    );
    expect(isSuspendedAuthError("network down")).toBe(false);
    expect(isSuspendedAuthError(null)).toBe(false);
  });
});

describe("humanizeAuthError", () => {
  it("returns a fallback when the error is empty", () => {
    expect(humanizeAuthError(null)).toBe(
      "Something went wrong. Please try again.",
    );
    expect(humanizeAuthError({ message: "" })).toBe(
      "Something went wrong. Please try again.",
    );
    expect(humanizeAuthError({ message: "   " })).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("rewrites network failures into actionable copy", () => {
    expect(humanizeAuthError({ message: "Failed to fetch" })).toBe(
      "Can't reach the server. Check your connection and try again.",
    );
    expect(humanizeAuthError({ message: "NetworkError when attempting fetch" })).toBe(
      "Can't reach the server. Check your connection and try again.",
    );
    expect(humanizeAuthError({ message: "Network request failed" })).toBe(
      "Can't reach the server. Check your connection and try again.",
    );
    expect(humanizeAuthError({ message: "Load failed" })).toBe(
      "Can't reach the server. Check your connection and try again.",
    );
  });

  it("stringifies primitive errors without a message field", () => {
    expect(humanizeAuthError(42)).toBe("42");
    expect(humanizeAuthError({ notMessage: "hidden" })).toBe("[object Object]");
  });

  it("passes through known-good Supabase messages", () => {
    expect(humanizeAuthError({ message: "Invalid login credentials" })).toBe(
      "Invalid login credentials",
    );
    expect(humanizeAuthError("Email not confirmed")).toBe("Email not confirmed");
  });
});