/**
 * Name-mirror: features/shared/api/apiResponse
 */

import { describe, expect, it } from "vitest";
import {
  error,
  rateLimitedError,
  success,
  validationError,
} from "@/features/shared/api/apiResponse";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";

describe("success", () => {
  it("spreads payload under success: true", async () => {
    const res = success({ items: [1], total: 1 }, 201);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ success: true, items: [1], total: 1 });
  });
});

describe("error", () => {
  it("serializes ApiError into the standard envelope", async () => {
    const res = error(
      new ApiError(404, API_ERROR_CODES.RESOURCE_NOT_FOUND, "missing", {
        id: "x",
      }),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toEqual({
      code: "RESOURCE_NOT_FOUND",
      message: "missing",
      details: { id: "x" },
    });
  });

  it("coerces unknown throws to 500 INTERNAL_ERROR", async () => {
    const res = error(new Error("unexpected"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).toBe("unexpected");
  });

  it("attaches rate-limit reset headers when provided", async () => {
    const res = error(ApiError.rateLimited(), { reset: 42 });
    expect(res.headers.get("X-RateLimit-Reset")).toBe("42");
  });
});

describe("rateLimitedError", () => {
  it("returns 429 with RATE_LIMIT_EXCEEDED", async () => {
    const res = rateLimitedError("slow down", 99);
    expect(res.status).toBe(429);
    expect(res.headers.get("X-RateLimit-Reset")).toBe("99");
    const body = await res.json();
    expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(body.error.message).toBe("slow down");
  });
});

describe("validationError", () => {
  it("maps Zod-style issues into details", async () => {
    const res = validationError([
      { path: ["email"], message: "Required" },
      { path: [], message: "root issue" },
    ]);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toEqual({
      issues: [
        { path: "email", message: "Required" },
        { path: "(root)", message: "root issue" },
      ],
    });
  });
});
