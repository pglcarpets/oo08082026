import { describe, expect, it } from "vitest";
import { unwrapActionResult } from "@/lib/unwrapActionResult";

describe("unwrapActionResult", () => {
  it("returns data on success", () => {
    expect(unwrapActionResult({ data: { ok: true } })).toEqual({ ok: true });
  });

  it("throws serverError message", () => {
    expect(() =>
      unwrapActionResult({ serverError: "Catalog storage is not configured" }),
    ).toThrow("Catalog storage is not configured");
  });

  it("throws on validationErrors", () => {
    expect(() =>
      unwrapActionResult({ validationErrors: { name: ["Required"] } }),
    ).toThrow("Invalid request data");
  });

  it("throws missing-data message when data is undefined", () => {
    expect(() => unwrapActionResult({}, "Failed to save")).toThrow(
      "Failed to save",
    );
  });

  it("uses default missing-data message when none is provided", () => {
    expect(() => unwrapActionResult({})).toThrow("Operation failed");
    expect(() => unwrapActionResult(null)).toThrow("Operation failed");
  });

  it("throws when result is nullish", () => {
    expect(() => unwrapActionResult(null, "Failed")).toThrow("Failed");
    expect(() => unwrapActionResult(undefined, "Failed")).toThrow("Failed");
  });

  it("prefers serverError over validationErrors and missing data", () => {
    expect(() =>
      unwrapActionResult({
        serverError: "Boom",
        validationErrors: { x: ["y"] },
        data: undefined,
      }),
    ).toThrow("Boom");
  });
});
