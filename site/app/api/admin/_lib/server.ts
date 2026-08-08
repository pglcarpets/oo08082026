import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { resolveAuthContext } from "@/features/shared/api/withAuth";
import { ApiError } from "@/features/shared/api/ApiError";
import { getClientIp } from "@/platform/supabase/adminServer";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { CSRF_REJECTION_HEADER_NAME } from "@/lib/security/csrfConstants";


export async function enforceAdminRateLimit(
  req: NextRequest,
  scope: string,
  limit = 30,
  windowMs = 60 * 1000,
): Promise<NextResponse | null> {
  const ip = getClientIp(req);
  const limitRes = await rateLimit(`admin:${scope}:${ip}`, limit, windowMs);

  if (limitRes.success) {return null;}

  return NextResponse.json(
    { error: "Too many requests." },
    {
      status: 429,
      headers: { "X-RateLimit-Reset": limitRes.reset.toString() },
    },
  );
}

export async function requireAdminSession(): Promise<NextResponse | null> {
  try {
    await resolveAuthContext("admin");
    return null;
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export type AdminMutationGuardResult =
  | { readonly ok: true; readonly actorId: string }
  | { readonly ok: false; readonly response: NextResponse };

export async function enforceAdminMutationGuard(
  req: NextRequest,
  scope: string,
  limit = 30,
): Promise<AdminMutationGuardResult> {
  const rateError = await enforceAdminRateLimit(req, scope, limit);
  if (rateError) return { ok: false, response: rateError };
  try {
    const auth = await resolveAuthContext("admin");
    if (!(await validateCsrfRequest(req))) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: { code: "csrf_failed", message: "Invalid or missing CSRF token" } },
          { status: 403, headers: { [CSRF_REJECTION_HEADER_NAME]: "1" } },
        ),
      };
    }
    return { ok: true, actorId: auth.user?.id ?? "admin" };
  } catch (err) {
    if (err instanceof ApiError) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: { code: err.code, message: err.message } },
          { status: err.status },
        ),
      };
    }
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: "unauthorized", message: "Unauthorized" } },
        { status: 401 },
      ),
    };
  }
}

export const ensureCsrfAdminMutationGuard = enforceAdminMutationGuard;
