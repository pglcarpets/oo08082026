import type { RateLimitResult } from "@/lib/rateLimit";

/** Complete {@link RateLimitResult} for mocks (partial `{ success, reset }` fails TS2345). */
export function rateLimitResult(
  partial: Pick<RateLimitResult, "success" | "reset"> &
    Partial<Pick<RateLimitResult, "limit" | "remaining">>,
): RateLimitResult {
  return {
    success: partial.success,
    reset: partial.reset,
    limit: partial.limit ?? 100,
    remaining: partial.remaining ?? (partial.success ? 99 : 0),
  };
}
