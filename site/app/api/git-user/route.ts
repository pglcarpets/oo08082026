import { NextResponse } from "next/server";
import { readGitUserIdentity } from "../_lib/gitUser";
import { withAuth, type AuthContext } from "@/features/shared/api/withAuth";
import { ApiError } from "@/features/shared/api/ApiError";

/**
 * GET /api/git-user — dev/ops convenience exposing git committer identity.
 * Admin-only (PX-S07 / SEC-2): the identity is internal; anonymous callers
 * must not receive it.
 */
export const GET = withAuth(
  async (_request: Request, auth: AuthContext) => {
    if (!auth.isAdmin) {
      throw ApiError.forbidden("Admin access required");
    }
    const identity = await readGitUserIdentity();
    return NextResponse.json(identity);
  },
  {
    role: "admin",
    rateLimitScope: "git-user:get",
    rateLimit: 30,
  },
);
