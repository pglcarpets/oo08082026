/**
 * Unwrap a next-safe-action executeAsync / direct action result.
 * Throws Error for serverError / validationErrors / missing data so UI catch
 * blocks stay uniform with REST client throw style.
 */

export type SafeActionLikeResult<T> = {
  data?: T;
  serverError?: string;
  validationErrors?: unknown;
};

export function unwrapActionResult<T>(
  result: SafeActionLikeResult<T> | undefined | null,
  missingDataMessage = "Operation failed",
): T {
  if (!result) {
    throw new Error(missingDataMessage);
  }
  if (result.serverError) {
    throw new Error(result.serverError);
  }
  if (result.validationErrors) {
    throw new Error("Invalid request data");
  }
  if (result.data === undefined) {
    throw new Error(missingDataMessage);
  }
  return result.data;
}
