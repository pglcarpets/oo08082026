/**
 * ApiError — standardized error class for API route handlers.
 *
 * Every API error carries an HTTP `status`, a stable machine-readable `code`,
 * and a human-readable `message`. Optional `details` can carry field-level
 * validation context. thrown from inside a route handler (or `withAuth`),
 * these are caught by {@link error} / `withAuth` and serialized into the
 * standard response envelope `{ success: false, error: { code, message, details? } }`.
 */

/** Stable, machine-readable error codes mapped to HTTP statuses. */
export const API_ERROR_CODES = {
  // 400 Bad Request
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // 401 Unauthorized
  AUTH_REQUIRED: "AUTH_REQUIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",

  // 403 Forbidden
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  /** Double-submit CSRF failed on a mutating request. */
  CSRF_FAILED: "CSRF_FAILED",

  // 404 Not Found
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",

  // 405 Method Not Allowed
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",

  // 409 Conflict
  RESOURCE_EXISTS: "RESOURCE_EXISTS",

  // 429 Too Many Requests
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // 500 Internal Server Error
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

/** Map error codes to default HTTP status codes. */
export const DEFAULT_STATUS_FOR_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  INVALID_INPUT: 400,
  MISSING_REQUIRED_FIELD: 400,
  AUTH_REQUIRED: 401,
  INVALID_CREDENTIALS: 401,
  INSUFFICIENT_PERMISSIONS: 403,
  CSRF_FAILED: 403,
  RESOURCE_NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  RESOURCE_EXISTS: 409,
  RATE_LIMIT_EXCEEDED: 429,
  INTERNAL_ERROR: 500,
  DATABASE_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Standardized API error. Throw from any route handler (or inside `withAuth`)
 * to produce a consistent error envelope. The class extends `Error` so it
 * propagates naturally through `try/catch` and remains instanceof-checkable.
 */
export class ApiError extends Error {
  /** HTTP status code (e.g. 400, 401, 404). */
  readonly status: number;
  /** Stable machine-readable error code (see {@link API_ERROR_CODES}). */
  readonly code: ApiErrorCode;
  /** Optional field-level or contextual details. */
  readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    if (details) {this.details = details;}
    // Restore prototype chain for cross-realm instanceof checks.
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** Convenience factory: build an ApiError from a code, deriving status. */
  static fromCode(
    code: ApiErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ): ApiError {
    const status = DEFAULT_STATUS_FOR_CODE[code] ?? 500;
    return new ApiError(status, code, message, details);
  }

  /** Build a 400 validation error from a list of Zod-style issues. */
  static validation(
    message: string,
    details?: Record<string, unknown>,
  ): ApiError {
    return new ApiError(400, API_ERROR_CODES.VALIDATION_ERROR, message, details);
  }

  /** Build a 401 auth-required error. */
  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError(401, API_ERROR_CODES.AUTH_REQUIRED, message);
  }

  /** Build a 403 insufficient-permissions error. */
  static forbidden(message = "Insufficient permissions"): ApiError {
    return new ApiError(403, API_ERROR_CODES.INSUFFICIENT_PERMISSIONS, message);
  }

  /** Build a 404 not-found error. */
  static notFound(message = "Resource not found"): ApiError {
    return new ApiError(404, API_ERROR_CODES.RESOURCE_NOT_FOUND, message);
  }

  /** Build a 409 conflict error. */
  static conflict(message = "Resource already exists"): ApiError {
    return new ApiError(409, API_ERROR_CODES.RESOURCE_EXISTS, message);
  }

  /** Build a 429 rate-limit error. */
  static rateLimited(message = "Too many requests"): ApiError {
    return new ApiError(429, API_ERROR_CODES.RATE_LIMIT_EXCEEDED, message);
  }

  /** Build a 500 internal-error error. */
  static internal(message = "Internal server error"): ApiError {
    return new ApiError(500, API_ERROR_CODES.INTERNAL_ERROR, message);
  }
}

/**
 * Coerce any thrown value into an {@link ApiError}. Unknown errors become a
 * 500 INTERNAL_ERROR so handlers can uniformly `throw` and let `withAuth` /
 * `error()` serialize a consistent envelope.
 */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) {return err;}
  if (err instanceof Error) {
    return new ApiError(500, API_ERROR_CODES.INTERNAL_ERROR, err.message);
  }
  return new ApiError(
    500,
    API_ERROR_CODES.INTERNAL_ERROR,
    typeof err === "string" ? err : "Internal server error",
  );
}
