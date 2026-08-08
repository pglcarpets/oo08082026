/**
 * Name-mirror: features/shared/api/ApiError
 */

import { describe, expect, it } from "vitest";
import {
  API_ERROR_CODES,
  ApiError,
  DEFAULT_STATUS_FOR_CODE,
  toApiError,
} from "@/features/shared/api/ApiError";

describe("API_ERROR_CODES and DEFAULT_STATUS_FOR_CODE", () => {
  it("maps every code to a known HTTP status", () => {
    for (const code of Object.values(API_ERROR_CODES)) {
      expect(DEFAULT_STATUS_FOR_CODE[code]).toBeGreaterThanOrEqual(400);
      expect(DEFAULT_STATUS_FOR_CODE[code]).toBeLessThan(600);
    }
    expect(DEFAULT_STATUS_FOR_CODE.AUTH_REQUIRED).toBe(401);
    expect(DEFAULT_STATUS_FOR_CODE.INSUFFICIENT_PERMISSIONS).toBe(403);
    expect(DEFAULT_STATUS_FOR_CODE.RESOURCE_NOT_FOUND).toBe(404);
    expect(DEFAULT_STATUS_FOR_CODE.RATE_LIMIT_EXCEEDED).toBe(429);
  });
});

describe("ApiError", () => {
  it("constructs with status, code, message, and optional details", () => {
    const err = new ApiError(400, API_ERROR_CODES.INVALID_INPUT, "bad field", {
      field: "email",
    });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe("ApiError");
    expect(err.status).toBe(400);
    expect(err.code).toBe("INVALID_INPUT");
    expect(err.message).toBe("bad field");
    expect(err.details).toEqual({ field: "email" });
  });

  it("builds from codes and convenience factories", () => {
    expect(ApiError.fromCode("RESOURCE_NOT_FOUND", "missing").status).toBe(404);
    expect(ApiError.validation("invalid").code).toBe("VALIDATION_ERROR");
    expect(ApiError.unauthorized().status).toBe(401);
    expect(ApiError.forbidden("nope").message).toBe("nope");
    expect(ApiError.notFound().code).toBe("RESOURCE_NOT_FOUND");
    expect(ApiError.conflict().status).toBe(409);
    expect(ApiError.rateLimited().status).toBe(429);
    expect(ApiError.internal().status).toBe(500);
  });
});

describe("toApiError", () => {
  it("passes through ApiError instances", () => {
    const original = ApiError.notFound("gone");
    expect(toApiError(original)).toBe(original);
  });

  it("wraps Error and unknown values as INTERNAL_ERROR", () => {
    const fromError = toApiError(new Error("boom"));
    expect(fromError.status).toBe(500);
    expect(fromError.code).toBe("INTERNAL_ERROR");
    expect(fromError.message).toBe("boom");

    const fromString = toApiError("plain");
    expect(fromString.message).toBe("plain");

    const fromUnknown = toApiError({ weird: true });
    expect(fromUnknown.message).toBe("Internal server error");
  });
});
