import { describe, expect, it } from "vitest";
import { readApiErrorMessage } from "@/features/shared/api/readApiErrorMessage";

describe("readApiErrorMessage", () => {
  it("reads nested API envelope error.message", () => {
    expect(
      readApiErrorMessage({
        success: false,
        error: { code: "MISSING_REQUIRED_FIELD", message: "Name and message are required." },
      }),
    ).toBe("Name and message are required.");
  });

  it("reads legacy string error fields", () => {
    expect(readApiErrorMessage({ error: "Form validation failed" })).toBe(
      "Form validation failed",
    );
  });

  it("falls back for empty or unknown bodies", () => {
    expect(readApiErrorMessage(null)).toBe("Unable to submit right now.");
    expect(readApiErrorMessage({})).toBe("Unable to submit right now.");
    expect(readApiErrorMessage({ error: { code: "X" } }, "custom")).toBe("custom");
  });
});
