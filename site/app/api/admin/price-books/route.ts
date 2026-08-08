/**
 * GET /api/admin/price-books — list seeded price books.
 */

import { withAuth } from "@/features/shared/api/withAuth";
import { success } from "@/features/shared/api/apiResponse";
import { listAdminPriceBooks } from "@/features/admin/pricing/priceBookAdmin.server";

export const GET = withAuth(
  async () => success({ books: await listAdminPriceBooks() }),
  { role: "admin", rateLimitScope: "price-books:list", rateLimit: 60 },
);