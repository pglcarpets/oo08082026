import { describe, it, expect } from "vitest";
import { getCustomerSafeAuthError } from "@/lib/auth/customerSafeAuthError";

describe("customerSafeAuthError", () => {
  it("translates invalid credentials error strings or Error objects", () => {
    expect(getCustomerSafeAuthError("invalid credentials")).toBe("Email or password is incorrect.");
    expect(getCustomerSafeAuthError(new Error("Invalid login credentials"))).toBe(
      "Email or password is incorrect.",
    );
    expect(getCustomerSafeAuthError(new Error("invalid email"))).toBe("Email or password is incorrect.");
    expect(getCustomerSafeAuthError("user_invalid_credentials")).toBe("Email or password is incorrect.");
    expect(getCustomerSafeAuthError({ message: "AuthApiError", code: "invalid_credentials" })).toBe(
      "Email or password is incorrect.",
    );
  });

  it("falls back to temporary auth error for other messages", () => {
    expect(getCustomerSafeAuthError("network error")).toBe(
      "Sign-in is temporarily unavailable. Please try again or contact support."
    );
    expect(getCustomerSafeAuthError(null)).toBe(
      "Sign-in is temporarily unavailable. Please try again or contact support."
    );
  });
});
