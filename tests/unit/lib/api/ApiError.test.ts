import { describe, it, expect } from "vitest";
import { ApiError, toApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";

describe("ApiError", () => {
  it("creates ApiError instances correctly", () => {
    const error = new ApiError(400, "VALIDATION_ERROR", "Invalid input");
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Invalid input");
  });

  it("builds correct helper static factory errors", () => {
    const notFound = ApiError.notFound("User not found");
    expect(notFound.status).toBe(404);
    expect(notFound.code).toBe(API_ERROR_CODES.RESOURCE_NOT_FOUND);

    const unauthorized = ApiError.unauthorized();
    expect(unauthorized.status).toBe(401);

    const forbidden = ApiError.forbidden();
    expect(forbidden.status).toBe(403);
  });

  it("coerces values correctly using toApiError", () => {
    const standardError = new Error("General error");
    const apiError = toApiError(standardError);
    expect(apiError.status).toBe(500);
    expect(apiError.message).toBe("General error");

    const directApiError = toApiError(new ApiError(404, "RESOURCE_NOT_FOUND", "No product"));
    expect(directApiError.status).toBe(404);
  });
});
