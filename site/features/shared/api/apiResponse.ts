/**
 * apiResponse — standardized response envelope helpers for API routes.
 *
 * Standard success shape:
 *   `{ success: true, ...payload }`
 * Standard error shape:
 *   `{ success: false, error: { code, message, details? } }`
 *
 * The `success` helper spreads the payload so existing clients that read
 * top-level fields (e.g. `data.items`, `data.recommendations`) keep working
 * while gaining the `success: true` marker. Routes that previously returned
 * `{ error: "..." }` can migrate clients to read `error.message` (with the
 * legacy string still available via the `error` field on the envelope for
 * backward compatibility).
 */

import { NextResponse } from "next/server";
import {
  ApiError,
  API_ERROR_CODES,
  toApiError,
  type ApiErrorCode,
} from "./ApiError";

/** Standard error payload shape. */
export type ApiErrorPayload = {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

/** Headers to attach to rate-limited responses. */
function rateLimitHeaders(reset?: number): Record<string, string> | undefined {
  if (reset === undefined) {return undefined;}
  return { "X-RateLimit-Reset": reset.toString() };
}

/**
 * Build a success response. The `payload` is spread onto the envelope so
 * existing top-level fields remain accessible, and a `success: true` marker
 * is added.
 *
 * @example
 *   return success({ items, total }); // -> { success: true, items, total }
 */
export function success<T extends Record<string, unknown>>(
  payload: T,
  status = 200,
  init?: ResponseInit,
): NextResponse {
  return NextResponse.json({ success: true, ...payload }, { status, ...init });
}

/**
 * Build an error response from an {@link ApiError} or any thrown value.
 * Unknown errors are coerced to a 500 INTERNAL_ERROR.
 */
export function error(
  err: unknown,
  init?: { reset?: number; headers?: Record<string, string> },
): NextResponse {
  const apiError = toApiError(err);
  const body: { success: false; error: ApiErrorPayload } = {
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
    },
  };
  if (apiError.details) {body.error.details = apiError.details;}

  const headers: Record<string, string> = {};
  const rlHeaders = rateLimitHeaders(init?.reset);
  if (rlHeaders) {Object.assign(headers, rlHeaders);}
  if (init?.headers) {Object.assign(headers, init.headers);}

  return NextResponse.json(body, {
    status: apiError.status,
    headers: Object.keys(headers).length ? headers : undefined,
  });
}

/**
 * Build a rate-limit (429) error response. Convenience wrapper around
 * {@link error} that injects the `X-RateLimit-Reset` header.
 */
export function rateLimitedError(
  message = "Too many requests",
  reset?: number,
): NextResponse {
  const apiError = new ApiError(
    429,
    API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
    message,
  );
  return error(apiError, { reset });
}

/**
 * Convert a Zod error into a 400 validation error response. Accepts the Zod 4
 * `issues` array and maps each issue to `{ path, message }` details.
 */
export function validationError(
  issues: Array<{ path: PropertyKey[]; message: string }>,
  message = "Request validation failed",
): NextResponse {
  const details: Record<string, unknown> = {
    issues: issues.map((issue) => ({
      path: issue.path.map(String).join(".") || "(root)",
      message: issue.message,
    })),
  };
  const apiError = new ApiError(
    400,
    API_ERROR_CODES.VALIDATION_ERROR,
    message,
    details,
  );
  return error(apiError);
}
