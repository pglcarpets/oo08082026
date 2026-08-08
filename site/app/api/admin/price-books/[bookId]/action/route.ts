/**
 * POST /api/admin/price-books/[bookId]/action — approve | activate | rollback
 * Body: { action, versionId, role?, reason? }
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { withAuth } from "@/features/shared/api/withAuth";
import { success } from "@/features/shared/api/apiResponse";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";
import {
  readAdminPriceBookAudit,
  runPriceBookAction,
} from "@/features/admin/pricing/priceBookAdmin.server";
import type { PriceBookRole } from "@/features/admin/pricing/priceBookService";
import { DEV_BYPASS_USER } from "@/lib/auth/devAuthBypass";

type RouteContext = { params: Promise<{ bookId: string }> };

function parseRole(value: unknown): PriceBookRole {
  if (value === "author" || value === "approver" || value === "viewer") {return value;}
  return "approver";
}

async function handleAction(
  req: NextRequest,
  bookId: string,
  actorId: string,
) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, API_ERROR_CODES.INVALID_INPUT, "Invalid JSON body");
  }
  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const action = record.action;
  const versionId = record.versionId;
  if (action !== "approve" && action !== "activate" && action !== "rollback") {
    throw new ApiError(
      400,
      API_ERROR_CODES.INVALID_INPUT,
      "action must be approve, activate, or rollback",
    );
  }
  if (typeof versionId !== "string" || versionId.trim() === "") {
    throw new ApiError(
      400,
      API_ERROR_CODES.INVALID_INPUT,
      "versionId is required",
    );
  }
  const reason =
    typeof record.reason === "string" ? record.reason : "";

  const result = await runPriceBookAction(
    bookId,
    action,
    versionId.trim(),
    parseRole(record.role),
    { actorId, reason },
  );
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 422 },
    );
  }
  const history = await readAdminPriceBookAudit(bookId, 20);
  return success({
    contract: result.contract,
    history,
    previousActiveVersionId: result.previousActiveVersionId,
    newActiveVersionId: result.newActiveVersionId,
  });
}

export const POST = withAuth<RouteContext>(
  async (req, auth, context) => {
    const { bookId } = await context.params;
    const actorId = auth.user?.id ?? DEV_BYPASS_USER.id;
    return handleAction(req, bookId, actorId);
  },
  {
    role: "admin",
    rateLimitScope: "price-books:action",
    rateLimit: 20,
    requireCsrf: true,
  },
);
