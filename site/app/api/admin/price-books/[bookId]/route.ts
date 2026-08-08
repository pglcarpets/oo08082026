/**
 * GET /api/admin/price-books/[bookId]
 */

import { withAuth } from "@/features/shared/api/withAuth";
import { success } from "@/features/shared/api/apiResponse";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";
import { readAdminPriceBook } from "@/features/admin/pricing/priceBookAdmin.server";

type RouteContext = { params: Promise<{ bookId: string }> };

export const GET = withAuth<RouteContext>(
  async (_req, _auth, context) => {
    const { bookId } = await context.params;
    const payload = await readAdminPriceBook(bookId);
    if (!payload?.contract) {
      throw new ApiError(404, API_ERROR_CODES.RESOURCE_NOT_FOUND, `Price book "${bookId}" not found`);
    }
    return success(payload);
  },
  { role: "admin", rateLimitScope: "price-books:get", rateLimit: 60 },
);