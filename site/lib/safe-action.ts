import { createSafeActionClient } from "next-safe-action";

/**
 * Shared next-safe-action client for site mutations.
 * Admin auth + rate-limit live in `features/admin/api/adminActionGuards`
 * (requireAdminAction / assertActionRateLimit) until action middleware is unified.
 */
export const actionClient = createSafeActionClient({
  handleServerError(error) {
    console.error("[safe-action]", error);
    return error instanceof Error
      ? error.message
      : "Something went wrong while executing the operation.";
  },
});
